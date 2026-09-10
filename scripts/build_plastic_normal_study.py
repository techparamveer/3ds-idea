"""Diagnostic frequency separation, not a final normal-map replacement."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'
TEX = FOLDER / 'derived-textures'


def main():
    paint = np.asarray(Image.open(TEX/'body-eur-paint-mask.png').convert('L')) / 255
    report = {'blur_radius_pixels': 12, 'low_frequency_retained': .25, 'maps': {}}
    for part, normal, colour, roughness in [
        ('deck', 'paint-cover-restrained-normal.png', 'body-socket-basecolor.png', 'paint-cover-restrained-metallic-roughness.png'),
        ('lid', 'body-slider-dot-normal.png', 'body-slider-basecolor.png', 'body-hinge-metallic-roughness.png'),
    ]:
        image = Image.open(TEX/normal).convert('RGB')
        original = np.asarray(image)
        n = original.astype(np.float32)/127.5-1
        broad = np.asarray(image.filter(ImageFilter.GaussianBlur(12))).astype(np.float32)/127.5-1
        colour_pixels = np.asarray(Image.open(TEX/colour).convert('RGB'))
        mr = np.asarray(Image.open(TEX/roughness).convert('RGB'))
        # Restrict the experiment to dark, matte, non-metallic, unpainted texels.
        mask = (1-paint)*np.clip((90-colour_pixels.max(axis=2).astype(float))/30, 0, 1)
        mask *= np.clip((mr[..., 1].astype(float)/255-.50)/.10, 0, 1)
        mask *= np.clip((.20-mr[..., 2].astype(float)/255)/.10, 0, 1)
        n[..., :2] -= .75*broad[..., :2]*mask[..., None]
        n /= np.maximum(np.linalg.norm(n, axis=2, keepdims=True), 1e-8)
        result = np.rint(np.clip((n+1)*127.5, 0, 255)).astype(np.uint8)
        result[mask == 0] = original[mask == 0]
        out = TEX/f'plastic-normal-study-{part}.png'
        Image.fromarray(result).save(out)
        report['maps'][part] = {'source': normal, 'output': out.name,
            'changed_pixels': int(np.any(result != original, axis=2).sum()),
            'fully_painted_changes': int(np.any(result[paint == 1] != original[paint == 1], axis=1).sum())}
    (FOLDER/'plastic-normal-study.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__': main()
