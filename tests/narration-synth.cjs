const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const synth=require('../shared/narration-synth');

const RATE=48000;
// A deterministic engine: each caption is 0.5s of silence per word, so durations are predictable.
function stubEngine({calls=[],available=true,detail='stub',speak}={}){
  return {
    label:'stub',
    async check(){return {available,detail};},
    async speak(text,context){
      calls.push(text);
      if(speak)return speak(text,context);
      return Buffer.alloc(Math.round(text.split(/\s+/).length*0.5*context.sampleRate)*2);
    }
  };
}
const run=(scenes,engine,options={})=>synth.synthesizeNarration(scenes,{engine:'stub',engines:{stub:engine},cache:false,...options});
const wavSeconds=wav=>(wav.length-44)/(RATE*2);

(async()=>{
  // The WAV is the sum of its scenes and matches the returned timing.
  {
    const r=await run([{caption:'one two',duration:3},{caption:'three',duration:3}],stubEngine());
    assert.equal(r.ok,true);
    assert.equal(r.wavBuffer.subarray(0,4).toString(),'RIFF');
    assert.equal(r.wavBuffer.subarray(8,12).toString(),'WAVE');
    const total=r.scenes.reduce((n,s)=>n+s.duration,0);
    assert(Math.abs(wavSeconds(r.wavBuffer)-total)<0.001,'audio length equals the sum of scene durations');
    assert(Math.abs(r.totalSeconds-total)<0.001);
    assert.deepEqual(r.changes,[],'speech shorter than the scene leaves timing unchanged');
  }

  // Durations only grow, and each lengthened scene is reported.
  {
    const r=await run([{caption:'a b c d e f g h',duration:2},{caption:'short',duration:5}],stubEngine());
    assert.equal(r.scenes[0].duration,4.4,'8 words = 4.0s of speech + 0.4s padding');
    assert.equal(r.scenes[1].duration,5);
    assert.deepEqual(r.changes,[{index:0,from:2,to:4.4}]);
  }

  // A scene with no caption still takes its time, so later scenes stay in sync.
  {
    const r=await run([{caption:'hi',duration:3},{caption:'',duration:2},{caption:'there',duration:3}],stubEngine());
    assert.equal(r.scenes.length,3);
    assert.equal(r.scenes[1].duration,2);
    assert(Math.abs(wavSeconds(r.wavBuffer)-8)<0.001,'caption-less scene contributes 2s of silence');
  }

  // Pre-flight warnings name scenes that are too fast for their duration.
  {
    const r=await run([{caption:'one two three four five six seven eight nine ten',duration:2}],stubEngine());
    assert.equal(r.warnings.length,1);
    assert.match(r.warnings[0],/Scene 1 has 10 words in 2s/);
  }

  // An unavailable engine fails clearly and never falls back to another engine.
  {
    const calls=[];
    const r=await synth.synthesizeNarration([{caption:'hello',duration:3}],{engine:'system',engines:{system:stubEngine({calls,available:false,detail:'No espeak-ng on PATH.'}),tone:stubEngine({calls})},cache:false});
    assert.equal(r.ok,false);
    assert.match(r.error,/"system" is unavailable: No espeak-ng on PATH\./);
    assert.deepEqual(calls,[],'no engine ran');
    const unknown=await synth.synthesizeNarration([{caption:'hello'}],{engine:'nope'});
    assert.equal(unknown.ok,false);
    assert.match(unknown.error,/Unknown voice engine "nope"/);
  }

  // An engine failure names the scene.
  {
    const r=await run([{caption:'fine',duration:3},{caption:'boom',duration:3}],stubEngine({speak:text=>{if(text==='boom')throw Error('engine exploded');return Buffer.alloc(9600);}}));
    assert.equal(r.ok,false);
    assert.equal(r.error,'Scene 2: engine exploded');
  }

  // Scene audio is cached by engine, voice, rate and caption: editing one caption regenerates one scene.
  {
    synth.clearCache();
    const calls=[],engine=stubEngine({calls}),scenes=[{caption:'alpha beta',duration:3},{caption:'gamma',duration:3}];
    const options={engine:'stub',engines:{stub:engine}};
    const first=await synth.synthesizeNarration(scenes,options);
    assert.equal(first.cached,0);
    assert.equal(calls.length,2);
    const second=await synth.synthesizeNarration(scenes,options);
    assert.equal(second.cached,2);
    assert.equal(calls.length,2,'no engine calls when everything is cached');
    assert.deepEqual(second.wavBuffer,first.wavBuffer,'cached output is identical');
    const edited=await synth.synthesizeNarration([scenes[0],{caption:'delta',duration:3}],options);
    assert.equal(edited.cached,1);
    assert.equal(calls.length,3);
    await synth.synthesizeNarration(scenes,{...options,voice:'en-US-AvaMultilingualNeural'});
    assert.equal(calls.length,5,'a different voice is a different cache entry');
    synth.clearCache();
  }

  // Progress reports the plan and then each scene.
  {
    const events=[];
    await run([{caption:'one',duration:3},{caption:'two',duration:3}],stubEngine(),{onProgress:e=>events.push(e)});
    assert.deepEqual(events.map(e=>e.phase),['start','scene','scene']);
    assert.equal(events[0].engine,'stub');
    assert.deepEqual(events.slice(1).map(e=>e.index),[0,1]);
  }

  // Cancelling stops generation promptly and reports it as cancelled, not as an error in a scene.
  {
    const controller=new AbortController();
    let started;
    const startedPromise=new Promise(resolve=>{started=resolve;});
    const engine=stubEngine({speak:(text,{signal})=>new Promise((resolve,reject)=>{
      started();
      signal.addEventListener('abort',()=>{const e=Error('aborted');e.name='AbortError';reject(e);},{once:true});
    })});
    const pending=run([{caption:'one',duration:3},{caption:'two',duration:3}],engine,{signal:controller.signal});
    await startedPromise;
    controller.abort();
    const r=await pending;
    assert.equal(r.ok,false);
    assert.equal(r.cancelled,true);
    assert.match(r.error,/cancelled/);
    const already=new AbortController();already.abort();
    const early=await run([{caption:'one',duration:3}],stubEngine(),{signal:already.signal});
    assert.equal(early.cancelled,true);
  }

  // Temporary files are removed whether generation succeeds or fails.
  {
    const dirs=new Set();
    const list=()=>fs.readdirSync(os.tmpdir()).filter(n=>n.startsWith('codealive-voice-'));
    const before=new Set(list());
    await run([{caption:'one',duration:3}],stubEngine({speak:(t,{dir})=>{dirs.add(dir);fs.writeFileSync(path.join(dir,'x'),'x');return Buffer.alloc(9600);}}));
    await run([{caption:'one',duration:3}],stubEngine({speak:(t,{dir})=>{dirs.add(dir);throw Error('nope');}}));
    assert.equal(dirs.size,2);
    for(const dir of dirs)assert.equal(fs.existsSync(dir),false,'temp directory removed');
    assert.deepEqual(list().filter(n=>!before.has(n)),[]);
  }

  // A voice name that is not a plain identifier is replaced, so it can never act as a command option.
  {
    const seen=[];
    const r=await run([{caption:'hello',duration:3}],stubEngine({speak:(t,{voice})=>{seen.push(voice);return Buffer.alloc(9600);}}),{voice:'--evil; rm'});
    assert.equal(seen[0],'en-US-AndrewMultilingualNeural');
    assert.equal(r.voice,'en-US-AndrewMultilingualNeural');
  }

  // The built-in tone engine is deterministic and always available.
  {
    const options={engine:'tone',cache:false};
    const a=await synth.synthesizeNarration([{caption:'Introduction to quicksort.',duration:3},{caption:'Partitioning elements around pivot.',duration:3}],options);
    const b=await synth.synthesizeNarration([{caption:'Introduction to quicksort.',duration:3},{caption:'Partitioning elements around pivot.',duration:3}],options);
    assert.equal(a.ok,true);
    assert.deepEqual(a.wavBuffer,b.wavBuffer,'same input gives identical audio');
    assert(a.totalSeconds>=6);
    const info=await synth.describeEngines();
    assert.deepEqual(info.map(e=>e.id),['system','online','tone']);
    assert.equal(info.find(e=>e.id==='tone').available,true);
  }

  // WAV reading tolerates extra chunks and resamples engine output (espeak writes 22.05 kHz).
  {
    const samples=22050,pcm=Buffer.alloc(samples*2);
    for(let i=0;i<samples;i++)pcm.writeInt16LE(Math.round(Math.sin(2*Math.PI*440*i/22050)*8000),i*2);
    const list=Buffer.concat([Buffer.from('LIST'),Buffer.from([4,0,0,0]),Buffer.from('INFO')]);
    const fmt=Buffer.alloc(24);fmt.write('fmt ',0);fmt.writeUInt32LE(16,4);fmt.writeUInt16LE(1,8);fmt.writeUInt16LE(1,10);fmt.writeUInt32LE(22050,12);fmt.writeUInt32LE(44100,16);fmt.writeUInt16LE(2,20);fmt.writeUInt16LE(16,22);
    const head=Buffer.alloc(8);head.write('data',0);head.writeUInt32LE(0xFFFFFFFF,4); // streamed writers leave a placeholder size
    const riff=Buffer.alloc(12);riff.write('RIFF',0);riff.writeUInt32LE(0xFFFFFFFF,4);riff.write('WAVE',8);
    const wav=synth.readWav(Buffer.concat([riff,fmt,list,head,pcm]));
    assert.equal(wav.rate,22050);
    assert.equal(wav.data.length,pcm.length);
    const out=synth.toMonoPcm(wav,RATE);
    assert.equal(out.length/2,RATE,'1 second stays 1 second at 48 kHz');
    assert.throws(()=>synth.readWav(Buffer.from('not a wav file at all, definitely not riff data......')),/did not produce a WAV/);
  }

  // Where the platform has a built-in voice, the system engine produces real speech (verified on hosted Windows and macOS).
  if(process.platform==='win32'||process.platform==='darwin'){
    const info=(await synth.describeEngines()).find(e=>e.id==='system');
    assert.equal(info.available,true,'built-in speech should exist on this platform: '+info.detail);
    const r=await synth.synthesizeNarration([{caption:'This function returns the discounted price.',duration:2},{caption:'',duration:1},{caption:'Then it stops.',duration:2}],{engine:'system',cache:false});
    assert.equal(r.ok,true,r.error);
    assert.equal(r.scenes.length,3);
    assert(r.totalSeconds>=5&&r.totalSeconds<30,'plausible duration: '+r.totalSeconds);
    let loud=0;for(let i=44;i<r.wavBuffer.length;i+=2)loud=Math.max(loud,Math.abs(r.wavBuffer.readInt16LE(i)));
    assert(loud>1000,'the audio is not silent');
  }

  // The online engine runs only when it is selected; the default never reaches uvx.
  if(process.platform!=='win32'){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codealive-fake-uvx-')),marker=path.join(dir,'called');
    for(const [name,body] of [['uvx',`#!/bin/sh\ntouch "${marker}"\nexit 1\n`],['ffmpeg','#!/bin/sh\nexit 1\n']])fs.writeFileSync(path.join(dir,name),body,{mode:0o755});
    const oldPath=process.env.PATH;
    process.env.PATH=dir+path.delimiter+oldPath;
    try{
      const scenes=[{caption:'Default stays local.',duration:2}];
      await synth.synthesizeNarration(scenes,{cache:false});
      assert.equal(fs.existsSync(marker),false,'uvx/edge-tts must not run unless the online engine is selected');
      const online=await synth.synthesizeNarration(scenes,{engine:'online',cache:false});
      assert.equal(fs.existsSync(marker),true,'the online engine invokes uvx');
      assert.equal(online.ok,false);
      assert.match(online.error,/Scene 1: edge-tts failed/);
    }finally{process.env.PATH=oldPath;fs.rmSync(dir,{recursive:true,force:true});}
  }

  console.log('Narration synth passed: engine selection, no silent fallback, async cancel/progress, per-scene cache, timing changes, caption-less scenes, temp cleanup, WAV resampling and opt-in online engine.');
})().catch(error=>{console.error(error);process.exitCode=1;});
