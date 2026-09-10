"""Separate the narrow LCD edge from the matte cover border, reversibly."""
import bpy
import audit_sourced_front

def main():
    obj=bpy.data.objects['Screen_Top'];old=obj.active_material;m=old.copy()
    m.name='Inspection matte cover border'
    nodes,links=m.node_tree.nodes,m.node_tree.links
    def math(op,a,b=0):
        n=nodes.new('ShaderNodeMath');n.operation=op
        for i,v in enumerate([a,b]):
            if isinstance(v,(int,float)):n.inputs[i].default_value=v
            else:links.new(v,n.inputs[i])
        return n.outputs[0]
    tex=nodes.new('ShaderNodeTexCoord');xyz=nodes.new('ShaderNodeSeparateXYZ');links.new(tex.outputs['Object'],xyz.inputs[0])
    x=math('SUBTRACT',math('ABSOLUTE',xyz.outputs['X']),53.5)
    y=math('SUBTRACT',math('ABSOLUTE',math('ADD',xyz.outputs['Y'],41.415844)),32.3)
    mask=math('GREATER_THAN',math('MAXIMUM',x,y))
    border=nodes.new('ShaderNodeBsdfPrincipled');border.inputs['Base Color'].default_value=(.007,.007,.007,1);border.inputs['Roughness'].default_value=.35
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL');source=output.inputs['Surface'].links[0].from_socket
    mix=nodes.new('ShaderNodeMixShader');links.new(mask,mix.inputs[0]);links.new(source,mix.inputs[1]);links.new(border.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],output.inputs['Surface'])
    obj.active_material=m
    try:audit_sourced_front.main('upper-cover-border-trial')
    finally:obj.active_material=old;bpy.data.materials.remove(m)

if __name__=='__main__':main()
