const vscodeApi=window.codeAliveHost;
$('state').textContent='READY TO PLAY';
let followEnabled=false,deferredSource=null;
function applySource(source){if(session){deferredSource=source;message('Editor changed. Stop playback to load the latest code.');return}if(typeof source.code!=='string'||source.code.length>50000||!['JavaScript','TypeScript','Python','Terraform','Kubernetes'].includes(source.language))return;$('code').value=source.code;$('language').value=source.language;sampleIndex=-1;refresh();renderSamples();deferredSource=null;$('editorStatus').textContent='Loaded: '+(source.filename||'editor')+' · '+source.language;message('Your editor code is loaded. Press Make it alive.')}
window.addEventListener('message',event=>{const data=event.data;if(!data)return;if(data.type==='source'){applySource(data);vscodeApi.postMessage({type:'sourceReceived',revision:data.revision});}else if(data.type==='followStatus'){followEnabled=!!data.enabled;$('editorStatus').textContent=followEnabled?'Following editor · code stays local':'Editor follow is off';$('toggleFollow').textContent=followEnabled?'Stop following':'Follow editor'}else if(data.type==='preset'){if(data.preset)CodeAliveStudio.apply(data.preset);else if(!data.automatic)message('No saved preset yet. Set up your video and click Save preset.');}else if(data.type==='notice')message(data.text)});
$('loadEditor').onclick=()=>vscodeApi.postMessage({type:'loadEditor'});
$('toggleFollow').onclick=()=>vscodeApi.postMessage({type:'toggleFollow'});
const originalStop=stop;stop=function(){originalStop();if(deferredSource){const latest=deferredSource;deferredSource=null;applySource(latest)}};
$('share').textContent='Copy sample link';$('share').onclick=()=>vscodeApi.postMessage({type:'copyShare',sample:Math.max(0,sampleIndex),style});
$('shareFile').hidden=true;$('save').textContent='Save video';
$('save').onclick=async event=>{event.preventDefault();if(!videoBlob){message('Record a video first.');return}if(videoBlob.size>50*1024*1024){message('This recording exceeds 50 MB. Try a shorter clip.');return}try{const reader=new FileReader();reader.onload=()=>vscodeApi.postMessage({type:'saveVideo',base64:String(reader.result).split(',')[1],format:videoBlob.type.includes('mp4')?'mp4':'webm'});reader.onerror=()=>message('Could not read the recording. Try recording again.');reader.readAsDataURL(videoBlob)}catch(error){message(error.message)}};
$('savePreset').onclick=()=>vscodeApi.postMessage({type:'savePreset',preset:CodeAliveStudio.settings()});
$('loadPreset').onclick=()=>vscodeApi.postMessage({type:'loadPreset'});
$('videoTemplate').onchange=()=>CodeAliveStudio.template($('videoTemplate').value);
const mp4Button=document.createElement('button');mp4Button.id='saveMp4';mp4Button.textContent='Save as MP4';$('download').append(mp4Button);mp4Button.onclick=()=>{if(!videoBlob)return;const reader=new FileReader();reader.onload=()=>vscodeApi.postMessage({type:'saveVideo',base64:String(reader.result).split(',')[1],format:videoBlob.type.includes('mp4')?'mp4':'webm',convertToMp4:true});if(videoBlob.size>50*1024*1024){message('Video exceeds 50 MB. Choose a shorter recording.');return}reader.readAsDataURL(videoBlob)};
$('kit').hidden=true;
vscodeApi.postMessage({type:'ready'});

$('openExplainer').onclick=event=>{event.preventDefault();vscodeApi.postMessage({type:'explainCode',code:$('code').value,language:$('language').value})};
