"""Rig the preserved Joshua P. model components without changing their UVs.

Execute through Blender MCP after opening the separate geometry-inspection.blend.
This initial candidate uses complete source geometry; its texture download is
incomplete. It is deliberately exported beside the candidate, never over the site.
"""
import bpy, math, json, importlib.util
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER=ROOT/'model/candidates/joshua-xl'
spec=importlib.util.spec_from_file_location('source_audit',ROOT/'scripts/analyze_sourced_rig.py')
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
raw,doc,binary=audit.load_glb(FOLDER/'geometry-inspection.glb')
report=json.loads((FOLDER/'component-report.json').read_text())
assert audit.hashlib.sha256(raw).hexdigest()==report['source_sha256']
scene=bpy.context.scene
old=[o for o in scene.objects if o.type in ['MESH','EMPTY']]
materials=[bpy.data.materials.get(m['name']) for m in doc['materials']]
assert all(materials)
convert=lambda v:Vector((float(v[0]),-float(v[2]),float(v[1])))
axis=convert(report['hinge_circle_candidate']['axis_point_raw'])
source_angle=math.radians(report['screen_pose']['inferred_open_angle_degrees'])
close=Matrix.Rotation(source_angle,3,'X')
assign=report['rig_assignment_candidates']
lid_ids=[set(assign['main_primitive_lid_components']),set(assign['image_primitive_lid_components']),set(assign['screen_primitive_lid_components'])]
control_names={v:k.replace('_shoulder_candidate','') for k,v in assign['main_primitive_controls'].items()}
pieces=[];closed_points=[]
for mid,mesh in enumerate(doc['meshes']):
 prim=mesh['primitives'][0]
 positions=audit.accessor(doc,binary,prim['attributes']['POSITION'])
 normals=audit.accessor(doc,binary,prim['attributes']['NORMAL'])
 uvs=audit.accessor(doc,binary,prim['attributes']['TEXCOORD_0'])
 triangles=audit.accessor(doc,binary,prim['indices']).reshape(-1,3)
 for part in report['meshes'][mid]['components']:
  is_lid=part['id'] in lid_ids[mid]
  indices=part['vertex_indices'];mapping={v:i for i,v in enumerate(indices)}
  points=[convert(positions[i]) for i in indices]
  ns=[convert(normals[i]) for i in indices]
  if is_lid:points=[axis+close@(v-axis) for v in points];ns=[close@n for n in ns]
  closed_points.extend(points)
  pieces.append({'mid':mid,'id':part['id'],'lid':is_lid,'points':points,'normals':ns,'uvs':[tuple(map(float,uvs[i])) for i in indices],'faces':[tuple(mapping[int(v)] for v in triangles[t]) for t in part['triangle_indices']]})
low=Vector(tuple(min(p[a] for p in closed_points) for a in range(3)));high=Vector(tuple(max(p[a] for p in closed_points) for a in range(3)))
factor=156/(high.x-low.x);offset=Vector((-(low.x+high.x)/2,-(low.y+high.y)/2,-low.z))
transform=lambda p:(p+offset)*factor

def empty(name,parent=None,location=(0,0,0)):
 o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=parent;o.location=location;return o
root=empty('3DS_XL');base=empty('Base',root);hinge=empty('Hinge',root,transform(axis))
root['source_author']='Joshua P. (@Pansdaz)';root['source_url']='https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc';root['source_license']='https://creativecommons.org/licenses/by/4.0/'
root['source_changes']='Separated rigid components, removed presentation transform, fitted mechanical hinge, normalized width. Geometry-only candidate; textures pending.'
root['texture_download_complete']=False;root['source_uniform_scale_to_mm']=factor
hinge['range_degrees']=[0,155];hinge['source_open_degrees']=math.degrees(source_angle);hinge['axis_fit_rms_source_units']=report['hinge_circle_candidate']['radial_rms_error']
for piece in pieces:
 mid=piece['mid'];cid=piece['id'];control=control_names.get(cid) if mid==0 else None
 name=f'Source_{mid}_part_{cid:02}'
 if control:name='Button_'+control
 elif mid==0 and cid==0:name='Sourced graphite chassis'
 elif mid==0 and cid==1:name='Sourced inner lid'
 elif mid==0 and cid==3:name='Sourced outer lid'
 elif mid==2 and cid==4:name='Screen_Top'
 elif mid==2 and cid==3:name='Screen_Bottom'
 parent=hinge if piece['lid'] else base
 points=[transform(p) for p in piece['points']]
 origin=hinge.location.copy() if piece['lid'] else Vector((0,0,0))
 if control:origin=sum(points,Vector())/len(points)
 me=bpy.data.meshes.new(name);me.from_pydata([p-origin for p in points],[],piece['faces']);me.update();me.materials.append(materials[mid])
 for face in me.polygons:face.use_smooth=True
 uv=me.uv_layers.new(name='SourceUV')
 for loop in me.loops:uv.data[loop.index].uv=piece['uvs'][loop.vertex_index]
 me.normals_split_custom_set_from_vertices([tuple(n) for n in piece['normals']])
 ob=bpy.data.objects.new(name,me);scene.collection.objects.link(ob);ob.parent=parent;ob.location=origin-(hinge.location if piece['lid'] else Vector())
 ob['source_mesh_index']=mid;ob['source_component_id']=cid
 if control:ob['press_travel_mm']=.25
for o in old:bpy.data.objects.remove(o,do_unlink=True)
limit=hinge.constraints.new('LIMIT_ROTATION');limit.use_limit_x=True;limit.min_x=-math.radians(155);limit.max_x=0;limit.owner_space='LOCAL'
scene.render.fps=30;scene.frame_start=1;scene.frame_end=85
for frame,angle in [(1,0),(22,0),(85,-math.radians(155))]:
 hinge.rotation_euler.x=angle;hinge.keyframe_insert(data_path='rotation_euler',frame=frame,group='Mechanical hinge')
for frame,angle in [(1,.52),(30,-.62),(85,-.16)]:
 root.rotation_euler.z=angle;root.keyframe_insert(data_path='rotation_euler',frame=frame,group='Presentation turn')
# Keep the inspection camera in physical millimetres after normalizing geometry.
for ob in scene.objects:
 if ob.type in ['CAMERA','LIGHT']:ob.location*=factor
scene.camera.data.ortho_scale*=factor
scene.frame_set(85);root.rotation_euler.z=0
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=.001
bounds=(high-low)*factor
result={'source':'Joshua P. original XL','sourceGeometryComplete':True,'sourceTexturesComplete':False,'uniform_scale_to_mm':factor,'closed_dimensions_mm':list(bounds),'hinge_native_mm':list(hinge.location),'hinge_range_degrees':[0,155],'parts':len(pieces),'control_names':sorted('Button_'+v for v in control_names.values()),'screen_surface_sizes_mm':{o.name:list(o.dimensions) for o in root.children_recursive if o.name.startswith('Screen_')}}
(FOLDER/'rig-report.json').write_text(json.dumps(result,indent=2)+'\n')
bpy.context.view_layer.update();bpy.data.libraries.write(str(FOLDER/'rigged-geometry.blend'),{scene})
# Export a separate mechanical candidate in metres for inspection only.
bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children_recursive:o.select_set(True)
angle=hinge.rotation_euler.x
saved_actions=[(o,o.animation_data.action) for o in (root,hinge)]
for o,_action in saved_actions:o.animation_data.action=None
hinge.rotation_euler.x=0;root.rotation_euler=(0,0,0);root.scale=(.001,)*3;bpy.context.view_layer.update()
try:
 with bpy.context.temp_override(active_object=root,object=root):
  bpy.ops.export_scene.gltf(filepath=str(FOLDER/'rigged-geometry.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_current_frame=True,export_cameras=False,export_lights=False)
finally:
 root.scale=(1,)*3;hinge.rotation_euler.x=angle
 for o,action in saved_actions:o.animation_data.action=action
 scene.frame_set(85)
print(json.dumps(result))
