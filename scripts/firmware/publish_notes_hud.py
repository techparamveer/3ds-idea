"""Publish only the pinned Game Notes upper HUD and its original dependencies."""
import argparse
import copy
import json
from pathlib import Path
import tempfile

from build import Builder, converter_provenance, decode_layers, digest, encode
from stock_ui import select_pack
from unpack_home_resources import unpack_darc

TITLE = '0004003000009c02'
VERSION = 4096
CIA_HASH = '56612d00563671a255056ba50cf25bf36c1bf3164f9721cc9abb0051444ac07c'
CONTENT_HASH = '329911cd7402f01aaff57bca71f6f5b67c57b4cae885c695cc93cd8f3b542292'
CODE_HASH = '8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6'
SOURCE_HASHES = {
    'memo/HudMenuAplt_00.arc.l': '30877490883c7bec16087efe4d02de7986fe355bfe490b24518da21289a10961',
    'lang/EU_English/hud.msbt': '3f9f2ae497bcf9c79de2584c1d4dc99a8727211834ab6728086761217aa44451',
    'lang/Hud.bcfnt': '172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8',
}
IDENTITY = {'contentIndex': 0, 'contentId': '00000007', 'titleVersion': VERSION}
CLIPS = ['HudMenuAplt_00_SceneIn', 'HudMenuAplt_00_Bat',
         'HudMenuAplt_00_NetMode', 'HudMenuAplt_00_NetAtn']


def checked(raw, expected, label):
    if digest(raw) != expected:
        raise ValueError('Pinned Notes source hash mismatch: '+label)
    return raw


def validate_manifest(manifest):
    title = manifest['titles'][TITLE]
    source = manifest['sources'][TITLE]
    if manifest['firmware'] != '10.7.0-32E' or manifest['locale'] != 'EU_English':
        raise ValueError('Wrong Notes firmware or locale')
    if title['version'] != VERSION or title['sourceSha256'] != CIA_HASH:
        raise ValueError('Wrong Notes title version or CIA')
    contents = source['contents']
    if source['version'] != VERSION or source['sourceSha256'] != CIA_HASH or len(contents) != 1:
        raise ValueError('Wrong Notes source metadata')
    if contents[0]['index'] != 0 or contents[0]['id'] != '00000007' or contents[0]['sha256'] != CONTENT_HASH:
        raise ValueError('Wrong Notes content identity')


def publish(romfs, code, output, artifacts, ctrtool):
    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    validate_manifest(manifest)
    checked(code.read_bytes(), CODE_HASH, 'ExeFS/code.bin')
    raw = {path: checked((romfs/path).read_bytes(), sha, path) for path, sha in SOURCE_HASHES.items()}
    conversion = converter_provenance(ctrtool)
    conversion['publisherSha256'] = digest(Path(__file__).read_bytes())
    artifacts.mkdir(parents=True, exist_ok=True)
    before = copy.deepcopy(manifest)
    # Convert privately and validate every destination before publishing bytes.
    with tempfile.TemporaryDirectory(prefix='notes-hud-', dir=artifacts) as tmp:
        candidate = Path(tmp)
        builder = Builder(candidate)
        archive = 'memo/HudMenuAplt_00.arc.l'
        url, pack = builder.pack(unpack_darc(decode_layers(raw[archive])),
                                 'memo-HudMenuAplt_00-arc-l', TITLE, archive, SOURCE_HASHES[archive], IDENTITY)
        selected, fonts = select_pack(pack, {'layouts': ['HudMenuAplt_00'], 'animations': CLIPS})
        if fonts != {'cbf_std.bcfnt', 'Hud.bcfnt'}:
            raise ValueError('Unexpected Notes HUD font names')
        selected_bytes = encode(selected)
        (candidate/url).write_bytes(selected_bytes)
        builder.records[url].update(size=len(selected_bytes), sha256=digest(selected_bytes))

        message_path = 'lang/EU_English/hud.msbt'
        message_url, messages = builder.pack({'hud.msbt': raw[message_path]}, 'hud-messages', TITLE,
                                            'lang/EU_English', SOURCE_HASHES[message_path], IDENTITY)
        if messages['unsupported'] or not messages['messages'].get('hud'):
            raise ValueError('Incomplete Notes HUD message conversion')
        builder.records[message_url]['sources'][0]['path'] = message_path
        font_path = 'lang/Hud.bcfnt'
        font_url = builder.font(raw[font_path], 'game-notes/contents/0000-00000007/Hud',
                                {'titleId': TITLE, 'path': font_path, 'sha256': SOURCE_HASHES[font_path], **IDENTITY})

        info = manifest['titles'][TITLE]
        for key in (url, message_url):
            if key not in info['packs']:
                info['packs'].append(key)
        for key in ('Hud.bcfnt', 'contents/0000-00000007/Hud.bcfnt'):
            previous = info['fonts'].get(key)
            if previous and previous != font_url:
                raise ValueError('Conflicting Notes-owned HUD font')
            info['fonts'][key] = font_url

        pending = {}
        for key, record in builder.records.items():
            data = (candidate/key).read_bytes()
            previous = manifest['resources'].get(key)
            if previous:
                if previous['sha256'] != record['sha256'] or previous['size'] != record['size']:
                    raise ValueError('Conflicting delivered Notes HUD dependency: '+key)
                checked((output/key).read_bytes(), previous['sha256'], key)
                continue
            record['conversion'] = conversion
            manifest['resources'][key] = record
            pending[key] = data
        if {key: value for key, value in before.items() if key not in ('titles', 'resources')} != \
           {key: value for key, value in manifest.items() if key not in ('titles', 'resources')}:
            raise ValueError('Unrelated manifest metadata changed')
        if any(manifest['titles'][key] != value for key, value in before['titles'].items() if key != TITLE):
            raise ValueError('Unrelated title metadata changed')
        for key, data in pending.items():
            target = output/key
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        manifest_path.write_bytes(encode(manifest))
        report = {'schema': 1, 'titleId': TITLE, **IDENTITY, 'codeSha256': CODE_HASH,
                  'sourceHashes': SOURCE_HASHES, 'conversion': conversion,
                  'packs': [url, message_url], 'font': font_url,
                  'added': list(pending), 'manifestSha256': digest(encode(manifest)),
                  'existingResourcesPreserved': all(manifest['resources'][key] == value for key, value in before['resources'].items())}
        (artifacts/'notes-hud-publication.json').write_bytes(encode(report))
        return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('romfs', 'code', 'output', 'artifacts', 'ctrtool'):
        parser.add_argument('--'+key, required=True, type=Path)
    args = parser.parse_args()
    if any(not value.is_absolute() for value in vars(args).values()):
        parser.error('Every path must be absolute')
    print(json.dumps(publish(**vars(args)), sort_keys=True))


if __name__ == '__main__':
    main()
