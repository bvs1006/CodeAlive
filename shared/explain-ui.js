(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const host = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
  let model = null, modelSource = '', currentSource = {baseLine:1,baseColumn:0}, selectedRange = null, replayView;
  const el = (tag,text,className) => {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
  const svg = (tag,attrs,text) => {const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
  const status = (text,error=false) => {$('status').textContent=text;$('status').classList.toggle('error',error);};
  function stats() {$('source-stats').textContent=`${$('source').value.split('\n').length} lines · ${$('source').value.length.toLocaleString()} characters`;}
  function invalidate() {replayView?.clear();model=null;selectedRange=null;currentSource={baseLine:1,baseColumn:0};$('result').hidden=true;$('empty-state').hidden=false;$('flow-panel').hidden=true;$('source-name').textContent='Playground';$('source-view').hidden=true;$('source').hidden=false;$('edit-code').hidden=true;stats();}
  function setSource(source) {
    invalidate();$('source').value=source.code;currentSource={baseLine:1,baseColumn:0,...source};
    if (![...$('language').options].some(o=>o.value===source.language))$('language').append(el('option',source.language));
    $('language').value=source.language;$('source-name').textContent=source.filename||'Playground';stats();
  }
  function sourceView(target) {
    const code=$('source').value;let offset=0;$('source-view').replaceChildren();
    for(const [index,line] of code.split('\n').entries()) {
      const row=el('div',undefined,'source-line'),number=el('span',String((currentSource.baseLine||1)+index),'line-number'),body=el('span',undefined,'line-text');
      const a=target?Math.max(0,target.start-offset):0,b=target?Math.min(line.length,target.end-offset):0;
      if(target && a<b){row.classList.add('highlighted');body.append(document.createTextNode(line.slice(0,a)),el('mark',line.slice(a,b)),document.createTextNode(line.slice(b)));}
      else body.textContent=line||' ';
      row.append(number,body);$('source-view').append(row);offset+=line.length+1;
    }
    $('source').hidden=true;$('source-view').hidden=false;$('edit-code').hidden=false;
    const first=$('source-view').querySelector('.highlighted');
    if(first)$('source-view').scrollTop=Math.max(0,first.offsetTop-$('source-view').offsetTop-60);
  }
  function activateRange(r) {
    if(!model || modelSource!==$('source').value)return;
    selectedRange=r;sourceView(r);
    document.querySelectorAll('[data-source-start]').forEach(n=>n.classList.toggle('active',Number(n.dataset.sourceStart)===r.start&&Number(n.dataset.sourceEnd)===r.end));
    if(host&&currentSource.sourceToken)host.postMessage({type:'revealSource',sourceToken:currentSource.sourceToken,start:r.start,end:r.end});
  }
  function lineLabel(r){const start=r.line+(currentSource.baseLine||1)-1,end=r.endLine+(currentSource.baseLine||1)-1;return start===end?'L'+start:`L${start}–${end}`;}
  function bindRange(node,r){node.dataset.sourceStart=r.start;node.dataset.sourceEnd=r.end;node.addEventListener('click',()=>activateRange(r));}
  function renderSteps() {
    $('steps').replaceChildren();
    for(const step of model.steps){const li=el('li'),button=el('button'),content=el('div');button.type='button';content.append(el('strong',step.title),el('small',lineLabel(step)),el('p',step[$('audience').value]));button.append(content);bindRange(button,step);li.append(button);$('steps').append(li);}
    if(selectedRange)document.querySelectorAll('#steps [data-source-start]').forEach(n=>n.classList.toggle('active',Number(n.dataset.sourceStart)===selectedRange.start&&Number(n.dataset.sourceEnd)===selectedRange.end));
  }
  function renderFacts() {
    $('summary-name').textContent=model.summary.name;$('summary-description').textContent=model.summary.description;
    const dl=el('dl');
    for(const [name,values,empty] of [['Inputs',model.summary.inputs,'No declared parameters in this scope.'],['Returns',model.summary.returns,'No explicit return expressions in this scope.']]){
      const dd=el('dd');if(!values.length)dd.textContent=empty;else values.forEach((v,i)=>{if(i)dd.append(el('br'));dd.append(el('code',v));});dl.append(el('dt',name),dd);
    }
    $('inputs-outputs').replaceChildren(dl,el('p',model.summary.outputNote));
    $('effects').replaceChildren(el('strong','Calls & property writes'));
    if(model.summary.effects.length){const ul=el('ul');for(const effect of model.summary.effects){const li=el('li');li.append(el('code',effect.text),document.createTextNode(' — '+effect.kind));ul.append(li);}$('effects').append(ul);}
    else $('effects').append(el('p','None detected in this scope. This does not establish purity or absence of side effects.'));
    $('warnings').replaceChildren(...model.warnings.map(w=>el('li',w)));
  }
  function renderGraph() {
    const {nodes,edges}=model.graph,canvas=$('flow');canvas.replaceChildren();$('flow-panel').hidden=!nodes.length;if(!nodes.length)return;
    const ranks=new Map(nodes.map(n=>[n.id,0])),incoming=new Map(nodes.map(n=>[n.id,0]));
    for(const e of edges)if(!e.back)incoming.set(e.to,incoming.get(e.to)+1);
    const queue=nodes.filter(n=>incoming.get(n.id)===0).map(n=>n.id);
    for(let i=0;i<queue.length;i++)for(const e of edges.filter(e=>e.from===queue[i]&&!e.back)){ranks.set(e.to,Math.max(ranks.get(e.to),ranks.get(e.from)+1));incoming.set(e.to,incoming.get(e.to)-1);if(incoming.get(e.to)===0)queue.push(e.to);}
    const layers=[];for(const n of nodes){const rank=ranks.get(n.id);(layers[rank]||=[]).push(n);}
    const width=Math.max(440,...layers.map(l=>(l?.length||0)*236+100)),height=layers.length*115+65,positions=new Map();
    canvas.setAttribute('width',width);canvas.setAttribute('height',height);canvas.setAttribute('viewBox',`0 0 ${width} ${height}`);
    layers.forEach((layer,rank)=>{layer.sort((a,b)=>(a.range?.start??-1)-(b.range?.start??-1));layer.forEach((n,i)=>positions.set(n.id,{x:width/2+(i-(layer.length-1)/2)*236,y:rank*115+35}));});
    const defs=svg('defs'),marker=svg('marker',{id:'arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#8da99c'}));defs.append(marker);canvas.append(defs);
    const paths=svg('g'),labels=svg('g');
    for(const e of edges){const a=positions.get(e.from),b=positions.get(e.to);let d,lx,ly;
      if(e.back){const side=25;d=`M ${a.x-96} ${a.y+31} H ${side} V ${b.y+31} H ${b.x-98}`;lx=side+8;ly=(a.y+b.y)/2+25;}
      else if(b.y-a.y>116){
        // Leave through the gap below this layer before entering an outer lane.
        // A horizontal line through the layer would cross unrelated branch nodes.
        const side=a.x<width/2?25:width-25,departure=a.y+80,arrival=b.y-18;
        d=`M ${a.x} ${a.y+62} V ${departure} H ${side} V ${arrival} H ${b.x} V ${b.y-2}`;lx=side+8;ly=departure-6;
      }
      else{const mid=(a.y+62+b.y)/2;d=`M ${a.x} ${a.y+62} V ${mid} H ${b.x} V ${b.y-2}`;lx=(a.x+b.x)/2+7;ly=mid-6;}
      paths.append(svg('path',{d,class:'flow-edge'+(e.back?' back':''),'marker-end':'url(#arrow)'}));if(e.label)labels.append(svg('text',{x:lx,y:ly,class:'edge-label'},e.label));
    }
    canvas.append(paths,labels);
    for(const n of nodes){const {x,y}=positions.get(n.id),g=svg('g',{class:'flow-node '+n.kind,transform:`translate(${x-96},${y})`});
      g.append(n.kind==='decision'?svg('polygon',{points:'20,0 172,0 192,31 172,62 20,62 0,31'}):svg('rect',{width:192,height:62,rx:['start','end'].includes(n.kind)?28:8}));
      const label=svg('text',{x:96,y:26,'text-anchor':'middle',class:'node-label'}),words=n.label.match(/.{1,25}(?:\s|$)|.{1,25}/g)||[n.label];
      words.slice(0,2).forEach((line,i)=>label.append(svg('tspan',{x:96,dy:i?16:0},line.trim()+(i===1&&words.length>2?'…':''))));g.append(label);
      g.append(svg('title',{},n.label+(n.range?' · '+lineLabel(n.range):'')));
      if(n.range){g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',n.label+' · '+lineLabel(n.range));bindRange(g,n.range);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateRange(n.range);}});}
      canvas.append(g);
    }
  }
  function explain(scopeId) {
    const result=CodeAliveExplain.analyze($('source').value,{language:$('language').value,scopeId});
    if(!result.ok){model=null;replayView?.clear();$('result').hidden=true;$('flow-panel').hidden=true;$('empty-state').hidden=false;status(result.error,true);return;}
    model=result;modelSource=$('source').value;selectedRange=null;
    $('scope').replaceChildren(...model.scopes.map(s=>{const option=el('option',s.name);option.value=s.id;return option;}));$('scope').value=model.scopeId;
    $('result').hidden=false;$('empty-state').hidden=true;renderFacts();renderSteps();renderGraph();sourceView();replayView?.setContext();status(`${model.steps.length} source-linked steps. Select a step or diagram node to inspect its code.`);
  }
  for(const example of CodeAliveExamples){const option=el('option',example.title);option.value=example.id;$('example-select').append(option);}
  const chosen=()=>CodeAliveExamples.find(e=>e.id===$('example-select').value);
  $('example-select').addEventListener('change',()=>{$('example-description').textContent=chosen().description;});
  $('load-example').addEventListener('click',()=>{setSource(chosen());status('Example loaded. Select Explain this code to begin.');});
  $('explain').addEventListener('click',()=>explain());$('scope').addEventListener('change',()=>explain($('scope').value));$('audience').addEventListener('change',()=>{if(model)renderSteps();});
  $('source').addEventListener('input',()=>{invalidate();status('Code updated. Explain it again to refresh the steps.');});
  $('language').addEventListener('change',()=>{invalidate();status('Language changed. Your code is preserved.');});
  $('edit-code').addEventListener('click',()=>{$('source-view').hidden=true;$('source').hidden=false;$('edit-code').hidden=true;$('source').focus();});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();explain();}});
  $('load-editor').hidden=!host;$('load-editor').addEventListener('click',()=>host?.postMessage({type:'loadEditor'}));
  if(host){for(const link of [document.querySelector('.brand'),$('open-studio')])link.addEventListener('click',e=>{e.preventDefault();host.postMessage({type:'openStudio'});});}
  window.addEventListener('message',event=>{const message=event.data;if(!host||!message)return;if(message.type==='explainSource'&&typeof message.code==='string'&&message.code.length<=50000&&typeof message.language==='string'){setSource(message);explain();host.postMessage({type:'sourceReceived',sourceToken:message.sourceToken});}else if(message.type==='notice')status(String(message.text));});
  replayView=CodeAliveReplayUI.mount({getContext:()=>model&&({code:modelSource,language:model.language,scopeId:model.scopeId,name:model.summary.name}),onRange:activateRange});
  setSource(CodeAliveExamples[0]);$('example-description').textContent=chosen().description;host?.postMessage({type:'ready'});
})();
