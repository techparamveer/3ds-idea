"""Export the currently saved project model; geometry is never regenerated here.
Run in Blender after opening model/silver-3ds-xl.blend, or via Blender MCP.
"""
import bpy, math, json, io, contextlib
from pathlib import Path
from mathutils import Vector
if not bpy.data.filepath: raise RuntimeError('Open the saved silver-3ds-xl.blend first.')
ROOT=Path(bpy.data.filepath).resolve().parents[1]
root=bpy.data.objects['3DS_XL'];lid=bpy.data.objects['Hinge']
angle=lid.rotation_euler[0];scale=root.scale.copy()
root.scale=(1,)*3;lid.rotation_euler[0]=0
for o in list(root.children_recursive):
 if o.type in ['FONT','CURVE']:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 if o.type=='MESH' and not o.data.uv_layers:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.cube_project(cube_size=120);bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();points=[]
for o in root.children_recursive:
 if o.type=='MESH':
  ev=o.evaluated_get(deps);mesh=ev.to_mesh();points.extend(ev.matrix_world@v.co for v in mesh.vertices);ev.to_mesh_clear()
bounds=[[min(v[i] for v in points),max(v[i] for v in points)] for i in range(3)]
dim=[b-a for a,b in bounds]
assert all(abs(a-b)<.02 for a,b in zip(dim,[156,93,22])), f'Unexpected dimensions: {dim}'
report=json.loads((ROOT/'model/dimensions.json').read_text());report['measured_closed_bounds_mm']=bounds;report['measured_closed_dimensions_mm']=dim
(ROOT/'model/dimensions.json').write_text(json.dumps(report,indent=2)+'\n')
lid.rotation_euler[0]=angle;bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model/silver-3ds-xl.blend'))
try:
 lid.rotation_euler[0]=0;root.scale=(.001,)*3;bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in root.children_recursive:o.select_set(True)
 with contextlib.redirect_stdout(io.StringIO()):
  bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/silver-3ds-xl.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
finally:
 root.scale=scale;lid.rotation_euler[0]=angle
print(f'Exported GLB in metres. Closed dimensions: {dim} mm.')
