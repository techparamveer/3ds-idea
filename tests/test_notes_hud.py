"""Pinned Notes HUD publication and provenance regressions."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts/firmware'))
from publish_notes_hud import CODE_HASH, SOURCE_HASHES, TITLE, checked, publish, validate_manifest

PUBLIC = ROOT/'public/os/firmware/10.7.0-32E'


class NotesHudTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((PUBLIC/'manifest.json').read_bytes())

    def test_exact_title_content_and_locale_are_required(self):
        validate_manifest(self.manifest)
        mutations = [
            lambda m: m.update(locale='EU_French'),
            lambda m: m['titles'][TITLE].update(version=4097),
            lambda m: m['titles'][TITLE].update(sourceSha256='other CIA'),
            lambda m: m['sources'][TITLE]['contents'][0].update(index=1),
            lambda m: m['sources'][TITLE]['contents'][0].update(id='00000008'),
            lambda m: m['sources'][TITLE]['contents'][0].update(sha256='other content'),
        ]
        for mutation in mutations:
            value = copy.deepcopy(self.manifest)
            mutation(value)
            with self.assertRaises(ValueError):
                validate_manifest(value)

    def test_wrong_code_hash_cannot_publish_or_create_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            output = root/'output'
            output.mkdir()
            original = json.dumps(self.manifest).encode()
            (output/'manifest.json').write_bytes(original)
            code = root/'code.bin'
            code.write_bytes(b'not the pinned Notes executable')
            with self.assertRaisesRegex(ValueError, 'ExeFS/code.bin'):
                publish(root/'romfs', code, output, root/'artifacts', root/'ctrtool')
            self.assertEqual((output/'manifest.json').read_bytes(), original)
            self.assertFalse((root/'artifacts').exists())
            self.assertEqual(list(output.iterdir()), [output/'manifest.json'])

    def test_each_selected_input_hash_is_checked(self):
        for source, expected in {**SOURCE_HASHES, 'ExeFS/code.bin': CODE_HASH}.items():
            with self.assertRaisesRegex(ValueError, source.replace('.', r'\.')):
                checked(b'unrelated bytes', expected, source)

    def test_selected_delivery_bytes_and_source_members_are_manifest_backed(self):
        urls = [
            'packs/game-notes/contents/0000-00000007/memo-HudMenuAplt_00-arc-l.json',
            'packs/game-notes/contents/0000-00000007/hud-messages.json',
            'fonts/game-notes/contents/0000-00000007/Hud/font.json',
            'fonts/game-notes/contents/0000-00000007/Hud/sheet-0.png',
        ]
        for url in urls:
            raw = (PUBLIC/url).read_bytes()
            record = self.manifest['resources'][url]
            self.assertEqual(len(raw), record['size'])
            self.assertEqual(hashlib.sha256(raw).hexdigest(), record['sha256'])
            source = record['sources'][0]
            self.assertEqual(source['titleId'], TITLE)
            self.assertEqual(source['contentIndex'], 0)
            self.assertEqual(source['contentId'], '00000007')
            self.assertEqual(source['titleVersion'], 4096)
            self.assertEqual(record['conversion']['name'], 'ctr-native-web')
            self.assertEqual(record['conversion']['version'], '1.5.4')
            self.assertEqual(record['conversion']['extractor']['version'], '1.2.0')
        pack = json.loads((PUBLIC/urls[0]).read_bytes())
        self.assertEqual(pack['unsupported'], [])
        self.assertEqual(set(pack['animations']), {
            'HudMenuAplt_00_SceneIn', 'HudMenuAplt_00_Bat',
            'HudMenuAplt_00_NetMode', 'HudMenuAplt_00_NetAtn',
        })
        for texture, resource in pack['textures'].items():
            self.assertIn(resource['url'], self.manifest['resources'])
            source = pack['resourceSources']['textures'][texture]
            self.assertEqual(source['titleId'], TITLE)
            self.assertTrue(source['path'].startswith('memo/HudMenuAplt_00.arc.l/timg/'))
        self.assertEqual(self.manifest['titles'][TITLE]['fonts']['Hud.bcfnt'], urls[2])


if __name__ == '__main__':
    unittest.main()
