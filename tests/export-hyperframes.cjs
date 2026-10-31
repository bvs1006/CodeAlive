const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { buildProject } = require('../scripts/export-hyperframes.cjs');

const cli = path.resolve(__dirname, '../scripts/export-hyperframes.cjs');
const source = 'for (const item of list) {\n  grab(item)\n}\n';
const script = {
  title: 'MCP and Code Mode',
  overlay: { handle: '@me', tag: 'TODAY', badge: { label: 'FIX', text: '???' } },
  scenes: [
    { caption: 'The MCP server sits between the agent and every tool.', startLine: 1, endLine: 1, duration: 5, visual: { type: 'diagram', left: 'AI', hub: 'MCP', items: ['calendar', 'database'] } },
    { caption: 'Code Mode lets the AI write the loop itself.', startLine: 1, endLine: 3, duration: 6, visual: { type: 'typed', file: 'trip.ts', code: 'for (const x of y) {\n  go(x)\n}' } }
  ]
};
const embeddedPlan = html => JSON.parse(html.match(/const plan = (.*);\n/)[1]);
const run = (args, cwd) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'codealive-hf-'));
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

// The project holds the product's own plan, renderer and a seekable timeline that draws it.
{
  const { plan, files } = buildProject({ source, script });
  assert.deepEqual(Object.keys(files).sort(), ['README.txt', 'index.html', 'movie-engine.js', 'plan.json']);
  assert.equal(plan.seconds, 11);
  assert.equal(plan.scenes.length, 2);
  assert.deepEqual(embeddedPlan(files['index.html']), plan, 'the plan embedded in index.html is the exact plan');
  assert.deepEqual(JSON.parse(files['plan.json']), plan);
  assert.equal(files['movie-engine.js'], fs.readFileSync(path.resolve(__dirname, '../shared/movie-engine.js'), 'utf8'));
  const html = files['index.html'];
  assert.match(html, /data-resolution="portrait"/);
  assert.match(html, /<canvas id="stage" class="clip" width="1080" height="1920"/);
  assert.match(html, /data-composition-id="main" data-start="0" data-duration="11"/);
  assert.match(html, /CodeAliveMovie\.draw\(ctx, plan, clock\.t, \{\}\)/);
  assert.match(html, /window\.__timelines\["main"\] = tl/);
  assert.ok(!/<audio/.test(html), 'no audio elements without narration or music');
  assert.ok(html.includes('cdn.jsdelivr.net/npm/gsap'), 'GSAP defaults to the CDN');
  assert.match(files['README.txt'], /hyperframes@0\.8\.223 render/);
  new vm.Script(html.match(/<script>\n([\s\S]*?)<\/script>/)[1]); // the inline script is valid JavaScript
}

// Landscape uses the 1920 x 1080 layout and options pass through to the plan.
{
  const { plan, files } = buildProject({ source, script, aspectRatio: '16:9', hideSource: true, showCaptions: false });
  assert.match(files['index.html'], /data-resolution="landscape"/);
  assert.match(files['index.html'], /width="1920" height="1080"/);
  assert.equal(plan.aspectRatio, '16:9');
  assert.equal(plan.hideSource, true);
  assert.equal(plan.showCaptions, false);
}

// Narration and music become audio tracks of exactly the video length; local GSAP replaces the CDN.
{
  const { files } = buildProject({ source, script, narrationFile: 'narration.wav', music: true, gsapLocal: true });
  assert.match(files['index.html'], /<audio id="voice" class="clip" src="assets\/narration\.wav" data-start="0" data-duration="11"/);
  assert.match(files['index.html'], /<audio id="music" class="clip" src="assets\/music\.mp3" data-start="0" data-duration="11" data-track-index="2" data-volume="0\.12"/);
  assert.match(files['index.html'], /<script src="gsap\.min\.js">/);
  assert.ok(!files['index.html'].includes('cdn.jsdelivr.net'));
}

// Source or captions that contain HTML cannot end the inline script early.
{
  const separator = String.fromCharCode(0x2028);
  const hostile = 'const a = "</script><script>alert(1)</script>"; // <!-- ' + separator + '\n';
  const { plan, files } = buildProject({ source: hostile, script: { scenes: [{ caption: '</script><b>x</b>', startLine: 1, endLine: 1, duration: 3 }] } });
  const html = files['index.html'];
  assert.ok(!html.includes('</script><script>alert(1)'));
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(!html.includes(separator), 'no raw line separator in the inline script');
  assert.equal(html.split('</script>').length - 1, 3, 'only the three script tags of the template close');
  assert.deepEqual(embeddedPlan(html), plan, 'escaping does not change the data');
}

// Bad input fails with the product's own messages.
{
  assert.throws(() => buildProject({ source, script: '{not json' }), /Failed to parse script JSON/);
  assert.throws(() => buildProject({ source, script: { scenes: [] } }), /at least one scene/);
  assert.throws(() => buildProject({ source, script: { scenes: [{ startLine: 1, endLine: 1 }] } }), /needs a caption/);
  assert.throws(() => buildProject({ source: 'x'.repeat(50001), script }), /50,000 characters/);
  assert.throws(() => buildProject({ source: null, script }), /source code/);
}

// The command line writes a folder, refuses to overwrite, and validates the narration file.
{
  const dir = tmp();
  try {
    const scriptFile = path.join(dir, 'script.json'), sourceFile = path.join(dir, 'code.js'), out = path.join(dir, 'out');
    fs.writeFileSync(scriptFile, JSON.stringify(script));
    fs.writeFileSync(sourceFile, source);
    const ok = run(['--script', scriptFile, '--source', sourceFile, '--out', out]);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /Exported 2 scenes \(11s, 9:16\)/);
    assert.ok(fs.existsSync(path.join(out, 'index.html')) && fs.existsSync(path.join(out, 'assets')));

    const again = run(['--script', scriptFile, '--source', sourceFile, '--out', out]);
    assert.equal(again.status, 1);
    assert.match(again.stderr, /not empty/);

    const wav = path.join(dir, 'voice.wav');
    fs.writeFileSync(wav, Buffer.alloc(64));
    const withVoice = path.join(dir, 'voiced');
    const voiced = run(['--script', scriptFile, '--source', sourceFile, '--out', withVoice, '--narration', wav, '--aspect', '16:9']);
    assert.equal(voiced.status, 0, voiced.stderr);
    assert.ok(fs.existsSync(path.join(withVoice, 'assets/narration.wav')));
    assert.match(fs.readFileSync(path.join(withVoice, 'index.html'), 'utf8'), /assets\/narration\.wav/);

    const txt = path.join(dir, 'voice.txt');
    fs.writeFileSync(txt, 'x');
    const wrongType = run(['--script', scriptFile, '--source', sourceFile, '--out', path.join(dir, 'a'), '--narration', txt]);
    assert.equal(wrongType.status, 1);
    assert.match(wrongType.stderr, /WAV, MP3 or M4A/);
    assert.ok(!fs.existsSync(path.join(dir, 'a')), 'nothing is written when validation fails');

    const big = path.join(dir, 'big.wav');
    fs.writeFileSync(big, Buffer.alloc(15 * 1024 * 1024 + 1));
    assert.match(run(['--script', scriptFile, '--source', sourceFile, '--out', path.join(dir, 'b'), '--narration', big]).stderr, /15 MB/);

    assert.match(run(['--source', sourceFile, '--out', path.join(dir, 'c')]).stderr, /--script is required/);
    assert.match(run(['--script', scriptFile, '--source', sourceFile, '--out', path.join(dir, 'd'), '--aspect', '4:3']).stderr, /9:16 or 16:9/);
    assert.match(run(['--bogus']).stderr, /Unknown option --bogus/);
    assert.match(run(['--script']).stderr, /needs a value/);

    if (hasFfmpeg) {
      const music = path.join(dir, 'music');
      const made = run(['--script', scriptFile, '--source', sourceFile, '--out', music, '--music']);
      assert.equal(made.status, 0, made.stderr);
      assert.ok(fs.statSync(path.join(music, 'assets/music.mp3')).size > 1000, 'a music bed was created');
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('HyperFrames export passed: embedded plan, aspect ratios, audio tracks, script-safe embedding, input errors, overwrite refusal and narration checks' + (hasFfmpeg ? ', music bed.' : ' (music bed skipped: no ffmpeg).'));
