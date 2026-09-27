"""Opt-in conversion of the Settings electronic manual (EUR English index/page 0).

Settings EUR v9220 content 1 (`00000038`) holds `Manual.bcma`: an outer DARC
whose flat `.arc` members are LZ10-compressed inner DARCs. Only allowlisted
English index/page-0 layouts, their referenced textures and the BcmaInfo layout
are converted; other languages and pages stay private. Nothing is guessed:
malformed nesting, unsafe names, missing or ambiguous textures raise.
"""
import argparse
import copy
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from firmware.build import Builder, SCRIPTS, SETTINGS, TITLES, digest, encode, public_path
from firmware.native import decode_layout
from unpack_home_resources import decompress, unpack_darc

CONVERSION = {'name': 'settings-manual-bcma', 'version': 1}
SCRIPT_NAMES = ('firmware/manual_bcma.py', 'firmware/native.py', 'firmware/texture.py', 'unpack_home_resources.py')
TITLE_VERSION = 9220
CONTENT = {'contentIndex': 1, 'contentId': '00000038'}
SOURCE_PATH = 'Manual.bcma'
SOURCE_SHA = '6241c1965c63034e181674699832ee271fd7526b9dac57071aaa8d70b5c8ba9e'
PACK_NAME = 'manual-EUR_en'
# Outer archive member -> inner layout paths. Page 0 exists in both large and
# small text variants; both are delivered rather than guessing the default.
SELECTION = {
    'BcmaInfo.arc': ('blyt/BcmaInfo.bclyt',),
    'EUR_en_index.arc': ('blyt/Index.bclyt',),
    'EUR_en_large.arc': ('blyt/Page_000_large_0.bclyt', 'blyt/Page_000_large_bg.bclyt', 'blyt/Page_000_large_info.bclyt'),
    'EUR_en_small.arc': ('blyt/Page_000_small_0.bclyt', 'blyt/Page_000_small_bg.bclyt', 'blyt/Page_000_small_info.bclyt'),
}
NEIGHBOR_SELECTION = {'EUR_en_small.arc': tuple(f'blyt/Page_001_small_{part}.bclyt' for part in ('0', 'bg', 'info'))}
NEIGHBOR_PACK = 'manual-EUR_en-neighbor'
TEXTURE_ARCHIVES = ('EUR_en_texture.arc', 'Common_texture.arc')
OUTER_NAME = re.compile(r'[A-Za-z0-9_]+\.arc')
INNER_PATH = re.compile(r'(?:blyt/[A-Za-z0-9_-]+\.bclyt|timg/[A-Za-z0-9_-]+\.bclim)')


def open_outer(raw):
    """Validate the uncompressed outer DARC; every member must be a flat .arc name."""
    if raw[:4] != b'darc': raise ValueError('Manual.bcma is not an uncompressed DARC')
    members = unpack_darc(raw)
    for name in members:
        if not OUTER_NAME.fullmatch(name): raise ValueError('Unexpected Manual.bcma member: '+name)
    return members


def open_inner(members, name):
    """Decompress one LZ10 member into an inner DARC with no further nesting."""
    if name not in members: raise ValueError('Missing Manual.bcma member: '+name)
    packed = members[name]
    if packed[:1] != b'\x10': raise ValueError('Manual.bcma member is not LZ10: '+name)
    decoded = decompress(packed)
    if decoded[:4] != b'darc': raise ValueError('Manual.bcma member is not a DARC: '+name)
    inner = unpack_darc(decoded)
    for path, data in inner.items():
        if not INNER_PATH.fullmatch(path): raise ValueError(f'Unexpected {name} member: {path}')
        if data[:4] == b'darc' or data[:1] in (b'\x10', b'\x11'): raise ValueError(f'Excess nesting in {name}/{path}')
    record = {'path': SOURCE_PATH+'/'+name, 'compression': 'lz10', 'format': 'darc',
              'sha256': digest(packed), 'decodedSha256': digest(decoded), 'decodedSize': len(decoded)}
    return record, inner


def nested_members(members):
    """Every inner member keyed by outer/inner path, for private audit lookup."""
    result = {}
    for name in sorted(members):
        result.update({name+'/'+path: data for path, data in open_inner(members, name)[1].items()})
    return result


def converter():
    return {**CONVERSION, 'scripts': {f'scripts/{name}': digest((SCRIPTS/name).read_bytes()) for name in SCRIPT_NAMES}}


def convert(raw, builder, selection=SELECTION, texture_archives=TEXTURE_ARCHIVES, expected_sha=SOURCE_SHA, neighbor_preview=False):
    """Return (url, pack); textures are written through builder, pack JSON is too."""
    if expected_sha is not None and digest(raw) != expected_sha: raise ValueError('Unexpected Manual.bcma source hash')
    if neighbor_preview: selection = NEIGHBOR_SELECTION
    pack_name = NEIGHBOR_PACK if neighbor_preview else PACK_NAME
    members = open_outer(raw)
    identity = {'titleId': SETTINGS, **CONTENT}
    pack = {'schema': 1, 'name': pack_name, 'titleId': SETTINGS, 'sourceSha256': digest(raw), **CONTENT,
            'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}, 'unsupported': [],
            'resourceSources': {'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}},
            'nesting': {'container': {'path': SOURCE_PATH, 'format': 'darc', 'sha256': digest(raw)}, 'archives': {}},
            'manualSelection': {'schema': 1, 'region': 'EUR', 'language': 'en', 'pages': [1] if neighbor_preview else [0],
                                'layoutVariants': ['small'] if neighbor_preview else ['large', 'small'], 'omittedArchives': [], 'converter': converter()}}
    opened = {}
    for name in sorted({*selection, *texture_archives}):
        opened[name] = open_inner(members, name)
        pack['nesting']['archives'][name] = opened[name][0]
    pack['manualSelection']['omittedArchives'] = sorted(set(members)-set(opened))
    needed = set()
    for archive in sorted(selection):
        inner = opened[archive][1]
        for path in selection[archive]:
            if path not in inner: raise ValueError(f'Missing selected manual layout {archive}/{path}')
            key = PurePosixPath(path).stem
            if key in pack['layouts']: raise ValueError('Duplicate manual layout name: '+key)
            layout = decode_layout(inner[path])
            pack['layouts'][key] = layout
            pack['resourceSources']['layouts'][key] = {**identity, 'path': f'{SOURCE_PATH}/{archive}/{path}', 'sha256': digest(inner[path])}
            needed.update(layout['textures'])
    for texture in sorted(needed):
        found = [(archive, 'timg/'+texture) for archive in texture_archives if 'timg/'+texture in opened[archive][1]]
        if len(found) != 1: raise ValueError(f'Missing or ambiguous manual texture: {texture}')
        archive, path = found[0]; data = opened[archive][1][path]
        source = {**identity, 'path': f'{SOURCE_PATH}/{archive}/{path}', 'sha256': digest(data)}
        pack['textures'][texture] = builder.texture(data, source)
        pack['resourceSources']['textures'][texture] = source
    slug = TITLES[SETTINGS][0]
    url = f'packs/{slug}/contents/{CONTENT["contentIndex"]:04x}-{CONTENT["contentId"]}/{pack_name}.json'
    builder.write(url, encode(pack), {**identity, 'path': SOURCE_PATH, 'sha256': digest(raw)}, 'pack')
    return url, pack


def publish(source, output, expected_sha=SOURCE_SHA, selection=SELECTION, texture_archives=TEXTURE_ARCHIVES, neighbor_preview=False):
    """Add the manual pack to an existing delivery; refuse any conflicting bytes."""
    raw = Path(source).read_bytes(); output = Path(output)
    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    metadata = manifest['sources'].get(SETTINGS, {})
    contents = [c for c in metadata.get('contents', []) if c.get('index') == CONTENT['contentIndex']]
    if (manifest.get('firmware') != '10.7.0-32E' or manifest['titles'][SETTINGS].get('version') != TITLE_VERSION or
            len(contents) != 1 or contents[0].get('id') != CONTENT['contentId']):
        raise ValueError('Wrong delivery firmware, Settings version or manual content identity')
    with tempfile.TemporaryDirectory() as staging:
        builder = Builder(Path(staging))
        url, _ = convert(raw, builder, selection, texture_archives, expected_sha, neighbor_preview)
        resources = copy.deepcopy(manifest['resources'])
        for path, record in sorted(builder.records.items()):
            prior = resources.get(path)
            if prior is not None:
                if prior['sha256'] != record['sha256'] or prior['size'] != record['size'] or prior['kind'] != record['kind']:
                    raise ValueError('Conflicting existing manual resource: '+path)
                record = {**prior, 'sources': [*prior['sources'], *(s for s in record['sources'] if s not in prior['sources'])]}
            target = public_path(output, path)
            if target.exists() and digest(target.read_bytes()) != record['sha256']:
                raise ValueError('Conflicting existing manual bytes: '+path)
            resources[path] = record
        for path in builder.records:
            target = public_path(output, path)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(public_path(Path(staging), path), target)
    manifest['resources'] = dict(sorted(resources.items()))
    packs = manifest['titles'][SETTINGS]['packs']
    if url not in packs: packs.append(url)
    manifest_path.write_bytes(encode(manifest))
    return {'pack': url, 'resources': sorted(builder.records), 'sourceSha256': digest(raw)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Private extracted content-1 romfs/Manual.bcma')
    parser.add_argument('--output', type=Path, required=True, help='Existing delivery directory containing manifest.json')
    parser.add_argument('--neighbor-preview', action='store_true', help='Add only page 1 small layouts as a separate preview pack')
    args = parser.parse_args()
    try: print(json.dumps(publish(args.source, args.output, neighbor_preview=args.neighbor_preview), sort_keys=True))
    except (ValueError, OSError, KeyError, UnicodeError) as error: parser.exit(1, f'Manual conversion failed: {error}\n')
