"""Photographically motivated gold-contact colour trial; no model installation."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
TEX = FOLDER/'derived-textures'


def main():
    source = TEX/'body-etched-basecolor.png'
    old = np.array(Image.open(source).convert('RGB')); result = old.copy()
    # Filament's published gold reflectance example, encoded in sRGB.
    gold = np.array([255, 216, 145], dtype=float)/255
    target = np.where(gold <= .04045, gold/12.92, ((gold+.055)/1.055)**2.4)
    regions = []
    for uv_bounds in [(.293999, .726963, .314870, .735797), (.293999, .715059, .314870, .724706)]:
        u0, v0, u1, v1 = uv_bounds
        x0, x1 = int(u0*4096)-2, int(np.ceil(u1*4096))+2
        y0, y1 = int((1-v1)*4096)-2, int(np.ceil((1-v0)*4096))+2
        patch = old[y0:y1, x0:x1].astype(float)/255
        linear = np.where(patch <= .04045, patch/12.92, ((patch+.055)/1.055)**2.4)
        luminance = linear@np.array([.2126, .7152, .0722])
        # Retain restrained local variation rather than carrying baked darkness
        # into the metal's reflectance. This is an appearance estimate.
        variation = np.clip((luminance/np.median(luminance))**.25*.94, .80, 1)
        corrected = variation[..., None]*target
        encoded = np.where(corrected <= .0031308, corrected*12.92, 1.055*corrected**(1/2.4)-.055)
        result[y0:y1, x0:x1] = np.rint(encoded*255).astype(np.uint8)
        regions.append([x0, y0, x1, y1])
    path = TEX/'dock-contact-basecolor.png'; Image.fromarray(result).save(path)
    report = {'source': source.name, 'output': path.name, 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'gold_srgb': gold.tolist(),
              'regions': regions, 'changed_pixels': int(np.any(result != old, axis=2).sum()),
              'interpretation': 'authored gold reflectance; actual contact alloy and roughness not measured'}
    (FOLDER/'dock-contact-colour-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__': main()
