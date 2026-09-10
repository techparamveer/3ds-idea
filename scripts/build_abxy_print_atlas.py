"""Higher-resolution cap printing with the existing authored glyph outlines."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image
from build_abxy_ink import paths, WIDTHS, HEIGHT, STROKE

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
SIZE = 512
SPAN = 7.2
KEYS = 'ABXY'


def main():
    original = np.array(Image.open(FOLDER/'derived-textures/body-etched-basecolor.png').convert('RGB'))
    fits = json.loads((FOLDER/'abxy-glyph-uv-fit.json').read_text())
    atlas = np.zeros((SIZE*2, SIZE*2, 3), np.uint8)
    reports = {}
    yy, xx = np.mgrid[:SIZE, :SIZE]
    points = np.stack(((xx+.5)/SIZE-.5, .5-(yy+.5)/SIZE), -1)*SPAN
    pixel = SPAN/SIZE
    for index, key in enumerate(KEYS):
        fit = fits[key]; matrix = np.array(fit['uv_fit']); centre = np.array(fit['centre'])
        # Resample the existing cap colour. Remove the old print before scaling;
        # its formerly covered plastic is estimated from adjacent dark pixels.
        uv = np.dstack((points+centre, np.ones((SIZE, SIZE))))@matrix
        x = uv[..., 0]*original.shape[1]-.5; y = (1-uv[..., 1])*original.shape[0]-.5
        sx0, sy0 = int(x.min())-3, int(y.min())-3
        sx1, sy1 = int(x.max())+5, int(y.max())+5
        patch = original[sy0:sy1, sx0:sx1].copy()
        mask = patch.max(axis=2)>80
        background = np.median(patch[~mask], axis=0)
        ink = np.percentile(patch[mask], 95, axis=0)
        mask = np.logical_or.reduce([np.roll(np.roll(mask, dy, axis=0), dx, axis=1) for dy in range(-2, 3) for dx in range(-2, 3)])
        patch[mask] = background
        x -= sx0; y -= sy0
        ix, iy = np.floor(x).astype(int), np.floor(y).astype(int)
        fx, fy = (x-ix)[..., None], (y-iy)[..., None]
        colour = (patch[iy, ix]*(1-fx)+patch[iy, ix+1]*fx)*(1-fy)+(patch[iy+1, ix]*(1-fx)+patch[iy+1, ix+1]*fx)*fy
        distance = np.full((SIZE, SIZE), np.inf)
        for path in paths(key):
            q = (np.array(path)-.5)*[WIDTHS[key]-STROKE, HEIGHT-STROKE]
            for a, b in zip(q[:-1], q[1:]):
                delta = b-a
                t = np.clip(np.sum((points-a)*delta, axis=-1)/np.dot(delta, delta), 0, 1)
                distance = np.minimum(distance, np.linalg.norm(points-a-t[..., None]*delta, axis=-1))
        alpha = np.clip(.5+(STROKE/2-distance)/pixel, 0, 1)[..., None]
        tile = np.rint(colour*(1-alpha)+ink*alpha).astype(np.uint8)
        row, column = divmod(index, 2)
        atlas[row*SIZE:(row+1)*SIZE, column*SIZE:(column+1)*SIZE] = tile
        reports[key] = {'tile': [column, row], 'pixels_per_mm': SIZE/SPAN, 'background_rgb': background.tolist(), 'ink_rgb': ink.tolist()}
    output = FOLDER/'derived-textures/abxy-planar-print.png'
    Image.fromarray(atlas).save(output)
    report = {'output': output.name, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
              'tile_size': SIZE, 'tile_span_mm': SPAN, 'glyphs': reports,
              'status': 'Same photograph-fitted outlines; higher resolution and planar base-colour mapping, not a verified factory typeface.'}
    (FOLDER/'abxy-planar-print-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__': main()
