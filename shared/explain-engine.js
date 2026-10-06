(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('@babel/parser'));
  else root.CodeAliveExplain = factory(root.CodeAliveParser);
})(globalThis, function (parser) {
  'use strict';
  const LIMITS = {source:50000, scopes:100, steps:80, graph:100, facts:12};
  const FUNCTIONS = new Set(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression','ObjectMethod','ClassMethod','ClassPrivateMethod']);
  const LOOPS = new Set(['ForStatement','ForInStatement','ForOfStatement','WhileStatement','DoWhileStatement']);
  const SKIP = new Set(['loc','start','end','extra','tokens','comments','leadingComments','trailingComments','innerComments','typeAnnotation','returnType','typeParameters','typeArguments']);
  const isFunction = n => n && FUNCTIONS.has(n.type);
  function visit(root, callback, own = false) {
    const stack = [{node:root,parent:null}];
    while (stack.length) {
      const {node,parent} = stack.pop();
      if (!node || typeof node.type !== 'string') continue;
      if (own && node !== root && (isFunction(node) || node.type === 'ClassDeclaration' || node.type === 'ClassExpression')) continue;
      callback(node,parent);
      const children = [];
      for (const [key,value] of Object.entries(node)) {
        if (SKIP.has(key)) continue;
        if (Array.isArray(value)) children.push(...value.filter(x=>x && typeof x.type==='string'));
        else if (value && typeof value.type==='string') children.push(value);
      }
      for (let i=children.length-1;i>=0;i--) stack.push({node:children[i],parent:node});
    }
  }
  const clip = (s,max=180) => s.length > max ? s.slice(0,max-1)+'…' : s;
  const range = n => ({start:n.start,end:n.end,line:n.loc.start.line,endLine:n.loc.end.line});
  function analyze(source, options = {}) {
    if (typeof source !== 'string' || !source.trim()) return {ok:false,error:'Paste a function or load an example first.'};
    if (source.length > LIMITS.source) return {ok:false,error:'Select a smaller section: the limit is 50,000 characters.'};
    const language = options.language || 'JavaScript';
    if (!['JavaScript','TypeScript'].includes(language)) return {ok:false,error:'Code explanations currently support JavaScript and TypeScript.'};
    let ast;
    try {
      ast = parser.parse(source,{sourceType:'unambiguous',plugins:language==='TypeScript'?['typescript','jsx']:['jsx'],allowReturnOutsideFunction:true,allowAwaitOutsideFunction:true,attachComment:false});
    } catch (error) {
      return {ok:false,error:'Could not parse this code. '+error.message,line:error.loc?.line,column:error.loc?.column};
    }
    const text = n => n ? clip(source.slice(n.start,n.end).replace(/\s+/g,' ').trim()) : '';
    const warnings = ['This is a static explanation. Code is never run; values, results, exceptions and actual paths are not verified.'];
    const scopes = [];
    let functionCount = 0;
    visit(ast.program,(node,parent)=>{
      if (!isFunction(node) || !node.body) return;
      functionCount++;
      if (scopes.length >= LIMITS.scopes) return;
      let name = node.id?.name || text(node.key);
      if (!name && parent?.type==='VariableDeclarator') name=text(parent.id);
      if (!name && ['ObjectProperty','AssignmentExpression'].includes(parent?.type)) name=text(parent.key || parent.left);
      if (!name && parent?.type==='ExportDefaultDeclaration') name='default export';
      scopes.push({id:'function-'+node.start,name:name||'anonymous function',node,...range(node)});
    });
    if (functionCount>LIMITS.scopes) warnings.push('Only the first 100 functions are listed. Select a smaller section to inspect the rest.');
    scopes.push({id:'module',name:'Selected statements',node:ast.program,...range(ast.program)});
    const scope = scopes.find(s=>s.id===options.scopeId) || scopes[0];
    const fn = isFunction(scope.node);
    const implicit = fn && scope.node.body.type !== 'BlockStatement';
    const statements = !fn ? scope.node.body : implicit ? [{type:'ReturnStatement',argument:scope.node.body,implicit:true,...range(scope.node.body),loc:scope.node.body.loc}] : scope.node.body.body;
    const ownNodes = [];
    // A synthetic block makes nested function bodies opaque, including arrows in expressions.
    visit({type:'BlockStatement',body:statements},n=>ownNodes.push(n),true);
    const returns = ownNodes.filter(n=>n.type==='ReturnStatement');
    const effects = ownNodes.filter(n=>['CallExpression','OptionalCallExpression','NewExpression'].includes(n.type) ||
      (n.type==='AssignmentExpression' && ['MemberExpression','OptionalMemberExpression'].includes(n.left.type)) ||
      (n.type==='UpdateExpression' && n.argument.type==='MemberExpression'));
    const branchCount = ownNodes.filter(n=>['IfStatement','ConditionalExpression','SwitchStatement'].includes(n.type)).length;
    const loopCount = ownNodes.filter(n=>LOOPS.has(n.type)).length;
    const inputs = fn ? scope.node.params.map(text) : [];
    const summary = {
      name:scope.name, inputs,
      description:fn ? `${scope.node.async?'Async ':''}${scope.node.generator?'Generator ':''}function with ${inputs.length} parameter${inputs.length===1?'':'s'}, ${branchCount} conditional construct${branchCount===1?'':'s'} and ${loopCount} loop${loopCount===1?'':'s'}.` : `Selected statements contain ${branchCount} conditional construct${branchCount===1?'':'s'} and ${loopCount} loop${loopCount===1?'':'s'}.`,
      returns:returns.slice(0,LIMITS.facts).map(n=>n.argument?text(n.argument):'undefined (bare return)'),
      effects:effects.slice(0,LIMITS.facts).map(n=>({text:text(n),kind:['AssignmentExpression','UpdateExpression'].includes(n.type)?'Object or property write':'Call — effects depend on its implementation',...range(n)})),
      branchCount,loopCount,
      outputNote:scope.node.generator ? 'Generator calls return an iterator; return expressions describe completion values.' : scope.node.async ? 'Async calls return a Promise. These are return expressions, not computed values.' : 'These are return expressions, not computed values. Reaching the end of a function returns undefined.'
    };
    if (!fn) warnings.push('Functions and classes inside selected statements are definitions; their bodies are available as separate function scopes.');
    if (returns.length>LIMITS.facts || effects.length>LIMITS.facts) warnings.push('Inputs and outputs list at most 12 return expressions and 12 calls or property writes.');
    if (ownNodes.some(n=>n.type==='ConditionalExpression'||n.type==='LogicalExpression'||n.type==='AwaitExpression'||n.type==='YieldExpression')) warnings.push('Expression-level branches, short-circuiting, await and yield remain inside their statement nodes in the diagram.');
    const steps=[];
    let stepCount=0;
    function step(node,title,beginner,developer) {
      stepCount++;
      if(steps.length<LIMITS.steps) steps.push({id:'step-'+steps.length,title,beginner,developer,...range(node)});
    }
    function walkStatements(list) {
      for (const n of list) {
        if (!n) continue;
        if(n.type==='BlockStatement'){walkStatements(n.body);continue;}
        if(n.type.startsWith('Export')&&n.declaration){walkStatements([n.declaration]);continue;}
        if(n.type==='EmptyStatement')continue;
        if(n.type==='VariableDeclaration'){
          for(const d of n.declarations)step(d,'Set up '+text(d.id),d.init?`Give ${text(d.id)} the value described by ${text(d.init)}.`:`Declare ${text(d.id)} without an initial value.`,`${n.kind} declaration: ${text(d)}.`);
        } else if(n.type==='IfStatement'){
          step(n.test,'Check a condition',`Check ${text(n.test)}. Follow the first branch when it is truthy${n.alternate?', otherwise follow the alternative':''}.`,`Branch on ${text(n.test)}.`);
          walkStatements([n.consequent]);if(n.alternate)walkStatements([n.alternate]);
        } else if(n.type==='ReturnStatement') step(n.argument||n,'Return a result',n.argument?`Return the value described by ${text(n.argument)}.`:'Finish this call without a value.',`${n.implicit?'Implicit arrow return':'Return'} ${n.argument?text(n.argument):'undefined'}; remaining statements on this path are skipped.`);
        else if(n.type==='ThrowStatement')step(n,'Raise an error',`Throw ${text(n.argument)}; a surrounding handler may catch it.`,`Throw ${text(n.argument)}. Exception handling is not resolved.`);
        else if(LOOPS.has(n.type)){
          const target=n.test||n.right||n;
          const condition=n.right?`Visit ${n.type==='ForInStatement'?'enumerable keys':'items'} from ${text(n.right)}.`:n.test?`Repeat while ${text(n.test)} is truthy.`:'Repeat until control leaves the loop.';
          step(target,'Repeat a block',(n.type==='DoWhileStatement'?'Run the body once, then check. ':'')+condition,`${n.type}: ${text(n)}.`);
          walkStatements([n.body]);
        } else if(['BreakStatement','ContinueStatement'].includes(n.type))step(n,n.type==='BreakStatement'?'Leave the block':'Continue the loop',n.type==='BreakStatement'?'Exit the nearest loop or switch, unless a label names another target.':'Continue with the next iteration, unless a label names another target.',text(n));
        else if(n.type==='TryStatement'){
          step(n,'Handle possible errors','Try the body, use a matching catch for thrown errors, and run finally when applicable.','Try/catch/finally is collapsed in the diagram; exceptional paths are not expanded.');
          walkStatements(n.block.body);if(n.handler)walkStatements(n.handler.body.body);if(n.finalizer)walkStatements(n.finalizer.body);
        } else if(n.type==='SwitchStatement'){
          step(n.discriminant,'Choose a case',`Compare ${text(n.discriminant)} with the case labels. Cases can fall through.`,`Switch on ${text(n.discriminant)}; case flow is collapsed in the diagram.`);
          for(const c of n.cases)walkStatements(c.consequent);
        } else if(isFunction(n))step(n,'Define a function',`Define ${n.id?.name||'a function'} for later calls. Choose its scope to see the body.`,`${n.type}; its body is not executed by this declaration.`);
        else if(n.type==='ExpressionStatement')step(n,'Evaluate an expression',`Evaluate ${text(n.expression)}. Calls may have effects that depend on their implementation.`,`${n.expression.type}: ${text(n.expression)}.`);
        else step(n,'Read '+n.type.replace(/([A-Z])/g,' $1').trim().toLowerCase(),`This construct contains ${text(n)}.`,`${n.type}: ${text(n)}.`);
      }
    }
    walkStatements(statements);
    if(stepCount>LIMITS.steps)warnings.push('Only the first 80 explanation steps are shown. Select a smaller section.');
    let graph;
    try { graph=buildGraph(statements,scope.name,text,warnings); }
    catch(error) { if(error.message!=='GRAPH_LIMIT')throw error;graph={nodes:[],edges:[]};warnings.push('Diagram omitted: this scope exceeds the 100-node limit. Select a smaller section.'); }
    return {ok:true,language,scopeId:scope.id,scopes:scopes.map(({node,...s})=>s),summary,steps,graph,warnings:[...new Set(warnings)],sourceLength:source.length};
  }
  function buildGraph(statements,name,text,warnings) {
    const nodes=[],edges=[];
    function node(kind,label,source) {
      if(nodes.length>=LIMITS.graph)throw new Error('GRAPH_LIMIT');
      const id='node-'+nodes.length;nodes.push({id,kind,label:clip(label,72),range:source?range(source):null});return id;
    }
    const edge=(from,to,label='')=>{if(to)edges.push({from,to,label,back:false});};
    const end=node('end','Exit this scope');
    function sequence(list,next,context={}) {for(let i=list.length-1;i>=0;i--)next=statement(list[i],next,context);return next;}
    function statement(n,next,context) {
      if(!n || n.type==='EmptyStatement')return next;
      if(n.type==='BlockStatement')return sequence(n.body,next,context);
      if(n.type.startsWith('Export')&&n.declaration)return statement(n.declaration,next,context);
      if(n.type==='IfStatement'){
        const id=node('decision',text(n.test),n.test);
        edge(id,statement(n.consequent,next,context),'truthy');edge(id,n.alternate?statement(n.alternate,next,context):next,'falsy');return id;
      }
      if(LOOPS.has(n.type)){
        const id=node('decision',n.right?text(n.right):n.test?text(n.test):'Next iteration',n.test||n.right||n);
        const update=n.update?node('statement',text(n.update),n.update):id;
        if(update!==id)edge(update,id,'repeat');
        const body=statement(n.body,update,{...context,breakTo:next,continueTo:update});
        edge(id,body,n.right?'item':'truthy');if(n.test||n.right)edge(id,next,n.right?'done':'falsy');
        let head=n.type==='DoWhileStatement'?body:id;
        if(n.init){const init=node('statement',text(n.init),n.init);edge(init,head);head=init;}
        return head;
      }
      if(['ReturnStatement','ThrowStatement'].includes(n.type)){
        const id=node('exit',n.type==='ReturnStatement'?'Return '+(n.argument?text(n.argument):'undefined'):'Throw '+text(n.argument),n.argument||n);
        edge(id,end);return id;
      }
      if(['BreakStatement','ContinueStatement'].includes(n.type)){
        const target=n.type==='BreakStatement'?context.breakTo:context.continueTo;
        if(!n.label&&target){const id=node('statement',text(n),n);edge(id,target);return id;}
      }
      const collapsed=['TryStatement','SwitchStatement','LabeledStatement','WithStatement'].includes(n.type);
      if(collapsed)warnings.push('Try, switch and labeled blocks are collapsed. Their internal jumps, exception paths and fallthrough are not modeled by the diagram.');
      const label=isFunction(n)?'Define '+(n.id?.name||'function'):n.type==='ClassDeclaration'?'Define class '+(n.id?.name||''):collapsed?n.type.replace('Statement','')+' block (collapsed)':text(n);
      const id=node(collapsed?'collapsed':'statement',label,n);edge(id,next,collapsed?'may continue':'');return id;
    }
    const head=sequence(statements,end);
    const entry=node('start',name==='Selected statements'?'Selected statements':'Call '+name);
    edge(entry,head);
    const adjacency=new Map(nodes.map(n=>[n.id,edges.filter(e=>e.from===n.id)]));
    const seen=new Set(),active=new Set();
    function walk(id){if(seen.has(id))return;seen.add(id);active.add(id);for(const e of adjacency.get(id)){if(active.has(e.to))e.back=true;else walk(e.to);}active.delete(id);}
    walk(entry);
    return {nodes:nodes.filter(n=>seen.has(n.id)),edges:edges.filter(e=>seen.has(e.from)&&seen.has(e.to))};
  }
  return {analyze,LIMITS};
});
