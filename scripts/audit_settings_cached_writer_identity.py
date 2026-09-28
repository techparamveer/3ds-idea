#!/usr/bin/env python3
"""Check whether Settings embeds the pinned HOME cached text-writer code.

This is a static identity probe. It does not claim that a matching path is
executed at runtime, nor recover PICA uniforms, viewport state, or raster rules.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


LOAD_BASE = 0x100000
EXPECTED_HOME_CODE = "243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9"
EXPECTED_SETTINGS_CODE = "1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5"
EXPECTED_TEXT_SHADER = "87e9a661a499dfe18818310d6758855eba5d56892fe266c155b18e3e0f4d881e"

# These VAs and instruction ranges are the already-pinned HOME trace. The
# corresponding settings VAs are discovered from exact bytes, never guessed.
TRACE_RANGES = (
    ("cache-branch-and-writer", 0x1ABF84, 0x1AC080),
    ("cached-glyph-expansion", 0x1ABFC8, 0x1AC01C),
    ("immediate-endpoint-store", 0x1AC050, 0x1AC078),
    ("text-cache-and-sampler-setup", 0x1AC830, 0x1AC860),
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def unique_offsets(haystack: bytes, needle: bytes) -> list[int]:
    found: list[int] = []
    offset = 0
    while True:
        offset = haystack.find(needle, offset)
        if offset < 0:
            return found
        found.append(offset)
        offset += 1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--home-code", type=Path, required=True)
    parser.add_argument("--settings-code", type=Path, required=True)
    parser.add_argument("--home-text-shader", type=Path, required=True)
    parser.add_argument("--settings-text-shader", type=Path, required=True)
    args = parser.parse_args()

    home_code = args.home_code.read_bytes()
    settings_code = args.settings_code.read_bytes()
    home_shader = args.home_text_shader.read_bytes()
    settings_shader = args.settings_text_shader.read_bytes()
    actual_hashes = {
        "homeCode": sha256(home_code),
        "settingsCode": sha256(settings_code),
        "homeTextShader": sha256(home_shader),
        "settingsTextShader": sha256(settings_shader),
    }
    expected_hashes = {
        "homeCode": EXPECTED_HOME_CODE,
        "settingsCode": EXPECTED_SETTINGS_CODE,
        "homeTextShader": EXPECTED_TEXT_SHADER,
        "settingsTextShader": EXPECTED_TEXT_SHADER,
    }
    if actual_hashes != expected_hashes:
        raise SystemExit("input identity mismatch; refusing to compare unpinned assets: " + json.dumps(actual_hashes))

    regions = []
    for label, start_va, end_va in TRACE_RANGES:
        start = start_va - LOAD_BASE
        end = end_va - LOAD_BASE
        if start < 0 or end > len(home_code) or start >= end:
            raise SystemExit(f"invalid HOME trace range: {label}")
        signature = home_code[start:end]
        matches = unique_offsets(settings_code, signature)
        if len(matches) != 1:
            raise SystemExit(f"expected one exact Settings match for {label}; found {len(matches)}")
        match = matches[0]
        regions.append({
            "label": label,
            "homeVa": f"0x{start_va:08x}",
            "endVaExclusive": f"0x{end_va:08x}",
            "settingsVa": f"0x{match + LOAD_BASE:08x}",
            "lengthBytes": len(signature),
            "signatureSha256": sha256(signature),
        })

    print(json.dumps({
        "schema": "settings-cached-writer-identity-v1",
        "classification": "static-identical-code-and-shader",
        "loadBaseAssumption": f"0x{LOAD_BASE:08x} for both decompressed code.bin images",
        "inputs": actual_hashes,
        "ranges": regions,
        "interpretation": (
            "The Settings executable contains each exact instruction window from the pinned HOME trace, "
            "and the text-writer shader bytes match. This does not prove runtime dispatch, vertex/uniform "
            "values, model/view/projection matrices, viewport, or final screen coordinates."
        ),
    }, indent=2))


if __name__ == "__main__":
    main()
