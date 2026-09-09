import bpy, math, os
from mathutils import Vector
ROOT='/Volumes/DeveloperStorage/GitHub/3ds-idea'
# Rebuild hard-surface outlines with explicit rolled rings. This avoids bevel
# clamping on densely sampled round corners, and gives uninterrupted highlights.
def profile(name,w,d,h,radii,loc,m,parent,edge):
 old=bpy.data.objects.get(name)
 if old:bpy.data.objects.remove(old,do_unlink=True)
 e=min(edge,h*.49); rings=[]
 for i in range(7):
  a=i*math.pi/12;rings.append((e*(1-math.sin(a)),-h/2+e*(1-math.cos(a))))
 for i in range(7):
  a=i*math.pi/12;rings.append((e*(1-math.cos(a)),h/2-e+e*math.sin(a)))
 verts=[];N=4*17
 for inset,z in rings:
  W=w-2*inset;D=d-2*inset
  for k,st in enumerate([0,90,180,270]):
   r=max(.08,radii[k]-inset);cx=(W/2-r)*(1 if k in [0,3] else -1);cy=(D/2-r)*(1 if k in [0,1] else -1)
   for i in range(17):
    a=math.radians(st+i*90/16);verts.append((cx+r*math.cos(a),cy+r*math.sin(a),z))
 faces=[tuple(reversed(range(N)))]
 for k in range(len(rings)-1):
  for i in range(N):j=(i+1)%N;faces.append((k*N+i,k*N+j,(k+1)*N+j,(k+1)*N+i))
 faces.append(tuple(range((len(rings)-1)*N,len(rings)*N)))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);o.location=loc;o.parent=parent;me.materials.append(m)
 for f in me.polygons:f.use_smooth=True
 # Top/bottom normals stay planar, all side rings shade continuously.
 me.polygons[0].use_smooth=False;me.polygons[-1].use_smooth=False
 return o
base=bpy.data.objects['Base'];lid=bpy.data.objects['Hinge']
silver=bpy.data.materials['Satin silver metallic paint'];black=bpy.data.materials['Graphite ABS'];seam=bpy.data.materials['Recess shadow']
profile('Lower silver shell',156,93,8,[7,7,12,12],(0,0,4),silver,base,3.6)
profile('Lower case seam',155.8,92.8,.4,[7,7,11,11],(0,0,8.15),seam,base,.1)
profile('Black control deck',156,93,4.9,[6,6,11,11],(0,0,10.85),black,base,1.8)
# A lowered perimeter skirt closes the shell; recessed controls remain clear.
profile('Lid perimeter seam',155.6,82.5,7.5,[1.2,1.2,10.8,10.8],(0,-46.1,2.55),seam,lid,1.4)
outer=profile('Silver outer lid',156,82.5,5.9,[1.6,1.6,11.2,11.2],(0,-46.1,3.55),silver,lid,2.85)
inner=profile('Inner lid graphite face',155.4,82.2,2.2,[1.2,1.2,10.5,10.5],(0,-46.1,-.1),black,lid,.65)
# Keep existing glass, lens and speaker features in the lower inner plane.
for o in list(lid.children):
 if o.name.startswith(('Upper screen','Screen_Top','Inner camera','Lid rubber','Speaker','3D print','3D off')):o.location.z-=1.15
# Black recessed display mask and control bezel follow the actual housing.
for name in ['Upper screen recessed bezel','Touch screen outer inset']:
 o=bpy.data.objects[name];o.data.materials.clear();o.data.materials.append(seam)
# Lens openings are cut after the shell profile is already resolved.
bpy.context.view_layer.update()
for x in [-18,18]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=2.65,depth=2,location=(x,-80.9,6.1));cut=bpy.context.object;cut.parent=lid
 bpy.context.view_layer.update();b=outer.modifiers.new('Camera socket','BOOLEAN');b.operation='DIFFERENCE';b.object=cut;b.solver='EXACT';bpy.context.view_layer.objects.active=outer;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cut,do_unlink=True)
for o in list(lid.children):
 if o.name.startswith('Outer camera'):
  o.location.y=-80.9
  if 'rim' in o.name:o.location.z=6.35
  elif 'recess' in o.name:o.location.z=6.30
  elif 'lens' in o.name:o.location.z=6.28
# Make the circle pad a dished silicone surface rather than a stack of flat discs.
for name in ['Button_Circle','Circle pad face']:
 o=bpy.data.objects.get(name)
 if o:bpy.data.objects.remove(o,do_unlink=True)
verts=[(0,0,1.3)];faces=[];N=64
for r,z in [(.8,1.3),(4.8,1.36),(6.4,1.58),(7.1,1.5),(7.45,1.15),(7.45,.2),(7,.0)]:
 for i in range(N):a=i*2*math.pi/N;verts.append((r*math.cos(a),r*math.sin(a),z))
for i in range(N):faces.append((0,1+i,1+(i+1)%N))
for k in range(6):
 for i in range(N):j=(i+1)%N;faces.append((1+k*N+i,1+(k+1)*N+i,1+(k+1)*N+j,1+k*N+j))
me=bpy.data.meshes.new('Concave circle pad');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Button_Circle',me);bpy.context.scene.collection.objects.link(o);o.parent=base;o.location=(-61,15,13.45);me.materials.append(bpy.data.materials['Circle pad silicone'])
for f in me.polygons:f.use_smooth=True
# Deep unlit apertures avoid painted-on white dots under softboxes.
hole=bpy.data.materials.new('Aperture darkness');hole.use_nodes=True;n=hole.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');em.inputs[0].default_value=(.002,.003,.003,1);hole.node_tree.links.new(em.outputs[0],out.inputs[0])
for o in bpy.data.objects:
 if o.name.startswith(('Speaker perforation','Headphone jack opening','Microphone hole')):
  o.data.materials.clear();o.data.materials.append(hole)
# Key caps more closely match the compact, slightly domed originals.
for name in ['A','B','X','Y']:
 o=bpy.data.objects['Button_'+name];o.modifiers['Edge roll'].width=.5;o.modifiers['Edge roll'].segments=5
# Map exportable paint texture and save repeatable output.
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.parent:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.cube_project(cube_size=120);bpy.ops.object.mode_set(mode='OBJECT')
s=bpy.context.scene;s.camera.location=(145,-220,235);s.camera.rotation_euler=(Vector((0,0,7))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=210
lid.rotation_euler[0]=0;s.render.filepath=ROOT+'/renders/closed-v3.png';bpy.ops.render.render(write_still=True)
lid.rotation_euler[0]=math.radians(-155);s.camera.location=(70,-270,235);s.camera.rotation_euler=(Vector((0,20,40))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=240;s.render.filepath=ROOT+'/renders/open-v3.png';bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/model/silver-3ds-xl.blend')
