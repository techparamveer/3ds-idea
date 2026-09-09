import bpy, math, os, json, random
from mathutils import Vector
ROOT='/Volumes/DeveloperStorage/GitHub/3ds-idea'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials): bpy.data.materials.remove(d)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=.001

def mat(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 return m
silver=mat('Satin silver metallic paint',(.43,.455,.49),.78,.3)
black=mat('Graphite ABS',(.022,.029,.032),.15,.31)
seam=mat('Recess shadow',(.004,.006,.007),0,.5)
glass=mat('Optical black glass',(.007,.013,.019),.18,.13)
rubber=mat('Circle pad silicone',(.29,.34,.35),0,.67)
ink=mat('Warm grey pad printing',(.40,.46,.47),.05,.45)
chrome=mat('Lens rim',(.20,.23,.25),.85,.23)
blue=mat('Power LED',(.005,.35,.8),.1,.2)
p=blue.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(.005,.25,1,1);p.inputs['Emission Strength'].default_value=2
# Fine metallic flake and long shallow hairline wear, kept subtle at product scale.
for m,scale,strength in [(silver,1850,.075),(black,1300,.035)]:
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
 t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=scale;t.inputs['Detail'].default_value=2
 b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=strength;b.inputs['Distance'].default_value=.045;l.new(t.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
root=bpy.data.objects.new('3DS_XL',None);scene.collection.objects.link(root)
base=bpy.data.objects.new('Base',None);scene.collection.objects.link(base);base.parent=root
lid=bpy.data.objects.new('Hinge',None);scene.collection.objects.link(lid);lid.parent=root;lid.location=(0,42,15.5)
lid['min_angle_deg']=0;lid['max_angle_deg']=155

def finish(o,name,m,parent):
 o.name=name;o.data.materials.append(m);o.parent=parent
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 return o

def box(name,w,d,h,r,loc,m,parent=base,edge=.35):
 # Rounded plan outline with separate edge roll, rather than rounded cube corners.
 verts=[];steps=12
 for z in [-h/2,h/2]:
  for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
   for i in range(steps+1):
    a=math.radians(start+i*90/steps);verts.append((cx+r*math.cos(a),cy+r*math.sin(a),z))
 N=len(verts)//2;faces=[tuple(reversed(range(N))),tuple(range(N,N*2))]
 for i in range(N):j=(i+1)%N;faces.append((i,j,j+N,i+N))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.location=loc;finish(o,name,m,parent)
 if edge:
  b=o.modifiers.new('Soft molded edges','BEVEL');b.width=min(edge,h*.45);b.segments=3
  b=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');b.keep_sharp=True;b.weight=50
 return o

def cyl(name,r,depth,loc,m,parent=base,axis='Z'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc);o=bpy.context.object
 if axis=='X':o.rotation_euler[1]=math.pi/2
 if axis=='Y':o.rotation_euler[0]=math.pi/2
 finish(o,name,m,parent);b=o.modifiers.new('Edge roll','BEVEL');b.width=min(.15,depth*.18);b.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o

def label(name,text,loc,size=1.4,parent=base,flip=False,m=ink):
 c=bpy.data.curves.new(name,'FONT');c.body=text;c.align_x='CENTER';c.align_y='CENTER';c.size=size;c.extrude=.003;c.resolution_u=4
 o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.location=loc;o.parent=parent;c.materials.append(m)
 if flip:o.rotation_euler=(math.pi,0,0)
 return o

box('Lower silver shell',156,93,8,11,(0,0,4),silver,edge=2.6)
box('Lower case seam',155.7,92.7,.55,10.8,(0,0,8.2),seam,edge=.1)
box('Black control deck',156,93,4.5,10.6,(0,0,10.75),black,edge=1.35)
box('Lid perimeter seam',155.7,89,6.3,10,(0,-42.5,3.1),seam,lid,edge=1.35)
box('Silver outer lid',156,89,5.5,10.5,(0,-42.5,3.75),silver,lid,edge=1.7)
box('Inner lid graphite face',155.2,88.3,1.5,10,(0,-42.5,.7),black,lid,edge=.5)
for x,w in [(0,126),(-71.5,12.5),(71.5,12.5)]:cyl('Hinge barrel '+str(x),4.5,w,(x,42,15.5),black,base,'X')
for x in [-64,64]:cyl('Hinge joint seam',4.54,.42,(x,42,15.5),seam,base,'X')
# Display apertures and glass: upper is 4.88 inch, 400:240 per eye; lower is 4.18 inch, 320:240.
tw=4.88*25.4*5/math.sqrt(34);th=tw*3/5
bw=4.18*25.4*4/5;bh=bw*3/4
box('Upper screen recessed bezel',tw+6,th+6,.7,2,(0,-43.5,-.18),seam,lid,edge=.24)
box('Screen_Top',tw,th,.15,.7,(0,-43.5,-.58),glass,lid,edge=.035)
box('Touch screen outer inset',bw+10,bh+8,.5,2,(0,-1,13.02),seam,edge=.2)
box('Touch screen bezel',bw+6,bh+4,.5,1,(0,-1,13.3),black,edge=.15)
box('Screen_Bottom',bw,bh,.12,.45,(0,-1,13.61),glass,edge=.03)
# Inner camera, bump stops and stereo speaker perforations.
cyl('Inner camera surround',2.2,.20,(0,-82,-.16),seam,lid)
cyl('Inner camera glass',1.2,.24,(0,-82,-.30),glass,lid)
for x in [-45,45]:cyl('Lid rubber bumper',1.65,.35,(x,-82,-.25),rubber,lid)
for x in [-67,67]:
 for dx,dy in [(0,0),(-2,0),(2,0),(-1,-1.9),(1,-1.9),(-1,1.9),(1,1.9),(0,-3.8),(0,3.8),(-3,-1.9),(3,-1.9),(-3,1.9),(3,1.9)]:
  cyl('Speaker perforation',.48,.16,(x+dx,-43.5+dy,-.13),seam,lid)
# Outer dual camera pair with stepped annular surrounds.
for x in [-18,18]:
 cyl('Outer camera machined rim',2.5,.35,(x,-80,6.52),chrome,lid)
 cyl('Outer camera black recess',2.1,.37,(x,-80,6.63),seam,lid)
 cyl('Outer camera optical lens',1.43,.4,(x,-80,6.68),glass,lid)
cyl('Outer camera indicator',.45,.15,(29.8,-80,6.55),seam,lid)
# Circle pad with concave-looking concentric rim and low silicone cap.
cyl('Circle pad socket',10,.4,(-61,15,13.13),seam)
cyl('Circle pad bearing',8.8,.6,(-61,15,13.55),black)
cyl('Button_Circle',7.25,1.35,(-61,15,14.35),rubber)
cyl('Circle pad face',6.55,.2,(-61,15,15.03),rubber)
# Cross silhouette, one watertight cap.
pts=[(-2.2,6.9),(2.2,6.9),(2.2,2.2),(6.9,2.2),(6.9,-2.2),(2.2,-2.2),(2.2,-6.9),(-2.2,-6.9),(-2.2,-2.2),(-6.9,-2.2),(-6.9,2.2),(-2.2,2.2)]
vs=[(x-61,y-13,z) for z in [13.1,15.2] for x,y in pts];N=len(pts)
fs=[tuple(reversed(range(N))),tuple(range(N,N*2))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
me=bpy.data.meshes.new('Dpad');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Button_Dpad',me);scene.collection.objects.link(o);finish(o,o.name,black,base);b=o.modifiers.new('Dpad edge','BEVEL');b.width=.6;b.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
for x,y,w,d in [(-61,-8.5,.45,2.3),(-61,-17.5,.45,2.3),(-56.5,-13,2.3,.45),(-65.5,-13,2.3,.45)]:box('Dpad direction mark',w,d,.04,.15,(x,y,15.24),ink,edge=0)
for name,x,y in [('A',69,8),('B',61,0),('X',61,16),('Y',53,8)]:
 cyl('Button socket '+name,3.55,.2,(x,y,13.1),seam);cyl('Button_'+name,3.05,1.5,(x,y,13.85),black);label(name+' print',name,(x,y,14.64),2.4)
for name,x in [('SELECT',-29),('HOME',0),('START',29)]:
 box('Button_'+name,28.6,6,.5,.65,(x,-39.7,13.1),black,edge=.18);label(name+' print',('⌂ ' if name=='HOME' else '')+name,(x,-39.7,13.4),1.7)
cyl('Button_POWER',3.15,.4,(60,-35,13.15),black);label('Power symbol','⏻',(60,-35,13.4),2.6);label('Power print','POWER',(70,-35,13.15),1.25)
box('Blue power LED',.85,1.7,.22,.25,(61,-44.5,12.98),blue,edge=.06)
box('Charge LED',.85,1.7,.22,.25,(66,-44.5,12.98),rubber,edge=.06)
label('MIC print','MIC',(47,-39.5,13.1),1.2);cyl('Microphone hole',.35,.05,(49,-37.7,13.12),seam)
# Physical sliders, shoulder buttons and side covers.
box('3D slider slot',.5,13,1.4,.2,(77.5,-35,1.2),seam,lid,edge=.1)
box('Slider_3D',1.6,3.8,2.9,.55,(78,-32,1.0),rubber,lid,edge=.3)
label('3D print','3D',(72.4,-36,-.12),1.6,lid,True);label('3D off print','OFF',(72.4,-27,-.12),1,lid,True)
box('Volume recess',.3,15,3,.1,(-77.8,17,7),seam,edge=.08)
box('Volume slider',.7,4,2,.15,(-78,18,7),black,edge=.15)
for x,name in [(-67,'L'),(67,'R')]:
 box('Button_'+name,19,8,5,2.5,(x,42,10),black,edge=.9);label(name+' shoulder print',name,(x,42,12.6),2)
box('SD card cover',.3,29,5,.1,(77.9,-16,6.2),black,edge=.1)
# Back sockets on the vertical rear wall.
for name,x,w,h in [('Cartridge slot',8,37,3.2),('Charging socket',-39,8,3.4),('IR port',48,10,3),('Stylus socket',65,5,3)]:
 o=box(name,w,h,.25,min(1,h/3),(x,46.53,6.2),seam,edge=.08);o.rotation_euler[0]=math.pi/2
for x in [-46,-32]:
 o=box('Charging contact',1.5,2.5,.18,.2,(x,46.7,6.4),chrome,edge=.08);o.rotation_euler[0]=math.pi/2
cyl('Headphone jack rim',2.1,.3,(-60,-46.35,6),chrome,base,'Y');cyl('Headphone jack opening',1.55,.4,(-60,-46.55,6),seam,base,'Y')
# Bottom battery plate, screw wells, subtle case markings.
box('Battery cover',151,77,.25,9,(0,-6,-.04),silver,edge=.1)
for x,y in [(-65,-34),(65,-34),(-65,31),(65,31),(-39,31),(39,31)]:
 cyl('Screw well',1.5,.1,(x,y,-.21),seam);cyl('Screw head',.98,.15,(x,y,-.26),chrome)
 o=box('Screw drive',1.35,.24,.04,.05,(x,y,-.35),seam,edge=0)
label('Bottom branding','NINTENDO 3DS XL',(0,7,-.21),5,base,True,m=black)
label('Bottom model marking','MODEL No. SPR-001(EUR)     RATING: 4.6V',(0,-10,-.21),1.5,base,True,m=black)
label('Bottom compliance','Nintendo     CE     MADE IN CHINA',(0,-17,-.21),2.2,base,True,m=black)
box('Serial sticker',39,6,.05,1,(0,-29,-.22),ink,edge=0)
label('Serial number','SPR  3DS XL',(0,-29,-.27),2,base,True,m=black)
# Individual shallow scuffs catch glancing light without exaggerated damage.
random.seed(19)
scuff=mat('Hairline silver scuff',(.39,.42,.46),.62,.46)
for i in range(70):
 x=random.uniform(-68,68);y=random.uniform(-74,-9)
 o=box('Hairline wear',random.uniform(.3,3.5),random.uniform(.009,.024),.006,.004,(x,y,6.503),scuff,lid,edge=0);o.rotation_euler[2]=random.uniform(-.8,.8)
root['closed_dimensions_mm']=[156,93,22];root['upper_screen_mm']=[tw,th];root['lower_screen_mm']=[bw,bh]
lid.rotation_euler[0]=math.radians(-155)
print(json.dumps({'objects':len(scene.objects),'upper_mm':[tw,th],'lower_mm':[bw,bh]}))
