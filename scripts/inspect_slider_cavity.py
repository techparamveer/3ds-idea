"""Reversible inner-lid cavity-colour trial."""
from pathlib import Path
import bpy,importlib
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 mat=bpy.data.objects['Sourced inner lid'].data.materials[0]
 node=next(n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='body-etched-basecolor.png')
 normal_node=next(n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='body-etched-normal.png')
 old_normal=normal_node.image;new_normal=bpy.data.images.load(str(FOLDER/'derived-textures/body-slider-dot-normal.png'),check_existing=False);new_normal.colorspace_settings.name='Non-Color'
 old=node.image;image=bpy.data.images.load(str(FOLDER/'derived-textures/body-slider-basecolor.png'),check_existing=False);image.colorspace_settings.name='sRGB'
 try:
  node.image=image;normal_node.image=new_normal;importlib.reload(renderer)
  renderer.VIEWS=[('slider',-155,(70,-180,250),(70,65,30),35,0),*renderer.VIEWS[:2]]
  renderer.main('slider-cavity-trial')
 finally:
  node.image=old;normal_node.image=old_normal;bpy.data.images.remove(image);bpy.data.images.remove(new_normal)
if __name__=='__main__':main()
