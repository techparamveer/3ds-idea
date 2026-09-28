"""Replay Camera's final cursor writer and distinguish padded/whole-gallery empty.

Requires private unicorn==2.1.4 and hash-matched EUR Camera code.bin.
No firmware is published; synthetic data is not a native screen capture.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from audit_camera_grid import CODE_SHA


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_R0,
        UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC,
    )
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, max(0x420000, (len(code) + 4095) // 4096 * 4096))
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x20000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda address: struct.unpack('<I', machine.mem_read(address, 4))[0]
    byte = lambda address: machine.mem_read(address, 1)[0]
    put = lambda address, value: machine.mem_write(address, struct.pack('<I', value))
    put_half = lambda address, value: machine.mem_write(address, struct.pack('<H', value))
    sentinel = 0x101f000

    def call(start, r0=0, r1=0, r2=0, r3=0):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), (r0, r1, r2, r3)):
            machine.reg_write(reg, value)
        machine.reg_write(UC_ARM_REG_SP, 0x101e000)
        machine.reg_write(UC_ARM_REG_LR, sentinel)
        machine.emu_start(start, sentinel, count=10000)
        assert machine.reg_read(UC_ARM_REG_PC) == sentinel

    # Static initializer supplies the actual browse pane names/rates/callbacks.
    call(0x3205a8)
    name_pointer = word(0x47ed08 + 9 * 4)
    assert bytes(machine.mem_read(name_pointer, 11)) == b'BrwsNoData\0'
    assert word(0x47ed68 + 9 * 8) == 0x2fb564
    assert word(0x41f8b8 + 0x34) == 0x270cc4
    assert word(0x41f8b8 + 0x3c) == 0x28c358
    assert word(0x41f8b8 + 0x40) == 0x27135c
    assert word(0x41f8b8 + 0x44) == 0x28ba1c
    assert word(0x41f8b8 + 0x58) == 0x28bcf4

    owner, renderer, cursor, pane, translations = (0x1000000, 0x1006000, 0x1007000, 0x1008000, 0x1009000)
    put(renderer + 0x16c, owner)
    put(owner + 0x2228, cursor)
    put(cursor + 0x68, pane)
    machine.mem_write(owner + 0x2244, struct.pack('<fff', 0, 13, 0))
    machine.mem_write(owner + 0x2268, struct.pack('<ff', 228, 132))

    def cursor_case(count, index, scroll, page=1):
        put_half(owner + 0x34, count)
        put_half(owner + 0x36, count)
        put_half(owner + 0x38, 0)
        put_half(owner + 0x2232, index)
        # Buffer layout is mod-three, with page starts separated by 248px.
        for logical_page in range(page - 1, page + 2):
            machine.mem_write(translations + logical_page % 3 * 12,
                              struct.pack('<fff', logical_page * 248 + scroll, 0, 0))
        machine.mem_write(pane + 0xb7, b'\xa1')
        call(0x2db8d4, renderer, 0, page, translations)
        x, y = struct.unpack('<ff', machine.mem_read(cursor + 0x9c, 8))
        return {'count': count, 'index': index, 'scroll': scroll,
                'visible': bool(byte(pane + 0xb7) & 1),
                'unrelatedFlagBits': byte(pane + 0xb7) & 0xfe,
                'screenCentre': [160 + x, 120 - y]}

    cases = [cursor_case(7, 9, -86), cursor_case(7, 11, -86),
             cursor_case(7, 12, -86), cursor_case(0, 0, 0),
             cursor_case(7, 9, -400), cursor_case(7, 6, -86)]
    assert cases[0]['visible'] and cases[0]['screenCentre'] == [246, 140]
    assert not cases[1]['visible']  # valid padded cell, but outside +/-192px clip
    assert not cases[2]['visible']  # first index beyond padded count 12
    assert not cases[3]['visible']  # truly empty browse
    assert not cases[4]['visible']  # selected blank outside horizontal clip
    assert cases[5]['visible'] and cases[5]['screenCentre'] == [246, 74]
    assert all(case['unrelatedFlagBits'] == 0xa0 for case in cases)

    # Execute whole routine: with real items, the BrwsNoData path exits before
    # touching the pane. No stubs, instruction patches or intercepted calls.
    scene, gallery, app_owner, widget, blank_pane = (0x100a000, 0x100b000, 0x100c000, 0x100e000, 0x100f000)
    put(app_owner + 0x48, scene)
    put(scene + 0x58, gallery)
    put(gallery + 0x18, 0x1000000)
    put(gallery + 0x1c, 0x1000000 + 7 * 8)
    put(app_owner + 0x3c0, widget)
    put(widget, 0x420de8)
    put(widget + 0x128, blank_pane)
    call(0x283ff8, app_owner, 0)
    assert byte(widget + 0x12c) == 0 and byte(blank_pane + 0xb7) == 0

    # Separately exercise the real no-data state setter and pane writer.
    # Alpha endpoints are synthetic, explicitly not a default-material claim.
    machine.mem_write(widget + 0x33c, struct.pack('<ff', 0, 255))
    call(0x215d64, widget, 9, 1)
    machine.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', 1))[0])
    call(0x2fb564, widget)
    assert byte(blank_pane + 0xb7) & 1 and byte(blank_pane + 0xb4) == 255
    # Rebuild the original owner's event tables (skip only the unrelated
    # registration prologue/stack epilogue of the static initializer).
    machine.emu_start(0x31bfbc, 0x31c328, count=10000)
    assert machine.reg_read(UC_ARM_REG_PC) == 0x31c328
    event = 0x1010000
    put(event + 4, 0x23)
    repeat_blank_states = []
    for state in (1, 2, 6):
        machine.mem_write(app_owner + 0x7ba, bytes([state]))
        before = bytes(machine.mem_read(app_owner, 0x1800))
        call(0x28bcf4, app_owner, event)
        assert bytes(machine.mem_read(app_owner, 0x1800)) == before
        repeat_blank_states.append(state)

    # Changed blank goes through the complete owner event handler. A null
    # source-control payload skips RTTI; the source permits this explicitly.
    # Pane state and animation-list state are synthetic, with no rendering.
    put(event + 4, 0x22)
    put(app_owner + 0x12b8, 0x1011000)
    machine.mem_write(app_owner + 0x7ba, b'\x01')
    for index in range(12):
        machine.mem_write(widget + 0x30 + index * 0x1c, b'\x01')
    call(0x28bcf4, app_owner, event)
    assert byte(app_owner + 0xce0) == 2 and byte(app_owner + 0x8fa) == 1
    fade_out_indices = [i for i in range(12) if byte(widget + 0x30 + i * 0x1c) == 3]
    assert fade_out_indices == [0, 2, 6, 7, 8, 9, 10, 11]
    # Real cancellation entry, before any new touch or direction dispatch.
    manager = 0x1012000
    put(word(0x2d5ac4), manager)
    put(scene + 0x11c, owner)
    cancellation = []
    for state in (0, 1, 2, 3):
        machine.mem_write(owner + 4, bytes([state, 0xff]))
        machine.mem_write(scene + 0x7c, b'\x01\x01')
        call(0x2d5740, scene)  # manager +0x254 is zero: cancel gate
        assert bytes(machine.mem_read(scene + 0x7c, 2)) == b'\0\0'
        next_state = byte(owner + 4)
        assert next_state == (3 if state == 3 else 2)
        assert byte(owner + 5) == (0xff if state == 3 else state)
        cancellation.append({'previousState': state, 'nextState': next_state,
                             'captureCleared': True, 'dragCleared': True})

    # The owner's +0xce4 is notes::lyt::FadeAll, not an image decoder.
    call(0x3199cc)  # source color constants, including RGB e5/e0/d8
    fade = 0x1013000
    call(0x22026c, fade)
    put(fade, 0x41e638)
    put(app_owner + 0xce4, fade)
    machine.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', 12))[0])
    call(0x2591a4, fade, 2)
    assert bytes(machine.mem_read(fade + 0x9a, 8)) == bytes.fromhex('00000000000000ff'), bytes(machine.mem_read(fade + 0x9a, 8)).hex()
    fade_samples = []
    for update in range(1, 15):
        machine.mem_write(fade + 0x38, struct.pack('<f', 1))
        call(0x26de78, fade)
        fade_samples.append({'update': update, 'state': byte(fade + 0x80),
                             'rgba': bytes(machine.mem_read(fade + 0xa4, 4)).hex()})
    assert fade_samples[-1]['state'] == 1
    assert fade_samples[-1]['rgba'] == '000000ff'
    # Owner helper schedules the inverse black fade with the same native 12.
    call(0x20f450, app_owner)
    assert bytes(machine.mem_read(fade + 0x9a, 8)) == bytes.fromhex('000000ff00000000')
    fade_in_samples = []
    for update in range(1, 13):
        call(0x26de78, fade)
        fade_in_samples.append({'update': update, 'state': byte(fade + 0x80),
                                'rgba': bytes(machine.mem_read(fade + 0xa4, 4)).hex()})
    assert fade_in_samples[-1]['state'] == 1
    assert fade_in_samples[-1]['rgba'] == '00000000'
    return {'ok': True, 'codeSha256': CODE_SHA, 'cursorCases': cases,
            'wholeGalleryEmptyPane': 'BrwsNoData', 'paneIndex': 9,
            'populatedGallerySkipsNoDataRoutine': True,
            'repeatBlankOwnerStateIndicesWithNoMutation': repeat_blank_states,
            'changedBlankFadeOutIndices': fade_out_indices,
            'cancelGateSamples': cancellation, 'nativeFadeAllSamples': fade_samples,
            'nativeFadeAllInverseSamples': fade_in_samples,
            'nativeNoDataPaneWriterVerifiedWithSyntheticAlphaEndpoints': True,
            'scope': 'Original ARM cursor/pane writers, owner blank events, cancellation gate and FadeAll component with synthetic state. Full image lifecycle, ordered scene traversal, browser ordering and native screen equivalence are not claimed.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
