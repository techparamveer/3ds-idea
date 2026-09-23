"""Private original ARM differential oracle for the isolated common_back TS port.

Run with PYTHONPATH=scripts and the pinned Unicorn environment. No firmware or
numerical replay is written to the repository; output must be a new private file.
"""
import argparse
import json
from pathlib import Path
import struct
import subprocess
import unicorn
from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2,
    UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2)
from firmware.keyboard_sequence_native import Probe as Original, ENGINE, PLAYER, BACKEND
from firmware.keyboard_audio import ARCHIVE, ARCHIVE_SHA256, json_bytes, sha, source_tables
from unpack_home_resources import prepare

ROOT = Path(__file__).resolve().parents[2]
CASES = [(6, None), (7, None), (6, 0), (6, 1), (6, 10), (6, 20), (6, 48), (6, 60)]
ADDRESSES = {'play': 0x18c0ac, 'gain': 0x18c170, 'pitch': 0x18c158,
             'pan': 0x18c140, 'stop': 0x18c090}

def digest(value):
    return sha(json.dumps(value, sort_keys=True, separators=(',', ':')).encode())

class Probe(Original):
    def __init__(self, code, members):
        self.controls = []
        self.allocating = None
        super().__init__(code, members)

    def hook(self, uc, address, size, data):
        if address in ADDRESSES.values():
            kind = next(k for k, v in ADDRESSES.items() if v == address)
            slot = self.r(UC_ARM_REG_R1)
            row = {'update': self.frames, 'quantum': self.quantum, 'type': kind, 'noteSlot': slot}
            if kind == 'play':
                row.update(resource=self.r(UC_ARM_REG_R2), gain=self.r(UC_ARM_REG_S0),
                           pitch=self.r(UC_ARM_REG_S1), pan=self.r(UC_ARM_REG_S2))
                self.allocating = row
            else:
                handle = self.read(BACKEND + 4 + slot * 4)
                if not handle: raise ValueError('Native command has no wave owner')
                row['waveSlot'] = (handle - PLAYER) // 0x5c
                if kind != 'stop': row['value'] = self.r(UC_ARM_REG_S0)
            self.controls.append(row)
        if address == 0x1382a0 and self.allocating is not None:
            self.allocating['waveSlot'] = (self.r(UC_ARM_REG_R1) - PLAYER) // 0x5c
            self.allocating = None
        return super().hook(uc, address, size, data)

    def frame(self):
        super().frame()
        self.controls.append({'update': self.frames, 'quantum': self.quantum, 'type': 'wavePass'})

    def status(self):
        owners = []
        for slot in range(8):
            handle = self.read(BACKEND + 4 + slot * 4)
            if handle: owners.append({'noteSlot': slot, 'waveSlot': (handle - PLAYER) // 0x5c})
        active = bool(self.uc.mem_read(ENGINE + 0x240, 1)[0] & 1)
        notes_pending = any(self.uc.mem_read(ENGINE + i * 72 + 3, 1)[0] & 0xf9 for i in range(8))
        return {'update': self.frames, 'quantum': self.quantum, 'sequenceActive': active,
                'silent': not active and not owners and not notes_pending, 'owners': owners}


def replay_controls(code, members, controls):
    """TS controls into original wave backend; original sequencer never requested."""
    p = Original(code, members)
    for event in controls:
        p.frames, p.quantum = event['update'], event['quantum']
        kind = event['type']
        if kind == 'wavePass':
            for wave in range(17): p.run(0x117530, PLAYER + wave * 0x5c)
            continue
        if kind == 'play':
            for register, key in [(UC_ARM_REG_S0, 'gain'), (UC_ARM_REG_S1, 'pitch'), (UC_ARM_REG_S2, 'pan')]:
                p.uc.reg_write(register, event[key])
            p.run(ADDRESSES[kind], BACKEND, event['noteSlot'], event['resource'])
        else:
            if kind != 'stop': p.uc.reg_write(UC_ARM_REG_S0, event['value'])
            p.run(ADDRESSES[kind], BACKEND, event['noteSlot'])
        handle = p.read(BACKEND + 4 + event['noteSlot'] * 4)
        expected = 0 if kind == 'stop' else PLAYER + event['waveSlot'] * 0x5c
        if handle != expected: raise ValueError('TS/native wave ownership differs')
    return p.evidence()


def collect(extracted, node):
    code = (extracted / 'exefs/code.bin').read_bytes()
    raw = (extracted / 'romfs' / ARCHIVE).read_bytes()
    if sha(raw) != ARCHIVE_SHA256: raise ValueError('Unexpected keyboard archive')
    source_tables(code)  # Pin the complete original executable before evaluating any native code.
    members, _ = prepare(raw)
    cases = []
    for cue, stop in CASES:
        p = Probe(code, members)
        p.request(cue)
        if stop == 0: p.run(0x12b844, 0)
        statuses = []
        for _ in range(100):
            p.frame()
            if p.frames == stop: p.run(0x12b844, 0)
            statuses.append(p.status())
            if p.status()['silent']:
                p.frame()
                statuses.append(p.status())
                break
        else: raise ValueError('Native completion budget exhausted')
        cases.append({'cue': cue, 'stopAfterUpdate': stop, 'updates': p.frames,
                      'controls': p.controls, 'statuses': statuses, 'native': p.evidence()})
    request = [{k: c[k] for k in ('cue', 'stopAfterUpdate', 'updates')} for c in cases]
    result = subprocess.run([node, 'tests/helpers/keyboard-sequence-export.mjs'], cwd=ROOT,
                            input=json.dumps(request), text=True, capture_output=True, check=True)
    generated = json.loads(result.stdout)
    for actual, expected in zip(generated, cases, strict=True):
        for field in ('controls', 'statuses'):
            if actual[field] != expected[field]: raise ValueError(f'TS/native {field} differs for {expected["cue"], expected["stopAfterUpdate"]}')
        replay = replay_controls(code, members, actual['controls'])
        if replay['commands'] != expected['native']['commands']:
            for index, (a, b) in enumerate(zip(replay['commands'], expected['native']['commands'])):
                if a != b: raise ValueError(f'Wave command {index} differs: {a} != {b}')
            raise ValueError('Wave command counts differ')
        if replay['finalActiveVoices'] != 0: raise ValueError('Replayed loop tails remain alive')
        expected['typescriptWaveReplay'] = replay
        expected['digests'] = {field: digest(expected[field]) for field in ('controls', 'statuses')}
        expected['digests']['commands'] = digest(replay['commands'])
        print(f'cue {expected["cue"]}, stop {expected["stopAfterUpdate"]}: {len(actual["controls"])} controls, {len(replay["commands"])} commands match', flush=True)
    p = Original(code, members)
    pitch = {}
    for encoded in (256, -192, -384):
        p.run(0x1357e0, encoded & 0xffffffff)
        pitch[str(encoded)] = p.r(UC_ARM_REG_S0)
    strength = code[0xa79e7:0xa79e7 + 724]
    return {'schema': 1, 'codeSha256': sha(code), 'archiveSha256': sha(raw),
            'unicornVersion': unicorn.__version__, 'cases': cases,
            'math': {'strengthAddress': 0x1a79e7, 'strengthBytes': len(strength), 'strengthSha256': sha(strength),
                     'gainAttenuationAddress': 0x1a7cdc,
                     'gainAttenuationSubset': {str(i): struct.unpack_from('<h', code, 0xa7cdc + 2*i)[0]
                                              for i in (0, 10, 20, 30, 50, 60, 82, 110, 116, 127)},
                     'pitchOriginal1357e0': pitch,
                     'attackSubset': {str(i): code[0xa79d4 + 127-i] for i in (110, 123)}},
            'helpers': {str(path.relative_to(ROOT)): sha(path.read_bytes()) for path in [
                Path(__file__), ROOT/'tests/helpers/keyboard-sequence-export.mjs',
                *sorted((ROOT/'src/os/native-keyboard-audio').glob('*.ts')),
                *[ROOT/'scripts/firmware'/name for name in ('keyboard_sequence_native.py',
                  'keyboard_audio_parameters.py', 'keyboard_sequence.py', 'keyboard_audio.py')]]},
            'limits': ['One isolated sequence; no concurrent pool arbitration',
                       'Native wave replay executes original wave code, not a TypeScript wave transport',
                       'Inherited synthetic channel/status/mapping/stereo/queue boundaries; no hardware decoder or host clock',
                       'Backend play prepares a loop; wavePass services seventeen native wave voices in order',
                       'No browser, WebAudio, audible equivalence, interpolation or DSP claim']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extracted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    if args.output.exists() or args.output.resolve().is_relative_to(ROOT):
        raise ValueError('Output must be a new private file outside the repository')
    report = collect(args.extracted, args.node)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(json_bytes(report))
    print(f'Original/TypeScript differential evidence: {args.output}')
