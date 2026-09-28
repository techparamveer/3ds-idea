"""Bounded original-ARM QWERTY style replay; private inputs stay immutable."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys

from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R4, UC_ARM_REG_R5

sys.path.insert(0, str(Path(__file__).resolve().parent))
from unpack_home_resources import decompress


def verify(reference_root, artifact_dir):
    frozen = reference_root / 'settings-nickname/lower-first-paint'
    dependencies = {name: hashlib.sha256((frozen / name).read_bytes()).hexdigest()
                    for name in ['qwerty-first-paint.py', 'qwerty-first-paint.json', 'text-first-paint.py']}
    assert dependencies['qwerty-first-paint.json'] == '73c70973467dfd5dd1a0e5dc034baa0d46da210bed64d7b336ea4c4e8481fec2'
    spec = importlib.util.spec_from_file_location('qwerty_style_base', frozen / 'qwerty-first-paint.py')
    base = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(base)
    raw_msbt = reference_root / 'extracted/romfs/message/EU_English/swkbd_msbt_LZ.bin'
    raw_styles = reference_root / 'extracted/romfs/message/EU_English/RI_mstl_LZ.bin'
    msbt, styles = decompress(raw_msbt.read_bytes()), decompress(raw_styles.read_bytes())
    sections = {}
    at = 32
    for _ in range(struct.unpack_from('<H', msbt, 14)[0]):
        tag, length = struct.unpack_from('<4sI', msbt, at)
        sections[tag] = msbt[at + 16:at + 16 + length]
        at = (at + 16 + length + 15) & ~15

    class Replay(base.Qwerty):
        def __init__(self, probe=False):
            super().__init__()
            self.probe = probe
            self.style_events, self.writes, self.before = [], [], {}
            # Execute named-message wrapper, native style lookup and text lookup.
            del self.hooks[0x155e38]
            del self.hooks[0x154e74]
            self.hooks[0x12bf5c] = self.label_index
            self.hooks[0x134b90] = self.style_section
            self.w(self.pvt + 0x70, 0x157264)  # original capacity setter
            self.w(self.pvt + 0x7c, 0x178b60)  # original UTF-16 setter
            message = self.alloc(0x40)
            descriptors = self.alloc(0x20)
            txt = self.allocate_bytes(sections[b'TXT2'])
            self.w(message + 0xc, descriptors)
            self.w(message + 0x14, 0)
            self.w(descriptors, txt)
            self.w(0x1bc290, message)
            self.tsy = self.alloc(4)
            self.w(self.tsy, self.allocate_bytes(sections[b'TSY1']))
            self.style_table = self.allocate_bytes(styles)
            self.w(0x1bc2ac, self.style_table)
            self.u.hook_add(UC_HOOK_MEM_WRITE, self.memory_write)
            # Second run proves the named path actually applies source metrics,
            # while plain dictionary/unit-text paths retain their pane values.
            if probe:
                self.w(self.word(self.font) + 8, self.endpoint('probeFontWidth', lambda: 31))
                self.w(self.word(self.font) + 12, self.endpoint('probeFontHeight', lambda: 37))

        def allocate_bytes(self, data):
            pointer = self.alloc(len(data))
            self.u.mem_write(pointer, data)
            return pointer

        def label_index(self):
            label = self.string(self.r(0))
            index = self.messages['labels'][label]
            assert self.r(1) == 0
            self.style_events.append({'op': 'labelIndexBoundary', 'label': label, 'index': index,
                                      'returnPc': hex(self.u.reg_read(UC_ARM_REG_LR))})
            return index

        def style_section(self):
            assert self.string(self.r(1)) == 'TSY1'
            return self.tsy

        def metrics(self, pane):
            return {'fontSize': self.fs(pane + 0xe4, 2), 'lineSpacing': self.fs(pane + 0xec, 1)[0],
                    'characterSpacing': self.fs(pane + 0xf0, 1)[0]}

        def load(self):
            result = super().load()
            for pane, record in self.panes.items():
                if record['kind'] != 'txt1' or pane in self.before:
                    continue
                text = record['text']['value'].encode('utf-16le')
                capacity = max(record['text']['capacity'], len(text) + 2)
                self.w(pane + 0xd4, self.allocate_bytes(text + bytes(capacity - len(text))))
                self.u.mem_write(pane + 0xf8, struct.pack('<HH', capacity, len(text) // 2))
                if self.probe:
                    for offset, value in [(0xe4, 11.25), (0xe8, 12.5), (0xec, -3.25), (0xf0, 2.75)]:
                        self.f(pane + offset, value)
                self.before[pane] = self.metrics(pane)
            return result

        def memory_write(self, u, access, address, size, value, user):
            for pane, record in self.panes.items():
                if record['kind'] == 'txt1' and pane + 0xe4 <= address < pane + 0xf4:
                    self.writes.append({'pane': record['name'], 'offset': hex(address - pane),
                                        'size': size, 'valueBits': value, 'pc': hex(u.reg_read(UC_ARM_REG_PC))})

        def hook(self, u, address, size, user):
            if address == 0x116bdc:
                self.style_events.append({'op': 'namedSetter', 'label': self.string(self.r(1)),
                                          'pane': self.panes[self.r(2)]['name']})
            if address == 0x116c28:
                pointer = self.u.reg_read(UC_ARM_REG_R4)
                style = self.u.reg_read(UC_ARM_REG_R5)
                assert style == self.style_table + 4 + 220 * 44
                self.style_events.append({'op': 'resolvedStyle', 'pane': self.panes[pointer]['name'],
                                          'styleIndex': (style - self.style_table - 4) // 44})
            if address == 0x178b60:
                self.style_events.append({'op': 'nativeTextSetter', 'pane': self.panes[self.r(0)]['name'],
                                          'length': self.r(3), 'returnPc': hex(u.reg_read(UC_ARM_REG_LR))})
            if address == 0x178bf0:
                pane = u.reg_read(UC_ARM_REG_R4)
                length = struct.unpack('<H', u.mem_read(pane + 0xfa, 2))[0]
                self.panes[pane]['paintText'] = self.wide(self.word(pane + 0xd4), length)
            return super().hook(u, address, size, user)

        def finish(self):
            journal = self.runq()
            rows = [{'pane': record['name'], 'before': self.before[pane], 'after': self.metrics(pane),
                     'text': record.get('paintText')}
                    for pane, record in self.panes.items() if record['kind'] == 'txt1']
            named = [e for e in self.style_events if e['op'] == 'namedSetter']
            assert named == [{'op': 'namedSetter', 'label': 'qwerty_conv', 'pane': 'T_key_Tra'}]
            assert [e['label'] for e in self.style_events if e.get('returnPc') == '0x12c128'] == ['qwerty_conv']
            for row in rows:
                if row['pane'] != 'T_key_Tra':
                    assert row['before'] == row['after'], row
            font = (31, 37) if self.probe else (25, 30)
            scale_y, scale_x, line, char = struct.unpack_from('<4f', styles, 4 + 220 * 44 + 24)
            f32 = lambda value: struct.unpack('<f', struct.pack('<f', value))[0]
            expected = {'fontSize': [f32(font[0] * scale_x), f32(font[1] * scale_y)],
                        'lineSpacing': line, 'characterSpacing': char}
            assert next(row['after'] for row in rows if row['pane'] == 'T_key_Tra') == expected
            frozen_journal = json.loads((frozen / 'qwerty-first-paint.json').read_text())
            assert journal['panes'] == frozen_journal['panes']
            return {'probe': self.probe, 'fontMetrics': list(font), 'events': self.style_events,
                    'nativeStyleWrites': self.writes, 'panes': rows}

    cases = [Replay().finish(), Replay(True).finish()]
    assert dependencies == {name: hashlib.sha256((frozen / name).read_bytes()).hexdigest() for name in dependencies}
    report = {'schema': 1, 'passed': True, 'codeSha256': hashlib.sha256(base.m.C).hexdigest(),
              'fixtureSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'dependencies': dependencies, 'sourceHashes': {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                                                           for path in [raw_msbt, raw_styles]},
              'styles': {str(index): {'fontScale': list(reversed(struct.unpack_from('<2f', styles, 4 + index * 44 + 24))),
                                    'lineSpacing': struct.unpack_from('<f', styles, 4 + index * 44 + 32)[0],
                                    'characterSpacing': struct.unpack_from('<f', styles, 4 + index * 44 + 36)[0]}
                         for index in [171, 220]}, 'cases': cases,
              'boundaries': ['Decoded layout/groups, font metrics and animation submission endpoints inherited from frozen QWERTY replay.',
                             'Parsed MSBT label index and TSY1 section lookup are explicit resource endpoints; original style index arithmetic and TXT2 lookup execute.',
                             'Original named wrapper, style/text setter, capacity setter and final UTF-16 setter execute. Source-capacity buffers are preallocated.',
                             'Second case deliberately changes incoming pane and font metrics to test application versus retention; not a native mode.',
                             'No renderer, global task-manager timing or native LCD pixel claim.']}
    artifact_dir.mkdir(parents=True, exist_ok=True)
    (artifact_dir / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference-root', required=True, type=Path)
    parser.add_argument('--artifact-dir', required=True, type=Path)
    args = parser.parse_args()
    assert args.reference_root.is_absolute() and args.artifact_dir.is_absolute()
    report = verify(args.reference_root, args.artifact_dir)
    print(json.dumps({'passed': report['passed'], 'namedSetters': [[e for e in c['events'] if e['op'] == 'namedSetter'] for c in report['cases']]}))
