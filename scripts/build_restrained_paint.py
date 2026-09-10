"""Reduce only the authored grain delta, preserving source wear and later detail.

This creates trial maps, never installs them in Blender or the public GLB.
The retained fraction is an appearance estimate, not a measured paint constant.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'
TEX = FOLDER / 'derived-textures'
RETAIN = .35


def main():
    paint = np.asarray(Image.open(TEX/'body-eur-paint-mask.png').convert('L')) / 255
    report = {'retained_authored_grain': RETAIN, 'maps': {}}
    for channel in ['normal', 'metallic-roughness']:
        source = np.asarray(Image.open(FOLDER/f'source-textures/body-{channel}.png')).astype(np.float32)
        grain = np.asarray(Image.open(TEX/f'body-paint-grain-{channel}.png')).astype(np.float32)
        delta = (grain-source) * (1-RETAIN) * paint[..., None]
        for panel in ['lid', 'cover']:
            path = TEX/f'paint-{panel}-scratches-{channel}.png'
            current = np.asarray(Image.open(path))
            result = current.astype(np.float32)-delta
            if channel == 'normal':
                n = result/127.5-1
                n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-8)
                result = (n+1)*127.5
            result = np.rint(np.clip(result, 0, 255)).astype(np.uint8)
            result[paint == 0] = current[paint == 0]
            if channel == 'metallic-roughness':
                assert np.array_equal(result[..., [0, 2]], current[..., [0, 2]])
            out = TEX/f'paint-{panel}-restrained-{channel}.png'
            Image.fromarray(result).save(out)
            report['maps'][out.name] = {
                'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
                'changed_pixels': int(np.any(result != current, axis=-1).sum()),
                'unpainted_changes': int(np.any(result[paint == 0] != current[paint == 0], axis=-1).sum()),
            }
    (FOLDER/'restrained-paint-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
