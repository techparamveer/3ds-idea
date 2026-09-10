"""Reversible native lighting trial for MIC/POWER relief; no production export.

Run through Blender MCP from silver-legends.blend. Source UV pixel rectangles
use the normal PNG's top-left origin. Only the normal signal inside these two
regions is attenuated toward adjacent glyph-free columns; no font is replaced.
"""
from pathlib import Path
import bpy
import render_sourced_dimensions as renderer

REGIONS = {'POWER': (373, 124, 428, 284), 'MIC': (623, 475, 653, 518)}


def main(retained_strength=.35):
    assert Path(bpy.data.filepath).name == 'silver-legends.blend'
    source = bpy.data.materials['Sourced silver photographic lower-key legends']
    trial = source.copy()
    trial.name = 'Temporary etched legend comparison'
    nodes, links = trial.node_tree.nodes, trial.node_tree.links
    normal = next(n for n in nodes if n.type == 'NORMAL_MAP')
    original = normal.inputs['Color'].links[0].from_node
    uv = nodes.new('ShaderNodeTexCoord')
    components = nodes.new('ShaderNodeSeparateXYZ')
    links.new(uv.outputs['UV'], components.inputs[0])

    def connect(value, socket):
        if isinstance(value, (int,float,tuple,list)): socket.default_value = value
        else: links.new(value,socket)

    def math(op,a,b):
        n=nodes.new('ShaderNodeMath');n.operation=op
        connect(a,n.inputs[0]);connect(b,n.inputs[1]);return n.outputs[0]

    def mix(a,b,f):
        n=nodes.new('ShaderNodeMixRGB')
        for v,s in zip([f,a,b],n.inputs):connect(v,s)
        return n.outputs[0]

    def clamp(v):return math('MINIMUM',math('MAXIMUM',v,0),1)

    X=math('MULTIPLY',components.outputs['X'],4096)
    Y=math('MULTIPLY',math('SUBTRACT',1,components.outputs['Y']),4096)
    result=original.outputs['Color']
    for x0,y0,x1,y1 in REGIONS.values():
        mask=1
        for distance in [math('SUBTRACT',X,x0),math('SUBTRACT',x1,X),math('SUBTRACT',Y,y0),math('SUBTRACT',y1,Y)]:
            mask=math('MULTIPLY',mask,clamp(math('DIVIDE',distance,2)))
        samples=[]
        for column in [x0,x1]:
            coord=nodes.new('ShaderNodeCombineXYZ');coord.inputs['X'].default_value=column/4096
            links.new(components.outputs['Y'],coord.inputs['Y'])
            image=nodes.new('ShaderNodeTexImage');image.image=original.image
            image.interpolation='Linear';links.new(coord.outputs[0],image.inputs['Vector'])
            samples.append(image.outputs['Color'])
        baseline=mix(*samples,clamp(math('DIVIDE',math('SUBTRACT',X,x0),x1-x0)))
        result=mix(result,baseline,math('MULTIPLY',mask,1-retained_strength))
    links.new(result,normal.inputs['Color'])
    users=[o for o in bpy.data.objects if o.type=='MESH' and len(o.data.materials) and o.data.materials[0]==source]
    saved=renderer.VIEWS
    try:
        renderer.VIEWS=[('right-keys',-155,(52,-39,200),(52,-39,13),53,0)]
        renderer.main('etched-before',resolution=(1200,650))
        for o in users:o.data.materials[0]=trial
        renderer.main('etched-trial',resolution=(1200,650))
    finally:
        for o in users:o.data.materials[0]=source
        renderer.VIEWS=saved
        bpy.data.materials.remove(trial)
    print('Native comparison complete; production material restored, no export changed.')


if __name__=='__main__':main()
