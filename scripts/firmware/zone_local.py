"""Publish only the bundled EU English Nintendo Zone offline/info bitmaps.

HTML is reference data, never executed. GIF conversion is pixel-lossless; MPO
frames are decoded independently and retain their source frame indices.
"""
import argparse
import copy
import io
import json
from pathlib import Path
import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from firmware.build import digest, encode, public_path

TITLE = '0004001000022b00'
PREFIX = 'www/included_html/'
FILES = {
    'offline': ('offline_mode/OFFLINE_EU/en/offline_mode.gif', (320, 212), 1),
    'no-content': ('boss_page/BOSS_EU/en/images/no_content.gif', (320, 212), 1),
    'info-top': ('boss_page/BOSS_EU/shared_images/top_screen.mpo', (400, 220), 2),
}


def publish(extracted, output):
    source = json.loads((extracted / 'source.json').read_bytes())
    manifest_path = output / 'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    if source['titleId'] != TITLE or source['sourceSha256'] != manifest['titles'][TITLE]['sourceSha256']:
        raise ValueError('Wrong private source title/package')
    before = copy.deepcopy(manifest)
    pack = {'schema': 1, 'name': 'local-html-images', 'titleId': TITLE,
            'sourceSha256': source['contentSha256'], 'layouts': {}, 'animations': {},
            'textures': {}, 'messages': {}, 'unsupported': [],
            'resourceSources': {'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}},
            'bitmapConversion': {'scriptSha256': digest(Path(__file__).read_bytes()),
                                 'method': 'Pillow RGBA to PNG; unmodified dimensions and pixels'}}
    pending = {}
    records = {}
    for name, (relative, size, frames) in FILES.items():
        path = PREFIX + relative
        raw = (extracted / 'romfs' / path).read_bytes()
        provenance = {'titleId': TITLE, 'path': 'RomFS/' + path, 'sha256': digest(raw)}
        with Image.open(io.BytesIO(raw)) as image:
            if image.size != size or image.n_frames != frames:
                raise ValueError('Unexpected image shape/frame count: ' + path)
            for frame in range(frames):
                image.seek(frame)
                rgba = image.convert('RGBA')
                buffer = io.BytesIO()
                rgba.save(buffer, format='PNG')
                data = buffer.getvalue()
                with Image.open(io.BytesIO(data)) as check:
                    if check.convert('RGBA').tobytes() != rgba.tobytes():
                        raise ValueError('PNG pixel round trip differs')
                key = name if frames == 1 else f'{name}-frame-{frame}'
                url = f'textures/{digest(data)}.png'
                pending[url] = data
                record = {'kind': 'texture', 'sha256': digest(data), 'size': len(data), 'sources': [provenance]}
                if url in manifest['resources']:
                    if manifest['resources'][url]['sha256'] != record['sha256']:
                        raise ValueError('Existing texture differs')
                    record = manifest['resources'][url]
                records[url] = record
                pack['textures'][key] = {'width': size[0], 'height': size[1], 'url': url,
                                        'sha256': digest(data), 'sourceSha256': digest(raw),
                                        'sourceFrame': frame, 'formatName': 'RGBA8'}
                pack['resourceSources']['textures'][key] = provenance
    url = 'packs/nintendo-zone/local-html-images.json'
    pending[url] = encode(pack)
    records[url] = {'kind': 'pack', 'size': len(pending[url]), 'sha256': digest(pending[url]),
                    'sources': [{'titleId': TITLE, 'path': 'RomFS', 'sha256': source['contentSha256']}]}
    manifest['resources'].update(records)
    if url not in manifest['titles'][TITLE]['packs']:
        manifest['titles'][TITLE]['packs'].append(url)
    for key in ('home', 'fonts', 'audio', 'models', 'converter'):
        if before.get(key) != manifest.get(key):
            raise ValueError('Protected delivery changed')
    for path, data in pending.items():
        target = public_path(output, path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    manifest_path.write_bytes(encode(manifest))
    return {'resources': len(pending), 'textures': pack['textures']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extracted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(publish(args.extracted, args.output)))
