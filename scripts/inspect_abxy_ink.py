"""Preview the fitted ink on the independent cap material without saving."""
from pathlib import Path
import bpy,importlib
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 material=bpy.data.objects['Button_A'].active_material
 assert material.users==4
 node=next(n for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='body-etched-basecolor.png')
 original=node.image
 image=bpy.data.images.load(str(FOLDER/'derived-textures/abxy-fitted-basecolor.png'),check_existing=False);image.colorspace_settings.name='sRGB'
 try:
  node.image=image
  importlib.reload(renderer)
  renderer.VIEWS=[('abxy',-155,(61,-45,150),(61,9,14),33,0)]
  renderer.main('abxy-ink-trial')
 finally:node.image=original;bpy.data.images.remove(image)
if __name__=='__main__':main()
