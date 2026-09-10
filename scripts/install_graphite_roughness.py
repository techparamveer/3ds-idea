"""Install verified dark-plastic roughness maps, keeping geometry and other maps."""
from pathlib import Path
import bpy,json
import texture_sourced_model as exporter
import curve_sourced_shell as frames
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'model/candidates/joshua-xl'
def main():
 assert Path(bpy.data.filepath).name=='silver-recess.blend'
 replaced=[]
 for obj_name in ['Sourced inner lid','Sourced graphite chassis']:
  obj=bpy.data.objects[obj_name]
  material=obj.data.materials[0]
  if obj_name=='Sourced inner lid':
   material=material.copy();material.name='Sourced matte inner lid';obj.data.materials[0]=material
  for node in material.node_tree.nodes:
   if node.type!='TEX_IMAGE' or node.image is None:continue
   prefix={'body-legends-metallic-roughness.png':'body','body-socket-metallic-roughness.png':'socket'}.get(Path(node.image.filepath).name)
   if prefix is None:continue
   image=bpy.data.images.load(str(FOLDER/'derived-textures'/(prefix+'-graphite-metallic-roughness.png')),check_existing=False)
   image.colorspace_settings.name='Non-Color';image.pack();node.image=image;replaced.append(prefix)
 assert sorted(replaced)==['body','socket']
 root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
 root['graphite_roughness']=json.dumps(json.loads((FOLDER/'graphite-roughness-report.json').read_text()))
 root['source_changes']+=' Compressed dark dielectric roughness on inner lid and chassis only; other objects, silver paint, metal, colour and normal maps retained.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-plastic.blend'))
 exporter.export_static(root,hinge,FOLDER/'silver-plastic.glb',restore_frames=False,export_attributes=True)
 frames.restore_export_frames(FOLDER/'silver-plastic.glb')
if __name__=='__main__':main()
