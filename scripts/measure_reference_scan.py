"""Read Wesk's reference-only STL scans; report broad curvature, never ship meshes.

STL has no units. Millimetres are inferred from the approximately 155 mm shell
width and Nintendo's 156 mm complete console specification. Placement tilt is
fitted separately from the shallow quadratic surface terms. A physical scan can
include wear, warping and capture error; this is not manufacturer CAD.
"""
from pathlib import Path
import hashlib
import json
import struct
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / '.local/reference-scans/wesk'
STL_TYPE = np.dtype([('normal', '<f4', (3,)), ('vertices', '<f4', (3, 3)), ('attribute', '<u2')])


def measurements():
    report = {
        'source': 'https://bitbuilt.net/forums/threads/3ds-xl-ll-scan.7046/',
        'author': 'Wesk', 'published': '2025-09-05',
        'download': 'https://bitbuilt.net/wesk/3D%20Scans/3DSXL-LL.zip',
        'archive_sha256': hashlib.file_digest((FOLDER / '3DSXL-LL.zip').open('rb'), 'sha256').hexdigest(),
        'use': 'Reference only. Raw scans remain in ignored local storage.',
        'units': 'Millimetres inferred from physical shell width; STL itself has no unit field.',
        'method': 'Every tenth triangle centroid, with outward-facing normal Z > 0.94 in the appropriate direction. Least-squares fit to c + ax + by + dxx + exy + fyy; x/y centred before fitting. Separate sampling windows bound sensitivity.',
        'specification': 'https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html',
        'parts': [],
    }
    profiles = []
    for name, center, sign in [('Top Shell.stl', (250, 214.027), 1), ('Battery Cover.stl', (125, 102.449), -1)]:
        path = FOLDER / name
        with path.open('rb') as stream:
            stream.seek(80)
            count = struct.unpack('<I', stream.read(4))[0]
        assert path.stat().st_size == 84 + count * 50
        triangles = np.memmap(path, dtype=STL_TYPE, mode='r', offset=84, shape=(count,))
        points = triangles['vertices'][::10].mean(axis=1).astype(float)
        normals = triangles['normal'][::10]
        x, y = (points[:, :2] - center).T
        part = {'file': name, 'triangles': count, 'center_xy': center,
                'surface_normal_sign': sign, 'fits': [],
                'bounds_min': triangles['vertices'].min(axis=(0, 1)).tolist(),
                'bounds_max': triangles['vertices'].max(axis=(0, 1)).tolist()}
        for width, depth in [(55, 25), (60, 30), (65, 30)]:
            selected = (abs(x) < width) & (abs(y) < depth) & (sign * normals[:, 2] > .94)
            X, Y, Z = x[selected], y[selected], points[selected, 2]
            design = np.column_stack([np.ones(len(X)), X, Y, X*X, X*Y, Y*Y])
            coefficients = np.linalg.lstsq(design, Z, rcond=None)[0]
            errors = Z - design @ coefficients
            part['fits'].append({'half_width_mm': width, 'half_depth_mm': depth,
                                 'sample_count': len(X), 'coefficients_c_x_y_xx_xy_yy': coefficients.tolist(),
                                 'rms_mm': float(np.sqrt(np.mean(errors*errors))),
                                 'absolute_error_percentiles_50_90_99_mm': np.percentile(abs(errors), [50, 90, 99]).tolist()})
        coefficients = np.array(part['fits'][-1]['coefficients_c_x_y_xx_xy_yy'])
        for axis in (0, 1):
            along, across = (x, y) if axis == 0 else (y, x)
            selected = (abs(across) < .5) & (abs(along) < (66 if axis == 0 else 31)) & (sign*normals[:, 2] > .94)
            # Remove fitted placement plane, retaining measured curvature and residuals.
            height = points[:, 2] - coefficients[0] - coefficients[1]*x - coefficients[2]*y
            profiles.append((name, axis, along[selected], height[selected], coefficients))
        report['parts'].append(part)
    return report, profiles


def main():
    report, profiles = measurements()
    path = ROOT / 'docs/reference-scan-measurements.json'
    path.write_text(json.dumps(report, indent=2) + '\n')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(2, 2, figsize=(10, 6.5), sharey=False)
    for axis, (name, direction, coordinate, height, coefficients) in zip(axes.flat, profiles):
        limit = 65 if direction == 0 else 30
        x = np.linspace(-limit, limit, 200)
        coefficient = coefficients[3 if direction == 0 else 5]
        axis.scatter(coordinate, height, s=3, color='#939393', alpha=.4, label='Scan samples; placement tilt removed')
        axis.plot(x, coefficient*x*x, color='#24546e', lw=1.7, label='Broad fitted curvature')
        axis.axhline(0, color='#a83b35', lw=1.1, ls='--', label='Planar source face')
        axis.set(xlabel=('Across width' if direction == 0 else 'Along depth') + ' (mm)', ylabel='Height from fitted centre plane (mm)',
                 title=('Outer lid' if name.startswith('Top') else 'Battery cover') + (' · width' if direction == 0 else ' · depth'), xlim=(-limit, limit))
        axis.spines[['top', 'right']].set_visible(False)
        axis.grid(alpha=.15)
    handles, labels = axes[0, 0].get_legend_handles_labels()
    fig.legend(handles, labels, loc='lower center', bbox_to_anchor=(.5, .05), ncol=3, frameon=False, fontsize=8)
    fig.suptitle('Shallow shell curvature in the original XL reference scan', x=.08, ha='left')
    fig.text(.08, .022, 'Source: Wesk, original 3DS XL/LL scan (2025). One scanned unit; not manufacturer CAD. Vertical scale is exaggerated.', fontsize=8)
    fig.tight_layout(rect=(0, .10, 1, .94))
    fig.savefig(ROOT / 'docs/reference-scan-profiles.png', dpi=160)
    plt.close(fig)
    print(path)


if __name__ == '__main__':
    main()
