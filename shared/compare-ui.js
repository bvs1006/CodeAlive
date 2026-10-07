(function(root){
  'use strict';
  root.CodeAliveCompareUI={mount({host,getSource}){
    const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};let payload=null,model=null;
    function reset(){payload=null;model=null;$('compare-results').replaceChildren();$('compare-evidence').replaceChildren();$('compare-source').replaceChildren();$('compare-status').textContent='Versions changed. Compare again; previous evidence and editor links were detached.';}
    function source(side,r){const code=$('compare-'+side).value,view=$('compare-source');view.replaceChildren(el('h3',(side==='before'?'Before':'After')+` · L${r.line}–${r.endLine}`));const pre=el('pre');pre.append(document.createTextNode(code.slice(0,r.start)),el('mark',code.slice(r.start,r.end)),document.createTextNode(code.slice(r.end)));view.append(pre);pre.querySelector('mark')?.scrollIntoView({block:'nearest'});if(payload?.sourceToken)host?.postMessage({type:'revealComparison',sourceToken:payload.sourceToken,side,start:r.start,end:r.end});}
    function evidence(){const out=$('compare-evidence');out.replaceChildren();if(!payload?.evidence){out.append(el('p','No CI evidence is attached to these versions. Comparing source does not run tests.'));return;}
      const e=payload.evidence;out.append(el('h3','Evidence for these revisions'),el('p',`Before: ${e.beforeLabel}. After: ${e.afterLabel}.`),el('p',e.note||'CI observations do not establish correctness or required-check coverage.'));
      for(const revision of e.checkedRevisions||[])out.append(el('p',revision.label+': '+revision.sha));
      if(e.fetchedAt)out.append(el('p','Fetched '+e.fetchedAt+'. Refresh the PR panel to inspect newer results.'));
      const link=(text,url)=>{if(!url||!/^https:\/\/github\.com\//.test(url))return;const b=el('button',text);b.onclick=()=>host?.postMessage({type:'openEvidence',url});out.append(b);};
      link('Open PR',e.url);for(const c of e.checks||[]){out.append(el('p',`${c.shaLabel}: ${c.name} · ${c.category} (${c.conclusion})`));link('Check details',c.url);}
      for(const w of e.warnings||[])out.append(el('p',w));if(e.tests?.length){out.append(el('h4','Changed test files · filename-based association, not coverage'));for(const f of e.tests)link(f.path,f.url);}
    }
    function compare(){model=CodeAliveCompare.compare($('compare-before').value,$('compare-after').value,{language:$('compare-language').value});$('compare-results').replaceChildren();$('compare-source').replaceChildren();$('compare-status').textContent=model.ok?model.summary:model.error;evidence();if(!model.ok)return;
      for(const c of model.changes){const row=el('article');row.append(el('h3',c.title),el('p',c.detail));for(const side of ['before','after'])if(c[side]&&c[side].end>c[side].start){const b=el('button',`${side==='before'?'Before':'After'} · L${c[side].line}`);b.onclick=()=>source(side,c[side]);row.append(b);}$('compare-results').append(row);}
      const limits=el('details');limits.append(el('summary','Limits of this comparison'));for(const w of model.warnings)limits.append(el('p',w));$('compare-results').append(limits);
    }
    function setPayload(next){reset();payload=next;$('compare-before').value=next.before;$('compare-after').value=next.after;$('compare-language').value=next.language;compare();$('compare-panel').scrollIntoView({block:'start'});}
    for(const id of ['compare-before','compare-after'])$(id).addEventListener('input',reset);$('compare-language').addEventListener('change',reset);$('compare-run').addEventListener('click',compare);
    $('compare-current').addEventListener('click',()=>{const s=getSource();reset();$('compare-after').value=s.code;$('compare-language').value=s.language;});
    $('compare-example').addEventListener('click',()=>setPayload({before:'function price(amount, discount) {\n  return amount - discount;\n}',after:'function price(amount, discount) {\n  if (discount < 0) throw new Error("Invalid discount");\n  return amount * (1 - discount / 100);\n}',language:'JavaScript'}));
    return {setPayload};
  }};
})(globalThis);
