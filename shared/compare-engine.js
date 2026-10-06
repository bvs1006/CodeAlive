(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('@babel/parser'));else root.CodeAliveCompare=factory(root.CodeAliveParser);})(globalThis,function(parser){
  'use strict';
  const metadata=new Set(['start','end','loc','extra','comments','leadingComments','trailingComments','innerComments','tokens']);
  const functions=new Set(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression','ObjectMethod','ClassMethod','ClassPrivateMethod']);
  const range=n=>n?{start:n.start,end:n.end,line:n.loc.start.line,endLine:n.loc.end.line}:null;
  function canonical(value,omitFunctions=false){
    if(value===null||typeof value!=='object')return value;
    if(omitFunctions&&functions.has(value.type))return {type:'FunctionPlaceholder'};
    if(Array.isArray(value))return value.map(v=>canonical(v,omitFunctions));
    const result={};for(const k of Object.keys(value).sort())if(!metadata.has(k))result[k]=canonical(value[k],omitFunctions);return result;
  }
  const fingerprint=n=>JSON.stringify(canonical(n));
  function walk(root,callback,own=false){const stack=[{node:root,parent:null}];while(stack.length){const {node,parent}=stack.pop();if(!node||typeof node.type!=='string')continue;if(own&&node!==root&&functions.has(node.type))continue;callback(node,parent);const children=[];for(const [k,v]of Object.entries(node)){if(metadata.has(k)||['typeAnnotation','returnType','typeParameters','typeArguments'].includes(k))continue;if(Array.isArray(v))children.push(...v);else if(v&&typeof v==='object')children.push(v);}for(let i=children.length-1;i>=0;i--)stack.push({node:children[i],parent:node});}}
  function collect(ast,source){const list=[];walk(ast,(node,parent)=>{if(!functions.has(node.type))return;const key=node.id||node.key||(parent?.type==='VariableDeclarator'?parent.id:parent?.type==='ObjectProperty'?parent.key:parent?.type==='AssignmentExpression'?parent.left:null);const name=key?source.slice(key.start,key.end):parent?.type==='ExportDefaultDeclaration'?'default export':'anonymous';list.push({name,node});});return list;}
  function facts(fn){const result={Conditions:[],Returns:[],Calls:[],Writes:[]};if(functions.has(fn.body.type)){result.Returns.push(fn.body);return result;}walk(fn.body,n=>{if(['IfStatement','ConditionalExpression','WhileStatement','DoWhileStatement','ForStatement'].includes(n.type)&&n.test)result.Conditions.push(n.test);if(n.type==='SwitchStatement')result.Conditions.push(n.discriminant);if(n.type==='ReturnStatement')result.Returns.push(n.argument||n);if(['CallExpression','OptionalCallExpression','NewExpression'].includes(n.type))result.Calls.push(n);if(['AssignmentExpression','UpdateExpression'].includes(n.type))result.Writes.push(n);},true);if(fn.body.type!=='BlockStatement')result.Returns.push(fn.body);return result;}
  function compare(before,after,{language='JavaScript'}={}){
    const changes=[],warnings=['Structural observations only: no code execution, type checking, inferred business intent or correctness/merge verdict. Function matching uses unique names; renames appear as removal/addition.'];
    if(typeof before!=='string'||typeof after!=='string'||Math.max(before.length,after.length)>50000)return {ok:false,error:'Each version must contain at most 50,000 characters.'};
    if(!['JavaScript','TypeScript'].includes(language))return {ok:false,error:'Change explanations support JavaScript and TypeScript.'};
    let left,right;const parse=source=>parser.parse(source,{sourceType:'unambiguous',plugins:language==='TypeScript'?['typescript','jsx']:['jsx'],attachComment:false}).program;
    try{left=parse(before);}catch(e){return {ok:false,error:'Before could not be parsed: '+e.message};}
    try{right=parse(after);}catch(e){return {ok:false,error:'After could not be parsed: '+e.message};}
    const add=(title,detail,a,b)=>{if(changes.length<200)changes.push({title,detail,before:range(a),after:range(b)});};
    try{
      if(fingerprint(left)===fingerprint(right))return {ok:true,changes,warnings,summary:before===after?'The versions are identical.':'Only formatting/comments differ; the parsed structure is unchanged.'};
      const a=collect(left,before),b=collect(right,after);if(a.length>100||b.length>100)return {ok:false,error:'Compare a smaller section: at most 100 functions per version.'};
      const names=new Set([...a,...b].map(x=>x.name));
      for(const name of names){const aa=a.filter(x=>x.name===name),bb=b.filter(x=>x.name===name);
        if(aa.length>1||bb.length>1||name==='anonymous'){warnings.push('Ambiguous function name '+name+': inspect the whole-file source difference; no individual pairing is claimed.');continue;}
        const x=aa[0]?.node,y=bb[0]?.node;
        if(!x||!y){add(name+(!x?' added':' removed'),'Function definition '+(!x?'appears in After.':'was present in Before.'),x,y);continue;}
        if(fingerprint(x)===fingerprint(y))continue;
        const start=changes.length;
        if(fingerprint(x.params)!==fingerprint(y.params))add(name+' · parameters changed','Parameter names, defaults, destructuring or type annotations differ.',x,y);
        if(x.async!==y.async||x.generator!==y.generator||fingerprint(x.returnType)!==fingerprint(y.returnType)||fingerprint(x.typeParameters)!==fingerprint(y.typeParameters))add(name+' · signature changed','Async/generator flags, return annotation or type parameters differ.',x,y);
        const af=facts(x),bf=facts(y);
        for(const category of Object.keys(af))if(fingerprint(af[category])!==fingerprint(bf[category])){
          const old=af[category],next=bf[category];let i=0;while(i<Math.min(old.length,next.length)&&fingerprint(old[i])===fingerprint(next[i]))i++;
          const describe=(nodes,source)=>nodes.slice(0,4).map(n=>source.slice(n.start,n.end).replace(/\s+/g,' ').slice(0,180)).join(' | ')||'(none)';
          add(name+' · '+category.toLowerCase()+' changed',`${old.length} → ${next.length}. Before: ${describe(old,before)}. After: ${describe(next,after)}.`,old[i]||x,next[i]||y);
        }
        if(start===changes.length)add(name+' · body changed','Statements or expressions differ. Review the linked function bodies to assess the effect.',x,y);
      }
      // Always preserve a whole-file observation, including imports, types and unmatched functions.
      add('Whole-file structure changed','Inspect both versions for changes outside the named observations. Summaries are bounded and do not replace a complete diff.',left,right);
      if(changes.length===200)warnings.push('Only the first 200 observations are shown. Compare a smaller section.');
      return {ok:true,changes,warnings,summary:`${changes.length} source-linked structural observations.`};
    }catch(e){return {ok:false,error:'This comparison is too complex. Select a smaller section. '+e.message};}
  }
  return {compare};
});
