"""Install masked matte inner-lid reflectance with all geometry retained."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 assert Path(bpy.data.filepath).name=='silver-upper-width.blend'
 obj=bpy.data.objects['Sourced inner lid'];mat=obj.active_material.copy();mat.name='Sourced matte inner-lid face';count=0
 for node in mat.node_tree.nodes:
  if node.type=='TEX_IMAGE' and node.image and Path(node.image.filepath).name=='body-legends-specular.png':
   node.image=bpy.data.images.load(str(FOLDER/'derived-textures/lid-face-specular.png'),check_existing=True);node.image.reload();node.image.colorspace_settings.name='Non-Color';count+=1
 assert count==1;obj.active_material=mat
 root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge'];root['lid_face_specular']=(FOLDER/'lid-face-specular-study.json').read_text()
 root['source_changes']+=' Localized inner-lid flat-face specular attenuation, retaining steep-edge and hinge-barrel reflectance.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-lid-face.blend'))
 output=FOLDER/'silver-lid-face.glb';exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True);frames.restore_export_frames(output)
if __name__=='__main__':main()
