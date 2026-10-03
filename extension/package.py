from pathlib import Path
import json,zipfile,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent
p=json.loads((root/'package.json').read_text()); ns='http://schemas.microsoft.com/developer/vsx-schema/2011';ET.register_namespace('',ns)
def add(parent,tag,attrs=None,text=None):
 e=ET.SubElement(parent,'{'+ns+'}'+tag,attrs or {});e.text=text;return e
m=ET.Element('{'+ns+'}PackageManifest',{'Version':'2.0.0'});meta=add(m,'Metadata')
add(meta,'Identity',{'Language':'en-US','Id':p['name'],'Version':p['version'],'Publisher':p['publisher']});add(meta,'DisplayName',text=p['displayName']);add(meta,'Description',{'{http://www.w3.org/XML/1998/namespace}space':'preserve'},p['description']);add(meta,'Tags',text=','.join(p['keywords']));add(meta,'Categories',text='Other');add(meta,'GalleryFlags',text='Public')
props=add(meta,'Properties')
for name,value in [('Engine',p['engines']['vscode']),('ExtensionDependencies',''),('ExtensionPack',''),('LocalizedLanguages',''),('EnabledApiProposals',''),('ExecutesCode','true')]:add(props,'Property',{'Id':'Microsoft.VisualStudio.Code.'+name,'Value':value})
add(add(m,'Installation'),'InstallationTarget',{'Id':'Microsoft.VisualStudio.Code','Version':'[1.90.0,)'});add(m,'Dependencies');assets=add(m,'Assets')
add(assets,'Asset',{'Type':'Microsoft.VisualStudio.Code.Manifest','Path':'extension/package.json','Addressable':'true'});add(assets,'Asset',{'Type':'Microsoft.VisualStudio.Services.Content.Details','Path':'extension/README.md','Addressable':'true'})
ct=ET.Element('Types',{'xmlns':'http://schemas.openxmlformats.org/package/2006/content-types'})
for ext,mime in [('vsixmanifest','text/xml'),('json','application/json'),('js','application/javascript'),('cjs','application/javascript'),('html','text/html'),('css','text/css'),('md','text/plain'),('py','text/plain')]:ET.SubElement(ct,'Default',{'Extension':ext,'ContentType':mime})
output=root.parent/f"codealive-{p['version']}.vsix"
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('extension.vsixmanifest',ET.tostring(m,encoding='utf-8',xml_declaration=True));z.writestr('[Content_Types].xml',ET.tostring(ct,encoding='utf-8',xml_declaration=True))
 for f in [root/'package.json',root/'extension.js',root/'export-utils.js',root/'README.md',root/'package.py',root/'test-extension.cjs',root/'test-app.cjs',root/'test-sorting.cjs',root/'test-sorting-app.cjs',root/'test-comparison.cjs',root/'test-comparison-app.cjs',*sorted((root/'media').glob('*'))]:z.write(f,'extension/'+f.relative_to(root).as_posix())
with zipfile.ZipFile(output) as z:
 assert z.testzip() is None;ET.fromstring(z.read('extension.vsixmanifest'));ET.fromstring(z.read('[Content_Types].xml'));assert json.loads(z.read('extension/package.json'))['main']=='./extension.js';assert 'extension/extension.js' in z.namelist()
print(output)
