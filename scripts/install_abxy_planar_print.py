"""Install the inspected high-resolution planar cap-print atlas."""
from pathlib import Path
import json
import bpy
import preview_abxy_planar_print as printing
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    assert Path(bpy.data.filepath).name == 'silver-abxy-rollover.blend'
    _, _, image = printing.apply(); image.pack()
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    root['abxy_planar_print'] = (FOLDER/'abxy-planar-print-report.json').read_text()
    root['source_changes'] += ' Added higher-resolution planar ABXY printing using the existing authored outlines, retaining source UVs for plastic maps and all geometry.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-abxy-print.blend'))
    output = FOLDER/'silver-abxy-print.glb'
    exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    frames.restore_export_frames(output)


if __name__ == '__main__': main()
