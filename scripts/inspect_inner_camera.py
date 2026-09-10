"""Reversible optical-material trial on the existing sourced camera insert."""
from pathlib import Path
import math
import bpy
import importlib
import render_sourced_dimensions as renderer

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'

def install():
    obj = bpy.data.objects['Source_2_part_02']
    mesh = obj.data
    # Source insert bounds; keep both its shape and its original UV layer.
    cx = (min(v.co.x for v in mesh.vertices)+max(v.co.x for v in mesh.vertices))/2
    cy = (min(v.co.y for v in mesh.vertices)+max(v.co.y for v in mesh.vertices))/2
    radius = (max(v.co.x for v in mesh.vertices)-min(v.co.x for v in mesh.vertices))/2
    uv = mesh.uv_layers.new(name='CameraOptics')
    for loop in mesh.loops:
        co = mesh.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = ((co.x-cx)/(2*radius)+.5,(co.y-cy)/(2*radius)+.5)
    images = []
    for name in ('inner-camera-colour', 'inner-camera-roughness'):
        im = bpy.data.images.new(name,width=256,height=256,alpha=False)
        im.colorspace_settings.name = 'sRGB' if name.endswith('colour') else 'Non-Color'
        pixels = []
        for y in range(256):
            for x in range(256):
                r = math.hypot((x+.5-128)/128,(y+.5-128)/128)
                # Concentric material regions observed in the reference. These
                # are an optical appearance fit, not a measured lens assembly.
                inner = max(0,min(1,(.59-r)/.035))
                pupil = max(0,min(1,(.19-r)/.025))
                if name.endswith('colour'):
                    ring = (.004,.0045,.005)
                    lens = (.024,.029,.033)
                    linear = tuple((a*(1-inner)+b*inner)*(1-.94*pupil) for a,b in zip(ring,lens))
                    rgb = tuple(12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055 for c in linear)
                else:
                    value = .34*(1-inner)+.16*inner
                    rgb = (value,value,value)
                pixels.extend((*rgb,1))
        im.pixels.foreach_set(pixels)
        im.filepath_raw = str(FOLDER/'derived-textures'/(name+'.png'))
        im.file_format = 'PNG'
        im.save(); im.pack(); images.append(im)
    mat=bpy.data.materials.new('Sourced inner camera optics')
    mat.use_nodes=True
    mat['console_material_role']='sourced-optics'
    nodes=mat.node_tree.nodes; shader=nodes.get('Principled BSDF')
    shader.inputs['Metallic'].default_value=0
    shader.inputs['IOR'].default_value=1.5
    uv_node=nodes.new('ShaderNodeUVMap');uv_node.uv_map=uv.name
    for im,socket in zip(images,('Base Color','Roughness')):
        tex=nodes.new('ShaderNodeTexImage');tex.image=im
        mat.node_tree.links.new(uv_node.outputs['UV'],tex.inputs['Vector'])
        mat.node_tree.links.new(tex.outputs['Color'],shader.inputs[socket])
    obj.data.materials[0]=mat
    return obj,mat,images,uv

def main():
    obj=bpy.data.objects['Source_2_part_02'];original=obj.active_material
    trial=None
    try:
        trial=install()
        importlib.reload(renderer)
        renderer.VIEWS=[('camera',-155,(0,-175,265),(0,114,51),18,0)]
        renderer.main('inner-camera-trial',resolution=(800,600))
    finally:
        if trial:
            obj,mat,images,uv=trial
            obj.active_material=original;obj.data.uv_layers.remove(uv)
            bpy.data.materials.remove(mat)
            for im in images:bpy.data.images.remove(im)

if __name__=='__main__':main()
