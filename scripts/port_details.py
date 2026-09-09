import bpy,math,contextlib,io
from mathutils import Vector
ROOT='/Volumes/DeveloperStorage/GitHub/3ds-idea'
s=bpy.context.scene;base=bpy.data.objects['Base'];root=bpy.data.objects['3DS_XL'];lid=bpy.data.objects['Hinge']
black=bpy.data.materials['Graphite ABS'];dark=bpy.data.materials['Aperture darkness'];chrome=bpy.data.materials['Lens rim'];gold=bpy.data.materials['Charging contacts gold']
source=open(ROOT+'/scripts/refine_model.py').read();exec(source[source.index('def profile'):source.index("base=bpy.data.objects")])
body=bpy.data.objects['Lower graphite chassis']
def cut_socket(name,x,w,h,z):
 cutter=profile('cut_'+name,w,h,4,[min(h*.4,1)]*4,(x,46,z),black,base,.15);cutter.rotation_euler[0]=math.pi/2;bpy.context.view_layer.update()
 b=body.modifiers.new(name+' aperture','BOOLEAN');b.operation='DIFFERENCE';b.solver='EXACT';b.object=cutter;bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)
 old=bpy.data.objects.get(name)
 if old:bpy.data.objects.remove(old,do_unlink=True)
 o=profile(name,w*.98,h*.97,.12,[min(h*.35,.9)]*4,(x,44.3,z),dark,base,.02);o.rotation_euler[0]=math.pi/2
for name,x,w,h,z in [('Cartridge slot',8,37,3.3,6.1),('Charging socket',-39,8,3.4,6.1),('IR port',48,10,3,6.1),('Stylus socket',65,4.2,3,6.1)]:cut_socket(name,x,w,h,z)
# Metal cartridge lip and the two recessed charge-socket terminals.
for name,x,w,h,z,m in [('Game card lip',8,35,.32,4.8,chrome),('Charge socket floor',-39,6,.3,4.7,chrome),('Charge connector pin L',-40.3,.8,.5,6.1,gold),('Charge connector pin R',-37.7,.8,.5,6.1,gold)]:
 o=profile(name,w,h,.3,[min(.1,h/3)]*4,(x,45.7,z),m,base,.05);o.rotation_euler[0]=math.pi/2
# Front audio jack: real drilled opening, then dark liner at its inner wall.
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=1.8,depth=4,location=(-60,-46,6));c=bpy.context.object;c.parent=base;c.rotation_euler[0]=math.pi/2;bpy.context.view_layer.update();b=body.modifiers.new('3.5mm audio aperture','BOOLEAN');b.operation='DIFFERENCE';b.object=c;bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(c,do_unlink=True)
bpy.data.objects['Headphone jack opening'].location.y=-44.2
# The outer ring is dark molded plastic on the real unit, rather than bright chrome.
bpy.data.objects['Headphone jack rim'].data.materials.clear();bpy.data.objects['Headphone jack rim'].data.materials.append(black)
# Retain complete UVs for portable glTF material export.
for o in root.children_recursive:
 if o.type=='MESH' and not o.data.uv_layers:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.cube_project(cube_size=120);bpy.ops.object.mode_set(mode='OBJECT')
lid.rotation_euler[0]=math.radians(-110);s.camera.location=(-160,230,85);s.camera.rotation_euler=(Vector((0,18,32))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=218;s.render.filepath=ROOT+'/renders/rear-detail.png';bpy.ops.render.render(write_still=True)
lid.rotation_euler[0]=math.radians(-155);s.camera.location=(40,-280,235);s.camera.rotation_euler=(Vector((0,18,37))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=238
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/model/silver-3ds-xl.blend')
lid.rotation_euler[0]=0;root.scale=(.001,)*3;bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children_recursive:o.select_set(True)
with contextlib.redirect_stdout(io.StringIO()):bpy.ops.export_scene.gltf(filepath=ROOT+'/public/models/silver-3ds-xl.glb',export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False)
root.scale=(1,)*3;lid.rotation_euler[0]=math.radians(-155)
print('Recessed ports rendered and exported.')
