"""Install the inspected rounded ABXY rim trial in a new source checkpoint."""
from pathlib import Path
import json
import bpy
import preview_abxy_rollover as rollover
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    assert Path(bpy.data.filepath).name == 'silver-power-indicator.blend'
    reports = [rollover.refine(bpy.data.objects['Button_'+key]) for key in 'ABXY']
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    root['abxy_rollover'] = json.dumps(reports)
    root['source_changes'] += ' Rounded the ABXY bevel cross-section and replaced uneven cap shading frames with continuous radial normals; retained cap extents, top ink and materials.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-abxy-rollover.blend'))
    output = FOLDER/'silver-abxy-rollover.glb'
    exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    frames.restore_export_frames(output)


if __name__ == '__main__': main()
