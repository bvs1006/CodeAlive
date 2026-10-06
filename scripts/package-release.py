"""Build the VSIX and an offline browser bundle from the same source."""
from pathlib import Path
import json
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
subprocess.run(['node', 'scripts/build-shared.cjs'], cwd=root, check=True)
subprocess.run([sys.executable, 'extension/package.py'], cwd=root, check=True)
version = json.loads((root / 'extension/package.json').read_text())['version']
output = root / 'downloads' / f'codealive-explainer-{version}.zip'
output.parent.mkdir(exist_ok=True)
instructions = f'''CodeAlive {version} — Explain selected code

VS Code: Extensions > ... > Install from VSIX... > codealive-{version}.vsix
After upgrading, close CodeAlive tabs and run Developer: Reload Window.
Select a JavaScript or TypeScript function, then run CodeAlive: Explain Selected Code.
Or run CodeAlive: Open Explainer to explore ten examples.

Browser: open browser/explain.html. No npm installation is needed.
Static explanation never runs or uploads source. Optional Replay explicitly runs a bounded
interpreter subset, without host, network, file or module access.
Compare Before/After in the explainer, or run CodeAlive: Explain Working Tree Changes.
Explain it in a video: edit scenes, import local narration, preview, record and save.
See EXPLAIN_CODE.md, EXECUTION_REPLAY.md, CHANGE_EXPLANATIONS.md and EXPLANATION_VIDEO.md for supported constructs and limitations.

Music, sorting, recording and the read-only PR companion remain available in VS Code.
'''
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(root / f'codealive-{version}.vsix', f'codealive-{version}.vsix')
    archive.writestr('START_HERE.txt', instructions)
    archive.write(root / 'docs/EXPLAIN_CODE.md', 'EXPLAIN_CODE.md')
    archive.write(root / 'docs/EXECUTION_REPLAY.md', 'EXECUTION_REPLAY.md')
    archive.write(root / 'docs/CHANGE_EXPLANATIONS.md', 'CHANGE_EXPLANATIONS.md')
    archive.write(root / 'docs/EXPLANATION_VIDEO.md', 'EXPLANATION_VIDEO.md')
    for file in sorted((root / 'web').rglob('*')):
        if file.is_file():
            archive.write(file, 'browser/' + file.relative_to(root / 'web').as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'browser/explainer/parser.LICENSE.txt' in archive.namelist()
print(output)
