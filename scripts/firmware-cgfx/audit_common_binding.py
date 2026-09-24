"""Verify the bounded type-1 common-model/locale-texture HOME banner path.

Inputs are private converted CGFX directories and HOME code.bin. Output contains
only hashes and derived model/material names; it publishes no source bytes.
The Zone common CGFX is intentionally excluded until its animation parses.
"""

import argparse
import hashlib
import json
import struct
from pathlib import Path


HOME_CODE_SHA256 = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
EXPECTED = {
    'camera': ('068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d',
               'e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280', 4),
    'sound': ('2364f06f9fa15113969545f2bfc19976a71a0cfb0664b3dae884395b0f4af7c1',
              'fb5ee57657e781fadef6d90261f6eebae185996f82428d60ff439a9d568da3f7', 4),
    'health': ('e1560e2ca6dfe8d01932c78eaa81ca5c93389c13852e2e4adcf20cb46d5b8032',
               'bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755', 2),
    'eshop': ('0d30668534a6bbf1c7a8403b3b83762d6ccae59996775f6822c8ddf9513c7a94',
              'c810cc2e10769f26a857bc5edd35acc17cee0372c1f775be02ed407b9e4678de', 4),
}


def check_code(code: bytes) -> dict:
    if hashlib.sha256(code).hexdigest() != HOME_CODE_SHA256:
        raise ValueError('Unexpected EUR HOME code identity')
    # ARM words are checked at each boundary, rather than treating nearby
    # data/table words as instructions. Virtual addresses use base 0x100000.
    anchors = {
        0x24cb10: 0xe0800005,  # common offset added to CBMD base
        0x24cb30: 0xebff4d4e,  # decompress common into M+0xcc
        0x24cb40: 0xe59800d8,  # CBMD base for selected offset
        0x249c8c: 0xeb001097,  # prepare primary from M+0xcc
        0x249cbc: 0xeb00108b,  # prepare secondary from M+0xd0
        0x249cc8: 0xeb001017,  # bind matching textures
        0x24de38: 0xebff9fd4,  # compare material and replacement texture name
        0x24de90: 0x1bfebe9f,  # replace matching texture reference
    }
    for address, expected in anchors.items():
        actual = struct.unpack_from('<I', code, address - 0x100000)[0]
        if actual != expected:
            raise ValueError(f'HOME binding anchor changed at {address:#x}: {actual:#x}')
    return {'codeSha256': HOME_CODE_SHA256,
            'commonLoad': '0x24cb10..0x24cb30',
            'localeLoad': '0x24cb40..0x24cb64',
            'primarySecondaryPrepare': '0x249c7c..0x249cc8',
            'textureNameMatch': '0x24dd2c..0x24de90',
            'textureReferenceReplacement': '0x1fd914'}


def check_title(name: str, common_dir: Path, selected_dir: Path) -> dict:
    common_source_hash, cbmd_hash, mesh_count = EXPECTED[name]
    common_file = common_dir / 'common.bcres'
    common = json.loads((common_dir / 'converted/model.json').read_text())
    selected = json.loads((selected_dir / 'model.json').read_text())
    if hashlib.sha256(common_file.read_bytes()).hexdigest() != common_source_hash:
        raise ValueError(f'{name}: common CGFX hash changed')
    if common.get('compressedSourceSha256') != common_source_hash:
        raise ValueError(f'{name}: converted common source changed')
    if selected.get('cbmd', {}).get('cbmdSha256') != cbmd_hash:
        raise ValueError(f'{name}: selected CBMD changed')
    if selected['cbmd'].get('language') != 'eur-en' or selected['cbmd'].get('usedCommon'):
        raise ValueError(f'{name}: expected distinct EUR-English entry')
    if len(common.get('models', [])) != 1 or common['models'][0]['name'] != 'COMMON':
        raise ValueError(f'{name}: expected COMMON model in common slot')
    model = common['models'][0]
    if len(model['meshes']) != mesh_count or selected.get('models'):
        raise ValueError(f'{name}: unexpected common/locale geometry')
    common_textures = {item['name'] for item in common['textures']}
    selected_textures = {item['name'] for item in selected['textures']}
    if len(common_textures) != len(common['textures']) or len(selected_textures) != len(selected['textures']):
        raise ValueError(f'{name}: duplicate texture names')
    if not selected_textures <= common_textures:
        raise ValueError(f'{name}: locale texture has no common name match')
    materials = []
    for material in model['materials']:
        slots = [material.get(f'Texture{i}Name') for i in range(3)]
        materials.append({'name': material['Name'], 'textures': slots,
                          'localeOverrides': [slot for slot in slots if slot in selected_textures]})
    bound = {slot for material in materials for slot in material['localeOverrides']}
    if bound != selected_textures:
        raise ValueError(f'{name}: selected texture has no material slot')
    meshes = []
    for mesh in model['meshes']:
        uv = mesh['uv0']
        meshes.append({'material': materials[mesh['material']]['name'],
                       'layer': mesh['layer'], 'priority': mesh['priority'],
                       'uv0Bounds': [[min(point[axis] for point in uv),
                                      max(point[axis] for point in uv)] for axis in (0, 1)]})
    return {'commonCgfxSha256': common_source_hash,
            'selectedCgfxSha256': selected['cbmd']['cgfxSha256'],
            'cbmdSha256': cbmd_hash, 'model': model['name'],
            'meshCount': mesh_count, 'commonTextures': sorted(common_textures),
            'localeTextureOverrides': sorted(selected_textures), 'materials': materials,
            'meshes': meshes,
            'nativeBillboardModes': [bone['NativeBillboardMode'] for bone in model['skeleton']],
            'skeletalClips': [item['Name'] for item in common['skeletalAnimations']],
            'materialClips': [item['Name'] for item in common['materialAnimations']]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home-code', type=Path, required=True)
    parser.add_argument('--common-root', type=Path, required=True,
                        help='Private directories TITLE/common.bcres and TITLE/converted/model.json')
    parser.add_argument('--selected-root', type=Path, required=True,
                        help='Private directories TITLE/model.json')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = {'firmware': 'EUR HOME 10.7.0-32E',
              'sourcePath': check_code(args.home_code.read_bytes()),
              'titles': {name: check_title(name, args.common_root / name,
                                           args.selected_root / name) for name in EXPECTED},
              'scope': 'Static common-model/locale-texture binding; no worker execution, GPU pixels or native timing',
              'zoneStatus': 'Common CGFX exporter fails while parsing a Hermite128 animation; unverified'}
    args.output.write_text(json.dumps(report, indent=2) + '\n')
