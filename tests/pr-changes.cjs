const assert=require('node:assert/strict'),{loadPRChange,readRevision}=require('../extension/pr-changes');
const head='a'.repeat(40),base='b'.repeat(40),merge='c'.repeat(40),oldBlob='d'.repeat(40),newBlob='e'.repeat(40);
let moved=false,symlink=false,requests=[],status='modified';const pr=()=>({state:'open',merged:false,head:{sha:moved?'f'.repeat(40):head,repo:{full_name:'fork/r'}},base:{sha:base,repo:{full_name:'o/r'}}});
async function request(path,token){assert.equal(token,'local-token');requests.push(path);if(path==='/repos/o/r/pulls/1')return pr();if(path.includes('/pulls/1/files'))return [{filename:'a.ts',status,previous_filename:status==='renamed'?'old.ts':undefined}];if(path.includes('/compare/')){assert(path.includes(base+'...'+head));return {merge_base_commit:{sha:merge}};}if(path.includes('/git/trees/')){assert(path.endsWith(merge)||path.endsWith(head));const old=path.endsWith(merge);return {tree:[{path:old&&status==='renamed'?'old.ts':'a.ts',type:'blob',mode:symlink?'120000':'100644',sha:old?oldBlob:newBlob,size:35}]};}if(path.includes('/git/blobs/')){const old=path.endsWith(oldBlob);return {encoding:'base64',sha:old?oldBlob:newBlob,content:Buffer.from('function f(x:number){return x+'+(old?'1':'2')+'}').toString('base64')};}throw Error(path);}
(async()=>{
  let result=await loadPRChange('https://github.com/o/r/pull/1','a.ts',head,'local-token',request);assert(result.before.includes('x+1'));assert(result.after.includes('x+2'));assert.equal(result.language,'TypeScript');assert(result.beforeLabel.includes(merge));assert(requests.some(p=>p.startsWith('/repos/fork/r/git/')));
  status='renamed';result=await loadPRChange('https://github.com/o/r/pull/1','a.ts',head,'local-token',request);assert(result.before.includes('x+1'));
  status='added';result=await loadPRChange('https://github.com/o/r/pull/1','a.ts',head,'local-token',request);assert.equal(result.before,'');
  status='removed';result=await loadPRChange('https://github.com/o/r/pull/1','a.ts',head,'local-token',request);assert.equal(result.after,'');
  moved=true;await assert.rejects(loadPRChange('https://github.com/o/r/pull/1','a.ts',head,'local-token',request),/revision changed/);moved=false;status='modified';
  let pullReads=0;await assert.rejects(loadPRChange('https://github.com/o/r/pull/1','a.ts',head,'local-token',async(p,t)=>{if(p==='/repos/o/r/pulls/1'&&++pullReads===2)moved=true;return request(p,t);}),/changed while loading/);moved=false;
  symlink=true;await assert.rejects(readRevision('o/r',base,'a.ts','local-token',async(p,t)=>request(p.replace(base,merge),t)),/regular text files/);symlink=false;
  await assert.rejects(loadPRChange('https://github.com/o/r/pull/1','secret.env',head,'local-token',request),/JavaScript or TypeScript/);
  await assert.rejects(readRevision('o/r',base,'../a.ts','local-token',request),/Unsupported file path/);
  console.log('PR changes passed: exact merge-base/head blobs, fork source, renames/additions/removals, moving heads and unsupported paths/modes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
