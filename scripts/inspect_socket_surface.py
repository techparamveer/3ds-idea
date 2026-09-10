"""Reversible local socket material trial. Does not bake or save the model."""
import bpy,importlib
import render_sourced_dimensions as renderer

def main(prefix='socket-material'):
    obj=bpy.data.objects['Sourced graphite chassis'];original=obj.data.materials[0]
    material=original.copy();material.name='Temporary socket surface trial'
    obj.data.materials[0]=material
    nodes,links=material.node_tree.nodes,material.node_tree.links
    def connect(value,socket):
        if isinstance(value,(int,float,tuple,list)):socket.default_value=value
        else:links.new(value,socket)
    def math(op,a,b):
        node=nodes.new('ShaderNodeMath');node.operation=op
        connect(a,node.inputs[0]);connect(b,node.inputs[1]);return node.outputs[0]
    def fade(v,a,b):
        node=nodes.new('ShaderNodeMapRange');node.interpolation_type='SMOOTHSTEP';node.clamp=True
        connect(v,node.inputs['Value']);node.inputs['From Min'].default_value=a;node.inputs['From Max'].default_value=b
        return node.outputs[0]
    def mix(a,b,f):
        node=nodes.new('ShaderNodeMixRGB')
        for value,socket in zip([f,a,b],node.inputs):connect(value,socket)
        return node.outputs[0]
    try:
        coord=nodes.new('ShaderNodeTexCoord');split=nodes.new('ShaderNodeSeparateXYZ');links.new(coord.outputs['Object'],split.inputs[0])
        x=math('ADD',split.outputs['X'],62.2249641459375);y=math('SUBTRACT',split.outputs['Y'],15.174867628173828)
        radius=math('SQRT',math('ADD',math('MULTIPLY',x,x),math('MULTIPLY',y,y)),0)
        mask=math('MULTIPLY',fade(radius,6.5,8),math('SUBTRACT',1,fade(radius,12.5,14)))
        mask=math('MULTIPLY',mask,fade(split.outputs['Z'],10,12))
        shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
        normal=next(n for n in nodes if n.type=='NORMAL_MAP')
        links.new(math('SUBTRACT',1,math('MULTIPLY',mask,.85)),normal.inputs['Strength'])
        for name,target in [('Base Color',(.014,.015,.017,1)),('Roughness',(.68,.68,.68,1)),('Metallic',(0,0,0,1))]:
            socket=shader.inputs[name];value=socket.links[0].from_socket if socket.is_linked else socket.default_value
            links.new(mix(value,target,mask),socket)
        importlib.reload(renderer)
        renderer.VIEWS=[('pad',-155,(-62,-40,140),(-62,15,14),30,0),('front',-155,(0,-260,250),(0,8,35),235,0)]
        renderer.main(prefix)
    finally:
        obj.data.materials[0]=original;bpy.data.materials.remove(material)

if __name__=='__main__':main()
