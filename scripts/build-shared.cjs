const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const parserFile = require.resolve('@babel/parser');
const parserRoot = path.dirname(path.dirname(parserFile));
const source = fs.readFileSync(parserFile, 'utf8').replace(/\/\/# sourceMappingURL=.*$/gm, '');
if (/\brequire\s*\(/.test(source)) throw new Error('Parser now needs dependencies: update the browser build.');
const bundle = `(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CodeAliveParser=factory();})(globalThis,function(){const exports={};\n${source}\nreturn exports;});\n`;
for (const target of ['web', 'extension/media']) {
  const output = path.join(root, target, 'explainer');
  fs.mkdirSync(output, {recursive:true});
  for (const file of ['explain-engine.js', 'explain-examples.js', 'explain-ui.js', 'explain.css']) {
    fs.copyFileSync(path.join(root, 'shared', file), path.join(output, file));
  }
  fs.copyFileSync(path.join(root, 'shared/explain.html'), path.join(root, target, 'explain.html'));
  fs.writeFileSync(path.join(output, 'parser.js'), bundle);
  fs.copyFileSync(path.join(parserRoot, 'LICENSE'), path.join(output, 'parser.LICENSE.txt'));
}
console.log('Built identical local explainer assets for browser and VS Code.');
