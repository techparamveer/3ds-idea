#!/usr/bin/env python3
"""Bounded original-ARM clock-domain checks; firmware and outputs stay private.

Requires Unicorn and Capstone. This does not boot HOME, run DSP/GSP services,
measure wall time, or produce audio. See home_audio_FADE_CADENCE_EVIDENCE.md.
"""

import argparse
import hashlib
import json
from pathlib import Path
import struct

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import (
    UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC,
    UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
    UC_ARM_REG_R4, UC_ARM_REG_R5, UC_ARM_REG_R8, UC_ARM_REG_SP,
)

SOURCE_SHA256 = "243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9"
BASE, OBJ, STACK, END = 0x100000, 0x8000000, 0x8100000, 0x8200000
REGS = [UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3]
ARCHIVE, MANAGER, QUEUE = 0x3451FC, 0x365358, 0x3456EC
PLAYER, SOUND, DRIVER, GFX, RING = [OBJ + n for n in (0x1000, 0x2000, 0x4000, 0x5000, 0x6000)]
SEQUENCE = SOUND + 0xF4


def write(u, address, value):
    u.mem_write(address, struct.pack("<I", value & 0xFFFFFFFF))


def word(u, address):
    return struct.unpack("<I", u.mem_read(address, 4))[0]


def byte(u, address, value):
    u.mem_write(address, bytes([value]))


def return_from(u, value=0):
    u.reg_write(UC_ARM_REG_R0, value)
    u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR))


def call(u, address, values=(), until=END):
    u.reg_write(UC_ARM_REG_SP, STACK + 0x8000)
    u.reg_write(UC_ARM_REG_LR, END)
    for register, value in zip(REGS, values):
        u.reg_write(register, value & 0xFFFFFFFF)
    try:
        u.emu_start(address, until, count=500000)
    except Exception as error:
        raise RuntimeError(f"ARM failure at {u.reg_read(UC_ARM_REG_PC):#x}") from error
    assert u.reg_read(UC_ARM_REG_PC) == until, hex(u.reg_read(UC_ARM_REG_PC))


def machine(code):
    u = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    u.mem_map(BASE, 0x300000)
    u.mem_write(BASE, code)
    for address in (OBJ, STACK, END):
        u.mem_map(address, 0x10000)
    u.reg_write(UC_ARM_REG_C1_C0_2, 0xF << 20)
    u.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    return u


def sound_fixture(u):
    # Synthetic one-sound list. Vtables/offsets are checked against constructors.
    write(u, ARCHIVE + 0x20, 1)
    write(u, ARCHIVE + 0x24, PLAYER)
    write(u, PLAYER + 4, SOUND + 0xDC)
    write(u, SOUND + 0xDC, PLAYER + 4)
    write(u, SOUND, 0x3206FC)
    write(u, SEQUENCE + 0x4C, 0x320994)
    byte(u, 0x32E864, 1)
    byte(u, SOUND + 0x86, 1)
    byte(u, SOUND + 0x8A, 2)
    call(u, 0x220240, [SOUND, 180])


def host_checks(code):
    u = machine(code)
    sound_fixture(u)
    events, gains, teardown = [], [], []
    sinks = {0x1152A8, 0x115AD4, 0x115A38, 0x22C548, 0x131914, 0x226E90,
             0x1A76D8}  # Stop-time pool/list reprioritization.

    def hook(u, address, _size, _data):
        assert address not in (0x13B320, 0x2EC034, 0x1AA174)
        if address in sinks:
            events.append(hex(address))
            return_from(u)
        elif address == 0x131100:
            events.append(hex(address))
        elif address == 0x1A6414:
            # Gain/output-command submission is outside this cadence fixture.
            gains.append(word(u, SOUND + 0x70))
            return_from(u)
        elif address == 0x1313E0:
            # Keep the original epilogue; omit subsequent output commands.
            u.reg_write(UC_ARM_REG_PC, 0x131518)
        elif address == 0x1A79C0:
            teardown.append(word(u, SOUND + 0x70))
            return_from(u)

    u.hook_add(UC_HOOK_CODE, hook)
    counters = []
    for i in range(182):
        events.clear()
        call(u, 0x10C508)
        counters.append(word(u, SOUND + 0x70))
        assert counters[-1] == min(i + 1, 180)
        assert events[:4] == ["0x1152a8", "0x115ad4", "0x115a38", "0x131100"]
    assert gains == counters
    gates = []
    for pause, expected_fade, expected_pause in [(0, 11, 5), (1, 10, 6), (2, 10, 5), (3, 11, 6)]:
        write(u, SOUND + 0x70, 10)
        write(u, SOUND + 0x7C, 30)
        write(u, SOUND + 0x80, 5)
        byte(u, SOUND + 0x8B, pause)
        call(u, 0x10C508)
        assert word(u, SOUND + 0x70) == expected_fade
        assert word(u, SOUND + 0x80) == expected_pause
        gates.append({"pauseState": pause, "fadeIncrement": expected_fade - 10,
                      "pauseIncrement": expected_pause - 5})
    byte(u, SOUND + 0x8B, 0)
    byte(u, SOUND + 0x86, 0)
    byte(u, SOUND + 0x85, 1)
    readiness = []
    for ready in (0, 1):
        write(u, SOUND + 0x70, 10)
        byte(u, SOUND + 0x205, ready)  # Actual 0x2e4680 getter.
        call(u, 0x10C508)
        assert word(u, SOUND + 0x70) == 10 + ready
        readiness.append({"ready": ready, "fadeIncrement": ready})
    byte(u, 0x32E864, 0)
    events.clear()
    call(u, 0x10C508)
    assert not events and word(u, SOUND + 0x70) == 11
    byte(u, 0x32E864, 1)
    byte(u, SOUND + 0x86, 1)
    write(u, SOUND + 0x64, 0x3F800000)
    write(u, SOUND + 0x68, 0x3F800000)
    write(u, SOUND + 0x6C, 0)
    write(u, SOUND + 0x70, 0)
    call(u, 0x2349D0, [SOUND, 30])
    assert word(u, SOUND + 0x6C) == 30
    for i in range(30):
        call(u, 0x10C508)
        assert teardown == ([] if i < 29 else [30])
    return {"hostPasses": 182, "countersAtPasses1_90_179_180_182":
            [counters[i - 1] for i in (1, 90, 179, 180, 182)],
            "advanceBeforeGainSink": True, "pauseGates": gates, "readiness": readiness,
            "disabledHostCalls": 0, "stop30TeardownCounter": teardown,
            "queueBeforeBasicSound": True}


def queue_checks(code):
    u = machine(code)
    for offset in (0x300, 0x30C):
        write(u, QUEUE + offset, 0)
        write(u, QUEUE + offset + 4, QUEUE + offset + 4)
        write(u, QUEUE + offset + 8, QUEUE + offset + 4)
    node = OBJ + 0x7000
    call(u, 0x230710, [QUEUE + 0x30C, QUEUE + 0x310, node])
    write(u, node + 0xC, 3)
    write(u, node + 0x10, 180)
    write(u, node + 0x14, 0x1000019)
    dispatch = []
    pump = 0

    def hook(u, address, _size, _data):
        assert address not in (0x131100, 0x1A66BC, 0x1AA174)
        if address == 0x13336C:
            dispatch.append(pump)
            return_from(u)

    u.hook_add(UC_HOOK_CODE, hook)
    remaining = []
    for pump in range(1, 5):
        u.reg_write(UC_ARM_REG_R4, QUEUE)
        call(u, 0x115364, until=0x1153E0)
        remaining.append(word(u, node + 0xC))
    assert dispatch == [4] and remaining[:3] == [2, 1, 0]
    return {"initialCountdown": 3, "dispatchPumps": dispatch,
            "countdownsAfterFirstThreePumps": remaining[:3], "fadeCalls": 0}


def audio_checks(code):
    u = machine(code)
    sound_fixture(u)
    write(u, MANAGER + 0x1C8, MANAGER + 0x1C8)
    write(u, MANAGER + 0x1CC, MANAGER + 0x1C8)
    write(u, MANAGER + 0x1D4, MANAGER + 0x1D4)
    write(u, MANAGER + 0x1D8, MANAGER + 0x1D4)
    # Execute the real registration wrapper and real intrusive-list insert.
    call(u, 0x1A83F4, [MANAGER, SEQUENCE + 0x4C])
    assert word(u, MANAGER + 0x1D4) == SEQUENCE + 0x50
    byte(u, SEQUENCE + 0xC, 1)
    byte(u, SEQUENCE + 0xD, 1)
    byte(u, SEQUENCE + 0x72, 48)
    u.mem_write(SEQUENCE + 0x74, struct.pack("<H", 120))
    write(u, SEQUENCE + 0x60, 0x3F800000)
    u.mem_write(SEQUENCE + 0x64, struct.pack("<f", 1000))
    write(u, 0x340F7C, 1)
    write(u, DRIVER + 0x20, 0x13B320)
    write(u, DRIVER + 0x24, MANAGER)
    counts = {"wait": 0, "frameWrapper": 0, "sequenceCallback": 0, "sequenceClock": 0, "submit": 0}
    sinks = {0x23481C, 0x2347D4, 0x1468EC, 0x22C548, 0x146754, 0x2270EC,
             0x226F4C, 0x1468B4, 0x1467D8, 0x226FBC, 0x146804}

    def hook(u, address, _size, _data):
        assert address not in (0x10C508, 0x1152A8, 0x131100, 0x1A66BC)
        if address in sinks:
            return_from(u)
        elif address == 0x155A9C:
            counts["wait"] += 1
            return_from(u)
        elif address == 0x13B320:
            counts["frameWrapper"] += 1
        elif address == 0x2EC034:
            counts["sequenceCallback"] += 1
        elif address == 0x1AA174:
            counts["sequenceClock"] += 1
        elif address == 0x1546B4:
            counts["submit"] += 1
            if counts["submit"] == 37:
                byte(u, DRIVER + 0xD, 0)  # Bounded worker exit, not a source timing rule.
            return_from(u)

    u.hook_add(UC_HOOK_CODE, hook)
    call(u, 0x15135C, [DRIVER, 0])
    assert set(counts.values()) == {37}
    fraction = struct.unpack("<f", u.mem_read(SEQUENCE + 0x64, 4))[0]
    assert 900 < fraction < 1000 and word(u, SOUND + 0x70) == 0
    return {**counts, "fadeCounterAfter": 0, "fractionBefore": 1000,
            "fractionAfter": fraction, "trackList": "empty; large fraction prevents track ticks"}


def display_checks(code):
    registration = machine(code)
    write(registration, 0x33BFBC + 0x1C, GFX)

    def lock_hook(u, address, _size, _data):
        if address in (0x23481C, 0x2347D4, 0x229CF8):
            return_from(u)

    registration.hook_add(UC_HOOK_CODE, lock_hook)
    # Execute original callback registration argument setup, then real stores.
    call(registration, 0x134994, until=0x1349AC)
    assert word(registration, GFX + 0x18) == 0x143624
    assert word(registration, GFX + 0x1C) == 0x143668
    ring_dispatch = []
    for event in (2, 3):
        write(registration, GFX + 0x34, RING)
        write(registration, RING, 0x100)  # Read index0, count1.
        byte(registration, RING + 0xC, event)
        registration.reg_write(UC_ARM_REG_R4, GFX)
        registration.reg_write(UC_ARM_REG_R5, 0x2BEF)
        # 0x14bbbc uses reciprocal 0x4ec4ec4f from the worker prologue.
        registration.reg_write(UC_ARM_REG_R8, 0x4EC4EC4F)
        call(registration, 0x14BB90, until=0x14BC78)
        ring_dispatch.append([word(registration, 0x3518A8 + n) for n in (0x154, 0x158)])
    assert ring_dispatch == [[1, 0], [1, 1]]
    waits = []
    for selector, events in [(0x400, [(1, 0)]), (0x401, [(0, 1)]),
                             (0x402, [(1, 0), (0, 1)]), (0x402, [(9, 7)])]:
        u = machine(code)
        observations = []

        def event_hook(u, address, _size, _data):
            assert address not in (0x131100, 0x1AA174)
            if address == 0x138EB0:
                delta = events[len(observations)]
                observations.append(delta)
                for offset, change in zip((0x154, 0x158), delta):
                    write(u, 0x3518A8 + offset, word(u, 0x3518A8 + offset) + change)
                return_from(u)

        u.hook_add(UC_HOOK_CODE, event_hook)
        call(u, 0x2301D4, [selector])
        assert len(observations) == len(events)
        waits.append({"selector": hex(selector), "injectedCounterChanges": events,
                      "waitCalls": len(observations)})
    bypasses = []
    for gate in (0, 1):
        u = machine(code)
        write(u, 0x32E7A4 + 0x18, gate)
        write(u, 0x32E7A4 + 0x10, 1)
        seen = []

        def sync_hook(u, address, _size, _data):
            if address == 0x2301D4:
                seen.append(u.reg_read(UC_ARM_REG_R0))
                return_from(u)

        u.hook_add(UC_HOOK_CODE, sync_hook)
        call(u, 0x106D6C, [-1])
        assert seen == ([0x402] if gate == 0 else [])
        bypasses.append({"gate": gate, "waitSelectors": seen})
    return {"registeredEvents": [2, 3], "ringDispatchCounters": ring_dispatch,
            "waitCases": waits, "bypassCases": bypasses}


REGIONS = [
    ("main-loop", 0x101A38, 0x101B48), ("application-update", 0x102288, 0x102318),
    ("audio-enabled-wrapper", 0x1046BC, 0x1046E0), ("host-audio", 0x10C508, 0x10C574),
    ("archive-player-loop", 0x11296C, 0x1129AC), ("player-sound-loop", 0x130C8C, 0x130DD8),
    ("basic-sound-update", 0x131100, 0x131524), ("fade-increment", 0x1A66BC, 0x1A66E8),
    ("sequence-sound-constructor", 0x1316C8, 0x131728), ("sequence-player-constructor", 0x13B870, 0x13B8D8),
    ("basic-sound-vtables", 0x320650, 0x32072C), ("sequence-callback-vtable", 0x320994, 0x3209A8),
    ("queue-pump", 0x1152A8, 0x115400), ("sound-thread-install", 0x11D008, 0x11D120),
    ("driver-setup", 0x12D18C, 0x12D490), ("frame-callback-install", 0x1380C4, 0x138154),
    ("thread-create", 0x144990, 0x144AB4), ("audio-worker", 0x151344, 0x1514E0),
    ("audio-event-wait", 0x155A9C, 0x155BE0), ("audio-wait-svc", 0x155DCC, 0x155E24),
    ("frame-callback", 0x13B320, 0x13B524), ("sequence-register", 0x1AA4F0, 0x1AA510),
    ("sequence-list-insert", 0x1A83F0, 0x1A8408), ("sequence-callback", 0x2EC034, 0x2EC0D0),
    ("sequence-clock", 0x1AA174, 0x1AA39C), ("presentation", 0x102108, 0x102288),
    ("presentation-sync", 0x1027BC, 0x102814), ("sync-gates", 0x106CA4, 0x106DF0),
    ("display-counter-wait", 0x2301D4, 0x23025C), ("display-counter-callbacks", 0x143624, 0x1436AC),
    ("display-event-registration", 0x134980, 0x1349C0), ("display-registration-store", 0x145DF8, 0x145E44),
    ("graphics-worker-setup", 0x145AF0, 0x145CDC), ("graphics-event-dispatch", 0x14BB38, 0x14BC90),
    ("graphics-event-wait", 0x145D3C, 0x145D84), ("graphics-relay-registration", 0x14BDF4, 0x14BE44),
    ("stop-fade", 0x2349D0, 0x234ADC), ("stop-list-update", 0x1A76D8, 0x1A7764),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--code", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="Private artifact directory")
    args = parser.parse_args()
    code = args.code.read_bytes()
    if hashlib.sha256(code).hexdigest() != SOURCE_SHA256:
        raise SystemExit("Unexpected executable hash; no evidence checks run")
    args.output.mkdir(parents=True, exist_ok=True)
    table_slots = {0x320678: 0x1A6D28, 0x320724: 0x1A66BC, 0x320728: 0x1A6414,
                   0x320710: 0x2E4680, 0x32071C: 0x1A7764, 0x32099C: 0x2EC034,
                   0x3209A0: 0x1A83F0}
    for address, expected in table_slots.items():
        assert struct.unpack_from("<I", code, address - BASE)[0] == expected
    constants = {0x131720: 0x3206FC, 0x13B8D4: 0x32094C,
                 0x1AA390: 0x4E200000, 0x14BE40: 0x130042}
    for address, expected in constants.items():
        assert struct.unpack_from("<I", code, address - BASE)[0] == expected
    result = {"sourceSHA256": SOURCE_SHA256,
              "fixtureSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "host": host_checks(code), "queue": queue_checks(code),
              "audioWorker": audio_checks(code), "display": display_checks(code),
              "vtableSlots": {hex(a): hex(v) for a, v in table_slots.items()},
              "sourceConstants": {hex(a): hex(v) for a, v in constants.items()}}
    decoder = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    decoder.skipdata = True
    excerpts = {}
    for name, start, end in REGIONS:
        data = code[start - BASE:end - BASE]
        path = args.output / (name + ".asm")
        if "vtable" in name:
            lines = [f"{start + i:08x} .word 0x{struct.unpack_from('<I', data, i)[0]:08x}"
                     for i in range(0, len(data), 4)]
        else:
            lines = [f"{i.address:08x} {i.mnemonic:10} {i.op_str}"
                     for i in decoder.disasm(data, start)]
        path.write_text("\n".join(lines) + "\n")
        excerpts[name] = {"start": hex(start), "endExclusive": hex(end),
                          "sourceBytesSHA256": hashlib.sha256(data).hexdigest(),
                          "disassemblySHA256": hashlib.sha256(path.read_bytes()).hexdigest()}
    result["excerpts"] = excerpts
    result["limits"] = ("Synthetic objects and explicitly stubbed service/output endpoints. "
                        "No DSP/GSP service, wall clock, audio output, browser, or emulator boot. "
                        "Application eligibility is distinct from sound-worker frame cadence.")
    (args.output / "checked.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"passed": True, **{key: result[key] for key in ("host", "queue", "audioWorker", "display")}}))


if __name__ == "__main__":
    main()
