"""Game Notes long description is distinct from the SMDH short HOME label."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.title_metadata import description_metadata, long_description, publisher, publisher_metadata, publish, publish_publishers


def smdh(text='Native long\ndescription', short='HOME label', company='Nintendo'):
    data = bytearray(0x36c0); data[:4] = b'SMDH'
    for offset, value in [(0x208, short), (0x288, text), (0x388, company)]:
        raw = value.encode('utf-16-le'); data[offset:offset+len(raw)] = raw
    return bytes(data)


class TitleMetadataTests(unittest.TestCase):
    def test_english_long_field_retains_newlines_and_ignores_trailing_data(self):
        data = bytearray(smdh('English\nlong')); data[0x308:0x30a] = b'X\0'
        self.assertEqual(long_description(data), 'English\nlong')

    def test_native_destination_limit_and_no_short_name_fallback(self):
        self.assertEqual(long_description(smdh('A'*128)), 'A'*127)
        self.assertEqual(long_description(smdh('')), '')

    def test_invalid_inputs_fail_without_replacement_text(self):
        for data in [b'SMDH', bytes(0x36c0)]:
            with self.assertRaises(ValueError): long_description(data)
        data = bytearray(smdh()); data[0x288:0x28c] = b'\x00\xd8\x00\x00'
        with self.assertRaises(UnicodeDecodeError): long_description(data)

    def test_english_publisher_field_and_provenance(self):
        data = smdh(company='Nintendo')
        source = {'titleId': 'example', 'path': 'ExeFS/icon', 'sha256': hashlib.sha256(data).hexdigest()}
        self.assertEqual(publisher(data), 'Nintendo')
        record = publisher_metadata(data, source, 9220)
        self.assertEqual(record['publisher'], 'Nintendo')
        self.assertEqual(record['publisherSource']['contentIndex'], 0)
        self.assertEqual(record['publisherSource']['titleVersion'], 9220)
        self.assertEqual(record['publisherConversion']['fieldOffset'], 0x388)
        with self.assertRaises(ValueError): publisher_metadata(data, {**source, 'sha256': '0'*64}, 9220)
        with self.assertRaises(ValueError): publisher_metadata(smdh(company=''), source, 9220)

    def test_exact_icon_provenance_is_required(self):
        data = smdh(); source = {'titleId': 'example', 'path': 'ExeFS/icon', 'sha256': hashlib.sha256(data).hexdigest(), 'contentIndex': 0, 'contentId': 'abcd'}
        record = description_metadata(data, source)
        self.assertEqual(record['longDescriptionSource'], source)
        self.assertEqual(record['longDescriptionConversion']['fieldOffset'], 0x288)
        for wrong in [{**source, 'sha256': '0'*64}, {**source, 'path': '/private/icon'}]:
            with self.assertRaises(ValueError): description_metadata(data, wrong)

    def test_full_converter_exports_same_metadata_without_changing_short_name(self):
        from firmware.build import Builder, convert_title
        title = '0004003000009c02'
        metadata = {'version': 0, 'sourceSha256': 'source', 'resourceContentIndex': 0,
                    'contents': [{'index': 0, 'id': '00000000', 'sha256': 'content'}]}
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); scratch = root/'source'
            (scratch/'exefs').mkdir(parents=True); (scratch/'romfs').mkdir()
            (scratch/'exefs/icon.bin').write_bytes(smdh())
            info = convert_title(Builder(root/'output'), title, metadata, scratch, {})
        self.assertEqual(info['name'], 'HOME label')
        self.assertEqual(info['longDescription'], 'Native long\ndescription')
        self.assertEqual(info['longDescriptionSource']['titleId'], title)
        self.assertEqual(info['publisher'], 'Nintendo')
        self.assertEqual(info['publisherSource']['titleVersion'], 0)

    def test_publisher_is_atomic_and_preserves_resources(self):
        data = smdh(); source = {'titleId': 'example', 'path': 'ExeFS/icon', 'sha256': hashlib.sha256(data).hexdigest()}
        manifest = {'titles': {'example': {'icon': 'icons/example.png', 'name': 'HOME label', 'version': 9220}}, 'resources': {'icons/example.png': {'sources': [source], 'sha256': 'unchanged'}}}
        before = copy.deepcopy(manifest)
        with tempfile.TemporaryDirectory() as tmp:
            icon = Path(tmp)/'icon.bin'; icon.write_bytes(data)
            with self.assertRaises(KeyError): publish(manifest, {'example': icon, 'unknown': icon})
            self.assertEqual(manifest, before)
            publish(manifest, {'example': icon})
            publish_publishers(manifest, {'example': icon})
        self.assertEqual(manifest['resources'], before['resources'])
        self.assertEqual(manifest['titles']['example']['name'], 'HOME label')
        self.assertEqual(manifest['titles']['example']['longDescription'], 'Native long\ndescription')
        self.assertEqual(manifest['titles']['example']['publisher'], 'Nintendo')

    def test_published_stock_home_publishers_have_explicit_source_identity(self):
        manifest = json.loads((ROOT/'public/os/firmware/10.7.0-32E/manifest.json').read_text())
        titles = ('0004001000022000', '0004001000022300', '0004001000022400',
                  '0004001000022500', '0004001000022900', '0004001000022b00',
                  '0004003000009c02', '0004003000009d02', '0004003000009f02',
                  '000400300000a002', '000400300000be02')
        for title_id in titles:
            with self.subTest(title_id=title_id):
                title = manifest['titles'][title_id]
                self.assertEqual(title['publisher'], 'Nintendo')
                source = title['publisherSource']
                self.assertEqual(source['titleId'], title_id)
                self.assertEqual(source['titleVersion'], title['version'])
                self.assertEqual(source['contentIndex'], 0)
                self.assertEqual(source['path'], 'ExeFS/icon')
                icon_sources = manifest['resources'][title['icon']]['sources']
                self.assertTrue(any(all(source[k] == v for k, v in icon_source.items())
                                    for icon_source in icon_sources))
                self.assertEqual(title['publisherConversion']['name'], 'smdh-english-publisher')
                self.assertEqual(title['publisherConversion']['fieldOffset'], 0x388)


if __name__ == '__main__': unittest.main()
