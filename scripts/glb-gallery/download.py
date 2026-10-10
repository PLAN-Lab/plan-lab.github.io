"""Fetch the two public, checksum-pinned GLB archives supplied for DreamPartGen."""
import concurrent.futures, hashlib, html, json, re, subprocess, sys, zipfile
from pathlib import Path
from urllib.parse import urlencode
base=Path(sys.argv[1]).resolve();base.mkdir(parents=True,exist_ok=True)
items=json.loads(Path(__file__).with_name('archives.json').read_text())
def fetch(item):
    name=item['name'];archive=base/(name+'.zip')
    def download(url):
        subprocess.run(['curl','--fail','--location','--silent','--show-error','--retry','2','--max-time','300','--output',str(archive),url],check=True)
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest()!=item['sha256']:
        download('https://drive.google.com/uc?export=download&id='+item['id'])
        if not zipfile.is_zipfile(archive):
            page=archive.read_text();action=re.search(r'<form[^>]+action="([^"]+)"',page)
            if not action:raise RuntimeError('Download unavailable: '+name)
            fields=dict(re.findall(r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"',page))
            url=html.unescape(action[1])+'?'+urlencode({k:html.unescape(v) for k,v in fields.items()})
            if not url.startswith('https://drive.usercontent.google.com/'):raise RuntimeError('Unexpected download host')
            download(url)
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=item['sha256']:raise RuntimeError('Archive checksum changed: '+name)
    out=base/name;out.mkdir(exist_ok=True);seen=set()
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            p=Path(info.filename)
            if info.is_dir() or '__MACOSX' in p.parts or p.name.startswith('.'):continue
            if p.is_absolute() or '..' in p.parts:raise RuntimeError('Invalid archive path')
            if p.suffix not in ['.glb','.png']:continue
            if p.name in seen or info.file_size>90_000_000:raise RuntimeError('Unexpected archive entry')
            seen.add(p.name);(out/p.name).write_bytes(z.read(info))
    print(name,len(seen),'files verified',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(fetch,items))
