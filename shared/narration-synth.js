(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CodeAliveNarrationSynth=factory();
})(globalThis,function(){
  'use strict';
  // Speech engines run as local processes, so this module only works in Node (the extension host).
  // In a browser or webview it still loads, and synthesizeNarration reports that no engine is available.
  const hasNode=typeof require==='function'&&typeof process!=='undefined'&&!!process.versions?.node;
  const cp=hasNode?require('node:child_process'):null;
  const fs=hasNode?require('node:fs'):null;
  const os=hasNode?require('node:os'):null;
  const path=hasNode?require('node:path'):null;
  const crypto=hasNode?require('node:crypto'):null;

  const DEFAULT_VOICE='en-US-AndrewMultilingualNeural';
  const VOICE_PATTERN=/^[A-Za-z0-9-]{1,64}$/;
  const SAMPLE_RATE=48000;
  const MAX_WORDS_PER_SECOND=3;
  const CACHE_LIMIT=200;
  const cache=new Map();

  function createWavHeader(dataLen,sampleRate=SAMPLE_RATE,numChannels=1,bitsPerSample=16){
    const b=Buffer.alloc(44);
    b.write('RIFF',0);
    b.writeUInt32LE(36+dataLen,4);
    b.write('WAVE',8);
    b.write('fmt ',12);
    b.writeUInt32LE(16,16);
    b.writeUInt16LE(1,20);
    b.writeUInt16LE(numChannels,22);
    b.writeUInt32LE(sampleRate,24);
    b.writeUInt32LE(sampleRate*numChannels*(bitsPerSample/8),28);
    b.writeUInt16LE(numChannels*(bitsPerSample/8),32);
    b.writeUInt16LE(bitsPerSample,34);
    b.write('data',36);
    b.writeUInt32LE(dataLen,40);
    return b;
  }

  // Reads a 16-bit PCM WAV by walking its chunks; engines add extra chunks and some leave placeholder sizes.
  function readWav(buf){
    if(buf.length<44||buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WAVE')throw Error('The speech engine did not produce a WAV file.');
    let pos=12,fmt=null,data=null;
    while(pos+8<=buf.length){
      const id=buf.toString('ascii',pos,pos+4),start=pos+8;
      let size=buf.readUInt32LE(pos+4);
      if(start+size>buf.length)size=buf.length-start;
      if(id==='fmt ')fmt={format:buf.readUInt16LE(start),channels:buf.readUInt16LE(start+2),rate:buf.readUInt32LE(start+4),bits:buf.readUInt16LE(start+14)};
      else if(id==='data'){data=buf.subarray(start,start+size);break;}
      pos=start+size+(size&1);
    }
    if(!fmt||!data)throw Error('The speech engine produced an incomplete WAV file.');
    if(fmt.format!==1||fmt.bits!==16||fmt.channels<1)throw Error('The speech engine produced an unsupported WAV format (16-bit PCM is required).');
    return {...fmt,data};
  }

  // Mono 16-bit PCM at the requested rate, using linear interpolation when the engine's rate differs.
  function toMonoPcm(wav,targetRate){
    const frames=Math.floor(wav.data.length/(2*wav.channels));
    if(!frames)return Buffer.alloc(0);
    const mono=new Float64Array(frames);
    for(let i=0;i<frames;i++){
      let sum=0;
      for(let c=0;c<wav.channels;c++)sum+=wav.data.readInt16LE((i*wav.channels+c)*2);
      mono[i]=sum/wav.channels;
    }
    const outFrames=Math.round(frames*targetRate/wav.rate),out=Buffer.alloc(outFrames*2);
    for(let i=0;i<outFrames;i++){
      const pos=i*wav.rate/targetRate,i0=Math.min(Math.floor(pos),frames-1),i1=Math.min(i0+1,frames-1),frac=pos-i0;
      out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(mono[i0]*(1-frac)+mono[i1]*frac))),i*2);
    }
    return out;
  }

  function abortError(){const error=Error('Narration generation cancelled.');error.name='AbortError';return error;}

  // Runs a command without a shell and without blocking the extension host.
  function run(cmd,args,{timeout=15000,signal,env}={}){
    return new Promise(resolve=>{
      if(signal?.aborted)return resolve({status:null,aborted:true});
      let child,stdout='',stderr='',done=false,timer;
      const finish=result=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',onAbort);resolve(result);};
      const onAbort=()=>{child?.kill();finish({status:null,aborted:true});};
      try{child=cp.spawn(cmd,args,{stdio:['ignore','pipe','pipe'],env:env?{...process.env,...env}:process.env});}catch(error){return resolve({status:null,error});}
      timer=setTimeout(()=>{child.kill();finish({status:null,timedOut:true});},timeout);
      signal?.addEventListener('abort',onAbort,{once:true});
      child.stdout.on('data',chunk=>{if(stdout.length<2000)stdout+=chunk;});
      child.stderr.on('data',chunk=>{if(stderr.length<2000)stderr+=chunk;});
      child.on('error',error=>finish({status:null,error}));
      child.on('close',status=>finish({status,stdout,stderr}));
    });
  }

  async function onPath(cmd){
    if(!hasNode)return false;
    const probe=await run(process.platform==='win32'?'where':'which',[cmd],{timeout:5000});
    return probe.status===0;
  }

  // Throws a readable error unless the command succeeded and produced the expected file.
  async function runChecked(label,cmd,args,options,outFile){
    const result=await run(cmd,args,options);
    if(result.aborted)throw abortError();
    if(result.timedOut)throw Error(`${label} timed out.`);
    if(result.error)throw Error(`${label} could not start: ${result.error.message}`);
    if(result.status!==0)throw Error(`${label} failed${result.stderr?': '+result.stderr.trim().split('\n').pop():'.'}`);
    if(outFile&&!fs.existsSync(outFile))throw Error(`${label} produced no audio.`);
  }

  function writeTextFile(dir,index,text){
    // A file avoids text beginning with "-" being read as a command-line option.
    const file=path.join(dir,`scene_${index}.txt`);
    fs.writeFileSync(file,text,'utf8');
    return file;
  }

  function synthesizeTone(text,sampleRate){
    // A placeholder with speech-like cadence and no words, for tests and for machines with no voice.
    const words=text.trim().split(/\s+/);
    const duration=Math.min(12.0,Math.max(1.8,words.length*0.35));
    const total=Math.round(duration*sampleRate),pcm=Buffer.alloc(total*2),slot=duration/words.length;
    for(let i=0;i<total;i++){
      const t=i/sampleRate,word=Math.floor(t/slot),local=t%slot;
      let sample=0;
      if(local<0.75*slot){
        const f0=140+(word%3)*15,envelope=Math.sin(Math.PI*(local/(0.75*slot)));
        sample=(Math.sin(2*Math.PI*f0*t)+0.4*Math.sin(2*Math.PI*f0*2.8*t)+0.2*Math.sin(2*Math.PI*f0*5.2*t))*envelope*0.35;
      }
      pcm.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(sample*32767))),i*2);
    }
    return pcm;
  }

  // Windows speaks through the built-in SAPI voices that ship with Windows PowerShell (System.Speech).
  // The text and output paths travel in environment variables so caption text is never parsed as script.
  const WINDOWS_SPEECH_SCRIPT="$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Speech;$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;try{$gender=[System.Enum]::Parse([System.Speech.Synthesis.VoiceGender],$env:CODEALIVE_VOICE_GENDER);$pick=$s.GetInstalledVoices()|Where-Object{$_.Enabled -and $_.VoiceInfo.Gender -eq $gender}|Select-Object -First 1;if($pick){$s.SelectVoice($pick.VoiceInfo.Name)};$s.SetOutputToWaveFile($env:CODEALIVE_OUT_FILE);$s.Speak([System.IO.File]::ReadAllText($env:CODEALIVE_TEXT_FILE))}finally{$s.Dispose()}";
  const WINDOWS_COUNT_SCRIPT="$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Speech;$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;try{$s.GetInstalledVoices().Count}finally{$s.Dispose()}";
  // -EncodedCommand (UTF-16LE base64) avoids every command-line quoting rule.
  const powershellArgs=script=>['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')];

  async function windowsVoiceCount(){
    const probe=await run('powershell',powershellArgs(WINDOWS_COUNT_SCRIPT),{timeout:20000});
    return probe.status===0?parseInt(probe.stdout,10)||0:0;
  }

  // Returns {command, detail} for the first local engine found, or {command:null, detail} explaining why not.
  async function localCommand(){
    if(process.platform==='darwin')return (await onPath('say'))?{command:'say',detail:'Using say.'}:{command:null,detail:'The macOS say command was not found.'};
    if(process.platform==='win32'){
      if(!(await onPath('powershell')))return {command:null,detail:'Windows PowerShell was not found on PATH.'};
      const voices=await windowsVoiceCount();
      return voices?{command:'powershell',detail:`Using Windows speech (${voices} installed voice${voices===1?'':'s'}).`}:{command:null,detail:'No Windows speech voices are installed (Settings > Time & language > Speech).'};
    }
    for(const cmd of ['espeak-ng','espeak'])if(await onPath(cmd))return {command:cmd,detail:`Using ${cmd}.`};
    return {command:null,detail:'No espeak-ng or espeak on PATH. Install espeak-ng, or choose another voice engine.'};
  }

  // Each engine reports whether it can run, and speaks one caption as mono 16-bit PCM at the requested rate.
  const engines={
    system:{
      label:'System voice (macOS say, Windows speech, espeak-ng or espeak)',
      async check(){
        const found=await localCommand();
        return found.command?{available:true,command:found.command,detail:`${found.detail} Speech is generated on this machine.`}:{available:false,detail:found.detail};
      },
      async speak(text,{voice,sampleRate,signal,dir,index,status}){
        const cmd=status?.command||(await localCommand()).command,textFile=writeTextFile(dir,index,text),wavFile=path.join(dir,`scene_${index}.wav`);
        const options={timeout:30000,signal},female=/ava|emma|jenny|neerja|female|aria/i.test(voice);
        if(cmd==='say'){
          const base=['-r','165','--file-format=WAVE',`--data-format=LEI16@${sampleRate}`,'-o',wavFile,'-f',textFile];
          try{await runChecked('say','say',['-v',female?'Samantha':'Daniel',...base],options,wavFile);}
          catch(error){if(error.name==='AbortError')throw error;await runChecked('say','say',base,options,wavFile);}
        }else if(cmd==='powershell'){
          const env={CODEALIVE_TEXT_FILE:textFile,CODEALIVE_OUT_FILE:wavFile,CODEALIVE_VOICE_GENDER:female?'Female':'Male'};
          await runChecked('Windows speech','powershell',powershellArgs(WINDOWS_SPEECH_SCRIPT),{...options,env},wavFile);
        }else await runChecked(cmd,cmd,['-w',wavFile,'-f',textFile],options,wavFile);
        return toMonoPcm(readWav(fs.readFileSync(wavFile)),sampleRate);
      }
    },
    online:{
      label:"Microsoft online neural voices (edge-tts; sends caption text to Microsoft)",
      async check(){
        if(!(await onPath('uvx')))return {available:false,detail:'uvx was not found on PATH (install uv to use edge-tts).'};
        if(!(await onPath('ffmpeg')))return {available:false,detail:'ffmpeg was not found on PATH.'};
        return {available:true,detail:'Caption text is sent to Microsoft\'s speech service. uvx may download edge-tts on first use.'};
      },
      async speak(text,{voice,sampleRate,signal,dir,index}){
        const mp3=path.join(dir,`scene_${index}.mp3`),wavFile=path.join(dir,`scene_${index}.wav`);
        // The "=" forms keep caption text from being read as an option.
        await runChecked('edge-tts','uvx',['edge-tts',`--voice=${voice}`,`--text=${text}`,`--write-media=${mp3}`],{timeout:60000,signal},mp3);
        await runChecked('ffmpeg','ffmpeg',['-y','-i',mp3,'-ar',String(sampleRate),'-ac','1','-f','wav',wavFile],{timeout:30000,signal},wavFile);
        return toMonoPcm(readWav(fs.readFileSync(wavFile)),sampleRate);
      }
    },
    tone:{
      label:'Placeholder tone (no words; for timing and testing)',
      async check(){return {available:true,detail:'Generates a wordless tone with speech-like timing.'};},
      async speak(text,{sampleRate}){return synthesizeTone(text,sampleRate);}
    }
  };

  async function describeEngines(registry=engines){
    const out=[];
    for(const [id,engine] of Object.entries(registry)){
      const status=hasNode?await engine.check():{available:false,detail:'Voice generation needs the VS Code extension.'};
      out.push({id,label:engine.label,available:status.available,detail:status.detail});
    }
    return out;
  }

  function remember(key,pcm){
    if(cache.size>=CACHE_LIMIT)cache.delete(cache.keys().next().value);
    cache.set(key,pcm);
  }

  function silence(seconds,sampleRate){return Buffer.alloc(Math.round(seconds*sampleRate)*2);}

  const fail=(error,extra={})=>({ok:false,error,...extra});

  // Options: engine ('system' | 'online' | 'tone'), voice, sampleRate, signal (AbortSignal),
  // onProgress({phase,index,total,cached,engine,warnings}), cache (false to bypass), engines (for tests).
  // Scene durations only ever grow, to fit the speech; `changes` lists each scene that was lengthened.
  async function synthesizeNarration(scenes=[],options={}){
    if(!hasNode)return fail('Voice generation needs the VS Code extension. Import a narration recording instead.');
    if(!Array.isArray(scenes)||!scenes.length)return fail('No scenes provided for narration.');
    const sampleRate=options.sampleRate||SAMPLE_RATE;
    const voice=VOICE_PATTERN.test(options.voice||'')?options.voice:DEFAULT_VOICE;
    const engineId=options.engine||(options.onlineVoice?'online':'system');
    const engine=(options.engines||engines)[engineId];
    if(!engine)return fail(`Unknown voice engine "${engineId}".`);
    const spoken=scenes.filter(s=>String(s.caption||'').trim()).length;
    if(!spoken)return fail('No scene has a caption to speak.');
    const status=await engine.check();
    if(!status.available)return fail(`Voice engine "${engineId}" is unavailable: ${status.detail}`,{engine:engineId});

    const maxWps=options.maxWordsPerSecond||MAX_WORDS_PER_SECOND;
    const warnings=[];
    scenes.forEach((s,i)=>{
      const caption=String(s.caption||'').trim(),duration=Number(s.duration)||4,words=caption?caption.split(/\s+/).length:0;
      if(words/duration>maxWps)warnings.push(`Scene ${i+1} has ${words} words in ${duration}s; it will probably be lengthened to fit the speech.`);
    });
    options.onProgress?.({phase:'start',total:scenes.length,engine:engineId,warnings});

    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codealive-voice-'));
    const chunks=[],outScenes=[],changes=[];
    let cached=0,current=0;
    try{
      for(let i=0;i<scenes.length;i++){
        current=i;
        if(options.signal?.aborted)throw abortError();
        const s=scenes[i],caption=String(s.caption||'').trim(),base=Number(s.duration)||4;
        if(!caption){
          // A scene with nothing to say still takes its time, so later scenes stay in sync with the video.
          chunks.push(silence(base,sampleRate));
          outScenes.push({...s});
          continue;
        }
        const key=crypto.createHash('sha256').update([engineId,voice,sampleRate,caption].join('\u0000')).digest('hex');
        let pcm=options.cache===false?null:cache.get(key);
        const hit=!!pcm;
        if(hit)cached++;
        else{
          pcm=await engine.speak(caption,{voice,sampleRate,signal:options.signal,dir,index:i,status});
          if(!pcm?.length)throw Error('The voice engine produced no audio.');
          if(options.cache!==false)remember(key,pcm);
        }
        options.onProgress?.({phase:'scene',index:i,total:scenes.length,cached:hit,engine:engineId});
        const speech=pcm.length/(sampleRate*2),target=Math.max(base,Math.ceil((speech+0.4)*10)/10);
        if(target>base+1e-9)changes.push({index:i,from:base,to:target});
        outScenes.push({...s,duration:target});
        chunks.push(pcm,silence(Math.max(0.1,target-speech),sampleRate));
      }
    }catch(error){
      if(error.name==='AbortError')return fail('Narration generation cancelled.',{cancelled:true,engine:engineId});
      return fail(`Scene ${current+1}: ${error.message}`,{engine:engineId});
    }finally{
      try{fs.rmSync(dir,{recursive:true,force:true});}catch{}
    }
    const pcm=Buffer.concat(chunks);
    return {ok:true,wavBuffer:Buffer.concat([createWavHeader(pcm.length,sampleRate,1,16),pcm]),scenes:outScenes,totalSeconds:pcm.length/(sampleRate*2),engine:engineId,voice,cached,spoken,changes,warnings};
  }

  return {createWavHeader,readWav,toMonoPcm,synthesizeNarration,describeEngines,engines,clearCache:()=>cache.clear()};
});
