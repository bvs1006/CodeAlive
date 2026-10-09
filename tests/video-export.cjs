const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

// FileReader includes the Blob MIME type verbatim, including codec-list commas.
// Exercise all three production Save handlers with the same binary fixtures.
function readerFor(reads){return class FileReader{
  readAsDataURL(blob){reads.push(blob.arrayBuffer().then(bytes=>{this.result=`data:${blob.type};base64,${Buffer.from(bytes).toString('base64')}`;this.onload();}));}
};}
const stream=()=>({addTrack(){},getTracks:()=>[{stop(){}}],getAudioTracks:()=>[{clone:()=>({stop(){}})}]});
const node=()=>({gain:{value:0},connect(){},start(){},stop(){}});
class Audio{
  constructor(){this.currentTime=0;this.destination={};}
  createGain(){return node();}createConstantSource(){return node();}
  createMediaStreamDestination(){return {stream:stream()};}
  async resume(){}async close(){}
}
function elements(){
  const all={},context={fillRect(){},fillText(){}};
  const get=id=>all[id]||=( {value:'',checked:false,children:[],hidden:false,textContent:'',append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},querySelectorAll:()=>[],querySelector:()=>null,setAttribute(){},removeAttribute(){},addEventListener(){},load(){},getContext:()=>context,captureStream:stream} );
  return {all,get,document:{getElementById:get,createElement:()=>get('created-'+Object.keys(all).length),addEventListener(){}}};
}
async function explanation(type,bytes){
  const reads=[],posted=[],{get,document}=elements();
  class Recorder{
    static isTypeSupported(candidate){return candidate===type;}
    constructor(){this.state='inactive';}start(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable({data:new Blob([bytes])});this.onstop();}
  }
  const scene={beginner:'Return the input.',start:0,end:1,line:1,endLine:1};
  const sandbox={Blob,URL,FileReader:readerFor(reads),AudioContext:Audio,MediaRecorder:Recorder,document,
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},
    CodeAliveMovie:{plan:(source,scenes)=>({seconds:1,scenes:scenes.map((s,index)=>({...s,index,start:0,end:1}))}),draw:(ctx,plan)=>plan.scenes[0]}};
  vm.runInNewContext(fs.readFileSync('shared/movie-ui.js','utf8'),sandbox);
  const view=sandbox.CodeAliveMovieUI.mount({host:{postMessage:m=>posted.push(m)},getContext:()=>({code:'x',scopeId:1,language:'JavaScript',model:{steps:[scene]}}),getTrace:()=>null,onRange(){}});
  view.setContext();get('movie-first').value=1;get('movie-last').value=1;get('movie-build').onclick();
  await get('movie-record').onclick();get('movie-stop').onclick();assert.equal(view.getBlob().type,type.toLowerCase());
  get('movie-save').onclick();await Promise.all(reads);assert.equal(posted.length,1);return posted[0];
}
async function studio(type,bytes){
  const reads=[],posted=[],{get,document}=elements();
  const sandbox={window:{codeAliveHost:{postMessage:m=>posted.push(m)},addEventListener(){}},document,$:get,
    FileReader:readerFor(reads),videoBlob:new Blob([bytes],{type}),stop(){},message(){}};
  vm.runInNewContext(fs.readFileSync('extension/media/bridge.js','utf8'),sandbox);
  await get('save').onclick({preventDefault(){}});get('download').children[0].onclick();await Promise.all(reads);
  return posted.filter(m=>m.type==='saveVideo');
}
(async()=>{
  for(const type of ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/mp4','video/webm']){
    const format=type.includes('mp4')?'mp4':'webm',bytes=Buffer.concat([format==='mp4'?Buffer.from([0,0,0,24,102,116,121,112]):Buffer.from([26,69,223,163]),Buffer.from(Array.from({length:4096},(_,i)=>i%256))]);
    const messages=[await explanation(type,bytes),...await studio(type,bytes)];assert.equal(messages.length,3);
    for(const message of messages){assert.equal(message.format,format);assert.equal(message.base64,bytes.toString('base64'),`${message.type}: ${type} must preserve the complete recording`);assert(Buffer.from(message.base64,'base64').equals(bytes));}
    assert.equal(messages[2].convertToMp4,true);
  }
  console.log('Video export passed: explanation, studio and MP4 conversion preserve recording bytes with and without codec-list commas. FileReader is simulated; desktop acceptance uses the real API.');
})().catch(error=>{console.error(error);process.exitCode=1;});
