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
      const start=seconds;seconds+=duration;return {index,caption:s.caption.trim(),range:{...r},start,end:seconds,duration,visual:cleanVisual(s.visual)};
    });
    if(seconds>120)throw Error('A video can contain at most 120 seconds.');
    return {source,scenes:result,seconds,title:String(options.title||'A closer look at the code').slice(0,80),overlay:cleanOverlay(options.overlay),webcam:options.webcam===true,hideSource:!!options.hideSource,mode:options.mode==='replay'?'Captured replay':options.mode==='ai'?'AI explanation':'Static explanation',aspectRatio:options.aspectRatio==='16:9'?'16:9':'9:16',showCaptions:options.showCaptions!==false};
  }
  function sceneAt(p,time){return p.scenes.find(s=>time<s.end)||p.scenes.at(-1);}
  function lines(ctx,text,width){const result=[];let line='';for(const char of String(text).replace(/\s+/g,' ')){if(ctx.measureText(line+char).width>width&&line){const last=line.lastIndexOf(' ');if(last>line.length/2){result.push(line.slice(0,last));line=line.slice(last+1)+char;}else{result.push(line);line=char;}}else line+=char;}if(line)result.push(line);return result;}
  function formatTimestamp(seconds,delimiter=','){
    const totalMs=Math.max(0,Math.round(seconds*1000)),ms=totalMs%1000,totalS=Math.floor(totalMs/1000),s=totalS%60,totalM=Math.floor(totalS/60),m=totalM%60,h=Math.floor(totalM/60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${delimiter}${String(ms).padStart(3,'0')}`;
  }
  function toSRT(p){return p.scenes.map((s,i)=>`${i+1}\n${formatTimestamp(s.start,',')} --> ${formatTimestamp(s.end,',')}\n${s.caption}\n`).join('\n');}
  function toVTT(p){return 'WEBVTT\n\n'+p.scenes.map((s,i)=>`${i+1}\n${formatTimestamp(s.start,'.')} --> ${formatTimestamp(s.end,'.')}\n${s.caption}\n`).join('\n');}
  const MINT='#a4edcf',RED='#ff5a3c',INK='#e8eef5',MUTED='#9eafc3',BLUE='#38bdf8',PANEL='#14202e',DEEP='#0b1018';
  const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
  function cleanVisual(v){
    if(!v||typeof v!=='object')return null;
    if(v.type==='diagram'){
      const items=Array.isArray(v.items)?v.items.slice(0,4).map(i=>text(typeof i==='string'?i:i&&i.label,16)).filter(Boolean):[];
      if(!items.length)return null;
      return {type:'diagram',left:text(v.left,12),hub:text(v.hub,8),leftNote:text(v.leftNote,20),hubNote:text(v.hubNote,24),items};
    }
    if(v.type==='meter'){
      const value=Number(v.value);if(!Number.isFinite(value)||value<0||value>20)return null;
      return {type:'meter',value,label:text(v.label,24),sub:text(v.sub,24),big:text(v.big,16),unit:text(v.unit,16),note:text(v.note,140)};
    }
    if(v.type==='table'){
      const columns=Array.isArray(v.columns)?v.columns.slice(0,3).map(c=>text(c,12)):[];
      const rows=Array.isArray(v.rows)?v.rows.slice(0,6).map(r=>Array.isArray(r)?columns.map((_,i)=>text(String(r[i]==null?'':r[i]),16)):null).filter(r=>r&&r[0]):[];
      if(!columns.length||!columns[0]||!rows.length)return null;
      const highlight=Number.isInteger(v.highlight)&&v.highlight>=0&&v.highlight<=rows.length?v.highlight:rows.length;
      return {type:'table',columns,rows,highlight,note:text(v.note,100)};
    }
    if(v.type==='typed'){
      const code=typeof v.code==='string'?v.code.replace(/\t/g,'  ').slice(0,600):'';
      if(!code.trim()||code.split('\n').length>12)return null;
      return {type:'typed',code,file:text(v.file,24),badge:text(v.badge,24)};
    }
    return null;
  }
  function cleanOverlay(o){
    if(!o||typeof o!=='object')return null;
    const badge=o.badge&&typeof o.badge==='object'?{label:text(o.badge.label,16),text:text(o.badge.text,8)}:null;
    const result={tag:text(o.tag,24),handle:text(o.handle,32),badge:badge&&(badge.label||badge.text)?badge:null};
    return result.tag||result.handle||result.badge?result:null;
  }
  const ease=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
  function frame(ctx,x,y,w,h,color,width=3){
    if(!ctx.strokeRect)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(x,y,w,h);
  }
  function line(ctx,x1,y1,x2,y2,color,width=3){
    if(!ctx.beginPath||!ctx.stroke)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function dot(ctx,x,y,r,color){
    if(!ctx.beginPath||!ctx.arc||!ctx.fill)return;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function centered(ctx,str,cx,y,font,color){
    ctx.font=font;ctx.fillStyle=color;const w=ctx.measureText(str).width;ctx.fillText(str,cx-w/2,y);
  }
  function drawDiagram(ctx,v,x,y,w,h,lt){
    const cy=y+h/2-20,leftW=170,hubX=x+330,hubW=96,itemX=x+640,itemW=250,n=v.items.length,gap=h<700?24:32,itemH=Math.min(120,(h-80-gap*(n-1))/n);
    const top=y+40,hubY=top,hubH=h-120;
    frame(ctx,x+30,cy-leftW/2,leftW,leftW,RED);centered(ctx,v.left||'IN',x+30+leftW/2,cy+16,'700 48px sans-serif',INK);
    if(v.leftNote)centered(ctx,v.leftNote,x+30+leftW/2,cy+leftW/2+40,'24px monospace',MUTED);
    frame(ctx,hubX,hubY,hubW,hubH,RED);centered(ctx,v.hub||'HUB',hubX+hubW/2,hubY+44,'700 30px sans-serif',INK);
    if(v.hubNote)centered(ctx,v.hubNote,hubX+hubW/2,hubY+hubH+40,'24px monospace',MUTED);
    const a=ease(lt/0.3);line(ctx,x+30+leftW,cy,x+30+leftW+(hubX-x-30-leftW)*a,cy,RED);
    v.items.forEach((label,i)=>{
      const iy=top+i*(itemH+gap)+(h-120-n*itemH-(n-1)*gap)/2,my=iy+itemH/2,k=ease((lt-0.3-i*0.12)/0.4);
      frame(ctx,itemX,iy,itemW,itemH,k>0.05?RED:'#4a2a2a');
      centered(ctx,label,itemX+itemW/2,my+10,'600 30px monospace',k>0.05?INK:MUTED);
      const sx=hubX+hubW;line(ctx,sx,my,sx+(itemX-sx)*k,my,RED);
      if(k>0&&k<1)dot(ctx,sx+(itemX-sx)*k,my,7,INK);else if(k>=1)dot(ctx,itemX,my,7,INK);
    });
  }
  function drawMeter(ctx,v,x,y,w,h,lt){
    const e=ease(lt/0.85),shown=v.value*e,over=shown>1,color=over?RED:MINT,bx=x+40,by=y+30,bw=210,bh=h-110;
    ctx.fillStyle=DEEP;ctx.fillRect(bx,by,bw,bh);
    const fill=Math.min(1,shown)*(bh-12);ctx.fillStyle=color;ctx.fillRect(bx+6,by+bh-6-fill,bw-12,fill);
    frame(ctx,bx,by,bw,bh,over?RED:MUTED);
    const pct=over?`×${shown.toFixed(2)}`:`${(shown*100).toFixed(1)}%`;
    centered(ctx,pct,bx+bw/2,by+54,'700 44px sans-serif',over?RED:INK);
    if(over)centered(ctx,'OVER LIMIT',bx+bw/2,by+96,'700 22px monospace',RED);
    if(v.label)centered(ctx,v.label,bx+bw/2,by+bh+36,'24px monospace',INK);
    if(v.sub)centered(ctx,v.sub,bx+bw/2,by+bh+68,'22px monospace',MUTED);
    const rx=x+310;
    if(v.big){ctx.font='700 76px sans-serif';ctx.fillStyle=over?RED:INK;ctx.fillText(v.big,rx,y+h/2-20);
      if(v.unit){const bw2=ctx.measureText(v.big).width;ctx.font='26px monospace';ctx.fillStyle=over?RED:MUTED;ctx.fillText(v.unit,rx+(bw2||0)+16,y+h/2-20);}}
    if(v.note){ctx.font='26px monospace';ctx.fillStyle=MUTED;lines(ctx,v.note,w-rx+x-30).slice(0,5).forEach((l,i)=>ctx.fillText(l,rx,y+h/2+40+i*38));}
  }
  function drawTable(ctx,v,x,y,w,h,lt){
    const pad=36,tx=x+pad,tw=w-pad*2,first=v.columns.length>1?tw*0.5:tw,rest=v.columns.length>1?(tw-first)/(v.columns.length-1):0,colX=i=>tx+(i?first+(i-1)*rest:0)+(i?24:0),rowH=Math.min(84,(h-190)/v.rows.length);
    ctx.fillStyle=DEEP;ctx.fillRect(x+16,y+16,w-32,h-(v.note?110:32));frame(ctx,x+16,y+16,w-32,h-(v.note?110:32),MUTED,2);
    ctx.font='22px monospace';ctx.fillStyle=MUTED;v.columns.forEach((c,i)=>ctx.fillText(c,colX(i),y+68));
    line(ctx,tx,y+88,tx+tw,y+88,'#29374a',2);
    v.rows.forEach((row,r)=>{
      const k=ease((lt-r*0.12)/0.3),on=r<v.highlight,ry=y+88+rowH*(r+1)-rowH/2+14;
      if(ctx.globalAlpha!==undefined)ctx.globalAlpha=k;
      row.forEach((cell,i)=>{ctx.font=i?'600 32px monospace':'700 44px sans-serif';ctx.fillStyle=on?INK:'#6b7a90';ctx.fillText(cell,colX(i),ry);});
      if(ctx.globalAlpha!==undefined)ctx.globalAlpha=1;
      if(r<v.rows.length-1)line(ctx,tx,y+88+rowH*(r+1),tx+tw,y+88+rowH*(r+1),'#1b2736',1);
    });
    if(v.note){ctx.font='24px monospace';ctx.fillStyle=MUTED;lines(ctx,'↳ '+v.note,w-pad*2).slice(0,2).forEach((l,i)=>ctx.fillText(l,tx,y+h-52+i*30));}
  }
  const KEYWORDS=new Set(['for','if','else','of','in','return','const','let','var','function','while','new','await','async','class','import','from','def','print']);
  function drawTyped(ctx,v,x,y,w,h,lt){
    ctx.fillStyle=PANEL;ctx.fillRect(x,y,w,h);
    ctx.fillStyle=DEEP;ctx.fillRect(x+16,y+16,w-32,68);frame(ctx,x+16,y+16,w-32,68,BLUE,2);
    dot(ctx,x+52,y+50,10,'#ff5f57');dot(ctx,x+86,y+50,10,'#febc2e');dot(ctx,x+120,y+50,10,'#28c840');
    ctx.font='bold 28px monospace';ctx.fillStyle=INK;if(v.file)ctx.fillText(v.file,x+152,y+60);
    if(v.badge){ctx.font='24px monospace';ctx.fillStyle=RED;ctx.fillText(v.badge,x+w-32-24-ctx.measureText(v.badge).width,y+60);}
    frame(ctx,x+16,y+100,w-32,h-116,BLUE,2);
    const shown=Math.floor(v.code.length*ease(lt/0.85)),visible=v.code.slice(0,shown).split('\n'),size=Math.min(36,Math.floor((w-120)/Math.max(...v.code.split('\n').map(l=>l.length),1)/0.6));
    ctx.font=`${size}px monospace`;let endX=x+48,endY=y+170;
    visible.forEach((ln,i)=>{
      let cx=x+48;const cy=y+170+i*Math.min(56,(h-200)/Math.max(v.code.split('\n').length,1));
      for(const token of ln.match(/\s+|\w+|[^\w\s]/g)||[]){
        ctx.fillStyle=KEYWORDS.has(token)?RED:token.startsWith('//')?BLUE:INK;ctx.fillText(token,cx,cy);cx+=ctx.measureText(token).width;
      }
      endX=cx;endY=cy;
    });
    if(lt<1||Math.floor(lt*8)%2===0){ctx.fillStyle=RED;ctx.fillRect(endX+2,endY-size+6,4,size);}
  }
  function drawVisual(ctx,p,scene,t){
    const v=scene.visual;if(!v)return;
    const x=72,y=860,w=936,h=p.showCaptions!==false?640:744,lt=scene.duration>0?Math.max(0,Math.min(1,(t-scene.start)/scene.duration)):1;
    ctx.fillStyle=PANEL;ctx.fillRect(x,y,w,h);
    if(v.type==='diagram')drawDiagram(ctx,v,x,y,w,h,lt);
    else if(v.type==='meter')drawMeter(ctx,v,x,y,w,h,lt);
    else if(v.type==='table')drawTable(ctx,v,x,y,w,h,lt);
    else if(v.type==='typed')drawTyped(ctx,v,x,y,w,h,lt);
  }
  function drawOverlay(ctx,o){
    if(!o)return;
    if(o.handle){ctx.font='22px monospace';ctx.fillStyle=MUTED;ctx.fillText(o.handle,72,52);}
    if(o.badge){
      ctx.fillStyle='rgba(20,32,46,0.9)';ctx.fillRect(660,24,348,84);
      if(ctx.setLineDash)ctx.setLineDash([8,6]);frame(ctx,660,24,348,84,BLUE,2);if(ctx.setLineDash)ctx.setLineDash([]);
      ctx.font='bold 18px monospace';ctx.fillStyle=BLUE;ctx.fillText(o.badge.label,740,56);
      ctx.font='700 40px sans-serif';ctx.fillStyle=INK;ctx.fillText(o.badge.text,740,98);
    }
    if(o.tag){dot(ctx,80,144,7,RED);ctx.font='24px monospace';ctx.fillStyle=INK;ctx.fillText(o.tag,100,152);}
  }
  function drawWebcam(ctx,video){
    const vw=video&&video.videoWidth,vh=video&&video.videoHeight;if(!vw||!vh||!ctx.drawImage)return;
    const cx=192,cy=1796,r=108,side=Math.min(vw,vh);
    ctx.fillStyle=DEEP;ctx.fillRect(cx-r-12,cy-r-12,r*2+24,r*2+24);
    ctx.save?.();ctx.beginPath?.();ctx.arc?.(cx,cy,r,0,Math.PI*2);ctx.clip?.();
    ctx.drawImage(video,(vw-side)/2,(vh-side)/2,side,side,cx-r,cy-r,r*2,r*2);ctx.restore?.();
    if(ctx.arc&&ctx.stroke){ctx.strokeStyle=MINT;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
  }
  function draw(ctx,p,time,media){
    const scene=drawBase(ctx,p,time);
    if(p.aspectRatio!=='16:9'){drawVisual(ctx,p,scene,Math.max(0,Math.min(time,p.seconds)));drawOverlay(ctx,p.overlay);if(p.webcam&&media&&media.webcam)drawWebcam(ctx,media.webcam);}
    return scene;
  }
  function drawBase(ctx,p,time){
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
    ctx.fillStyle='#29374a';const barX=p.webcam?340:72,barW=1008-barX;ctx.fillRect(barX,1716,barW,6);ctx.fillStyle='#a4edcf';ctx.fillRect(barX,1716,barW*t/p.seconds,6);ctx.font='26px monospace';ctx.fillText(`${t.toFixed(1)}s / ${p.seconds.toFixed(1)}s`,barX,1774);
    ctx.fillStyle='#9eafc3';ctx.font='24px sans-serif';ctx.fillText(p.mode+' · reviewed script',p.webcam?340:72,1850);return scene;
  }
  return {plan,sceneAt,draw,lines,formatTimestamp,toSRT,toVTT};
});
