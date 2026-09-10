"""Give the sourced circle pad its own rubber material; keep its geometry."""
from pathlib import Path
import bpy,json
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 assert Path(bpy.data.filepath).name=='silver-plastic.blend'
 obj=bpy.data.objects['Button_Circle'];material=obj.data.materials[0].copy();material.name='Sourced circle pad rubber';obj.data.materials[0]=material
 material['console_material_role']='sourced-rubber'
 if 'console_paint_mask' in material:del material['console_paint_mask']
 shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 socket=shader.inputs['Base Color'];source=socket.links[0].from_socket
 mix=material.node_tree.nodes.new('ShaderNodeMix');mix.data_type='RGBA';mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[7].default_value=(.8,.8,.8,1)
 material.node_tree.links.new(source,mix.inputs[6]);material.node_tree.links.new(mix.outputs[2],socket)
 replaced=0
 for node in material.node_tree.nodes:
  if node.type=='TEX_IMAGE' and node.image and Path(node.image.filepath).name=='body-legends-metallic-roughness.png':
   image=bpy.data.images.load(str(FOLDER/'derived-textures/pad-rubber-metallic-roughness.png'),check_existing=False);image.colorspace_settings.name='Non-Color';image.pack();node.image=image;replaced+=1
 assert replaced==1
 root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge'];root['pad_rubber']=json.dumps(json.loads((FOLDER/'pad-rubber-report.json').read_text()))
 root['source_changes']+=' Independent circle-pad rubber finish with narrowed roughness and 0.8 linear colour multiplier; source maps and geometry retained.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-rubber.blend'))
 exporter.export_static(root,hinge,FOLDER/'silver-rubber.glb',restore_frames=False,export_attributes=True);frames.restore_export_frames(FOLDER/'silver-rubber.glb')
if __name__=='__main__':main()
