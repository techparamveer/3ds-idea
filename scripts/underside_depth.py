"""Recess the six screws and separate underside sticker/print layers."""
import bpy,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
base=bpy.data.objects['Base'];cover=bpy.data.objects['Battery cover']
dark=bpy.data.materials['Recess shadow'];metal=bpy.data.materials['Lens rim']
bpy.context.view_layer.update();tree=BVHTree.FromObject(cover,bpy.context.evaluated_depsgraph_get())
def bottom_z(x,y):
    hit=tree.ray_cast(Vector((x,y+6.5,-20)),Vector((0,0,1)))
    return hit[0].z+6.5 if hit[0] else .4
def cylinder(name,r,depth,loc,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc)
    o=bpy.context.object;o.name=name;o.parent=base;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    return o
for o in list(base.children):
    if o.name.startswith('Screw '):bpy.data.objects.remove(o,do_unlink=True)
for i,(x,y) in enumerate([(-65,-34),(65,-34),(-65,31),(65,31),(-39,31),(39,31)]):
    z=bottom_z(x,y)
    cutter=cylinder('Screw cutter',1.45,3,(x,y,z+.35),dark)
    bpy.context.view_layer.update();mod=cover.modifiers.new('Recessed fastener','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.context.view_layer.objects.active=cover;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
    cylinder(f'Screw well {i}',1.43,.10,(x,y,z+1.30),dark)
    cylinder(f'Screw head {i}',.96,.18,(x,y,z+.50),metal)
    for rotation in [0,math.pi/2]:
        bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+.401));o=bpy.context.object;o.name=f'Screw drive {i}';o.parent=base;o.scale=(1.30,.20,.014);o.rotation_euler.z=rotation;o.data.materials.append(dark)
# Recover distinct visible layers after the earlier surface projection flattened
# both sides. The plane follows the crown; the text sits 0.025 mm farther out.
for name,offset in [('Serial sticker',.030),('Serial number',.055)]:
    o=bpy.data.objects[name];matrix=o.matrix_local.copy();inverse=matrix.inverted()
    for v in o.data.vertices:
        p=matrix@v.co;p.z=bottom_z(p.x,p.y)-offset;v.co=inverse@p
print('Rebuilt screw wells and separated serial sticker/text depth.')
