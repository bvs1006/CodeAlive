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
    return {source,scenes:result,seconds,title:String(options.title||'A closer look at the code').slice(0,80),hideSource:!!options.hideSource,mode:options.mode==='replay'?'Captured replay':'Static explanation'};
  }
  function sceneAt(p,time){return p.scenes.find(s=>time<s.end)||p.scenes.at(-1);}
  function lines(ctx,text,width){const result=[];let line='';for(const char of String(text).replace(/\s+/g,' ')){if(ctx.measureText(line+char).width>width&&line){const last=line.lastIndexOf(' ');if(last>line.length/2){result.push(line.slice(0,last));line=line.slice(last+1)+char;}else{result.push(line);line=char;}}else line+=char;}if(line)result.push(line);return result;}
  function draw(ctx,p,time){
    const scene=sceneAt(p,time),t=Math.max(0,Math.min(time,p.seconds));
    ctx.fillStyle='#0b1018';ctx.fillRect(0,0,1080,1920);ctx.fillStyle='#a4edcf';ctx.fillRect(72,80,7,38);ctx.font='600 26px sans-serif';ctx.fillText('CODEALIVE  /  EXPLAIN',100,108);
    ctx.fillStyle='#e8eef5';ctx.font='600 56px sans-serif';lines(ctx,p.title,930).slice(0,2).forEach((line,i)=>ctx.fillText(line,72,214+i*68));
    ctx.fillStyle='#a4edcf';ctx.font='26px monospace';ctx.fillText(`SCENE ${String(scene.index+1).padStart(2,'0')} / ${p.scenes.length}`,72,370);
    ctx.fillStyle='#e8eef5';ctx.font='48px sans-serif';const caption=lines(ctx,scene.caption,936);caption.slice(0,6).forEach((line,i)=>ctx.fillText(line+(i===5&&caption.length>6?'…':''),72,452+i*61));
    ctx.fillStyle='#14202e';ctx.fillRect(72,860,936,744);
    if(p.hideSource){ctx.fillStyle='#a4edcf';ctx.font='42px sans-serif';ctx.fillText('Source panel hidden',126,1120);ctx.fillStyle='#9eafc3';ctx.font='28px sans-serif';ctx.fillText('Follow the explanation above.',126,1180);}
    else{
      const sourceLines=p.source.split('\n'),lineNumber=p.source.slice(0,scene.range.start).split('\n').length,first=Math.max(0,lineNumber-4),last=Math.min(sourceLines.length,first+13);let offset=sourceLines.slice(0,first).reduce((n,line)=>n+line.length+1,0);
      ctx.fillStyle='#9eafc3';ctx.font='24px monospace';ctx.fillText(`SOURCE · L${lineNumber}`,106,918);
      for(let i=first;i<last;i++){
        const full=sourceLines[i],line=full.slice(0,47)+(full.length>47?'…':''),y=980+(i-first)*44,a=Math.max(0,scene.range.start-offset),b=Math.min(47,full.length,scene.range.end-offset);
        ctx.font='27px monospace';if(a<b){ctx.fillStyle='#29483f';const x=180+ctx.measureText(line.slice(0,a)).width;ctx.fillRect(x,y-30,ctx.measureText(line.slice(a,b)).width,39);}
        ctx.fillStyle='#7890a6';ctx.font='22px monospace';ctx.fillText(String(i+1),100,y);ctx.fillStyle='#e8eef5';ctx.font='27px monospace';ctx.fillText(line,180,y);offset+=full.length+1;
      }
    }
    ctx.fillStyle='#29374a';ctx.fillRect(72,1716,936,6);ctx.fillStyle='#a4edcf';ctx.fillRect(72,1716,936*t/p.seconds,6);ctx.font='26px monospace';ctx.fillText(`${t.toFixed(1)}s / ${p.seconds.toFixed(1)}s`,72,1774);
    ctx.fillStyle='#9eafc3';ctx.font='24px sans-serif';ctx.fillText(p.mode+' · reviewed script',72,1850);return scene;
  }
  return {plan,sceneAt,draw,lines};
});
