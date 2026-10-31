(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CodeAliveAIScript=factory();
})(globalThis,function(){
  'use strict';

  const samples={
    quicksort:{
      id:'quicksort',
      title:'Python · Quicksort & Partition',
      language:'Python',
      code:`def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quicksort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    if low < high:
        pi = partition(arr, low, high)
        quicksort(arr, low, pi - 1)
        quicksort(arr, pi + 1, high)
    return arr`
    },
    bst:{
      id:'bst',
      title:'Python · Binary Search Tree',
      language:'Python',
      code:`class Node:
    def __init__(self, key):
        self.left = None
        self.right = None
        self.val = key

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, key):
        if self.root is None:
            self.root = Node(key)
        else:
            self._insert(self.root, key)

    def _insert(self, current, key):
        if key < current.val:
            if current.left is None:
                current.left = Node(key)
            else:
                self._insert(current.left, key)
        else:
            if current.right is None:
                current.right = Node(key)
            else:
                self._insert(current.right, key)`
    },
    userService:{
      id:'userService',
      title:'TypeScript · Async User Service',
      language:'TypeScript',
      code:`interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  private cache = new Map<string, UserProfile>();

  async getUser(id: string): Promise<UserProfile> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    const response = await fetch(\`/api/users/\${id}\`);
    if (!response.ok) {
      throw new Error(\`Failed to fetch user \${id}: \${response.statusText}\`);
    }
    const user = (await response.json()) as UserProfile;
    this.cache.set(id, user);
    return user;
  }
}`
    }
  };

  function linesToRange(source,startLine,endLine){
    if(typeof source!=='string')return {start:0,end:0,line:1,endLine:1};
    const lines=source.split('\n');
    const total=lines.length;
    const sLine=Math.max(1,Math.min(Number(startLine)||1,total));
    const eLine=Math.max(sLine,Math.min(Number(endLine)||sLine,total));

    let charOffset=0;
    let startChar=0;
    let endChar=source.length;

    for(let i=0;i<total;i++){
      const len=lines[i].length;
      const lNum=i+1;
      if(lNum===sLine)startChar=charOffset;
      if(lNum===eLine){endChar=charOffset+len;break;}
      charOffset+=len+1; // newline
    }
    return {start:startChar,end:endChar,line:sLine,endLine:eLine};
  }

  function buildPrompt(code,options={}){
    const lang=options.language||'code';
    return `You are a technical educator. Analyze this ${lang} snippet and create a 3 to 6 scene video explanation script for a developer video.
Each scene must highlight relevant lines and provide concise narration.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Short descriptive video title (max 80 chars)",
  "scenes": [
    {
      "caption": "Voiceover narration text (1 to 240 chars)",
      "startLine": 1,
      "endLine": 3,
      "duration": 4.5
    }
  ]
}

Code:
\`\`\`${lang}
${code}
\`\`\`
`;
  }

  function parseScript(source,raw){
    if(typeof raw!=='string'&&typeof raw!=='object')return {ok:false,error:'Expected JSON string or object.'};
    let data;
    if(typeof raw==='object'&&raw!==null){
      data=raw;
    }else{
      let text=raw.trim();
      const match=text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if(match)text=match[1];
      try{
        data=JSON.parse(text);
      }catch(e){
        return {ok:false,error:'Failed to parse script JSON: '+e.message};
      }
    }
    if(!data||!Array.isArray(data.scenes)||!data.scenes.length){
      return {ok:false,error:'Script must include at least one scene.'};
    }
    const title=String(data.title||'Code Explanation').trim().slice(0,80);
    try{
      const scenes=data.scenes.slice(0,20).map((s,idx)=>{
        const caption=String(s.caption||'').trim().slice(0,240);
        if(!caption)throw Error(`Scene ${idx+1} needs a caption.`);
        const dur=Number(s.duration);
        const duration=(!Number.isFinite(dur)||dur<0.5||dur>15)?4.0:Math.round(dur*10)/10;
        const range=linesToRange(source,s.startLine,s.endLine);
        const visual=s.visual&&typeof s.visual==='object'?s.visual:undefined;
        return visual?{enabled:true,caption,duration,range,visual}:{enabled:true,caption,duration,range};
      });
      return data.overlay&&typeof data.overlay==='object'?{ok:true,title,scenes,overlay:data.overlay}:{ok:true,title,scenes};
    }catch(err){
      return {ok:false,error:err.message};
    }
  }

  function heuristicScript(source,options={}){
    if(typeof source!=='string'||!source.trim())return {ok:false,error:'Provide code to generate a script.'};
    const rawLines=source.split('\n');
    const totalLines=rawLines.length;
    const lang=options.language||'code';

    // Detailed structural scan
    const classes=[];
    const functions=[];
    const loops=[];
    const guards=[];
    const recursiveCalls=[];
    const asyncOps=[];
    const returns=[];

    for(let i=0;i<totalLines;i++){
      const line=rawLines[i].trim();
      const lNum=i+1;
      if(!line||line.startsWith('#')||line.startsWith('//'))continue;

      // Class declaration
      const classMatch=line.match(/\bclass\s+([a-zA-Z0-9_$]+)/);
      if(classMatch)classes.push({name:classMatch[1],line:lNum});

      // Function or method declaration
      const fnMatch=line.match(/(?:(?:async\s+)?(?:def|function|func|fn)\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*[:{])/);
      if(fnMatch){
        const name=fnMatch[1]||fnMatch[2]||fnMatch[3];
        if(name&&!['if','for','while','switch','catch','match'].includes(name)){
          functions.push({name,line:lNum,isAsync:line.includes('async'),isInit:/init|constructor/i.test(name)});
        }
      }

      // Loop constructs
      if(/\b(for|while|loop)\b/.test(line)){
        loops.push({line:lNum,text:line});
      }

      // Guard / Conditionals
      if(/\b(if|when|switch|case|guard)\b/.test(line)){
        let endLine=lNum;
        if(i+1<totalLines&&/\breturn\b/.test(rawLines[i+1])){endLine=lNum+1;}
        guards.push({startLine:lNum,endLine,text:line});
      }

      // Async/await
      if(/\b(await|fetch|Promise)\b/.test(line)){
        asyncOps.push({line:lNum,text:line});
      }

      // Returns
      if(/\breturn\b/.test(line)){
        returns.push({line:lNum,text:line});
      }
    }

    // Detect recursive calls
    functions.forEach(f=>{
      for(let i=0;i<totalLines;i++){
        const line=rawLines[i].trim();
        const lNum=i+1;
        if(lNum!==f.line&&line.includes(f.name+'(')){
          recursiveCalls.push({name:f.name,line:lNum});
        }
      }
    });

    const scenes=[];
    let title='Code Explanation';

    // Strategy 1: Class-based Architecture (e.g. Node, BinarySearchTree, UserService)
    if(classes.length>0){
      const primaryClass=classes[classes.length-1];
      title=`Understanding ${primaryClass.name}`;

      // Scene 1: Class and Model Declarations
      const classEnd=Math.min(totalLines,classes[0].line+6);
      scenes.push({
        enabled:true,
        caption:`Here we define the ${classes.map(c=>c.name).join(' and ')} structure and its state representations.`,
        duration:4.0,
        range:linesToRange(source,classes[0].line,classEnd)
      });

      // Scene 2: Initializer / Constructor
      const initFn=functions.find(f=>f.isInit);
      if(initFn){
        scenes.push({
          enabled:true,
          caption:`The constructor initializes internal properties, default pointers, and local references.`,
          duration:4.0,
          range:linesToRange(source,initFn.line,Math.min(totalLines,initFn.line+4))
        });
      }

      // Scene 3: Primary operational method
      const opMethods=functions.filter(f=>!f.isInit);
      if(opMethods.length>0){
        const primaryOp=opMethods[0];
        scenes.push({
          enabled:true,
          caption:`The ${primaryOp.name}() method coordinates operations and checks boundary states.`,
          duration:4.5,
          range:linesToRange(source,primaryOp.line,Math.min(totalLines,primaryOp.line+5))
        });
      }

      // Scene 4: Recursive traversal or Helper method
      if(opMethods.length>1||recursiveCalls.length>0){
        const helper=opMethods[1]||opMethods[0];
        scenes.push({
          enabled:true,
          caption:recursiveCalls.length?`In the recursive step, the method traverses sub-branches until locating the insertion point.`:`The helper method applies the state updates and handles conditions.`,
          duration:4.5,
          range:linesToRange(source,helper.line,Math.min(totalLines,helper.line+8))
        });
      }

      // Scene 5: Async operation or Error Handling or Return
      if(asyncOps.length>0){
        scenes.push({
          enabled:true,
          caption:`Asynchronous requests fetch external data and validate the response before caching.`,
          duration:4.0,
          range:linesToRange(source,asyncOps[0].line,Math.min(totalLines,asyncOps[0].line+4))
        });
      }

      // Final summary scene
      scenes.push({
        enabled:true,
        caption:`This modular architecture maintains data integrity and provides clear encapsulation.`,
        duration:3.5,
        range:linesToRange(source,1,totalLines)
      });

      return {ok:true,title,scenes};
    }

    // Strategy 2: Multi-Function / Algorithmic Architecture (e.g. Quicksort + Partition)
    if(functions.length>=2){
      const mainFn=functions[functions.length-1];
      const helperFn=functions[0];
      title=`Understanding ${mainFn.name}() & ${helperFn.name}()`;

      // Scene 1: High-level entry & helper overview
      scenes.push({
        enabled:true,
        caption:`We coordinate ${mainFn.name}() with a dedicated ${helperFn.name}() algorithm to process the data.`,
        duration:4.0,
        range:linesToRange(source,helperFn.line,Math.min(totalLines,helperFn.line+4))
      });

      // Scene 2: Core Loop / Invariant in helper
      if(loops.length>0){
        scenes.push({
          enabled:true,
          caption:`A loop scans through the elements, maintaining boundary partitions and ordering invariants.`,
          duration:4.5,
          range:linesToRange(source,loops[0].line,Math.min(totalLines,loops[0].line+4))
        });
      }

      // Scene 3: Swapping or State Transition in helper
      if(guards.length>0){
        scenes.push({
          enabled:true,
          caption:`Conditionals check values against the pivot or threshold, rearranging elements in place.`,
          duration:4.0,
          range:linesToRange(source,guards[0].startLine,guards[0].endLine+1)
        });
      }

      // Scene 4: Recursive divide-and-conquer in main function
      if(recursiveCalls.length>0){
        scenes.push({
          enabled:true,
          caption:`The main routine divides the problem into subproblems and recursively executes them.`,
          duration:5.0,
          range:linesToRange(source,mainFn.line,Math.min(totalLines,mainFn.line+6))
        });
      }else{
        scenes.push({
          enabled:true,
          caption:`The primary function orchestrates the workflow and returns the computed result.`,
          duration:4.0,
          range:linesToRange(source,mainFn.line,Math.min(totalLines,mainFn.line+6))
        });
      }

      // Scene 5: Return / Completion
      scenes.push({
        enabled:true,
        caption:`When all subproblems resolve, the final sorted or transformed collection is returned.`,
        duration:3.5,
        range:linesToRange(source,1,totalLines)
      });

      return {ok:true,title,scenes};
    }

    // Strategy 3: Single Function or General Code
    const fn=functions[0];
    const fnName=fn?.name||'';
    title=fnName?`Understanding ${fnName}()`:`Exploring ${lang} logic`;

    // Scene 1: Introduction
    scenes.push({
      enabled:true,
      caption:fnName?`Let's explore how the ${fnName} function works step by step.`:`Let's examine how this ${lang} snippet executes.`,
      duration:4.0,
      range:linesToRange(source,1,Math.min(totalLines,(fn?.line||1)+1))
    });

    // Scene 2: Base case or conditional or loop
    if(guards.length>0){
      const isRecursive=recursiveCalls.length>0;
      scenes.push({
        enabled:true,
        caption:isRecursive?`First, the base condition guards against infinite recursion and returns when met.`:`A condition checks the input before proceeding with execution.`,
        duration:4.5,
        range:linesToRange(source,guards[0].startLine,guards[0].endLine)
      });
    }else if(loops.length>0){
      scenes.push({
        enabled:true,
        caption:`The loop iterates over the input elements and updates state.`,
        duration:4.5,
        range:linesToRange(source,loops[0].line,Math.min(totalLines,loops[0].line+2))
      });
    }

    // Scene 3: Recursive call, Async operation, or Core computation
    if(recursiveCalls.length>0){
      scenes.push({
        enabled:true,
        caption:`In the recursive case, the function calls itself with a reduced subproblem.`,
        duration:5.0,
        range:linesToRange(source,recursiveCalls[0].line,recursiveCalls[0].line)
      });
    }else if(asyncOps.length>0){
      scenes.push({
        enabled:true,
        caption:`The function awaits asynchronous input and handles potential error conditions.`,
        duration:4.5,
        range:linesToRange(source,asyncOps[0].line,Math.min(totalLines,asyncOps[0].line+3))
      });
    }else if(returns.length>0&&returns[0].line!==(guards[0]?.endLine)){
      scenes.push({
        enabled:true,
        caption:`The main logic computes the result and produces the return value.`,
        duration:4.0,
        range:linesToRange(source,returns[0].line,returns[0].line)
      });
    }

    // Scene 4: Summary / Complete execution
    scenes.push({
      enabled:true,
      caption:`Finally, the execution completes and outputs the final result.`,
      duration:3.5,
      range:linesToRange(source,1,totalLines)
    });

    return {ok:true,title,scenes};
  }

  return {linesToRange,buildPrompt,parseScript,heuristicScript,samples};
});