"""Source-locale selection and explicit Settings message/style identity."""
import copy
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.build import (Builder, HOME, SETTINGS, SETTINGS_MESSAGE_ARCHIVE,
                            SETTINGS_STYLE_PAIRS, TITLES, EXCLUDED, digest, encode,
                            convert_title, converter_provenance)
from firmware.audit import audit


def msbt(text):
    def section(tag, payload):
        block = struct.pack('<4sI8x', tag, len(payload))+payload
        return block+bytes((-len(block)) % 16)
    blocks = section(b'TSY1', struct.pack('<i', 0))
    blocks += section(b'TXT2', struct.pack('<II', 1, 8)+(text+'\0').encode('utf-16-le'))
    header = bytearray(32); header[:8] = b'MsgStdBn'
    struct.pack_into('<H', header, 8, 0xfeff); struct.pack_into('<BBH', header, 12, 1, 3, 2)
    struct.pack_into('<I', header, 18, len(header)+len(blocks))
    return bytes(header)+blocks


def resources():
    out = {}
    for locale in ['EU_Dutch', 'EU_English', 'EU_French', 'US_English']:
        for bank, marker in [('hud', 1), ('mset', 2)]:
            folder = 'message_'+bank+'/'+locale+'/'
            out[folder+bank+'.msbt'] = msbt(locale+' '+bank)
            out[folder+'RI.mstl'] = struct.pack('<I6I4fI', 1, marker, 0, 0, 0, 0, 0, .5, .75, 0, 1, 4)
    return out


class LocaleTests(unittest.TestCase):
    def test_system_updater_uses_same_explicit_english_archive_binding(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, pack = Builder(Path(tmp)).pack(resources(), 'message_EU', '0004001000022f00', SETTINGS_MESSAGE_ARCHIVE, 'archive')
            self.assertEqual(pack['messages']['mset']['messages'][0]['text'], 'EU_English mset')
            self.assertEqual(pack['messages']['mset']['styleTable'], SETTINGS_STYLE_PAIRS['message_mset/EU_English/mset.msbt'])
            self.assertEqual(pack['unsupported'], [])

    def test_stock_loose_messages_select_european_english_before_bank_names(self):
        title = '0004003000009c02'
        metadata = {'version': 0, 'sourceSha256': 'source', 'resourceContentIndex': 0,
                    'contents': [{'index': 0, 'id': '00000000', 'sha256': 'content'}]}
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); scratch = root/'source'; builder = Builder(root/'output')
            for locale in ('CN_Simp_Chinese', 'EU_English', 'US_English', 'JP_Japanese', 'TW_English', 'KR_Hangeul'):
                folder = scratch/'romfs/lang'/locale; folder.mkdir(parents=True)
                (folder/'message.msbt').write_bytes(msbt(locale))
            info = convert_title(builder, title, metadata, scratch, {})
            pack = json.loads((builder.output/info['packs'][0]).read_bytes())
            self.assertEqual(pack['messages']['message']['messages'][0]['text'], 'EU_English')
            self.assertEqual(pack['resourceSources']['messages']['message']['path'], 'RomFS/lang/EU_English/message.msbt')
            self.assertEqual(pack['unsupported'], [])

    def test_health_english_loose_message_keeps_its_sibling_style(self):
        title = '0004001000022300'
        message = 'message/EU_English/safe_msbt_LZ.bin'
        style = 'message/EU_English/RI_mstl_LZ.bin'
        raw_style = struct.pack('<I6I4fI', 1, 36, 0, 0, 0, 0, 0, .5, .75, 0, 1, 4)
        with tempfile.TemporaryDirectory() as tmp:
            _, pack = Builder(Path(tmp)).pack({message: msbt('Health'), style: raw_style},
                                              'messages-and-loose', title, 'RomFS', 'content')
            self.assertEqual(pack['messages']['safe_msbt_LZ']['styleTable'], style)
            self.assertEqual(pack['resourceSources']['styles'][style]['sha256'], digest(raw_style))
            self.assertEqual(pack['unsupported'], [])

    def test_selects_exact_english_members_before_assigning_bank_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, pack = Builder(Path(tmp)).pack(resources(), 'message_EU', SETTINGS, SETTINGS_MESSAGE_ARCHIVE, 'archive')
            self.assertEqual(set(pack['messages']), {'hud', 'mset'})
            self.assertEqual(set(pack['styles']), set(SETTINGS_STYLE_PAIRS.values()))
            self.assertEqual(pack['unsupported'], [])
            for bank, marker in [('hud', 1), ('mset', 2)]:
                path = f'message_{bank}/EU_English/{bank}.msbt'
                message = pack['messages'][bank]
                self.assertEqual(message['messages'][0]['text'], 'EU_English '+bank)
                self.assertEqual(message['styleTable'], SETTINGS_STYLE_PAIRS[path])
                self.assertEqual(pack['styles'][message['styleTable']]['styles'][0]['unresolvedWords']['0'], marker)
                self.assertEqual(pack['resourceSources']['messages'][bank]['path'], SETTINGS_MESSAGE_ARCHIVE+'/'+path)
            selection = pack['localeSelection']
            self.assertEqual(len(selection['selected']), 4); self.assertEqual(len(selection['rejected']), 12)
            self.assertEqual({s['locale'] for s in selection['rejected']}, {'EU_Dutch', 'EU_French', 'US_English'})
            for source in [*selection['selected'], *selection['rejected']]:
                member = source['path'].removeprefix(SETTINGS_MESSAGE_ARCHIVE+'/')
                self.assertEqual(source['sha256'], digest(resources()[member]))

    def test_same_locale_bank_collision_is_a_hard_failure_before_public_write(self):
        inputs = resources(); inputs['other/EU_English/hud.msbt'] = msbt('Other HUD')
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            with self.assertRaisesRegex(ValueError, 'Ambiguous EU_English message bank hud'):
                Builder(output).pack(inputs, 'message_EU', SETTINGS, SETTINGS_MESSAGE_ARCHIVE, 'archive')
            self.assertEqual(list(output.rglob('*')), [])

    def test_missing_english_or_sibling_style_never_falls_back_to_another_locale(self):
        examples = [({k: v for k, v in resources().items() if '/EU_English/' not in k}, 'No EU_English'),
                    ({k: v for k, v in resources().items() if k != 'message_hud/EU_English/RI.mstl'}, 'Missing same-locale')]
        for inputs, error in examples:
            with self.subTest(error=error), tempfile.TemporaryDirectory() as tmp:
                with self.assertRaisesRegex(ValueError, error):
                    Builder(Path(tmp)).pack(inputs, 'message_EU', SETTINGS, SETTINGS_MESSAGE_ARCHIVE, 'archive')

    def test_ambiguous_locale_and_invalid_selected_resource_fail_explicitly(self):
        cases = [('message_hud/EU_English/EU_Dutch/hud.msbt', msbt('bad'), 'ambiguous message locale'),
                 ('message_hud/hud_EU_English.msbt', msbt('bad'), 'ambiguous message locale'),
                 ('message_hud/EU_English/RI.mstl', b'bad', 'Invalid selected Settings'),
                 ('message_hud/EU_English/hud.msbt', b'bad', 'Invalid selected Settings'),
                 ('message_hud/EU_English/hud.msbt', msbt('bad')[:-1], 'Invalid selected Settings')]
        for name, raw, error in cases:
            inputs = resources(); inputs[name] = raw
            with self.subTest(name=name), tempfile.TemporaryDirectory() as tmp:
                with self.assertRaisesRegex(ValueError, error):
                    Builder(Path(tmp)).pack(inputs, 'message_EU', SETTINGS, SETTINGS_MESSAGE_ARCHIVE, 'archive')

    def test_missing_required_bank_fails_before_public_write(self):
        for bank in ('hud', 'mset'):
            inputs = {k: v for k, v in resources().items() if not k.startswith(f'message_{bank}/EU_English/')}
            with self.subTest(bank=bank), tempfile.TemporaryDirectory() as tmp:
                output = Path(tmp)
                with self.assertRaisesRegex(ValueError, f'Missing required Settings message banks: message_{bank}/EU_English/{bank}.msbt'):
                    Builder(output).pack(inputs, 'message_EU', SETTINGS, SETTINGS_MESSAGE_ARCHIVE, 'archive')
                self.assertEqual(list(output.rglob('*')), [])

    def test_audit_detects_wrong_locale_style_and_selection_provenance(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); builder = Builder(root)
            url, original = builder.pack(resources(), 'message_EU', SETTINGS, SETTINGS_MESSAGE_ARCHIVE, 'archive')
            manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'sources': {SETTINGS: {'titleId': SETTINGS, 'file': 'settings.cia'}},
                        'titles': {}, 'home': {}, 'fonts': {}, 'resources': builder.records,
                        'converter': {'version': 'test', 'scripts': {'test': 'test'}, 'extractor': {'name': 'test'}}}
            def check(pack):
                raw = encode(pack); (root/url).write_bytes(raw)
                manifest['resources'][url].update(sha256=digest(raw), size=len(raw))
                (root/'manifest.json').write_bytes(encode(manifest))
                return audit(root)['errors']
            self.assertEqual(check(original), [])
            pack = copy.deepcopy(original); pack['messages']['hud']['styleTable'] = 'message_mset/EU_English/RI.mstl'
            self.assertIn('wrong source-locale style binding', ' '.join(check(pack)))
            pack = copy.deepcopy(original); pack['localeSelection']['selected'][0]['locale'] = 'EU_Dutch'
            self.assertIn('source locale mismatch', ' '.join(check(pack)))
            pack = copy.deepcopy(original); pack['localeSelection']['selected'][0]['contentIndex'] = 1
            self.assertIn('locale-selection content identity mismatch', ' '.join(check(pack)))
            pack = copy.deepcopy(original); pack['localeSelection']['selected'].pop()
            self.assertIn('selected message/style provenance differs', ' '.join(check(pack)))
            pack = copy.deepcopy(original); pack.pop('localeSelection')
            self.assertIn('missing Settings locale selection', ' '.join(check(pack)))
            for bank in ('hud', 'mset'):
                with self.subTest(missing_bank=bank):
                    pack = copy.deepcopy(original)
                    style = pack['messages'][bank]['styleTable']
                    for bucket, key in [('messages', bank), ('styles', style)]:
                        del pack[bucket][key]
                        del pack['resourceSources'][bucket][key]
                    prefix = SETTINGS_MESSAGE_ARCHIVE+f'/message_{bank}/EU_English/'
                    pack['localeSelection']['selected'] = [s for s in pack['localeSelection']['selected']
                                                           if not s['path'].startswith(prefix)]
                    self.assertEqual(check(pack), [f'{url}: missing required Settings message/style pairs'])


SOURCE = os.environ.get('FIRMWARE_MULTICONTENT_ARTIFACTS')
OUTPUT = os.environ.get('FIRMWARE_LOCALE_OUTPUT')
CTRTOOL = os.environ.get('FIRMWARE_CTRTOOL')


@unittest.skipUnless(SOURCE and OUTPUT and CTRTOOL, 'Private extracted fixture/output/CTRTool are opt-in')
class OwnerLocaleTests(unittest.TestCase):
    def test_settings_english_sources_pairing_audit_and_home_preservation(self):
        source = Path(SOURCE); output = Path(OUTPUT).resolve()
        if output.is_relative_to(ROOT): raise ValueError('Private output must be outside repository')
        metadata = json.loads((source/'metadata.json').read_text())
        settings_code = (source/'extracted/settings/contents/0000-0000003d/exefs/code.bin').read_bytes()
        home_code = (source/'extracted/home/exefs/code.bin').read_bytes()
        self.assertEqual(digest(settings_code), '1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5')
        self.assertEqual(digest(settings_code[0x31700:0x31774]), 'f8ad1f3622f84961b9077f1ef1d754d5772da324a4a4cb01b389e0f3eb9bdc9c')
        self.assertEqual(settings_code[0xc8754:0xc8814], home_code[0x1e634:0x1e6f4])
        self.assertEqual(digest(settings_code[0xc8754:0xc8814]), 'b2a4d54f6a3bfdb1993e20aea4c512818d700eed65efb5ca0190b21c5fde6d1c')
        previous = json.loads((source/'public/manifest.json').read_text())
        builder = Builder(output); home = {}; titles = {}
        for title in [HOME, '000400300000d002', SETTINGS]:
            titles[title] = convert_title(builder, title, metadata[title], source/'extracted'/TITLES[title][0], home)
        manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'region': 'EUR', 'locale': 'EU_English',
                    'sources': previous['sources'], 'titles': titles, 'home': home,
                    'fonts': {'hud': titles[HOME]['fonts']['Hud_JP.bcfnt']}, 'resources': builder.records,
                    'unsupported': builder.unsupported, 'converter': converter_provenance(Path(CTRTOOL)),
                    'excludedTitles': sorted(EXCLUDED)}
        (output/'manifest.json').write_bytes(encode(manifest))
        report = audit(output, source, ROOT)
        (output.parent/'audit.json').write_bytes(encode(report))
        self.assertCountEqual(report['errors'], json.loads((source/'audit.json').read_text())['errors'])
        self.assertEqual(len(report['errors']), 19); self.assertFalse(report['ok'])
        old_root = ROOT/'public/os/firmware/10.7.0-32E'
        old = json.loads((old_root/'manifest.json').read_text())
        self.assertEqual(titles[HOME], old['titles'][HOME]); self.assertEqual(home, old['home'])
        for url, record in builder.records.items():
            if record['sources'][0]['titleId'] == HOME:
                self.assertEqual((output/url).read_bytes(), (old_root/url).read_bytes(), url)
        url = 'packs/settings/contents/0000-0000003d/message_EU.json'
        pack = json.loads((output/url).read_text())
        hashes = {
            'message_hud/EU_English/hud.msbt': 'a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d',
            'message_hud/EU_English/RI.mstl': '1e3d39608ce338b89fc0f6554d216f6f354e42b9e2ceacfccef488df27dacd3e',
            'message_mset/EU_English/mset.msbt': 'fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae',
            'message_mset/EU_English/RI.mstl': 'ed972145483634e3a9b8205ff3d17afb7b7c1adc84bf1de47c499fc1a1139d9f',
        }
        selection = pack['localeSelection']; self.assertEqual(len(selection['selected']), 4)
        self.assertEqual({s['path'].removeprefix(SETTINGS_MESSAGE_ARCHIVE+'/'): s['sha256'] for s in selection['selected']}, hashes)
        self.assertEqual(len(selection['rejected']), 28)
        self.assertEqual({s['locale'] for s in selection['rejected']},
                         {'EU_Dutch', 'EU_French', 'EU_German', 'EU_Italian', 'EU_Portuguese', 'EU_Russian', 'EU_Spanish'})
        self.assertEqual(pack['unsupported'], [])
        self.assertEqual(set(pack['messages']), {'hud', 'mset'})
        for bank, count in [('hud', 7), ('mset', 599)]:
            self.assertEqual(pack['messages'][bank]['styleTable'], f'message_{bank}/EU_English/RI.mstl')
            self.assertEqual(len(pack['styles'][f'message_{bank}/EU_English/RI.mstl']['styles']), count)
        mset = pack['messages']['mset']
        for label, index, text in [('keyboard_cancel', 20, 'Cancel'), ('keyboard_decide', 19, 'OK')]:
            self.assertEqual(mset['labels'][label], index)
            self.assertEqual(mset['messages'][index]['text'], text)
            self.assertEqual(mset['messages'][index]['styleIndex'], 93)
        (output.parent/'selection.json').write_bytes(encode(selection))


if __name__ == '__main__': unittest.main()
