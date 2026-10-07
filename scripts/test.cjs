const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function run(file,cwd=root){const result=spawnSync(process.execPath,[file],{cwd,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
run('scripts/build-shared.cjs');
for(const file of ['tests/explain-engine.cjs','tests/explain-panel.cjs','tests/replay-engine.cjs'])run(file);
for(const file of fs.readdirSync(path.join(root,'extension')).filter(f=>/^test-.*\.cjs$/.test(f)).sort())run(file,path.join(root,'extension'));
for(const file of [...fs.readdirSync(path.join(root,'shared')).filter(f=>/\.(js|css)$/.test(f)),'parser.js','parser.LICENSE.txt']){
  if(!fs.readFileSync(path.join(root,'web/explainer',file)).equals(fs.readFileSync(path.join(root,'extension/media/explainer',file))))throw Error('Generated assets differ: '+file);
}
console.log('All unit, extension and shared-asset checks passed.');
