"""Install the photographed satin D-pad finish on the rounded cap only."""
from pathlib import Path
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    assert Path(bpy.data.filepath).name=='silver-dpad-fit.blend'
    obj=bpy.data.objects['Button_Dpad'];material=obj.active_material.copy()
    material.name='Sourced satin D-pad plastic'
    replaced=0
    for node in material.node_tree.nodes:
        if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=.15
        if node.type=='TEX_IMAGE' and node.image and Path(node.image.filepath).name=='body-legends-metallic-roughness.png':
            # The same satin transform is already embedded for ABXY. Share that
            # image after verifying bytes, rather than add a duplicate atlas.
            assert (FOLDER/'derived-textures/dpad-metallic-roughness.png').read_bytes()==(FOLDER/'derived-textures/abxy-metallic-roughness.png').read_bytes()
            image=next(n.image for n in bpy.data.objects['Button_A'].data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='abxy-metallic-roughness.png')
            node.image=image;replaced+=1
    assert replaced==1
    obj.active_material=material
    root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
    root['dpad_finish']='Satin cap: roughness .46 + .08*source, normal strength .15. Authored appearance estimates; colour, glyphs, geometry and rig retained.'
    root['source_changes']+=' Refined D-pad satin plastic with restrained roughness variation and normal strength.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-dpad-finish.blend'))
    output=FOLDER/'silver-dpad-finish.glb'
    exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True)
    frames.restore_export_frames(output)

if __name__=='__main__':main()
