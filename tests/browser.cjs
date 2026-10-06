const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain'};
let origin;
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
    const before=await page.inputValue('#source');await page.selectOption('#language','TypeScript');assert.equal(await page.inputValue('#source'),before);assert(await page.locator('#result').isHidden());
    const examples=require('../shared/explain-examples');
    for(const example of examples){await page.selectOption('#example-select',example.id);await page.click('#load-example');await page.click('#explain');assert(await page.locator('#result').isVisible(),example.id);assert(await page.locator('#flow .flow-node').count()>0,example.id);}
    await page.selectOption('#audience','developer');assert.match(await page.textContent('#steps'),/Branch on/);
    await page.click('#edit-code');await page.fill('#source','function {');await page.click('#explain');assert.match(await page.textContent('#status'),/Could not parse/);assert(await page.locator('#flow-panel').isHidden());
    await page.fill('#source','function text(){return "<img src=x onerror=globalThis.injected=true>";}');await page.click('#explain');assert.equal(await page.locator('#result img').count(),0);assert.equal(await page.evaluate(()=>globalThis.injected),undefined);
    await page.selectOption('#example-select','discount');await page.click('#load-example');await page.click('#explain');await page.selectOption('#audience','beginner');
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/explainer-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(root,'test-results/explainer-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1080});await page.goto(origin+'/extension-preview');await page.waitForFunction(()=>hostMessages.some(m=>m.type==='ready'));
    const selection='function total(x: number) {\n  return x + 1;\n}';
    await page.evaluate(code=>window.dispatchEvent(new MessageEvent('message',{data:{type:'explainSource',code,language:'TypeScript',filename:'selected.ts',baseLine:42,baseColumn:0,sourceToken:'snapshot'}})),selection);
    assert.equal(await page.textContent('#summary-name'),'total');assert.match(await page.textContent('#steps'),/L43/);await page.locator('#steps button').first().click();
    const message=await page.evaluate(()=>hostMessages.find(m=>m.type==='revealSource'));assert.equal(message.sourceToken,'snapshot');assert.equal(selection.slice(message.start,message.end),'x + 1');assert.deepEqual(await page.evaluate(()=>cspViolations),[]);
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
