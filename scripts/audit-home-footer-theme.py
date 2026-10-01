#!/usr/bin/env python3
"""Verify the pinned HOME footer theme route without emulator interaction."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path


BASE = 0x100000
CODE_SHA256 = "243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9"
LAUNCHER_SHA256 = "f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044"
PRODUCER = 0x2AC8C4
MATERIAL_RGB_SETTER = 0x1D47D0
PANE_TABLE = 0x308A98

PANE_NAMES = [
    "P_BtnW_C_01", "P_EdgeW_C_01", "P_BtnW_R_02", "P_EdgeW_R_02",
    "P_BtnW_L_03", "P_EdgeW_L_03", "P_BtnW_R_03", "P_EdgeW_R_03",
    "P_BtnW_C_03", "P_EdgeW_C_03", "P_BtnW_R_04", "P_EdgeW_R_04",
    "P_BtnW_C_04", "P_EdgeW_C_04", "P_BtnW_L_04", "P_EdgeW_L_04",
    "P_BtnW_RC_04", "P_EdgeW_RC_04", "P_BtnW_LL_05", "P_EdgeW_LL_05",
]

# These words pin the interpreted routes to the selected executable. Section
# hashes below cover the surrounding instructions rather than only call sites.
EXPECTED_WORDS = {
    0x217A90: 0xE59F0000,  # singleton accessor: ldr r0, [pc]
    0x217A98: 0x0035F9D8,  # singleton address
    0x1D3370: 0xEB0111C6,  # singleton accessor call
    0x1D3374: 0xE2804014,  # manager + 0x14
    0x1D337C: 0xE8940050,  # load active/default pointers
    0x1D3500: 0xE5D40010,  # active + 0x10 gate
    0x1D350C: 0xE286105C,  # default + 0x5c record
    0x1D3514: 0xEB0364EA,  # producer(default record)
    0x1D35AC: 0xE2841074,  # active + 0x74 record
    0x1D35B4: 0xEB0364C2,  # producer(active record)
    0x2AC9B8: 0xE5900AB0,  # scene + 0xab0 controller
    0x2AC9C0: 0xE59F12CC,  # pane-name table literal
    0x2AC9C4: 0xE3A02050,  # copy 20 32-bit pane pointers
    0x2AC9C8: 0xE5900008,  # controller + 8 layout
    0x2ACA08: 0xEBFC9F70,  # RGB slot 0
    0x2ACA18: 0xEBFC9F6C,  # RGB slot 2
    0x2ACA28: 0xEBFC9F68,  # RGB slot 1
    0x2ACA30: 0xE3550014,  # iterate 20 pane names
    0x2B4E34: 0xE5901018,  # manager + 0x18 default palette
    0x2B4E3C: 0xEBFFCF6B,  # default snapshot producer
    0x2A9080: 0xE5950AB0,  # scene + 0xab0 controller
    0x2A90A8: 0xE5900010,  # material slot 0 RGB
    0x2A90AC: 0xE5C40060,  # default + 0x60
    0x2A90C8: 0xE5910018,  # material slot 2 RGB
    0x2A90CC: 0xE5C40063,  # default + 0x63
    0x2A90E8: 0xE5910014,  # material slot 1 RGB
    0x2A90EC: 0xE5C40066,  # default + 0x66
}

SECTIONS = {
    "themeRoute": (0x1D34F8, 0x1D35BC, "e8a086f8b22a8f170be351ad86d1298660202fd619194b4a5d055e344752845a"),
    "materialProducer": (0x2AC9B8, 0x2ACA38, "f21fdf598e421aa152d8991097de95188d7a5d02791167b17c74738f461e8caf"),
    "defaultSnapshot": (0x2A9080, 0x2A90F0, "8e73122e4af8c728dfd184578ff9edb6e0d1e985ee1c88980118b43618f42136"),
    "rgbSlotSetter": (0x1D47D0, 0x1D4860, "1e14b399327b0ff2f506afe7871d0a08ca3567cfc258ad6892095fd59e6b8204"),
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def offset(address: int) -> int:
    return address - BASE


def word_at(code: bytes, address: int) -> int:
    return struct.unpack_from("<I", code, offset(address))[0]


def c_string(code: bytes, address: int) -> str:
    start = offset(address)
    end = code.index(b"\0", start)
    return code[start:end].decode("ascii")


def branch_target(address: int, word: int) -> int | None:
    if word & 0x0F000000 != 0x0B000000:
        return None
    displacement = word & 0x00FFFFFF
    if displacement & 0x00800000:
        displacement -= 0x01000000
    return address + 8 + displacement * 4


def direct_calls(code: bytes, target: int) -> list[int]:
    calls = []
    for file_offset in range(0, len(code) - 3, 4):
        address = BASE + file_offset
        if branch_target(address, struct.unpack_from("<I", code, file_offset)[0]) == target:
            calls.append(address)
    return calls


def find_pane(node: object, name: str) -> dict:
    if isinstance(node, dict):
        if node.get("kind") and node.get("name") == name:
            return node
        for value in node.values():
            found = find_pane(value, name)
            if found:
                return found
    elif isinstance(node, list):
        for value in node:
            found = find_pane(value, name)
            if found:
                return found
    return {}


def material_without_name(material: dict) -> dict:
    return {key: value for key, value in material.items() if key != "name"}


def audit(code_path: Path, launcher_path: Path) -> dict:
    code = code_path.read_bytes()
    launcher_bytes = launcher_path.read_bytes()
    assert sha256(code) == CODE_SHA256, "unexpected code.bin"
    assert sha256(launcher_bytes) == LAUNCHER_SHA256, "unexpected launcher pack"

    for address, expected in EXPECTED_WORDS.items():
        actual = word_at(code, address)
        assert actual == expected, f"word mismatch at {address:#x}: {actual:#010x}"

    section_evidence = {}
    for name, (start, end, expected) in SECTIONS.items():
        actual = sha256(code[offset(start):offset(end)])
        assert actual == expected, f"section mismatch: {name}"
        section_evidence[name] = {
            "start": hex(start), "endExclusive": hex(end), "sha256": actual,
        }

    producer_calls = direct_calls(code, PRODUCER)
    assert producer_calls == [0x1D3514, 0x1D35B4]
    assert direct_calls(code, MATERIAL_RGB_SETTER).count(0x2ACA08) == 1
    assert direct_calls(code, MATERIAL_RGB_SETTER).count(0x2ACA18) == 1
    assert direct_calls(code, MATERIAL_RGB_SETTER).count(0x2ACA28) == 1

    table_literal = word_at(code, 0x2ACC94)
    assert table_literal == PANE_TABLE
    pane_names = [c_string(code, word_at(code, PANE_TABLE + index * 4)) for index in range(20)]
    assert pane_names == PANE_NAMES
    assert c_string(code, 0x2A944C) == "P_BtnW_C_01"

    launcher = json.loads(launcher_bytes)
    layout = launcher["layouts"]["LncBtmBtn_02"]
    panes = {name: find_pane(layout["roots"], name) for name in PANE_NAMES[:2]}
    assert all(panes.values())
    indexes = {name: pane["picture"]["material"] for name, pane in panes.items()}
    assert indexes == {"P_BtnW_C_01": 0, "P_EdgeW_C_01": 3}
    materials = {name: layout["materials"][index] for name, index in indexes.items()}
    assert material_without_name(materials[PANE_NAMES[0]]) == material_without_name(materials[PANE_NAMES[1]])
    source = materials[PANE_NAMES[0]]

    return {
        "schema": 1,
        "kind": "home-footer-theme-runtime-source-audit",
        "status": "source-gap",
        "sources": {
            "codeSha256": sha256(code),
            "launcherPackSha256": sha256(launcher_bytes),
            "titleId": launcher["titleId"],
            "layout": "LncBtmBtn_02",
            "layoutSourceSha256": launcher["sourceSha256"],
        },
        "executable": {
            "runtimeBase": hex(BASE),
            "sections": section_evidence,
            "footerControllerOffset": "0xab0",
            "footerLayoutOffset": "0x8",
            "paneTable": hex(PANE_TABLE),
            "paneNames": pane_names,
            "producer": {
                "address": hex(PRODUCER),
                "directCallSites": [hex(value) for value in producer_calls],
                "inputRgbOffsets": ["+0x4..+0x6", "+0x7..+0x9", "+0xa..+0xc"],
                "materialSlots": [0, 2, 1],
                "setterCallSites": ["0x2aca08", "0x2aca18", "0x2aca28"],
            },
            "route": {
                "managerObjectBase": "0x35f9d8",
                "activePointerOffset": "+0x14",
                "defaultPointerOffset": "+0x18",
                "activeGate": {"offset": "+0x10", "requiredValue": 1},
                "activeRecordOffset": "+0x74",
                "defaultRecordOffset": "+0x5c",
            },
            "defaultSnapshot": {
                "function": "0x2a8bf0",
                "sourcePane": "P_BtnW_C_01",
                "materialSlots": [0, 2, 1],
                "destinationOffsets": ["+0x60..+0x62", "+0x63..+0x65", "+0x66..+0x68"],
            },
        },
        "decodedLayout": {
            "paneMaterialIndexes": indexes,
            "materialsEqualExceptName": True,
            "flags": source["flags"],
            "bufferColor": source["bufferColor"],
            "constantColors": source["constantColors"],
            "defaultProducerRgb": [source["constantColors"][index][:3] for index in (0, 2, 1)],
        },
        "sourceGap": {
            "missing": "settled native active-theme gate and nine runtime RGB bytes",
            "activeGateAddress": "[*0x35f9ec]+0x10",
            "activeRgbAddress": "[*0x35f9ec]+0x78..+0x80",
            "defaultRgbAddress": "[*0x35f9f0]+0x60..+0x68",
            "conclusion": "No footer color correction is source-supported until the live route and record are captured.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--code", type=Path, required=True)
    parser.add_argument("--launcher", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    rendered = json.dumps(audit(args.code, args.launcher), indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
