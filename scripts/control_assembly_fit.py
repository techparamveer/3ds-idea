"""Repair complete control assemblies after the photographic placement pass.

Run through Blender MCP in the native millimetre scene. Idempotent after the
first socket cut. The strip colour is a photographic estimate; see the audit.
"""
import bpy, bmesh

base = bpy.data.objects['Base']
deck = bpy.data.objects['Black control deck']
for letter in 'ABXY':
    cap = bpy.data.objects['Button_' + letter]
    socket = bpy.data.objects['Button socket ' + letter]
    socket.location.x, socket.location.y = cap.location.x, cap.location.y
    socket.dimensions = (7.95, 7.95, .9)
    socket.location.z = 12.53
    if not deck.get('aligned_button_sockets'):
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=4.025, depth=2,
            location=(cap.location.x, cap.location.y, 12.8))
        cutter = bpy.context.object
        cutter.parent = base
        bpy.context.view_layer.update()
        mod = deck.modifiers.new('Aligned ' + letter + ' socket', 'BOOLEAN')
        mod.operation = 'DIFFERENCE'; mod.solver = 'EXACT'; mod.object = cutter
        bpy.context.view_layer.objects.active = deck
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
deck['aligned_button_sockets'] = True

# The original cross was created from a clockwise outline with an inward top.
# Keep the reference-derived plan dimensions, and correct its surface normals.
dpad = bpy.data.objects['Button_Dpad']
bm = bmesh.new(); bm.from_mesh(dpad.data)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(dpad.data); bm.free(); dpad.data.update()

# The three membrane keys are visibly lighter than the surrounding black deck
# in Nintendo's original front photograph. They are not the same ABS finish.
mat = bpy.data.materials.get('Charcoal membrane control strip')
if not mat:
    mat = bpy.data.materials.new('Charcoal membrane control strip')
mat.use_nodes = True
p = mat.node_tree.nodes.get('Principled BSDF')
p.inputs['Base Color'].default_value = (.022, .025, .027, 1)
p.inputs['Metallic'].default_value = 0
p.inputs['Roughness'].default_value = .53
mat.diffuse_color = (.022, .025, .027, 1)
ink = bpy.data.materials['Dark molded hardware legends']
ink.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (.004, .005, .006, 1)
ink.diffuse_color = (.004, .005, .006, 1)
for key in ['SELECT', 'HOME', 'START']:
    cap = bpy.data.objects['Button_' + key]
    cap.dimensions.x = 29.2 if key == 'HOME' else 25.2
    cap.location.x = {'SELECT': -27.3, 'HOME': 0, 'START': 27.3}[key]
    if key != 'HOME':
        bpy.data.objects[key + ' print'].location.x = cap.location.x
    cap.data.materials.clear(); cap.data.materials.append(mat)

for name in ['SELECT print', 'HOME print', 'START print', 'Home icon']:
    obj = bpy.data.objects[name]
    obj['assembly'] = 'Button_' + ('HOME' if name == 'Home icon' else name.split()[0])

bpy.context.view_layer.update()
print('Aligned and recessed ABXY sockets, corrected D-pad normals, and separated the membrane key finish.')
