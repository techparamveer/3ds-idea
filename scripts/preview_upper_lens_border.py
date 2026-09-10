"""Reversible material-only upper surround study; never save or export this shader.

The rounded footprint is a photographic estimate, not factory geometry.
The repair reference supports a separate black-bordered lens but not its height.
"""
import bpy
import audit_sourced_front


def main():
    obj = bpy.data.objects['Sourced inner lid']
    original = obj.active_material
    material = original.copy()
    material.name = 'Inspection upper lens border'
    nodes, links = material.node_tree.nodes, material.node_tree.links

    def math(operation, a, b=0):
        node = nodes.new('ShaderNodeMath'); node.operation = operation
        for index, value in enumerate((a, b)):
            if isinstance(value, (int, float)):
                node.inputs[index].default_value = value
            else:
                links.new(value, node.inputs[index])
        return node.outputs[0]

    coordinates = nodes.new('ShaderNodeTexCoord')
    xyz = nodes.new('ShaderNodeSeparateXYZ')
    links.new(coordinates.outputs['Object'], xyz.inputs[0])
    # Rounded rectangle SDF in the inner lid's native millimetre coordinates.
    radius = 2.8
    qx = math('SUBTRACT', math('ABSOLUTE', xyz.outputs['X']), 57.5-radius)
    qy = math('SUBTRACT', math('ABSOLUTE', math('ADD', xyz.outputs['Y'], 41.416)), 37.2-radius)
    px, py = math('MAXIMUM', qx), math('MAXIMUM', qy)
    length = math('SQRT', math('ADD', math('MULTIPLY', px, px), math('MULTIPLY', py, py)))
    sdf = math('SUBTRACT', math('ADD', length, math('MINIMUM', math('MAXIMUM', qx, qy))), radius)
    mask = math('LESS_THAN', sdf)
    border = nodes.new('ShaderNodeBsdfPrincipled')
    border.inputs['Base Color'].default_value = (.007, .007, .007, 1)
    border.inputs['Roughness'].default_value = .32
    output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
    source = output.inputs['Surface'].links[0].from_socket
    mix = nodes.new('ShaderNodeMixShader')
    links.new(mask, mix.inputs[0]); links.new(source, mix.inputs[1])
    links.new(border.outputs[0], mix.inputs[2]); links.new(mix.outputs[0], output.inputs['Surface'])
    obj.active_material = material
    try:
        audit_sourced_front.main('upper-lens-border-trial')
    finally:
        obj.active_material = original
        bpy.data.materials.remove(material)


if __name__ == '__main__':
    main()
