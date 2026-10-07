const {getJSON,collect}=require('./pr-api');
const {parsePR}=require('./pr-core');
const {TextDecoder}=require('node:util');
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/i.test(value);
const repo=value=>typeof value==='string'&&/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(value);
async function readRevision(repository,revision,path,token,request){
  if(!repo(repository)||!sha(revision)||typeof path!=='string'||path.length>2000)throw Error('Invalid revision source.');
  const parts=path.split('/');if(parts.length>20||parts.some(p=>!p||p==='.'||p==='..'||/[\x00-\x1f]/.test(p)))throw Error('Unsupported file path.');
  let tree=revision,entry;
  for(let i=0;i<parts.length;i++){
    const data=await request(`/repos/${repository}/git/trees/${tree}`,token);
    if(data.truncated||!Array.isArray(data.tree))throw Error('Git tree is incomplete; cannot verify this file.');
    entry=data.tree.find(e=>e.path===parts[i]);if(!entry||!sha(entry.sha))throw Error('File is unavailable at the requested revision.');
    if(i<parts.length-1){if(entry.type!=='tree')throw Error('Unsupported path component.');tree=entry.sha;}
  }
  if(entry.type!=='blob'||!['100644','100755'].includes(entry.mode))throw Error('Only regular text files can be compared. Symlinks and submodules are unsupported.');
  if(entry.size>200000)throw Error('Select a smaller file (50,000 source characters maximum).');
  const blob=await request(`/repos/${repository}/git/blobs/${entry.sha}`,token);
  if(blob.encoding!=='base64'||typeof blob.content!=='string'||blob.content.length>280000||blob.sha!==entry.sha)throw Error('The source blob is unavailable or too large.');
  const source=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from(blob.content,'base64'));
  if(source.length>50000||source.includes('\0'))throw Error('File must be UTF-8 text of at most 50,000 characters.');return source;
}
async function loadPRChange(url,path,expectedHead,token,request=getJSON){
  const ref=parsePR(url),repository=`${ref.owner}/${ref.repo}`,base=`/repos/${repository}`;
  if(!sha(expectedHead)||typeof path!=='string'||!(/\.(?:[cm]?jsx?|tsx?)$/i.test(path)))throw Error('Choose a JavaScript or TypeScript file from a refreshed PR report.');
  const pr=await request(`${base}/pulls/${ref.number}`,token);
  if(pr.state!=='open'||pr.merged)throw Error('Change explanations currently support open, unmerged PRs. Paste historical versions to compare a closed PR.');
  if(pr.head?.sha!==expectedHead||!sha(pr.base?.sha))throw Error('The PR revision changed. Refresh the evidence before explaining this file.');
  const files=await collect(`${base}/pulls/${ref.number}/files`,null,token,request),file=files.items.find(f=>f.filename===path);
  if(!file)throw Error('This file is absent from the retrieved PR diff. Refresh the report.');
  const comparison=await request(`${base}/compare/${pr.base.sha}...${pr.head.sha}?per_page=1`,token),mergeBase=comparison.merge_base_commit?.sha;
  if(!sha(mergeBase))throw Error('The PR merge base is unavailable; a reliable comparison cannot be loaded.');
  const headRepo=pr.head.repo?.full_name,baseRepo=pr.base.repo?.full_name;if(!repo(headRepo)||!repo(baseRepo)||baseRepo!==repository)throw Error('PR repository metadata is unavailable.');
  const [before,after]=await Promise.all([
    file.status==='added'?'':readRevision(baseRepo,mergeBase,file.previous_filename||path,token,request),
    file.status==='removed'?'':readRevision(headRepo,pr.head.sha,path,token,request)
  ]);
  const latest=await request(`${base}/pulls/${ref.number}`,token);
  if(latest.head?.sha!==pr.head.sha||latest.base?.sha!==pr.base.sha)throw Error('The PR changed while loading. Refresh before comparing.');
  return {before,after,language:/\.tsx?$/i.test(path)?'TypeScript':'JavaScript',filename:path,beforeLabel:`merge base ${mergeBase}`,afterLabel:`PR head ${pr.head.sha}`};
}
module.exports={loadPRChange,readRevision};
