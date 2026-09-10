"""Reversible preview of scratch roughness on the two silver panels."""
from pathlib import Path
import bpy,importlib
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 saved=[];images=[];materials=[]
 try:
  for kind,name,source in [('lid','Sourced outer lid','body-legends-metallic-roughness.png'),('cover','Sourced graphite chassis','socket-graphite-metallic-roughness.png')]:
   obj=bpy.data.objects[name];saved.append((obj,obj.active_material));m=obj.active_material.copy();materials.append(m);obj.active_material=m
   image=bpy.data.images.load(str(FOLDER/('derived-textures/paint-'+kind+'-scratches-metallic-roughness.png')),check_existing=False);images.append(image);image.colorspace_settings.name='Non-Color'
   n=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name==source);n.image=image
   normal=bpy.data.images.load(str(FOLDER/('derived-textures/paint-'+kind+'-scratches-normal.png')),check_existing=False);images.append(normal);normal.colorspace_settings.name='Non-Color'
   normal_source='body-etched-normal.png' if kind=='lid' else 'body-socket-normal.png'
   n=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name==normal_source);n.image=normal
  importlib.reload(renderer)
  renderer.VIEWS=[('lid-macro',0,(0,-90,200),(0,-10,22),40,0),('cover-macro',0,(45,-90,-200),(45,-10,1),40,0)]+[v for v in renderer.VIEWS if v[0] in ['top','underside']]
  renderer.main('surface-scratches-trial')
 finally:
  for o,m in saved:o.active_material=m
  for m in materials:bpy.data.materials.remove(m)
  for i in images:bpy.data.images.remove(i)
if __name__=='__main__':main()
