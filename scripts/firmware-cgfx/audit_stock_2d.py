"""Audit converted EUR stock 2D banners without publishing private CBMD/CGFX.

Convert Banner2D_LZ.bin and each selected exefs/banner.bin with convert.py first.
This establishes resource identity and geometry, not the native texture binding or
HOME presentation pose. No title image is guessed into the dummy material.
"""

import argparse
import hashlib
import json
import struct
import zlib
from pathlib import Path


SOURCE_HASHES = {
    'template': '070883e42b4a0b33d7aa82d9b95d3612d3afab9cff772fa359f651fb0675c23c',
    'camera': 'e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280',
    'sound': 'fb5ee57657e781fadef6d90261f6eebae185996f82428d60ff439a9d568da3f7',
    'health': 'bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755',
    'eshop': 'c810cc2e10769f26a857bc5edd35acc17cee0372c1f775be02ed407b9e4678de',
    'zone': '258aa3167be080eacb396539c5c3d76001d5ca12dc9d8b87955f7a977c4b2ec3',
}
HOME_CODE_SHA256 = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
TITLE_TEXTURES = {
    'camera': [('COMMON1', 512, 128), ('COMMON2', 512, 128)],
    'sound': [('COMMON1', 512, 128), ('COMMON2', 512, 128)],
    'health': [('COMMON1', 512, 128), ('COMMON2', 128, 128)],
    'eshop': [('COMMON1', 512, 128)],
    'zone': [('JPN_JP', 256, 32)],
}
TEMPLATE_POSITIONS = [[-12, -6, 6.5], [12, -6, 6.5], [-12, 6, 6.5], [12, 6, 6.5]]
TEMPLATE_UV = [[0, 0], [1, 0], [0, 1], [1, 1]]


def rgba_png_alpha(path: Path, width: int, height: int) -> tuple[int, list[int] | None]:
    """Count occupied pixels from the converter's unfiltered RGBA PNG format."""
    data = path.read_bytes()
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError(f'{path}: invalid PNG signature')
    offset, image_data, dimensions = 8, bytearray(), None
    while offset + 12 <= len(data):
        size = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        if len(payload) != size or offset + 12 + size > len(data):
            raise ValueError(f'{path}: truncated PNG chunk')
        if zlib.crc32(kind + payload) != struct.unpack_from('>I', data, offset + 8 + size)[0]:
            raise ValueError(f'{path}: invalid PNG CRC')
        if kind == b'IHDR':
            dimensions = struct.unpack('>2I5B', payload)
        elif kind == b'IDAT':
            image_data.extend(payload)
        elif kind == b'IEND':
            break
        offset += 12 + size
    if dimensions != (width, height, 8, 6, 0, 0, 0):
        raise ValueError(f'{path}: expected {width}x{height} RGBA8 PNG')
    raw = zlib.decompress(image_data)
    stride = width * 4 + 1
    if len(raw) != height * stride or any(raw[row * stride] for row in range(height)):
        raise ValueError(f'{path}: unsupported PNG scanlines')
    occupied = [(x, y) for y in range(height) for x in range(width)
                if raw[y * stride + 1 + x * 4 + 3]]
    if not occupied:
        return 0, None
    return len(occupied), [min(x for x, _ in occupied), min(y for _, y in occupied),
                           max(x for x, _ in occupied) + 1, max(y for _, y in occupied) + 1]


def inspect_template(model: dict) -> dict:
    models = model.get('models', [])
    if len(models) != 1 or models[0].get('name') != 'Banner2D':
        raise ValueError('Expected the native Banner2D model')
    native = models[0]
    meshes, materials, skeleton = native['meshes'], native['materials'], native['skeleton']
    if len(meshes) != 1 or len(materials) != 1 or len(skeleton) != 1:
        raise ValueError('Unexpected Banner2D model topology')
    mesh = meshes[0]
    if (mesh['position'] != TEMPLATE_POSITIONS or mesh['uv0'] != TEMPLATE_UV
            or [part['indices'] for part in mesh['submeshes']] != [[0, 1, 2, 1, 3, 2]]
            or materials[0]['Texture0Name'] != 'Dmy_00'
            or skeleton[0]['NativeBillboardMode'] != 5):
        raise ValueError('Banner2D quad, UV, dummy binding or billboard differs')
    textures = model['textures']
    if len(textures) != 1 or (textures[0]['name'], textures[0]['width'], textures[0]['height']) != ('Dmy_00', 16, 16):
        raise ValueError('Unexpected Banner2D dummy texture')
    if any(model.get(key) for key in ('skeletalAnimations', 'materialAnimations', 'visibilityAnimations')):
        raise ValueError('Unexpected Banner2D animation')
    return {'model': 'Banner2D', 'quadPositions': TEMPLATE_POSITIONS, 'uv0': TEMPLATE_UV,
            'dummyTexture': 'Dmy_00', 'nativeBillboardMode': 5, 'sourceSha256': model['compressedSourceSha256']}


def inspect_title(name: str, model: dict, directory: Path) -> dict:
    if name not in TITLE_TEXTURES:
        raise ValueError(f'Unknown title: {name}')
    if model.get('models') or model.get('skeletalAnimations') or model.get('materialAnimations'):
        raise ValueError(f'{name}: expected texture-only CBMD')
    cbmd = model.get('cbmd', {})
    if cbmd.get('language') != 'eur-en' or cbmd.get('cbmdSha256') != SOURCE_HASHES[name]:
        raise ValueError(f'{name}: unexpected CBMD identity or locale')
    expected = TITLE_TEXTURES[name]
    actual = [(item['name'], item['width'], item['height']) for item in model['textures']]
    if actual != expected:
        raise ValueError(f'{name}: unexpected selected CGFX textures')
    result = []
    for texture in model['textures']:
        file = directory / texture['url']
        if hashlib.sha256(file.read_bytes()).hexdigest() != texture['sha256']:
            raise ValueError(f'{name}: converted PNG hash mismatch')
        count, bounds = rgba_png_alpha(file, texture['width'], texture['height'])
        result.append({'name': texture['name'], 'size': [texture['width'], texture['height']],
                       'pngSha256': texture['sha256'], 'opaqueOrTranslucentPixels': count,
                       'alphaBoundsExclusive': bounds})
    return {'cbmdSha256': cbmd['cbmdSha256'], 'selectedCgfxSha256': cbmd['cgfxSha256'],
            'usedCommon': cbmd['usedCommon'], 'models': 0, 'textures': result}


def inspect_home_code(data: bytes) -> dict:
    """Prove the type-8 selector reaches Banner2D; title-to-type8 remains open."""
    if hashlib.sha256(data).hexdigest() != HOME_CODE_SHA256:
        raise ValueError('Unexpected EUR HOME code identity')
    base = 0x100000
    anchors = {0x1f9334: 0xe2440003,  # subtract 3 for type jump-table index
               0x1f933c: 0x379ff100,  # dispatch via indexed PC load
               0x1f9358: 0x1f9474,  # type 8 -> model loader arm
               0x1f9474: 0xe59f61fc,  # load resource table base
               0x1f9484: 0xe5963020,  # table + 0x20 -> Banner2D string
               0x1f9678: 0x32ed04,  # resource table base
               0x32ed24: 0x322c29}  # Banner2D NUL-terminated string
    for address, expected in anchors.items():
        if struct.unpack_from('<I', data, address - base)[0] != expected:
            raise ValueError(f'Unexpected HOME instruction/table at {address:#x}')
    if data[0x322c29 - base:0x322c32 - base] != b'Banner2D\0':
        raise ValueError('Missing HOME Banner2D resource name')
    return {'codeSha256': HOME_CODE_SHA256, 'selectorFunction': '0x1f9324',
            'banner2DDispatchType': 8, 'banner2DArm': '0x1f9474',
            'resourceTableEntry': '0x32ed24', 'titleToType8Verified': False}


def audit(directories: dict[str, Path], home_code: Path | None = None) -> dict:
    if set(directories) != set(SOURCE_HASHES):
        raise ValueError('Provide the template and all five named titles')
    models = {name: json.loads((directory / 'model.json').read_text())
              for name, directory in directories.items()}
    for name, model in models.items():
        if model.get('compressedSourceSha256') != SOURCE_HASHES[name]:
            raise ValueError(f'{name}: source hash mismatch')
    return {'firmware': 'EUR HOME 10.7.0-32E',
            'staticHomePath': inspect_home_code(home_code.read_bytes()) if home_code else None,
            'template': inspect_template(models['template']),
            'titles': {name: inspect_title(name, models[name], directories[name])
                       for name in TITLE_TEXTURES},
            'nativeBindingVerified': False,
            'scope': 'Offline CGFX/PNG resource audit; no HOME texture substitution or rendered-pixel claim'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in SOURCE_HASHES:
        parser.add_argument('--' + name, required=True, type=Path, help='Converted model directory')
    parser.add_argument('--home-code', type=Path, help='Private decrypted HOME exefs/code.bin')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = audit({name: getattr(args, name) for name in SOURCE_HASHES}, args.home_code)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
