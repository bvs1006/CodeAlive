(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CodeAliveNarrationSynth=factory();
})(globalThis,function(){
  'use strict';
  const {spawnSync}=typeof require==='function'?require('node:child_process'):{};
  const fs=typeof require==='function'?require('node:fs'):{};
  const os=typeof require==='function'?require('node:os'):{};
  const path=typeof require==='function'?require('node:path'):{};

  function createWavHeader(dataLen,sampleRate=48000,numChannels=1,bitsPerSample=16){
    if(typeof Buffer!=='undefined'){
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
    // Browser typed array implementation
    const buf=new ArrayBuffer(44);
    const view=new DataView(buf);
    function writeStr(offset,str){for(let i=0;i<str.length;i++)view.setUint8(offset+i,str.charCodeAt(i));}
    writeStr(0,'RIFF');
    view.setUint32(4,36+dataLen,true);
    writeStr(8,'WAVE');
    writeStr(12,'fmt ');
    view.setUint32(16,16,true);
    view.setUint16(20,1,true);
    view.setUint16(22,numChannels,true);
    view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*numChannels*(bitsPerSample/8),true);
    view.setUint16(32,numChannels*(bitsPerSample/8),true);
    view.setUint16(34,bitsPerSample,true);
    writeStr(36,'data');
    view.setUint32(40,dataLen,true);
    return new Uint8Array(buf);
  }

  function synthesizeSceneAudio(text,outFile,sampleRate=48000,voice='en-US-AndrewMultilingualNeural'){
    if(!spawnSync||!fs)return false;
    // Priority 1: High-Definition AI Neural Voice (Microsoft Edge Neural Human Voice)
    const uvPath=fs.existsSync('/Users/bhushan/.local/bin/uvx')?'/Users/bhushan/.local/bin/uvx':(spawnSync('which',['uvx']).status===0?'uvx':null);
    if(uvPath){
      try{
        const mp3Tmp=outFile.replace(/\.wav$/,'.mp3');
        const res=spawnSync(uvPath,['edge-tts','--voice',voice,'--text',text,'--write-media',mp3Tmp],{timeout:15000});
        if(res.status===0&&fs.existsSync(mp3Tmp)){
          const ffmpeg=spawnSync('ffmpeg',['-y','-i',mp3Tmp,'-ar',String(sampleRate),'-ac','1',outFile]);
          try{fs.unlinkSync(mp3Tmp);}catch{}
          if(ffmpeg.status===0&&fs.existsSync(outFile))return true;
        }
      }catch{}
    }
    if(process.platform==='darwin'){
      // Priority 2: macOS native TTS with natural voice selection
      const isFemale=/ava|emma|jenny|female|aria/i.test(voice);
      const macVoice=isFemale?'Samantha':'Daniel';
      const res=spawnSync('say',['-v',macVoice,'-r','165','--file-format=WAVE',`--data-format=LEI16@${sampleRate}`,'-o',outFile,text]);
      if(res.status===0&&fs.existsSync(outFile))return true;
      const fallback=spawnSync('say',['-r','165','--file-format=WAVE',`--data-format=LEI16@${sampleRate}`,'-o',outFile,text]);
      if(fallback.status===0&&fs.existsSync(outFile))return true;
    }
    for(const cmd of ['espeak-ng','espeak']){
      try{
        const chk=spawnSync('which',[cmd]);
        if(chk.status===0){
          const res=spawnSync(cmd,['-w',outFile,text]);
          if(res.status===0&&fs.existsSync(outFile))return true;
        }
      }catch{}
    }
    return false;
  }

  function synthesizeSyntheticVoice(text,sampleRate=48000){
    const words=text.trim().split(/\s+/);
    const duration=Math.min(12.0,Math.max(1.8,words.length*0.35));
    const totalSamples=Math.round(duration*sampleRate);
    const baseFreq=140;
    if(typeof Buffer!=='undefined'){
      const pcm=Buffer.alloc(totalSamples*2);
      for(let i=0;i<totalSamples;i++){
        const t=i/sampleRate;
        const wordIdx=Math.floor((t/duration)*words.length);
        const inWord=(t%(duration/words.length))<(0.75*(duration/words.length));
        let sample=0;
        if(inWord){
          const f0=baseFreq+(wordIdx%3)*15;
          const v1=Math.sin(2*Math.PI*f0*t);
          const v2=0.4*Math.sin(2*Math.PI*f0*2.8*t);
          const v3=0.2*Math.sin(2*Math.PI*f0*5.2*t);
          const envelope=Math.sin(Math.PI*((t%(duration/words.length))/(0.75*(duration/words.length))));
          sample=(v1+v2+v3)*envelope*0.35;
        }
        const intVal=Math.max(-32768,Math.min(32767,Math.round(sample*32767)));
        pcm.writeInt16LE(intVal,i*2);
      }
      return pcm;
    }
    const pcm=new Int16Array(totalSamples);
    for(let i=0;i<totalSamples;i++){
      const t=i/sampleRate;
      const wordIdx=Math.floor((t/duration)*words.length);
      const inWord=(t%(duration/words.length))<(0.75*(duration/words.length));
      let sample=0;
      if(inWord){
        const f0=baseFreq+(wordIdx%3)*15;
        const v1=Math.sin(2*Math.PI*f0*t);
        const v2=0.4*Math.sin(2*Math.PI*f0*2.8*t);
        const v3=0.2*Math.sin(2*Math.PI*f0*5.2*t);
        const envelope=Math.sin(Math.PI*((t%(duration/words.length))/(0.75*(duration/words.length))));
        sample=(v1+v2+v3)*envelope*0.35;
      }
      pcm[i]=Math.max(-32768,Math.min(32767,Math.round(sample*32767)));
    }
    return new Uint8Array(pcm.buffer);
  }

  function synthesizeNarration(scenes=[],options={}){
    if(!Array.isArray(scenes)||!scenes.length)return {ok:false,error:'No scenes provided for narration.'};
    const sampleRate=options.sampleRate||48000;
    const voice=options.voice||'en-US-AndrewMultilingualNeural';
    const tmpDir=os?.tmpdir?.()||'/tmp';
    const chunks=[];
    const updatedScenes=[];

    for(let i=0;i<scenes.length;i++){
      const s=scenes[i];
      const caption=String(s.caption||'').trim();
      if(!caption)continue;
      const tmpFile=path?.join?.(tmpDir,`codealive_scene_${Date.now()}_${i}.wav`);
      let pcmBytes=null;

      const ok=tmpFile?synthesizeSceneAudio(caption,tmpFile,sampleRate,voice):false;
      if(ok&&fs.existsSync(tmpFile)){
        try{
          const buf=fs.readFileSync(tmpFile);
          pcmBytes=buf.subarray(44);
        }catch{}
        try{fs.unlinkSync(tmpFile);}catch{}
      }

      if(!pcmBytes||!pcmBytes.length){
        pcmBytes=synthesizeSyntheticVoice(caption,sampleRate);
      }

      const byteLength=pcmBytes.byteLength||pcmBytes.length;
      const speechSeconds=byteLength/(sampleRate*2);
      const targetDuration=Math.max(Number(s.duration)||4.0,Math.ceil((speechSeconds+0.4)*10)/10);
      updatedScenes.push({...s,duration:targetDuration});

      chunks.push(pcmBytes);
      const silenceSeconds=Math.max(0.1,targetDuration-speechSeconds);
      const silenceBytes=Math.round(silenceSeconds*sampleRate)*2;
      const silence=typeof Buffer!=='undefined'?Buffer.alloc(silenceBytes):new Uint8Array(silenceBytes);
      chunks.push(silence);
    }

    if(!chunks.length)return {ok:false,error:'Could not synthesize narration audio.'};
    
    let totalPcm;
    if(typeof Buffer!=='undefined'){
      totalPcm=Buffer.concat(chunks);
      const header=createWavHeader(totalPcm.length,sampleRate,1,16);
      const wavBuffer=Buffer.concat([header,totalPcm]);
      return {ok:true,wavBuffer,scenes:updatedScenes,totalSeconds:totalPcm.length/(sampleRate*2)};
    }
    const totalLen=chunks.reduce((acc,c)=>acc+(c.byteLength||c.length),0);
    totalPcm=new Uint8Array(totalLen);
    let offset=0;
    for(const c of chunks){
      const arr=c instanceof Uint8Array?c:new Uint8Array(c.buffer||c);
      totalPcm.set(arr,offset);
      offset+=arr.length;
    }
    const header=createWavHeader(totalLen,sampleRate,1,16);
    const wavBuffer=new Uint8Array(44+totalLen);
    wavBuffer.set(header,0);
    wavBuffer.set(totalPcm,44);
    return {ok:true,wavBuffer,scenes:updatedScenes,totalSeconds:totalLen/(sampleRate*2)};
  }

  return {createWavHeader,synthesizeNarration,synthesizeSpeech:synthesizeSceneAudio};
});