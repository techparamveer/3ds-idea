"""Bounded HOME lower closing-dialog exit audit. Inputs/output stay private."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path

from capstone import CS_ARCH_ARM, CS_MODE_ARM, Cs


BASE = 0x100000
CODE_SHA256 = "243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9"
DIALOG_PACK_SHA256 = "8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17"
MASK_PACK_SHA256 = "675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def word(code: bytes, address: int) -> int:
    return struct.unpack_from("<I", code, address - BASE)[0]


def cstring(code: bytes, address: int) -> str:
    start = address - BASE
    end = code.index(0, start)
    return code[start:end].decode("ascii")


def disassemble(code: bytes, start: int, end: int) -> list[str]:
    decoder = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    return [
        f"{instruction.address:08x}: {instruction.mnemonic:<8} {instruction.op_str}".rstrip()
        for instruction in decoder.disasm(code[start - BASE : end - BASE], start)
    ]


def direct_calls(code: bytes, target: int) -> list[int]:
    callers: list[int] = []
    for offset in range(0, len(code) - 3, 4):
        instruction = struct.unpack_from("<I", code, offset)[0]
        if instruction & 0x0F000000 != 0x0B000000:
            continue
        immediate = instruction & 0xFFFFFF
        if immediate & 0x800000:
            immediate -= 0x1000000
        address = BASE + offset
        if address + 8 + immediate * 4 == target:
            callers.append(address)
    return callers


def clip(pack: dict, name: str) -> dict:
    animation = pack["animations"][name]
    return {
        "frames": animation["frames"],
        "loop": animation["loop"],
        "groups": animation["groups"],
        "sourceFrameRange": animation["sourceFrameRange"],
        "tracks": [
            {
                "target": track["target"],
                "property": track["property"],
                "keys": [
                    {"frame": key["frame"], "value": key["value"], "slope": key["slope"]}
                    for key in track["keys"]
                ],
            }
            for track in animation["tracks"]
        ],
    }


parser = argparse.ArgumentParser()
parser.add_argument("--code", type=Path, required=True)
parser.add_argument("--dialog-pack", type=Path, required=True)
parser.add_argument("--dialogmask-pack", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
options = parser.parse_args()

identities = {
    "code": sha256(options.code),
    "dialogPack": sha256(options.dialog_pack),
    "dialogmaskPack": sha256(options.dialogmask_pack),
}
assert identities == {
    "code": CODE_SHA256,
    "dialogPack": DIALOG_PACK_SHA256,
    "dialogmaskPack": MASK_PACK_SHA256,
}, identities

code = options.code.read_bytes()
dialog = json.loads(options.dialog_pack.read_text())
dialogmask = json.loads(options.dialogmask_pack.read_text())

# HOME's dialog table maps visible layout index 0 (Dlg_A_D_00) to animation
# donor index 2 (Dlg_A_D_02). The generic dialog builder uses that donor plus
# the FadeOut00/FadeOut01 suffix table to construct both exit controllers.
layout_table = word(code, 0x234034)
donor_table = word(code, 0x23406C)
assert layout_table == 0x32E980
assert donor_table == 0x32E9AC
assert cstring(code, word(code, layout_table)) == "Dlg_A_D_00"
assert word(code, donor_table) == 2
assert cstring(code, word(code, layout_table + 2 * 4)) == "Dlg_A_D_02"
assert cstring(code, word(code, 0x32E910)) == "_FadeOut00.bclan"
assert cstring(code, word(code, 0x32E914)) == "_FadeOut01.bclan"

# The mask constructor loops over D/U layouts. Its base table resolves lower
# DlgMask_D_00 and it explicitly uses the first fade-out suffix, FadeOut00.
mask_table_base = word(code, 0x26BB88)
assert mask_table_base == 0x32E8B0
assert cstring(code, word(code, mask_table_base + 0x40)) == "DlgMask_D_00"
assert cstring(code, word(code, mask_table_base + 0x60)) == "_FadeOut00.bclan"

dialog_exit_name = "Dlg_A_D_02_FadeOut00"
mask_exit_name = "DlgMask_D_00_FadeOut00"
dialog_exit = clip(dialog, dialog_exit_name)
mask_exit = clip(dialogmask, mask_exit_name)
assert dialog_exit["frames"] == 21 and dialog_exit["sourceFrameRange"] == [80, 100]
assert mask_exit["frames"] == 21 and mask_exit["sourceFrameRange"] == [80, 100]

dialog_root = {
    track["property"]: track["keys"]
    for track in dialog_exit["tracks"]
    if track["target"] == "N_Dlg_00"
}
assert [(key["frame"], key["value"]) for key in dialog_root["alpha"]] == [(0.0, 255.0), (20.0, 0.0)]
assert [(key["frame"], key["value"]) for key in dialog_root["scale.x"]] == [(0.0, 1.0), (20.0, 1.0499999523162842)]
mask_alpha = mask_exit["tracks"][0]["keys"]
assert [(key["frame"], key["value"]) for key in mask_alpha[:2]] == [(0.0, 130.0), (15.0, 0.0)]

ranges = {
    "close_composition_callback": (0x1E6BBC, 0x1E6C6C),
    "dialog_resource_builder": (0x233E24, 0x234000),
    "dialog_fade_update": (0x10CBA4, 0x10CD08),
    "dialog_quiescence_check": (0x10CD20, 0x10CDE0),
    "dialog_retirement_callback": (0x10C9B8, 0x10CB7C),
    "mask_resource_constructor": (0x26BA48, 0x26BB88),
    "mask_fade_controls": (0x26B940, 0x26BA1C),
}
assembly = {name: disassemble(code, *bounds) for name, bounds in ranges.items()}

assert 0x103A4C in direct_calls(code, 0x10CD20)
assert 0x1049BC in direct_calls(code, 0x10C9B8)
assert 0x1049D0 in direct_calls(code, 0x10CBA4)

result = {
    "schema": 1,
    "inputs": {
        "code": {"path": str(options.code), "sha256": identities["code"]},
        "dialogPack": {
            "path": str(options.dialog_pack),
            "sha256": identities["dialogPack"],
            "sourceSha256": dialog["sourceSha256"],
        },
        "dialogmaskPack": {
            "path": str(options.dialogmask_pack),
            "sha256": identities["dialogmaskPack"],
            "sourceSha256": dialogmask["sourceSha256"],
        },
    },
    "selection": {
        "visibleDialogLayout": "Dlg_A_D_00",
        "dialogAnimationDonor": "Dlg_A_D_02",
        "dialogExit": dialog_exit_name,
        "lowerMaskExit": mask_exit_name,
        "dialogTable": hex(layout_table),
        "donorTable": hex(donor_table),
    },
    "clips": {dialog_exit_name: dialog_exit, mask_exit_name: mask_exit},
    "resourceSources": {
        dialog_exit_name: dialog["resourceSources"]["animations"][dialog_exit_name],
        mask_exit_name: dialogmask["resourceSources"]["animations"][mask_exit_name],
    },
    "directCallers": {
        "dialog_quiescence_check_0x10cd20": [hex(value) for value in direct_calls(code, 0x10CD20)],
        "dialog_retirement_callback_0x10c9b8": [hex(value) for value in direct_calls(code, 0x10C9B8)],
        "dialog_fade_update_0x10cba4": [hex(value) for value in direct_calls(code, 0x10CBA4)],
    },
    "assembly": assembly,
    "conclusion": {
        "proved": (
            "Dlg_A_D_00 uses Dlg_A_D_02_FadeOut00 and DlgMask_D_00 uses "
            "DlgMask_D_00_FadeOut00; both expose 21 samples over source range 80..100"
        ),
        "retirementBoundary": (
            "dialog fade update, quiescence, and retirement callback are separate code paths; "
            "retirement is controller/state driven, not an alpha-threshold test"
        ),
        "notProved": (
            "the bounded trace does not prove a millisecond cadence or that object retirement "
            "occurs on the same update that sample 20 is first rendered"
        ),
    },
}

options.output.mkdir(parents=True, exist_ok=True)
(options.output / "audit.json").write_text(json.dumps(result, indent=2) + "\n")
(options.output / "audit.asm").write_text(
    "\n\n".join(
        f"# {name} {ranges[name][0]:#x}..{ranges[name][1]:#x}\n" + "\n".join(lines)
        for name, lines in assembly.items()
    )
    + "\n"
)
print(json.dumps({"output": str(options.output), "identities": identities}, indent=2))
