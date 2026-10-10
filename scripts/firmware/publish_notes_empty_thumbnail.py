"""Deliver Notes' original initialized empty thumbnail, never saved note data."""
import argparse
import copy
import json
from pathlib import Path
import struct

from build import converter_provenance, digest, encode
from publish_notes_hud import CODE_HASH, IDENTITY, TITLE, checked, validate_manifest
from texture import decode_texture, png

ORIGINAL_PACK = 'packs/game-notes/memo-MemoListDown-arc-l.json'
ORIGINAL_PACK_HASH = '6718e7beb40be0079a49fae9e5c2552b35a741028a5cab15f720ce995b3d118d'
PACK = 'packs/game-notes/contents/0000-00000007/memo-MemoListDown-empty-thumbnail.json'
TEXTURE = 'runtime-empty-note-thumbnail'
PIXELS = 'textures/game-notes/contents/0000-00000007/empty-note-thumbnail.png'
POWERS = (8, 16, 32, 64, 128, 256, 512, 1024)


def initialized_buffers(code):
    checked(code, CODE_HASH, 'ExeFS/code.bin')
    pixel_type, pixel_format, value = struct.unpack_from('<3I', code, 0x971c)
    powers = struct.unpack_from('<8I', code, 0xaac20)
    if (pixel_type, pixel_format, value) != (0x8363, 0x6754, 0xe73c) or powers != POWERS:
        raise ValueError('Unexpected Notes empty-buffer source constants')
    # 0x1037ec..0x103820 invokes 0x109584 for each of the 16 items. Its
    # halfword loops fill the entire padded full and thumbnail allocations.
    storage = lambda logical: tuple(next(size for size in powers if size >= n) for n in logical)
    full = storage((320, 216))
    thumb = storage((68, 42))
    halfword = struct.pack('<H', value)
    return halfword*(full[0]*full[1]), halfword*(thumb[0]*thumb[1]), thumb


def publish(code, output, artifacts, ctrtool):
    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    validate_manifest(manifest)
    source_code = code.read_bytes()
    _, raw, (width, height) = initialized_buffers(source_code)
    original = checked((output/ORIGINAL_PACK).read_bytes(), ORIGINAL_PACK_HASH, ORIGINAL_PACK)
    if manifest['resources'][ORIGINAL_PACK]['sha256'] != ORIGINAL_PACK_HASH:
        raise ValueError('Unexpected delivered Notes list provenance')
    source = json.loads(original)
    if source['titleId'] != TITLE or source['unsupported'] or set(source['layouts']) != {'MemoListDown'}:
        raise ValueError('Unexpected original Notes list selection')
    data = png(width, height, decode_texture(raw, width, height, 3))
    code_source = {'titleId': TITLE, **IDENTITY, 'path': 'ExeFS/code.bin', 'sha256': CODE_HASH}
    conversion = converter_provenance(ctrtool)
    conversion['runtimeBinding'] = {
        'name': 'notes-initial-empty-thumbnail-rgb565', 'version': 1,
        'scriptSha256': digest(Path(__file__).read_bytes()),
        'sourceCodeSha256': CODE_HASH, 'sourcePackSha256': ORIGINAL_PACK_HASH,
        'initializer': ['0x109584', '0x109718'], 'startupLoop': ['0x1037ec', '0x103824'],
        'literalAddress': '0x109724', 'literalCodeOffset': '0x9724',
        'paddingTableAddress': '0x1aac20', 'paddingTableCodeOffset': '0xaac20',
        'pixelFormat': '0x6754', 'pixelType': '0x8363', 'picaFormat': 3,
        'fillHalfword': '0xe73c', 'logicalSize': [68, 42], 'storageSize': [width, height],
        'initializedBufferSha256': digest(raw), 'savedNoteContent': False,
    }
    pack = copy.deepcopy(source)
    pack.update(name='MemoListDown-empty-thumbnail', **IDENTITY)
    pack['textures'][TEXTURE] = {
        'width': width, 'height': height, 'picaFormat': 3, 'formatName': 'RGB565',
        'sourceSha256': CODE_HASH, 'url': PIXELS, 'sha256': digest(data),
    }
    pack['resourceSources']['textures'][TEXTURE] = code_source
    # The original list layout, clips, and texture mappings are retained.
    for group in pack['resourceSources'].values():
        for entry in group.values():
            if isinstance(entry, dict) and entry.get('titleId') == TITLE:
                entry.update(IDENTITY)
    sources = [{**entry, **IDENTITY} for entry in manifest['resources'][ORIGINAL_PACK]['sources']]
    before = copy.deepcopy(manifest)
    deliveries = {PACK: (encode(pack), 'pack', sources+[code_source]),
                  PIXELS: (data, 'texture', [code_source])}
    for url, (value, kind, origins) in deliveries.items():
        record = {'kind': kind, 'size': len(value), 'sha256': digest(value),
                  'sources': origins, 'conversion': conversion}
        previous = manifest['resources'].get(url)
        if previous and previous != record:
            raise ValueError('Conflicting delivered empty Notes resource: '+url)
        if previous:
            checked((output/url).read_bytes(), record['sha256'], url)
        manifest['resources'][url] = record
    if PACK not in manifest['titles'][TITLE]['packs']:
        manifest['titles'][TITLE]['packs'].append(PACK)
    if not all(manifest['resources'][url] == record for url, record in before['resources'].items()):
        raise ValueError('Existing resource provenance changed')
    for url, (value, _, _) in deliveries.items():
        target = output/url
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(value)
    manifest_path.write_bytes(encode(manifest))
    report = {'schema': 1, 'titleId': TITLE, **IDENTITY, 'conversion': conversion,
              'pack': PACK, 'texture': PIXELS, 'manifestSha256': digest(encode(manifest)),
              'existingResourcesPreserved': True, 'nativePixelsUsedAsInput': False}
    artifacts.mkdir(parents=True, exist_ok=True)
    (artifacts/'notes-empty-thumbnail-publication.json').write_bytes(encode(report))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('code', 'output', 'artifacts', 'ctrtool'):
        parser.add_argument('--'+key, required=True, type=Path)
    args = parser.parse_args()
    if any(not value.is_absolute() for value in vars(args).values()):
        parser.error('Every path must be absolute')
    print(json.dumps(publish(**vars(args)), sort_keys=True))


if __name__ == '__main__':
    main()
