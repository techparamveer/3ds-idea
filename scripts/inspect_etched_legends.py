"""Reversible native lighting trial for MIC/POWER relief; no production export.

Run through Blender MCP from silver-legends.blend. Source UV pixel rectangles
use the normal PNG's top-left origin. Only the normal signal inside these two
regions is attenuated toward adjacent glyph-free columns; no font is replaced.
"""
from pathlib import Path
import bpy
import render_sourced_dimensions as renderer

REGIONS = {'POWER': (373, 124, 428, 284), 'MIC': (623, 475, 653, 518)}
PHOTO_GLYPHS = {
    'POWER': {'crop': (1243,775,1302,788), 'threshold': (27,48), 'pitch_mm': (.07488,.07818), 'glyph_rect': (381,140,420,273)},
    'MIC': {'crop': (1147,792,1176,807), 'threshold': (32,65), 'pitch_mm': (.10530,.11089), 'glyph_rect': (625,478,649,516)},
}


def main(retained_strength=.35, photographic=False, smooth=False, bake=False, render_views=True):
    assert Path(bpy.data.filepath).name == 'silver-legends.blend'
    source = bpy.data.materials['Sourced silver photographic lower-key legends']
    trial = source.copy()
    trial.name = 'Temporary etched legend comparison'
    nodes, links = trial.node_tree.nodes, trial.node_tree.links
    if bake:
        for node in nodes:
            if node.type=='TEX_IMAGE':node.interpolation='Closest'
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
    photo=None;stencils={}
    if smooth:
        photographic=True
        for word in REGIONS:
            image=bpy.data.images.load(str(Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl/derived-textures'/('etched-stencil-'+word.lower()+'.png')),check_existing=False)
            image.colorspace_settings.name='Non-Color';stencils[word]=image
    elif photographic:
        photo=bpy.data.images.load(str(Path(__file__).resolve().parents[1]/'.local/references/front/techradar-original.jpg'),check_existing=False)
        photo.colorspace_settings.name='sRGB'
    result=original.outputs['Color']
    base_input=nodes['Principled BSDF'].inputs['Base Color']
    base_color=base_input.links[0].from_socket
    for name,(x0,y0,x1,y1) in REGIONS.items():
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
        if not photographic:
            result=mix(result,baseline,math('MULTIPLY',mask,1-retained_strength))
            continue
        spec=PHOTO_GLYPHS[name];px0,py0,px1,py1=spec['crop']
        if smooth:
            photo=stencils[name];px0=py0=0;px1,py1=photo.size
        gx0,gy0,gx1,gy1=spec['glyph_rect']
        def ink(dx,dy):
            # Atlas Y decreases toward physical right; atlas X increases toward
            # the hinge. The photograph's horizontal/vertical axes swap here.
            sx,sy=math('ADD',X,dx),math('ADD',Y,dy)
            U=math('DIVIDE',math('ADD',px0,math('MULTIPLY',math('DIVIDE',math('SUBTRACT',gy1,sy),gy1-gy0),px1-px0)),photo.size[0])
            V=math('SUBTRACT',1,math('DIVIDE',math('ADD',py0,math('MULTIPLY',math('DIVIDE',math('SUBTRACT',gx1,sx),gx1-gx0),py1-py0)),photo.size[1]))
            coord=nodes.new('ShaderNodeCombineXYZ');links.new(U,coord.inputs['X']);links.new(V,coord.inputs['Y'])
            tex=nodes.new('ShaderNodeTexImage');tex.image=photo;tex.interpolation='Linear';links.new(coord.outputs[0],tex.inputs['Vector'])
            gray=nodes.new('ShaderNodeRGBToBW');links.new(tex.outputs['Color'],gray.inputs[0])
            def linear(v):
                v/=255;return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
            lo,hi=map(linear,spec['threshold'])
            gate=1
            for op,a,b in [('GREATER_THAN',sx,gx0),('LESS_THAN',sx,gx1),('GREATER_THAN',sy,gy0),('LESS_THAN',sy,gy1)]:gate=math('MULTIPLY',gate,math(op,a,b))
            return math('MULTIPLY',gate,gray.outputs[0] if smooth else clamp(math('DIVIDE',math('SUBTRACT',hi,gray.outputs[0]),hi-lo)))
        # Recessed photographic stencil, trial depth 0.05 mm; finite difference
        # derivatives are expressed in physical millimetres, not texture pixels.
        slope=nodes.new('ShaderNodeCombineXYZ')
        for axis,delta,pitch,sign in [('X',(1,0),spec['pitch_mm'][0],1),('Y',(0,1),spec['pitch_mm'][1],-1)]:
            difference=math('SUBTRACT',ink(*delta),ink(*[-v for v in delta]))
            links.new(math('MULTIPLY',difference,sign*(.025 if smooth else .05)/(2*pitch)),slope.inputs[axis])
        unpack=nodes.new('ShaderNodeVectorMath');unpack.operation='MULTIPLY_ADD'
        links.new(baseline,unpack.inputs[0]);unpack.inputs[1].default_value=(2,2,2);unpack.inputs[2].default_value=(-1,-1,-1)
        add=nodes.new('ShaderNodeVectorMath');add.operation='ADD';links.new(unpack.outputs[0],add.inputs[0]);links.new(slope.outputs[0],add.inputs[1])
        unit=nodes.new('ShaderNodeVectorMath');unit.operation='NORMALIZE';links.new(add.outputs[0],unit.inputs[0])
        pack=nodes.new('ShaderNodeVectorMath');pack.operation='MULTIPLY_ADD';links.new(unit.outputs[0],pack.inputs[0]);pack.inputs[1].default_value=(.5,.5,.5);pack.inputs[2].default_value=(.5,.5,.5)
        result=mix(result,pack.outputs[0],mask)
        cavity=nodes.new('ShaderNodeVectorMath');cavity.operation='SCALE'
        links.new(base_color,cavity.inputs[0]);cavity.inputs['Scale'].default_value=.6
        base_color=mix(base_color,cavity.outputs[0],math('MULTIPLY',mask,ink(0,0)))
    links.new(result,normal.inputs['Color'])
    if photographic:links.new(base_color,base_input)
    users=[o for o in bpy.data.objects if o.type=='MESH' and len(o.data.materials) and o.data.materials[0]==source]
    saved=renderer.VIEWS
    try:
        renderer.VIEWS=[('right-keys',-155,(52,-39,200),(52,-39,13),53,0)]
        if render_views:renderer.main('etched-before',resolution=(1200,650))
        for o in users:o.data.materials[0]=trial
        if render_views:renderer.main('etched-smooth-trial' if smooth else 'etched-photo-trial' if photographic else 'etched-trial',resolution=(1200,650))
        if bake:
            assert smooth, 'Only the smooth candidate may produce derived atlas files.'
            import render_uv_outputs
            render_uv_outputs.render(trial,{'basecolor':base_color,'normal':result},
                Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl/derived-textures/body-etched')
    finally:
        for o in users:o.data.materials[0]=source
        renderer.VIEWS=saved
        bpy.data.materials.remove(trial)
        if stencils:
            for image in stencils.values():bpy.data.images.remove(image)
        elif photo:bpy.data.images.remove(photo)
    print('Native comparison complete; production material restored, no export changed.')


if __name__=='__main__':main()
