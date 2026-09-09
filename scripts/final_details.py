import bpy, math, json, os
from mathutils import Vector
ROOT='/Volumes/DeveloperStorage/GitHub/3ds-idea'
base=bpy.data.objects['Base'];lid=bpy.data.objects['Hinge'];root=bpy.data.objects['3DS_XL'];s=bpy.context.scene
black=bpy.data.materials['Graphite ABS'];silver=bpy.data.materials['Satin silver metallic paint'];seam=bpy.data.materials['Recess shadow'];ink=bpy.data.materials['Warm grey pad printing'];glass=bpy.data.materials['Optical black glass'];chrome=bpy.data.materials['Lens rim']
o=bpy.data.objects['Lower silver shell'];o.data.materials.clear();o.data.materials.append(black);o.name='Lower graphite chassis'
# Reuse the explicit rolled surface constructor from the refinement script.
source=open(ROOT+'/scripts/refine_model.py').read();exec(source[source.index('def profile'):source.index("base=bpy.data.objects")])
profile('Battery cover',154.5,78,4,[3,3,11,11],(0,-6.5,2),silver,base,1.95)
# Restore text above the taller lower bezel keys.
for n in ['SELECT','HOME','START']:bpy.data.objects[n+' print'].location.z=13.47
bpy.data.objects['HOME print'].data.body='HOME';bpy.data.objects['HOME print'].location.x=1
# Fine typography uses the local sans face, converted to geometry at export.
fontpath='/System/Library/Fonts/Helvetica.ttc'
if os.path.exists(fontpath):
 font=bpy.data.fonts.load(fontpath)
 for o in bpy.data.objects:
  if o.type=='FONT':o.data.font=font
# Stylized power and home glyphs are geometry, avoiding missing Unicode glyphs.
def stroke(name,points,width,m,parent):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=width;c.bevel_resolution=2;sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for p,v in zip(sp.points,points):p.co=(*v,1)
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.parent=parent;c.materials.append(m);return o
bpy.data.objects.remove(bpy.data.objects['Power symbol'],do_unlink=True)
stroke('Power icon ring',[(60+1.45*math.cos(a),-35+1.45*math.sin(a),13.41) for a in [math.radians(130+i*280/40) for i in range(41)]],.11,ink,base)
stroke('Power icon stem',[(60,-33.2,13.41),(60,-35,13.41)],.11,ink,base)
stroke('Home icon',[(-6,-40.25,13.47),(-6,-39.2,13.47),(-6.5,-39.2,13.47),(-5.15,-38.1,13.47),(-3.8,-39.2,13.47),(-4.3,-39.2,13.47),(-4.3,-40.25,13.47),(-6,-40.25,13.47)],.085,ink,base)
# Camera lenses use a sloped annulus, with glass inside the silver face.
for o in list(lid.children):
 if o.name.startswith('Outer camera') and 'indicator' not in o.name:bpy.data.objects.remove(o,do_unlink=True)
def annulus(name,x,y,rs,zs,m):
 vs=[];fs=[];N=64
 for r,z in zip(rs,zs):
  for i in range(N):a=i*2*math.pi/N;vs.append((x+r*math.cos(a),y+r*math.sin(a),z))
 for k in range(len(rs)-1):
  for i in range(N):j=(i+1)%N;fs.append((k*N+i,k*N+j,(k+1)*N+j,(k+1)*N+i))
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);s.collection.objects.link(o);o.parent=lid;me.materials.append(m)
 for p in me.polygons:p.use_smooth=True
for x in [-18,18]:
 annulus('Outer camera silver bevel',x,-80.9,[2.7,2.55,2.15],[6.50,6.47,6.28],chrome)
 annulus('Outer camera black socket',x,-80.9,[2.15,1.5,.01],[6.28,6.285,6.285],seam)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=12,radius=1,location=(x,-80.9,6.29));o=bpy.context.object;o.name='Outer camera optical glass';o.parent=lid;o.scale=(1.45,1.45,.035);o.data.materials.append(glass)
# Darker printing better matches the subtle embossed labels.
p=ink.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.20,.24,.25,1)
# Rear charge socket frame and gold charging cradle pads.
gold=bpy.data.materials.new('Charging contacts gold');gold.use_nodes=True;p=gold.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(.5,.31,.07,1);p.inputs['Metallic'].default_value=.8;p.inputs['Roughness'].default_value=.3
for o in bpy.data.objects:
 if o.name.startswith('Charging contact'):o.data.materials.clear();o.data.materials.append(gold)
# Wireless side slider and ridges on its actual right-hand control.
for name,w,d,h,r,loc,m in [('Wireless recess',.25,11,3,.1,(77.92,16,9),seam),('Wireless switch',.16,4.2,2.1,.1,(78,16,9),black),('Stylus side socket',.18,9,3,.1,(77.94,30,6.2),seam)]:profile(name,w,d,h,[r]*4,loc,m,base,.05)
for y in [14.5,15.5,16.5,17.5]:stroke('Wireless grip rib',[(78.09,y,8.25),(78.09,y,9.75)],.10,ink,base)
# Tiny original rubber contact squares in the four corners of the screen face.
for x in [-67.5,67.5]:
 for y in [-11,-77]:profile('Lid contact square '+str(x)+' '+str(y),2.5,2.8,.06,[.4]*4,(x,y,-1.22),black,lid,.02)
# Pack the material texture in the native source.
for im in bpy.data.images:
 if im.source=='FILE':
  try:im.pack()
  except:pass
# Check design dimensions from the actual evaluated closed object bounds.
lid.rotation_euler[0]=0;bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
pts=[]
for o in root.children_recursive:
 if o.type in ['MESH','FONT','CURVE']:
  ev=o.evaluated_get(deps);pts.extend([ev.matrix_world@Vector(c) for c in ev.bound_box])
bounds=[[min(p[i] for p in pts),max(p[i] for p in pts)] for i in range(3)]
report={'target_closed_mm':[156,93,22],'measured_closed_bounds_mm':bounds,'measured_closed_dimensions_mm':[b-a for a,b in bounds],'hinge_degrees':[0,155],'top_panel_mm':[106.2879631279,63.7727778768],'bottom_panel_mm':[84.9376,63.7032],'notes':'Photographic reconstruction, not a manufacturer CAD scan. Physical screen ratio uses 400x240 per eye; browser top texture stores 800x240.'}
open(ROOT+'/model/dimensions.json','w').write(json.dumps(report,indent=2));print(json.dumps(report))
s.render.filepath=ROOT+'/renders/closed-final.png';s.camera.location=(130,-210,240);s.camera.rotation_euler=(Vector((0,0,8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=210;bpy.ops.render.render(write_still=True)
lid.rotation_euler[0]=math.radians(-155);s.camera.location=(40,-280,235);s.camera.rotation_euler=(Vector((0,18,37))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=238;s.render.filepath=ROOT+'/renders/open-final.png';bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/model/silver-3ds-xl.blend')
