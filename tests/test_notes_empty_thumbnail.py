"""Verify the original empty initializer, delivery bytes, and additive provenance."""
import copy
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts/firmware'))
from publish_notes_empty_thumbnail import (CODE_HASH, ORIGINAL_PACK, PACK, PIXELS, TEXTURE,
                                          initialized_buffers, publish)
from texture import decode_texture, png

PUBLIC = ROOT/'public/os/firmware/10.7.0-32E'
SOURCE = os.environ.get('NOTES_SOURCE_CODE')


class EmptyNotesThumbnailTests(unittest.TestCase):
    def test_unverified_code_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'ExeFS/code.bin'):
            initialized_buffers(b'not the pinned initializer')

    @unittest.skipUnless(SOURCE, 'NOTES_SOURCE_CODE must identify the private pinned executable')
    def test_original_literal_fills_both_complete_padded_allocations(self):
        full, thumb, size = initialized_buffers(Path(SOURCE).read_bytes())
        self.assertEqual(size, (128, 64))
        self.assertEqual(full, b'\x3c\xe7'*(512*256))
        self.assertEqual(thumb, b'\x3c\xe7'*(128*64))
        rgba = decode_texture(thumb, *size, 3)
        self.assertEqual(rgba, bytes([231, 231, 231, 255])*(128*64))
        self.assertEqual(png(*size, rgba), (PUBLIC/PIXELS).read_bytes())

    def test_original_layout_clips_and_texture_mappings_are_unchanged(self):
        original = json.loads((PUBLIC/ORIGINAL_PACK).read_bytes())
        derived = json.loads((PUBLIC/PACK).read_bytes())
        for key in ('layouts', 'animations', 'messages', 'unsupported'):
            self.assertEqual(derived[key], original[key])
        self.assertEqual({k: v for k, v in derived['textures'].items() if k != TEXTURE}, original['textures'])
        self.assertEqual(derived['textures'][TEXTURE]['picaFormat'], 3)
        self.assertEqual(derived['textures'][TEXTURE]['width'], 128)
        self.assertEqual(derived['textures'][TEXTURE]['height'], 64)

    def test_publication_records_trace_the_pinned_code_not_saved_or_capture_pixels(self):
        manifest = json.loads((PUBLIC/'manifest.json').read_bytes())
        for url in (PACK, PIXELS):
            raw = (PUBLIC/url).read_bytes()
            record = manifest['resources'][url]
            self.assertEqual(record['sha256'], hashlib.sha256(raw).hexdigest())
            self.assertEqual(record['size'], len(raw))
            source = next(s for s in record['sources'] if s['path'] == 'ExeFS/code.bin')
            self.assertEqual(source, {'path': 'ExeFS/code.bin', 'sha256': CODE_HASH,
                                     'titleId': '0004003000009c02', 'titleVersion': 4096,
                                     'contentIndex': 0, 'contentId': '00000007'})
            binding = record['conversion']['runtimeBinding']
            self.assertEqual(binding['literalCodeOffset'], '0x9724')
            self.assertEqual(binding['fillHalfword'], '0xe73c')
            self.assertFalse(binding['savedNoteContent'])
            self.assertEqual(binding['scriptSha256'], hashlib.sha256((ROOT/'scripts/firmware/publish_notes_empty_thumbnail.py').read_bytes()).hexdigest())

    def test_bad_code_cannot_modify_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original = (PUBLIC/'manifest.json').read_bytes()
            (root/'manifest.json').write_bytes(original)
            code = root/'code.bin'
            code.write_bytes(b'unrelated executable')
            with self.assertRaises(ValueError):
                publish(code, root, root/'artifacts', root/'ctrtool')
            self.assertEqual((root/'manifest.json').read_bytes(), original)
            self.assertFalse((root/'artifacts').exists())

    @unittest.skipUnless(SOURCE, 'NOTES_SOURCE_CODE must identify the private pinned executable')
    def test_additive_publication_is_idempotent_and_preserves_all_existing_records(self):
        manifest = json.loads((PUBLIC/'manifest.json').read_bytes())
        conversion = copy.deepcopy(manifest['resources'][PACK]['conversion'])
        del conversion['runtimeBinding']
        for url in (PACK, PIXELS):
            del manifest['resources'][url]
        manifest['titles']['0004003000009c02']['packs'].remove(PACK)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original_pack = root/ORIGINAL_PACK
            original_pack.parent.mkdir(parents=True)
            original_pack.write_bytes((PUBLIC/ORIGINAL_PACK).read_bytes())
            (root/'manifest.json').write_text(json.dumps(manifest))
            with patch('publish_notes_empty_thumbnail.converter_provenance', return_value=conversion):
                first = publish(Path(SOURCE), root, root/'artifacts', root/'ctrtool')
                result = (root/'manifest.json').read_bytes()
                self.assertEqual(publish(Path(SOURCE), root, root/'artifacts', root/'ctrtool'), first)
                self.assertEqual((root/'manifest.json').read_bytes(), result)
            after = json.loads(result)
            self.assertEqual({k: v for k, v in after['resources'].items() if k not in (PACK, PIXELS)}, manifest['resources'])
            self.assertEqual({k: v for k, v in after['titles'].items() if k != '0004003000009c02'},
                             {k: v for k, v in manifest['titles'].items() if k != '0004003000009c02'})


if __name__ == '__main__':
    unittest.main()
