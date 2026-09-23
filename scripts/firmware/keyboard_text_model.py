"""Replay bounded original English Settings name-buffer insertion/backspace.

This is a text-model fixture, not an input/IME/filter or renderer emulator.
The only execution endpoint is paragraph-cache invalidation at 0x1568f0.
Requires private source/configuration inputs and Unicorn; exports no firmware.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2,
    UC_ARM_REG_R3, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC,
    UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC)

CODE_SHA = 'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0'
CONFIG_SHA = '0583eafa16bde7ac9685bb62dba3a50c57cc042b91c5471f744fce86a99f40f0'
OBJ = 0x1000000
BUFFER, PARAGRAPHS, STACK, STOP = OBJ+0x1000, OBJ+0x2000, OBJ+0xfe000, OBJ+0xff000
REGISTERS = [UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3]
# Bounded original routines reached by the plain-text fixtures, including the
# original UTF-16 move and memcpy helpers. Gaps/other code boundaries fail.
RANGES = [(0x100088, 0x100094), (0x1143e4, 0x1143f0), (0x128748, 0x1287d4),
          (0x13eb30, 0x13eb98), (0x13f584, 0x13f618), (0x140050, 0x140198),
          (0x1401f8, 0x1404bc), (0x15196c, 0x151994), (0x15651c, 0x15661c),
          (0x156618, 0x156820), (0x1569d0, 0x156ac4), (0x15a518, 0x15aab0),
          (0x15bcfc, 0x15bd84), (0x15c550, 0x15c5d8), (0x15c6d4, 0x15c730)]


def digest(data): return hashlib.sha256(data).hexdigest()


def cases():
    result = []
    for units in [[], [65], [65, 100, 97], list(map(ord, 'ABCDEFGHIJ')), [65, 0xd83d, 0xde00, 66]]:
        positions = sorted({0, len(units)//2, len(units)})
        for cursor in positions:
            for anchor in positions:
                for selection in [False, True]:
                    state = {'units': units, 'cursor': cursor, 'anchor': anchor, 'selection': selection}
                    for unit in [32, 88, 0xe9]: result.append({'op': 'insert', **state, 'unit': unit})
                    result.append({'op': 'backspace', **state})
    return result


def replay(code, config, case):
    if digest(code) != CODE_SHA or digest(config) != CONFIG_SHA:
        raise ValueError('Unexpected keyboard executable or normalized Settings name request')
    u = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    u.mem_map(0x100000, 0x200000); u.mem_write(0x100000, code)
    u.mem_map(OBJ, 0x100000)
    def word(address, value): u.mem_write(address, struct.pack('<I', value & 0xffffffff))
    def read(address): return struct.unpack('<I', u.mem_read(address, 4))[0]
    units, cursor, anchor = case['units'], case['cursor'], case['anchor']
    for offset, value in [(4, PARAGRAPHS), (8, len(units)), (12, 10), (16, BUFFER),
                          (20, cursor), (24, -1), (28, anchor)]: word(OBJ+offset, value)
    u.mem_write(OBJ+0x20, bytes([case['selection']]))
    u.mem_write(BUFFER, struct.pack('<'+'H'*len(units), *units)+b'\0\0')
    # Explicit non-composing state: +24/+28 counts, +2c composition flag,
    # +84 candidate pointer, +88 pending unit, +8c character override are zero.
    u.mem_write(0x1bd414, config)
    u.mem_write(0x1b7744, b'\1')  # English; original language query executes.
    u.mem_write(0x1b775c, b'\0')  # No prediction/composition owner update.
    word(0x1b777c, OBJ)
    for offset, value in enumerate([1, 0, 0, 0]): word(0x1bd814+offset*4, value)
    original_image = bytes(u.mem_read(0x100000, 0x200000))
    endpoints, addresses = [], set()
    def hook(uc, address, size, _):
        if address == STOP: u.emu_stop(); return
        addresses.add(address)
        if address == 0x1568f0:
            if u.reg_read(UC_ARM_REG_R0) != PARAGRAPHS: raise ValueError('Unexpected paragraph owner')
            endpoints.append({'paragraphInvalidationFrom': u.reg_read(UC_ARM_REG_R1)})
            u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR)); return
        if not any(start <= address < end for start, end in RANGES):
            raise ValueError(f'Unexpected original-code boundary {address:#x}')
    u.hook_add(UC_HOOK_CODE, hook)
    u.reg_write(UC_ARM_REG_SP, STACK); u.reg_write(UC_ARM_REG_LR, STOP)
    u.reg_write(UC_ARM_REG_C1_C0_2, 0xf << 20); u.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    for register, value in zip(REGISTERS, [OBJ, case.get('unit', 0), 0, 0]): u.reg_write(register, value)
    u.emu_start(0x140050 if case['op'] == 'backspace' else 0x1401f8, STOP, count=50000)
    if u.reg_read(UC_ARM_REG_PC) != STOP: raise ValueError('Native text-model instruction budget exhausted')
    if bytes(u.mem_read(0x100000, 0x200000)) != original_image:
        raise ValueError('Unexpected source-image/global mutation')
    length = read(OBJ+8)
    if length > 10: raise ValueError('Native nickname exceeded its capacity')
    result = {'accepted': bool(u.reg_read(UC_ARM_REG_R0)),
              'units': list(struct.unpack('<'+'H'*length, u.mem_read(BUFFER, length*2))),
              'cursor': read(OBJ+0x14), 'anchor': read(OBJ+0x1c),
              'selection': bool(u.mem_read(OBJ+0x20, 1)[0])}
    return {'input': case, 'result': result, 'endpoints': endpoints, 'addresses': sorted(addresses)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--golden', type=Path, help='Compare committed numeric cases without rewriting them')
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(Path(__file__).resolve().parents[2]):
        raise ValueError('Replay output must remain outside the repository')
    code, config = args.code.read_bytes(), args.config.read_bytes()
    rows = [replay(code, config, case) for case in cases()]
    if args.golden:
        golden = json.loads(args.golden.read_text())
        assert golden['sourceSha256'] == CODE_SHA and golden['configSha256'] == CONFIG_SHA
        assert golden['cases'] == [{k:v for k,v in row.items() if k != 'addresses'} for row in rows]
    report = {'sourceSha256': CODE_SHA, 'configSha256': CONFIG_SHA,
              'fixtureSha256': digest(Path(__file__).read_bytes()), 'cases': rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'cases': len(rows), 'goldenCompared': bool(args.golden), 'output': str(args.output)}))
