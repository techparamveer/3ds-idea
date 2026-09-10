"""Install localized power rim normals with a compact second-UV texture."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
    assert Path(bpy.data.filepath).name=='silver-power-fit.blend'
    report=json.loads((FOLDER/'power-finish-study.json').read_text())
    x,y=report['crop_origin_pixels'];w,h=report['crop_size_pixels'];aw,ah=report['atlas_size_pixels']
    obj=bpy.data.objects['Button_POWER'];obj.data=obj.data.copy();mesh=obj.data
    source_uv=mesh.uv_layers.active;dest=mesh.uv_layers.new(name='PowerFinish')
    for a,b in zip(source_uv.data,dest.data):b.uv=((a.uv.x*aw-x)/w,1-((1-a.uv.y)*ah-y)/h)
    source_uv.active_render=True;mesh.uv_layers.active_index=0
    mat=obj.active_material.copy();mat.name='Sourced satin power cap';obj.active_material=mat
    count=0
    for n in list(mat.node_tree.nodes):
        if n.type!='TEX_IMAGE' or not n.image:continue
        name=Path(n.image.filepath).name
        if name=='body-etched-normal.png':
            n.image=bpy.data.images.load(str(FOLDER/'derived-textures/power-rim-normal-crop.png'),check_existing=True);n.image.colorspace_settings.name='Non-Color'
            uv=mat.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='PowerFinish';mat.node_tree.links.new(uv.outputs['UV'],n.inputs['Vector']);count+=1
        if name=='body-legends-metallic-roughness.png':
            n.image=next(n.image for n in bpy.data.objects['Button_A'].data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='abxy-metallic-roughness.png');count+=1
    assert count==2
    root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge'];root['power_finish']=json.dumps(report)
    root['source_changes']+=' Restrained power rim normal distortion and satin roughness, with preserved symbol region and compact normal atlas.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-power-finish.blend'))
    output=FOLDER/'silver-power-finish.glb';exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True);frames.restore_export_frames(output)
if __name__=='__main__':main()
