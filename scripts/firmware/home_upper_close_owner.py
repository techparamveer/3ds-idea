"""Bounded HOME upper-close owner/source audit. Firmware and output stay private."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path

from capstone import CS_ARCH_ARM, CS_MODE_ARM, Cs


CODE_SHA256 = "243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9"
BANNER_MODEL_SHA256 = "45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615"
LAUNCHER_PACK_SHA256 = "f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044"
BASE = 0x100000


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def direct_calls(code: bytes, target: int) -> list[int]:
    callers: list[int] = []
    for offset in range(0, len(code) - 3, 4):
        word = struct.unpack_from("<I", code, offset)[0]
        if word & 0x0F000000 != 0x0B000000:
            continue
        immediate = word & 0xFFFFFF
        if immediate & 0x800000:
            immediate -= 0x1000000
        address = BASE + offset
        if address + 8 + immediate * 4 == target:
            callers.append(address)
    return callers


def disassemble(code: bytes, start: int, end: int) -> list[str]:
    decoder = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    return [
        f"{instruction.address:08x}: {instruction.mnemonic:<8} {instruction.op_str}".rstrip()
        for instruction in decoder.disasm(code[start - BASE : end - BASE], start)
    ]


def model_clip(model: dict, name: str) -> dict:
    for family in ("skeletalAnimations", "materialAnimations", "visibilityAnimations"):
        for clip in model.get(family, []):
            if clip.get("Name") != name:
                continue
            elements = []
            for element in clip.get("Elements", []):
                channels = {}
                for channel, curve in element.get("Content", {}).items():
                    if isinstance(curve, dict) and curve.get("Exists"):
                        channels[channel] = [
                            {"frame": key.get("Frame"), "value": key.get("Value")}
                            for key in curve.get("KeyFrames", [])
                        ]
                elements.append(
                    {
                        "name": element.get("Name"),
                        "targetType": element.get("TargetType"),
                        "channels": channels,
                    }
                )
            return {
                "family": family,
                "frames": clip.get("FramesCount"),
                "flags": clip.get("AnimationFlags"),
                "elements": elements,
            }
    raise AssertionError(f"missing model clip {name}")


def launcher_clip(pack: dict, name: str) -> dict:
    clip = pack["animations"][name]
    return {
        "frames": clip["frames"],
        "groups": clip["groups"],
        "sourceFrameRange": clip["sourceFrameRange"],
        "tracks": [
            {
                "target": track["target"],
                "property": track["property"],
                "keys": track["keys"],
            }
            for track in clip["tracks"]
        ],
    }


parser = argparse.ArgumentParser()
parser.add_argument("--code", type=Path, required=True)
parser.add_argument("--banner-model", type=Path, required=True)
parser.add_argument("--launcher-pack", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
options = parser.parse_args()

identities = {
    "code": sha256(options.code),
    "bannerModel": sha256(options.banner_model),
    "launcherPack": sha256(options.launcher_pack),
}
assert identities == {
    "code": CODE_SHA256,
    "bannerModel": BANNER_MODEL_SHA256,
    "launcherPack": LAUNCHER_PACK_SHA256,
}, identities

code = options.code.read_bytes()
banner_model = json.loads(options.banner_model.read_text())
launcher_pack = json.loads(options.launcher_pack.read_text())

# This is intentionally an address-bounded audit. It records only the close
# dispatcher, the AppQuit wrapper/controller, the upper mode setter/completion
# check, and the constructor records needed to identify the two clip owners.
ranges = {
    "dialog_close_dispatch": (0x1DE12C, 0x1DE190),
    "close_composition_callback": (0x1E6BBC, 0x1E6C6C),
    "upper_mode_setter": (0x1ED1C4, 0x1ED384),
    "app_quit_wrapper": (0x1EDA18, 0x1EDA38),
    "banner_clip_constructor": (0x24DAF4, 0x24DBA0),
    "banner_app_quit_start": (0x24DC2C, 0x24DC80),
    "upper_layout_constructor": (0x286580, 0x286638),
    "upper_whiteblack_binding": (0x286808, 0x286874),
    "upper_app_quit_completion": (0x286F0C, 0x286F30),
}
assembly = {name: disassemble(code, *bounds) for name, bounds in ranges.items()}

assert 0x1E6BDC in direct_calls(code, 0x1ED1C4)
assert 0x1E6BE8 in direct_calls(code, 0x1EDA18)
assert 0x1EDA24 in direct_calls(code, 0x24DC2C)
assert 0x286F1C in direct_calls(code, 0x24DAC8)
assert 0x286F28 in direct_calls(code, 0x24DC14)

result = {
    "schema": 1,
    "inputs": {
        "code": {"path": str(options.code), "sha256": identities["code"]},
        "bannerModel": {
            "path": str(options.banner_model),
            "sha256": identities["bannerModel"],
            "sourceSha256": banner_model["sourceSha256"],
            "converter": banner_model["converter"],
        },
        "launcherPack": {
            "path": str(options.launcher_pack),
            "sha256": identities["launcherPack"],
            "sourceSha256": launcher_pack["sourceSha256"],
        },
    },
    "callChain": [
        {"address": "0x1e6bdc", "operation": "set upper mode 0 via 0x1ed1c4"},
        {"address": "0x1e6be8", "operation": "start AppQuit via wrapper 0x1eda18"},
        {"address": "0x1eda24", "operation": "start BannerBG_AppQuit via 0x24dc2c"},
        {
            "address": "0x286f1c..0x286f28",
            "operation": "when AppQuit status is 2, restart BannerBG_Loop",
        },
    ],
    "directCallers": {
        "BannerBG_SceneOut_0x24dab0": [hex(x) for x in direct_calls(code, 0x24DAB0)],
        "BannerBG_AppQuit_0x24dc2c": [hex(x) for x in direct_calls(code, 0x24DC2C)],
        "AppQuit_wrapper_0x1eda18": [hex(x) for x in direct_calls(code, 0x1EDA18)],
    },
    "clips": {
        "BannerBG_AppQuit": model_clip(banner_model, "BannerBG_AppQuit"),
        "BannerBG_SceneOut": model_clip(banner_model, "BannerBG_SceneOut"),
        "LncBase_U_00_WhiteBlack": launcher_clip(launcher_pack, "LncBase_U_00_WhiteBlack"),
        "LncBase_U_00_SceneOut": launcher_clip(launcher_pack, "LncBase_U_00_SceneOut"),
    },
    "assembly": assembly,
    "conclusion": {
        "proved": "software-close callback starts BannerBG_AppQuit; AppQuit completion restarts Loop",
        "notProved": "no bounded call-chain instruction starts LncBase_U_00_SceneOut or applies AppQuit alpha to the post-3D upper layout",
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
