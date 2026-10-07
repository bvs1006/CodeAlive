(function(root){
  'use strict';
  root.CodeAliveReplayUI={mount({getContext,onRange}){
    const $=id=>document.getElementById(id);let context=null,trace=null,pinned=null,index=0,timer=null;
    const defaults={discountedPrice:[100,20],cartTotal:[[{price:12,quantity:2},{price:5,quantity:1}]],findUser:[[{id:1,name:'Ada'},{id:2,name:'Lin'}],2],greeting:['Ada',true],area:[4,5],reserve:[{stock:5},2],countdown:[3]};
    const format=value=>JSON.stringify(value,null,2);
    function stop(){clearInterval(timer);timer=null;$('replay-play').textContent='Play';}
    function clear(){stop();trace=null;pinned=null;context=null;$('replay-panel').hidden=true;$('replay-results').hidden=true;$('replay-pinned').hidden=true;}
    function show(){
      if(!trace?.steps.length)return;const step=trace.steps[index];$('replay-position').textContent=`Step ${index+1} of ${trace.steps.length} · ${step.kind}${step.detail?' · '+step.detail:''}`;
      $('replay-slider').value=index;$('replay-variables').textContent=format(step.variables);$('replay-value').textContent=format(step.value);$('replay-prev').disabled=index===0;$('replay-next').disabled=index===trace.steps.length-1;
      if(step.range)onRange(step.range);
    }
    function result(){
      $('replay-results').hidden=!trace?.steps.length;
      $('replay-status').textContent=trace?(trace.ok?'Returned '+format(trace.result):trace.error):'Enter arguments, then choose Run in interpreter. Static explanation never starts a run.';
      $('replay-status').classList.toggle('error',trace?.ok===false);
      $('replay-pin').disabled=!trace;
      if(trace?.steps.length){$('replay-slider').max=trace.steps.length-1;index=0;show();}
    }
    function setContext(){const next=getContext();if(!next)return clear();if(context&&context.code===next.code&&context.scopeId===next.scopeId&&context.language===next.language)return;
      stop();context=next;trace=null;pinned=null;$('replay-panel').hidden=false;$('replay-results').hidden=true;$('replay-pinned').hidden=true;$('replay-args').value=JSON.stringify(defaults[next.name]||[]);result();
    }
    $('replay-run').addEventListener('click',()=>{stop();const now=getContext();if(!now||!context||now.code!==context.code||now.scopeId!==context.scopeId)return clear();trace=CodeAliveReplay.run(context.code,$('replay-args').value,context);trace.input=$('replay-args').value;result();});
    $('replay-args').addEventListener('input',()=>{stop();trace=null;result();});
    $('replay-prev').addEventListener('click',()=>{stop();index=Math.max(0,index-1);show();});$('replay-next').addEventListener('click',()=>{stop();index=Math.min(trace.steps.length-1,index+1);show();});
    $('replay-slider').addEventListener('input',()=>{stop();index=Number($('replay-slider').value);show();});
    $('replay-play').addEventListener('click',()=>{if(timer)return stop();if(!trace?.steps.length)return;if(index===trace.steps.length-1)index=0;show();$('replay-play').textContent='Pause';timer=setInterval(()=>{if(index>=trace.steps.length-1)return stop();index++;show();},700/Number($('replay-speed').value));});
    $('replay-speed').addEventListener('change',stop);
    $('replay-pin').addEventListener('click',()=>{if(!trace)return;pinned={input:trace.input,result:trace.ok?trace.result:trace.error,steps:trace.steps.length};$('replay-pinned').hidden=false;$('replay-baseline').textContent=format(pinned);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    return {clear,setContext,getTrace:()=>trace,getContext:()=>context};
  }};
})(globalThis);
