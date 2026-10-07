"""Bounded incoming-cover publication, original-source closure and failure checks."""
import copy
import json
import os
from pathlib import Path
import shutil
import subprocess
import struct
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts/firmware'))
from publish_applet_incoming import (
    FONT_HASH, FONT_URL, METRIC_BLOCK_HASH, SHARED_MEMBERS, SPECS, STYLE_PATH, TEXT_PROOFS,
    arm_branch, checked, publish, selected_pack, source_resources, text_binding,
    validate_manifest, verify_branches, verify_text_source,
)
from build import Builder, digest

PUBLIC = ROOT/'public/os/firmware/10.7.0-32E'
PRIVATE = Path(os.environ.get('APPLET_INCOMING_SOURCE_ROOT',
    '/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007'))
NAND = PRIVATE/'native-manual-slow/user/nand/00000000000000000000000000000000/title/00040030'
INPUTS = {
    'friends_source': PRIVATE/'friends-entry-source',
    'notifications_source': PRIVATE/'notifications-entry-source',
    'friends_content': NAND/'00009f02/content/00000017.app',
    'notifications_content': NAND/'0000a002/content/00000012.app',
    'ctrtool': Path('/Users/paramveer/Downloads/Smelt.app/Contents/Resources/ctrtool'),
}
HAVE_PRIVATE = all(path.exists() for path in INPUTS.values())
URLS = ['packs/'+name+'/incoming.json' for name in SPECS]
PACK_ROOT = Path(os.environ.get('APPLET_INCOMING_PACK_ROOT', PUBLIC/'packs'))
HAVE_PACKS = all((PACK_ROOT/name/'incoming.json').exists() for name in SPECS)
HAVE_PUBLICATION = all((PUBLIC/url).exists() for url in URLS)


class IncomingCoverTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((PUBLIC/'manifest.json').read_bytes())

    def test_exact_title_content_locale_and_native_font_are_required(self):
        validate_manifest(self.manifest)
        mutations = [lambda m: m.update(locale='EU_French'), lambda m: m.update(firmware='other'),
                     lambda m: m['resources'][FONT_URL].update(sha256='other'),
                     lambda m: m['resources'][FONT_URL].update(kind='texture')]
        for spec in SPECS.values():
            title = spec['titleId']
            mutations.extend([
                lambda m, title=title: m['titles'][title].update(titleId='other'),
                lambda m, title=title: m['titles'][title].update(version=0),
                lambda m, title=title: m['sources'][title].update(resourceContentIndex=1),
                lambda m, title=title: m['sources'][title]['contents'][0].update(id='00000000'),
                lambda m, title=title: m['sources'][title]['contents'][0].update(sha256='other'),
            ])
        for mutation in mutations:
            altered = copy.deepcopy(self.manifest)
            mutation(altered)
            with self.assertRaises(ValueError):
                validate_manifest(altered)

    def test_wrong_original_content_fails_before_artifacts_or_public_writes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            output = root/'output'
            output.mkdir()
            original = (PUBLIC/'manifest.json').read_bytes()
            (output/'manifest.json').write_bytes(original)
            content = root/'wrong.app'
            content.write_bytes(b'not the pinned source')
            with self.assertRaisesRegex(ValueError, 'content'):
                publish(root/'friends', root/'notifications', content, content,
                        output, root/'artifacts', root/'ctrtool')
            self.assertEqual((output/'manifest.json').read_bytes(), original)
            self.assertEqual(list(output.iterdir()), [output/'manifest.json'])
            self.assertFalse((root/'artifacts').exists())

    def test_every_pinned_archive_member_message_style_and_code_hash_rejects_other_bytes(self):
        for spec in SPECS.values():
            hashes = {**SHARED_MEMBERS, **spec['members'], 'code': spec['codeHash'],
                      'archive': spec['archiveHash'], 'message': spec['messageHash'], 'style': spec['styleHash']}
            for label, sha in hashes.items():
                with self.assertRaisesRegex(ValueError, 'hash mismatch'):
                    checked(b'unrelated', sha, label)

    @unittest.skipUnless(HAVE_PACKS, 'incoming assets not published; private pack fixture env is optional')
    def test_selected_missing_unsupported_fonts_message_styles_and_clips_fail_explicitly(self):
        for name, spec in SPECS.items():
            original = json.loads((PACK_ROOT/name/'incoming.json').read_bytes())
            selected_pack(original, spec)
            lower, clip = spec['layouts'][1], spec['layouts'][1]+'_SceneIn'
            mutations = [
                lambda p: p['layouts'].pop(lower),
                lambda p: p['layouts'][lower].update(unsupported=['unconverted material']),
                lambda p: p['layouts'][lower].update(fonts=['fabricated font']),
                lambda p: p['animations'][clip].update(frames=20),
                lambda p: p['animations'][clip].update(loop=True),
                lambda p: p['animations'][clip].update(unsupported=['unconverted track']),
                lambda p: p['textures'].pop('BgLine.bclim'),
                lambda p: p['messages'][spec['bank']]['messages'][0].update(styleIndex=0),
                lambda p: p['styles'][p['messages'][spec['bank']]['styleTable']]['styles'][spec['style']].update(fontScale=[1, 1]),
                lambda p: p.update(titleId='other'),
                lambda p: p.pop('incomingTextBinding'),
                lambda p: p['incomingTextBinding'].update(styleApplied=True),
                lambda p: p['styles'][STYLE_PATH].update(recordSize=40),
                lambda p: p['styles'][STYLE_PATH].update(unsupported=[]),
                lambda p: p['styles'][STYLE_PATH]['unsupported'].append({'kind': 'other'}),
                lambda p: p['styles'][STYLE_PATH]['styles'][spec['style']]['unresolvedWords'].pop('40'),
                lambda p: p['styles'][STYLE_PATH]['styles'][spec['style']]['unresolvedWords'].update(other=0),
                lambda p: p['styles'][STYLE_PATH]['styles'][spec['style']]['unresolvedWords'].update({'0': 0}),
                lambda p: p['styles'][STYLE_PATH]['styles'][0].update(unsupported=['unknown']),
                lambda p: p['resourceSources']['styles'][STYLE_PATH].update(path='other'),
                lambda p: p['messages'][spec['bank']].update(unsupported=['unconverted message']),
            ]
            for mutation in mutations:
                altered = copy.deepcopy(original)
                mutation(altered)
                with self.assertRaises(ValueError):
                    selected_pack(altered, spec)

    @unittest.skipUnless(HAVE_PUBLICATION, 'incoming public export approval/publication pending')
    def test_manifest_delta_preserves_all_existing_resources_and_other_title_fields(self):
        base = json.loads(subprocess.check_output([
            'git', 'show', '9882f97c2bf77fb1ee5a45b294fcbe77828555f9:public/os/firmware/10.7.0-32E/manifest.json',
        ], cwd=ROOT))
        for key, value in base.items():
            if key not in ('titles', 'resources'):
                self.assertEqual(self.manifest[key], value, key)
        for key, value in base['resources'].items():
            self.assertEqual(self.manifest['resources'][key], value, key)
        expected = copy.deepcopy(base['titles'])
        for name, spec in SPECS.items():
            info = expected[spec['titleId']]
            info['packs'].append('packs/'+name+'/incoming.json')
            info['fonts']['contents/0000-'+spec['contentId']+'/cbf_std.bcfnt'] = FONT_URL
        self.assertEqual(self.manifest['titles'], expected)
        self.assertEqual(set(self.manifest['resources'])-set(base['resources']), set(URLS))

    @unittest.skipUnless(HAVE_PUBLICATION, 'incoming public export approval/publication pending')
    def test_pack_texture_and_native_font_bytes_keep_manifest_and_source_closure(self):
        for name, spec in SPECS.items():
            url = 'packs/'+name+'/incoming.json'
            raw = (PUBLIC/url).read_bytes()
            record = self.manifest['resources'][url]
            self.assertEqual((record['size'], record['sha256']), (len(raw), digest(raw)))
            self.assertEqual(record['conversion']['codeSha256'], spec['codeHash'])
            self.assertEqual(record['conversion']['version'], '1.5.4')
            self.assertEqual(record['conversion']['extractor']['version'], '1.2.0')
            self.assertEqual(record['conversion']['publisherSha256'], digest((ROOT/'scripts/firmware/publish_applet_incoming.py').read_bytes()))
            pack = json.loads(raw)
            self.assertEqual(pack['unsupported'], [])
            self.assertEqual(set(pack['layouts']), set(spec['layouts']))
            self.assertEqual(set(pack['animations']), {key+'_SceneIn' for key in spec['layouts']})
            self.assertEqual(pack['incomingFontBinding']['sha256'], FONT_HASH)
            self.assertFalse(pack['incomingFontBinding']['titleRuntimeResolutionEstablished'])
            self.assertEqual(pack['incomingTextBinding'], text_binding(spec))
            for bucket in ('layouts', 'animations', 'textures'):
                for source in pack['resourceSources'][bucket].values():
                    self.assertEqual(source['titleId'], spec['titleId'])
                    self.assertEqual(source['contentId'], spec['contentId'])
                    member = source['path'].removeprefix(spec['archive']+'/')
                    self.assertEqual(source['sha256'], {**SHARED_MEMBERS, **spec['members']}[member])
            for texture in pack['textures'].values():
                pixels = (PUBLIC/texture['url']).read_bytes()
                self.assertEqual(digest(pixels), texture['sha256'])
                self.assertEqual(digest(pixels), self.manifest['resources'][texture['url']]['sha256'])
            message_source = pack['resourceSources']['messages'][spec['bank']]
            self.assertEqual(message_source['path'], 'message/EU_English/'+spec['bank']+'.bin')
            self.assertEqual(message_source['sha256'], spec['messageDecodedHash'])
            self.assertEqual(message_source['compressedSha256'], spec['messageHash'])

    @unittest.skipUnless(HAVE_PRIVATE and HAVE_PACKS, 'private source/pack fixture absent; publication pending')
    def test_delivered_selection_equals_fresh_original_conversion_without_layout_or_track_edits(self):
        with tempfile.TemporaryDirectory() as tmp:
            builder = Builder(Path(tmp))
            for name, spec in SPECS.items():
                sources = source_resources(INPUTS[name+'_source'], INPUTS[name+'_content'], spec)
                _, original = builder.pack(sources, 'incoming', spec['titleId'], spec['archive'],
                                            spec['archiveHash'], {'contentIndex': 0, 'contentId': spec['contentId'], 'titleVersion': spec['version']})
                selected = selected_pack(original, spec)
                delivered = json.loads((PACK_ROOT/name/'incoming.json').read_bytes())
                self.assertEqual(delivered, selected)

    @unittest.skipUnless(HAVE_PRIVATE, 'private original applet sources absent')
    def test_selected_original_plain_writer_path_distinguishes_named_style_and_getter_mutations(self):
        home = PRIVATE/'home-pause-source/exefs/code.bin'
        if not home.exists():
            self.skipTest('private HOME metric equivalence reference absent')
        reference = checked(home.read_bytes(),
            '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9', 'HOME code')
        metric = reference[0x1e634:0x1e6f4]
        self.assertEqual(len(metric), 192)
        self.assertEqual(digest(metric), METRIC_BLOCK_HASH)
        for name, spec in SPECS.items():
            code = checked((INPUTS[name+'_source']/'exefs/code.bin').read_bytes(), spec['codeHash'], name+' code')
            proof = TEXT_PROOFS[name]
            verify_text_source(code, spec)
            start, end, sha = proof['ranges']['unreachedMetricBlock']
            self.assertEqual(code[start-0x100000:end-0x100000], metric)
            self.assertEqual(sha, METRIC_BLOCK_HASH)
            call, target, link = proof['branches'][-1]
            self.assertEqual(arm_branch(code, call), (proof['ranges']['plainWriter'][0], True))
            for replacement in (proof['unreachedStyleWriter'], proof['ranges']['unreachedStyleGetter'][0]):
                mutated = bytearray(code)
                struct.pack_into('<I', mutated, call-0x100000,
                                 0xeb000000 | (((replacement-call-8)//4) & 0xffffff))
                self.assertEqual(arm_branch(mutated, call), (replacement, True))
                with self.assertRaisesRegex(ValueError, 'branch changed'):
                    verify_branches(mutated, proof)
            mutated = bytearray(code)
            word = struct.unpack_from('<I', mutated, call-0x100000)[0]
            struct.pack_into('<I', mutated, call-0x100000, word & ~0x1000000)
            self.assertEqual(arm_branch(mutated, call), (target, False))
            with self.assertRaisesRegex(ValueError, 'branch changed'):
                verify_branches(mutated, proof)

    @unittest.skipUnless(HAVE_PRIVATE and HAVE_PUBLICATION, 'private source/publication absent; export pending')
    def test_repeat_publication_preserves_manifest_and_existing_delivery_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            output = root/'output'
            output.mkdir()
            dependencies = set(URLS+[FONT_URL])
            font = json.loads((PUBLIC/FONT_URL).read_bytes())
            dependencies.update(str(Path(FONT_URL).parent/sheet) for sheet in font['sheets'])
            for url in URLS:
                pack = json.loads((PUBLIC/url).read_bytes())
                dependencies.update(texture['url'] for texture in pack['textures'].values())
            dependencies.add('manifest.json')
            for url in dependencies:
                target = output/url
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(PUBLIC/url, target)
            before = {url: (output/url).read_bytes() for url in dependencies}
            report = publish(**INPUTS, output=output, artifacts=root/'artifacts')
            self.assertEqual(report['added'], [])
            self.assertEqual({url: (output/url).read_bytes() for url in dependencies}, before)


if __name__ == '__main__':
    unittest.main()
