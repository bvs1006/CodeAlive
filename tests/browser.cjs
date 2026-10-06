const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain'};
let origin;
function narrationWav(){const samples=96000,buffer=Buffer.alloc(44+samples*2);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(48000,24);buffer.writeUInt32LE(96000,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(Math.sin(2*Math.PI*500*i/48000)*10000),44+i*2);return buffer;}
async function checkExplanationVideo(page,host=false){
  await page.fill('#movie-last','2');await page.click('#movie-build');assert.equal(await page.locator('#movie-scenes .movie-scene').count(),2);
  await page.locator('#movie-scenes textarea').first().fill('Check the inputs before calculating a result.');
  await page.locator('#movie-scenes textarea').nth(1).fill('Explain the error path and how it differs from a return.');
  await page.locator('#movie-narration').setInputFiles({name:'narration-test.wav',mimeType:'audio/wav',buffer:narrationWav()});await page.waitForFunction(()=>document.getElementById('movie-audio-status').textContent.includes('narration-test.wav'));
  await page.click('#movie-fit');assert.match(await page.textContent('#movie-length'),/2.0 seconds/);await page.check('#movie-hide');await page.check('#movie-music');await page.click('#movie-record');
  await page.waitForFunction(()=>document.getElementById('movie-status').textContent.startsWith('Video ready.'));await page.waitForFunction(()=>document.getElementById('movie-preview').videoWidth===1080);assert.equal(await page.locator('#movie-preview').evaluate(v=>v.videoHeight),1920);assert.match(await page.textContent('#movie-position'),/Scene 2\/2/);
  const name=host?'explanation-webview':'explanation-browser';let file;
  if(host){await page.click('#movie-save');await page.waitForFunction(()=>hostMessages.some(m=>m.type==='saveExplanationVideo'));const message=await page.evaluate(()=>hostMessages.find(m=>m.type==='saveExplanationVideo'));file=path.join(root,'test-results',name+'.'+message.format);fs.writeFileSync(file,Buffer.from(message.base64,'base64'));}
  else{const downloaded=page.waitForEvent('download');await page.click('#movie-save');const download=await downloaded;file=path.join(root,'test-results',name+path.extname(download.suggestedFilename()));await download.saveAs(file);}
  const spawn=require('node:child_process').spawnSync,probe=spawn('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'});assert.equal(probe.status,0,probe.stderr);const info=JSON.parse(probe.stdout);assert(info.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920));assert(info.streams.some(s=>s.codec_type==='audio'));assert(Number(info.format.duration)>=1.9&&Number(info.format.duration)<3.5,info.format.duration);
  const pcm=spawn('ffmpeg',['-v','error','-ss','0.3','-i',file,'-t','0.5','-vn','-ar','48000','-ac','1','-f','f32le','pipe:1'],{maxBuffer:1024*1024});assert.equal(pcm.status,0,String(pcm.stderr));const count=pcm.stdout.length/4;
  function amplitude(hz){let real=0,imaginary=0;for(let i=0;i<count;i++){const x=pcm.stdout.readFloatLE(i*4),angle=2*Math.PI*hz*i/48000;real+=x*Math.cos(angle);imaginary+=x*Math.sin(angle);}return 2*Math.hypot(real,imaginary)/count;}
  assert(amplitude(500)>0.08,'Imported narration must be audible in encoded audio');assert(amplitude(130.81)>0.015,'Optional music must be mixed with narration');
  if(!host){const frame=spawn('ffmpeg',['-v','error','-y','-ss','1.5','-i',file,'-frames:v','1',path.join(root,'test-results/explanation-frame.png')]);assert.equal(frame.status,0,String(frame.stderr));await page.locator('#movie-panel').screenshot({path:path.join(root,'test-results/explanation-editor.png')});}
  await page.locator('#movie-scenes textarea').first().fill('A revised caption clears the previous export.');assert(await page.locator('#movie-download').isHidden());
  await page.click('#replay-run');await page.selectOption('#movie-mode','replay');await page.fill('#movie-last','2');await page.click('#movie-build');assert.match(await page.textContent('#movie-length'),/Captured input: \[100,20\]/);assert.match(await page.locator('#movie-scenes textarea').first().inputValue(),/call/);
}
function preview(file,fn,template){
  const api={Uri:{joinPath:(uri,...parts)=>({path:uri.path+'/'+parts.join('/')})}};
  const sandbox={module:{exports:{}},require:name=>name==='vscode'?api:name==='./export-utils'?{}:require(name),Buffer};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  return sandbox.module.exports[fn](fs.readFileSync(path.join(root,template),'utf8'),{cspSource:origin,asWebviewUri:uri=>({toString:()=>origin+uri.path})},{path:'/extension'});
}
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/extension-preview'||pathname==='/studio-preview'){
    res.setHeader('Content-Type','text/html');res.end(pathname==='/extension-preview'?preview('extension/explain-panel.js','explainHtml','extension/media/explain.html'):preview('extension/extension.js','htmlFor','extension/media/index.html'));return;
  }
  const file=path.resolve(root,'.'+decodeURIComponent(pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{window.hostMessages=[];window.cspViolations=[];window.acquireVsCodeApi=location.pathname.endsWith('-preview')?()=>({postMessage:message=>window.hostMessages.push(message)}):undefined;window.addEventListener('securitypolicyviolation',e=>window.cspViolations.push(e.violatedDirective));});
    await page.goto(origin+'/web/explain.html');assert.equal(await page.locator('#example-select option').count(),10);
    await page.click('#explain');assert.equal(await page.textContent('#summary-name'),'discountedPrice');await page.locator('#steps button').last().click();assert.match(await page.textContent('#source-view mark'),/price - savings/);
    await page.locator('#flow [role=button]').filter({has:page.locator('title',{hasText:'Return price'})}).focus();await page.keyboard.press('Enter');
    assert(await page.locator('#replay-results').isHidden());await page.click('#replay-run');assert.match(await page.textContent('#replay-status'),/Returned 80/);
    await page.locator('#replay-slider').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.textContent('#replay-value'),'80');assert.match(await page.textContent('#replay-variables'),/"savings": 20/);
    await page.click('#replay-pin');await page.fill('#replay-args','[200,50]');await page.click('#replay-run');assert.match(await page.textContent('#replay-status'),/Returned 100/);assert.match(await page.textContent('#replay-baseline'),/"result": 80/);
    await page.click('#replay-play');await page.waitForFunction(()=>document.getElementById('replay-position').textContent.startsWith('Step 2 '));await page.click('#replay-play');assert.equal(await page.textContent('#replay-play'),'Play');
    await page.click('#compare-example');assert.match(await page.textContent('#compare-results'),/conditions changed/);await page.locator('#compare-results article').filter({hasText:'returns changed'}).getByRole('button',{name:'After'}).click();assert.match(await page.textContent('#compare-source mark'),/amount \*/);assert.match(await page.textContent('#compare-evidence'),/No CI evidence/);
    await page.fill('#compare-before','function f(){return "<img src=x onerror=alert(1)>"}');await page.click('#compare-run');assert.equal(await page.locator('#compare-results img').count(),0);
    const before=await page.inputValue('#source');await page.selectOption('#language','TypeScript');assert.equal(await page.inputValue('#source'),before);assert(await page.locator('#result').isHidden());
    const examples=require('../shared/explain-examples');
    for(const example of examples){await page.selectOption('#example-select',example.id);await page.click('#load-example');await page.click('#explain');assert(await page.locator('#result').isVisible(),example.id);assert(await page.locator('#flow .flow-node').count()>0,example.id);}
    await page.selectOption('#audience','developer');assert.match(await page.textContent('#steps'),/Branch on/);
    await page.click('#edit-code');await page.fill('#source','function {');await page.click('#explain');assert.match(await page.textContent('#status'),/Could not parse/);assert(await page.locator('#flow-panel').isHidden());
    await page.fill('#source','function text(){return "<img src=x onerror=globalThis.injected=true>";}');await page.click('#explain');assert.equal(await page.locator('#result img').count(),0);assert.equal(await page.evaluate(()=>globalThis.injected),undefined);
    await page.selectOption('#example-select','discount');await page.click('#load-example');await page.click('#explain');await page.selectOption('#audience','beginner');
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.click('#compare-example');await checkExplanationVideo(page);await page.screenshot({path:path.join(root,'test-results/explainer-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(root,'test-results/explainer-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1080});await page.goto(origin+'/extension-preview');await page.waitForFunction(()=>hostMessages.some(m=>m.type==='ready'));
    const selection='function total(x: number) {\n  return x + 1;\n}';
    await page.evaluate(code=>window.dispatchEvent(new MessageEvent('message',{data:{type:'explainSource',code,language:'TypeScript',filename:'selected.ts',baseLine:42,baseColumn:0,sourceToken:'snapshot'}})),selection);
    assert.equal(await page.textContent('#summary-name'),'total');assert.match(await page.textContent('#steps'),/L43/);await page.locator('#steps button').first().click();
    const message=await page.evaluate(()=>hostMessages.find(m=>m.type==='revealSource'));assert.equal(message.sourceToken,'snapshot');assert.equal(selection.slice(message.start,message.end),'x + 1');assert.deepEqual(await page.evaluate(()=>cspViolations),[]);
    await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'compareSource',before:'function f(){return 1}',after:'function f(){return 2}',language:'JavaScript',sourceToken:'comparison',evidence:{beforeLabel:'merge base abc',afterLabel:'head def',checks:[{shaLabel:'PR head',name:'tests',category:'passed',conclusion:'success'}]}}})));assert.match(await page.textContent('#compare-evidence'),/tests · passed/);await page.locator('#compare-results article').first().getByRole('button',{name:'Before'}).click();assert(await page.evaluate(()=>hostMessages.some(m=>m.type==='revealComparison'&&m.sourceToken==='comparison'&&m.side==='before')));await page.fill('#compare-after','function f(){return 3}');assert.equal(await page.textContent('#compare-evidence'),'');
    await page.selectOption('#example-select','discount');await page.click('#load-example');await page.click('#explain');await checkExplanationVideo(page,true);assert.deepEqual(await page.evaluate(()=>cspViolations),[]);
    for(const route of ['/web/index.html','/studio-preview']){await page.goto(origin+route);await page.fill('#code','const preserveMe = 42;');await page.selectOption('#language','Python');assert.equal(await page.inputValue('#code'),'const preserveMe = 42;');}
    await page.click('#openExplainer');const transfer=await page.evaluate(()=>hostMessages.find(m=>m.type==='explainCode'));assert.equal(transfer.code,'const preserveMe = 42;');assert.equal(transfer.language,'Python');
    await page.selectOption('#language','JavaScript');await page.check('#hideSource');await page.selectOption('#duration','15');
    await page.click('#record');await page.waitForFunction(()=>recorder?.state==='recording'&&dest.stream.getAudioTracks().length===1);
    await page.waitForTimeout(3200);await page.click('#play');await page.waitForFunction(()=>videoBlob?.size>1000&&document.getElementById('preview').videoWidth===1080);
    const recording=await page.evaluate(async()=>({type:videoBlob.type,bytes:Array.from(new Uint8Array(await videoBlob.arrayBuffer())),width:document.getElementById('preview').videoWidth,height:document.getElementById('preview').videoHeight}));
    assert.equal(recording.height,1920);const recordedFile=path.join(root,'test-results/studio-smoke.'+(recording.type.includes('mp4')?'mp4':'webm'));fs.writeFileSync(recordedFile,Buffer.from(recording.bytes));
    const probe=require('node:child_process').spawnSync('ffprobe',['-v','error','-show_streams','-of','json',recordedFile],{encoding:'utf8'});assert.equal(probe.status,0,probe.stderr||'ffprobe must be installed');const streams=JSON.parse(probe.stdout).streams;
    assert(streams.some(s=>s.codec_type==='video'));assert(streams.some(s=>s.codec_type==='audio'));assert(await page.isChecked('#hideSource'));
    assert.deepEqual(errors,[]);console.log('Browser integration passed: all examples, source links, keyboard, CSP, injection, mobile layout, language preservation and real audio/video recording.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
