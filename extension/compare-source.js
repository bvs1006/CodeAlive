const vscode=require('vscode');
async function captureWorkingTree(editor){
  if(!editor||editor.document.uri.scheme!=='file')throw Error('Open a tracked JavaScript or TypeScript file in a local Git repository.');
  const document=editor.document,version=document.version,after=document.getText();
  const language=['javascript','javascriptreact'].includes(document.languageId)?'JavaScript':['typescript','typescriptreact'].includes(document.languageId)?'TypeScript':null;
  if(!language||after.length>50000)throw Error('Choose a JavaScript/TypeScript file of at most 50,000 characters.');
  const extension=vscode.extensions.getExtension('vscode.git');if(!extension)throw Error('Enable the built-in VS Code Git extension first.');
  const git=(await extension.activate()).getAPI(1),repository=git.getRepository(document.uri);
  if(!repository?.state.HEAD?.commit)throw Error('The active file needs a Git repository with a HEAD commit.');
  const head=repository.state.HEAD.commit;let before;
  try{before=await repository.show(head,document.uri.fsPath);}catch{throw Error('No readable HEAD version exists at this path. For a new or renamed file, paste Before and After in the explainer.');}
  if(before.length>50000)throw Error('The HEAD version exceeds 50,000 characters. Compare a smaller section manually.');
  if(document.isClosed||document.version!==version)throw Error('The editor changed while loading. Run Explain Working Tree Changes again.');
  return {document,version,viewColumn:editor.viewColumn,before,after,language,filename:document.uri.path.split('/').pop(),evidence:{beforeLabel:`HEAD ${head}`,afterLabel:'Editor buffer (including unsaved changes)',note:'No CI evidence is attached to the editor buffer. This reads Git and source without running code or modifying the repository.'}};
}
module.exports={captureWorkingTree};
