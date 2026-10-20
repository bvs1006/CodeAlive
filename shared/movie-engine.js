(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CodeAliveMovie=factory();})(globalThis,function(){
  'use strict';
  function plan(source,scenes,options={}){
    if(typeof source!=='string'||source.length>50000)throw Error('Video source is limited to 50,000 characters.');
    const selected=scenes.filter(s=>s.enabled!==false);if(!selected.length||selected.length>20)throw Error('Choose between 1 and 20 scenes.');let seconds=0;
    const result=selected.map((s,index)=>{
      const duration=Number(s.duration),r=s.range;
      if(!Number.isFinite(duration)||duration<0.5||duration>15)throw Error('Each scene needs 0.5–15 seconds.');
      if(typeof s.caption!=='string'||!s.caption.trim()||s.caption.length>240)throw Error('Each scene needs 1–240 caption characters.');
      if(!r||!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end<=r.start||r.end>source.length)throw Error('Scene source ranges are stale. Build the script again.');
      const start=seconds;seconds+=duration;return {index,caption:s.caption.trim(),range:{...r},start,end:seconds,duration};
    });
    if(seconds>120)throw Error('A video can contain at most 120 seconds.');
    return {source,scenes:result,seconds,title:String(options.title||'A closer look at the code').slice(0,80),hideSource:!!options.hideSource,mode:options.mode==='replay'?'Captured replay':options.mode==='ai'?'AI explanation':'Static explanation',aspectRatio:options.aspectRatio==='16:9'?'16:9':'9:16',showCaptions:options.showCaptions!==false};
  }
  function sceneAt(p,time){return p.scenes.find(s=>time<s.end)||p.scenes.at(-1);}
  function lines(ctx,text,width){const result=[];let line='';for(const char of String(text).replace(/\s+/g,' ')){if(ctx.measureText(line+char).width>width&&line){const last=line.lastIndexOf(' ');if(last>line.length/2){result.push(line.slice(0,last));line=line.slice(last+1)+char;}else{result.push(line);line=char;}}else line+=char;}if(line)result.push(line);return result;}
  function formatTimestamp(seconds,delimiter=','){
    const totalMs=Math.max(0,Math.round(seconds*1000)),ms=totalMs%1000,totalS=Math.floor(totalMs/1000),s=totalS%60,totalM=Math.floor(totalS/60),m=totalM%60,h=Math.floor(totalM/60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${delimiter}${String(ms).padStart(3,'0')}`;
  }
  function toSRT(p){return p.scenes.map((s,i)=>`${i+1}\n${formatTimestamp(s.start,',')} --> ${formatTimestamp(s.end,',')}\n${s.caption}\n`).join('\n');}
  function toVTT(p){return 'WEBVTT\n\n'+p.scenes.map((s,i)=>`${i+1}\n${formatTimestamp(s.start,'.')} --> ${formatTimestamp(s.end,'.')}\n${s.caption}\n`).join('\n');}
  function draw(ctx,p,time){
    const scene=sceneAt(p,time),t=Math.max(0,Math.min(time,p.seconds));
    if(p.aspectRatio==='16:9'){
      ctx.fillStyle='#0b1018';ctx.fillRect(0,0,1920,1080);ctx.fillStyle='#a4edcf';ctx.fillRect(72,70,7,36);ctx.font='600 24px sans-serif';ctx.fillText('CODEALIVE  /  EXPLAIN',96,96);
      ctx.fillStyle='#e8eef5';ctx.font='600 44px sans-serif';lines(ctx,p.title,760).slice(0,2).forEach((line,i)=>ctx.fillText(line,72,175+i*54));
      ctx.fillStyle='#a4edcf';ctx.font='24px monospace';ctx.fillText(`SCENE ${String(scene.index+1).padStart(2,'0')} / ${p.scenes.length}`,72,305);
      ctx.fillStyle='#e8eef5';ctx.font='36px sans-serif';const caption=lines(ctx,scene.caption,760);caption.slice(0,7).forEach((line,i)=>ctx.fillText(line+(i===6&&caption.length>7?'…':''),72,375+i*48));
      ctx.fillStyle='#29374a';ctx.fillRect(72,920,760,6);ctx.fillStyle='#a4edcf';ctx.fillRect(72,920,760*t/p.seconds,6);ctx.font='24px monospace';ctx.fillText(`${t.toFixed(1)}s / ${p.seconds.toFixed(1)}s`,72,970);
      ctx.fillStyle='#9eafc3';ctx.font='22px sans-serif';ctx.fillText(p.mode+' · reviewed script',72,1020);
      ctx.fillStyle='#14202e';ctx.fillRect(880,60,968,960);
      if(p.hideSource){ctx.fillStyle='#a4edcf';ctx.font='38px sans-serif';ctx.fillText('Source panel hidden',940,520);ctx.fillStyle='#9eafc3';ctx.font='26px sans-serif';ctx.fillText('Follow the explanation on the left.',940,575);}
      else{
        const sourceLines=p.source.split('\n'),lineNumber=p.source.slice(0,scene.range.start).split('\n').length,first=Math.max(0,lineNumber-5),last=Math.min(sourceLines.length,first+(p.showCaptions!==false?14:18));let offset=sourceLines.slice(0,first).reduce((n,line)=>n+line.length+1,0);
        ctx.fillStyle='#9eafc3';ctx.font='24px monospace';ctx.fillText(`SOURCE · L${lineNumber}`,916,114);
        for(let i=first;i<last;i++){
          const full=sourceLines[i],line=full.slice(0,56)+(full.length>56?'…':''),y=175+(i-first)*44,a=Math.max(0,scene.range.start-offset),b=Math.min(56,full.length,scene.range.end-offset);
          ctx.font='27px monospace';if(a<b){ctx.fillStyle='#29483f';const x=990+ctx.measureText(line.slice(0,a)).width;ctx.fillRect(x,y-30,ctx.measureText(line.slice(a,b)).width,39);}
          ctx.fillStyle='#7890a6';ctx.font='22px monospace';ctx.fillText(String(i+1),916,y);ctx.fillStyle='#e8eef5';ctx.font='27px monospace';ctx.fillText(line,990,y);offset+=full.length+1;
        }
      }
      if(p.showCaptions!==false){
        ctx.fillStyle='rgba(15,23,42,0.92)';ctx.fillRect(896,864,936,136);
        if(ctx.strokeRect){ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;ctx.strokeRect(896,864,936,136);}
        ctx.fillStyle='#38bdf8';ctx.font='bold 18px monospace';ctx.fillText('CC · SUBTITLE',916,894);
        ctx.fillStyle='#ffffff';ctx.font='bold 26px sans-serif';const subLines=lines(ctx,scene.caption,896);subLines.slice(0,2).forEach((l,idx)=>ctx.fillText(l,916,932+idx*32));
      }
      return scene;
    }
    ctx.fillStyle='#0b1018';ctx.fillRect(0,0,1080,1920);ctx.fillStyle='#a4edcf';ctx.fillRect(72,80,7,38);ctx.font='600 26px sans-serif';ctx.fillText('CODEALIVE  /  EXPLAIN',100,108);
    ctx.fillStyle='#e8eef5';ctx.font='600 56px sans-serif';lines(ctx,p.title,930).slice(0,2).forEach((line,i)=>ctx.fillText(line,72,214+i*68));
    ctx.fillStyle='#a4edcf';ctx.font='26px monospace';ctx.fillText(`SCENE ${String(scene.index+1).padStart(2,'0')} / ${p.scenes.length}`,72,370);
    ctx.fillStyle='#e8eef5';ctx.font='48px sans-serif';const caption=lines(ctx,scene.caption,936);caption.slice(0,6).forEach((line,i)=>ctx.fillText(line+(i===5&&caption.length>6?'…':''),72,452+i*61));
    ctx.fillStyle='#14202e';ctx.fillRect(72,860,936,744);
    if(p.hideSource){ctx.fillStyle='#a4edcf';ctx.font='42px sans-serif';ctx.fillText('Source panel hidden',126,1120);ctx.fillStyle='#9eafc3';ctx.font='28px sans-serif';ctx.fillText('Follow the explanation above.',126,1180);}
    else{
      const sourceLines=p.source.split('\n'),lineNumber=p.source.slice(0,scene.range.start).split('\n').length,first=Math.max(0,lineNumber-4),last=Math.min(sourceLines.length,first+(p.showCaptions!==false?11:13));let offset=sourceLines.slice(0,first).reduce((n,line)=>n+line.length+1,0);
      ctx.fillStyle='#9eafc3';ctx.font='24px monospace';ctx.fillText(`SOURCE · L${lineNumber}`,106,918);
      for(let i=first;i<last;i++){
        const full=sourceLines[i],line=full.slice(0,47)+(full.length>47?'…':''),y=980+(i-first)*44,a=Math.max(0,scene.range.start-offset),b=Math.min(47,full.length,scene.range.end-offset);
        ctx.font='27px monospace';if(a<b){ctx.fillStyle='#29483f';const x=180+ctx.measureText(line.slice(0,a)).width;ctx.fillRect(x,y-30,ctx.measureText(line.slice(a,b)).width,39);}
        ctx.fillStyle='#7890a6';ctx.font='22px monospace';ctx.fillText(String(i+1),100,y);ctx.fillStyle='#e8eef5';ctx.font='27px monospace';ctx.fillText(line,180,y);offset+=full.length+1;
      }
    }
    if(p.showCaptions!==false){
      ctx.fillStyle='rgba(15,23,42,0.94)';ctx.fillRect(72,1516,936,160);
      if(ctx.strokeRect){ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;ctx.strokeRect(72,1516,936,160);}
      ctx.fillStyle='#38bdf8';ctx.font='bold 20px monospace';ctx.fillText('CC · SUBTITLE',96,1550);
      ctx.fillStyle='#ffffff';ctx.font='bold 30px sans-serif';const subLines=lines(ctx,scene.caption,888);subLines.slice(0,2).forEach((l,idx)=>ctx.fillText(l,96,1594+idx*38));
    }
    ctx.fillStyle='#29374a';ctx.fillRect(72,1716,936,6);ctx.fillStyle='#a4edcf';ctx.fillRect(72,1716,936*t/p.seconds,6);ctx.font='26px monospace';ctx.fillText(`${t.toFixed(1)}s / ${p.seconds.toFixed(1)}s`,72,1774);
    ctx.fillStyle='#9eafc3';ctx.font='24px sans-serif';ctx.fillText(p.mode+' · reviewed script',72,1850);return scene;
  }
  return {plan,sceneAt,draw,lines,formatTimestamp,toSRT,toVTT};
});
