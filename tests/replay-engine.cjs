const assert=require('node:assert/strict'),vm=require('node:vm');
const {run}=require('../shared/replay-engine'),examples=require('../shared/explain-examples');
for(const [id,args,expected]of [['discount',[100,20],80],['cart',[[{price:12,quantity:2},{price:5,quantity:1}]],29],['search',[[{id:1},{id:2}],2],{id:2}],['greeting',['Ada',true],'Hello, Ada!'],['arrow',[4,5],20],['inventory',[{stock:5},2],true]]){
  const e=examples.find(x=>x.id===id),r=run(e.code,JSON.stringify(args),{language:e.language});assert(r.ok,id+': '+r.error);assert.deepEqual(JSON.parse(JSON.stringify(r.result)),expected);assert(r.steps.some(s=>s.kind==='return'));
  for(const s of r.steps){assert(s.range.start>=0&&s.range.end<=e.code.length);assert.equal(s.range.line,e.code.slice(0,s.range.start).split('\n').length);}
}
const cases=[
 ['function f(n){let total=0;for(let i=0;i<n;i++){if(i===2)continue;if(i===5)break;total+=i;}return total;}',[10]],
 ['function f(n){let x=0;do{x++;}while(x<n);return x;}',[0]],
 ['function f(n){let x=0;while(x<n){x++;}return x;}',[3]],
 ['function f(n){if(n<=1)return 1;return n*f(n-1);}',[5]],
 ['function f(x=3){return x*2;}',[]],
 ['function f(){let a=1;a+=(a=2);return a;}',[]],
 ['function f(){let a=1;{let a=2;a++;}return a;}',[]],
 ['function f(){const a=[];a.push(2,4);const x=a.pop();return x+a[0];}',[]],
 ['function f(a){return a>0?Math.floor(a):Math.abs(a);}',[-4]],
 ['function f(a){return a&&a.x;}',[null]],
 ['function f(a){return a??5;}',[null]]
];
for(const [source,args]of cases){const expected=vm.runInNewContext('('+source+')(...'+JSON.stringify(args)+')',{}, {timeout:1000}),result=run(source,JSON.stringify(args));assert(result.ok,result.error);assert.equal(result.result,expected);}
assert.match(run('function f(){let x=1;{return x;let x=2;}}','[]').error,/before initialization/);
assert.match(run('function f(){let x=1;for(let x=x;x<2;x++){}return x;}','[]').error,/before initialization/);
const limit=run('function f(){while(true){}}','[]');assert.equal(limit.ok,false);assert(limit.steps.length<=300);assert.match(limit.error,/limit/);
assert.match(run('function f(){return f();}','[]').error,/recursion limit/);
const guarded=run(examples[0].code,'[-1,20]');assert.equal(guarded.ok,false);assert(guarded.steps.some(s=>s.kind==='throw'));
for(const source of ['function f(){return process.env;}','function f(){return globalThis;}','function f(){return [].constructor;}','function f(){return Function("return 1")();}','async function f(){return await fetch("https://example.com");}','function f(){try{return 1;}finally{}}','function f(){const x=1;x=2;return x;}'])assert.equal(run(source,'[]').ok,false,source);
assert.equal(run('function f(x){return x;}','[{"__proto__":{}}]').ok,false);assert.equal(run('function f(x){return x;}','{}').ok,false);
const r=run('function f(){const x={v:1};x.v=2;return x;}','[]');const initial=r.steps.find(s=>s.kind==='declare').variables.x;assert.equal(initial.v,1);assert.equal(r.result.v,2);
assert.equal(run('function f(){const x={};x.self=x;return x;}','[]').ok,true);
assert.equal(run('const f=(x: number): number=>x*2','[5]',{language:'TypeScript'}).result,10);
assert.match(run('const Math={};function f(){return Math.abs(-1);}','[]').error,/shadowed built-in/);
assert.match(run('function f(Error){return new Error("oops");}','[1]').error,/shadowed built-in/);
assert.match(run('function f(){let a=[1];for(let i=0;i<20;i++){a=[a,a,a,a];}return a;}','[]').error,/snapshot-size limit/);
console.log('Replay passed: reference execution, scopes/TDZ, input cases, values, loops/jumps, recursion, isolation, snapshots and resource limits.');
