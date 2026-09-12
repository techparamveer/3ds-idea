"""Independent semantic and decoded-pixel checks on the web delivery GLB."""
import copy
import io
import json
from pathlib import Path
import struct
import unittest
from PIL import Image

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def load(name):
    raw = (FOLDER/name).read_bytes()
    assert raw[:4] == b'glTF' and struct.unpack_from('<I', raw, 8)[0] == len(raw)
    size = struct.unpack_from('<I', raw, 12)[0]
    return json.loads(raw[20:20+size]), raw[28+size:]


def view(asset, index):
    doc, binary = asset; v = doc['bufferViews'][index]
    offset = v.get('byteOffset', 0)
    return binary[offset:offset+v['byteLength']]


class WebModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = load('silver-audio-contacts.glb')
        cls.web = load('silver-audio-contacts-web.glb')

    def test_geometry_and_document_are_unchanged_except_image_storage(self):
        before, after = copy.deepcopy(self.source[0]), copy.deepcopy(self.web[0])
        image_views = {image['bufferView'] for image in before['images']}
        for index, original in enumerate(before['bufferViews']):
            if index not in image_views:
                self.assertEqual(view(self.source, index), view(self.web, index))
            after['bufferViews'][index] = original
        for old, new in zip(before['images'], after['images']):
            new['mimeType'] = old['mimeType']
        for texture in after['textures']:
            extension = texture.get('extensions', {}).pop('EXT_texture_webp', None)
            if extension:
                texture['source'] = extension['source']
                if not texture['extensions']: del texture['extensions']
        for name in ['extensionsRequired', 'extensionsUsed']:
            after[name].remove('EXT_texture_webp')
            if not after[name] and name not in before: del after[name]
        after['buffers'] = before['buffers']
        self.assertEqual(after, before)

    def test_all_decoded_rgba_pixels_and_dimensions_are_identical(self):
        self.assertEqual(len(self.source[0]['images']), len(self.web[0]['images']))
        for old, new in zip(self.source[0]['images'], self.web[0]['images']):
            with self.subTest(image=old.get('name')):
                with Image.open(io.BytesIO(view(self.source, old['bufferView']))) as a, Image.open(io.BytesIO(view(self.web, new['bufferView']))) as b:
                    self.assertEqual(a.size, b.size)
                    self.assertEqual(a.convert('RGBA').tobytes(), b.convert('RGBA').tobytes())


if __name__ == '__main__': unittest.main()
