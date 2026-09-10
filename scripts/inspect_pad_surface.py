"""Reversible circle-pad material diagnostics at matched macro scale."""
import bpy,importlib
import render_sourced_dimensions as renderer

def main(mode='before'):
 obj=bpy.data.objects['Button_Circle'];old=obj.data.materials[0];material=old.copy();obj.data.materials[0]=material
 try:
  shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
  if mode in ('normal-off','plain-rubber'):
   for link in list(shader.inputs['Normal'].links):material.node_tree.links.remove(link)
  if mode in ('roughness-fixed','plain-rubber','rubber-trial'):
   for link in list(shader.inputs['Roughness'].links):material.node_tree.links.remove(link)
   shader.inputs['Roughness'].default_value=.7 if mode=='rubber-trial' else .8
  if mode=='rubber-trial':
   socket=shader.inputs['Base Color'];source=socket.links[0].from_socket
   mix=material.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(.8,.8,.8,1)
   material.node_tree.links.new(source,mix.inputs[1]);material.node_tree.links.new(mix.outputs[0],socket)
  importlib.reload(renderer)
  renderer.VIEWS=[('pad',-155,(-62,-40,140),(-62,15,14),30,0)]
  renderer.main('pad-surface-'+mode)
 finally:
  obj.data.materials[0]=old;bpy.data.materials.remove(material)
if __name__=='__main__':main()
