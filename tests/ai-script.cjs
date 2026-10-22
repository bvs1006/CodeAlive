const assert=require('node:assert/strict');
const {linesToRange,buildPrompt,parseScript,heuristicScript}=require('../shared/ai-script');

const pySource=`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)`;

// Test linesToRange
const r1=linesToRange(pySource,1,1);
assert.equal(pySource.slice(r1.start,r1.end),'def factorial(n):');
const r2=linesToRange(pySource,2,3);
assert.equal(pySource.slice(r2.start,r2.end),'    if n <= 1:\n        return 1');
const rClamp=linesToRange(pySource,0,999);
assert.equal(rClamp.start,0);
assert.equal(rClamp.end,pySource.length);

// Test buildPrompt
const prompt=buildPrompt(pySource,{language:'Python'});
assert(prompt.includes('Python'));
assert(prompt.includes('factorial(n)'));
assert(prompt.includes('scenes'));

// Test parseScript with markdown fenced JSON
const rawJSON=`\`\`\`json
{
  "title": "Factorial Walkthrough",
  "scenes": [
    { "caption": "Introduction to factorial.", "startLine": 1, "endLine": 1, "duration": 4 },
    { "caption": "Base case: n <= 1 returns 1.", "startLine": 2, "endLine": 3, "duration": 4.5 },
    { "caption": "Recursive case returns n * factorial(n - 1).", "startLine": 4, "endLine": 4, "duration": 5 }
  ]
}
\`\`\``;

const parsed=parseScript(pySource,rawJSON);
assert.equal(parsed.ok,true);
assert.equal(parsed.title,'Factorial Walkthrough');
assert.equal(parsed.scenes.length,3);
assert.equal(parsed.scenes[0].duration,4);
assert.equal(parsed.scenes[1].range.line,2);
assert.equal(parsed.scenes[1].range.endLine,3);

// Test parseScript edge cases & errors
assert.equal(parseScript(pySource,'not json').ok,false);
assert.equal(parseScript(pySource,'{"scenes":[]}').ok,false);
assert.equal(parseScript(pySource,'{"scenes":[{"caption":""}]}').ok,false);

// Test heuristicScript on Python factorial
const pyHeuristic=heuristicScript(pySource,{language:'Python'});
assert.equal(pyHeuristic.ok,true);
assert(pyHeuristic.title.includes('factorial'));
assert(pyHeuristic.scenes.length>=3);
assert(pyHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('base')));
assert(pyHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('recursive')));

// Test heuristicScript on JavaScript loop
const jsSource=`function sumArray(arr) {
  let total = 0;
  for (const item of arr) {
    total += item;
  }
  return total;
}`;
const jsHeuristic=heuristicScript(jsSource,{language:'JavaScript'});
assert.equal(jsHeuristic.ok,true);
assert(jsHeuristic.title.includes('sumArray'));
assert(jsHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('loop')));

// Test Complex Program Samples and Multi-Scene Strategy
const {samples}=require('../shared/ai-script');
assert(samples.quicksort);
assert(samples.bst);
assert(samples.userService);

// Complex Sample 1: Quicksort & Partition (Multi-function algorithm)
const qsHeuristic=heuristicScript(samples.quicksort.code,{language:'Python'});
assert.equal(qsHeuristic.ok,true);
assert(qsHeuristic.title.includes('quicksort')&&qsHeuristic.title.includes('partition'));
assert(qsHeuristic.scenes.length>=4);
assert(qsHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('partition')||s.caption.toLowerCase().includes('helper')));
assert(qsHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('recursive')||s.caption.toLowerCase().includes('subproblem')));

// Complex Sample 2: Binary Search Tree (Class, Methods, Invariants)
const bstHeuristic=heuristicScript(samples.bst.code,{language:'Python'});
assert.equal(bstHeuristic.ok,true);
assert(bstHeuristic.title.includes('BinarySearchTree'));
assert(bstHeuristic.scenes.length>=4);
assert(bstHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('constructor')||s.caption.toLowerCase().includes('initializ')));
assert(bstHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('insert')));

// Complex Sample 3: Async User Service (Interface, Class, Async/Await, Error Handling)
const userHeuristic=heuristicScript(samples.userService.code,{language:'TypeScript'});
assert.equal(userHeuristic.ok,true);
assert(userHeuristic.title.includes('UserService'));
assert(userHeuristic.scenes.length>=4);
assert(userHeuristic.scenes.some(s=>s.caption.toLowerCase().includes('async')||s.caption.toLowerCase().includes('request')));

// Test Narration Synth Audio Generation
const NarrationSynth=require('../shared/narration-synth');
const synthResult=NarrationSynth.synthesizeNarration([
  {caption:'Introduction to quicksort.',duration:3.0},
  {caption:'Partitioning elements around pivot.',duration:3.0}
]);
assert.equal(synthResult.ok,true);
assert(Buffer.isBuffer(synthResult.wavBuffer));
assert(synthResult.wavBuffer.length>44);
assert.equal(synthResult.wavBuffer.subarray(0,4).toString(),'RIFF');
assert.equal(synthResult.wavBuffer.subarray(8,12).toString(),'WAVE');
assert(synthResult.totalSeconds>=5.0);

// Online neural voice is opt-in: a uvx on PATH must not be called unless onlineVoice is set.
{
  const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codealive-fake-uvx-'));
  const marker=path.join(dir,'called');
  if(process.platform!=='win32'){
    fs.writeFileSync(path.join(dir,'uvx'),`#!/bin/sh\ntouch "${marker}"\nexit 1\n`,{mode:0o755});
    const oldPath=process.env.PATH;
    process.env.PATH=dir+path.delimiter+oldPath;
    try{
      NarrationSynth.synthesizeNarration([{caption:'Default stays local.',duration:2}]);
      assert.equal(fs.existsSync(marker),false,'uvx/edge-tts must not run by default');
      NarrationSynth.synthesizeNarration([{caption:'Opt in.',duration:2}],{onlineVoice:true});
      assert.equal(fs.existsSync(marker),true,'onlineVoice should invoke uvx');
    }finally{process.env.PATH=oldPath;fs.rmSync(dir,{recursive:true,force:true});}
  }
}

console.log('AI script generation passed: line range mapping, prompt building, JSON parsing, complex multi-function/class programs and narration synth.');
