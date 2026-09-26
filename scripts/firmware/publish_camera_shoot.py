"""Publish Camera shoot environment from pinned source without fitting runtime pose."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from firmware.build import encode
from unpack_home_resources import decompress

TITLE = '0004001000022400'
CONTENT = '0000001a'
ENTRY = 'P_Shoot_D.bcenv.LZ'
ENTRY_SHA = 'a5519a472c873ed3bca958ab9716e1a08e43df87cc6d17586ea6611292f0481b'
MODEL_SHA = '728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1'
DEST = 'models/camera-shoot-background'
# Two independent pinned-exporter conversions produced identical bytes.
DELIVERY_SHA = 'fbcf4aefc917396979cef9a4993508e5bdb2e68dbf5f0e34e34e717cc1a7bafe'


def digest(data):
    return sha256(data).hexdigest()


def publish(pack_path, converted, output):
    payload = pack_path.read_bytes()
    if digest(payload) != ENTRY_SHA or digest(decompress(payload)) != MODEL_SHA:
        raise ValueError('Unexpected Camera shoot source')

    model_bytes = (converted/'model.json').read_bytes()
    if digest(model_bytes) != DELIVERY_SHA:
        raise ValueError('Converted Camera shoot bytes differ from verified export')
    model = json.loads(model_bytes)
    if (model.get('sourceSha256') != MODEL_SHA or model.get('compressedSourceSha256') != ENTRY_SHA
            or model.get('sourceName') != ENTRY
            or [(m.get('name'), len(m.get('meshes', []))) for m in model.get('models', [])]
                != [('P_Shoot_D', 3), ('X_Arw', 2), ('Z_Arw', 2), ('A_stick', 3)]
            or [t.get('name') for t in model.get('textures', [])] != ['grid', 'Btn', 'Arrow1', 'Arrow2']
            or any(model.get(k) for k in ('skeletalAnimations', 'materialAnimations',
                                           'visibilityAnimations', 'cameraAnimations'))):
        raise ValueError('Unexpected converted Camera shoot model')
    if model.get('converter', {}).get('version') != '1.4.2':
        raise ValueError('Unexpected CGFX converter')
    filenames = {'model.json', *(texture['url'] for texture in model['textures'])}
    if {path.name for path in converted.iterdir() if path.is_file()} != filenames:
        raise ValueError('Converted Camera shoot file set differs')
    pending = {}
    for filename in filenames:
        data = (converted/filename).read_bytes()
        if filename != 'model.json':
            texture = next(texture for texture in model['textures'] if texture['url'] == filename)
            if digest(data) != texture['sha256']:
                raise ValueError('Converted Camera shoot texture differs')
        pending[f'{DEST}/{filename}'] = data

    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    if manifest.get('firmware') != '10.7.0-32E' or manifest['titles'][TITLE]['version'] != 4097:
        raise ValueError('Wrong delivery firmware or Camera version')
    model_url = f'{DEST}/model.json'
    if manifest['models'].get('cameraShootBackground', model_url) != model_url:
        raise ValueError('Conflicting Camera shoot model URL')
    provenance = {'titleId': TITLE, 'contentIndex': 0, 'contentId': CONTENT,
                  'path': f'contents/0000-{CONTENT}/romfs/res/{ENTRY}', 'sha256': ENTRY_SHA}
    for url, data in pending.items():
        record = {'kind': 'model' if url == model_url else 'model-texture',
                  'sha256': digest(data), 'size': len(data), 'sources': [provenance]}
        prior = manifest['resources'].get(url)
        if prior is not None and prior != record:
            raise ValueError('Conflicting existing Camera shoot resource: ' + url)
        target = output/url
        if target.exists() and target.read_bytes() != data:
            raise ValueError('Conflicting existing Camera shoot bytes: ' + url)
        manifest['resources'][url] = record
    manifest['models']['cameraShootBackground'] = model_url
    for url, data in pending.items():
        target = output/url
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    manifest_path.write_bytes(encode(manifest))
    return {'model': model_url, 'resources': sorted(pending), 'sourceSha256': MODEL_SHA}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--converted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(publish(args.source, args.converted, args.output), sort_keys=True))
