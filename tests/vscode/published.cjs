// Prepare a released installer for acceptance; never rebuild or republish it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),repository='bvs1006/CodeAlive';
const tag=process.env.CODEALIVE_ACCEPTANCE_TAG||'v'+require('../../extension/package.json').version;
if(!/^v\d+\.\d+\.\d+$/.test(tag))throw Error('Choose a published major.minor.patch release tag.');
const version=tag.slice(1),filename=`codealive-${version}.vsix`;
const api=endpoint=>JSON.parse(execFileSync('gh',['api',`repos/${repository}/${endpoint}`],{encoding:'utf8'}));
const release=api(`releases/tags/${tag}`),commit=api(`commits/${tag}`);
if(release.draft||release.tag_name!==tag||!/^[a-f0-9]{40}$/.test(commit.sha))throw Error('The published release and tag must identify an exact commit.');
if(/^[a-f0-9]{40}$/.test(release.target_commitish)&&release.target_commitish!==commit.sha)throw Error('The release target and tag point to different commits.');
const assets=release.assets.filter(asset=>asset.name===filename&&asset.state==='uploaded');
if(assets.length!==1||!/^sha256:[a-f0-9]{64}$/.test(assets[0].digest||''))throw Error('The release must contain one VSIX with a SHA-256 digest.');
execFileSync('gh',['release','download',tag,'--repo',repository,'--pattern',filename,'--dir',root,'--clobber'],{stdio:'inherit'});
const file=path.join(root,filename),bytes=fs.readFileSync(file),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
if(bytes.length!==assets[0].size||'sha256:'+sha256!==assets[0].digest)throw Error('Downloaded installer size or SHA-256 does not match GitHub.');
const manifest=JSON.parse(execFileSync(process.platform==='win32'?'python':'python3',['-c',
  'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(z.read("extension/package.json").decode("utf-8"))',file],{encoding:'utf8'}));
if(manifest.version!==version||manifest.publisher!== 'codealive-local'||manifest.name!=='codealive')throw Error('The VSIX identity or version does not match the selected release.');
if(api(`commits/${tag}`).sha!==commit.sha)throw Error('The release tag moved during the download; rerun acceptance.');
const output=path.join(root,'test-results/vscode-acceptance');fs.mkdirSync(output,{recursive:true});
const receipt={releaseTag:tag,releaseSourceCommit:commit.sha,installer:filename,bytes:bytes.length,sha256,releaseUrl:release.html_url};
fs.writeFileSync(path.join(output,'published-installer.json'),JSON.stringify(receipt,null,2)+'\n');
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,
  `CODEALIVE_ACCEPTANCE_VERSION=${version}\nCODEALIVE_ACCEPTANCE_RELEASE_TAG=${tag}\nCODEALIVE_ACCEPTANCE_RELEASE_COMMIT=${commit.sha}\n`);
console.log('PUBLISHED INSTALLER VERIFIED: '+JSON.stringify(receipt));
