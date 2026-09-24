"""Independent texel-coordinate checks for the statically traced tile copies."""
from pathlib import Path
import struct
import hashlib
import tempfile
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.notes_icon import expand_large, notes_icon_png, publish
from firmware.texture import MORTON


def index(x, y, width):
    return ((y//8)*(width//8)+x//8)*64+MORTON[x%8]+2*MORTON[y%8]


def specimen():
    data = bytearray(0x36c0); data[:4] = b'SMDH'
    for y in range(48):
        for x in range(48): struct.pack_into('<H', data, 0x24c0+index(x, y, 48)*2, y*48+x)
    return data


class NotesIconTests(unittest.TestCase):
    def test_every_visible_texel_stays_in_place_and_edges_repeat(self):
        data, known = expand_large(specimen())
        def pixel(x, y): return struct.unpack_from('<H', data, index(x, y, 64)*2)[0]
        for y in range(48):
            for x in range(48): self.assertEqual(pixel(x, y), y*48+x)
            self.assertEqual(pixel(48, y), y*48+47)
        for x in range(48): self.assertEqual(pixel(x, 48), 47*48+x)
        for y in range(48):
            for x in range(49, 64): self.assertEqual(pixel(x, y), 0xffff)
        self.assertEqual(sum(known)//2, 3120)
        self.assertFalse(known[index(48, 48, 64)*2])
        self.assertTrue(all(known[index(x, y, 64)*2] for x in range(48) for y in range(49)))

    def test_narrow_publisher_retains_home_icon_and_rejects_mismatched_source(self):
        title = '0004001000022300'; raw = specimen()
        source = {'titleId': title, 'path': 'ExeFS/icon', 'sha256': hashlib.sha256(raw).hexdigest()}
        record = {'sources': [source], 'sha256': 'original'}
        manifest = {'titles': {title: {'icon': 'icons/health.png'}}, 'resources': {'icons/health.png': record}}
        with tempfile.TemporaryDirectory() as tmp:
            icon = Path(tmp)/'source'; icon.write_bytes(raw)
            publish(manifest, {title: icon}, Path(tmp)/'out')
            url = manifest['titles'][title]['notesIcon']
            data = (Path(tmp)/'out'/url).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), manifest['resources'][url]['sha256'])
            self.assertEqual(manifest['resources'][url]['sources'], [source])
            self.assertEqual(manifest['resources']['icons/health.png'], record)
            self.assertEqual(manifest['titles'][title]['icon'], 'icons/health.png')
            icon.write_bytes(bytes(0x36c0))
            with self.assertRaises(ValueError): publish(manifest, {title: icon}, Path(tmp)/'out')

    def test_full_converter_registers_the_app_notes_icon(self):
        from firmware.build import Builder, convert_title
        title = '0004001000022300'
        metadata = {'version': 0, 'sourceSha256': 'source', 'resourceContentIndex': 0,
                    'contents': [{'index': 0, 'id': '00000000', 'sha256': 'content'}]}
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = root/'source'
            (source/'exefs').mkdir(parents=True); (source/'romfs').mkdir()
            (source/'exefs/icon.bin').write_bytes(specimen())
            builder = Builder(root/'output'); info = convert_title(builder, title, metadata, source, {})
            self.assertEqual((builder.output/info['notesIcon']).read_bytes(), notes_icon_png(specimen()))
            self.assertEqual(info['notesIconConversion']['width'], 64)

    def test_export_is_64_square_and_rejects_wrong_payload(self):
        raw = notes_icon_png(specimen())
        self.assertEqual(struct.unpack_from('>II', raw, 16), (64, 64))
        for raw in [b'SMDH', bytes(0x36c0)]:
            with self.assertRaises(ValueError): expand_large(raw)


if __name__ == '__main__': unittest.main()
