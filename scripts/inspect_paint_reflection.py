"""Compare paint scratch maps under a narrower reflection; restore scene state."""
from pathlib import Path
import bpy,importlib,math
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main(use_scratch=False, prefix=None):
 lights=[o for o in bpy.context.scene.objects if o.type=='LIGHT'];light_settings=[(o,o.data.energy,o.data.size) for o in lights]
 background=next(n for n in bpy.context.scene.world.node_tree.nodes if n.type=='BACKGROUND');strength=background.inputs['Strength'].default_value
 saved=[];images=[];materials=[]
 try:
  for i,o in enumerate(lights):o.data.size=35;o.data.energy=110000 if i==0 else 6000
  background.inputs['Strength'].default_value=.15
  if use_scratch:
   for kind,name,source in [('lid','Sourced outer lid','body-legends-metallic-roughness.png'),('cover','Sourced graphite chassis','socket-graphite-metallic-roughness.png')]:
    obj=bpy.data.objects[name];saved.append((obj,obj.active_material));m=obj.active_material.copy();materials.append(m);obj.active_material=m
    image=bpy.data.images.load(str(FOLDER/('derived-textures/paint-'+kind+'-scratches-metallic-roughness.png')),check_existing=False);images.append(image);image.colorspace_settings.name='Non-Color'
    n=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name==source);n.image=image
    normal=bpy.data.images.load(str(FOLDER/('derived-textures/paint-'+kind+'-scratches-normal.png')),check_existing=False);images.append(normal);normal.colorspace_settings.name='Non-Color'
    normal_source='body-etched-normal.png' if kind=='lid' else 'body-socket-normal.png'
    n=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name==normal_source);n.image=normal
  importlib.reload(renderer)
  # Looking up from below flips camera Y. Roll the underside camera so the
  # camera-relative key stays opposite the viewer across the surface normal.
  renderer.VIEWS=[('lid',0,(0,-90,200),(0,-10,22),40,0),('cover',0,(45,-90,-200),(45,-10,1),40,math.pi)]
  renderer.main(prefix or 'paint-reflection-'+('after' if use_scratch else 'before'),light_offsets=[(0,150,140),(140,0,100)])
 finally:
  for o,m in saved:o.active_material=m
  for m in materials:bpy.data.materials.remove(m)
  for i in images:bpy.data.images.remove(i)
  for o,e,s in light_settings:o.data.energy=e;o.data.size=s
  background.inputs['Strength'].default_value=strength
if __name__=='__main__':main()
