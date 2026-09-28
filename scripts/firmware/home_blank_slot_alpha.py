#!/usr/bin/env python3
"""Check original ARM blank-slot pane alpha; keep firmware/output private.

Requires Unicorn and Capstone. Synthetic objects replace resource loading and
draw submission. This does not boot HOME or emulate GPU sampling/compositing.
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
    UC_ARM_REG_R4, UC_ARM_REG_R5, UC_ARM_REG_R6, UC_ARM_REG_SP,
)
from native import decode_layout

SOURCE_SHA256 = "243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9"
BASE, HEAP, STACK, END = 0x100000, 0x8000000, 0x8100000, 0x8200000
SLOT, PANE, MATERIAL, TEXSRT = [HEAP + n for n in (0, 0x1000, 0x2000, 0x3000)]
SCENE, MANAGER, CONFIG, COLORS = [HEAP + n for n in (0x5000, 0x7000, 0x8000, 0x9000)]
REGS = [UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3]


def put(u, address, value):
    u.mem_write(address, struct.pack("<I", value & 0xffffffff))


def get(u, address):
    return struct.unpack("<I", u.mem_read(address, 4))[0]


def byte(u, address, value):
    u.mem_write(address, bytes([value & 255]))


def octet(u, address):
    return u.mem_read(address, 1)[0]


def returned(u, value=0):
    u.reg_write(UC_ARM_REG_R0, value)
    u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR))


def call(u, address, values=(), until=END):
    u.reg_write(UC_ARM_REG_SP, STACK + 0x8000)
    u.reg_write(UC_ARM_REG_LR, END)
    for register, value in zip(REGS, values):
        u.reg_write(register, value & 0xffffffff)
    try:
        u.emu_start(address, until, count=100000)
    except Exception as error:
        raise RuntimeError(f"ARM failure at {u.reg_read(UC_ARM_REG_PC):#x}") from error
    assert u.reg_read(UC_ARM_REG_PC) == until


def machine(code):
    u = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    u.mem_map(BASE, 0x300000)
    u.mem_write(BASE, code)
    u.mem_map(HEAP, 0x40000)
    u.mem_map(STACK, 0x10000)
    u.mem_map(END, 0x1000)
    u.reg_write(UC_ARM_REG_C1_C0_2, 0xf << 20)
    u.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    return u


def mapping_checks(code):
    u = machine(code)
    names = []

    def hook(u, address, _size, _data):
        if address == 0x22a72c:  # Resource parsing/loading outside the fixture.
            returned(u)
        elif address == 0x2292e4:  # Named-pane lookup against synthetic panes.
            pointer = u.reg_read(UC_ARM_REG_R1)
            name = bytes(u.mem_read(pointer, 32)).split(b"\0")[0].decode()
            names.append(name)
            returned(u, PANE + len(names) * 0x200)

    u.hook_add(UC_HOOK_CODE, hook)
    call(u, 0x2570d0, [SLOT, 0, 0, 0], until=0x257110)
    assert names == ["P_Icon_00", "B_Icon_00", "P_IconBtnDmy_00"]
    assert [get(u, SLOT + n) for n in (0x80, 0x84, 0x88)] == [PANE + n * 0x200 for n in (1, 2, 3)]

    # The native resource-to-pane field copy: resource alpha at +0xa -> +0xb4/+0xb5.
    copied = []
    for alpha in (0, 128, 255):
        byte(u, HEAP + 0x400a, alpha)
        u.reg_write(UC_ARM_REG_R4, PANE)
        u.reg_write(UC_ARM_REG_R5, HEAP + 0x4000)
        call(u, 0x209654, until=0x209660)
        assert octet(u, PANE + 0xb4) == octet(u, PANE + 0xb5) == alpha
        copied.append(alpha)

    inherited = []
    put(u, PANE + 0xc, PANE + 0x200)
    byte(u, PANE + 0xb4, 128)
    for enabled, factor, expected in ((0, 0.25, 128), (1, 1.0, 128), (1, 0.5, 64)):
        byte(u, HEAP + 0x4088, enabled)
        u.mem_write(HEAP + 0x407c, struct.pack("<f", factor))
        u.reg_write(UC_ARM_REG_R4, PANE)
        u.reg_write(UC_ARM_REG_R6, HEAP + 0x4000)
        call(u, 0x1a1ea0, until=0x1a1ed4)
        assert octet(u, PANE + 0xb5) == expected
        inherited.append({"enabled": enabled, "factor": factor, "appliedAlpha": expected})
    return {"namesAtOffsets80_84_88": names, "resourceAlphaCopies": copied, "inheritedAlpha": inherited}


def setter_checks(code):
    u = machine(code)
    put(u, SLOT + 0x80, PANE + 0x200)
    put(u, SLOT + 0x88, PANE)
    put(u, SLOT + 0x9c, MATERIAL)
    put(u, MATERIAL + 0x34, TEXSRT)
    # Execute real geometry/texture-SRT helper with initialized synthetic scales.
    u.mem_write(0x33c678, struct.pack("<12f", *([1.0] * 12)))
    events, uvs = [], []

    def hook(u, address, _size, _data):
        if address == 0x206458:  # Capture UV submission; no real picture buffers.
            uvs.append({"pane": u.reg_read(UC_ARM_REG_R0),
                        "set": u.reg_read(UC_ARM_REG_R1),
                        "uv": list(struct.unpack("<8f", u.mem_read(u.reg_read(UC_ARM_REG_R2), 32)))})
            returned(u)
        elif address == 0x1f5f38:  # Subsequent layout refresh/draw preparation.
            events.append(octet(u, PANE + 0xb4))
            returned(u)

    u.hook_add(UC_HOOK_CODE, hook)
    cases = []
    for category in range(-1, 10):
        events.clear()
        uvs.clear()
        byte(u, SLOT + 0x8c, 127)
        byte(u, PANE + 0xb4, 19)
        expected = 128 if category == 5 else 220 if category == 3 else 255
        call(u, 0x1f5cf4, [SLOT, category])
        assert octet(u, SLOT + 0x8c) == category & 255
        assert octet(u, PANE + 0xb4) == expected and events == [expected]
        if category == 5:
            assert uvs == [{"pane": PANE, "set": 0,
                            "uv": [-0.25, 0.375, 0.25, 0.375, -0.25, 0.625, 0.25, 0.625]}]
        cases.append({"category": category, "alpha": expected, "uvSubmissions": uvs.copy()})
        events.clear()
        call(u, 0x1f5cf4, [SLOT, category])
        assert not events  # Already-correct alpha avoids the refresh callback.
    return cases


def policy_checks(code):
    u = machine(code)
    slots, events = [], []
    for index in range(80):
        slot = HEAP + 0x10000 + index * 0x400
        pane = slot + 0x200
        category = (5, 3, 1, -1)[index % 4]
        put(u, SCENE + 0x830 + index * 4, slot)
        put(u, slot + 0x88, pane)
        byte(u, slot + 0x8c, category)
        byte(u, pane + 0xb4, 19)
        slots.append((slot, pane, category))

    def hook(u, address, _size, _data):
        if address == 0x1f5f38:  # Layout refresh endpoint only.
            events.append(u.reg_read(UC_ARM_REG_R0))
            returned(u)
        elif address == 0x217a90:  # Theme/configuration manager accessor only.
            returned(u, MANAGER)

    u.hook_add(UC_HOOK_CODE, hook)
    direct = []
    for enabled in (0, 1, 2):
        events.clear()
        call(u, 0x1d6ad4, [SCENE, enabled])
        alpha = 128 if enabled else 32
        assert get(u, 0x33c664) == alpha
        for _, pane, category in slots:
            assert octet(u, pane + 0xb4) == (alpha if category == 5 else 220 if category == 3 else 255)
        assert len(events) == (80 if enabled == 0 else 20 if enabled == 1 else 0)
        direct.append({"argument": enabled, "blankAlpha": alpha, "refreshCount": len(events)})

    put(u, MANAGER + 0x14, CONFIG)
    put(u, MANAGER + 0x18, COLORS)
    routes = []
    for active, argument, field7, field12, field14, expected in (
        (0, 0, 0, 0, 0, 128), (0, 1, 0, 0, 0, 128),
        (1, 0, 3, 0, 0, 32), (1, 0, 0, 1, 0, 128),
        (1, 1, 0, 0, 1, 128), (1, 0, 0, 0, 0, 128),
    ):
        for offset, value in ((0x1f1, active), (7, field7), (0x12, field12), (0x14, field14)):
            byte(u, CONFIG + offset, value)
        # Force refresh; stop before the unrelated controller/render loop.
        call(u, 0x1df9d0, [SCENE, argument, 1], until=0x1dfdd8)
        assert get(u, 0x33c664) == expected
        routes.append({"active": active, "argument": argument, "field7": field7,
                       "field12": field12, "field14": field14, "blankAlpha": expected})
    return {"slotCount": 80, "direct": direct, "configurationRoutes": routes}


def resources(directory):
    result = {}
    for name, pane_names in (
        ("LncIconSetSrc_00", ["N_Color_01", "P_Blank_00"]),
        ("LncIconDist_01", ["P_IconBtnDmy_00"]),
    ):
        data = (directory / (name + ".bclyt")).read_bytes()
        layout = decode_layout(data)
        panes = {}

        def walk(items):
            for pane in items:
                panes[pane["name"]] = pane
                walk(pane["children"])

        walk(layout["roots"])
        assert all(panes[n]["alpha"] == 255 for n in pane_names)
        result[name] = {"sha256": hashlib.sha256(data).hexdigest(),
                        "authoredPaneAlphas": {n: panes[n]["alpha"] for n in pane_names}}
    return result


REGIONS = [
    ("slot-pane-mapping", 0x2570d0, 0x257110),
    ("pane-resource-alpha", 0x209554, 0x209670),
    ("pane-inherited-alpha", 0x1a1ea0, 0x1a1f14),
    ("category-setter", 0x1f5cf4, 0x1f5efc),
    ("category-geometry", 0x256e14, 0x256f14),
    ("category-alpha-refresh", 0x25701c, 0x257080),
    ("all-slot-alpha-policy", 0x1d6ad4, 0x1d6b14),
    ("configuration-policy", 0x1df9d0, 0x1dfe68),
    ("atlas-load", 0x2b1dd8, 0x2b1df8),
    ("final-layout-load", 0x2b1ef8, 0x2b1f58),
    ("atlas-final-bind-call", 0x2b2238, 0x2b224c),
    ("atlas-descriptor-copy", 0x1d9c68, 0x1d9cdc),
    ("source-draw-target", 0x2453b8, 0x2455bc),
    ("blank-rebind-and-set", 0x29e4f4, 0x29e56c),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--code", required=True, type=Path)
    parser.add_argument("--layouts", required=True, type=Path, help="Private launcher_LZ/blyt directory")
    parser.add_argument("--output", required=True, type=Path, help="Private artifact directory")
    args = parser.parse_args()
    code = args.code.read_bytes()
    if hashlib.sha256(code).hexdigest() != SOURCE_SHA256:
        raise SystemExit("Unexpected executable hash; no evidence checks run")
    assert struct.unpack_from("<I", code, 0x33c664 - BASE)[0] == 128
    result = {"sourceSHA256": SOURCE_SHA256,
              "fixtureSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "mapping": mapping_checks(code), "categories": setter_checks(code),
              "policy": policy_checks(code), "resources": resources(args.layouts)}
    args.output.mkdir(parents=True, exist_ok=True)
    decoder = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    decoder.skipdata = True
    excerpts = {}
    for name, start, end in REGIONS:
        data = code[start - BASE:end - BASE]
        path = args.output / (name + ".asm")
        path.write_text("\n".join(f"{i.address:08x} {i.mnemonic:10} {i.op_str}"
                                  for i in decoder.disasm(data, start)) + "\n")
        excerpts[name] = {"start": hex(start), "endExclusive": hex(end),
                          "sourceBytesSHA256": hashlib.sha256(data).hexdigest(),
                          "disassemblySHA256": hashlib.sha256(path.read_bytes()).hexdigest()}
    result["excerpts"] = excerpts
    result["limits"] = ("Synthetic panes and configuration; resource loader, named lookup, UV submission, "
                        "layout refresh, and manager accessor explicitly stubbed. Original setter, "
                        "geometry/SRT, alpha refresh, 80-slot loop and configuration selection executed. "
                        "No GPU blend/filter/readback proof, browser pixels, or emulator boot.")
    (args.output / "checked.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"passed": True, "categories": len(result["categories"]),
                      "policy": result["policy"], "resources": result["resources"]}))


if __name__ == "__main__":
    main()
