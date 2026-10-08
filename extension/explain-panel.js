const vscode = require('vscode');
const crypto = require('node:crypto');
const MAX_CODE = 50000;
function captureSource(editor) {
  if (!editor) return null;
  const document=editor.document,selection=editor.selection;
  const selected=selection && !selection.isEmpty;
  const code=selected?document.getText(selection):document.getText();
  if(!code.trim())throw new Error('Select a function or open a file containing code.');
  if(code.length>MAX_CODE)throw new Error('Select a smaller section. CodeAlive accepts up to 50,000 characters.');
  const offset=selected?document.offsetAt(selection.start):0,position=document.positionAt(offset);
  const language=['javascript','javascriptreact'].includes(document.languageId)?'JavaScript':['typescript','typescriptreact'].includes(document.languageId)?'TypeScript':document.languageId;
  return {document,version:document.version,offset,viewColumn:editor.viewColumn,payload:{type:'explainSource',code,language,filename:document.uri.path.split('/').pop(),baseLine:position.line+1,baseColumn:position.character,sourceToken:crypto.randomBytes(18).toString('hex')}};
}
function explainHtml(template,webview,extensionUri) {
  const nonce=crypto.randomBytes(18).toString('base64');
  const resource=name=>webview.asWebviewUri(vscode.Uri.joinPath(extensionUri,'media',name)).toString();
  const csp=`default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource}; img-src ${webview.cspSource} data:; media-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none';`;
  return template.replace('<meta charset="utf-8">',`<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">`)
    .replace(/href="(explainer\/[^"]+)"/g,(_,file)=>`href="${resource(file)}"`)
    .replace(/<script src="(explainer\/[^"]+)"><\/script>/g,(_,file)=>`<script nonce="${nonce}" src="${resource(file)}"></script>`)
    .replace(/href="index.html"/g,'href="#"');
}
async function revealSource(snapshot,message,notice=()=>{}) {
  if(!snapshot?.document || message.sourceToken!==snapshot.payload.sourceToken)return false;
  if(!Number.isInteger(message.start)||!Number.isInteger(message.end)||message.start<0||message.end<=message.start||message.end>snapshot.payload.code.length)return false;
  if(snapshot.document.isClosed||snapshot.document.version!==snapshot.version){notice('The editor file changed. Load editor again to refresh source links.');return false;}
  const selection=new vscode.Selection(snapshot.document.positionAt(snapshot.offset+message.start),snapshot.document.positionAt(snapshot.offset+message.end));
  const editor=await vscode.window.showTextDocument(snapshot.document,{viewColumn:snapshot.viewColumn||vscode.ViewColumn.One,preserveFocus:true,selection});
  editor.revealRange(selection,vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  return true;
}
function activateExplain(context) {
  let panel,ready=false,loaded=null,queued=null,lastEditor=vscode.window.activeTextEditor;
  const disposables=[],documents=new Map();
  if(vscode.workspace.registerTextDocumentContentProvider)disposables.push(vscode.workspace.registerTextDocumentContentProvider('codealive-snapshot',{provideTextDocumentContent:uri=>documents.get(uri.toString())||''}));
  const currentEditor=()=>vscode.window.activeTextEditor || (lastEditor&&!lastEditor.document.isClosed?lastEditor:null) || vscode.window.visibleTextEditors?.[0];
  const send=snapshot=>{if(!snapshot)return;loaded=snapshot;queued=snapshot.payload;if(panel&&ready)panel.webview.postMessage(queued);};
  async function show(snapshot) {
    if(panel){
      const column=snapshot?.document&&snapshot.viewColumn===panel.viewColumn?vscode.ViewColumn.Beside:panel.viewColumn;
      panel.reveal(column,true);send(snapshot);return;
    }
    const created=vscode.window.createWebviewPanel('codealive.explain','CodeAlive · Explain',vscode.ViewColumn.Beside,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[vscode.Uri.joinPath(context.extensionUri,'media')]});
    panel=created;ready=false;send(snapshot);
    disposables.push(created.onDidDispose(()=>{if(panel===created){panel=null;ready=false;loaded=null;queued=null;}}));
    disposables.push(created.webview.onDidReceiveMessage(async message=>{
      if(panel!==created||!message||typeof message.type!=='string')return;
      try {
        if(message.type==='ready'){ready=true;if(queued)created.webview.postMessage(queued);}
        else if(message.type==='sourceReceived'){if(queued?.sourceToken===message.sourceToken)queued=null;}
        else if(message.type==='loadEditor'){const source=captureSource(currentEditor());if(source)send(source);else created.webview.postMessage({type:'notice',text:'Open a JavaScript or TypeScript file, then load it here.'});}
        else if(message.type==='openStudio')await vscode.commands.executeCommand('codealive.open');
        else if(message.type==='reviewPR')await vscode.commands.executeCommand('codealive.reviewPR');
        else if(message.type==='saveExplanationVideo'){const saved=await require('./video-save').saveExplanationVideo(message);created.webview.postMessage({type:'notice',text:saved?'Explanation video saved.':'Save cancelled.'});}
        else if(message.type==='openEvidence'){const {safeLink}=require('./pr-core'),link=safeLink(message.url);if(link)await vscode.env.openExternal(vscode.Uri.parse(link));}
        else if(message.type==='revealComparison'){
          if(!loaded?.comparison||message.sourceToken!==loaded.payload.sourceToken||!['before','after'].includes(message.side))return;
          const code=loaded.payload[message.side];if(!Number.isInteger(message.start)||!Number.isInteger(message.end)||message.start<0||message.end<=message.start||message.end>code.length)return;
          let snapshot;
          if(message.side==='after'&&loaded.document)snapshot={...loaded,offset:0,payload:{...loaded.payload,code}};
          else{const uri=vscode.Uri.parse(`codealive-snapshot:/${loaded.payload.sourceToken}/${message.side}.${loaded.payload.language==='TypeScript'?'ts':'js'}`);documents.set(uri.toString(),code);const document=await vscode.workspace.openTextDocument(uri);snapshot={document,version:document.version,offset:0,payload:{sourceToken:message.sourceToken,code}};}
          await revealSource(snapshot,message,text=>created.webview.postMessage({type:'notice',text}));
        }
        else if(message.type==='revealSource'){
          await revealSource(loaded,message,text=>created.webview.postMessage({type:'notice',text}));
        }
      } catch(error){vscode.window.showErrorMessage('CodeAlive: '+error.message);}
    }));
    try {const bytes=await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri,'media','explain.html'));created.webview.html=explainHtml(Buffer.from(bytes).toString('utf8'),created.webview,context.extensionUri);}
    catch(error){created.dispose();throw new Error('Could not open the explainer. Reinstall the latest CodeAlive package, or run npm run build in the repository. '+error.message);}
  }
  const command=(id,callback)=>disposables.push(vscode.commands.registerCommand(id,async(...args)=>{try{await callback(...args);}catch(error){vscode.window.showErrorMessage('CodeAlive: '+error.message);}}));
  command('codealive.explain',()=>show(captureSource(currentEditor())));
  command('codealive.start',resource=>{
    const active=vscode.window.activeTextEditor;
    const editor=vscode.Uri.isUri(resource)
      ?[active,...(vscode.window.visibleTextEditors||[])].find(editor=>editor?.document.uri.toString()===resource.toString())
      :active;
    // A panel-focused invocation reveals existing work instead of reloading the last editor.
    const supported=editor&&['javascript','javascriptreact','typescript','typescriptreact'].includes(editor.document.languageId);
    const selection=editor?.selection&&!editor.selection.isEmpty?editor.selection:undefined;
    const source=supported&&editor.document.getText(selection).trim()?captureSource(editor):null;
    return show(source);
  });
  command('codealive.openExplainer',()=>show(null));
  const showComparison=message=>{
    if(!message||typeof message.before!=='string'||typeof message.after!=='string'||Math.max(message.before.length,message.after.length)>MAX_CODE||!['JavaScript','TypeScript'].includes(message.language))throw new Error('Invalid comparison source.');
    documents.clear();return show({comparison:true,document:message.document,version:message.version,viewColumn:message.viewColumn,payload:{type:'compareSource',before:message.before,after:message.after,language:message.language,filename:message.filename,evidence:message.evidence,sourceToken:crypto.randomBytes(18).toString('hex')}});
  };
  command('codealive.explainChanges',async()=>showComparison(await require('./compare-source').captureWorkingTree(currentEditor())));
  command('codealive.compareText',showComparison);
  command('codealive.explainText',message=>{
    if(!message||typeof message.code!=='string'||message.code.length>MAX_CODE||typeof message.language!=='string'||message.language.length>40)throw new Error('Invalid explanation source.');
    return show({payload:{type:'explainSource',code:message.code,language:message.language,filename:'Studio source',baseLine:1,baseColumn:0,sourceToken:crypto.randomBytes(18).toString('hex')}});
  });
  disposables.push(vscode.window.onDidChangeActiveTextEditor(editor=>{if(editor)lastEditor=editor;}));
  context.subscriptions.push(...disposables,{dispose(){panel?.dispose();for(const d of disposables)d.dispose();}});
  return {getDiagnostics:()=>({open:!!panel,ready,sourceAcknowledged:!!loaded&&!queued,language:loaded?.payload.language,sourceLength:loaded?.payload.code?.length,comparison:!!loaded?.comparison,beforeLength:loaded?.payload.before?.length,afterLength:loaded?.payload.after?.length})};
}
module.exports={activateExplain,captureSource,explainHtml,revealSource};
