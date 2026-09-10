"""Install photograph-fitted ABXY ink on the independent cap material."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    assert Path(bpy.data.filepath).name=='silver-abxy-finish.blend'
    mat=bpy.data.objects['Button_A'].active_material
    assert mat.users==4
    nodes=[n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='body-etched-basecolor.png']
    assert len(nodes)==1
    image=bpy.data.images.load(str(FOLDER/'derived-textures/abxy-fitted-basecolor.png'),check_existing=False)
    image.colorspace_settings.name='sRGB';image.pack();nodes[0].image=image
    root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
    root['abxy_ink']=json.dumps(json.loads((FOLDER/'abxy-ink-report.json').read_text()))
    root['source_changes']+=' Authored wider and heavier ABXY ink guided by original XL photographs; not a verified factory font. All geometry and other maps retained.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-abxy-ink.blend'))
    exporter.export_static(root,hinge,FOLDER/'silver-abxy-ink.glb',restore_frames=False,export_attributes=True)
    frames.restore_export_frames(FOLDER/'silver-abxy-ink.glb')

if __name__=='__main__':main()
