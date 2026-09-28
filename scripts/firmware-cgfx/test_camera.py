"""Synthetic camera fixtures; private firmware verification is explicitly opt-in."""
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('camera.py')
spec = importlib.util.spec_from_file_location('camera_parser', SCRIPT)
camera_parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(camera_parser)


def fixture(padding=0):
    """Build a different camera, relocating every pointed-to structure."""
    data = bytearray(0x380 + padding)
    dictionary, camera = 0xB0 + padding, 0x100 + padding
    view, projection, name = 0x240 + padding, 0x270 + padding, 0xA0
    struct.pack_into('<4sHHIII', data, 0, b'CGFX', 0xFEFF, 20,
                     0x05000000, len(data), 1)
    struct.pack_into('<4sI', data, 20, b'DATA', len(data) - 20)
    struct.pack_into('<II', data, 0x44, 1, dictionary - 0x48)
    struct.pack_into('<4sII', data, dictionary, b'DICT', 44, 1)
    struct.pack_into('<IHH', data, dictionary + 12, 0xFFFFFFFF, 1, 0)
    node = dictionary + 28
    struct.pack_into('<IHHii', data, node, 9, 0, 1, name - node - 8, camera - node - 12)
    data[name:name + 7] = b'Probe\0\0'
    struct.pack_into('<I4sI', data, camera, 0x4000000A, b'CCAM', 0x06000000)
    struct.pack_into('<i', data, camera + 12, name - camera - 12)
    struct.pack_into('<9f', data, camera + 0x30,
                     1.5, 2, 0.75, 0.1, -0.2, 0.3, 3, 4, 30)
    struct.pack_into('<IIii', data, camera + 0xB4, 0, 0,
                     view - camera - 0xBC, projection - camera - 0xC0)
    struct.pack_into('<II4f', data, view, 0x80000000, 0, 3, 4, 0, 0.2)
    struct.pack_into('<I4f', data, projection, 0x20000000, 2, 800, 1.6, 0.9)
    return data, {'dictionary': dictionary, 'camera': camera, 'view': view,
                  'projection': projection, 'name': name, 'node': node}


def literal_lz(data, kind):
    return (bytes([kind]) + len(data).to_bytes(3, 'little')
            + b''.join(b'\0' + data[i:i + 8] for i in range(0, len(data), 8)))


class CameraTests(unittest.TestCase):
    def reject(self, data, pattern=None):
        with self.assertRaisesRegex(camera_parser.CameraParseError, pattern or '.'):
            camera_parser.parse_cameras(bytes(data))

    def test_relocated_camera_and_negative_relative_name_pointer(self):
        for padding in (0, 64, 156):
            data, offsets = fixture(padding)
            result = camera_parser.parse_cameras(bytes(data), 'synthetic.bcres')
            self.assertEqual(result['sourceName'], 'synthetic.bcres')
            self.assertEqual(result['sourceSha256'], hashlib.sha256(data).hexdigest())
            camera = result['cameras'][0]
            self.assertEqual(camera['name'], 'Probe')
            self.assertEqual(camera['position'], [3, 4, 30])
            self.assertEqual(camera['scale'], [1.5, 2, 0.75])
            self.assertAlmostEqual(camera['rotation'][1], -0.2)
            self.assertEqual(camera['aimTarget'], [3, 4, 0])
            self.assertAlmostEqual(camera['aimTwist'], 0.2)
            self.assertAlmostEqual(camera['perspectiveFovRadians'], 0.9)
            self.assertAlmostEqual(camera['aspect'], 1.6)
            self.assertEqual((camera['near'], camera['far']), (2, 800))
            self.assertEqual(camera['sourceOffsets']['camera'], offsets['camera'])
            self.assertEqual(camera['sourceOffsets']['view'], offsets['view'])

    def test_container_bounds_and_revision(self):
        for offset, value in [(8, 0x04000000), (12, 0), (16, 0), (16, 17), (24, 7), (24, 0xFFFFFFFF)]:
            data, _ = fixture()
            struct.pack_into('<I', data, offset, value)
            self.reject(data)
        for data in (b'', b'CGFX', bytes(fixture()[0][:-1])):
            self.reject(data)
        data, _ = fixture()
        data[4:6] = b'\xfe\xff'
        self.reject(data, 'little-endian')

    def test_data_pointers_cannot_escape_into_an_image_section(self):
        data, offsets = fixture()
        data.extend(struct.pack('<4sI', b'IMAG', 264) + bytes(256))
        struct.pack_into('<II', data, 12, len(data), 2)
        self.assertEqual(len(camera_parser.parse_cameras(bytes(data))['cameras']), 1)
        field = offsets['camera'] + 0xBC
        struct.pack_into('<i', data, field, 0x388 - field)
        self.reject(data, 'outside section')

    def test_section_count_and_unknown_sections(self):
        for tag in (b'JUNK', b'IMAG'):
            data, _ = fixture()
            data[20:24] = tag
            self.reject(data)
        data, _ = fixture()
        struct.pack_into('<I', data, 24, len(data) - 24)
        self.reject(data, 'cover the file')

    def test_null_out_of_range_and_truncated_pointers(self):
        for field in ('view', 'projection', 'camera', 'dictionary'):
            for target in (None, -4, 0x37C, 0x100000):
                data, offsets = fixture()
                pointer = {'view': offsets['camera'] + 0xBC,
                           'projection': offsets['camera'] + 0xC0,
                           'camera': offsets['node'] + 12, 'dictionary': 0x48}[field]
                struct.pack_into('<i', data, pointer, 0 if target is None else target - pointer)
                self.reject(data)

    def test_dictionary_consistency(self):
        for relative, value in [(4, 40), (8, 2), (16, 3)]:
            data, offsets = fixture()
            struct.pack_into('<I', data, offsets['dictionary'] + relative, value)
            self.reject(data, 'dictionary')
        for count in (0, 1025):
            data, _ = fixture()
            struct.pack_into('<I', data, 0x44, count)
            self.reject(data, 'cameras')

    def test_camera_names(self):
        data, offsets = fixture()
        struct.pack_into('<i', data, offsets['node'] + 8, 0x350 - offsets['node'] - 8)
        data[0x350:0x356] = b'Other\0'
        self.reject(data, 'names disagree')
        data, offsets = fixture()
        data[offsets['name']] = 0xFF
        self.reject(data, 'UTF-8')
        data, offsets = fixture()
        data[0x37C:] = b'nope'
        struct.pack_into('<i', data, offsets['node'] + 8, 0x37C - offsets['node'] - 8)
        self.reject(data, 'unterminated')

    def test_unsupported_camera_variants_are_explicit(self):
        cases = [('camera', 0, 0x40000012), ('camera', 8, 0x05000000),
                 ('camera', 0xB4, 1), ('camera', 0xB8, 2), ('camera', 0x20, 1),
                 ('view', 0, 0x40000000), ('view', 4, 1),
                 ('projection', 0, 0x40000000)]
        for field, relative, value in cases:
            data, offsets = fixture()
            struct.pack_into('<I', data, offsets[field] + relative, value)
            self.reject(data)
        data, _ = fixture()
        struct.pack_into('<I', data, 0x7C, 1)  # CameraAnimations is resource slot 12.
        self.reject(data, 'Animated')

    def test_nonfinite_and_invalid_camera_values(self):
        for field, relative, value in [('camera', 0x48, math.nan), ('camera', 0x30, 0),
                                       ('camera', 0x3C, math.inf), ('view', 0x14, -math.inf),
                                       ('projection', 4, 0), ('projection', 8, 1),
                                       ('projection', 12, -1), ('projection', 16, 4)]:
            data, offsets = fixture()
            struct.pack_into('<f', data, offsets[field] + relative, value)
            self.reject(data)
        data, offsets = fixture()
        struct.pack_into('<3f', data, offsets['view'] + 8, 3, 4, 30)
        self.reject(data, 'coincide')

    def test_resource_loading_and_cli(self):
        data, _ = fixture()
        scratch = os.environ.get('FIRMWARE_CAMERA_TEST_SCRATCH')
        with tempfile.TemporaryDirectory(dir=scratch) as directory:
            source, output = Path(directory) / 'Probe_LZ.bin', Path(directory) / 'camera.json'
            for encoded in (data, literal_lz(data, 0x10), literal_lz(data, 0x11)):
                source.write_bytes(encoded)
                result = camera_parser.load_camera_resource(source)
                self.assertEqual(result['sourceSha256'], hashlib.sha256(data).hexdigest())
                self.assertEqual(result['compressedSourceSha256'], hashlib.sha256(encoded).hexdigest())
            subprocess.run([sys.executable, str(SCRIPT), str(source), '--output', str(output)], check=True)
            self.assertEqual(json.loads(output.read_text())['cameras'][0]['name'], 'Probe')
            original = source.read_bytes()
            rejected = subprocess.run([sys.executable, str(SCRIPT), str(source), '--output', str(source)],
                                      capture_output=True)
            self.assertNotEqual(rejected.returncode, 0)
            self.assertEqual(source.read_bytes(), original)
            source.write_bytes(b'\x11\x20\0\0')
            with self.assertRaises(ValueError):
                camera_parser.load_camera_resource(source)


@unittest.skipUnless(os.environ.get('FIRMWARE_CAMERA_SOURCE'), 'Private firmware input not supplied')
class PrivateCameraVerification(unittest.TestCase):
    def test_explicit_home_10_7_banner_camera(self):
        result = camera_parser.load_camera_resource(Path(os.environ['FIRMWARE_CAMERA_SOURCE']))
        self.assertEqual(result['compressedSourceSha256'],
                         '54df078dfb80a7fe55b391d10993353fe3b9ae2135a87f204b1ad8f641cc4ad9')
        self.assertEqual(result['sourceSha256'],
                         '19d1009bc472a34626a10ec903d689fbd4b3b6951addc28beaa4f155db9bf897')
        self.assertEqual(len(result['cameras']), 1)
        camera = result['cameras'][0]
        self.assertEqual(camera['name'], 'BannerCamera')
        self.assertEqual(camera['position'], [0, 1, 44.7859992980957])
        self.assertEqual(camera['aimTarget'], [0, 1, 0])
        self.assertEqual(camera['aimTwist'], 0)
        self.assertEqual(camera['scale'], [1, 1, 1])
        self.assertEqual(camera['rotation'], [0, 0, 0])
        self.assertEqual((camera['near'], camera['far']), (26.5, 1000))
        self.assertAlmostEqual(math.degrees(camera['perspectiveFovRadians']), 30, places=5)
        self.assertAlmostEqual(camera['aspect'], 5 / 3)
        pixels = 20 * 120 / math.tan(camera['perspectiveFovRadians'] / 2) / (camera['position'][2] - 4.95)
        self.assertAlmostEqual(pixels, 224.84491000531975)


if __name__ == '__main__':
    unittest.main()
