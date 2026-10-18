"""Run through Blender MCP with absolute ROOT and OUTPUT paths.
The supplied screenshot contours form shallow 3D lettering. Its pixel chevron
writes the top row, turns the corner, then reveals the lower row in reverse.
2025 then flips up digit by digit in the same face (build-hack-ldn-2025-digits.py).
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
root,output=Path(ROOT),Path(OUTPUT)
output.mkdir(parents=True,exist_ok=True)
FRAMES=104
scene=bpy.data.scenes.new('Hack LDN 2025 chevron writer')
if bpy.context.window:bpy.context.window.scene=scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=180;scene.render.resolution_y=148
scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.color_depth='8'
scene.render.fps=30;scene.render.fps_base=1.001
scene.frame_start=1;scene.frame_end=FRAMES
scene.world=bpy.data.worlds.new('Hack LDN soft studio');scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value=(.7,.75,.8,1);bg.inputs['Strength'].default_value=.5
scene.view_settings.view_transform='Standard'
def srgb(v):return ((v/255+.055)/1.055)**2.4 if v>10 else v/3294.6
mat=bpy.data.materials.new('Hack LDN graphite enamel');mat.use_nodes=True
bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bsdf.inputs['Base Color'].default_value=(*[srgb(v) for v in (49,55,63)],1)
bsdf.inputs['Metallic'].default_value=.04;bsdf.inputs['Roughness'].default_value=.38
mat.diffuse_color=(*[srgb(v) for v in (49,55,63)],1)
def ease(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def visibility(obj,start,end=FRAMES):
    for f in range(1,FRAMES+1):
        obj.hide_render=not start<=f<=end;obj.keyframe_insert('hide_render',frame=f)
source=json.loads((root/'scripts/blender/hack-ldn-logo-contours.json').read_text())
digits=json.loads((root/'scripts/blender/hack-ldn-2025-digits.json').read_text())
# HACK, LDN and 2025 share one cap height; the three rows fill the 148px frame.
scale=4.2/1224
xmin,ymin,w,_=source['bounds'];bottom=digits['bounds'][1]+digits['bounds'][3]
def point(px,py):return ((px-(xmin+w/2))*scale,((ymin+bottom)/2-py)*scale)
def route(wx,wy):
    """Chevron waypoints were authored for the two-row layout."""
    return point(xmin+w/2+wx*1224/4.4,ymin+362-(wy-.35)*1224/4.4)
objects={}
for part in source['parts']:
    name=part['name'];x,y,pw,ph=part['bounds'];cx,cy=point(x+pw/2,y+ph/2)
    curve=bpy.data.curves.new('Traced '+name,'CURVE');curve.dimensions='2D';curve.fill_mode='BOTH'
    curve.resolution_u=1;curve.extrude=.045;curve.bevel_depth=.006;curve.bevel_resolution=1
    for contour in part['paths']:
        spline=curve.splines.new('POLY');spline.points.add(len(contour)-1)
        for p,(px,py) in zip(spline.points,contour):
            wx,wy=point(px,py);p.co=(wx-cx,wy-cy,0,1)
        spline.use_cyclic_u=True
    obj=bpy.data.objects.new('Hack LDN '+name,curve);scene.collection.objects.link(obj)
    obj.data.materials.append(mat);obj.location=(cx,cy,0);objects[name]=obj
    if name=='arrow':
        visibility(obj,1)
        # The chevron leads a two-row route, rotates around the corner, then
        # lands exactly on the traced logo's final placement.
        top,low=route(-2.20,.99),route(2.10,-.66);right=route(2.10,.99)
        keys=[(1,*top,.42,0),(5,*top,.52,0),
              (30,*right,.52,0),(35,*right,.52,-math.pi/2),
              (40,*low,.52,-math.pi/2),(44,*low,.52,-math.pi),
              (62,cx,cy,.78,-math.pi),(70,cx,cy,1.04,-2*math.pi),
              (75,cx,cy,1,-2*math.pi),(FRAMES,cx,cy,1,-2*math.pi)]
        for f,px,py,size,angle in keys:
            obj.location=(px,py,.10);obj.scale=(size,)*3;obj.rotation_euler=(0,0,angle)
            for path in ('location','scale','rotation_euler'):obj.keyframe_insert(path,frame=f)
    else:
        start={'H':8,'A':14,'C':20,'K':25,'N':46,'D':51,'L':56}[name]
        visibility(obj,start)
        for f in range(1,FRAMES+1):
            t=ease((f-start)/9)
            overshoot=1+.055*math.sin(math.pi*ease((f-start-7)/7)) if f>=start+7 else 1
            size=max(.001,t)*overshoot
            obj.scale=(size,)*3
            obj.location=(cx,cy-(1-t)*.16,0)
            obj.rotation_euler=(0,(-1 if name in ['N','D','L'] else 1)*.85*(1-t),0)
            for path in ('scale','location','rotation_euler'):obj.keyframe_insert(path,frame=f)
def back(t):
    """Ease-out with a soft 4% overshoot, settling exactly on 1."""
    t=max(0,min(1,t));c=1.2;return 1+(c+1)*(t-1)**3+c*(t-1)**2
# Once the chevron lands, each digit tips up from below the baseline and settles.
for i,glyph in enumerate(digits['glyphs']):
    start=64+5*i;pts=[q for solid in glyph['solids'] for ring in solid for q in ring]
    gx=(min(x for x,_ in pts)+max(x for x,_ in pts))/2;gy=digits['bounds'][1]+digits['bounds'][3]
    cx,cy=point(gx,gy)
    for k,solid in enumerate(glyph['solids']):
        curve=bpy.data.curves.new(f"Digit {i} {glyph['char']} {k}",'CURVE');curve.dimensions='2D';curve.fill_mode='BOTH'
        curve.resolution_u=1;curve.extrude=.045;curve.bevel_depth=.006;curve.bevel_resolution=1
        for contour in solid:
            spline=curve.splines.new('POLY');spline.points.add(len(contour)-1)
            for p,(px,py) in zip(spline.points,contour):
                wx,wy=point(px,py);p.co=(wx-cx,wy-cy,0,1)
            spline.use_cyclic_u=True
        obj=bpy.data.objects.new(f"Hack LDN 2025 digit {i} {glyph['char']}"+(f' part {k}' if k else ''),curve)
        scene.collection.objects.link(obj);obj.data.materials.append(mat)
        visibility(obj,start)
        for f in range(1,FRAMES+1):
            u=(f-start)/16;t=back(u);e=ease(u)
            obj.location=(cx,cy-(1-e)*.22,0)
            obj.rotation_euler=(1.35*(1-t),0,0)
            obj.scale=(max(.001,.55+.45*e),)*3
            for path in ('location','rotation_euler','scale'):obj.keyframe_insert(path,frame=f)
# Orthographic, low resolution and light positions match the NVIDIA asset.
cd=bpy.data.cameras.new('Hack LDN banner camera');camera=bpy.data.objects.new(cd.name,cd)
scene.collection.objects.link(camera);camera.location=(0,0,8);cd.type='ORTHO';cd.ortho_scale=5;scene.camera=camera
for name,loc,energy,size in [('Hack LDN soft key',(-3,4,6),280,4),('Hack LDN fill',(3,1,4),90,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
for frame,name in [(1,'Chevron cursor'),(8,'Write HACK'),(35,'Turn the corner'),(46,'Write LDN backwards'),(62,'Chevron lands'),(64,'2025 tips up'),(95,'Final logo hold')]:scene.timeline_markers.new(name,frame=frame)
scene['adaptation']='User-requested ninth portfolio app. Screenshot traced into shallow graphite lettering for the light LCD. Not native firmware.'
scene['source_sha256']=source['sourceSha256']
scene['delivery']=f'{FRAMES} transparent 180x148 frames at 30000/1001fps; one-shot chevron-led lettering reveal, 2025 digit tip-up and logo hold.'
scene.render.filepath=str(output/'frame-')
scene.frame_set(FRAMES)
for area in (bpy.context.screen.areas if bpy.context.screen else ()):
    if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.data.libraries.write(str(root/'assets/blender/hack-ldn-2025.blend'),{scene},fake_user=True)
print('Hack LDN scene saved:',scene.name)
