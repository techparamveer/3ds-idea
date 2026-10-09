"""Run through Blender MCP with absolute ROOT and OUTPUT paths.
The supplied screenshot contours form solid bevelled 3D lettering. Its pixel chevron
writes the top row, turns the corner, then reveals the lower row in reverse.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,Matrix
root,output=Path(ROOT),Path(OUTPUT)
output.mkdir(parents=True,exist_ok=True)
scene=bpy.data.scenes.new('Hack LDN 2025 solid chevron writer')
bpy.context.window.scene=scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=180;scene.render.resolution_y=148
scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.color_depth='8'
scene.render.fps=30;scene.render.fps_base=1.001
scene.frame_start=1;scene.frame_end=80
scene.world=bpy.data.worlds.new('Hack LDN soft studio');scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value=(.7,.75,.8,1);bg.inputs['Strength'].default_value=.5
scene.view_settings.view_transform='Standard'
def srgb(v):return ((v/255+.055)/1.055)**2.4 if v>10 else v/3294.6
def enamel(name,color,metallic,roughness):
    material=bpy.data.materials.new(name);material.use_nodes=True
    bsdf=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    linear=(*[srgb(v) for v in color],1)
    bsdf.inputs['Base Color'].default_value=linear
    bsdf.inputs['Metallic'].default_value=metallic;bsdf.inputs['Roughness'].default_value=roughness
    material.diffuse_color=linear
    return material
front=enamel('Hack LDN graphite face',(85,92,104),.22,.32)
side=enamel('Hack LDN dark sidewalls',(32,38,47),.12,.4)
edge=enamel('Hack LDN bevel highlight',(130,139,151),.28,.27)
mesh_target=next(item.identifier for item in bpy.ops.object.convert.get_rna_type().properties['target'].enum_items if item.identifier=='MESH')
def ease(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def visibility(obj,start,end=80):
    for f in range(1,81):
        obj.hide_render=not start<=f<=end;obj.keyframe_insert('hide_render',frame=f)
source=json.loads((root/'scripts/blender/hack-ldn-logo-contours.json').read_text())
scale=4.4/1224
xmin,ymin,w,h=source['bounds']
def point(px,py):return ((px-(xmin+w/2))*scale,((ymin+h/2)-py)*scale+.35)
objects={}
for part in source['parts']:
    name=part['name'];x,y,pw,ph=part['bounds'];cx,cy=point(x+pw/2,y+ph/2)
    curve=bpy.data.curves.new('Traced '+name,'CURVE');curve.dimensions='2D';curve.fill_mode='BOTH'
    curve.resolution_u=1;curve.extrude=.22;curve.bevel_depth=.024;curve.bevel_resolution=1
    for contour in part['paths']:
        spline=curve.splines.new('POLY');spline.points.add(len(contour)-1)
        for p,(px,py) in zip(spline.points,contour):
            wx,wy=point(px,py);p.co=(wx-cx,wy-cy,0,1)
        spline.use_cyclic_u=True
    obj=bpy.data.objects.new('Hack LDN '+name,curve);scene.collection.objects.link(obj)
    obj.data.materials.append(front);obj.location=(cx,cy,0)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.convert(target=mesh_target)
    obj=bpy.context.object;objects[name]=obj
    obj.data.materials.clear()
    for material in (front,side,edge):obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        z=polygon.normal.z
        polygon.material_index=0 if z>.99 else 2 if .01<z<.99 else 1
    if name=='arrow':
        visibility(obj,1)
        # The chevron leads a two-row route, rotates around the corner, then
        # lands exactly on the traced logo's final placement.
        keys=[(1,-2.20,.99,.42,0),(5,-2.20,.99,.52,0),
              (30,2.10,.99,.52,0),(35,2.10,.99,.52,-math.pi/2),
              (40,2.10,-.66,.52,-math.pi/2),(44,2.10,-.66,.52,-math.pi),
              (62,cx,cy,.78,-math.pi),(70,cx,cy,1.04,-2*math.pi),
              (75,cx,cy,1,-2*math.pi),(80,cx,cy,1,-2*math.pi)]
        for f,px,py,size,angle in keys:
            obj.location=(px,py,.10);obj.scale=(size,)*3;obj.rotation_euler=(0,0,angle)
            for path in ('location','scale','rotation_euler'):obj.keyframe_insert(path,frame=f)
    else:
        start={'H':8,'A':14,'C':20,'K':25,'N':46,'D':51,'L':56}[name]
        visibility(obj,start)
        for f in range(1,81):
            t=ease((f-start)/9)
            overshoot=1+.055*math.sin(math.pi*ease((f-start-7)/7)) if f>=start+7 else 1
            size=max(.001,t)*overshoot
            obj.scale=(size,)*3
            obj.location=(cx,cy-(1-t)*.16,0)
            obj.rotation_euler=(0,(-1 if name in ['N','D','L'] else 1)*.85*(1-t),0)
            for path in ('scale','location','rotation_euler'):obj.keyframe_insert(path,frame=f)
# Keep the pixel raster, but expose the extrusion with an oblique camera.
cd=bpy.data.cameras.new('Hack LDN banner camera');camera=bpy.data.objects.new(cd.name,cd)
scene.collection.objects.link(camera);camera.location=(2.4,1.5,8);cd.type='ORTHO';cd.ortho_scale=5.2;scene.camera=camera
back=camera.location.normalized();right=Vector((0,1,0)).cross(back).normalized();up=back.cross(right)
camera.rotation_euler=Matrix((right,up,back)).transposed().to_euler()
for name,loc,energy,size in [('Hack LDN soft key',(-3,4,6),380,3),('Hack LDN fill',(3,1,4),110,3),('Hack LDN edge light',(-2,-2,4),100,2)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
for frame,name in [(1,'Chevron cursor'),(8,'Write HACK'),(35,'Turn the corner'),(46,'Write LDN backwards'),(62,'Chevron lands'),(75,'Final logo hold')]:scene.timeline_markers.new(name,frame=frame)
scene['adaptation']='User-requested ninth portfolio app. Screenshot traced into solid bevelled graphite lettering for the light LCD. Not native firmware.'
scene['source_sha256']=source['sourceSha256']
scene['delivery']='80 transparent 180x148 frames at 30000/1001fps; one-shot chevron-led lettering reveal and logo hold.'
scene.render.filepath=str(output/'frame-')
scene.frame_set(80)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.data.libraries.write(str(root/'assets/blender/hack-ldn-2025.blend'),{scene},fake_user=True)
print('Hack LDN scene saved:',scene.name)
