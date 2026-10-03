const vscode = require('vscode');
const crypto = require('node:crypto');
const {convertToMp4}=require('./export-utils');
const SITE = 'https://codealive-studio.bvs1006352681.chatgpt.site/';
const MAX_CODE = 50000, MAX_VIDEO = 50 * 1024 * 1024;
function languageFor(doc) {
  if (doc.languageId === 'python') return 'Python';
  if (['terraform', 'hcl'].includes(doc.languageId)) return 'Terraform';
  if (['yaml', 'yml'].includes(doc.languageId)) return 'Kubernetes';
  return 'JavaScript';
}
function snapshot(editor, selection = false) {
  if (!editor) { vscode.window.showInformationMessage('Open a code file, click inside its editor, then load it into CodeAlive.'); return null; }
  if (selection && editor.selection.isEmpty) { vscode.window.showInformationMessage('Select some code first.'); return null; }
  const code = selection ? editor.document.getText(editor.selection) : editor.document.getText();
  if (code.length > MAX_CODE) { vscode.window.showWarningMessage('CodeAlive accepts up to 50,000 characters. Select a smaller section.'); return null; }
  if (!code.trim()) { vscode.window.showInformationMessage('There is no code to load. Try a sample in the studio.'); return null; }
  return {type: 'source', code, language: languageFor(editor.document), filename: editor.document.uri?.path?.split('/').pop() || 'editor'};
}
function htmlFor(template, webview, extensionUri) {
  const nonce = crypto.randomBytes(18).toString('base64');
  const resource = name => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', name)).toString();
  let html = template.replace(/href="style.css"/, `href="${resource('style.css')}"`).replace(/<script src="(engine|app).js"><\/script>/g, (_,name) => `<script nonce="${nonce}" src="${resource(name+'.js')}"></script>`);
  const csp = `default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource}; img-src ${webview.cspSource} data:; media-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none';`;
  html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">`);
  html = html.replace('href="./"', 'href="#"').replace('BROWSER ALPHA / 02','VS CODE ALPHA / 02');
  html = html.replace('<main>', '<main><div class="extensionbar"><span id="editorStatus">Editor follow is off</span><button id="loadEditor">Load editor file</button><button id="toggleFollow">Follow editor</button><span>Click Play after loading code</span></div>');
  html = html.replace(/(<script nonce="[^"]+" src="[^"]+engine.js"><\/script>)/, `<script nonce="${nonce}" src="${resource('bootstrap.js')}"></script>$1`);
  html = html.replace(/(<script nonce="[^"]+" src="[^"]+app.js"><\/script>)/, `<script nonce="${nonce}" src="${resource('studio.js')}"></script>$1`);
  html = html.replace('</body>', `<script nonce="${nonce}" src="${resource('sort-engine.js')}"></script><script nonce="${nonce}" src="${resource('sorting.js')}"></script></body>`);
  html = html.replace('</body>', `<script nonce="${nonce}" src="${resource('bridge.js')}"></script></body>`);
  return html;
}
function activate(context) {
  let panel, ready=false, pending=null, follow=false, timer=null, lastEditor=vscode.window.activeTextEditor;
  const disposables=[];
  let revision=0, deliveryTimer, readinessTimer;
  function currentEditor(){const visible=vscode.window.visibleTextEditors||[];const active=vscode.window.activeTextEditor;if(active)return lastEditor=active;if(lastEditor&&visible.includes(lastEditor))return lastEditor;return lastEditor=visible[0]||lastEditor;}
  function deliver(attempt=0){if(!panel||!ready||!pending)return;const source=pending;panel.webview.postMessage(source);clearTimeout(deliveryTimer);deliveryTimer=setTimeout(()=>{if(pending?.revision===source.revision){if(attempt<2)deliver(attempt+1);else vscode.window.showWarningMessage('CodeAlive did not acknowledge editor code. Close the studio tab and reopen CodeAlive: Open Studio.');}},1500);}

  const send = source => { if (!source) return; pending={...source,revision:++revision}; if(panel&&ready)deliver(); };
  const status = () => { if(panel&&ready)panel.webview.postMessage({type:'followStatus',enabled:follow}); };
  async function ensurePanel() {
    if(panel){panel.reveal(vscode.ViewColumn.Beside,true);return panel;}
    const created=vscode.window.createWebviewPanel('codealive.studio','CodeAlive',vscode.ViewColumn.Beside,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[vscode.Uri.joinPath(context.extensionUri,'media')]});
    panel=created;ready=false;
    created.onDidDispose(()=>{if(panel===created){panel=null;ready=false;pending=null;follow=false;clearTimeout(timer);clearTimeout(deliveryTimer);clearTimeout(readinessTimer);}});
    created.webview.onDidReceiveMessage(async message=>{
      if (!message || typeof message.type!=='string') return;
      try {
        if(message.type==='ready'){ready=true;clearTimeout(readinessTimer);if(pending)deliver();status();created.webview.postMessage({type:'preset',preset:context.globalState?.get('codealive.videoPreset')||null,automatic:true});}
        else if(message.type==='sourceReceived'){if(pending?.revision===message.revision){pending=null;clearTimeout(deliveryTimer);}}
        else if(message.type==='bridgeError'){vscode.window.showErrorMessage('CodeAlive studio error: '+String(message.message).slice(0,400));}
        else if(message.type==='savePreset'){const preset=validatePreset(message.preset);await context.globalState.update('codealive.videoPreset',preset);created.webview.postMessage({type:'notice',text:'Video preset saved. Source code is not stored.'});}
        else if(message.type==='loadPreset'){created.webview.postMessage({type:'preset',preset:context.globalState.get('codealive.videoPreset')||null});}
        else if(message.type==='loadEditor'){send(snapshot(currentEditor()));}
        else if(message.type==='toggleFollow'){follow=!follow;status();if(follow)send(snapshot(currentEditor()));}
        else if(message.type==='copyShare') {
          if(!Number.isInteger(message.sample)||message.sample<0||message.sample>9||!['ambient','synth','bit'].includes(message.style))return;
          await vscode.env.clipboard.writeText(`${SITE}#sample=${message.sample}&style=${message.style}`);
          created.webview.postMessage({type:'notice',text:'Sample link copied. The site is currently private; pasted source is not included.'});
        } else if(message.type==='saveVideo') {
          if(typeof message.base64!=='string'||message.base64.length>Math.ceil(MAX_VIDEO*4/3)||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(message.base64)||!['mp4','webm'].includes(message.format))throw Error('Invalid or oversized video. Maximum size is 50 MB.');
          const bytes=Buffer.from(message.base64,'base64');if(!bytes.length||bytes.length>MAX_VIDEO)throw Error('Video is empty or too large.');
          const mp4=message.convertToMp4===true&&message.format==='webm';const format=mp4?'mp4':message.format;const target=await vscode.window.showSaveDialog({saveLabel:mp4?'Convert and save MP4':'Save CodeAlive video',filters:{Video:[format]}});
          if(!target)return;
          if(mp4)created.webview.postMessage({type:'notice',text:'Converting to MP4 with local FFmpeg…'});
          const output=mp4?await convertToMp4(bytes):bytes;await vscode.workspace.fs.writeFile(target,output);created.webview.postMessage({type:'notice',text:'Video saved.'});
          vscode.window.showInformationMessage('CodeAlive video saved.');
        }
      } catch(error) { vscode.window.showErrorMessage(`CodeAlive: ${error.message}`); }
    },null,disposables);
    try { const bytes=await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri,'media','index.html'));created.webview.html=htmlFor(Buffer.from(bytes).toString('utf8'),created.webview,context.extensionUri);readinessTimer=setTimeout(()=>{if(panel===created&&!ready)vscode.window.showWarningMessage('CodeAlive editor connection did not start. Close the studio tab and reopen it. If this repeats, send the studio error message.');},7000); }
    catch(error){created.dispose();throw error;}
    return created;
  }
  const command=(name,fn)=>disposables.push(vscode.commands.registerCommand(name,async()=>{try{await fn()}catch(error){vscode.window.showErrorMessage(`CodeAlive: ${error.message}`)}}));
  command('codealive.open',async()=>{await ensurePanel()});
  command('codealive.selection',async()=>{const src=snapshot(currentEditor(),true);if(src){await ensurePanel();send(src)}});
  command('codealive.file',async()=>{const src=snapshot(currentEditor());if(src){await ensurePanel();send(src)}});
  command('codealive.follow',async()=>{await ensurePanel();follow=!follow;status();if(follow)send(snapshot(currentEditor()))});
  function queue(editor){clearTimeout(timer);timer=setTimeout(()=>{if(follow&&panel)send(snapshot(editor))},450)}
  disposables.push(vscode.window.onDidChangeActiveTextEditor(editor=>{if(editor){lastEditor=editor;if(follow)queue(editor)}}));
  disposables.push(vscode.workspace.onDidChangeTextDocument(event=>{if(follow&&lastEditor&&event.document===lastEditor.document)queue(lastEditor)}));
  context.subscriptions.push(...disposables,{dispose(){clearTimeout(timer);clearTimeout(deliveryTimer);clearTimeout(readinessTimer);panel?.dispose()}});
}
function validatePreset(p){if(!p||typeof p!=='object')throw Error('Invalid preset');const out={};for(const key of ['template','hook','caption','ending','videoTitle','creator','style']){if(typeof p[key]!=='string'||p[key].length>80)throw Error('Invalid preset field');out[key]=p[key];}if(!['soundtrack','algorithm','project'].includes(out.template)||!['ambient','synth','bit'].includes(out.style))throw Error('Invalid template or style');if(!Number.isFinite(p.tempo)||p.tempo<60||p.tempo>160||![15,20,30].includes(p.duration)||typeof p.hideSource!=='boolean')throw Error('Invalid preset settings');return {...out,tempo:p.tempo,duration:p.duration,hideSource:p.hideSource};}
module.exports={activate, snapshot, languageFor, htmlFor,validatePreset};
