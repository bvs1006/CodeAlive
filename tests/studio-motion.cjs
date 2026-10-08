const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
for(const file of ['web/app.js','extension/media/app.js']){
  const commands=[],preference={matches:false},elements={};
  const ctx=new Proxy({}, {get:(_,key)=>(...args)=>commands.push([key,...args]),set:(_,key,value)=>{commands.push([key,value]);return true;}});
  const element=id=>elements[id]||=({value:({tempo:'100',duration:'20',volume:'45',language:'JavaScript',videoTemplate:'code'})[id]||'',checked:false,disabled:false,hidden:true,textContent:'',classList:{toggle(){}},replaceChildren(){},append(){},showModal(){},close(){},getContext:()=>ctx});
  const sandbox={console,URLSearchParams,window:{matchMedia:query=>{assert.equal(query,'(prefers-reduced-motion: reduce)');return preference;},addEventListener(){}},document:{getElementById:element,querySelectorAll:()=>[],createElement:()=>element('created'),addEventListener(){}},navigator:{},location:{hostname:'example.test',href:'https://example.test',hash:''},performance:{now:()=>0},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'extension/media/engine.js'),'utf8'),sandbox);sandbox.CodeAlive=sandbox.window.CodeAlive;
  if(file.startsWith('extension/')){vm.runInContext(fs.readFileSync(path.join(root,'extension/media/studio.js'),'utf8'),sandbox);sandbox.CodeAliveStudio=sandbox.window.CodeAliveStudio;}
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  const frame=time=>{commands.length=0;vm.runInContext(`draw(${time})`,sandbox);return JSON.stringify(commands);};
  assert.notEqual(frame(1000),frame(2000),file+': default preview animates');
  preference.matches=true;
  assert.equal(frame(1000),frame(2000),file+': reduced-motion idle preview stays still');
  const before=frame(2000);element('videoTitle').value='A new title';assert.notEqual(frame(2000),before,file+': editing still redraws');
  preference.matches=false;assert.notEqual(frame(1000),frame(2000),file+': motion setting changes take effect without reload');
  preference.matches=true;
  vm.runInContext("session={start:0,step:1000,duration:20,events:analysis.events};analyser={getByteFrequencyData(data){data.fill(255);}}",sandbox);
  const activeFrame=frame(1000);assert.equal(activeFrame,frame(2000),file+': active preview keeps decorative shapes and spectrum still');
  sandbox.performance.now=()=>1100;
  assert.notEqual(frame(2000),activeFrame,file+': playback progress still advances');
}
console.log('Studio motion passed: both surfaces, still decorations, live preference changes, editable frames and playback progress. Canvas APIs mocked.');
