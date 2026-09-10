"""Install UV1 lower-key maps on planar cap faces; retain carried UV0 frames."""
from pathlib import Path
import json,importlib
import bpy
import numpy as np
import texture_sourced_model as exporter
import curve_sourced_shell as frames
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def apply():
 assert Path(bpy.data.filepath).name=='silver-lid-face.blend'
 spec=json.loads((FOLDER/'legends-atlas-report.json').read_text())
 originals=[(bpy.data.objects['Button_'+k],bpy.data.objects['Button_'+k].data) for k in ['SELECT','HOME','START']]
 material=originals[0][0].data.materials[0].copy();material.name='Sourced clean lower-key lettering';images=[]
 nodes,links=material.node_tree.nodes,material.node_tree.links
 uv=nodes.new('ShaderNodeUVMap');uv.uv_map='LowerLabelPrint'
 targets={'body-etched-basecolor.png':'basecolor','body-legends-metallic-roughness.png':'metallic-roughness','body-etched-normal.png':'normal','body-legends-specular.png':'specular'}
 found=[]
 for node in nodes:
  if node.type!='TEX_IMAGE' or not node.image:continue
  key=targets.get(Path(node.image.filepath).name)
  if not key:continue
  image=bpy.data.images.load(str(FOLDER/'derived-textures'/f'lower-clean-{key}.png'),check_existing=False);image.colorspace_settings.name='sRGB' if key=='basecolor' else 'Non-Color';node.image=image;images.append(image);found.append(key)
  links.new(uv.outputs[0],node.inputs['Vector'])
 assert sorted(found)==sorted(targets.values()),found
 for node in nodes:
  if node.type=='NORMAL_MAP':node.uv_map='UVMap'
 for row,(obj,old) in enumerate(originals):
  mesh=old.copy();obj.data=mesh;mesh.materials.append(material)
  p=np.array([v.co[:] for v in mesh.vertices]);centre=np.array(spec['measurements'][obj.name]['center_local_mm']);top=p[:,2].max()
  coords=np.stack(((16+p[:,0]-centre[0])/32,1-((row+.5)*8-(p[:,1]-centre[1]))/24),axis=-1)
  loop=np.array([l.vertex_index for l in mesh.loops]);layer=mesh.uv_layers.new(name='LowerLabelPrint');layer.data.foreach_set('uv',coords[loop].astype(np.float32).ravel());mesh.uv_layers.active_index=0;mesh.uv_layers[0].active_render=True
  for poly in mesh.polygons:
   if all(p[i,2]>top-1e-5 for i in poly.vertices):poly.material_index=len(mesh.materials)-1
 return originals,material,images

def preview():
 originals,material,images=apply()
 try:
  importlib.reload(renderer);renderer.VIEWS=[('keys',-155,(0,-40,160),(0,-40,14),95,0)]
  renderer.main('lower-clean-mapped',resolution=(1400,650))
 finally:
  for obj,old in originals:
   mesh=obj.data;obj.data=old;bpy.data.meshes.remove(mesh)
  bpy.data.materials.remove(material)
  for image in images:bpy.data.images.remove(image)
  importlib.reload(renderer)

def main():
 _,_,images=apply()
 for image in images:image.pack()
 root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
 root['lower_label_maps']=(FOLDER/'lower-label-maps-report.json').read_text()
 root['source_changes']+=' Replaced low-resolution lower-key labels with photograph-constrained UV1 artwork and restrained recessed normal shading; retained cap geometry and non-top materials.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-lower-labels.blend'))
 output=FOLDER/'silver-lower-labels.glb';exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True);frames.restore_export_frames(output)
 print('Saved clean lower-key checkpoint.')
