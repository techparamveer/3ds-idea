"""Publish audited HOME title common models and EUR texture overrides.

The input is the private output of the pinned CGFX converter, not a firmware
archive. The public manifest receives only converted model JSON, PNGs, hashes
and relative CBMD provenance. This does not activate a browser banner.
"""

import argparse
from hashlib import sha256
import json
from pathlib import Path
import shutil


TITLES = {
    'camera': '0004001000022400',
    'sound': '0004001000022500',
    'health': '0004001000022300',
    'eshop': '0004001000022900',
}


def digest(data):
    return sha256(data).hexdigest()


def publish(repository, converted_root):
    fixture = json.loads((repository / 'docs/evidence/stock-common-banner-binding.json').read_text())
    assert set(fixture['titles']) == set(TITLES)
    public = repository / 'public/os/firmware/10.7.0-32E'
    manifest_path = public / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    published = []

    for name, title_id in TITLES.items():
        evidence = fixture['titles'][name]
        source = {'path': 'exefs/banner.bin', 'sha256': evidence['cbmdSha256'], 'titleId': title_id}
        slots = (
            ('common', converted_root / name / 'converted', evidence['commonCgfxSha256']),
            ('eur', converted_root / 'selected' / name, evidence['selectedCgfxSha256']),
        )
        for slot, source_dir, cgfx_hash in slots:
            model_path = source_dir / 'model.json'
            model_bytes = model_path.read_bytes()
            model = json.loads(model_bytes)
            assert model['sourceSha256'] == cgfx_hash, (name, slot, 'CGFX identity')
            if slot == 'common':
                assert len(model['models']) == 1, (name, 'common model count')
                assert model['models'][0]['name'] == evidence['model']
                expected_textures = evidence['commonTextures']
            else:
                assert model['models'] == [], (name, 'EUR selected model must be texture-only')
                assert model['cbmd']['cbmdSha256'] == source['sha256']
                assert model['cbmd']['language'] == 'eur-en'
                expected_textures = evidence['localeTextureOverrides']
            assert [texture['name'] for texture in model['textures']] == expected_textures

            destination = f'models/{name}-banner-{slot}'
            key = f'{name}Banner{slot.title()}'
            assert key not in manifest['models'] or manifest['models'][key] == f'{destination}/model.json'
            manifest['models'][key] = f'{destination}/model.json'
            allowed = {'model.json', *(texture['url'] for texture in model['textures'])}
            assert {path.name for path in source_dir.iterdir() if path.is_file()} == allowed
            for filename in sorted(allowed):
                incoming = (source_dir / filename).read_bytes()
                if filename != 'model.json':
                    texture = next(texture for texture in model['textures'] if texture['url'] == filename)
                    assert digest(incoming) == texture['sha256'], (name, slot, filename)
                relative = f'{destination}/{filename}'
                target = public / relative
                if target.exists():
                    assert target.read_bytes() == incoming, (relative, 'existing bytes differ')
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(source_dir / filename, target)
                record = {
                    'kind': 'model' if filename == 'model.json' else 'model-texture',
                    'sha256': digest(incoming),
                    'size': len(incoming),
                    'sources': [source],
                }
                old = manifest['resources'].get(relative)
                assert old is None or old == record, (relative, 'manifest record differs')
                manifest['resources'][relative] = record
                published.append(relative)

    manifest_path.write_text(json.dumps(manifest, separators=(',', ':'), ensure_ascii=False) + '\n')
    return published


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', type=Path, required=True)
    parser.add_argument('--converted-root', type=Path, required=True)
    args = parser.parse_args()
    assert args.repository.is_absolute() and args.converted_root.is_absolute()
    print(json.dumps({'published': publish(args.repository, args.converted_root)}, indent=2))
