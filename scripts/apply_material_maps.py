"""Apply portable physical-scale surface maps through Blender MCP."""
import bpy
from pathlib import Path
ROOT=Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
families=[('Satin silver metallic paint','silver',.4),('Graphite ABS','graphite',0),('Circle pad silicone','silicone',0)]
for name,family,metal in families:
    mat=bpy.data.materials[name];mat.use_nodes=True
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;nodes.clear()
    out=nodes.new('ShaderNodeOutputMaterial');p=nodes.new('ShaderNodeBsdfPrincipled');links.new(p.outputs['BSDF'],out.inputs['Surface'])
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=1
    for suffix,slot in [('basecolor','Base Color'),('roughness','Roughness'),('normal','Normal')]:
        image=bpy.data.images.load(str(ROOT/'public/textures/materials'/f'{family}-{suffix}.png'),check_existing=True)
        image.colorspace_settings.name='sRGB' if suffix=='basecolor' else 'Non-Color';image.pack()
        tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.extension='REPEAT';tex.label=f'{family} {suffix}, 16 mm tile'
        if suffix=='normal':
            normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=1
            links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],p.inputs['Normal'])
        else:links.new(tex.outputs['Color'],p.inputs[slot])
    mat['surface_tile_mm']=16;mat['surface_source']='authored photographic reconstruction, not measured factory data'

# Project in parent-space millimetres so caps and housings share the same grain
# size despite object transforms. UVs outside 0–1 deliberately repeat the tile.
surface_names={x[0] for x in families}
for o in bpy.data.objects['3DS_XL'].children_recursive:
    if o.type!='MESH' or not any(m and m.name in surface_names for m in o.data.materials):continue
    # Boolean cutters can introduce a second UV layer. Keep one explicit layer
    # so both exported maps and runtime VGPU roughness sample TEXCOORD_0.
    for layer in list(o.data.uv_layers):o.data.uv_layers.remove(layer)
    uv=o.data.uv_layers.new(name='Material16mm')
    transform=o.matrix_local
    normal_transform=transform.to_3x3().inverted().transposed()
    for poly in o.data.polygons:
        n=normal_transform@poly.normal
        axis=max(range(3),key=lambda i:abs(n[i]))
        for li in poly.loop_indices:
            p=transform@o.data.vertices[o.data.loops[li].vertex_index].co
            if axis==2: u,v=p.x,p.y*(1 if n.z>0 else -1)
            elif axis==1: u,v=p.x*(-1 if n.y>0 else 1),p.z
            else:u,v=p.y*(1 if n.x>0 else -1),p.z
            uv.data[li].uv=(u/16,v/16)
    o['texture_tile_mm']=16
print('Packed base-color, roughness and normal maps on silver, graphite and silicone surfaces at 16 mm scale.')
