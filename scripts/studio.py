import bpy, math
from mathutils import Vector
ROOT='/Volumes/DeveloperStorage/GitHub/3ds-idea'
s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True
s.render.resolution_x=1400;s.render.resolution_y=1200;s.render.resolution_percentage=75
s.world.color=(.2,.2,.2)
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.24,.26,.29,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.5
s.view_settings.view_transform='AgX'
def area(name,loc,power,size,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
 o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,35))-o.location).to_track_quat('-Z','Y').to_euler()
area('Key softbox',(-140,-90,240),850000,190,(.91,.95,1))
area('Rim softbox',(130,90,190),1000000,150,(1,.95,.88))
area('Front fill',(30,-200,65),350000,130,(.87,.93,1))
m=bpy.data.materials.new('Studio warm white');m.diffuse_color=(.73,.72,.70,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.73,.72,.70,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.78
bpy.ops.mesh.primitive_plane_add(size=20000,location=(0,0,-1));o=bpy.context.object;o.name='Studio floor';o.data.materials.append(m)
d=bpy.data.cameras.new('Product camera');o=bpy.data.objects.new('Product camera',d);s.collection.objects.link(o);o.location=(175,-255,230);o.rotation_euler=(Vector((0,13,43))-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=238;d.clip_end=10000;s.camera=o
s.render.filepath=ROOT+'/renders/open-v1.png'
for a in bpy.context.screen.areas:
 if a.type=='VIEW_3D':
  a.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/model/silver-3ds-xl.blend')
bpy.ops.render.render(write_still=True)
