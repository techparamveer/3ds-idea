"""Narrow stock delivery preserves HOME and rejects incomplete dependencies."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.build import HOME, SETTINGS, digest, encode
from firmware.stock_ui import publish, select_pack


def fixture():
    pack = {'schema': 1, 'titleId': SETTINGS,
            'layouts': {'Main': {'fonts': ['cbf_std.bcfnt'], 'textures': ['shared'], 'unsupported': []},
                        'Unused': {'fonts': [], 'textures': ['unused'], 'unsupported': ['unknown']}},
            'animations': {'Main_Select': {'textures': ['selected'], 'unsupported': [], 'shares': []}},
            'textures': {'shared': {'url': 'textures/shared.png'}, 'selected': {'url': 'textures/selected.png'},
                         'unused': {'url': 'textures/unused.png'}},
            'messages': {'text': {'labels': {'first': 0, 'second': 1, 'alias': 1},
                                   'messages': [{'text': 'Unused'}, {'text': 'Selected', 'styleIndex': 2}],
                                   'styleTable': 'styles'}},
            'styles': {'styles': {'styles': [0, 1, 2]}}, 'unsupported': [{'path': 'other.bin'}]}
    pack['resourceSources'] = {bucket: {name: {'titleId': SETTINGS, 'path': name, 'sha256': 'source'}
                                      for name in pack[bucket]}
                               for bucket in ('layouts', 'animations', 'textures', 'messages', 'styles')}
    selection = {'layouts': ['Main'], 'animations': ['Main_Select'], 'messages': {'text': ['second', 'alias']}}
    return pack, selection


class StockUiTests(unittest.TestCase):
    def test_dependency_closure_and_message_source_indexes(self):
        pack, selection = fixture(); selected, fonts = select_pack(pack, selection)
        self.assertEqual(set(selected['textures']), {'shared', 'selected'})
        self.assertEqual(fonts, {'cbf_std.bcfnt'})
        self.assertEqual(selected['messages']['text']['labels'], {'alias': 0, 'second': 0})
        self.assertEqual(selected['messages']['text']['messages'][0]['styleIndex'], 2)
        self.assertEqual(selected['styles'], pack['styles'])
        self.assertEqual(selected['uiSelection']['sourceMessageIndices'], {'text': [1]})
        self.assertEqual(pack['messages']['text']['labels']['second'], 1)

    def test_missing_dependency_and_unsupported_selected_resource_fail(self):
        pack, selection = fixture()
        del pack['textures']['selected']
        with self.assertRaisesRegex(ValueError, 'Missing selected texture'): select_pack(pack, selection)
        pack, selection = fixture(); pack['animations']['Main_Select']['shares'] = [{'unsupported': ['x']}]
        with self.assertRaisesRegex(ValueError, 'unsupported fields'): select_pack(pack, selection)

    def test_publish_preserves_home_bytes_records_and_metadata_and_is_repeatable(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)/'source'; output = Path(tmp)/'output'
            source.mkdir(); output.mkdir(); pack, selection = fixture(); url = 'packs/settings/main.json'
            common = {'firmware': '10.7.0-32E', 'locale': 'EU_English', 'resources': {}, 'sources': {}, 'titles': {}}
            incoming = copy.deepcopy(common); delivery = copy.deepcopy(common)
            def put(root, manifest, path, data, title):
                target = root/path; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
                manifest['resources'][path] = {'sha256': digest(data), 'size': len(data), 'sources': [{'titleId': title}]}
            put(source, incoming, url, encode(pack), SETTINGS)
            put(source, incoming, 'textures/shared.png', b'shared', SETTINGS)
            put(source, incoming, 'textures/selected.png', b'selected', SETTINGS)
            put(output, delivery, 'textures/shared.png', b'shared', HOME)
            incoming['titles'][SETTINGS] = {'packs': [url], 'fonts': {}}
            incoming['sources'][SETTINGS] = {'titleId': SETTINGS}
            delivery['titles'][HOME] = {'packs': ['home.json']}
            delivery['sources'][HOME] = {'titleId': HOME}
            delivery.update(home={'root': 'home.json'}, fonts={'shared': 'font.json'}, converter={'historical': True})
            (source/'manifest.json').write_bytes(encode(incoming)); (output/'manifest.json').write_bytes(encode(delivery))
            plan = {'titles': {SETTINGS: {'packs': {url: selection}}}}
            result = publish(source, output, plan); after = json.loads((output/'manifest.json').read_bytes())
            self.assertTrue(result['homeAndSharedPreserved'])
            for key in ('home', 'fonts', 'converter'): self.assertEqual(after[key], delivery[key])
            self.assertEqual(after['resources']['textures/shared.png'], delivery['resources']['textures/shared.png'])
            self.assertEqual((output/'textures/shared.png').read_bytes(), b'shared')
            self.assertEqual(publish(source, output, plan), result)
            snapshot = {p.relative_to(output): p.read_bytes() for p in output.rglob('*') if p.is_file()}
            (source/'textures/selected.png').write_bytes(b'corrupt')
            with self.assertRaisesRegex(ValueError, 'hash differs'): publish(source, output, plan)
            self.assertEqual(snapshot, {p.relative_to(output): p.read_bytes() for p in output.rglob('*') if p.is_file()})


if __name__ == '__main__': unittest.main()
