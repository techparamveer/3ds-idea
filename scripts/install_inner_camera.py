"""Apply the inspected optical finish to the sourced inner camera only."""
from pathlib import Path
import bpy
import inspect_inner_camera
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    assert Path(bpy.data.filepath).name=='silver-speakers.blend'
    inspect_inner_camera.install()
    root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
    root['source_changes']+=' Independent inner-camera optical colour/roughness maps, fitted to the reference; original insert geometry retained.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-camera.blend'))
    exporter.export_static(root,hinge,FOLDER/'silver-camera.glb',restore_frames=False,export_attributes=True)
    frames.restore_export_frames(FOLDER/'silver-camera.glb')

if __name__=='__main__':main()
