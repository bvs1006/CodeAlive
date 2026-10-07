const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {analyze}=require('../shared/explain-engine'),examples=require('../shared/explain-examples');
for(const example of examples){
  const result=analyze(example.code,{language:example.language});assert.equal(result.ok,true,example.id);assert(result.steps.length);assert(result.graph.nodes.length);
  const ranges=[...result.steps,...result.graph.nodes.map(n=>n.range).filter(Boolean)];
  for(const range of ranges){assert(range.start>=0&&range.end<=example.code.length&&range.end>range.start);assert.equal(range.line,example.code.slice(0,range.start).split('\n').length);}
  for(const edge of result.graph.edges){assert(result.graph.nodes.some(n=>n.id===edge.from));assert(result.graph.nodes.some(n=>n.id===edge.to));}
}
global.__codealiveExecuted=false;
assert(analyze('globalThis.__codealiveExecuted = true;').ok);assert.equal(global.__codealiveExecuted,false);
for(const [source,options] of [['',{}],['x'.repeat(50001),{}],['function {',{}],['def f(): pass',{language:'Python'}]])assert.equal(analyze(source,options).ok,false);
assert.equal(analyze('function words() { // if while return\n const text = "if else for"; return text; }').summary.branchCount,0);
const typed=analyze('const area = (width: number, height: number): number => width * height',{language:'TypeScript'});assert.deepEqual(typed.summary.inputs,['width: number','height: number']);assert.deepEqual(typed.summary.returns,['width * height']);
const nested=analyze('function outer(x) { function inner() { return 99; } const cb = () => 88; return x; }');assert.deepEqual(nested.summary.returns,['x']);assert.equal(nested.scopes.length,4);
const unicode='function hi(名前) {\r\n  const emoji = "🦋";\r\n  return 名前 + emoji;\r\n}';const ur=analyze(unicode);const ret=ur.steps.find(s=>s.title==='Return a result');assert.equal(unicode.slice(ret.start,ret.end),'名前 + emoji');assert.equal(ret.line,3);
const branched=analyze('function choose(x) { if (x) return 1; else return 2; }').graph;
const choice=branched.nodes.find(n=>n.kind==='decision');for(const [label,value] of [['truthy','Return 1'],['falsy','Return 2']]){const edge=branched.edges.find(e=>e.from===choice.id&&e.label===label);assert.equal(branched.nodes.find(n=>n.id===edge.to).label,value);}
assert(!analyze('function done() { return 1; dangerous(); }').graph.nodes.some(n=>n.label.includes('dangerous')));
const loop=analyze('function count() { for(let i=0;i<5;i++){if(i===1)continue;if(i===3)break;work(i);} after(); }').graph;
const continuation=loop.nodes.find(n=>n.label==='continue;'),breakNode=loop.nodes.find(n=>n.label==='break;');
const successor=n=>loop.nodes.find(x=>x.id===loop.edges.find(e=>e.from===n.id).to).label;
assert.equal(successor(continuation),'i++');assert.equal(successor(breakNode),'after();');assert(loop.edges.some(e=>e.back));
const doLoop=analyze('function repeat(){do { work(); } while (ready);}').graph;const entry=doLoop.nodes.find(n=>n.kind==='start');assert.equal(doLoop.nodes.find(n=>n.id===doLoop.edges.find(e=>e.from===entry.id).to).label,'work();');
assert(analyze('function f(){try{return work();}finally{cleanup();}}').warnings.some(w=>w.includes('collapsed')));
const long=analyze('function many(){'+Array.from({length:140},(_,i)=>`let x${i}=${i};`).join('')+'}');assert.equal(long.steps.length,80);assert.equal(long.graph.nodes.length,0);assert(long.warnings.some(w=>w.includes('100-node')));
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('web/explainer/parser.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('shared/explain-engine.js','utf8'),sandbox);assert(sandbox.CodeAliveExplain.analyze('function f(){return 1;}').ok);
console.log('Explainer: examples, ranges, control flow, isolation, limits and standalone bundle passed.');
