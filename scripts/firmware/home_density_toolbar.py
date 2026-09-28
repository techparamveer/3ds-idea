#!/usr/bin/env python3
"""Bounded original-ARM density-button availability and input checks.

Requires the adjacent blank-slot fixture helpers, Unicorn and Capstone.
No browser, emulator, firmware mutation or application changes.
"""

import argparse
import hashlib
import json
from pathlib import Path
import struct

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2
from home_blank_slot_alpha import SOURCE_SHA256, BASE, HEAP, machine, call, put, get, byte, octet, returned
from native import decode_animation

SCENE, DOWN, UP, LAYOUT, STATS = [HEAP + n for n in (0, 0x5000, 0x6000, 0x7000, 0x8000)]
VTABLE = 0x3214b0


def setup(code):
    u = machine(code)
    events = []
    put(u, SCENE + 0xf34, DOWN)
    put(u, SCENE + 0xf38, UP)
    put(u, SCENE + 0x1164, STATS)
    byte(u, LAYOUT + 0x60, 1)
    for button in (DOWN, UP):
        put(u, button, VTABLE)
        byte(u, button + 0x14, 1)
        put(u, button + 0x18, button + 0x30)
        put(u, button + 0x30, LAYOUT)
        for offset in (8, 0x10, 0x18):
            put(u, button + 0x30 + offset, button + 0x100 + offset)

    def hook(u, address, _size, _data):
        r0, r1, r2 = [u.reg_read(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2)]
        if address in (0x1f7274, 0x1f723c, 0x2292f8):
            # Record controller stop/start/endpoint submission. No animation draw.
            events.append({"call": hex(address), "button": hex(r0), "argument": hex(r1), "r2": r2})
            returned(u)
        elif address == 0x224814:
            # Supplied in-bounds hit; disabled widgets have an invalid-hit route.
            events.append({"call": hex(address)})
            returned(u, 1)
        elif address in (0x1f6674, 0x1f7048, 0x1f7198, 0x2686ac, 0x1da8c4):
            # Separate overlay policy, input owner/sound, modal gate and geometry.
            returned(u)
        elif address in (0x2ebb00, 0x1e8f38):
            events.append({"call": hex(address), "argument": r1, "r2": r2})
            returned(u)

    u.hook_add(UC_HOOK_CODE, hook)
    return u, events


def availability(code):
    u, events = setup(code)
    cases = []
    for folder in (-1, 0, 59):
        byte(u, SCENE + 0x1170, folder)
        for current in range(6):
            put(u, SCENE + 0x118c, current)
            u.mem_write(SCENE + 0x1194, struct.pack("<f", current + .375))
            for target in range(6):
                put(u, SCENE + 0x1190, target)
                for button in (DOWN, UP):
                    put(u, button + 0x10, 1)  # Simulate a previous press state.
                    byte(u, button + 0xc, 1)
                events.clear()
                call(u, 0x1ebe2c, [SCENE])
                enabled = [target > (0 if folder == -1 else 1), target < 5]
                for button, expected in zip((DOWN, UP), enabled):
                    assert get(u, button + 0x10) == (0 if expected else 5)
                    assert octet(u, button + 0xc) == 0
                    relevant = [e for e in events if e.get("button") == hex(button)]
                    assert [e["call"] for e in relevant] == ["0x1f7274", "0x2292f8" if expected else "0x1f723c"]
                    assert relevant[-1]["argument"] == hex(button + (0x108 if expected else 0x118))
                    if expected:
                        assert relevant[-1]["r2"] == 1  # Select endpoint/reset.
                cases.append({"folder": folder, "current": current, "target": target,
                              "decreaseEnabled": enabled[0], "increaseEnabled": enabled[1]})
    return cases


def input_dispatch(code):
    u, events = setup(code)
    cases = []
    for enabled in (False, True):
        call(u, 0x250208, [DOWN, int(enabled), 1, 0])
        events.clear()
        byte(u, 0x32e78c, 0)
        byte(u, 0x32e9e1, 1)
        byte(u, 0x32e9e2, 0)
        call(u, 0x2558ac, [DOWN])
        hit_count = sum(e["call"] == "0x224814" for e in events)
        starts = [e for e in events if e["call"] == "0x1f723c"]
        assert hit_count == 1
        assert len(starts) == int(enabled)
        assert get(u, DOWN + 0x10) == (1 if enabled else 5)
        cases.append({"enabled": enabled, "hitCalls": hit_count,
                      "selectStarts": len(starts), "resultState": get(u, DOWN + 0x10)})
    return cases


def raw_density_callback(code):
    u, events = setup(code)
    cases = []
    for folder in (-1, 0):
        byte(u, SCENE + 0x1170, folder)
        for target in range(6):
            for button, delta in ((DOWN, -1), (UP, 1)):
                put(u, SCENE + 0x1190, target)
                events.clear()
                call(u, 0x2a3db8, [SCENE, button, 0])
                expected = max(0, min(5, target + delta))
                assert get(u, SCENE + 0x1190) == expected
                transitions = [e for e in events if e["call"] == "0x1e8f38"]
                assert len(transitions) == int(expected != target)
                if transitions:
                    assert transitions[0]["argument"] == 5
                cases.append({"folder": folder, "from": target, "delta": delta, "to": expected})
    return cases


def resource_checks(directory, launcher):
    result = {}
    for suffix in ("Select", "Decide", "Invalid"):
        data = (directory / ("LncBase_D_01_" + suffix + ".bclan")).read_bytes()
        clip = decode_animation(data)
        result[suffix] = {"sha256": hashlib.sha256(data).hexdigest(),
                          "frames": clip["frames"], "loop": clip["loop"],
                          "densityTracks": [t for t in clip["tracks"] if t["target"] in ("P_Dw_20", "P_Up_20", "P_DwP_20", "P_UpP_20")]}
    invalid = result["Invalid"]
    assert invalid["frames"] == 2 and not invalid["loop"]
    assert len(invalid["densityTracks"]) == 2
    for track in invalid["densityTracks"]:
        assert track["property"] == "alpha" and track["keys"] == [{"frame": 0.0, "value": 120.0, "slope": 0.0}]
    pack = json.loads(launcher.read_text())
    groups = {}

    def visit(items):
        for group in items:
            groups[group["name"]] = group["panes"]
            visit(group["children"])

    visit(pack["layouts"]["LncBase_D_01"]["groups"])
    assert "P_Dw_20" in groups["G_Dw_00"] and "P_Up_20" not in groups["G_Dw_00"]
    assert "P_Up_20" in groups["G_Up_00"] and "P_Dw_20" not in groups["G_Up_00"]
    result["groups"] = {name: groups[name] for name in ("G_Dw_00", "G_Up_00")}
    result["launcherSHA256"] = hashlib.sha256(launcher.read_bytes()).hexdigest()
    return result


REGIONS = [
    ("density-button-construction", 0x2b42c0, 0x2b4354),
    ("density-count-and-minimum", 0x2eb78c, 0x2eb7b4),
    ("availability-refresh", 0x1ebe2c, 0x1ebf5c),
    ("button-enable-invalid", 0x250208, 0x2502c4),
    ("button-update-dispatch", 0x2558ac, 0x255984),
    ("new-press-hit", 0x255568, 0x255670),
    ("invalid-hit", 0x2556a8, 0x255774),
    ("button-parameter-defaults", 0x22a60c, 0x22a658),
    ("density-action", 0x2a3db8, 0x2a3fe4),
    ("density-mode-setup", 0x1e3f68, 0x1e3fd4),
    ("density-mode-button-refresh", 0x1dee8c, 0x1deefc),
    ("controller-start-wrapper", 0x1f723c, 0x1f7274),
    ("controller-endpoint-wrapper", 0x2292f8, 0x2293bc),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("code", "animations", "launcher", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    code = args.code.read_bytes()
    if hashlib.sha256(code).hexdigest() != SOURCE_SHA256:
        raise SystemExit("Unexpected executable hash; no evidence checks run")
    for address, expected in ((VTABLE + 0x10, 0x250208), (VTABLE + 8, 0x2558ac),
                              (VTABLE + 0x2c, 0x255568), (0x1de908 + 5 * 4, 0x1dee8c)):
        assert struct.unpack_from("<I", code, address - BASE)[0] == expected
    for address, expected in ((0x32f1e8, b"G_Dw_00"), (0x32f1ec, b"G_Up_00")):
        pointer = struct.unpack_from("<I", code, address - BASE)[0]
        assert code[pointer - BASE:pointer - BASE + len(expected) + 1] == expected + b"\0"
    result = {"sourceSHA256": SOURCE_SHA256,
              "fixtureSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "helperSHA256": hashlib.sha256(Path(__file__).with_name("home_blank_slot_alpha.py").read_bytes()).hexdigest(),
              "availability": availability(code), "input": input_dispatch(code),
              "rawCallback": raw_density_callback(code), "resources": resource_checks(args.animations, args.launcher)}
    args.output.mkdir(parents=True, exist_ok=True)
    decoder = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    decoder.skipdata = True
    result["excerpts"] = {}
    for name, start, end in REGIONS:
        data = code[start - BASE:end - BASE]
        path = args.output / (name + ".asm")
        path.write_text("\n".join(f"{i.address:08x} {i.mnemonic:10} {i.op_str}" for i in decoder.disasm(data, start)) + "\n")
        result["excerpts"][name] = {"start": hex(start), "endExclusive": hex(end),
                                   "sourceBytesSHA256": hashlib.sha256(data).hexdigest(),
                                   "disassemblySHA256": hashlib.sha256(path.read_bytes()).hexdigest()}
    result["limits"] = "Synthetic scene/button objects; explicit controller, sound, hit, geometry and modal stubs. No complete animation lifecycle, browser pixels, or physical touch-boundary oracle."
    (args.output / "checked.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"passed": True, "availabilityCases": len(result["availability"]),
                      "inputCases": result["input"], "rawCallbackCases": len(result["rawCallback"]),
                      "resourceGroups": result["resources"]["groups"]}))


if __name__ == "__main__":
    main()
