#!/usr/bin/env python3
"""Execute the original Settings HOME title worker against its real CBMD.

Archive operations and allocation results are supplied. Original generic
primary constructors, CBMD selection and LZ11 decode execute. No native CGFX
binding or GPU runs.
"""

import argparse
import hashlib
import importlib.util
import json
import struct
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.arm_const import (UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC,
                               UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2,
                               UC_ARM_REG_R3, UC_ARM_REG_SP)

CODE_SHA = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
BANNER_SHA = '5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac'
MODEL_SHA = '96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d'
WORKER_FILE = Path(__file__).with_name('replay-settings-banner-workers.py')
spec = importlib.util.spec_from_file_location('settings_workers', WORKER_FILE)
workers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workers)


def run(code, banner, model):
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    assert hashlib.sha256(banner).hexdigest() == BANNER_SHA
    assert model['sourceSha256'] == MODEL_SHA
    assert model['cbmd']['usedCommon'] is True
    assert model['cbmd']['modelOffset'] == 0x88
    assert struct.unpack_from('<I', banner, 8)[0] == 0x88
    assert struct.unpack_from('<I', banner, 12)[0] == 0  # EUR-English fallback
    allocations = iter((0x500400, 0x500500))

    def setup(uc):
        uc.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        workers.write32(uc, 0x31f31c, 0x510030)
        workers.write32(uc, 0x510000, 0)
        workers.write32(uc, 0x31f328, 0)
        uc.mem_write(0x500008, struct.pack('<IIB', 0x22000, 0x40010, 0))
        workers.write32(uc, workers.MANAGER + 0xd8, 0x800000)
        workers.write32(uc, workers.MANAGER + 0xcc, 0x900000)
        workers.write32(uc, workers.MANAGER + 0xd0, 0x980000)

    def archive_length(uc):
        workers.write32(uc, uc.reg_read(UC_ARM_REG_R1), len(banner))
        workers.write32(uc, uc.reg_read(UC_ARM_REG_R1) + 4, 0)
        return 0

    def archive_read(uc):
        uc.mem_write(0x800000, banner)
        workers.write32(uc, uc.reg_read(UC_ARM_REG_R1), len(banner))
        return 0

    uc, events = workers.run(code, entry=0x24c930, stop={0x700000},
                             stubs={0x161e14: 0, 0x22bd38: archive_length,
                                    0x22650c: 0,
                                    0x23546c: lambda _: next(allocations),
                                    0x2360f4: 0,
                                    0x235500: 0,
                                    0x22bca8: archive_read, 0x244ff8: 1,
                                    0x22bc68: 0},
                             setup=setup, count=2_000_000,
                             observe={0x1fa0fc, 0x1fa110, 0x2201cc,
                                      0x220070, 0x24cba8})
    clear_size = struct.unpack_from('<I', banner, 0x88)[0] >> 8
    decoded_sha = hashlib.sha256(uc.mem_read(0x900000, clear_size)).hexdigest()
    size_calls = sum(event == ['visit', '0x2201cc'] for event in events)
    decode_calls = sum(event == ['visit', '0x220070'] for event in events)
    completion = uc.mem_read(0x500000, 1)[0]
    primary = workers.read32(uc, workers.MANAGER + 0x50)
    secondary = workers.read32(uc, workers.MANAGER + 0x54)
    assert (clear_size, decoded_sha) == (137792, MODEL_SHA)
    assert (size_calls, decode_calls, completion) == (1, 1, 1)
    assert (primary, secondary) == (0x500400, 0x500500)
    assert workers.read32(uc, primary) == 0x3210f0
    assert workers.read32(uc, secondary) == 0x3210f0
    assert sum(event == ['visit', '0x1fa0fc'] for event in events) == 2
    assert ['visit', '0x24cba8'] in events
    assert workers.read32(uc, primary + 0x24) == 0
    # Replay the exact state-4 COMMON call arguments on the same constructed
    # candidate. Stop at the first graphics-object creation service, since its
    # real model/scene owner is not supplied by the title-worker fixture.
    bind_visits = []

    def bind_hook(machine, address, size, _):
        if address in (0x24def0, 0x24ed40, 0x2354a0):
            bind_visits.append(hex(address))
        if address == 0x2354a0:
            machine.emu_stop()

    uc.hook_add(UC_HOOK_CODE, bind_hook)
    uc.reg_write(UC_ARM_REG_SP, 0x600800)
    uc.reg_write(UC_ARM_REG_LR, 0x700000)
    uc.reg_write(UC_ARM_REG_R0, primary)
    uc.reg_write(UC_ARM_REG_R1, workers.read32(uc, workers.MANAGER + 0xcc))
    uc.reg_write(UC_ARM_REG_R2, 0x3072e0)  # literal COMMON at 0x249c7c
    uc.reg_write(UC_ARM_REG_R3, 0x3072e0)
    uc.emu_start(0x24def0, 0x700004, count=1000)
    assert uc.reg_read(UC_ARM_REG_PC) == 0x2354a0
    assert bind_visits == ['0x24def0', '0x24ed40', '0x2354a0']
    return {'homeCodeSha256': CODE_SHA, 'settingsBannerSha256': BANNER_SHA,
            'selectedCgfxSha256': MODEL_SHA, 'selectedLanguage': 'eur-en',
            'usedCommonFallback': True, 'commonOffset': '0x88',
            'eurEnglishOverrideOffset': '0x0', 'decodedBytes': clear_size,
            'nativeSizeCalls': size_calls, 'nativeDecodeCalls': decode_calls,
            'completionByte': completion, 'primaryCandidate': hex(primary),
            'secondaryCandidate': hex(secondary),
            'candidateVtable': '0x3210f0', 'nativeConstructorCalls': 2,
            'commonBindVisits': bind_visits,
            'bindServiceStop': '0x2354a0',
            'scope': 'Original title worker 0x24c930 executes on hash-pinned Settings CBMD. Archive I/O and allocation results are supplied. Two original 0x1fa0fc generic-primary constructors execute; native 0x2201cc/0x220070 decode the real common CGFX once. On that same constructed candidate, the source state-4 COMMON call arguments enter 0x24def0/0x24ed40 and stop before unsupplied graphics-object creation service 0x2354a0. The decoded CGFX is not bound; no visible pose or pixels are observed.'}


def main():
    parser = argparse.ArgumentParser()
    for name in ('code', 'banner', 'model'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    if any(not getattr(args, name).is_absolute() for name in ('code', 'banner', 'model')):
        parser.error('all paths must be absolute')
    result = run(args.code.read_bytes(), args.banner.read_bytes(),
                 json.loads(args.model.read_text()))
    print(json.dumps(result, indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
