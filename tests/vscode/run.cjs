const fs=require('node:fs'),path=require('node:path');
const {downloadAndUnzipVSCode,runVSCodeCommand,runTests}=require('@vscode/test-electron');
const root=path.resolve(__dirname,'../..');
(async()=>{
  const vscodeExecutablePath=await downloadAndUnzipVSCode('stable');
  const extensions=path.join(root,'.vscode-test/installed'),user=path.join(root,'.vscode-test/profile');
  fs.mkdirSync(path.join(user,'User'),{recursive:true});
  fs.writeFileSync(path.join(user,'User/settings.json'),JSON.stringify({'telemetry.telemetryLevel':'off','workbench.startupEditor':'none','security.workspace.trust.enabled':false}));
  const version=require('../../extension/package.json').version;
  const fixture=path.join(root,'.vscode-test/fixture');fs.mkdirSync(fixture,{recursive:true});
  const common=['--extensions-dir',extensions,'--user-data-dir',user];
  const oldPackage=path.join(root,'.vscode-test/codealive-0.5.0.vsix');
  require('node:child_process').execFileSync(process.platform==='win32'?'python':'python3',['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); names=[n for n in z.namelist() if n.endswith("codealive-0.5.0.vsix")]; assert len(names)==1; open(sys.argv[2],"wb").write(z.read(names[0]))',path.join(root,'downloads/codealive-pr-companion-0.5.0.zip'),oldPackage]);
  await runVSCodeCommand([...common,'--install-extension',oldPackage,'--force'],{version:'stable'});
  // Install, then force-reinstall the exact packaged artifact into an isolated profile.
  for(let i=0;i<2;i++)await runVSCodeCommand([...common,'--install-extension',path.join(root,`codealive-${version}.vsix`),'--force'],{version:'stable'});
  await runTests({vscodeExecutablePath,extensionDevelopmentPath:path.join(__dirname,'driver'),extensionTestsPath:path.join(__dirname,'suite.cjs'),launchArgs:[...common,'--skip-welcome','--skip-release-notes','--disable-workspace-trust'],extensionTestsEnv:{CODEALIVE_EXPECTED_VERSION:version,CODEALIVE_FIXTURE_DIR:fixture}});
})().catch(error=>{console.error(error);process.exitCode=1;});
