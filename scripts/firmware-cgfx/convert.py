"""Convert decompressed or LZ CGFX with the pinned SPICA exporter; no firmware execution."""
import argparse, hashlib, json, os, subprocess, sys
from pathlib import Path
from manifest import register_resources
from cbmd import LANGUAGES, extract_cbmd
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from unpack_home_resources import decompress
from convert_bcfnt import png

def convert(source, output, scratch, dotnet, exporter, manifest=None, model_key=None, title_id=None, source_path=None, include_mipmaps=False, language='eur-en'):
    data=source.read_bytes()
    cbmd=None
    if data[:4]==b'CBMD': decoded,cbmd=extract_cbmd(data,language)
    else: decoded=decompress(data) if data[0] in (16,17) else data
    if decoded[:4]!=b'CGFX': raise ValueError('Not a CGFX resource')
    scratch.mkdir(parents=True,exist_ok=True)
    native=scratch/'input.bcres';native.write_bytes(decoded)
    env={**os.environ,'DOTNET_CLI_TELEMETRY_OPTOUT':'1','DOTNET_SKIP_FIRST_TIME_EXPERIENCE':'1'}
    subprocess.run([str(dotnet),str(exporter),str(native),str(scratch)]+(["--mipmaps"] if include_mipmaps else []),check=True,env=env)
    model=json.loads((scratch/'model.json').read_text())
    model['sourceName']=source.name
    model['compressedSourceSha256']=hashlib.sha256(data).hexdigest()
    if cbmd is not None: model['cbmd']=cbmd
    model['spicaRevision']='bd29a7828595d7839cda2ac61c76bb63f9071250'
    model['converter']={'name':'ctr-cgfx-web','version':'1.4.1',
                        'wrapperSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                        'exporterSha256':hashlib.sha256(exporter.read_bytes()).hexdigest()}
    output.mkdir(parents=True,exist_ok=True)
    texture_files=[]
    for texture in model['textures']:
        for image in [texture, *texture.get('mipmaps', [])]:
            width,height=image['width'],image['height']
            raw=(scratch/image['url'].replace('.png','.rgba')).read_bytes()
            if len(raw)!=width*height*4: raise ValueError('Texture output length mismatch')
            if image.pop('bottomUp',False): raw=b''.join(raw[y*width*4:(y+1)*width*4] for y in range(height-1,-1,-1))
            encoded=png(width,height,raw)
            (output/image['url']).write_bytes(encoded)
            image['sha256']=hashlib.sha256(encoded).hexdigest()
            texture_files.append(image['url'])
    (output/'model.json').write_text(json.dumps(model,separators=(',',':'))+'\n')
    if manifest is not None:
        if not all((model_key,title_id,source_path)): raise ValueError('Manifest registration needs model key, title ID and relative source path')
        register_resources(manifest,output,model_key,title_id,source_path,model['compressedSourceSha256'],['model.json',*texture_files])

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source',type=Path);p.add_argument('output',type=Path);p.add_argument('--scratch',required=True,type=Path)
    p.add_argument('--dotnet',required=True,type=Path);p.add_argument('--exporter',required=True,type=Path)
    p.add_argument('--mipmaps', action='store_true', help='Preserve authored ETC1/ETC1A4 mip levels')
    p.add_argument('--manifest',type=Path);p.add_argument('--model-key');p.add_argument('--title-id');p.add_argument('--source-path')
    p.add_argument('--language',choices=LANGUAGES,default='eur-en',help='CBMD model language (default: EUR English)')
    a=p.parse_args()
    if any((a.manifest,a.model_key,a.title_id,a.source_path)) and not all((a.manifest,a.model_key,a.title_id,a.source_path)): p.error('Supply all four manifest registration arguments together')
    convert(a.source,a.output,a.scratch,a.dotnet,a.exporter,a.manifest,a.model_key,a.title_id,a.source_path,a.mipmaps,a.language)
