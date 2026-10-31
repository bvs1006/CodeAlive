(function(root){
  'use strict';
  root.CodeAliveMovieUI={mount({host,getContext,getTrace,onRange}){
    const $=id=>document.getElementById(id),canvas=$('movie-canvas'),ctx=canvas.getContext('2d');
    let context=null,source='',scenes=[],narration=null,narrationName='',generation=0,state=null,blob=null,url=null,mode='explanation',replayInput='',audioLoading=false,overlay=null;
    const status=text=>{$('movie-status').textContent=text;};
    function clearOutput(){$('movie-scene-status').textContent='';blob=null;if(url)URL.revokeObjectURL(url);url=null;$('movie-download').hidden=true;$('movie-preview').removeAttribute('src');$('movie-preview').load();}
    function controls(busy){$('movie-stop').disabled=!busy;for(const el of $('movie-editor').querySelectorAll('input,textarea,select,button'))el.disabled=busy;$('movie-play').disabled=busy||audioLoading||!scenes.length;$('movie-record').disabled=busy||audioLoading||!scenes.length;$('movie-save').disabled=busy||!blob;if($('movie-export-subtitles'))$('movie-export-subtitles').disabled=busy||!scenes.length;}
    function cleanup(s){cancelAnimationFrame(s.raf);clearTimeout(s.watchdog);for(const node of s.nodes)try{node.stop();}catch{}s.stream?.getTracks().forEach(t=>t.stop());s.cam?.getTracks().forEach(t=>t.stop());if(s.camVideo)s.camVideo.srcObject=null;s.dest.stream.getTracks().forEach(t=>t.stop());s.audio.close().catch(()=>{});if(state===s)state=null;controls(false);}
    function stop(discard=false){if(typeof window!=='undefined'&&window.speechSynthesis)try{window.speechSynthesis.cancel();}catch{}const s=state;if(!s)return;s.discard=discard;s.early=!s.finished;cancelAnimationFrame(s.raf);clearTimeout(s.watchdog);for(const node of s.nodes)try{node.stop();}catch{}if(s.recorder&&s.recorder.state!=='inactive')s.recorder.stop();else{cleanup(s);status(discard?'Playback cleared.':'Preview stopped.');}}
    function clear(){overlay=null;generation++;stop(true);clearOutput();context=null;scenes=[];source='';audioLoading=false;narration=null;narrationName='';$('movie-narration').value='';$('movie-audio-status').textContent='No narration loaded.';$('movie-scenes').replaceChildren();$('movie-length').textContent='';$('movie-position').textContent='Ready to preview';const landscape=$('movie-preset')?.value==='16:9';canvas.width=landscape?1920:1080;canvas.height=landscape?1080:1920;ctx.fillStyle='#0b1018';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#9eafc3';ctx.font='36px sans-serif';ctx.fillText('Build a script to preview a frame.',72,250);$('movie-work').hidden=true;controls(false);status('Explain a function first, then build a script.');}
    function setContext(){const next=getContext();if(!next)return clear();if(context&&next.code===context.code&&next.scopeId===context.scopeId&&next.language===context.language)return;clear();context=next;$('movie-work').hidden=false;status(context.model?'Choose explanation steps or a captured replay, then build a script.':'Generate AI scenes or paste a script to create a video.');}
    function readPlan(){return CodeAliveMovie.plan(source,scenes,{title:$('movie-title').value,hideSource:$('movie-hide').checked,mode,aspectRatio:$('movie-preset')?.value||'9:16',overlay,webcam:$('movie-webcam')?$('movie-webcam').checked:false,showCaptions:$('movie-captions')?$('movie-captions').checked:true});}
    function update(){clearOutput();try{const p=readPlan(),landscape=p.aspectRatio==='16:9';if(canvas.width!==(landscape?1920:1080)||canvas.height!==(landscape?1080:1920)){canvas.width=landscape?1920:1080;canvas.height=landscape?1080:1920;}if($('movie-stage-note'))$('movie-stage-note').textContent=`${landscape?'Landscape 1920 × 1080':'Vertical 1080 × 1920'} · up to 20 scenes / 120 seconds. Recording runs in real time; keep this view visible.`;CodeAliveMovie.draw(ctx,p,0);$('movie-length').textContent=`${p.scenes.length} scenes · ${p.seconds.toFixed(1)} seconds${mode==='replay'?' · Captured input: '+replayInput:''}`;let elapsed=0;for(const [i,s]of scenes.entries()){const out=$('movie-scenes').children[i]?.querySelector('output');if(out)out.textContent=s.enabled?`${elapsed.toFixed(1)}–${(elapsed+Number(s.duration)).toFixed(1)}s`:'Excluded';if(s.enabled)elapsed+=Number(s.duration);}if(narration)audioNote(p);}catch(e){status(e.message);}controls(false);}
    function audioNote(p){$('movie-audio-status').textContent=`${narrationName} · ${narration.duration.toFixed(1)} seconds. ${narration.duration>p.seconds+0.15?'Audio is longer than the video. Fit timing or shorten the audio before recording.':narration.duration<p.seconds-0.15?'Narration ends before the video; remaining scenes will have no voice.':'Narration and video durations match.'}`;}
    function renderScenes(){const list=$('movie-scenes');list.replaceChildren();for(const [i,s]of scenes.entries()){
      const row=document.createElement('div');row.className='movie-scene';const include=document.createElement('input');include.type='checkbox';include.checked=s.enabled;include.setAttribute('aria-label','Include scene '+(i+1));
      const label=document.createElement('label');label.textContent='Scene '+(i+1);label.append(include);const caption=document.createElement('textarea');caption.value=s.caption;caption.maxLength=240;caption.rows=3;caption.setAttribute('aria-label','Caption for scene '+(i+1));const duration=document.createElement('input');duration.type='number';duration.min='0.5';duration.max='15';duration.step='0.1';duration.value=s.duration;duration.setAttribute('aria-label','Seconds for scene '+(i+1));const output=document.createElement('output');
      include.onchange=()=>{s.enabled=include.checked;update();};caption.oninput=()=>{s.caption=caption.value;update();};duration.oninput=()=>{s.duration=Number(duration.value);update();};row.append(label,caption,duration,output);list.append(row);
    }update();}
    $('movie-build').onclick=()=>{try{const current=getContext();if(!current)throw Error('Explain a function first.');mode=$('movie-mode').value;const trace=getTrace(),items=mode==='replay'?trace?.steps:current.model?.steps;if(!items?.length)throw Error(mode==='replay'?'Run Replay first to capture a trace.':'Explain a JavaScript or TypeScript function first, or use Generate AI scenes.');const start=Number($('movie-first').value),end=Number($('movie-last').value);if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>items.length||end-start>=20)throw Error(`Select 1–20 consecutive steps from the available ${items.length}.`);
      source=current.code;replayInput=mode==='replay'?trace.input:'';scenes=items.slice(start-1,end).map(s=>({enabled:true,duration:3,caption:(mode==='replay'?`${s.kind}${s.detail?': '+s.detail:''}. Value: ${JSON.stringify(s.value)}`:s.beginner).slice(0,240),range:{...(mode==='replay'?s.range:s)}}));renderScenes();status('Edit captions and scene durations, add recorded narration if wanted, then preview.');
    }catch(e){status(e.message);}};
    function stepRange(){const current=getContext(),trace=getTrace(),length=($('movie-mode').value==='replay'?trace?.steps:current?.model?.steps)?.length||0;$('movie-first').value=1;$('movie-last').value=Math.min(10,length);$('movie-range-note').textContent=`${length} available steps. Build up to 20 at a time.`;}
    $('movie-mode').onchange=stepRange;$('movie-refresh-steps').onclick=stepRange;
    for(const id of ['movie-title','movie-hide','movie-music','movie-preset','movie-captions'])if($(id))$(id).addEventListener('input',()=>{if(scenes.length)update();});
    if($('movie-preset'))$('movie-preset').addEventListener('change',()=>{if(scenes.length)update();});
    if($('movie-captions'))$('movie-captions').addEventListener('change',()=>{if(scenes.length)update();});
    async function audioDuration(file){const temp=URL.createObjectURL(file),audio=document.createElement('audio');try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Could not read audio duration. Try a WAV file.')),10000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve(audio.duration);};audio.onerror=()=>{clearTimeout(timer);reject(Error('Audio metadata could not be read. Try WAV or MP3.'));};audio.src=temp;});}finally{audio.removeAttribute('src');audio.load();URL.revokeObjectURL(temp);}}
    $('movie-narration').onchange=async()=>{const file=$('movie-narration').files[0],id=++generation;narration=null;narrationName='';clearOutput();if(!file){audioLoading=false;controls(!!state);$('movie-audio-status').textContent='No narration loaded.';return;}audioLoading=true;controls(false);let audio;
      try{if(file.size>15*1024*1024)throw Error('Narration must be at most 15 MB.');const duration=await audioDuration(file);if(!Number.isFinite(duration)||duration<=0||duration>120)throw Error('Narration must have a known duration of at most 120 seconds.');if(id!==generation)return;
        audio=new AudioContext({sampleRate:48000});const buffer=await audio.decodeAudioData(await file.arrayBuffer());if(id!==generation)return;if(buffer.duration>120||buffer.numberOfChannels>2)throw Error('Use mono or stereo narration of at most 120 seconds.');narration=buffer;narrationName=file.name.slice(0,120);$('movie-audio-status').textContent=`${narrationName} · ${buffer.duration.toFixed(1)} seconds, loaded locally.`;if(scenes.length)audioNote(readPlan());
      }catch(e){if(id===generation){narration=null;$('movie-audio-status').textContent=e.message;}}finally{if(audio)await audio.close();if(id===generation){audioLoading=false;controls(!!state);}}
    };
    $('movie-fit').onclick=()=>{try{if(!narration)throw Error('Add a narration audio file first.');const p=readPlan(),factor=narration.duration/p.seconds;const durations=scenes.map(s=>s.enabled?s.duration*factor:s.duration);if(durations.some((d,i)=>scenes[i].enabled&&(d<0.5||d>15)))throw Error('Fitted scenes need 0.5–15 seconds each. Change the scene selection first.');scenes.forEach((s,i)=>s.duration=durations[i]);renderScenes();status('Timing fitted proportionally. Preview and adjust scene boundaries to match the spoken words.');}catch(e){status(e.message);}};
    async function start(record){let s;try{
      if(state)return;const p=readPlan();if(narration&&narration.duration>p.seconds+0.15)throw Error('Narration is longer than the video. Fit timing before recording.');
      const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)throw Error('Web Audio is unavailable in this browser.');
      if(record&&(!root.MediaRecorder||!canvas.captureStream))throw Error('Video recording is unavailable in this browser.');
      clearOutput();const audio=new Audio();s={audio,dest:audio.createMediaStreamDestination(),nodes:[],plan:p,token:generation,finished:false,discard:false};state=s;controls(true);await audio.resume();if(state!==s||s.discard)return;
      if(p.webcam&&p.aspectRatio==='9:16'){if(!root.navigator?.mediaDevices?.getUserMedia)throw Error('The webcam is unavailable here. Turn off the presenter webcam, or use the browser studio.');
        try{s.cam=await root.navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:720},height:{ideal:720}},audio:false});}catch{throw Error('Camera access was denied or no camera was found. Turn off the presenter webcam to continue.');}
        if(state!==s||s.discard){s.cam.getTracks().forEach(t=>t.stop());return;}const v=document.createElement('video');v.muted=true;v.playsInline=true;v.srcObject=s.cam;await v.play();s.camVideo=v;}
      const master=audio.createGain();master.gain.value=0.85;master.connect(s.dest);master.connect(audio.destination);
      if(record){const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'],mimeType=types.find(t=>MediaRecorder.isTypeSupported(t));if(!mimeType)throw Error('No supported recording format. Try desktop Chromium.');
        s.stream=canvas.captureStream(30);for(const track of s.dest.stream.getAudioTracks())s.stream.addTrack(track.clone());const chunks=[];let bytes=0;s.recorder=new MediaRecorder(s.stream,{mimeType,videoBitsPerSecond:4000000});
        s.recorder.ondataavailable=e=>{if(e.data.size){bytes+=e.data.size;if(bytes>50*1024*1024){s.discard=true;stop(true);status('Recording exceeded 50 MB. Choose a shorter script.');}else chunks.push(e.data);}};
        s.recorder.onerror=()=>{s.discard=true;stop(true);status('Recording failed. Try a shorter script or another browser.');};
        s.recorder.onstop=()=>{cleanup(s);if(s.discard||s.token!==generation)return;blob=new Blob(chunks,{type:mimeType});if(!blob.size){status('Recording was empty. Try again.');return;}url=URL.createObjectURL(blob);$('movie-preview').src=url;$('movie-download').hidden=false;controls(false);status(s.early?'Partial recording ready. Preview it before saving.':'Video ready. Preview the audio, captions and source visibility before saving.');};s.recorder.start(250);
      }
      s.start=audio.currentTime+0.12;
      // A silent source keeps an audio track present even without narration/music.
      const silent=audio.createConstantSource(),zero=audio.createGain();zero.gain.value=0;silent.connect(zero);zero.connect(master);silent.start(s.start);silent.stop(s.start+p.seconds);s.nodes.push(silent);
      if(narration){const voice=audio.createBufferSource();voice.buffer=narration;voice.connect(master);voice.start(s.start);s.nodes.push(voice);}
      if($('movie-music').checked)for(const scene of p.scenes){
        const roots=[261.63, 329.63, 392.00, 349.23];
        const freq=roots[scene.index%4];
        const oscillator=audio.createOscillator(),gain=audio.createGain();
        oscillator.type='triangle';oscillator.frequency.value=freq;
        const musicGain=narration?0.035:0.08,fifthGainVal=narration?0.015:0.04;
        gain.gain.setValueAtTime(0,s.start+scene.start);
        gain.gain.linearRampToValueAtTime(musicGain,s.start+scene.start+0.12);
        gain.gain.setValueAtTime(musicGain,s.start+scene.end-0.18);
        gain.gain.linearRampToValueAtTime(0,s.start+scene.end);
        oscillator.connect(gain);gain.connect(master);
        oscillator.start(s.start+scene.start);oscillator.stop(s.start+scene.end);
        s.nodes.push(oscillator);

        const fifth=audio.createOscillator(),fifthGain=audio.createGain();
        fifth.type='sine';fifth.frequency.value=freq*1.5;
        fifthGain.gain.setValueAtTime(0,s.start+scene.start);
        fifthGain.gain.linearRampToValueAtTime(fifthGainVal,s.start+scene.start+0.12);
        fifthGain.gain.setValueAtTime(fifthGainVal,s.start+scene.end-0.18);
        fifthGain.gain.linearRampToValueAtTime(0,s.start+scene.end);
        fifth.connect(fifthGain);fifthGain.connect(master);
        fifth.start(s.start+scene.start);fifth.stop(s.start+scene.end);
        s.nodes.push(fifth);
      }
      let last=-1;function frame(){if(state!==s||s.discard)return;const elapsed=Math.max(0,audio.currentTime-s.start),scene=CodeAliveMovie.draw(ctx,p,elapsed,{webcam:s.camVideo});$('movie-position').textContent=`Scene ${scene.index+1}/${p.scenes.length} · ${Math.min(elapsed,p.seconds).toFixed(1)} / ${p.seconds.toFixed(1)}s`;
        if(scene.index!==last){
          last=scene.index;$('movie-scene-status').textContent=`Scene ${scene.index+1} of ${p.scenes.length}. ${scene.caption}`;onRange(scene.range);
          if(!record && !narration && typeof window!=='undefined' && window.speechSynthesis){
            try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(scene.caption);u.rate=1.05;window.speechSynthesis.speak(u);}catch{}
          }
        }
        if(elapsed>=p.seconds){s.finished=true;stop();return;}s.raf=requestAnimationFrame(frame);}frame();s.watchdog=setTimeout(()=>{if(state===s){stop(true);status('Playback stalled. Keep this view visible and try again.');}},(p.seconds+8)*1000);status(record?'Recording in real time. Keep this view visible.':'Previewing narration and scene timing.');
    }catch(e){if(s){s.discard=true;if(s.recorder?.state==='recording')s.recorder.stop();else cleanup(s);}status(e.message);}}
    $('movie-play').onclick=()=>start(false);$('movie-record').onclick=()=>start(true);$('movie-stop').onclick=()=>stop();
    // Codec lists contain commas; base64 follows the final comma in a data URL.
    $('movie-save').onclick=()=>{if(!blob)return;if(host){const reader=new FileReader();reader.onload=()=>host.postMessage({type:'saveExplanationVideo',base64:String(reader.result).split(',').pop(),format:blob.type.includes('mp4')?'mp4':'webm'});reader.onerror=()=>status('Could not read the recording.');reader.readAsDataURL(blob);}else{const a=document.createElement('a');a.href=url;a.download='codealive-explanation.'+(blob.type.includes('mp4')?'mp4':'webm');a.click();}};
    if($('movie-export-subtitles'))$('movie-export-subtitles').onclick=()=>{try{const p=readPlan(),format=$('movie-sub-format')?.value||'srt';const content=format==='vtt'?CodeAliveMovie.toVTT(p):CodeAliveMovie.toSRT(p);if(host){host.postMessage({type:'saveSubtitles',content,format});}else{const a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(content);a.download=`codealive-explanation.${format}`;a.click();status('Subtitles exported.');}}catch(e){status(e.message);}};
    async function loadNarrationBuffer(arrayBuffer,name='Generated_Voice.wav',updatedScenes,summary){
      try{
        const Audio=root.AudioContext||root.webkitAudioContext;
        if(!Audio)throw Error('Web Audio is unavailable.');
        const audio=new Audio({sampleRate:48000});
        const buffer=await audio.decodeAudioData(arrayBuffer);
        narration=buffer;
        narrationName=name;
        if(Array.isArray(updatedScenes)&&updatedScenes.length===scenes.length){
          updatedScenes.forEach((s,i)=>{if(s.duration)scenes[i].duration=s.duration;});
          renderScenes();
        }
        audioNote(readPlan());
        status(`🎙️ Voice narration loaded (${buffer.duration.toFixed(1)}s).${summary||''} Ready to preview or record.`);
        await audio.close();
        controls(false);
      }catch(e){
        status('Failed to load narration audio: '+e.message);
      }
    }
    function narrationBusy(on){
      const cancel=$('movie-ai-voice-cancel'),go=$('movie-ai-voice');
      if(cancel)cancel.hidden=!on;
      if(go)go.disabled=on;
    }
    function handleNarrationProgress(msg){
      if(msg.phase==='start')status(`Generating voice with the "${msg.engine}" engine…${msg.warnings?.length?' '+msg.warnings.join(' '):''}`);
      else if(msg.phase==='scene')status(`Generating voice: scene ${msg.index+1} of ${msg.total}${msg.cached?' (reused)':''}…`);
    }
    function handleNarrationGenerated(msg){
      narrationBusy(false);
      if(!msg.ok||!msg.base64){status(msg.cancelled?'Voice generation cancelled. Your script is unchanged.':(msg.error||'Narration generation failed.'));return;}
      const bin=atob(msg.base64),bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      // Durations only grow to fit the speech, so name each scene that changed.
      const changes=(msg.changes||[]).map(c=>`scene ${c.index+1} ${c.from.toFixed(1)}→${c.to.toFixed(1)}s`);
      const parts=[` Engine: ${msg.engine}${msg.cached?`, ${msg.cached} of ${msg.spoken} reused`:''}.`,changes.length?` Lengthened to fit the speech: ${changes.join(', ')}.`:' Scene timing unchanged.'];
      loadNarrationBuffer(bytes.buffer,msg.name||'AI_Narration.wav',msg.scenes,parts.join(''));
    }
    function applyScript(res,notice){
      if(res.title)$('movie-title').value=res.title;
      overlay=res.overlay||null;
      scenes=(res.scenes||[]).map(s=>({enabled:true,duration:s.duration||4,caption:s.caption||'',range:{...s.range},...(s.visual?{visual:s.visual}:{})}));
      renderScenes();
      status(notice||'AI script loaded. Review captions and scene durations.');
    }
    function handleAIScript(message){
      if(message.ok&&message.script){
        mode='ai';
        applyScript(message.script,message.notice);
      }else{
        status(message.error||'AI script generation failed.');
      }
    }
    if($('movie-ai-build'))$('movie-ai-build').onclick=()=>{
      try{
        const current=getContext();
        if(!current)throw Error('Explain a function first.');
        source=current.code;
        mode='ai';
        if(host){
          status('Asking AI to generate explanation scenes...');
          host.postMessage({type:'requestAIScript',code:current.code,language:current.language});
        }else{
          const res=root.CodeAliveAIScript?.heuristicScript(current.code,{language:current.language});
          if(!res?.ok)throw Error(res?.error||'Could not generate script.');
          applyScript(res,'Generated pedagogical script with local heuristic engine. Review captions and durations.');
        }
      }catch(e){status(e.message);}
    };
    if($('movie-ai-voice'))$('movie-ai-voice').onclick=()=>{
      try{
        if(!scenes.length)throw Error('Generate or build scenes first.');
        if(!host)throw Error('Voice generation needs the VS Code extension. Import a recording, or preview with your browser\'s speech.');
        const voice=$('movie-voice')?.value||'en-US-AndrewMultilingualNeural';
        narrationBusy(true);
        status('Starting voice generation…');
        host.postMessage({type:'synthesizeNarration',scenes,voice});
      }catch(e){status(e.message);}
    };
    if($('movie-ai-voice-cancel'))$('movie-ai-voice-cancel').onclick=()=>{if(host)host.postMessage({type:'cancelNarration'});};
    if($('movie-complex-sample'))$('movie-complex-sample').onchange=()=>{
      const val=$('movie-complex-sample').value;
      if(!val)return;
      const sample=root.CodeAliveAIScript?.samples?.[val];
      if(!sample)return;
      $('source').value=sample.code;
      if($('language'))$('language').value=sample.language;
      $('source').dispatchEvent(new Event('input'));
      setContext();
      if($('movie-ai-build'))$('movie-ai-build').click();
    };
    if($('movie-ai-prompt'))$('movie-ai-prompt').onclick=()=>{
      try{
        const current=getContext();
        if(!current)throw Error('Explain a function first.');
        const promptText=root.CodeAliveAIScript?.buildPrompt(current.code,{language:current.language})||'';
        if(navigator.clipboard?.writeText){
          navigator.clipboard.writeText(promptText);
          status('AI prompt copied to clipboard. Paste into your AI model, then click Paste AI JSON.');
        }else{
          status('Clipboard unavailable. Copy your code into your AI model for a script.');
        }
      }catch(e){status(e.message);}
    };
const SAMPLE_EXPLAINER={title:'Why MCP needs Code Mode',overlay:{handle:'@yourhandle',tag:'MCP TODAY',badge:{label:'THE FIX',text:'???'}},scenes:[
      {caption:'An MCP server sits between the agent and every tool it can call.',startLine:1,endLine:1,duration:5,visual:{type:'diagram',left:'AI',leftNote:'AI AGENT',hub:'MCP',hubNote:'STANDARD PROTOCOL',items:['calendar','database','email']}},
      {caption:'But every tool definition is loaded into the context window up front.',startLine:1,endLine:1,duration:6,visual:{type:'table',columns:['MCP SERVER','TOOLS'],rows:[['GitHub','35'],['Slack','11'],['Sentry','5'],['Grafana','5'],['Splunk','2']],highlight:2,note:'Illustrative numbers. Replace with your own.'}},
      {caption:'A large API can use more than the whole window before any work starts.',startLine:1,endLine:1,duration:6,visual:{type:'meter',value:5.85,label:'CONTEXT WINDOW',sub:'200K TOKENS',big:'1,170,000',unit:'TOKENS',note:'Illustrative numbers. Replace with your own.'}},
      {caption:'Code Mode lets the AI write a short program instead.',startLine:1,endLine:1,duration:6,visual:{type:'typed',file:'trip.ts',badge:'written by the AI',code:'for (const item of list) {\n  if (soldOut(item))\n    item = swap(item)\n  grab(item)\n}\nreturn cart'}}]};
    if($('movie-ai-sample'))$('movie-ai-sample').onclick=()=>{
      try{
        const current=getContext();
        if(!current)throw Error('Explain a function first.');
        source=current.code;mode='ai';
        const res=root.CodeAliveAIScript?.parseScript(current.code,SAMPLE_EXPLAINER);
        if(!res?.ok)throw Error(res?.error||'Could not load the sample.');
        applyScript(res,'Sample explainer loaded. Replace the captions and numbers with your own, then tick Presenter webcam if you want your camera in the frame.');
      }catch(e){status(e.message);}
    };
    if($('movie-ai-paste'))$('movie-ai-paste').onclick=()=>{
      try{
        const current=getContext();
        if(!current)throw Error('Explain a function first.');
        const text=prompt('Paste the AI script JSON:');
        if(!text)return;
        source=current.code;
        mode='ai';
        const res=root.CodeAliveAIScript?.parseScript(current.code,text);
        if(!res?.ok)throw Error(res?.error||'Invalid script JSON.');
        applyScript(res,'Pasted AI script applied. Review captions and scene durations.');
      }catch(e){status(e.message);}
    };
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state){stop(true);status('Stopped because the view was hidden. Keep it visible during preview or recording.');}});
    return {clear,setContext(){setContext();stepRange();},getBlob:()=>blob,getState:()=>state?{recording:!!state.recorder,seconds:state.plan.seconds}:null,handleAIScript,handleNarrationGenerated,handleNarrationProgress};
  }};
})(globalThis);
