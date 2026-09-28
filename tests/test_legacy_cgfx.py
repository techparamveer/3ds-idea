"""Opt-in real-resource regression for the revision-5 root adapter.

Set CGFX_TEST_SOURCE (3D directory), CGFX_TEST_DOTNET, CGFX_TEST_EXPORTER and
CGFX_TEST_ARTIFACTS (scratch directory). No firmware execution is involved.
"""
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from unpack_home_resources import decompress

configured = all(os.environ.get(k) for k in ('CGFX_TEST_SOURCE', 'CGFX_TEST_DOTNET', 'CGFX_TEST_EXPORTER', 'CGFX_TEST_ARTIFACTS'))

@unittest.skipUnless(configured, 'requires private CGFX fixtures and built exporter')
class LegacyRootTests(unittest.TestCase):
    def source(self, name):
        raw = (Path(os.environ['CGFX_TEST_SOURCE']) / f'{name}_LZ.bin').read_bytes()
        return decompress(raw) if raw[0] in (16, 17) else raw

    def export(self, raw):
        with tempfile.TemporaryDirectory(dir=os.environ['CGFX_TEST_ARTIFACTS']) as scratch:
            path = Path(scratch) / 'input.bcres'
            path.write_bytes(raw)
            result = subprocess.run([os.environ['CGFX_TEST_DOTNET'], os.environ['CGFX_TEST_EXPORTER'], str(path), scratch], capture_output=True, text=True)
            output = Path(scratch) / 'model.json'
            return result, json.loads(output.read_text()) if output.exists() else None

    def test_all_four_native_roots_and_billboard_metadata(self):
        expected = {'BannerFolder': (1, 9, 0), 'BannerBG': (1, 4, 0), 'BannerCamera': (0, 0, 1), 'Textures': (0, 4, 0)}
        for name, counts in expected.items():
            with self.subTest(name=name):
                result, data = self.export(self.source(name))
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual((len(data['models']), len(data['textures']), len(data['cameras'])), counts)
                if name == 'BannerFolder':
                    modes = {b['Name']: b['BillboardMode'] for b in data['models'][0]['skeleton']}
                    self.assertEqual(modes['Text'], 'ScreenViewpoint')
                    native_modes = {b['Name']: b['NativeBillboardMode'] for b in data['models'][0]['skeleton']}
                    self.assertEqual(native_modes['Text'], 5)
                    self.assertEqual(native_modes['Root'], 0)
                    self.assertEqual(modes['Root'], 'Off')

    def test_rejects_corrupt_declared_file_length(self):
        raw = bytearray(self.source('BannerCamera'))
        struct.pack_into('<I', raw, 12, len(raw) + 4)
        result, data = self.export(raw)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Invalid legacy CGFX header', result.stderr)
        self.assertIsNone(data)

    def test_rejects_dictionary_count_mismatch_before_deserialization(self):
        raw = bytearray(self.source('BannerFolder'))
        struct.pack_into('<I', raw, 0x1c, 0xffffffff)
        result, data = self.export(raw)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Invalid legacy CGFX dictionary bounds', result.stderr)
        self.assertIsNone(data)

if __name__ == '__main__':
    unittest.main()
