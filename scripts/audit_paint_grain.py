"""Read-only pixel audit of Blender's paint-grain atlases; writes a JSON report.

Requires NumPy and Pillow. This compares decoded pixels rather than relying on
the texture filenames or the shader mask graph to establish preservation.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'model/candidates/joshua-xl'


def main():
    mask = np.array(Image.open(FOLDER/'derived-textures/paint-mask.png')) > 127
    report = {'paint_pixels': int(mask.sum()), 'unpainted_pixels': int((~mask).sum()), 'maps': {}}
    assert report['paint_pixels'] == 5044041
    for kind in ['normal', 'metallic-roughness']:
        source = FOLDER/('source-textures/body-'+kind+'.png')
        output = FOLDER/('derived-textures/body-paint-grain-'+kind+'.png')
        before = np.array(Image.open(source)).astype(np.int16)
        after = np.array(Image.open(output)).astype(np.int16)
        assert before.shape == after.shape == (4096, 4096, 3)
        difference = after-before
        unpainted_changes = int(np.any(difference[~mask], axis=1).sum())
        painted_changes = int(np.any(difference[mask], axis=1).sum())
        assert unpainted_changes == 0, 'Unpainted source pixels must remain exact'
        assert painted_changes > report['paint_pixels']*.8, 'Grain must cover the painted broad faces'
        if kind == 'metallic-roughness':
            assert np.array_equal(before[:, :, [0, 2]], after[:, :, [0, 2]])
            assert np.max(abs(difference[:, :, 1])) <= 20
        else:
            assert np.max(abs(difference)) <= 16
            normal = after[mask].astype(float)/127.5-1
            assert np.max(abs(np.linalg.norm(normal, axis=1)-1)) < .009
        report['maps'][kind] = {
            'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'output_sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
            'unpainted_changed_pixels': unpainted_changes, 'paint_changed_pixels': painted_changes,
            'max_absolute_channel_delta_8bit': np.max(abs(difference), axis=(0, 1)).tolist(),
            'paint_channel_delta_percentiles_1_50_99_8bit': np.percentile(difference[mask], [1, 50, 99], axis=0).tolist(),
        }
    path = FOLDER/'paint-grain-pixel-audit.json'
    path.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
