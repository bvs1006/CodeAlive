(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('@babel/parser'));else root.CodeAliveReplay=factory(root.CodeAliveParser);})(globalThis,function(parser){
  'use strict';
  const LIMITS={source:50000,input:10000,operations:10000,steps:300,depth:12,array:400,string:2000,traceBytes:300000};
  const forbidden=new Set(['__proto__','prototype','constructor']);
  const allowed=new Set(['BlockStatement','VariableDeclaration','VariableDeclarator','Identifier','NumericLiteral','StringLiteral','BooleanLiteral','NullLiteral','ArrayExpression','ObjectExpression','ObjectProperty','ExpressionStatement','ReturnStatement','ThrowStatement','IfStatement','ForStatement','ForOfStatement','WhileStatement','DoWhileStatement','BreakStatement','ContinueStatement','EmptyStatement','BinaryExpression','LogicalExpression','UnaryExpression','UpdateExpression','AssignmentExpression','ConditionalExpression','MemberExpression','CallExpression','NewExpression','TemplateLiteral','TemplateElement','TSAsExpression','TSTypeAssertion','TSNonNullExpression','AssignmentPattern']);
  const ignored=new Set(['loc','start','end','extra','comments','leadingComments','trailingComments','innerComments','typeAnnotation','returnType','typeParameters','typeArguments']);
  const UNINITIALIZED=Symbol('uninitialized');
  class Fault extends Error {constructor(message,node){super(message);this.node=node;}}
  const range=n=>n&&({start:n.start,end:n.end,line:n.loc.start.line,endLine:n.loc.end.line});
  function walk(root,callback){const stack=[root];while(stack.length){const n=stack.pop();if(!n||typeof n.type!=='string')continue;callback(n);for(const [key,value]of Object.entries(n)){if(ignored.has(key))continue;if(Array.isArray(value))for(let i=value.length-1;i>=0;i--)stack.push(value[i]);else if(value&&typeof value.type==='string')stack.push(value);}}}
  function run(source,argsText,options={}) {
    const steps=[];let operations=0,bytes=0,depth=0,lastNode,copyBudget=0;
    const tick=n=>{lastNode=n;if(++operations>LIMITS.operations)throw new Fault('Stopped at the 10,000-operation limit.',n);};
    const fail=(message,n=lastNode)=>{throw new Fault(message,n);};
    function copy(value,seen=new Set(),level=0){
      if(++copyBudget>10000)fail('Stopped at the snapshot-size limit. Try a smaller input.');
      if(value===UNINITIALIZED)return {'$type':'uninitialized'};
      if(value===undefined)return {'$type':'undefined'};
      if(value===null||typeof value!=='object')return value;
      if(seen.has(value))return {'$type':'circular reference'};
      if(level>LIMITS.depth)return {'$type':'depth limit'};
      seen.add(value);const out=Array.isArray(value)?[]:Object.create(null);
      for(const key of Object.keys(value))out[key]=copy(value[key],seen,level+1);
      seen.delete(value);return out;
    }
    function snapshot(scope){const vars=Object.create(null),chain=[];for(let e=scope;e;e=e.parent)chain.unshift(e);for(const e of chain)for(const [k,v]of e.values)vars[k]=copy(v.value);return vars;}
    function record(kind,n,scope,value,detail){
      if(steps.length>=LIMITS.steps)fail('Stopped at the 300-step trace limit.',n);
      copyBudget=0;
      const step={index:steps.length,kind,range:range(n),variables:snapshot(scope),value:copy(value),detail:detail||'',depth};
      bytes+=JSON.stringify(step).length;if(bytes>LIMITS.traceBytes)fail('Stopped at the trace-size limit. Try a smaller input.',n);
      steps.push(step);
    }
    const scope=parent=>({parent,values:new Map()});
    function binding(e,name){for(;e;e=e.parent)if(e.values.has(name))return e.values.get(name);fail('Unknown identifier: '+name+'. Imports and surrounding file state are unavailable.');}
    function read(b,name){if(b.value===UNINITIALIZED)fail('Cannot access '+name+' before initialization.');return b.value;}
    function declare(e,name,value,constant){if(forbidden.has(name)||(e.values.has(name)&&e.values.get(name).value!==UNINITIALIZED))fail('Unsupported or duplicate binding: '+name);e.values.set(name,{value,constant});}
    function reserve(n,e){for(const d of n.declarations){if(d.id.type!=='Identifier')fail('Destructuring declarations are not supported.',d);if(!e.values.has(d.id.name))e.values.set(d.id.name,{value:UNINITIALIZED,constant:n.kind==='const'});}}
    function bounded(value){if(typeof value==='number'&&!Number.isFinite(value))fail('Non-finite numbers are not supported.');if(typeof value==='string'&&value.length>LIMITS.string)fail('String limit exceeded (2,000 characters).');return value;}
    function keyOf(n,e){const key=n.computed?expr(n.property,e):n.property.name;if(!['string','number'].includes(typeof key)||forbidden.has(String(key)))fail('Unsupported property access.',n);return String(key);}
    function property(object,key,n){
      if(object===null||object===undefined)fail('Cannot read a property of '+object,n);
      if(key==='length'&&(Array.isArray(object)||typeof object==='string'))return object.length;
      if(Array.isArray(object)||typeof object==='string'){if(!/^(0|[1-9]\d*)$/.test(key))fail('Only indexed reads and length are supported here.',n);return object[Number(key)];}
      if(typeof object!=='object')fail('Property reads require an object, array or string.',n);
      return Object.hasOwn(object,key)?object[key]:undefined;
    }
    function target(n,e){
      if(n.type==='Identifier'){const b=binding(e,n.name);return {get:()=>read(b,n.name),set:value=>{read(b,n.name);if(b.constant)fail('Cannot assign to const '+n.name,n);b.value=bounded(value);}};}
      if(n.type!=='MemberExpression')fail('Unsupported assignment target.',n);
      const object=expr(n.object,e),key=keyOf(n,e);
      if(!object||typeof object!=='object')fail('Writes require an object or array.',n);
      if(Array.isArray(object)&&(!/^(0|[1-9]\d*)$/.test(key)||Number(key)>object.length||Number(key)>=LIMITS.array))fail('Array writes must use an existing index or append one item (limit 400).',n);
      if(!Array.isArray(object)&&!Object.hasOwn(object,key)&&Object.keys(object).length>=100)fail('Object property limit exceeded (100).',n);
      return {get:()=>property(object,key,n),set:value=>{object[key]=bounded(value);}};
    }
    function primitive(v){if(v!==null&&typeof v==='object')fail('Object coercion is outside the supported replay subset.');return v;}
    function binary(op,a,b){
      if(['===','!=='].includes(op))return op==='==='?a===b:a!==b;
      primitive(a);primitive(b);
      switch(op){case '+':return bounded(a+b);case '-':return bounded(a-b);case '*':return bounded(a*b);case '/':return bounded(a/b);case '%':return bounded(a%b);case '**':return bounded(a**b);case '<':return a<b;case '<=':return a<=b;case '>':return a>b;case '>=':return a>=b;case '==':return a==b;case '!=':return a!=b;default:fail('Unsupported operator: '+op);}
    }
    function expr(n,e){
      tick(n);
      switch(n.type){
        case 'NumericLiteral':case 'StringLiteral':case 'BooleanLiteral':return bounded(n.value);
        case 'NullLiteral':return null;
        case 'Identifier':return n.name==='undefined'?undefined:read(binding(e,n.name),n.name);
        case 'TSAsExpression':case 'TSTypeAssertion':case 'TSNonNullExpression':return expr(n.expression,e);
        case 'ArrayExpression':if(n.elements.length>LIMITS.array||n.elements.some(x=>!x))fail('Arrays must be dense and contain at most 400 items.',n);return n.elements.map(x=>expr(x,e));
        case 'ObjectExpression':{if(n.properties.length>100)fail('Object property limit exceeded.',n);const o=Object.create(null);for(const p of n.properties){if(p.type!=='ObjectProperty'||p.method)fail('Only plain object properties are supported.',p);const key=p.computed?expr(p.key,e):p.key.name??p.key.value;if(!['number','string'].includes(typeof key)||forbidden.has(String(key)))fail('Unsupported object key.',p);o[key]=expr(p.value,e);}return o;}
        case 'TemplateLiteral':{let s=n.quasis[0].value.cooked;for(let i=0;i<n.expressions.length;i++)s+=String(primitive(expr(n.expressions[i],e)))+n.quasis[i+1].value.cooked;return bounded(s);}
        case 'BinaryExpression':return binary(n.operator,expr(n.left,e),expr(n.right,e));
        case 'LogicalExpression':{const a=expr(n.left,e),take=n.operator==='&&'?!!a:n.operator==='||'?!a:a===null||a===undefined;record('branch',n.left,e,a,take?'Evaluate the right side':'Short-circuit');return take?expr(n.right,e):a;}
        case 'ConditionalExpression':{const test=expr(n.test,e);record('branch',n.test,e,test,test?'truthy':'falsy');return expr(test?n.consequent:n.alternate,e);}
        case 'UnaryExpression':{if(n.operator==='typeof'&&n.argument.type==='Identifier'&&n.argument.name==='undefined')return 'undefined';const a=expr(n.argument,e);switch(n.operator){case '!':return !a;case '+':return bounded(+primitive(a));case '-':return bounded(-primitive(a));case 'typeof':return typeof a;default:fail('Unsupported unary operator: '+n.operator,n);}}
        case 'MemberExpression':return property(expr(n.object,e),keyOf(n,e),n);
        case 'AssignmentExpression':{const t=target(n.left,e),before=n.operator==='='?undefined:t.get(),right=expr(n.right,e),value=n.operator==='='?right:binary(n.operator.slice(0,-1),before,right);t.set(value);record('write',n,e,value);return value;}
        case 'UpdateExpression':{const t=target(n.argument,e),before=t.get();if(typeof before!=='number')fail('Updates require numeric values.',n);const value=bounded(before+(n.operator==='++'?1:-1));t.set(value);record('write',n,e,value);return n.prefix?value:before;}
        case 'NewExpression':if(n.callee.type!=='Identifier'||n.callee.name!=='Error'||n.arguments.length>1)fail('Only new Error(message) is supported.',n);return {name:'Error',message:n.arguments.length?String(primitive(expr(n.arguments[0],e))):''};
        case 'CallExpression':return call(n,e);
        default:fail('Unsupported expression: '+n.type,n);
      }
    }
    let fn,functionName;
    function call(n,e){
      if(n.arguments.some(a=>a.type==='SpreadElement'))fail('Spread arguments are not supported.',n);
      if(n.callee.type==='Identifier'&&n.callee.name===functionName)return invoke(n.arguments.map(a=>expr(a,e)));
      if(n.callee.type!=='MemberExpression'||n.callee.computed)fail('Only recursive self-calls and documented Math/array methods are supported.',n);
      const method=n.callee.property.name;
      if(n.callee.object.type==='Identifier'&&n.callee.object.name==='Math'){
        if(!['abs','floor','ceil','round','min','max','pow'].includes(method))fail('Unsupported Math method: '+method,n);
        const args=n.arguments.map(a=>expr(a,e));if(args.some(a=>typeof a!=='number'))fail('Math calls require numbers.',n);return bounded(Math[method](...args));
      }
      const object=expr(n.callee.object,e),args=n.arguments.map(a=>expr(a,e));
      if(Array.isArray(object)){
        if(method==='push'){if(object.length+args.length>LIMITS.array)fail('Array limit exceeded.',n);const value=object.push(...args);record('write',n,e,value);return value;}
        if(method==='pop'&&!args.length){const value=object.pop();record('write',n,e,value);return value;}
        if(method==='slice'&&args.length<=2&&args.every(Number.isInteger))return object.slice(...args);
      }
      if(typeof object==='string'&&!args.length&&['toUpperCase','toLowerCase','trim'].includes(method))return bounded(object[method]());
      fail('Unsupported method call: '+method,n);
    }
    function block(nodes,e){for(const n of nodes)if(n.type==='VariableDeclaration')reserve(n,e);for(const n of nodes){const result=statement(n,e);if(result)return result;}}
    function statement(n,e){
      tick(n);
      switch(n.type){
        case 'BlockStatement':return block(n.body,scope(e));
        case 'EmptyStatement':return;
        case 'VariableDeclaration':if(n.kind==='var')fail('Use let or const for replay; var is not supported.',n);reserve(n,e);for(const d of n.declarations){declare(e,d.id.name,d.init?expr(d.init,e):undefined,n.kind==='const');record('declare',d,e,e.values.get(d.id.name).value,d.id.name);}return;
        case 'ExpressionStatement':{const value=expr(n.expression,e);record('expression',n,e,value);return;}
        case 'ReturnStatement':{const value=n.argument?expr(n.argument,e):undefined;record('return',n.argument||n,e,value);return {type:'return',value};}
        case 'ThrowStatement':{const value=expr(n.argument,e);record('throw',n,e,value);fail('Code threw: '+(value&&value.name==='Error'?value.message:JSON.stringify(copy(value))),n);break;}
        case 'IfStatement':{const test=expr(n.test,e);record('branch',n.test,e,test,test?'truthy':'falsy');return test?statement(n.consequent,e):n.alternate?statement(n.alternate,e):undefined;}
        case 'BreakStatement':case 'ContinueStatement':if(n.label)fail('Labeled jumps are not supported.',n);record(n.type==='BreakStatement'?'break':'continue',n,e);return {type:n.type==='BreakStatement'?'break':'continue'};
        case 'ForStatement':case 'WhileStatement':case 'DoWhileStatement':{
          const local=scope(e);if(n.init){if(n.init.type==='VariableDeclaration')statement(n.init,local);else expr(n.init,local);}
          let first=true;
          for(;;){tick(n);if(!(n.type==='DoWhileStatement'&&first)&&n.test){const test=expr(n.test,local);record('branch',n.test,local,test,test?'continue loop':'leave loop');if(!test)break;}
            first=false;const result=statement(n.body,local);if(result?.type==='return')return result;if(result?.type==='break')break;if(n.update)expr(n.update,local);
          }return;
        }
        case 'ForOfStatement':{
          if(n.await||n.left.type!=='VariableDeclaration'||n.left.kind==='var'||n.left.declarations.length!==1||n.left.declarations[0].id.type!=='Identifier')fail('Use for (const item of array) or for (let item of array).',n);
          // The loop binding is already in its temporal dead zone while the
          // iterable is evaluated, even when an outer binding has that name.
          const iterableScope=scope(e);reserve(n.left,iterableScope);
          const values=expr(n.right,iterableScope);if(!Array.isArray(values)&&typeof values!=='string')fail('for-of requires an array or string.',n.right);
          for(const value of values){tick(n);const local=scope(e),name=n.left.declarations[0].id.name;declare(local,name,value,n.left.kind==='const');record('iteration',n.left,local,value,name);const result=statement(n.body,local);if(result?.type==='return')return result;if(result?.type==='break')break;}return;
        }
        default:fail('Unsupported statement: '+n.type,n);
      }
    }
    function invoke(args){
      if(++depth>LIMITS.depth)fail('Stopped at the 12-call recursion limit.',fn);
      const local=scope(null);
      try{
        for(let i=0;i<fn.params.length;i++){const p=fn.params[i],id=p.type==='AssignmentPattern'?p.left:p;if(id.type!=='Identifier'||id.name===functionName||id.name==='Math'||id.name==='undefined')fail('Unsupported parameter binding.',p);declare(local,id.name,args[i]===undefined&&p.type==='AssignmentPattern'?expr(p.right,local):args[i],false);}
        record('call',fn,local,args,functionName);
        if(fn.body.type!=='BlockStatement'){const value=expr(fn.body,local);record('return',fn.body,local,value);return value;}
        const result=block(fn.body.body,local);if(result?.type==='return')return result.value;record('return',fn.body,local,undefined,'Reached the end');return undefined;
      }finally{depth--;}
    }
    try{
      if(typeof source!=='string'||!source.trim()||source.length>LIMITS.source)fail('Replay needs 1–50,000 characters of source.');
      if(!['JavaScript','TypeScript'].includes(options.language||'JavaScript'))fail('Replay supports a documented JavaScript/TypeScript subset.');
      if(typeof argsText!=='string'||argsText.length>LIMITS.input)fail('Arguments must be a JSON array of at most 10,000 characters.');
      const args=JSON.parse(argsText);if(!Array.isArray(args))fail('Provide arguments as a JSON array, for example [100, 20].');
      function validate(v,level=0){if(level>LIMITS.depth)fail('Input nesting exceeds 12 levels.');if(v&&typeof v==='object'){if(Array.isArray(v)&&v.length>LIMITS.array)fail('Input arrays are limited to 400 items.');if(!Array.isArray(v)&&Object.keys(v).length>100)fail('Input objects are limited to 100 properties.');for(const [k,x]of Object.entries(v)){if(forbidden.has(k))fail('Unsupported input property: '+k);validate(x,level+1);}}else bounded(v);}
      validate(args);
      const ast=parser.parse(source,{sourceType:'unambiguous',plugins:options.language==='TypeScript'?['typescript','jsx']:['jsx'],attachComment:false});
      const functions=[];walk(ast.program,n=>{if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type))functions.push(n);});functions.sort((a,b)=>a.start-b.start);
      fn=options.scopeId?functions.find(n=>'function-'+n.start===options.scopeId):functions[0];if(!fn)fail('Choose a plain function or arrow function scope before running.');
      if(fn.async||fn.generator)fail('Async functions and generators are not supported in replay.',fn);
      // Built-ins cannot silently override a source binding, even outside this scope.
      function checkBinding(n){if(!n)return;if(n.type==='Identifier'&&['Math','Error'].includes(n.name))fail('Replay cannot resolve a shadowed built-in: '+n.name,n);if(n.type==='AssignmentPattern')checkBinding(n.left);if(n.type==='RestElement')checkBinding(n.argument);if(n.type==='ArrayPattern')n.elements.forEach(checkBinding);if(n.type==='ObjectPattern')n.properties.forEach(p=>checkBinding(p.value||p.argument));}
      walk(ast.program,n=>{if(n.type==='VariableDeclarator')checkBinding(n.id);if(/^(Function|Class)/.test(n.type)){checkBinding(n.id);(n.params||[]).forEach(checkBinding);}if(n.type==='ArrowFunctionExpression')n.params.forEach(checkBinding);if(n.type.startsWith('Import')&&n.local)checkBinding(n.local);if(n.type==='CatchClause')checkBinding(n.param);});
      functionName=fn.id?.name||options.name||'(anonymous)';
      walk(fn.body,n=>{if(!allowed.has(n.type))fail('Replay does not support '+n.type+'. Static explanation remains available.',n);if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&[functionName,'Math','undefined'].includes(n.id.name))fail('This binding name is reserved in replay: '+n.id.name,n);if(n.type==='UnaryExpression'&&n.operator==='delete')fail('delete is not supported.',n);});
      const value=invoke(args);copyBudget=0;
      return {ok:true,steps,result:copy(value),operations,limits:LIMITS,semantics:'restricted-interpreter'};
    }catch(error){return {ok:false,steps,error:error.message,range:range(error.node||lastNode),operations,limits:LIMITS,semantics:'restricted-interpreter'};}
  }
  return {run,LIMITS};
});
