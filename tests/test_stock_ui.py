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
        incompatible = copy.deepcopy(incoming); incompatible['messages']['text'] = copy.deepcopy(old['messages']['text'])
        incompatible['messages']['text']['messages'][0]['text'] = 'Changed'
        incompatible['uiSelection']['sourceMessageIndices']['text'] = old['uiSelection']['sourceMessageIndices']['text']
        incompatible['resourceSources']['messages']['text'] = old['resourceSources']['messages']['text']
        with self.assertRaisesRegex(ValueError, 'Conflicting existing message content'): merge_disjoint_pack(old, incompatible)

    def test_merge_existing_message_bank_unions_source_indexes_and_labels(self):
        source, _ = fixture()
        source.update(sourceSha256='same-source', contentIndex=0, contentId='0000001a')
        old, _ = select_pack(source, {'messages': {'text': ['first']}})
        incoming, _ = select_pack(source, {'messages': {'text': ['second', 'alias']}})
        merged = merge_disjoint_pack(old, incoming)
        bank = merged['messages']['text']
        self.assertEqual(merged['uiSelection']['sourceMessageIndices']['text'], [0, 1])
        self.assertEqual([message['text'] for message in bank['messages']], ['Unused', 'Selected'])
        self.assertEqual(bank['labels'], {'alias': 1, 'first': 0, 'second': 1})
        self.assertEqual(merge_disjoint_pack(merged, incoming), merged)

    def test_published_camera_first_run_selection_has_source_closure(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        title_id = '0004001000022400'; title = manifest['titles'][title_id]
        self.assertEqual(title['version'], 4097)
        prefix = 'packs/camera/contents/0000-0000001a/'
        for leaf, layouts in [('lyt-C-Dlg.json', ['C_DlgChA', 'C_DlgGuid1BtnW', 'C_DlgGuid2Btn', 'C_DlgGuid_U']),
                              ('lyt-P_Guid_U-arc-LZ.json', ['P_Guid01_U', 'P_Guid05_U']),
                              ('lyt-P_Finder_U-arc-LZ.json', ['P_Finder_U', 'P_FinderVS_U']),
                              ('lyt-C-Icon.json', ['C_IconSD']),
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
        self.assertIn('Finder_Pho_00_00', messages['P']['labels'])
        for label in ('T_003', 'D_003_0', 'D_003_4', 'Guide_D_N_Btn0'):
            self.assertIn(label, messages['P_tips']['labels'])
        self.assertEqual(messages['P_tips']['messages'][messages['P_tips']['labels']['D_003_0']]['text'],
                         'Welcome to\nNintendo 3DS Camera!')

    def test_published_camera_browse_chrome_and_entry_preserve_source_identity(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        title = manifest['titles']['0004001000022400']
        prefix = 'packs/camera/contents/0000-0000001a/'
        browse_url = prefix+'lyt-P_Brws_D-arc-LZ.json'
        browse = json.loads((public/browse_url).read_text())
        self.assertIn('P_BrwsBase_D', browse['layouts'])
        self.assertIn('P_BrwsMenu_D', browse['layouts'])
        self.assertIn('P_BrwsMenu_D_Brws', browse['animations'])
        self.assertEqual(browse['resourceSources']['layouts']['P_BrwsMenu_D']['contentId'], '0000001a')
        shoot_url = prefix+'lyt-P_Shoot_D-arc-LZ.json'
        self.assertIn(shoot_url, title['packs'])
        shoot = json.loads((public/shoot_url).read_text())
        self.assertIn('P_Shoot_D', shoot['layouts'])
        self.assertIn('P_Shoot_D_Default', shoot['animations'])
        self.assertEqual(shoot['unsupported'], [])
        for url in (browse_url, shoot_url):
            record = manifest['resources'][url]
            self.assertEqual(record['sha256'], digest((public/url).read_bytes()))
            self.assertEqual(record['sources'][0]['titleId'], '0004001000022400')
            self.assertEqual(record['sources'][0]['contentIndex'], 0)
        bank = json.loads((public/(prefix+'msg-EU_English.json')).read_text())['messages']['P']
        self.assertEqual(bank['messages'][bank['labels']['Brws_02']]['text'], 'Slideshow')
        self.assertEqual(bank['messages'][bank['labels']['Brws_03']]['text'], 'Shoot')
        self.assertEqual(bank['messages'][bank['labels']['Shoot_05']]['text'], 'View Photos/Videos')
        self.assertEqual(bank['messages'][bank['labels']['setting']]['text'], 'Settings')

    def test_manual_contents_chrome_delivery_preserves_source_identity(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        title = manifest['titles']['0004003000009b02']
        plan = json.loads((ROOT/'scripts/firmware/stock-ui-manual-contents.json').read_text())
        requested = plan['titles']['0004003000009b02']['packs']
        for url, selection in requested.items():
            self.assertIn(url, title['packs'])
            pack = json.loads((public/url).read_text())
            self.assertEqual(manifest['resources'][url]['sha256'], digest((public/url).read_bytes()))
            self.assertEqual(pack['titleId'], '0004003000009b02')
            for bucket in ('layouts', 'animations'):
                for name in selection.get(bucket, []):
                    self.assertIn(name, pack[bucket])
                    self.assertEqual(pack[bucket][name]['unsupported'], [])
                    source = pack['resourceSources'][bucket][name]
                    self.assertEqual(source['titleId'], '0004003000009b02')
                    self.assertTrue(source['path'].startswith('layout/'+name.split('_')[0]+'.arc/'))
            for texture in pack['textures'].values():
                self.assertEqual(manifest['resources'][texture['url']]['sha256'],
                                 digest((public/texture['url']).read_bytes()))
        index = json.loads((public/'packs/manual/layout-IndexNull.json').read_text())['layouts']['IndexNull']
        def names(nodes):
            for pane in nodes:
                yield pane['name']
                yield from names(pane.get('children', []))
        self.assertTrue({'IndexBase', 'HeadLineAll', 'CursorNull', 'SoftTitleHead', 'BtnShdw',
                         'ScrollIndicator'} <= set(names(index['roots'])))
        all_null = json.loads((public/'packs/manual/layout-AllNull.json').read_text())
        layout = all_null['layouts']['AllNull']
        self.assertEqual(layout['canvas'], {'width': 400.0, 'height': 480.0, 'origin': 1})
        panes = {pane['name']: pane for pane in layout['roots'][0]['children']}
        self.assertEqual(panes['P_Bg_U_00']['size'], [410.0, 240.0])
        self.assertEqual(panes['P_Bg_U_00']['translation'], [-0.0, 120.0, 0.0])
        self.assertEqual(layout['textures'], ['BgLgt.bclim', 'BgLine.bclim'])
        self.assertEqual(all_null['resourceSources']['layouts']['AllNull']['sha256'],
                         '1f59185d1a51610185a1f59572e415b1c8bc567cdd070a135bb9c953656940e6')
        self.assertEqual(all_null['resourceSources']['textures']['BgLgt.bclim']['sha256'],
                         'c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b')
        self.assertEqual(all_null['resourceSources']['textures']['BgLine.bclim']['sha256'],
                         'f9d858867fbd4c5db9d3fccb83819b9ed41052e96aeac9bcde0b63ed262134cc')
        bank = json.loads((public/'packs/manual/messages-and-loose.json').read_text())['messages']['ebird']
        text = {label: bank['messages'][index]['text'] for label, index in bank['labels'].items()}
        self.assertEqual(text['BtnCloseLng'], '\ue071 Close')
        self.assertEqual(text['BtnLngSel'], 'Language')
        self.assertEqual(text['BtnLngSel_Picto'], '\ue003')
        self.assertEqual(text['ContentsText'], 'Contents')
        self.assertEqual(text['BootMsg_Ebird'], 'Instruction Manual')

    def test_camera_shoot_child_delivery_closes_native_layout_metadata(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        url = 'packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json'
        pack = json.loads((public/url).read_text())
        def panes(nodes):
            for pane in nodes:
                yield pane
                yield from panes(pane.get('children', []))
        for parent, anchor, child in [('P_Shoot_D', '-L-BtnIOcam', 'P_CamBtn'),
                                      ('P_CamBtn', '-L-CamIcon', 'P_CamIcon')]:
            pane = next(p for p in panes(pack['layouts'][parent]['roots']) if p['name'] == anchor)
            self.assertIn({'name': 'LYT', 'type': 0, 'value': 'P_Shoot_D/'+child}, pane['metadata'])
            self.assertIn(child, pack['layouts'])
        for name, sha in [('P_CamBtn', 'af471925343dab648422e7793264b99f1ebd7267cc48bd01cfc644c72acb1e2f'),
                          ('P_CamIcon', '2e70e74d1d877be77179b5bbed79cf73131101c3fbbc58b105b90b284a524da2')]:
            self.assertEqual(pack['resourceSources']['layouts'][name], {
                'contentId': '0000001a', 'contentIndex': 0, 'titleId': '0004001000022400',
                'path': 'lyt/P_Shoot_D.arc.LZ/blyt/'+name+'.bclyt', 'sha256': sha})
        for name in ['P_CamBtn_Default', 'P_CamBtn_Disable', 'P_CamBtn_Push', 'P_CamIcon_IconPtrn']:
            for texture in pack['animations'][name]['textures']:
                texture_url = pack['textures'][texture]['url']
                self.assertEqual(manifest['resources'][texture_url]['sha256'], digest((public/texture_url).read_bytes()))
        self.assertEqual(manifest['resources'][url]['sha256'], digest((public/url).read_bytes()))

    def test_published_sound_welcome_guide_has_native_message_and_image_sources(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        title_id = '0004001000022500'; title = manifest['titles'][title_id]
        self.assertEqual(title['version'], 3088)
        prefix = 'packs/sound/contents/0000-0000000b/'
        guide_url = prefix+'lyt-S_Guid_U-arc-LZ.json'
        self.assertIn(guide_url, title['packs'])
        for leaf, layout, clip in [('lyt-S_Guid_U-arc-LZ.json', 'S_Guid03_U', None),
                                   ('lyt-C-Dlg.json', 'C_DlgGuid1BtnW', 'C_NullDlg_Dlg_In'),
                                   ('lyt-Parakeet-arc-LZ.json', 'ParakeetA_U', 'ParakeetA_U_Wait')]:
            url = prefix+leaf; pack = json.loads((public/url).read_text())
            self.assertIn(layout, pack['layouts'])
            if clip: self.assertIn(clip, pack['animations'])
            self.assertEqual(pack['contentIndex'], 0)
            self.assertEqual(pack['contentId'], '0000000b')
            self.assertEqual(pack['unsupported'], [])
            self.assertEqual(manifest['resources'][url]['sha256'], digest((public/url).read_bytes()))
            self.assertEqual(manifest['resources'][url]['sources'][0]['titleId'], title_id)
            for texture in pack['textures'].values():
                self.assertIn(texture['url'], manifest['resources'])
        bank = json.loads((public/(prefix+'msg-EU_English.json')).read_text())['messages']
        self.assertIn('S', bank) # Initial music screen text remains available.
        self.assertIn('S_tips', bank)
        tips = bank['S_tips']
        for label in ('T_001', 'D_001_0', 'D_001_1', 'D_001_2',
                      'Guide_D_00_00', 'Guide_D_00_01', 'Guide_D_N_Btn0', 'Guide_D_O_Btn0'):
            self.assertIn(label, tips['labels'])
        self.assertEqual(tips['messages'][tips['labels']['D_001_0']]['text'],
                         'Welcome to\nNintendo 3DS Sound!')

    def test_published_sound_welcome_guide_character_panel_provenance(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        url = 'packs/sound/contents/0000-0000000b/lyt-C-Dlg.json'
        pack = json.loads((public/url).read_text())
        name = 'C_DlgChA'
        layout = pack['layouts'][name]
        source = pack['resourceSources']['layouts'][name]
        self.assertEqual(source, {
            'titleId': '0004001000022500', 'contentIndex': 0,
            'contentId': '0000000b', 'path': 'lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt',
            'sha256': '4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7',
        })
        expected = {
            'C_DlgChBase.bclim': 'a9fa4c68',
            'C_DlgChLay6.bclim': '9117e20b',
            'C_DlgChBirdA.bclim': '2292ed3e',
            'C_DlgChBirdAlph.bclim': 'fc46bed0',
        }
        self.assertEqual(set(layout['textures']), set(expected))
        for name, prefix in expected.items():
            texture = pack['textures'][name]
            self.assertIn(texture['url'], manifest['resources'])
            self.assertEqual(digest((public/texture['url']).read_bytes()),
                             manifest['resources'][texture['url']]['sha256'])
            texture_source = pack['resourceSources']['textures'][name]
            self.assertTrue(texture_source['sha256'].startswith(prefix))
            self.assertEqual(texture_source['titleId'], source['titleId'])
            self.assertEqual(texture_source['contentIndex'], source['contentIndex'])
            self.assertEqual(texture_source['contentId'], source['contentId'])
        self.assertEqual(manifest['resources'][url]['sha256'], digest((public/url).read_bytes()))

    def test_published_camera_first_run_guide_character_panel_provenance(self):
        public = ROOT/'public/os/firmware/10.7.0-32E'
        manifest = json.loads((public/'manifest.json').read_text())
        url = 'packs/camera/contents/0000-0000001a/lyt-C-Dlg.json'
        pack = json.loads((public/url).read_text())
        name = 'C_DlgChA'
        layout = pack['layouts'][name]
        source = pack['resourceSources']['layouts'][name]
        self.assertEqual(source, {
            'titleId': '0004001000022400', 'contentIndex': 0,
            'contentId': '0000001a', 'path': 'lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt',
            'sha256': '4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7',
        })
        expected = {
            'C_DlgChBase.bclim': 'a9fa4c68',
            'C_DlgChLay6.bclim': '9117e20b',
            'C_DlgChBirdA.bclim': '2292ed3e',
            'C_DlgChBirdAlph.bclim': 'fc46bed0',
        }
        self.assertEqual(set(layout['textures']), set(expected))
        for name, prefix in expected.items():
            texture = pack['textures'][name]
            self.assertIn(texture['url'], manifest['resources'])
            self.assertEqual(digest((public/texture['url']).read_bytes()),
                             manifest['resources'][texture['url']]['sha256'])
            texture_source = pack['resourceSources']['textures'][name]
            self.assertTrue(texture_source['sha256'].startswith(prefix))
            self.assertEqual(texture_source['titleId'], source['titleId'])
            self.assertEqual(texture_source['contentIndex'], source['contentIndex'])
            self.assertEqual(texture_source['contentId'], source['contentId'])
        self.assertEqual(manifest['resources'][url]['sha256'], digest((public/url).read_bytes()))

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
            extra.update(contentIndex=0, contentId='0000001a')
            extra['layouts']['Extra']['fonts'] = ['HudNOTES.bcfnt']
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
            delivery['titles'][SETTINGS] = {'packs': [existing_url], 'fonts': {'contents/0000-0000001a/HudNOTES.bcfnt': 'font.json'}}
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
