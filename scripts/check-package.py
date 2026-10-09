"""Verify that one release version packages the current browser and VS Code sources."""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET
import zipfile


def release_version(root):
    paths = ['package.json', 'extension/package.json', 'package-lock.json']
    manifests = [json.loads((root / path).read_text(encoding='utf-8')) for path in paths]
    versions = [manifest['version'] for manifest in manifests]
    versions.append(manifests[2]['packages']['']['version'])
    if len(set(versions)) != 1 or not re.fullmatch(r'\d+\.\d+\.\d+', versions[0]):
        raise ValueError('Workspace, lockfile and extension versions must match (major.minor.patch).')
    return versions[0]


def check_installation_guide(guide, version):
    heading = re.search(r'^# CodeAlive (\d+\.\d+\.\d+) beta$', guide, re.MULTILINE)
    installer_url = f'/releases/download/v{version}/codealive-{version}.vsix'
    if heading is None or heading.group(1) != version or installer_url not in guide:
        raise ValueError('The packaged README must describe and link the current installer.')


def check_package(root):
    version = release_version(root)
    installer = root / f'codealive-{version}.vsix'
    bundle = root / 'downloads' / f'codealive-explainer-{version}.zip'
    with zipfile.ZipFile(bundle) as browser, zipfile.ZipFile(installer) as extension:
        if browser.testzip() or extension.testzip():
            raise ValueError('Package ZIP integrity check failed.')
        if browser.read(installer.name) != installer.read_bytes():
            raise ValueError('The offline bundle embeds a different VSIX.')
        packaged = json.loads(extension.read('extension/package.json'))
        expected = json.loads((root / 'extension/package.json').read_text(encoding='utf-8'))
        identity = ET.fromstring(extension.read('extension.vsixmanifest')).find(
            './/{http://schemas.microsoft.com/developer/vsx-schema/2011}Identity')
        if packaged != expected or identity is None or identity.get('Version') != version:
            raise ValueError('Packaged extension metadata does not match the release version.')
        if identity.get('Id') != expected['name'] or identity.get('Publisher') != expected['publisher']:
            raise ValueError('Extension identity changed during packaging.')
        if f'codealive-{version}.vsix' not in browser.read('START_HERE.txt').decode('utf-8'):
            raise ValueError('Installation instructions refer to a different version.')
        check_installation_guide(extension.read('extension/README.md').decode('utf-8'), version)
        for path in sorted((root / 'web').rglob('*')):
            if path.is_file():
                name = 'browser/' + path.relative_to(root / 'web').as_posix()
                if browser.read(name) != path.read_bytes():
                    raise ValueError('Stale browser asset: ' + name)
        for name in extension.namelist():
            if name.startswith('extension/') and not name.endswith('/'):
                if extension.read(name) != (root / name).read_bytes():
                    raise ValueError('Stale extension asset: ' + name)
        for path in sorted((root / 'shared').glob('*')):
            if path.suffix not in {'.js', '.css', '.html'}:
                continue
            suffix = 'explain.html' if path.suffix == '.html' else 'explainer/' + path.name
            if browser.read('browser/' + suffix) != path.read_bytes():
                raise ValueError('Browser contains outdated shared source: ' + path.name)
            if extension.read('extension/media/' + suffix) != path.read_bytes():
                raise ValueError('VSIX contains outdated shared source: ' + path.name)
        parser = browser.read('browser/explainer/parser.js')
        if not parser or parser != extension.read('extension/media/explainer/parser.js'):
            raise ValueError('Browser and VSIX parser bundles differ.')
        license_bytes = (root / 'node_modules/@babel/parser/LICENSE').read_bytes()
        for archive, prefix in [(browser, 'browser/'), (extension, 'extension/media/')]:
            if archive.read(prefix + 'explainer/parser.LICENSE.txt') != license_bytes:
                raise ValueError('Bundled parser license is missing or stale.')
        for name in ['EXPLAIN_CODE.md', 'EXECUTION_REPLAY.md', 'CHANGE_EXPLANATIONS.md',
                     'EXPLANATION_VIDEO.md', 'RELEASE_NOTES.md', 'RELEASE_CHECKLIST.md']:
            if browser.read(name) != (root / 'docs' / name).read_bytes():
                raise ValueError('Stale release guide: ' + name)
    print(f'Package verified: {version}; matching metadata, current sources, parser license and embedded VSIX.')


if __name__ == '__main__':
    check_package(Path(__file__).resolve().parent.parent)
