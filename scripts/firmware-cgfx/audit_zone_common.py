"""Hash-gated static Nintendo Zone common/locale binding audit.

All inputs stay in private artifact storage. The checked fixture records names,
hashes and derived geometry counts, never firmware or texture bytes.
"""

import argparse
import hashlib
import json
from pathlib import Path

from audit_stock_2d import rgba_png_alpha


CBMD_SHA = '258aa3167be080eacb396539c5c3d76001d5ca12dc9d8b87955f7a977c4b2ec3'
COMMON_SHA = '3e2b2896e8439ea88a767e71fedf6921936a49aae724065ac0bc3701a8a4b83e'
SELECTED_SHA = '57b8a0b278379dad8619d6eecc71a9354881b988775404d5dfc8b61485bbb992'
TEXTURES = ['COMMON1', 'COMMON2', 'COMMON3', 'COMMON4', 'COMMON5', 'COMMON6', 'COMMON7', 'JPN_JP']


def inspect(common_source: Path, common_dir: Path, selected_dir: Path) -> dict:
    if hashlib.sha256(common_source.read_bytes()).hexdigest() != COMMON_SHA:
        raise ValueError('Unexpected Nintendo Zone common CGFX')
    common = json.loads((common_dir / 'model.json').read_text())
    selected = json.loads((selected_dir / 'model.json').read_text())
    if common['sourceSha256'] != COMMON_SHA or common['animationStatus'] != 'omitted: unsupported Zone common CGFX curve':
        raise ValueError('Common conversion identity or animation boundary changed')
    cbmd = selected['cbmd']
    if (cbmd['cbmdSha256'], cbmd['cgfxSha256'], cbmd['language'], cbmd['usedCommon']) != (CBMD_SHA, SELECTED_SHA, 'eur-en', False):
        raise ValueError('Unexpected selected EUR-English CGFX')
    if cbmd['modelOffset'] != 0x149eb or cbmd['modelEnd'] != 0x14a95:
        raise ValueError('Unexpected EUR-English CBMD offset')
    if len(common['models']) != 1 or common['models'][0]['name'] != 'COMMON' or selected['models']:
        raise ValueError('Unexpected common or selected model')
    model = common['models'][0]
    if len(model['meshes']) != 4 or len(model['materials']) != 4:
        raise ValueError('Unexpected Zone common geometry')
    if [item['name'] for item in common['textures']] != TEXTURES or [item['name'] for item in selected['textures']] != ['JPN_JP']:
        raise ValueError('Unexpected Zone texture names')
    if any(common[key] for key in ('skeletalAnimations', 'materialAnimations', 'visibilityAnimations', 'cameraAnimations')):
        raise ValueError('Static export must not imply parsed clips')
    textures = []
    for item in common['textures']:
        file = common_dir / item['url']
        if hashlib.sha256(file.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Common texture hash changed')
        pixels, _ = rgba_png_alpha(file, item['width'], item['height'])
        if pixels == 0:
            raise ValueError('Unexpected empty common texture')
        textures.append({'name': item['name'], 'sha256': item['sha256'], 'visiblePixels': pixels})
    materials = [{'name': item['Name'], 'textureSlots': [item.get(f'Texture{i}Name') for i in range(3)]}
                 for item in model['materials']]
    if not any('JPN_JP' in item['textureSlots'] for item in materials):
        raise ValueError('Selected texture has no common material match')
    selected_texture = selected['textures'][0]
    if hashlib.sha256((selected_dir / selected_texture['url']).read_bytes()).hexdigest() != selected_texture['sha256']:
        raise ValueError('Selected texture hash changed')
    count, bounds = rgba_png_alpha(selected_dir / selected_texture['url'], selected_texture['width'], selected_texture['height'])
    if count != 0 or bounds is not None:
        raise ValueError('EUR-English replacement is no longer transparent')
    meshes = [{'material': materials[item['material']]['name'], 'layer': item['layer'],
               'priority': item['priority'], 'vertices': len(item['position']),
               'indices': sum(len(part['indices']) for part in item['submeshes'])}
              for item in model['meshes']]
    return {'cbmdSha256': CBMD_SHA, 'commonOffset': '0x88',
            'selectedOffset': hex(cbmd['modelOffset']), 'selectedEnd': hex(cbmd['modelEnd']),
            'commonCgfxSha256': COMMON_SHA, 'selectedCgfxSha256': SELECTED_SHA,
            'selectedCompressedSha256': cbmd['compressedModelSha256'], 'model': 'COMMON',
            'meshes': meshes, 'materials': materials,
            'commonTextures': textures, 'selectedTexture': {'name': 'JPN_JP',
            'sha256': selected_texture['sha256'], 'visiblePixels': count},
            'nativeBillboardModes': [bone['NativeBillboardMode'] for bone in model['skeleton']],
            'animation': 'Omitted due to unresolved SPICA Hermite128 parse failure; no pose or timing claim',
            'scope': 'Static source geometry and texture-name binding only; no native worker execution or matched LCD pixels'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--common-source', required=True, type=Path)
    parser.add_argument('--common-dir', required=True, type=Path)
    parser.add_argument('--selected-dir', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(inspect(args.common_source, args.common_dir, args.selected_dir), indent=2) + '\n')
