"""Opt-in conversion of application electronic manuals (EUR English resources).

Application content 1 holds `Manual.bcma`: an outer DARC whose flat `.arc`
members are LZ10-compressed inner DARCs. Only each title's allowlisted English
resources are converted; other languages and pages stay private. Nothing is
guessed: malformed nesting, unsafe names, missing or ambiguous textures raise.
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

CONVERSION = {'name': 'application-manual-bcma', 'version': 2}
SCRIPT_NAMES = ('firmware/manual_bcma.py', 'firmware/native.py', 'firmware/texture.py', 'unpack_home_resources.py')
TITLE_VERSION = 9220
CONTENT = {'contentIndex': 1, 'contentId': '00000038'}
SOURCE_PATH = 'Manual.bcma'
SOURCE_SHA = '6241c1965c63034e181674699832ee271fd7526b9dac57071aaa8d70b5c8ba9e'
CAMERA = '0004001000022400'
CAMERA_TITLE_VERSION = 4097
CAMERA_CONTENT = {'contentIndex': 1, 'contentId': '00000019'}
CAMERA_SOURCE_SHA = '8711e6141ba9b42dc489ff40c47684c28c6fe414efd93ef66b90570c6d33bccd'
BROWSER = '0004003000009d02'
BROWSER_TITLE_VERSION = 9232
BROWSER_CONTENT = {'contentIndex': 1, 'contentId': '0000001d'}
BROWSER_SOURCE_SHA = '9f04453f23476615912972530a99abccaee22361cc69bc80052d47acf907831b'
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
DEFAULT = object()
PROFILES = {
    SETTINGS: {'version': TITLE_VERSION, 'content': CONTENT, 'sourceSha256': SOURCE_SHA,
               'selection': SELECTION, 'textureArchives': TEXTURE_ARCHIVES,
               'pages': [0], 'layoutVariants': ['large', 'small']},
    CAMERA: {'version': CAMERA_TITLE_VERSION, 'content': CAMERA_CONTENT, 'sourceSha256': CAMERA_SOURCE_SHA,
             'selection': {'EUR_en_index.arc': ('blyt/Index.bclyt',)}, 'textureArchives': (),
             'pages': [], 'layoutVariants': []},
    BROWSER: {'version': BROWSER_TITLE_VERSION, 'content': BROWSER_CONTENT, 'sourceSha256': BROWSER_SOURCE_SHA,
              'selection': SELECTION, 'textureArchives': TEXTURE_ARCHIVES,
              'pages': [0], 'layoutVariants': ['large', 'small']},
}


def profile(title_id):
    if title_id not in PROFILES: raise ValueError('Unsupported application manual title: '+title_id)
    return PROFILES[title_id]


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
        # BCLIM payload bytes precede its footer and may legitimately start in
        # the LZ10/LZ11 range (Camera's button_HOME.bclim begins with 0x11).
        is_bclim = len(data) >= 40 and data[-40:-36] == b'CLIM'
        if data[:4] == b'darc' or (not is_bclim and data[:1] in (b'\x10', b'\x11')):
            raise ValueError(f'Excess nesting in {name}/{path}')
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


def convert(raw, builder, selection=DEFAULT, texture_archives=DEFAULT, expected_sha=DEFAULT,
            neighbor_preview=False, title_id=SETTINGS):
    """Return (url, pack); textures are written through builder, pack JSON is too."""
    selected_profile = profile(title_id)
    if selection is DEFAULT: selection = selected_profile['selection']
    if texture_archives is DEFAULT: texture_archives = selected_profile['textureArchives']
    if expected_sha is DEFAULT: expected_sha = selected_profile['sourceSha256']
    if expected_sha is not None and digest(raw) != expected_sha: raise ValueError('Unexpected Manual.bcma source hash')
    if neighbor_preview and title_id not in (SETTINGS, BROWSER): raise ValueError('Neighbor preview is unavailable for this manual')
    if neighbor_preview: selection = NEIGHBOR_SELECTION
    pack_name = NEIGHBOR_PACK if neighbor_preview else PACK_NAME
    members = open_outer(raw)
    content = selected_profile['content']
    identity = {'titleId': title_id, **content}
    pack = {'schema': 1, 'name': pack_name, 'titleId': title_id, 'sourceSha256': digest(raw), **content,
            'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}, 'unsupported': [],
            'resourceSources': {'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}},
            'nesting': {'container': {'path': SOURCE_PATH, 'format': 'darc', 'sha256': digest(raw)}, 'archives': {}},
            'manualSelection': {'schema': 1, 'region': 'EUR', 'language': 'en',
                                'pages': [1] if neighbor_preview else selected_profile['pages'],
                                'layoutVariants': ['small'] if neighbor_preview else selected_profile['layoutVariants'],
                                'omittedArchives': [], 'converter': converter()}}
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
    slug = TITLES[title_id][0]
    url = f'packs/{slug}/contents/{content["contentIndex"]:04x}-{content["contentId"]}/{pack_name}.json'
    builder.write(url, encode(pack), {**identity, 'path': SOURCE_PATH, 'sha256': digest(raw)}, 'pack')
    return url, pack


def publish(source, output, expected_sha=DEFAULT, selection=DEFAULT, texture_archives=DEFAULT,
            neighbor_preview=False, title_id=SETTINGS):
    """Add the manual pack to an existing delivery; refuse any conflicting bytes."""
    raw = Path(source).read_bytes(); output = Path(output)
    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    selected_profile = profile(title_id); content = selected_profile['content']
    metadata = manifest['sources'].get(title_id, {})
    contents = [c for c in metadata.get('contents', []) if c.get('index') == content['contentIndex']]
    if (manifest.get('firmware') != '10.7.0-32E' or manifest['titles'][title_id].get('version') != selected_profile['version'] or
            len(contents) != 1 or contents[0].get('id') != content['contentId']):
        raise ValueError('Wrong delivery firmware, title version or manual content identity')
    with tempfile.TemporaryDirectory() as staging:
        builder = Builder(Path(staging))
        url, _ = convert(raw, builder, selection, texture_archives, expected_sha, neighbor_preview, title_id)
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
    packs = manifest['titles'][title_id]['packs']
    if url not in packs: packs.append(url)
    manifest_path.write_bytes(encode(manifest))
    return {'pack': url, 'resources': sorted(builder.records), 'sourceSha256': digest(raw)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Private extracted content-1 romfs/Manual.bcma')
    parser.add_argument('--output', type=Path, required=True, help='Existing delivery directory containing manifest.json')
    parser.add_argument('--title-id', choices=sorted(PROFILES), default=SETTINGS, help='Application that owns Manual.bcma')
    parser.add_argument('--neighbor-preview', action='store_true', help='Add only page 1 small layouts as a separate preview pack')
    args = parser.parse_args()
    try: print(json.dumps(publish(args.source, args.output, neighbor_preview=args.neighbor_preview, title_id=args.title_id), sort_keys=True))
    except (ValueError, OSError, KeyError, UnicodeError) as error: parser.exit(1, f'Manual conversion failed: {error}\n')
