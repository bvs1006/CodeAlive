const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),vscode=require('vscode');
async function until(check,label){const end=Date.now()+30000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+label);}
exports.run=async()=>{
  const extension=vscode.extensions.getExtension('codealive-local.codealive');assert(extension,'Packaged CodeAlive must be installed');assert.equal(extension.packageJSON.version,process.env.CODEALIVE_EXPECTED_VERSION);
  assert(extension.extensionPath.includes('installed'),'Test must exercise the installed VSIX, not the source checkout');
  const api=await extension.activate(),commands=await vscode.commands.getCommands(true);
  for(const id of ['codealive.explain','codealive.openExplainer','codealive.explainChanges','codealive.open','codealive.selection','codealive.reviewPR'])assert(commands.includes(id),id);
  const code='// actual editor\n\nfunction total(x: number) {\n  return x + 1;\n}\n';
  const fixture=path.join(process.env.CODEALIVE_FIXTURE_DIR,'sample.ts');fs.writeFileSync(fixture,code);
  const document=await vscode.workspace.openTextDocument(vscode.Uri.file(fixture)),editor=await vscode.window.showTextDocument(document,vscode.ViewColumn.One);
  editor.selection=new vscode.Selection(2,0,4,1);
  const {captureSource,revealSource}=require(path.join(extension.extensionPath,'explain-panel.js'));
  const snapshot=captureSource(editor);assert.equal(snapshot.payload.baseLine,3);assert.equal(snapshot.payload.language,'TypeScript');
  await vscode.commands.executeCommand('codealive.explain');await until(()=>api.getDiagnostics().explainer.sourceAcknowledged,'real webview source acknowledgement');
  assert.equal(api.getDiagnostics().explainer.sourceLength,snapshot.payload.code.length);
  const start=snapshot.payload.code.indexOf('x + 1');assert(await revealSource(snapshot,{sourceToken:snapshot.payload.sourceToken,start,end:start+5}));
  const revealed=vscode.window.visibleTextEditors.find(e=>e.document===document);assert.equal(revealed.selection.start.line,3);assert.equal(revealed.selection.start.character,9);
  assert.equal(await revealSource(snapshot,{sourceToken:'wrong',start,end:start+5}),false);
  const edit=new vscode.WorkspaceEdit();edit.insert(document.uri,new vscode.Position(0,0),'// changed\n');await vscode.workspace.applyEdit(edit);
  const notices=[];assert.equal(await revealSource(snapshot,{sourceToken:snapshot.payload.sourceToken,start,end:start+5},t=>notices.push(t)),false);assert(notices[0].includes('changed'));
  await vscode.window.showTextDocument(document,vscode.ViewColumn.One);editor.selection=new vscode.Selection(0,0,0,0);await vscode.commands.executeCommand('codealive.explain');await until(()=>api.getDiagnostics().explainer.sourceAcknowledged,'full file transfer');assert.equal(api.getDiagnostics().explainer.sourceLength,document.getText().length);
  const git=(await vscode.extensions.getExtension('vscode.git').activate()).getAPI(1);await until(()=>git.getRepository(document.uri)?.state.HEAD?.commit,'Git repository discovery');
  await vscode.window.showTextDocument(document,vscode.ViewColumn.One);await vscode.commands.executeCommand('codealive.explainChanges');await until(()=>api.getDiagnostics().explainer.comparison&&api.getDiagnostics().explainer.sourceAcknowledged,'real working-tree comparison');assert.equal(api.getDiagnostics().explainer.afterLength,document.getText().length);assert(api.getDiagnostics().explainer.beforeLength>0);
  await vscode.window.showTextDocument(document,vscode.ViewColumn.One);await vscode.commands.executeCommand('codealive.file');await until(()=>api.getDiagnostics().studio.sourceAcknowledged,'real studio bridge');
  assert(api.getDiagnostics().studio.ready);await document.save();await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  console.log(`REAL VS CODE PASS: ${process.platform}, VS Code ${vscode.version}, installed CodeAlive ${extension.packageJSON.version}; activation, selection/file transfer, both webviews, exact navigation and stale-document guard.`);
};
