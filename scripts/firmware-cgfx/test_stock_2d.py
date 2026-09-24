"""Synthetic source-boundary tests; Nintendo resource bytes stay private."""

import importlib.util
import copy
import json
import tempfile
import unittest
from pathlib import Path


directory = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('audit_stock_2d', directory / 'audit_stock_2d.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def png(width, height, rgba):
    import struct
    import zlib

    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))

    rows = b''.join(b'\0' + rgba[y * width * 4:(y + 1) * width * 4] for y in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>2I5B', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')


def template():
    return {'compressedSourceSha256': audit.SOURCE_HASHES['template'],
            'models': [{'name': 'Banner2D', 'meshes': [{'position': copy.deepcopy(audit.TEMPLATE_POSITIONS),
                       'uv0': copy.deepcopy(audit.TEMPLATE_UV), 'submeshes': [{'indices': [0, 1, 2, 1, 3, 2]}]}],
                       'materials': [{'Texture0Name': 'Dmy_00'}],
                       'skeleton': [{'NativeBillboardMode': 5}]}],
            'textures': [{'name': 'Dmy_00', 'width': 16, 'height': 16}],
            'skeletalAnimations': [], 'materialAnimations': [], 'visibilityAnimations': []}


class Stock2DTests(unittest.TestCase):
    def test_exact_template_geometry_and_billboard(self):
        self.assertEqual(audit.inspect_template(template())['nativeBillboardMode'], 5)
        changed = template()
        changed['models'][0]['meshes'][0]['position'][0][0] = -11
        with self.assertRaisesRegex(ValueError, 'quad'):
            audit.inspect_template(changed)
        changed = template()
        changed['models'][0]['skeleton'][0]['NativeBillboardMode'] = 1
        with self.assertRaisesRegex(ValueError, 'billboard'):
            audit.inspect_template(changed)

    def test_alpha_pixels_and_exclusive_bounds(self):
        with tempfile.TemporaryDirectory() as path:
            file = Path(path) / 'image.png'
            raw = bytearray(3 * 2 * 4)
            raw[(1 * 3 + 2) * 4 + 3] = 128
            file.write_bytes(png(3, 2, raw))
            self.assertEqual(audit.rgba_png_alpha(file, 3, 2), (1, [2, 1, 3, 2]))
            raw[(1 * 3 + 2) * 4 + 3] = 0
            file.write_bytes(png(3, 2, raw))
            self.assertEqual(audit.rgba_png_alpha(file, 3, 2), (0, None))
            with self.assertRaisesRegex(ValueError, 'expected'):
                audit.rgba_png_alpha(file, 2, 3)

    def test_title_cannot_become_a_model_or_unverified_texture_set(self):
        import hashlib

        with tempfile.TemporaryDirectory() as path:
            folder = Path(path)
            image = png(512, 128, bytes(512 * 128 * 4))
            (folder / 'texture-0.png').write_bytes(image)
            record = {'models': [], 'skeletalAnimations': [], 'materialAnimations': [],
                      'cbmd': {'language': 'eur-en', 'cbmdSha256': audit.SOURCE_HASHES['eshop'],
                               'cgfxSha256': 'synthetic', 'usedCommon': False},
                      'textures': [{'name': 'COMMON1', 'width': 512, 'height': 128,
                                    'url': 'texture-0.png', 'sha256': hashlib.sha256(image).hexdigest()}]}
            self.assertEqual(audit.inspect_title('eshop', record, folder)['textures'][0]['opaqueOrTranslucentPixels'], 0)
            changed = json.loads(json.dumps(record))
            changed['textures'][0]['name'] = 'Dmy_00'
            with self.assertRaisesRegex(ValueError, 'textures'):
                audit.inspect_title('eshop', changed, folder)
            changed = json.loads(json.dumps(record))
            changed['models'] = [{}]
            with self.assertRaisesRegex(ValueError, 'texture-only'):
                audit.inspect_title('eshop', changed, folder)
            changed = json.loads(json.dumps(record))
            changed['cbmd']['language'] = 'jpn-ja'
            with self.assertRaisesRegex(ValueError, 'identity'):
                audit.inspect_title('eshop', changed, folder)


if __name__ == '__main__':
    unittest.main()
