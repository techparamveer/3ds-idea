"""Reconstruct the outer shell profiles. Execute once against the pre-curvature checkpoint.

Millimetres. Curvature is photo-matched, not claimed to be manufacturer CAD.
The exterior is sampled across its broad face, not capped with a planar n-gon.
"""
import bpy, math, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path

ROOT=Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
base=bpy.data.objects['Base']; lid=bpy.data.objects['Hinge']; root=bpy.data.objects['3DS_XL']
silver=bpy.data.materials['Satin silver metallic paint']; black=bpy.data.materials['Graphite ABS']; seam=bpy.data.materials['Recess shadow']
source=(ROOT/'scripts/refine_model.py').read_text()
exec(source[source.index('def profile'):source.index('base=bpy.data.objects')])

def outline(w,d,radii,inset=0):
    out=[]; W=w-2*inset; D=d-2*inset
    for k,start in enumerate([0,90,180,270]):
        r=max(.1,radii[k]-inset)
        cx=(W/2-r)*(1 if k in [0,3] else -1)
        cy=(D/2-r)*(1 if k in [0,1] else -1)
        for i in range(25):
            a=math.radians(start+90*i/24)
            out.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    return out

def crown(name,w,d,radii,loc,parent,flip=False):
    old=bpy.data.objects.get(name)
    if old:bpy.data.objects.remove(old,do_unlink=True)
    # Broad molded shoulder spreads the highlight over ~8 mm, then a shallow crown.
    rings=[(0,1.30),(.08,2.10),(.35,2.90),(.90,3.70),(1.80,4.40),(3.20,5.05),(5.10,5.50),(8,5.80)]
    verts=[];N=100
    def append(points,z):
        verts.extend((x,y,(-z if flip else z)) for x,y in points)
    # Inner return closes the shell wall without creating a second visible rolled rim.
    append(outline(w,d,radii,.35),.85)
    for inset,z in rings:append(outline(w,d,radii,inset),z)
    inside=outline(w,d,radii,8)
    for t in [.88,.76,.64,.52,.40,.28,.16,.06]:
        append([(x*t,y*t) for x,y in inside],6.5-.7*t*t)
    faces=[tuple(reversed(range(N)))]
    for k in range(len(verts)//N-1):
        for i in range(N):j=(i+1)%N;faces.append((k*N+i,k*N+j,(k+1)*N+j,(k+1)*N+i))
    center=len(verts);verts.append((0,0,-6.5 if flip else 6.5));last=center-N
    for i in range(N):faces.append((last+i,last+(i+1)%N,center))
    if flip:faces=[tuple(reversed(f)) for f in faces]
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);o.parent=parent;o.location=loc;me.materials.append(silver)
    for p in me.polygons:p.use_smooth=True
    me.polygons[0].use_smooth=False
    o['profile_revision']='broad shoulder and sampled crown 2026-09-09'
    return o

angle=lid.rotation_euler.x;lid.rotation_euler.x=0
outer=crown('Silver outer lid',156,82.5,[2.6,2.6,12.6,12.6],(0,-46.1,0),lid)
# Keep the dark seam beneath the silver shoulder instead of overlapping its crown.
profile('Lid perimeter seam',155.7,82.25,1.65,[2.4,2.4,12.2,12.2],(0,-46.1,.20),seam,lid,.35)
bpy.context.view_layer.update()
tree=BVHTree.FromObject(outer,bpy.context.evaluated_depsgraph_get())
def outer_z(x,y):
    hit=tree.ray_cast(Vector((x,y+46.1,20)),Vector((0,0,-1)))
    return hit[0].z if hit[0] else 6.5

# Re-seat every lens ring vertex on the curved surface, preserving socket depth.
for o in list(lid.children):
    if o.name.startswith('Outer camera') and o.type=='MESH':
        mat=o.matrix_local.copy(); inverse=mat.inverted()
        for v in o.data.vertices:
            p=mat@v.co;p.z+=outer_z(p.x,p.y)-6.5;v.co=inverse@p
for x in [-18,18]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=2.64,depth=8,location=(x,-80.9,5))
    cut=bpy.context.object;cut.parent=lid;bpy.context.view_layer.update()
    mod=outer.modifiers.new('Recessed optical socket','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
    bpy.context.view_layer.objects.active=outer;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)

# The underside is a separate curved silver cover. Cut its seat out of the
# black body so a coincident black bottom face cannot hide the silver surface.
body=bpy.data.objects['Lower graphite chassis']
cut=profile('Battery cover cavity',156.4,80.4,5.3,[3,3,12,12],(0,-6.8,1.35),black,base,.1)
bpy.context.view_layer.update();mod=body.modifiers.new('Battery cover seat','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
cover=crown('Battery cover',155.7,79.7,[3.2,3.2,12.2,12.2],(0,-6.5,6.5),base,True)
# The lower outer face ranges from z=0 at its crown to z=5.2 on its side.
bpy.context.view_layer.update();cover_tree=BVHTree.FromObject(cover,bpy.context.evaluated_depsgraph_get())
def bottom_z(x,y):
    hit=cover_tree.ray_cast(Vector((x,y+6.5,-20)),Vector((0,0,1)))
    return hit[0].z+6.5 if hit[0] else .4
for o in list(base.children):
    if o.type=='MESH' and o.name.startswith(('Bottom ','Serial ','Screw ')):
        mat=o.matrix_local.copy();inverse=mat.inverted()
        # Previous markings were embedded/hidden at ~0.2 mm; project onto cover.
        for v in o.data.vertices:
            p=mat@v.co;p.z=bottom_z(p.x,p.y)-.012;v.co=inverse@p

for name,size in [('Screen_Top',(106.2,63.72)),('Screen_Bottom',(84.96,63.72))]:
    o=bpy.data.objects[name];o.scale.x*=size[0]/o.dimensions.x;o.scale.y*=size[1]/o.dimensions.y
root['upper_screen_mm']=[106.2,63.72];root['lower_screen_mm']=[84.96,63.72]
report=json.loads((ROOT/'model/dimensions.json').read_text());report['top_panel_mm']=[106.2,63.72];report['bottom_panel_mm']=[84.96,63.72]
report['screen_source']='https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html'
(ROOT/'model/dimensions.json').write_text(json.dumps(report,indent=2)+'\n')
lid.rotation_euler.x=angle;bpy.context.view_layer.update()
print('Rebuilt curved silver lid and underside, corrected cover/chassis overlap and active LCD sizes.')
