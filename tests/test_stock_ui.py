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
from firmware.stock_ui import publish, publish_additive, select_pack, merge_disjoint_pack


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
    def test_merge_selected_message_bank_preserves_existing_bank(self):
        source, _ = fixture()
        source.update(sourceSha256='same-source', contentIndex=0, contentId='0000001a')
        old, _ = select_pack(source, {'messages': {'text': ['first']}})
        source['messages']['guide'] = {'labels': {'welcome': 0}, 'messages': [{'text': 'Original guide'}]}
        source['resourceSources']['messages']['guide'] = {'titleId': SETTINGS, 'path': 'guide', 'sha256': 'source'}
        incoming, _ = select_pack(source, {'messages': {'guide': ['welcome']}})
        merged = merge_disjoint_pack(old, incoming)
        self.assertEqual(merged['messages']['text'], old['messages']['text'])
        self.assertEqual(merged['messages']['guide']['messages'][0]['text'], 'Original guide')
        self.assertEqual(merged['resourceSources']['messages']['guide'], source['resourceSources']['messages']['guide'])
        incompatible = copy.deepcopy(incoming); incompatible['sourceSha256'] = 'different'
        with self.assertRaisesRegex(ValueError, 'source identity'): merge_disjoint_pack(old, incompatible)
        incompatible = copy.deepcopy(incoming); incompatible['messages']['text'] = {'changed': True}
        incompatible['resourceSources']['messages']['text'] = old['resourceSources']['messages']['text']
        with self.assertRaisesRegex(ValueError, 'Conflicting existing messages'): merge_disjoint_pack(old, incompatible)

    def test_published_camera_first_run_selection_has_source_closure(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        title_id = '0004001000022400'; title = manifest['titles'][title_id]
        self.assertEqual(title['version'], 4097)
        prefix = 'packs/camera/contents/0000-0000001a/'
        for leaf, layouts in [('lyt-C-Dlg.json', ['C_DlgGuid1BtnW', 'C_DlgGuid2Btn', 'C_DlgGuid_U']),
                              ('lyt-P_Guid_U-arc-LZ.json', ['P_Guid01_U', 'P_Guid05_U']),
                              ('lyt-Parakeet-arc-LZ.json', ['ParakeetA_D'])]:
            url = prefix+leaf
            self.assertIn(url, title['packs'])
            pack = json.loads((public/url).read_text())
            self.assertEqual(pack['titleId'], title_id)
            self.assertEqual(pack['contentIndex'], 0)
            self.assertEqual(pack['contentId'], '0000001a')
            self.assertEqual(pack['unsupported'], [])
            for name in layouts: self.assertIn(name, pack['layouts'])
            record = manifest['resources'][url]
            self.assertEqual(record['sha256'], digest((public/url).read_bytes()))
            self.assertEqual(record['sources'][0]['titleId'], title_id)
        message_url = prefix+'msg-EU_English.json'
        messages = json.loads((public/message_url).read_text())['messages']
        self.assertIn('P', messages) # Existing browse bank survives the merge.
        self.assertIn('P_tips', messages)
        for label in ('T_003', 'D_003_0', 'D_003_4', 'Guide_D_N_Btn0'):
            self.assertIn(label, messages['P_tips']['labels'])
        self.assertEqual(messages['P_tips']['messages'][messages['P_tips']['labels']['D_003_0']]['text'],
                         'Welcome to\nNintendo 3DS Camera!')

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
            put(output, delivery, 'font.json', b'{}', HOME)
            delivery['resources']['font.json']['kind'] = 'font'
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
            pack['layouts']['Main']['fonts'] = ['font.bcfnt']
            put(source, incoming, url, encode(pack), SETTINGS)
            (source/'manifest.json').write_bytes(encode(incoming))
            with self.assertRaisesRegex(ValueError, 'Unbound stock font'): publish(source, output, plan)
            plan['titles'][SETTINGS]['fontBindings'] = {'font.bcfnt': 'shared'}
            publish(source, output, plan)
            bound = json.loads((output/'manifest.json').read_bytes())['titles'][SETTINGS]
            self.assertEqual(bound['fonts'], {'font.bcfnt': 'font.json'})
            self.assertEqual(bound['uiSelection']['presentationFontBindings'], {'font.bcfnt': 'shared'})
            snapshot = {p.relative_to(output): p.read_bytes() for p in output.rglob('*') if p.is_file()}
            (source/'textures/selected.png').write_bytes(b'corrupt')
            with self.assertRaisesRegex(ValueError, 'hash differs'): publish(source, output, plan)
            self.assertEqual(snapshot, {p.relative_to(output): p.read_bytes() for p in output.rglob('*') if p.is_file()})

    def test_lz_suffixed_title_font_is_published_under_the_layout_name(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)/'source'; output = Path(tmp)/'output'
            source.mkdir(); output.mkdir(); pack, selection = fixture(); url = 'packs/settings/main.json'
            pack['layouts']['Main']['fonts'] = ['HudNOTES.bcfnt']
            common = {'firmware': '10.7.0-32E', 'locale': 'EU_English', 'resources': {}, 'sources': {}, 'titles': {}}
            incoming = copy.deepcopy(common); delivery = copy.deepcopy(common)
            def put(root, manifest, path, data, title):
                target = root/path; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
                manifest['resources'][path] = {'sha256': digest(data), 'size': len(data), 'sources': [{'titleId': title}]}
            put(source, incoming, url, encode(pack), SETTINGS)
            put(source, incoming, 'textures/shared.png', b'shared', SETTINGS)
            put(source, incoming, 'textures/selected.png', b'selected', SETTINGS)
            put(source, incoming, 'font-hud.json', encode({'sheets': []}), SETTINGS)
            put(output, delivery, 'textures/shared.png', b'shared', HOME)
            put(output, delivery, 'font.json', b'{}', HOME)
            delivery['resources']['font.json']['kind'] = 'font'
            incoming['titles'][SETTINGS] = {'packs': [url], 'fonts': {'HudNOTES.bcfnt.LZ': 'font-hud.json'}}
            incoming['sources'][SETTINGS] = {'titleId': SETTINGS}
            delivery['titles'][HOME] = {'packs': ['home.json']}
            delivery['sources'][HOME] = {'titleId': HOME}
            delivery.update(home={'root': 'home.json'}, fonts={'shared': 'font.json'}, converter={'historical': True})
            (source/'manifest.json').write_bytes(encode(incoming)); (output/'manifest.json').write_bytes(encode(delivery))
            plan = {'titles': {SETTINGS: {'packs': {url: selection}}}}
            publish(source, output, plan)
            published = json.loads((output/'manifest.json').read_bytes())['titles'][SETTINGS]
            self.assertEqual(published['fonts'], {'HudNOTES.bcfnt': 'font-hud.json'})

    def test_publish_additive_keeps_divergent_pack_bytes_and_adds_new(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)/'source'; output = Path(tmp)/'output'
            source.mkdir(); output.mkdir(); pack, selection = fixture()
            extra = copy.deepcopy(pack)
            extra['layouts']['Extra'] = {'fonts': [], 'textures': [], 'unsupported': [], 'roots': []}
            extra['resourceSources']['layouts']['Extra'] = {'titleId': SETTINGS, 'path': 'Extra', 'sha256': 'source'}
            existing_url, added_url = 'packs/settings/main.json', 'packs/settings/extra.json'
            common = {'firmware': '10.7.0-32E', 'locale': 'EU_English', 'resources': {}, 'sources': {}, 'titles': {}}
            incoming = copy.deepcopy(common); delivery = copy.deepcopy(common)
            def put(root, manifest, path, data, title):
                target = root/path; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
                manifest['resources'][path] = {'sha256': digest(data), 'size': len(data), 'sources': [{'titleId': title}]}
            put(source, incoming, existing_url, encode(pack), SETTINGS)
            put(source, incoming, added_url, encode(extra), SETTINGS)
            put(source, incoming, 'textures/shared.png', b'shared', SETTINGS)
            put(source, incoming, 'textures/selected.png', b'selected', SETTINGS)
            put(output, delivery, existing_url, b'already-published-divergent', SETTINGS)
            put(output, delivery, 'textures/shared.png', b'shared', HOME)
            put(output, delivery, 'font.json', b'{}', HOME)
            delivery['resources']['font.json']['kind'] = 'font'
            incoming['titles'][SETTINGS] = {'packs': [existing_url, added_url], 'fonts': {}}
            incoming['sources'][SETTINGS] = {'titleId': SETTINGS}
            delivery['titles'][SETTINGS] = {'packs': [existing_url], 'fonts': {}}
            delivery['titles'][HOME] = {'packs': ['home.json']}
            delivery['sources'][HOME] = {'titleId': HOME}
            delivery.update(home={'root': 'home.json'}, fonts={'shared': 'font.json'}, converter={'historical': True})
            (source/'manifest.json').write_bytes(encode(incoming)); (output/'manifest.json').write_bytes(encode(delivery))
            plan = {'titles': {SETTINGS: {'packs': {existing_url: selection, added_url: {'layouts': ['Extra'], 'animations': []}}}}}
            result = publish_additive(source, output, plan)
            after = json.loads((output/'manifest.json').read_bytes())
            self.assertEqual(result['added'], [added_url])
            self.assertEqual(result['preservedDivergent'], [existing_url])
            self.assertEqual((output/existing_url).read_bytes(), b'already-published-divergent')
            self.assertEqual(after['resources'][existing_url]['sha256'], digest(b'already-published-divergent'))
            self.assertIn(added_url, after['titles'][SETTINGS]['packs'])
            self.assertTrue(after['titles'][SETTINGS]['uiSelection']['additive'])
            self.assertEqual(after['resources']['textures/shared.png'], delivery['resources']['textures/shared.png'])


if __name__ == '__main__': unittest.main()
