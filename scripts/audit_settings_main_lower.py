#!/usr/bin/env python3
"""Compare a settled Settings MAIN lower LCD with the original 320x240 capture.

The native PNG may be the full 400x480 Azahar image or its exact lower crop.
All paths are explicit so this audit never depends on a local reference profile.
"""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


REGIONS = {
    "heading": (50, 6, 302, 30),
    "internet_label": (40, 72, 140, 116),
    "parental_label": (168, 72, 296, 116),
    "data_label": (24, 157, 147, 199),
    "other_label": (160, 157, 304, 199),
    "buttons_above_footer": (0, 0, 320, 208),
    "close_footer": (0, 208, 320, 240),
    "whole_lower_lcd": (0, 0, 320, 240),
}


def rgb(path: Path, native: bool) -> np.ndarray:
    image = Image.open(path).convert("RGB")
    if native and image.size == (400, 480):
        image = image.crop((40, 240, 360, 480))
    if image.size != (320, 240):
        raise ValueError(f"{path}: expected 320x240 lower LCD, got {image.size}")
    return np.asarray(image, dtype=np.int16)


def score(a: np.ndarray, b: np.ndarray, box: tuple[int, int, int, int]) -> float:
    x0, y0, x1, y1 = box
    return float(np.abs(a[y0:y1, x0:x1] - b[y0:y1, x0:x1]).mean())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--native", type=Path, required=True)
    parser.add_argument("--render", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    native, render = rgb(args.native, True), rgb(args.render, False)
    difference = np.abs(native - render)
    regions = {name: {"rectangle": box, "mae_rgb_255": round(score(native, render, box), 3),
                      "absolute_channel_error": int(difference[box[1]:box[3], box[0]:box[2]].sum())}
               for name, box in REGIONS.items()}
    shifts = {}
    for name in ("heading", "internet_label", "parental_label", "data_label", "other_label"):
        x0, y0, x1, y1 = REGIONS[name]
        trials = []
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                observed = native[y0:y1, x0:x1]
                shifted = render[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
                trials.append((round(float(np.abs(observed - shifted).mean()), 3), dx, dy))
        mae, dx, dy = min(trials)
        shifts[name] = {"best_render_sample_offset": [dx, dy], "best_mae_rgb_255": mae,
                        "note": "diagnostic only; this does not establish a source layout offset"}
    result = {
        "native": {"path": str(args.native), "sha256": hashlib.sha256(args.native.read_bytes()).hexdigest()},
        "render": {"path": str(args.render), "sha256": hashlib.sha256(args.render.read_bytes()).hexdigest()},
        "native_crop": [40, 240, 360, 480] if Image.open(args.native).size == (400, 480) else None,
        "method": "Mean absolute RGB channel error, 0-255; no registration, color correction or resampling",
        "regions": regions,
        "offset_diagnostics": shifts,
    }
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "comparison.json").write_text(json.dumps(result, indent=2) + "\n")
    Image.fromarray(np.clip(difference * 5, 0, 255).astype(np.uint8)).save(args.output / "difference-times-five.png")
    print(json.dumps({"whole_mae": regions["whole_lower_lcd"]["mae_rgb_255"],
                      "heading_best_offset": shifts["heading"]}, indent=2))


if __name__ == "__main__":
    main()
