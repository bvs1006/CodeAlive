const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const vscode=require('vscode');
const output=path.resolve(__dirname,'../../test-results/vscode-acceptance');
async function until(check,label){const end=Date.now()+45000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,150));}throw Error('Timed out: '+label);}
async function findFrame(browser,selector){let found;await until(async()=>{for(const context of browser.contexts())for(const page of context.pages())for(const frame of page.frames()){try{if(await frame.locator(selector).count()){found=frame;return true;}}catch{}}return false;},selector);return found;}
function narrationWav(){const samples=48000,b=Buffer.alloc(44+samples*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(Math.sin(2*Math.PI*500*i/48000)*10000),44+i*2);return b;}
exports.run=async(document,browser)=>{
  fs.mkdirSync(output,{recursive:true});
  try{
    const frame=await findFrame(browser,'#replay-run'),page=frame.page();
    assert.equal(await frame.textContent('#summary-name'),'total');
    assert(await frame.locator('#workflow-review-pr').isVisible());
    await frame.locator('#workflow-replay').press('Enter');assert.equal(await frame.evaluate(()=>document.activeElement.id),'replay-args');assert(await frame.locator('#replay-results').isHidden());
    await frame.fill('#replay-args','[2]');await frame.click('#replay-run');assert.match(await frame.textContent('#replay-status'),/Returned 3/);
    await frame.click('#replay-pin');await frame.fill('#replay-args','[5]');await frame.click('#replay-run');assert.match(await frame.textContent('#replay-status'),/Returned 6/);assert.match(await frame.textContent('#replay-baseline'),/"result": 3/);
    await frame.locator('#replay-slider').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await frame.textContent('#replay-value'),'6');
    await frame.click('#replay-play');await until(async()=>/Step 2 /.test(await frame.textContent('#replay-position')),'replay advances');await frame.click('#replay-play');assert.equal(await frame.textContent('#replay-play'),'Play');
    await frame.click('#workflow-video');assert.equal(await frame.evaluate(()=>document.activeElement.id),'movie-build');await frame.fill('#movie-first','1');await frame.fill('#movie-last','1');await frame.click('#movie-build');
    await frame.locator('#movie-scenes textarea').fill('Return the input plus one.');
    await frame.locator('#movie-narration').setInputFiles({name:'acceptance-narration.wav',mimeType:'audio/wav',buffer:narrationWav()});
    await until(async()=>/acceptance-narration.wav/.test(await frame.textContent('#movie-audio-status')),'local narration imported');
    await frame.click('#movie-fit');await frame.check('#movie-music');await frame.check('#movie-hide');await frame.click('#movie-record');
    await until(async()=>/^Video ready\./.test(await frame.textContent('#movie-status')),'real VS Code recording');
    assert.equal(await frame.locator('#movie-position').getAttribute('aria-live'),'off');
    assert.equal(await frame.textContent('#movie-scene-status'),'Scene 1 of 1. Return the input plus one.');
    await until(()=>frame.locator('#movie-preview').evaluate(v=>v.videoWidth===1080),'encoded preview');assert.equal(await frame.locator('#movie-preview').evaluate(v=>v.videoHeight),1920);
    // Let the real Save dialog apply the recording's format filter. Fetching a
    // preview blob would violate the webview's intentional connect-src policy.
    const fixture=process.env.CODEALIVE_FIXTURE_DIR,basename='accepted-explanation';
    await frame.click('#movie-save');const input=page.locator('.quick-input-widget input:visible');await input.waitFor({state:'visible'});await input.fill(path.join(fixture,basename));await input.press('Enter');
    let target;await until(()=>{const name=fs.readdirSync(fixture).find(n=>n===basename||/^accepted-explanation\.(mp4|webm)$/.test(n));if(name)target=path.join(fixture,name);return !!target;},'Save dialog writes chosen destination');await until(async()=>/Explanation video saved/.test(await frame.textContent('#status')),'Save acknowledgement');
    const saved=path.join(output,path.basename(target));fs.copyFileSync(target,saved);
    const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',saved],{encoding:'utf8'}));
    assert(info.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920));assert(info.streams.some(s=>s.codec_type==='audio'));assert(Number(info.format.duration)>=0.9&&Number(info.format.duration)<3.5);
    const pcm=execFileSync('ffmpeg',['-v','error','-ss','0.3','-i',saved,'-t','0.4','-vn','-ar','48000','-ac','1','-f','f32le','pipe:1']);const count=pcm.length/4;
    function amplitude(hz){let re=0,im=0;for(let i=0;i<count;i++){const value=pcm.readFloatLE(i*4),angle=2*Math.PI*hz*i/48000;re+=value*Math.cos(angle);im+=value*Math.sin(angle);}return 2*Math.hypot(re,im)/count;}
    assert(amplitude(500)>0.08,'Saved video includes imported narration');assert(amplitude(130.81)>0.015,'Saved video includes optional music');
    await frame.click('#movie-save');await input.waitFor({state:'visible'});await input.press('Escape');await until(async()=>/Save cancelled/.test(await frame.textContent('#status')),'Save cancellation');
    await frame.locator('#movie-scenes textarea').fill('Updated caption invalidates the prior recording.');assert(await frame.locator('#movie-download').isHidden());
    await frame.click('#workflow-compare');assert.equal(await frame.evaluate(()=>document.activeElement.id),'compare-before');
    await vscode.window.showTextDocument(document,vscode.ViewColumn.One);await vscode.commands.executeCommand('codealive.explainChanges');
    await until(async()=>/returns changed/.test(await frame.textContent('#compare-results')),'HEAD versus current source');
    await frame.locator('#compare-results article').filter({hasText:'returns changed'}).getByRole('button',{name:/^After · L\d+$/}).click();assert.match(await frame.textContent('#compare-source mark'),/x \+ 1/);
    assert.match(await frame.textContent('#compare-evidence'),/No CI evidence/);
    const pr=process.env.CODEALIVE_ACCEPTANCE_PR;
    if(pr){
      await frame.click('#workflow-review-pr');
      const url=page.getByPlaceholder('https://github.com/owner/repo/pull/123');await url.fill(pr);await url.press('Enter');await page.getByText('Public PR without sign-in',{exact:true}).click();
      const report=await findFrame(browser,'#refresh');await until(async()=>{const status=await report.textContent('#status');if(/rate limit|HTTP|unavailable|timed out/.test(status))throw Error(status);return status.startsWith('Evidence loaded.');},'live public PR evidence');
      assert.match(await report.textContent('#status'),/Required-check coverage is not verified/);assert.match(await report.textContent('#report'),/Not verified\. Passing displayed checks is not approval to merge\./);assert.match(await report.textContent('#report'),/Fetched/);
      await report.getByRole('button',{name:'Explain changes',exact:true}).first().click();
      const compare=await findFrame(browser,'#compare-results');await until(async()=>/PR head [a-f0-9]{40}/.test(await compare.textContent('#compare-evidence')),'live PR source revisions');assert.match(await compare.textContent('#compare-results'),/structur|changed|added|removed/);
      console.log('LIVE PUBLIC PR PASS: '+pr+'; revision-bound source and evidence rendered in installed VS Code.');
    }else console.log('Live public PR check not requested for this run; private sign-in remains a manual gate.');
    await page.screenshot({path:path.join(output,'installed-workflow.png')});
    console.log('FRESH VS CODE WORKFLOW PASS: real webview replay/input comparison, playback, narration/music recording, Save/cancel, export invalidation and HEAD comparison.');
  }catch(error){
    try{const session=await browser.newBrowserCDPSession();console.error('VS Code targets:',JSON.stringify(await session.send('Target.getTargets')));await session.detach();}catch{}
    for(const context of browser.contexts())for(const [i,page]of context.pages().entries()){
      console.error('VS Code frames:',page.frames().map(f=>f.url()));
      try{const session=await context.newCDPSession(page);console.error('VS Code frame tree:',JSON.stringify(await session.send('Page.getFrameTree')));await session.detach();await page.screenshot({path:path.join(output,'failure-'+i+'.png')});}catch{}
    }
    throw error;
  }
};
