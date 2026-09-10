"""Reversible UV1 clean-label trial, without changing source atlas or geometry."""
from pathlib import Path
import json,importlib
import bpy
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
 assert Path(bpy.data.filepath).name=='silver-lid-face.blend'
 report=json.loads((FOLDER/'legends-atlas-report.json').read_text())
 controls=[bpy.data.objects['Button_'+n] for n in ['SELECT','HOME','START']]
 saved=[o.data.materials[0] for o in controls];layers=[];images=[]
 trial=saved[0].copy();trial.name='Temporary clean lower labels'
 nodes,links=trial.node_tree.nodes,trial.node_tree.links
 def tex(path,uvname=None):
  image=bpy.data.images.load(str(FOLDER/'derived-textures'/path),check_existing=False);images.append(image);image.colorspace_settings.name='Non-Color'
  n=nodes.new('ShaderNodeTexImage');n.image=image;n.extension='CLIP'
  if uvname:
   uv=nodes.new('ShaderNodeUVMap');uv.uv_map=uvname;links.new(uv.outputs[0],n.inputs['Vector'])
  return n.outputs['Color']
 def math(op,a,b):
  n=nodes.new('ShaderNodeMath');n.operation=op
  for socket,value in zip(n.inputs,[a,b]):
   if isinstance(value,(float,int)):socket.default_value=value
   else:links.new(value,socket)
  return n.outputs[0]
 old=tex('body-legends-ink-mask.png');new=tex('lower-label-clean-mask.png','LowerLabelPrint')
 shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
 base=shader.inputs['Base Color'].links[0].from_socket
 ratio=math('DIVIDE',math('SUBTRACT',1,math('MULTIPLY',new,.82)),math('SUBTRACT',1,math('MULTIPLY',old,.82)))
 scale=nodes.new('ShaderNodeVectorMath');scale.operation='SCALE';links.new(base,scale.inputs[0]);links.new(ratio,scale.inputs['Scale']);links.new(scale.outputs[0],shader.inputs['Base Color'])
 spec=shader.inputs['Specular IOR Level'].links[0].from_socket
 ratio=math('DIVIDE',math('SUBTRACT',1,math('MULTIPLY',new,.95)),math('SUBTRACT',1,math('MULTIPLY',old,.95)))
 links.new(math('MULTIPLY',spec,ratio),shader.inputs['Specular IOR Level'])
 bump=nodes.new('ShaderNodeBump');bump.invert=True;links.new(new,bump.inputs['Height'])
 normal=shader.inputs['Normal'].links[0].from_socket;links.new(normal,bump.inputs['Normal']);links.new(bump.outputs[0],shader.inputs['Normal'])
 try:
  for row,o in enumerate(controls):
   assert 'LowerLabelPrint' not in o.data.uv_layers
   uv=o.data.uv_layers.new(name='LowerLabelPrint');layers.append((o,uv.name))
   centre=report['measurements'][o.name]['center_local_mm']
   for p in o.data.polygons:
    top=p.normal.z>.5
    for li in p.loop_indices:
     v=o.data.vertices[o.data.loops[li].vertex_index].co
     uv.data[li].uv=((16+v.x-centre[0])/32,1-((row+.5)*8-(v.y-centre[1]))/24) if top else (-2,-2)
   # Preserve active UV0 for every pre-existing image node.
   o.data.uv_layers.active_index=0;o.data.materials[0]=trial
  for depth in [0,.02,.05]:
   bump.inputs['Distance'].default_value=depth
   importlib.reload(renderer);renderer.VIEWS=[('keys',-155,(0,-40,160),(0,-40,14),95,0)]
   renderer.main('lower-clean-depth-'+str(depth).replace('.','p'),resolution=(1400,650))
 finally:
  for o,m in zip(controls,saved):o.data.materials[0]=m
  for o,name in layers:o.data.uv_layers.remove(o.data.uv_layers[name]);o.data.uv_layers.active_index=0
  bpy.data.materials.remove(trial)
  for image in images:bpy.data.images.remove(image)
  importlib.reload(renderer)
 print('Clean label trial complete; original materials and UV layers restored.')
