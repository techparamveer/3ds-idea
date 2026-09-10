"""Give the four ABXY caps an independent restrained plastic finish."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 assert Path(bpy.data.filepath).name=='silver-abxy-round.blend'
 objects=[bpy.data.objects['Button_'+key] for key in 'ABXY']
 original=objects[0].active_material
 assert all(o.active_material==original for o in objects)
 material=original.copy();material.name='Sourced ABXY plastic'
 material['console_material_role']='sourced-plastic'
 if 'console_paint_mask' in material:del material['console_paint_mask']
 image=bpy.data.images.load(str(FOLDER/'derived-textures/abxy-metallic-roughness.png'),check_existing=False)
 image.colorspace_settings.name='Non-Color';image.pack()
 replaced=0
 for n in material.node_tree.nodes:
  if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.15
  if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='body-legends-metallic-roughness.png':n.image=image;replaced+=1
 assert replaced==1
 for obj in objects:obj.active_material=material
 root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
 root['abxy_finish']=json.dumps(json.loads((FOLDER/'abxy-finish-report.json').read_text()))
 root['source_changes']+=' Independent ABXY plastic with source normal strength 0.15 and roughness range 0.46–0.54; source ink and geometry retained.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-abxy-finish.blend'))
 exporter.export_static(root,hinge,FOLDER/'silver-abxy-finish.glb',restore_frames=False,export_attributes=True)
 frames.restore_export_frames(FOLDER/'silver-abxy-finish.glb')
if __name__=='__main__':main()
