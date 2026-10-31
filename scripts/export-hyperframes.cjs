#!/usr/bin/env node
'use strict';
// Exports a CodeAlive explanation script as a HyperFrames project, so it can be rendered offline
// to a deterministic MP4. Nothing here renders video or depends on HyperFrames: the output is a
// folder you render yourself with `npx hyperframes@0.8.223 render`.
//
//   node scripts/export-hyperframes.cjs --script script.json --source code.js --out my-video \
//        [--aspect 9:16|16:9] [--narration voice.wav] [--music] [--hide-source] [--no-captions] [--gsap gsap.min.js]
//
// --script is the same JSON that "Paste AI JSON" accepts. The scene drawing is the product's own
// canvas renderer (shared/movie-engine.js), so frames match the in-product video apart from fonts.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const Movie = require(path.join(root, 'shared/movie-engine.js'));
const AiScript = require(path.join(root, 'shared/ai-script.js'));

const TESTED_HYPERFRAMES = '0.8.223';
const GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
const NARRATION_TYPES = new Set(['.wav', '.mp3', '.m4a']);
const MAX_NARRATION_BYTES = 15 * 1024 * 1024;

// Plan data is embedded in an inline <script>. Escaping "<" keeps source code that contains
// "</script>" or "<!--" from ending the script early, and the two line separators are not valid
// in older JavaScript string literals.
function safeJson(value) {
  const separators = { [String.fromCharCode(0x2028)]: '\\u2028', [String.fromCharCode(0x2029)]: '\\u2029' };
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(new RegExp('[' + Object.keys(separators).join('') + ']', 'g'), c => separators[c]);
}

function buildProject(options) {
  const { source, script, aspectRatio = '9:16', hideSource = false, showCaptions = true } = options;
  if (typeof source !== 'string') throw Error('Provide the source code the script explains.');
  const parsed = AiScript.parseScript(source, script);
  if (!parsed.ok) throw Error(parsed.error);
  const plan = Movie.plan(source, parsed.scenes, {
    title: parsed.title, overlay: parsed.overlay, aspectRatio, hideSource, showCaptions
  });
  const landscape = plan.aspectRatio === '16:9';
  const [width, height] = landscape ? [1920, 1080] : [1080, 1920];
  const seconds = plan.seconds;
  const audio = [];
  if (options.narrationFile) audio.push(`      <audio id="voice" class="clip" src="assets/${options.narrationFile}" data-start="0" data-duration="${seconds}" data-track-index="1" data-volume="1"></audio>`);
  if (options.music) audio.push(`      <audio id="music" class="clip" src="assets/music.mp3" data-start="0" data-duration="${seconds}" data-track-index="2" data-volume="0.12"></audio>`);
  const gsapSrc = options.gsapLocal ? 'gsap.min.js' : GSAP_CDN;
  const html = `<!doctype html>
<html lang="en" data-resolution="${landscape ? 'landscape' : 'portrait'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${width}, height=${height}" />
    <script src="${gsapSrc}"></script>
    <script src="movie-engine.js"></script>
    <style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#0b1018}canvas{display:block}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${seconds}" data-width="${width}" data-height="${height}">
      <canvas id="stage" class="clip" width="${width}" height="${height}" data-start="0" data-duration="${seconds}" data-track-index="0"></canvas>
${audio.join('\n')}${audio.length ? '\n' : ''}    </div>
    <script>
      const plan = ${safeJson(plan)};
      const ctx = document.getElementById("stage").getContext("2d");
      const clock = { t: 0 };
      const paint = () => CodeAliveMovie.draw(ctx, plan, clock.t, {});
      const tl = gsap.timeline({ paused: true });
      tl.to(clock, { t: plan.seconds, duration: plan.seconds, ease: "none", onUpdate: paint }, 0);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      paint();
      tl.seek(0);
    </script>
  </body>
</html>
`;
  const readme = `CodeAlive explanation exported for HyperFrames
==============================================
${plan.scenes.length} scenes, ${seconds} seconds, ${width}x${height}.

Render (needs Node 22+, ffmpeg and Google Chrome):

  npx hyperframes@${TESTED_HYPERFRAMES} render -o video.mp4

Tested with HyperFrames ${TESTED_HYPERFRAMES}. ${options.gsapLocal ? 'GSAP is bundled in this folder.' : 'GSAP loads from a CDN while rendering, so the first render needs network access (re-export with --gsap to bundle it).'}
HyperFrames substitutes its own fonts, so monospace text can differ slightly from the in-product video.
The webcam is not part of exported videos.
`;
  const files = { 'index.html': html, 'movie-engine.js': fs.readFileSync(path.join(root, 'shared/movie-engine.js'), 'utf8'), 'plan.json': JSON.stringify(plan, null, 2) + '\n', 'README.txt': readme };
  return { plan, files };
}

function probeSeconds(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const value = r.status === 0 ? Number(r.stdout.trim()) : NaN;
  return Number.isFinite(value) ? value : null;
}

function makeMusicBed(file, seconds) {
  const fade = Math.min(2, seconds / 4);
  const args = ['-v', 'error', '-y'];
  for (const hz of [220, 277.18, 329.63]) args.push('-f', 'lavfi', '-i', `sine=frequency=${hz}:duration=${seconds}`);
  args.push('-filter_complex', `amix=inputs=3:normalize=0,volume=0.5,afade=t=in:d=1,afade=t=out:st=${Math.max(0, seconds - fade)}:d=${fade}`, '-ar', '44100', '-ac', '1', file);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.error && r.error.code === 'ENOENT') throw Error('--music needs ffmpeg on PATH.');
  if (r.status !== 0) throw Error('ffmpeg could not create the music bed: ' + String(r.stderr).slice(-200));
}

function exportProject(args) {
  const out = path.resolve(args.out);
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw Error(`${args.out} already exists and is not empty. Choose a new folder.`);
  const source = fs.readFileSync(args.source, 'utf8');
  const script = fs.readFileSync(args.script, 'utf8');
  let narrationFile = null;
  if (args.narration) {
    const ext = path.extname(args.narration).toLowerCase();
    if (!NARRATION_TYPES.has(ext)) throw Error('Narration must be a WAV, MP3 or M4A file.');
    if (fs.statSync(args.narration).size > MAX_NARRATION_BYTES) throw Error('Narration is limited to 15 MB.');
    narrationFile = 'narration' + ext;
  }
  const { plan, files } = buildProject({ source, script, aspectRatio: args.aspect, hideSource: args.hideSource, showCaptions: !args.noCaptions, narrationFile, music: args.music, gsapLocal: !!args.gsap });
  const warnings = [];
  if (args.narration) {
    const length = probeSeconds(args.narration);
    if (length === null) warnings.push('Could not read the narration length (ffprobe not found), so it was not checked against the video length.');
    else if (length > plan.seconds + 0.15) warnings.push(`Narration is ${length.toFixed(1)}s but the video is ${plan.seconds}s; the end will be cut off. Adjust scene durations in the script.`);
  }
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(out, name), content);
  if (args.gsap) fs.copyFileSync(args.gsap, path.join(out, 'gsap.min.js'));
  if (narrationFile) fs.copyFileSync(args.narration, path.join(out, 'assets', narrationFile));
  if (args.music) makeMusicBed(path.join(out, 'assets', 'music.mp3'), plan.seconds);
  return { out, plan, warnings };
}

function parseArgs(argv) {
  const args = {}, flags = { '--music': 'music', '--hide-source': 'hideSource', '--no-captions': 'noCaptions' };
  const values = { '--script': 'script', '--source': 'source', '--out': 'out', '--aspect': 'aspect', '--narration': 'narration', '--gsap': 'gsap' };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (flags[key]) args[flags[key]] = true;
    else if (values[key]) { if (i + 1 >= argv.length) throw Error(`${key} needs a value.`); args[values[key]] = argv[++i]; }
    else throw Error(`Unknown option ${key}.`);
  }
  for (const required of ['script', 'source', 'out']) if (!args[required]) throw Error(`--${required} is required.`);
  if (args.aspect && !['9:16', '16:9'].includes(args.aspect)) throw Error('--aspect must be 9:16 or 16:9.');
  return args;
}

if (require.main === module) {
  try {
    const { out, plan, warnings } = exportProject(parseArgs(process.argv.slice(2)));
    for (const w of warnings) console.warn('Warning: ' + w);
    console.log(`Exported ${plan.scenes.length} scenes (${plan.seconds}s, ${plan.aspectRatio}) to ${out}\nRender it: cd "${out}" && npx hyperframes@${TESTED_HYPERFRAMES} render -o video.mp4`);
  } catch (error) {
    console.error('Error: ' + error.message);
    process.exit(1);
  }
}

module.exports = { buildProject, exportProject, parseArgs, safeJson };
