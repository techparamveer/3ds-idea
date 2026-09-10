"""Reversible masked lid-face reflectance comparison."""
from pathlib import Path
import bpy,importlib
import render_reference_camera
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 obj=bpy.data.objects['Sourced inner lid'];old=obj.active_material;mat=old.copy();mat.name='Lid face specular study'
 try:
  count=0
  for node in mat.node_tree.nodes:
   if node.type=='TEX_IMAGE' and node.image and Path(node.image.filepath).name=='body-legends-specular.png':
    node.image=bpy.data.images.load(str(FOLDER/'derived-textures/lid-face-specular.png'),check_existing=True);node.image.reload();node.image.colorspace_settings.name='Non-Color';count+=1
  assert count==1
  obj.active_material=mat;importlib.reload(render_reference_camera);render_reference_camera.main('reference-lid-face')
 finally:obj.active_material=old;bpy.data.materials.remove(mat)
if __name__=='__main__':main()
