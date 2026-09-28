"""Publish the original Sound Span visualizer without inventing its runtime pose.

Input is the user's extracted S.pack and the pinned SPICA converter's private
S_Vis_Span_U output. Only converted JSON/PNG enter public delivery.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import struct
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from firmware.build import encode
from unpack_home_resources import decompress

TITLE = '0004001000022500'
CONTENT = '0000000b'
ENTRY = 'S_Vis_Span_U.bcmdl.LZ'
PACK_SHA = '05550cfa807aa19cd27347e1b309a60aed7f20cf208be13ea2bab1bc942f161d'
ENTRY_SHA = 'c9558d7c10d0d6354b63aeb39ca173707cdb927d3344f23e51d5229c4b953244'
MODEL_SHA = 'ff9ce249149f835ecce97f693e3f2e1cabe3a2cfebb6bcdbb124d36d4005cf23'
DEST = 'models/sound-span'


def digest(data):
    return sha256(data).hexdigest()


def publish(pack_path, converted, output):
    pack = pack_path.read_bytes()
    if digest(pack) != PACK_SHA:
        raise ValueError('Unexpected private Sound S.pack')
    payload = None
    for offset in range(0, len(pack), 0x40):
        name = pack[offset:offset + 0x38].split(b'\0')[0]
        if not name:
            break
        start, size = struct.unpack_from('<II', pack, offset + 0x38)
        if name.decode('ascii') == ENTRY:
            payload = pack[start:start + size]
            break
    if payload is None or digest(payload) != ENTRY_SHA or digest(decompress(payload)) != MODEL_SHA:
        raise ValueError('Unexpected Sound Span source entry')

    model_bytes = (converted/'model.json').read_bytes()
    model = json.loads(model_bytes)
    if (model.get('sourceSha256') != MODEL_SHA or model.get('compressedSourceSha256') != ENTRY_SHA
            or model.get('sourceName') != ENTRY or len(model.get('models', [])) != 1
            or model['models'][0].get('name') != 'S_Vis_Span_U'
            or len(model['models'][0].get('meshes', [])) != 34
            or any(model.get(k) for k in ('skeletalAnimations', 'materialAnimations',
                                           'visibilityAnimations', 'cameraAnimations'))):
        raise ValueError('Unexpected converted Sound Span model')
    filenames = {'model.json', *(texture['url'] for texture in model['textures'])}
    if {path.name for path in converted.iterdir() if path.is_file()} != filenames:
        raise ValueError('Converted Sound Span file set differs')
    pending = {}
    for filename in filenames:
        data = (converted/filename).read_bytes()
        if filename != 'model.json':
            texture = next(texture for texture in model['textures'] if texture['url'] == filename)
            if digest(data) != texture['sha256']:
                raise ValueError('Converted Sound Span texture differs')
        pending[f'{DEST}/{filename}'] = data

    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    if manifest.get('firmware') != '10.7.0-32E' or manifest['titles'][TITLE]['version'] != 3088:
        raise ValueError('Wrong delivery firmware or Sound version')
    model_url = f'{DEST}/model.json'
    if manifest['models'].get('soundSpan', model_url) != model_url:
        raise ValueError('Conflicting Sound Span model URL')
    provenance = {'titleId': TITLE, 'contentIndex': 0, 'contentId': CONTENT,
                  'path': f'contents/0000-{CONTENT}/romfs/res/S.pack/{ENTRY}', 'sha256': ENTRY_SHA}
    for url, data in pending.items():
        record = {'kind': 'model' if url == model_url else 'model-texture',
                  'sha256': digest(data), 'size': len(data), 'sources': [provenance]}
        prior = manifest['resources'].get(url)
        if prior is not None and prior != record:
            raise ValueError('Conflicting existing Sound Span resource: ' + url)
        target = output/url
        if target.exists() and target.read_bytes() != data:
            raise ValueError('Conflicting existing Sound Span bytes: ' + url)
        manifest['resources'][url] = record
    manifest['models']['soundSpan'] = model_url
    for url, data in pending.items():
        target = output/url
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    manifest_path.write_bytes(encode(manifest))
    return {'model': model_url, 'resources': sorted(pending), 'sourceSha256': MODEL_SHA}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', type=Path, required=True)
    parser.add_argument('--converted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(publish(args.pack, args.converted, args.output), sort_keys=True))
