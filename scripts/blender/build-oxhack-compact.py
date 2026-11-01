"""Run through Blender MCP with absolute ROOT and OUTPUT paths.
The compact OxHack triangle begins spinning at speed about a tilted axis, decays
through its last slow turn while the block letters rise out of the glass, lands
with a damped thunk, then powers on: pulses race the frame and traces, the pads
spark and a sweep switches the letters to white. A seamless idle sway follows.

Surfaces are unlit by design. Blender lights could not hold the supplied logo's
colours, so each shader emits the SVG colour and shades it from the normal in
the shader. Facing the camera that shade is exactly 1, so the rest pose keeps
the logo's own pixels while any turn gains form, glints and rim light.
"""
import bpy,importlib,json,math,sys
from pathlib import Path
root,output=Path(ROOT),Path(OUTPUT)
sys.path.insert(0,str(root/'scripts/blender'))
import oxhack_rig;importlib.reload(oxhack_rig)
from oxhack_rig import LogoSpace,contour_bounds,extrude_contours,glyph_center,linear,load_logo
LAND,INTRO,IDLE=84,104,96
FRAMES=INTRO+IDLE
WIDTH,HEIGHT=208,172
PREFIX='Compact '
logo=load_logo(root/'scripts/blender/oxhack-logo-contours.json','compact')
sources=json.loads((root/'scripts/blender/oxhack-logo-contours.json').read_text())['source']
scene=bpy.data.scenes.get('OxHack Compact') or bpy.data.scenes.new('OxHack Compact')
if bpy.context.window:bpy.context.window.scene=scene
# Rebuilds replace only this scene's own data; another agent shares this Blender.
for obj in list(scene.collection.objects):bpy.data.objects.remove(obj)
scene.animation_data_clear()
scene.timeline_markers.clear()
for blocks in (bpy.data.meshes,bpy.data.materials,bpy.data.cameras,bpy.data.actions):
    for block in [b for b in blocks if b.name.startswith((PREFIX,'OxHack CompactAction'))]:blocks.remove(block)
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=WIDTH;scene.render.resolution_y=HEIGHT
scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.render.filter_size=.7
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.color_depth='8'
scene.render.fps=30;scene.render.fps_base=1.001
scene.frame_start=1;scene.frame_end=FRAMES
scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.eevee.taa_render_samples=64
scene.eevee.use_raytracing=False
scene.render.use_motion_blur=True;scene.render.motion_blur_position='CENTER'
scene.eevee.motion_blur_steps=16

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def out_back(t,over=1.9):
    t=max(0,min(1,t))-1;return 1+(over+1)*t**3+over*t**2

# --- Motion. Every value is a function of the frame, baked to linear keys. ---
TURNS,POWER,LAST_SPEED=6,3,2.6
SPRING=2*math.pi/16
def yaw_degrees(f):
    """Decays from about 6.5 rev/s; arrives with LAST_SPEED so the spring has energy."""
    if f<=LAND:
        s=(LAND-f)/(LAND-1)
        return 360*TURNS*s**POWER+LAST_SPEED*(LAND-f)
    s=f-LAND
    return -(LAST_SPEED/SPRING)*math.exp(-.16*s)*math.sin(SPRING*s)*(1-smooth((s-11)/6))
def idle_wave(a):
    """Zero value and zero velocity at the rest pose, so the loop holds on the logo."""
    return (math.sin(a)-math.sin(2*a)/2)/1.299
def pose(f):
    """Yaw and tilt in radians, world bob and uniform scale for frame f."""
    if f>INTRO:
        a=2*math.pi*(f-INTRO)/IDLE
        return (.22*idle_wave(a),.05*idle_wave(2*a),0,.05*idle_wave(2*a+math.pi/2)-.05*idle_wave(math.pi/2),1)
    yaw=math.radians(yaw_degrees(f))
    fade=1-smooth((f-34)/(LAND-34))
    phase=f*.085
    tilt_x,tilt_z=.34*fade*math.cos(phase),-.2*fade*math.sin(phase)
    if f<=LAND:size=.81+.22*smooth((f-58)/(LAND-58))
    else:size=1+.03*math.exp(-.26*(f-LAND))*math.cos(.62*(f-LAND))*(1-smooth((f-LAND-9)/7))
    return yaw,tilt_x,tilt_z,0,size
def lens(f):
    """A dolly zoom: wide and dramatic for the spin, long enough at rest to keep the layout."""
    return 62+(135-62)*smooth((f-44)/(LAND-44))
PX_PER_UNIT=37.2
FRAME_WIDTH=WIDTH/PX_PER_UNIT
def camera_distance(f):return FRAME_WIDTH*lens(f)/36
CENTER_Y=-.022
BLOCK_BASE,BLOCK_DEPTH,FACE_DEPTH=.012,.318,.06
ORDER=['O','X','yr','H','A','C','K']
# The rise begins with the last turn, so mirrored letters climb behind the glass as the back passes.
RISE_START={name:42+3*i for i,name in enumerate(ORDER)}
RISE_FRAMES=22
def rise(name,f):return max(.012,out_back((f-RISE_START[name])/RISE_FRAMES))
def keyed(start,end,a,b,f):return a+(b-a)*smooth((f-start)/(end-start))
PULSE={'compact_comet':(LAND+1,LAND+9,-.08,1.08,2.),'compact_wave':(LAND+6,LAND+12,.44,.04,-1.),
       'compact_sweep':(LAND+8,LAND+18,-.12,1.5,1.7)}
PAD_FLASH=(LAND+10,LAND+16)

# --- Shading graph helpers. ---
class Graph:
    def __init__(s,material):s.nodes,s.links=material.node_tree.nodes,material.node_tree.links
    def put(s,value,socket):
        if isinstance(value,bpy.types.NodeSocket):s.links.new(value,socket)
        else:socket.default_value=value
    def math(s,op,a,b=None,clamp=False):
        n=s.nodes.new('ShaderNodeMath');n.operation=op;n.use_clamp=clamp
        s.put(a,n.inputs[0])
        if b is not None:s.put(b,n.inputs[1])
        return n.outputs[0]
    def vec(s,op,a,b=None,scale=None):
        n=s.nodes.new('ShaderNodeVectorMath');n.operation=op
        s.put(a,n.inputs[0])
        if b is not None:s.put(b,n.inputs[1])
        if scale is not None:s.put(scale,n.inputs['Scale'])
        return n.outputs['Value'] if op in ('DOT_PRODUCT','LENGTH') else n.outputs['Vector']
    def step(s,x,a,b):
        """Smooth 0..1 between a and b."""
        n=s.nodes.new('ShaderNodeMapRange');n.interpolation_type='SMOOTHSTEP'
        s.put(x,n.inputs['Value']);n.inputs['From Min'].default_value=a;n.inputs['From Max'].default_value=b
        return n.outputs['Result']
    def mix(s,fac,a,b):
        n=s.nodes.new('ShaderNodeMix');n.data_type='RGBA';n.clamp_factor=True
        sockets={i.identifier:i for i in n.inputs}
        s.put(fac,sockets['Factor_Float']);s.put(a,sockets['A_Color']);s.put(b,sockets['B_Color'])
        return next(o for o in n.outputs if o.identifier=='Result_Color')
    def lerp(s,fac,a,b):return s.math('ADD',s.math('MULTIPLY',a,s.math('SUBTRACT',1,fac)),s.math('MULTIPLY',b,fac))
    def attr(s,name):
        n=s.nodes.new('ShaderNodeAttribute');n.attribute_type='VIEW_LAYER';n.attribute_name=name
        return n.outputs['Fac']
    def part(s,vector,axis):
        n=s.nodes.new('ShaderNodeSeparateXYZ');s.put(vector,n.inputs[0])
        return n.outputs[axis]
    def add(s,color,amount):
        """Adds white light on top of a colour."""
        n=s.nodes.new('ShaderNodeVectorMath');n.operation='ADD'
        s.put(color,n.inputs[0]);s.put(s.combine(amount),n.inputs[1])
        return n.outputs['Vector']
    def combine(s,v):
        n=s.nodes.new('ShaderNodeCombineXYZ')
        for i in range(3):s.put(v,n.inputs[i])
        return n.outputs[0]
    def scale(s,color,amount):return s.vec('SCALE',color,scale=amount)

def srgb_channel(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
# The SVG's mix-blend-mode:color overlays are not in the contours: they brighten the frame and
# traces and deepen the letter blocks. These 25 stops along the same gradient axis are measured
# from the reference render (compact-on-lcd.png). The glass needs none: its plain gradient at 60%
# reproduces the reference.
MEASURED_FRAME=['#14dace','#19d9c3','#1fd9b7','#25d8aa','#29d89f','#2ed794','#35d786','#3ad67b','#3fd56f','#44d563','#4ad458','#4fd44c','#55d340','#61ce3c','#6ec839','#7cc135','#88bc32','#95b62f','#a2b02c','#afa929','#bca326','#ca9d22','#d49920','#e1931d','#ee8d1a']
MEASURED_BLOCK=['#00bca2','#00bc9d','#02bb98','#07bb8e','#0dba81','#11ba76','#17ba6b','#1db95d','#21b954','#28b844','#2cb73b','#32b72e','#38b623','#43b11f','#50ab1c','#5ca619','#6c9e15','#7a9812','#85930f','#948c0b','#9d8709','#ab8106','#ba7a02','#c37600','#cf7000']
def gradient_color(g,gradient,measured=None):
    """The SVG gradient, sampled so the ramp interpolates in sRGB like the SVG does."""
    canvas=logo['canvas']
    (x1,y1),(x2,y2)=gradient['p1'],gradient['p2']
    dx,dy=x2-x1,y2-y1
    length=dx*dx+dy*dy
    uv=g.nodes.new('ShaderNodeUVMap');uv.uv_map='Logo'
    along=g.vec('DOT_PRODUCT',uv.outputs['UV'],(dx*canvas[0]/length,-dy*canvas[1]/length,0))
    along=g.math('ADD',along,(-x1*dx+(canvas[1]-y1)*dy)/length)
    ramp=g.nodes.new('ShaderNodeValToRGB')
    stops=[(p,[int(c.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]) for p,c in gradient['stops']]
    elements=ramp.color_ramp.elements
    samples=[i/24 for i in range(25)]
    while len(elements)<len(samples):elements.new(.5)
    if measured:
        stops=[(i/24,[int(c.lstrip('#')[j:j+2],16)/255 for j in (0,2,4)]) for i,c in enumerate(measured)]
    for element,t in zip(elements,samples):
        for (p0,c0),(p1,c1) in zip(stops,stops[1:]):
            if t<=p1 or p1==stops[-1][0]:
                k=max(0,min(1,(t-p0)/(p1-p0)))
                element.position=t
                element.color=(*[srgb_channel(a+(b-a)*k) for a,b in zip(c0,c1)],1)
                break
    g.put(along,ramp.inputs['Fac'])
    return ramp.outputs['Color'],uv.outputs['UV']
CENTROID=(1656/4000,1-2215/4000)
APEX=(972.78/4000,1-336.12/4000)
LIGHT=(-.40,.62,.675)
def light_terms(g,uv):
    """Form shading, softbox glints and grazing rim. All are neutral when facing the camera."""
    geo=g.nodes.new('ShaderNodeNewGeometry')
    normal,incoming=geo.outputs['Normal'],geo.outputs['Incoming']
    lit=g.math('ADD',.5,g.math('MULTIPLY',.5,g.vec('DOT_PRODUCT',normal,LIGHT)))
    form=g.math('DIVIDE',lit,.5+.5*LIGHT[2])
    reflected=g.vec('REFLECT',g.vec('SCALE',incoming,scale=-1),normal)
    across=g.math('ADD',g.part(reflected,'X'),g.math('MULTIPLY',g.math('SUBTRACT',g.part(uv,'X'),.5),.6))
    front=g.step(g.part(reflected,'Z'),-.25,.2)
    key=g.math('SUBTRACT',1,g.step(g.math('ABSOLUTE',g.math('SUBTRACT',across,.62)),.04,.17))
    kick=g.math('SUBTRACT',1,g.step(g.math('ABSOLUTE',g.math('SUBTRACT',across,-.72)),.03,.13))
    glint=g.math('MULTIPLY',g.math('ADD',key,g.math('MULTIPLY',kick,.7)),front)
    facing=g.math('ABSOLUTE',g.vec('DOT_PRODUCT',normal,incoming))
    rim=g.step(g.math('SUBTRACT',1,facing),.35,.95)
    return form,glint,rim
def sweep_terms(g,uv):
    """`lit` is 0 ahead of the white sweep and 1 behind it; `band` is its bright edge."""
    q=g.math('ADD',g.part(uv,'X'),g.math('MULTIPLY',g.math('SUBTRACT',1,g.part(uv,'Y')),.35))
    x=g.math('SUBTRACT',q,g.attr('compact_sweep'))
    lit=g.math('SUBTRACT',1,g.step(x,-.08,0))
    band=g.math('SUBTRACT',1,g.step(g.math('ABSOLUTE',x),.02,.13))
    return lit,band
def frame_terms(g,uv):
    """Twin pulses leave the apex, run both edges and meet on the far side."""
    p=g.vec('SUBTRACT',uv,(*CENTROID,0))
    apex=(APEX[0]-CENTROID[0],APEX[1]-CENTROID[1])
    size=math.hypot(*apex)
    cos=g.vec('DOT_PRODUCT',g.vec('NORMALIZE',p),(apex[0]/size,apex[1]/size,0))
    x=g.math('SUBTRACT',g.math('DIVIDE',g.math('ARCCOSINE',cos),math.pi),g.attr('compact_comet'))
    return g.math('SUBTRACT',1,g.step(x,-.03,0)),g.math('MULTIPLY',g.step(x,-.34,-.01),g.math('SUBTRACT',1,g.step(x,0,.025)))
def wave_terms(g,uv):
    """The frame's charge runs inward along the traces to the pads."""
    r=g.vec('LENGTH',g.vec('SUBTRACT',uv,(*CENTROID,0)))
    x=g.math('SUBTRACT',g.attr('compact_wave'),r)
    return g.math('SUBTRACT',1,g.step(x,-.02,0)),g.math('MULTIPLY',g.step(x,-.12,-.005),g.math('SUBTRACT',1,g.step(x,0,.015)))
def finish(material,g,color,alpha=None):
    out=next(n for n in g.nodes if n.type=='OUTPUT_MATERIAL')
    for n in [n for n in g.nodes if n.type=='BSDF_PRINCIPLED']:g.nodes.remove(n)
    emit=g.nodes.new('ShaderNodeEmission');g.put(color,emit.inputs['Color']);emit.inputs['Strength'].default_value=1
    if alpha is None:
        g.links.new(emit.outputs[0],out.inputs['Surface'])
    else:
        through=g.nodes.new('ShaderNodeBsdfTransparent')
        mixed=g.nodes.new('ShaderNodeMixShader')
        g.put(alpha,mixed.inputs[0]);g.links.new(through.outputs[0],mixed.inputs[1]);g.links.new(emit.outputs[0],mixed.inputs[2])
        g.links.new(mixed.outputs[0],out.inputs['Surface'])
        material.surface_render_method='BLENDED'
        material.use_transparency_overlap=False
def new_material(name):
    material=bpy.data.materials.new(PREFIX+name);material.use_nodes=True
    return material,Graph(material)
def shaded(g,color,form,strength):
    """Darken by the form term; `strength` keeps faces close to the source colour."""
    return g.scale(color,g.lerp(strength,1,form))

def navy_material():
    material,g=new_material('navy')
    uv=g.nodes.new('ShaderNodeUVMap');uv.uv_map='Logo'
    form,glint,rim=light_terms(g,uv.outputs['UV'])
    color=shaded(g,linear(logo['colors']['navy'])[:3],form,.6)
    finish(material,g,g.add(color,g.math('ADD',g.math('MULTIPLY',glint,.07),g.math('MULTIPLY',rim,.05))))
    return material
def frame_material():
    material,g=new_material('frame')
    color,uv=gradient_color(g,logo['gradients']['shape'],MEASURED_FRAME)
    form,glint,rim=light_terms(g,uv)
    lit,comet=frame_terms(g,uv)
    base=g.scale(color,g.lerp(lit,.70,1))
    light=g.math('ADD',g.math('MULTIPLY',glint,.42),g.math('ADD',g.math('MULTIPLY',rim,.2),g.math('MULTIPLY',comet,1.25)))
    finish(material,g,g.add(shaded(g,base,form,.9),light))
    return material
def trace_material(name,flash=False):
    material,g=new_material(name)
    color,uv=gradient_color(g,logo['gradients']['shape'],MEASURED_FRAME)
    form,glint,rim=light_terms(g,uv)
    lit,comet=wave_terms(g,uv)
    base=g.scale(color,g.lerp(lit,.55,1))
    light=g.math('ADD',g.math('MULTIPLY',glint,.3),g.math('MULTIPLY',comet,1.1))
    if flash:light=g.math('ADD',light,g.attr('compact_pads'))
    finish(material,g,g.add(shaded(g,base,form,.9),light))
    return material
def glass_material():
    material,g=new_material('glass')
    color,uv=gradient_color(g,logo['gradients']['panel'])
    form,glint,rim=light_terms(g,uv)
    lit,band=sweep_terms(g,uv)
    light=g.math('ADD',g.math('MULTIPLY',glint,.34),g.math('ADD',g.math('MULTIPLY',rim,.24),g.math('MULTIPLY',band,.42)))
    alpha=g.math('ADD',g.math('ADD',g.lerp(lit,.5,logo['panelOpacity']),g.attr('compact_speed')),g.math('ADD',g.math('MULTIPLY',glint,.28),g.math('ADD',g.math('MULTIPLY',rim,.36),g.math('MULTIPLY',band,.22))),clamp=True)
    finish(material,g,g.add(color,light),alpha)
    return material
def block_material():
    material,g=new_material('block')
    color,uv=gradient_color(g,logo['gradients']['text'],MEASURED_BLOCK)
    form,glint,rim=light_terms(g,uv)
    lit,band=sweep_terms(g,uv)
    base=g.scale(color,g.lerp(lit,.78,1))
    light=g.math('ADD',g.math('MULTIPLY',glint,.14),g.math('MULTIPLY',band,.85))
    finish(material,g,g.add(shaded(g,base,form,1.),light))
    return material
def face_material():
    material,g=new_material('face')
    color,uv=gradient_color(g,logo['gradients']['text'])
    form,glint,rim=light_terms(g,uv)
    lit,band=sweep_terms(g,uv)
    # Each letter emerges in the logo's colour and pales as it rises (object colour red).
    info=g.nodes.new('ShaderNodeObjectInfo')
    tint=g.mix(g.math('MULTIPLY',g.part(info.outputs['Color'],'X'),.66),color,(1,1,1,1))
    base=g.mix(lit,tint,(1,1,1,1))
    # Only a steep turn shades the white, so it stays truly white through the sway.
    finish(material,g,g.add(shaded(g,base,form,.28),g.math('MULTIPLY',glint,.2)))
    return material
def spark_material():
    material,g=new_material('spark')
    finish(material,g,(1,1,1,1))
    return material

# --- Model. Layer stack from the coordinator's look-dev. ---
space=LogoSpace(logo['canvas'],(2010,2010),5/4000)
collection=scene.collection
glass,frame,navy,traces,pads_material,block,face=glass_material(),frame_material(),navy_material(),trace_material('traces'),trace_material('pads',True),block_material(),face_material()
def solid(name,contours,z0,z1,material,bevel=0.,origin=None):
    obj=extrude_contours(collection,space,PREFIX+name,contours,z0,z1,material,bevel=bevel,origin=origin)
    obj.data.name=PREFIX+name
    obj.data.shade_flat()
    return obj
spin=bpy.data.objects.new(PREFIX+'spin',None);collection.objects.link(spin)
tilt=bpy.data.objects.new(PREFIX+'tilt',None);collection.objects.link(tilt)
spin.parent=tilt
layers=logo['layers']
parts=[solid('navy',layers['navy'],-.16,-.04,navy),solid('glass',layers['panel'],-.012,.012,glass),
       solid('frame',layers['frame'],-.09,.09,frame,bevel=.018)]
pad_rings=[(2,3),(9,10),(13,14)]
pad_ids={i for pair in pad_rings for i in pair}
# The SVG's traces overlap where they meet, which breaks a curve's fill, so each is its own solid.
for group in [(0,1),*[(i,) for i in range(4,18) if i not in pad_ids and i!=1]]:
    parts.append(solid(f'trace {group[0]}',[layers['traces'][i] for i in group],.012,.05,traces))
for pair in pad_rings:
    parts.append(solid(f'pad {pair[0]}',[layers['traces'][i] for i in pair],.012,.062,pads_material))
parts.append(solid('label 0x4f',layers['label0x4f'],.012,.04,traces))
parts.append(solid('label 0x58',layers['label0x58'],.012,.04,traces))
for part in parts:part.parent=spin
glyphs={}
for name in ORDER:
    glyph=logo['glyphs'][name]
    origin=glyph_center(space,glyph)
    back=solid(f'{name} block',glyph['back'],0,BLOCK_DEPTH,block,origin=origin)
    top=solid(f'{name} face',glyph['face'],0,FACE_DEPTH,face,origin=origin)
    back.parent=top.parent=spin
    glyphs[name]=(back,top,origin)
# Pixel-art sparks: a four-point star on each pad, in the logo's own idiom.
spark_mat=spark_material()
star_data=bpy.data.meshes.new(PREFIX+'spark')
star=[(math.cos(i*math.pi/4)*(1 if i%2==0 else .17),math.sin(i*math.pi/4)*(1 if i%2==0 else .17),0) for i in range(8)]
star_data.from_pydata(star,[],[list(range(8))]);star_data.materials.append(spark_mat);star_data.update()
sparks=[]
for pair in pad_rings:
    x0,y0,x1,y1=contour_bounds([layers['traces'][pair[0]]])
    obj=bpy.data.objects.new(PREFIX+f'spark {pair[0]}',star_data);collection.objects.link(obj)
    obj.parent=spin;wx,wy=space.point((x0+x1)/2,(y0+y1)/2);obj.location=(wx,wy,.075)
    sparks.append(obj)

# --- Camera and FX clock. ---
camera_data=bpy.data.cameras.new(PREFIX+'camera');camera_data.sensor_fit='HORIZONTAL';camera_data.sensor_width=36
camera_data.clip_start=.1;camera_data.clip_end=100
camera=bpy.data.objects.new(PREFIX+'camera',camera_data);collection.objects.link(camera)
scene.camera=camera
for name in (*PULSE,'compact_pads','compact_speed'):scene[name]=0.
for f in range(0,FRAMES+1):
    yaw,tilt_x,tilt_z,bob,size=pose(f)
    spin.rotation_euler=(0,yaw,0);spin.keyframe_insert('rotation_euler',frame=f)
    tilt.rotation_euler=(tilt_x,0,tilt_z);tilt.location=(0,bob,0);tilt.scale=(size,)*3
    for path in ('rotation_euler','location','scale'):tilt.keyframe_insert(path,frame=f)
    camera.location=(0,CENTER_Y,camera_distance(f));camera.keyframe_insert('location',frame=f)
    camera_data.lens=lens(f);camera_data.keyframe_insert('lens',frame=f)
    for name,(start,end,a,b,rest) in PULSE.items():
        scene[name]=(rest if f>end else keyed(start,end,a,b,f));scene.keyframe_insert(f'["{name}"]',frame=f)
    wave=math.sin(math.pi*max(0,min(1,(f-PAD_FLASH[0])/(PAD_FLASH[1]-PAD_FLASH[0]))))
    scene['compact_pads']=wave;scene.keyframe_insert('["compact_pads"]',frame=f)
    for i,obj in enumerate(sparks):
        t=(f-PAD_FLASH[0]-i)/6
        amount=math.sin(math.pi*t) if 0<t<1 else 0
        obj.scale=(max(.0001,amount*.34),)*3;obj.rotation_euler=(0,0,.55*t if 0<t<1 else 0)
        obj.keyframe_insert('scale',frame=f);obj.keyframe_insert('rotation_euler',frame=f)
    for name,(back,top,origin) in glyphs.items():
        height=rise(name,f)
        # Undo the rest camera's magnification of the raised letters, so the logo's layout holds.
        fit=1-(BLOCK_BASE+BLOCK_DEPTH*height+FACE_DEPTH)/camera_distance(INTRO)
        for obj in (back,top):
            obj.location=(origin[0]*fit,CENTER_Y+(origin[1]-CENTER_Y)*fit,0)
            obj.scale=(fit,fit,1)
        back.location.z=BLOCK_BASE;back.scale.z=height
        top.location.z=BLOCK_BASE+BLOCK_DEPTH*height
        top.color=(smooth((f-RISE_START[name])/13),0,0,1);top.keyframe_insert('color',frame=f)
        for obj in (back,top):
            obj.hide_render=f<RISE_START[name]
            for path in ('location','scale','hide_render'):obj.keyframe_insert(path,frame=f)
    # Heavy blur at speed, gone by the last turn so the logo lands crisp.
    scene.render.motion_blur_shutter=.55*(1-smooth((f-14)/(56-14)))
    scene['compact_speed']=.34*(1-smooth((f-22)/(50-22)));scene.keyframe_insert('["compact_speed"]',frame=f)
    scene.render.keyframe_insert('motion_blur_shutter',frame=f)
def linear_keys(block):
    if block and block.animation_data and block.animation_data.action:
        for layer in block.animation_data.action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for point in curve.keyframe_points:point.interpolation='LINEAR'
for block in {spin,tilt,camera,camera_data,scene,*sparks,*[o for g in glyphs.values() for o in g[:2]]}:linear_keys(block)
for frame,name in [(1,'Fast spin'),(RISE_START['O'],'Letters rise'),(44,'Last turn begins'),(LAND,'Landing thunk'),(LAND+1,'Frame pulses'),(LAND+6,'Trace wave'),(LAND+10,'Pads spark'),(LAND+8,'White sweep'),(INTRO,'Final logo rest'),(INTRO+1,'Idle sway loop')]:scene.timeline_markers.new(name,frame=frame)
scene['adaptation']='User-requested HackUK-style portfolio app logo: OxHack compact SVG extruded with its gradients. Not native firmware.'
scene['source_sha256']=sources['compact']['sha256']
scene['delivery']=f'{FRAMES} transparent {WIDTH}x{HEIGHT} frames at 30000/1001fps; spin-and-reveal intro in frames 1-{INTRO}, frame {INTRO} is the rest logo, then a {IDLE}-frame idle sway loop.'
scene.render.filepath=str(output/'frames'/'frame-')
scene.frame_set(INTRO)
bpy.data.libraries.write(str(root/'assets/blender/oxhack-compact.blend'),{scene},fake_user=True)
print('OxHack compact scene saved:',scene.name)
