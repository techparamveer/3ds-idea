"""Original keyboard selector style/fit and overlay material field replay."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.arm_const import *

sys.path.insert(0, str(Path(__file__).resolve().parent))
from unpack_home_resources import decompress
from firmware.native import decode_layout, sections as layout_sections


def verify(reference, output, font_manifest):
    source_paths = ['extracted/exefs/code.bin',
                    'extracted/romfs/message/EU_English/swkbd_msbt_LZ.bin',
                    'extracted/romfs/message/EU_English/RI_mstl_LZ.bin',
                    'members/swkbd_common_LZ.bin/blyt/KeytopModeSelect.bclyt',
                    'members/swkbd_common_LZ.bin/blyt/TextArea_02.bclyt']
    source_hashes = {name: hashlib.sha256((reference / name).read_bytes()).hexdigest() for name in source_paths}
    frozen = reference / 'settings-nickname/lower-first-paint'
    dependencies = {name: hashlib.sha256((frozen / name).read_bytes()).hexdigest()
                    for name in ['qwerty-first-paint.py', 'text-first-paint.py', 'qwerty-first-paint.json']}
    spec = importlib.util.spec_from_file_location('selector_base', frozen / 'qwerty-first-paint.py')
    base = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(base)
    font_data = json.loads(font_manifest.read_text())
    assert font_data['sourceSha256'] == '95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581'
    msbt = decompress((reference / 'extracted/romfs/message/EU_English/swkbd_msbt_LZ.bin').read_bytes())
    style_data = decompress((reference / 'extracted/romfs/message/EU_English/RI_mstl_LZ.bin').read_bytes())
    sections, at = {}, 32
    for _ in range(struct.unpack_from('<H', msbt, 14)[0]):
        tag, length = struct.unpack_from('<4sI', msbt, at)
        sections[tag] = msbt[at + 16:at + 16 + length]
        at = (at + 16 + length + 15) & ~15

    class Replay(base.Qwerty):
        def __init__(self, width_probe=None, metric_probe=False):
            super().__init__()
            self.width_probe = width_probe
            self.metric_probe = metric_probe
            self.trace, self.writes = [], []
            del self.hooks[0x155e38]
            del self.hooks[0x154e74]
            self.hooks[0x12bf5c] = self.label_index
            self.hooks[0x134b90] = lambda: self.tsy
            self.w(self.pvt + 0x70, 0x157264)
            self.w(self.pvt + 0x7c, 0x178b60)
            message, descriptors = self.alloc(0x40), self.alloc(0x20)
            self.w(message + 0xc, descriptors)
            self.w(message + 0x14, 0)
            self.w(descriptors, self.data(sections[b'TXT2']))
            self.w(0x1bc290, message)
            self.tsy = self.alloc(4)
            self.w(self.tsy, self.data(sections[b'TSY1']))
            self.w(0x1bc2ac, self.data(style_data))
            for offset, metric in [(8, 'width'), (12, 'height'), (0x24, 'lineFeed')]:
                self.w(self.word(self.font) + offset, self.endpoint(metric, lambda metric=metric: font_data[metric]))
            self.w(self.word(self.font) + 0x38, self.endpoint('actualGlyphAdvance', lambda: font_data['glyphs'][str(self.r(1))]['advance']))
            self.u.hook_add(UC_HOOK_MEM_WRITE, self.memory_write)

        def data(self, data):
            pointer = self.alloc(len(data))
            self.u.mem_write(pointer, data)
            return pointer

        def label_index(self):
            label = self.string(self.r(0))
            self.trace.append({'op': 'labelLookup', 'label': label, 'returnPc': hex(self.u.reg_read(UC_ARM_REG_LR))})
            assert self.r(1) == 0
            return self.messages['labels'][label]

        def load(self):
            obj = self.r(0)
            result = super().load()
            self.w(obj + 0x78, obj + 0x78)
            self.w(obj + 0x7c, obj + 0x78)
            for pane, record in self.panes.items():
                if record['kind'] != 'txt1':
                    continue
                raw = record['text']['value'].encode('utf-16le')
                capacity = max(record['text']['capacity'], len(raw) + 2)
                self.w(pane + 0xd4, self.data(raw + bytes(capacity - len(raw))))
                self.u.mem_write(pane + 0xf8, struct.pack('<HH', capacity, len(raw) // 2))
                if self.width_probe is not None:
                    self.f(pane + 0x48, self.width_probe)
                # Distinct incoming metrics prove style application, including
                # lines/character spacing, rather than an accidental no-op.
                if self.metric_probe:
                    for off, value in [(0xe4, 11.25), (0xe8, 12.5), (0xec, -3.25), (0xf0, 2.75)]:
                        self.f(pane + off, value)
            return result

        def memory_write(self, u, access, address, size, value, user):
            for pane, record in self.panes.items():
                if record['kind'] == 'txt1' and pane + 0xe4 <= address < pane + 0xf4:
                    self.writes.append({'pane': record['name'], 'offset': hex(address - pane), 'bits': value, 'pc': hex(u.reg_read(UC_ARM_REG_PC))})

        def hook(self, u, address, size, user):
            if address == 0x12b278:
                self.trace.append({'op': 'autoFit', 'pane': self.panes[self.r(1)]['name']})
            if address == 0x12b3fc:
                self.trace.append({'op': 'measuredWidth', 'pane': self.panes[u.reg_read(UC_ARM_REG_R4)]['name'],
                                   'value': struct.unpack('<f', struct.pack('<I', u.reg_read(UC_ARM_REG_S0)))[0]})
            return super().hook(u, address, size, user)

        def run_selector(self):
            obj = self.alloc(0x100)
            name = self.data(b'KeytopModeSelect.bclyt\0')
            self.call(0x155ff4, [obj, 0, name, 0], stage='selectorResource')
            child = self.alloc(0x100)
            self.w(child + 0x80, obj)
            self.u.reg_write(UC_ARM_REG_R4, child)
            self.u.reg_write(UC_ARM_REG_R8, 0x1b7744)
            self.stage = 'originalSelectorLabels'
            self.u.reg_write(UC_ARM_REG_SP, 0x17e0000)
            try:
                self.u.emu_start(0x193240, 0x1932c4, count=1000000)
            except Exception as error:
                raise RuntimeError(f'{error}: PC={self.u.reg_read(UC_ARM_REG_PC):x}, LR={self.u.reg_read(UC_ARM_REG_LR):x}')
            assert self.u.reg_read(UC_ARM_REG_PC) == 0x1932c4
            return {'widthProbe': self.width_probe, 'metricProbe': self.metric_probe, 'trace': self.trace, 'writes': self.writes,
                    'panes': [{'name': n['name'], 'size': self.fs(p + 0x48, 2), 'fontSize': self.fs(p + 0xe4, 2),
                               'lineSpacing': self.fs(p + 0xec, 1)[0], 'characterSpacing': self.fs(p + 0xf0, 1)[0],
                               'text': self.wide(self.word(p + 0xd4), struct.unpack('<H', self.u.mem_read(p + 0xfa, 2))[0])}
                              for p, n in self.panes.items() if n['kind'] == 'txt1']}

    cases = [Replay().run_selector(), Replay(metric_probe=True).run_selector(),
             *[Replay(width, True).run_selector() for width in [12, 30, 52]]]
    expected_widths = [31.200000762939453, 29.400001525878906, 54.000003814697266, 48.60000228881836]
    for case in cases:
        assert [e['value'] for e in case['trace'] if e['op'] == 'measuredWidth'] == expected_widths
        assert len([e for e in case['trace'] if e['op'] == 'autoFit']) == 4
        assert [p['text'] for p in case['panes']] == ['ABC', 'ËαЯ', 'Symbol', 'Mobile']
        assert all(p['fontSize'][1] == 18 and p['lineSpacing'] == p['characterSpacing'] == 0 for p in case['panes'])
    assert [p['fontSize'] for p in cases[0]['panes']] == [[15.000000953674316, 18]] * 4
    assert not cases[0]['writes']
    assert len(cases[1]['writes']) == 16
    assert [p['fontSize'] for p in cases[2]['panes']] == [[12, 18]] * 4

    # Execute the complete original text initializer to capture the actual
    # English material write's table pointer and target, then replay its source
    # constructor and write against distinct original/sentinel color registers.
    material_run = base.m.Run('Ada')
    observed, debug_pcs = [], []
    slice_stop = None

    def observe(u, address, size, user):
        if address == slice_stop:
            u.emu_stop()
            return
        debug_pcs.append(hex(address))
        if len(debug_pcs) > 25:
            debug_pcs.pop(0)
        if address == 0x1873f8:
            observed.append({'table': u.reg_read(UC_ARM_REG_R7), 'material': u.reg_read(UC_ARM_REG_R0), 'value': u.reg_read(UC_ARM_REG_R1)})

    material_run.u.hook_add(UC_HOOK_CODE, observe)
    material_run.call(0x187670, [material_run.obj, 0, 500, 0], stage='textConstructor')
    material_run.call(0x186d48, [material_run.obj, 0], stage='textInitializer')
    assert len(observed) == 1 and observed[0]['value'] == 0
    assert observed[0]['table'] + 12 == 0x1b8464
    raw_layout_path = reference / 'members/swkbd_common_LZ.bin/blyt/TextArea_02.bclyt'
    raw_layout = raw_layout_path.read_bytes()
    decoded = decode_layout(raw_layout)
    material_index = next(i for i, m in enumerate(decoded['materials']) if m['name'] == 'T_trans')
    mat_section = next(reader for tag, reader in layout_sections(raw_layout, b'CLYT')[1] if tag == 'mat1')
    start = mat_section.u32(12 + material_index * 4)
    end = mat_section.u32(12 + (material_index + 1) * 4) if material_index + 1 < mat_section.u32(8) else len(mat_section.data)
    original_material = mat_section.bytes(start, end - start)
    target = observed[0]['material']
    material_cases = []
    for sentinel in [False, True]:
        raw = bytearray(original_material)
        if sentinel:
            raw[20:48] = bytes(range(11, 39))
        source = material_run.alloc(len(raw))
        material_run.u.mem_write(source, bytes(raw))
        material_run.u.mem_write(target, bytes([0xa5]) * 0x80)
        material_run.u.reg_write(UC_ARM_REG_R0, 0)
        material_run.u.reg_write(UC_ARM_REG_R4, source)
        material_run.u.reg_write(UC_ARM_REG_R7, target)
        slice_stop = 0x14118c
        material_run.u.emu_start(0x141130, 0x14118c, count=1000)
        assert material_run.u.reg_read(UC_ARM_REG_PC) == slice_stop
        copied = bytes(material_run.u.mem_read(target, 0x80))
        assert copied[:16] == bytes([0xa5]) * 16 and copied[44:] == bytes([0xa5]) * (0x80 - 44)
        assert copied[16:44] == raw[20:48]
        material_run.u.reg_write(UC_ARM_REG_R4, material_run.obj)
        material_run.u.reg_write(UC_ARM_REG_R7, observed[0]['table'])
        slice_stop = 0x1873fc
        try:
            material_run.u.emu_start(0x1873d0, 0x1873fc, count=10000)
        except Exception as error:
            raise RuntimeError(f'{error} material PC={material_run.u.reg_read(UC_ARM_REG_PC):x}, LR={material_run.u.reg_read(UC_ARM_REG_LR):x}, trace={debug_pcs}')
        assert material_run.u.reg_read(UC_ARM_REG_PC) == slice_stop
        written = bytes(material_run.u.mem_read(target, 0x80))
        expected = bytearray(copied)
        expected[20:24] = bytes(4)
        assert written == expected
        material_cases.append({'sentinel': sentinel, 'beforeRegisters': [list(copied[i:i + 4]) for i in range(16, 44, 4)],
                               'afterRegisters': [list(written[i:i + 4]) for i in range(16, 44, 4)], 'changedOffsets': [hex(i) for i in range(0x80) if copied[i] != written[i]]})
    assert dependencies == {name: hashlib.sha256((frozen / name).read_bytes()).hexdigest() for name in dependencies}
    output.mkdir(parents=True, exist_ok=True)
    report = {'schema': 1, 'passed': True, 'dependencies': dependencies, 'sourceHashes': source_hashes,
              'fixtureSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'codeSha256': hashlib.sha256(base.m.C).hexdigest(),
              'fontSourceSha256': font_data['sourceSha256'], 'fontManifestSha256': hashlib.sha256(font_manifest.read_bytes()).hexdigest(),
              'selectorCases': cases, 'materialCases': material_cases,
              'materialSourceSha256': hashlib.sha256(original_material).hexdigest(),
              'materialMapping': {'constructor': '0x141130..0x141188', 'sourceRegistersStart': '0x14', 'runtimeRegistersStart': '0x10',
                                  'caller': '0x1873d0..0x1873f8', 'tableWord': '0x1b8464', 'writtenField': 'constantColors[0]', 'value': [0, 0, 0, 0]},
              'boundaries': ['Original selector caller, style getter/setter, complete auto-fit and native string measurement execute.',
                             'Parsed label/TSY1 section lookup, decoded layout construction, allocation and actual shared font metric/advance queries are explicit endpoints.',
                             'Narrow widths and incoming metric sentinels are diagnostic probes, not native keyboard modes.',
                             'Original full text initializer identifies the English write; bounded original source constructor and write path replay against actual T_trans and sentinel registers.',
                             'Native GPU/font glyph rasterization and LCD pixels remain separate from these CPU field proofs.']}
    (output / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference-root', type=Path, required=True)
    parser.add_argument('--artifact-dir', type=Path, required=True)
    parser.add_argument('--font-manifest', type=Path, required=True)
    args = parser.parse_args()
    assert args.reference_root.is_absolute() and args.artifact_dir.is_absolute() and args.font_manifest.is_absolute()
    result = verify(args.reference_root, args.artifact_dir, args.font_manifest)
    print(json.dumps({'passed': result['passed'], 'selectorCases': len(result['selectorCases']), 'materialCases': result['materialCases']}))
