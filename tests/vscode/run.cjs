const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {execFileSync}=require('node:child_process');
const {downloadAndUnzipVSCode,runVSCodeCommand,runTests}=require('@vscode/test-electron');
const root=path.resolve(__dirname,'../..');
async function freePort(){const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
(async()=>{
  const vscodeExecutablePath=await downloadAndUnzipVSCode('stable'),version=require('../../extension/package.json').version;
  fs.mkdirSync(path.join(root,'.vscode-test'),{recursive:true});
  const session=fs.mkdtempSync(path.join(root,'.vscode-test/acceptance-'));
  const oldPackage=path.join(session,'codealive-0.5.0.vsix');
  execFileSync(process.platform==='win32'?'python':'python3',['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); names=[n for n in z.namelist() if n.endswith("codealive-0.5.0.vsix")]; assert len(names)==1; open(sys.argv[2],"wb").write(z.read(names[0]))',path.join(root,'downloads/codealive-pr-companion-0.5.0.zip'),oldPackage]);
  for(const mode of ['fresh','upgrade']){
    const base=path.join(session,mode),extensions=path.join(base,'installed'),user=path.join(base,'profile'),fixture=path.join(base,'fixture');
    fs.mkdirSync(path.join(user,'User'),{recursive:true});fs.mkdirSync(fixture,{recursive:true});
    fs.writeFileSync(path.join(user,'User/settings.json'),JSON.stringify({'telemetry.telemetryLevel':'off','workbench.startupEditor':'none','security.workspace.trust.enabled':false,'files.simpleDialog.enable':true}));
    const git=args=>execFileSync('git',args,{cwd:fixture});git(['init']);
    fs.writeFileSync(path.join(fixture,'sample.ts'),'function total(x: number) { return x; }\n');git(['add','sample.ts']);git(['-c','user.name=CodeAlive test','-c','user.email=test@example.invalid','commit','-m','Comparison fixture']);
    const common=['--extensions-dir',extensions,'--user-data-dir',user];
    if(mode==='upgrade')await runVSCodeCommand([...common,'--install-extension',oldPackage,'--force'],{version:'stable'});
    else if(fs.existsSync(extensions)&&fs.readdirSync(extensions).length)throw Error('Fresh installation profile is not empty.');
    for(let i=0;i<(mode==='upgrade'?2:1);i++)await runVSCodeCommand([...common,'--install-extension',path.join(root,`codealive-${version}.vsix`),'--force'],{version:'stable'});
    const port=await freePort();
    await runTests({vscodeExecutablePath,extensionDevelopmentPath:path.join(__dirname,'driver'),extensionTestsPath:path.join(__dirname,'suite.cjs'),launchArgs:[fixture,...common,'--skip-welcome','--skip-release-notes','--disable-workspace-trust',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],extensionTestsEnv:{CODEALIVE_EXPECTED_VERSION:version,CODEALIVE_FIXTURE_DIR:fixture,CODEALIVE_INSTALL_MODE:mode,CODEALIVE_CDP_PORT:String(port),CODEALIVE_ACCEPTANCE_PR:process.env.CODEALIVE_ACCEPTANCE_PR||''}});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
