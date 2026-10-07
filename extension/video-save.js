const vscode=require('vscode');
const MAX_VIDEO=50*1024*1024;
async function saveExplanationVideo(message){
  if(!message||!['mp4','webm'].includes(message.format)||typeof message.base64!=='string'||message.base64.length>Math.ceil(MAX_VIDEO*4/3)||message.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(message.base64))throw Error('Invalid video data. Maximum size is 50 MB.');
  const bytes=Buffer.from(message.base64,'base64');if(!bytes.length||bytes.length>MAX_VIDEO)throw Error('Video is empty or too large.');
  const mp4=bytes.length>=12&&bytes.toString('ascii',4,8)==='ftyp',webm=bytes.length>=4&&bytes.readUInt32BE(0)===0x1a45dfa3;
  if(message.format==='mp4'?!mp4:!webm)throw Error('Recording format did not match its media header.');
  const target=await vscode.window.showSaveDialog({saveLabel:'Save CodeAlive explanation video',filters:{Video:[message.format]}});if(!target)return false;
  await vscode.workspace.fs.writeFile(target,bytes);return true;
}
module.exports={saveExplanationVideo};
