"""Deterministic, seamless 16 mm material samples for the 3DS XL reconstruction.

These are authored approximations of the supplied photographic references, not
measured Nintendo material data. Only NumPy and Pillow are required. Run from
any directory; output is public/textures/materials relative to this script.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "textures" / "materials"
SIZE = 512
TILE_MM = 16.0
MM_PER_PIXEL = TILE_MM / SIZE


def gaussian_noise(rng: np.random.Generator, sigma_mm: float) -> np.ndarray:
    """Periodic, Gaussian-correlated noise; every scale uses physical mm."""
    noise = rng.standard_normal((SIZE, SIZE))
    frequency = np.fft.fftfreq(SIZE, d=MM_PER_PIXEL)
    radius_squared = frequency[:, None] ** 2 + frequency[None, :] ** 2
    kernel = np.exp(-2 * np.pi**2 * sigma_mm**2 * radius_squared)
    smooth = np.fft.ifft2(np.fft.fft2(noise) * kernel).real
    return (smooth - smooth.mean()) / smooth.std()


def scratches(rng: np.random.Generator, count: int) -> np.ndarray:
    """Sparse shallow, tapered hairlines, wrapped on both tile boundaries."""
    y, x = np.mgrid[:SIZE, :SIZE] * MM_PER_PIXEL
    result = np.zeros((SIZE, SIZE))
    for _ in range(count):
        cx, cy = rng.uniform(0, TILE_MM, 2)
        angle = rng.uniform(-np.pi, np.pi)
        half_length = rng.uniform(0.2, 1.65)
        width = rng.uniform(0.015, 0.029)
        dx = (x - cx + TILE_MM / 2) % TILE_MM - TILE_MM / 2
        dy = (y - cy + TILE_MM / 2) % TILE_MM - TILE_MM / 2
        along = dx * np.cos(angle) + dy * np.sin(angle)
        across = -dx * np.sin(angle) + dy * np.cos(angle)
        taper = np.maximum(0, 1 - (along / half_length) ** 2) ** 2
        result += taper * np.exp(-0.5 * (across / width) ** 2)
    return np.clip(result, 0, 1)


def normal_from_height(height_mm: np.ndarray) -> np.ndarray:
    """OpenGL +Y normals. PNG rows go down, whereas texture V goes up."""
    dx = (np.roll(height_mm, -1, axis=1) - np.roll(height_mm, 1, axis=1)) / (2 * MM_PER_PIXEL)
    dy = (np.roll(height_mm, -1, axis=0) - np.roll(height_mm, 1, axis=0)) / (2 * MM_PER_PIXEL)
    normal = np.stack((-dx, dy, np.ones_like(dx)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    return np.rint((normal * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)


def write_image(name: str, pixels: np.ndarray) -> dict:
    path = OUT / name
    Image.fromarray(pixels).save(path, optimize=True)
    return {
        "file": name,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def make_material(name: str, seed: int, base_rgb: tuple, roughness: float,
                  grain_height_mm: float, base_variation: float,
                  roughness_variation: float, scratch_count: int,
                  metalness_estimate: float) -> dict:
    rng = np.random.default_rng(seed)
    fine = gaussian_noise(rng, 0.036 if name == "silver" else 0.052)
    grain = gaussian_noise(rng, 0.092 if name == "silver" else 0.118)
    broad = gaussian_noise(rng, 1.2)
    hair = scratches(rng, scratch_count)

    # Restrained multiscale grain. Broad variation affects roughness only: it
    # must not create the mottled height field of stone, concrete, or orange peel.
    grain_field = (fine * 0.82 + grain * 0.32)
    height = grain_field * grain_height_mm - hair * 0.0014
    variation = np.clip(fine * 0.68 + grain * 0.25, -2.5, 2.5)
    base = np.asarray(base_rgb)[None, None, :] + variation[..., None] * base_variation
    base = np.rint(base).clip(0, 255).astype(np.uint8)
    rough = roughness + roughness_variation * (fine * 0.68 + grain * 0.22 + broad * 0.12) + hair * 0.045
    rough = np.rint(np.clip(rough, 0, 1) * 255).astype(np.uint8)
    normals = normal_from_height(height)

    files = [
        write_image(f"{name}-basecolor.png", base),
        write_image(f"{name}-roughness.png", rough),
        write_image(f"{name}-normal.png", normals),
    ]
    return {
        "name": name,
        "seed": seed,
        "resolution": [SIZE, SIZE],
        "tile_mm": [TILE_MM, TILE_MM],
        "basecolor_srgb_mean": base.mean(axis=(0, 1)).round(3).tolist(),
        "roughness_linear_min_mean_max": [round(float(rough.min() / 255), 5), round(float(rough.mean() / 255), 5), round(float(rough.max() / 255), 5)],
        "height_rms_mm": round(float(height.std()), 6),
        "metalness_artistic_estimate": metalness_estimate,
        "normal_convention": "OpenGL tangent-space +Y, non-color, strength 1.0",
        "files": files,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    materials = [
        make_material("silver", 17050, (173, 178, 183), 0.345, 0.0028, 1.35, 0.035, 24, 0.4),
        make_material("graphite", 17051, (31, 34, 36), 0.565, 0.0053, 0.60, 0.043, 7, 0.0),
        make_material("silicone", 17052, (116, 120, 116), 0.715, 0.0017, 0.55, 0.028, 0, 0.0),
    ]
    manifest = {
        "authoring": "Deterministic procedural reconstruction estimates; no measured Nintendo material constants or source photographs used as textures.",
        "mapping": "All maps tile seamlessly in U and V. One UV unit = 16 mm. Base color is sRGB; roughness and normals are non-color data.",
        "materials": materials,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"resolution": SIZE, "tile_mm": TILE_MM,
                      "total_png_bytes": sum(f["bytes"] for m in materials for f in m["files"]),
                      "materials": [{"name": m["name"], "roughness": m["roughness_linear_min_mean_max"]} for m in materials]}, indent=2))


if __name__ == "__main__":
    main()
