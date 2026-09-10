"""Correct the sourced power LED's cyan hue inside its existing UV island."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    source = FOLDER/'derived-textures/indicator-emissive-source.png'
    old = np.array(Image.open(source).convert('RGB')); result = old.copy()
    # Source_0_part_51: both front indicator lenses. Only the power half
    # emits; retaining the original black mask leaves the charge lens dark.
    region = (1353, 2813, 1500, 2886)
    x0, y0, x1, y1 = region
    patch = old[y0:y1, x0:x1]
    strength = patch.max(axis=2).astype(float)/255
    # Nintendo specifies blue, not a calibrated spectrum. This is an authored
    # saturated-blue appearance, retaining the original emission mask.
    result[y0:y1, x0:x1] = np.rint(strength[..., None]*[10, 120, 255]).astype(np.uint8)
    output = FOLDER/'derived-textures/indicator-blue-emissive.png'
    Image.fromarray(result).save(output)
    report = {'source': source.name, 'output': output.name, 'region': region,
              'blue_srgb': [10, 120, 255],
              'changed_pixels': int(np.any(result != old, axis=2).sum()),
              'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
              'interpretation': 'Blue hue confirmed by Nintendo; RGB and emission intensity are appearance estimates.'}
    (FOLDER/'indicator-colour-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__': main()
