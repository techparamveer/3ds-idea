"""Render authored roughness maps without saving material changes."""
from pathlib import Path
import bpy,importlib
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl/derived-textures'
def main():
 originals=[];loaded=[]
 try:
  for material in bpy.data.materials:
   if not material.users or material.get('console_material_role')!='sourced-body':continue
   for node in material.node_tree.nodes:
    if node.type!='TEX_IMAGE' or node.image is None:continue
    name=Path(node.image.filepath).name
    prefix={'body-legends-metallic-roughness.png':'body','body-socket-metallic-roughness.png':'socket'}.get(name)
    if prefix is None:continue
    image=bpy.data.images.load(str(FOLDER/(prefix+'-graphite-metallic-roughness.png')),check_existing=False)
    image.colorspace_settings.name='Non-Color';loaded.append(image);originals.append((node,node.image));node.image=image
  assert len(originals)==2
  importlib.reload(renderer);renderer.main('graphite-trial',only={'front','open','side'})
 finally:
  for node,image in originals:node.image=image
  for image in loaded:bpy.data.images.remove(image)
if __name__=='__main__':main()
