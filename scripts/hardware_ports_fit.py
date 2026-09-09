"""Correct original XL connector handedness and the underside side access.

Nintendo UK manual p22 establishes the arrangement. Local dimensions of the
cutouts are photo estimates. Rebuild the chassis to remove obsolete apertures,
while preserving the separate curved battery cover and all main controls.
"""
import bpy, math
from pathlib import Path
ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
base = bpy.data.objects['Base']; cover = bpy.data.objects['Battery cover']
black = bpy.data.materials['Graphite ABS']; dark = bpy.data.materials['Recess shadow']
chrome = bpy.data.materials['Lens rim']; gold = bpy.data.materials['Charging contacts gold']
source = (ROOT/'scripts/refine_model.py').read_text()
exec(source[source.index('def profile'):source.index('base=bpy.data.objects')])

def difference(body, cutter, name):
    bpy.context.view_layer.update()
    mod = body.modifiers.new(name, 'BOOLEAN')
    mod.operation = 'DIFFERENCE'; mod.solver = 'EXACT'; mod.object = cutter
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

def remove(name):
    obj = bpy.data.objects.get(name)
    if obj: bpy.data.objects.remove(obj, do_unlink=True)

def cylinder(name, radius, depth, location, mat, axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth, location=location)
    obj = bpy.context.object; obj.name = name; obj.parent = base
    obj.data.materials.append(mat)
    if axis == 'X': obj.rotation_euler.y = math.pi/2
    elif axis == 'Y': obj.rotation_euler.x = math.pi/2
    for face in obj.data.polygons: face.use_smooth = len(face.vertices) == 4
    return obj

body = profile('Lower graphite chassis',156,93,8,[7,7,12,12],(0,0,4),black,base,3.6)
cut = profile('Battery seat cutter',156.4,80.4,5.3,[3,3,12,12],(0,-6.8,1.35),black,base,.1)
difference(body,cut,'Curved cover seat')

# Original XL rear order from the player's coordinates: IR at left, card in
# the centre, charging socket at right. There is no rear stylus opening.
remove('Stylus socket'); remove('Stylus side socket')
for name, x, width, height, z in [
    ('IR port',-48,9,3,6.1), ('Cartridge slot',0,37,3.3,6.1),
    ('Charging socket',39,8,3.4,6.1)]:
    cut = profile('Rear port cutter',width,height,4,[min(height*.4,1)]*4,(x,46,z),black,base,.15)
    cut.rotation_euler.x = math.pi/2
    difference(body,cut,name+' aperture')
    inset = profile(name,width*.98,height*.97,.12,[min(height*.35,.9)]*4,(x,44.3,z),dark,base,.02)
    inset.rotation_euler.x = math.pi/2
for name, x in [('Game card lip',0),('Charge socket floor',39),
                 ('Charge connector pin L',37.7),('Charge connector pin R',40.3),
                 ('Charging contact',32),('Charging contact.001',46)]:
    bpy.data.objects[name].location.x = x

# Shoulder keys wrap around the back of the original housing. Previously they
# were thin blocks buried above the complete chassis, invisible from below.
for key, x in [('L',-67),('R',67)]:
    cut = profile('Shoulder clearance',21.4,10.2,14,[2.8]*4,(x,42.4,6.3),black,base,.8)
    difference(body,cut,'Shoulder clearance '+key)
    profile('Button_'+key,20.8,8.4,12.0,[2.8]*4,(x,42,6.25),black,base,1.25)

# Re-drill the audio socket into the clean chassis. All cutter faces carry a
# real material so Blender cannot export unassigned white aperture walls.
cut = cylinder('Audio cutter',1.8,4,(-60,-46,6),black,'Y')
difference(body,cut,'Audio aperture')
if not cover.get('audio_clearance_revision'):
    cut=cylinder('Cover audio cutter',1.9,5,(-60,-46.3,6),black,'Y')
    difference(cover,cut,'Audio clearance through curved cover')
    cover['audio_clearance_revision']=1

if not cover.get('side_access_revision'):
    # U-shaped underside relief for the horizontal right-side stylus holder.
    cut = profile('Stylus relief cutter',15,7.8,6.6,[2.6]*4,(76,2,1.1),black,base,1.4)
    difference(cover,cut,'Right stylus finger relief')
    # Leave the silver rolled perimeter around a separate black SD cover.
    cut = profile('SD relief cutter',7.7,30,4,[1.5]*4,(78,-19,5.4),black,base,.6)
    cut.rotation_euler.y = math.pi/2
    difference(cover,cut,'SD cover seat')
    cover['side_access_revision'] = 1
cut = profile('Stylus chassis cutter',15,7.8,6.6,[2.6]*4,(76,2,1.1),black,base,1.4)
difference(body,cut,'Right stylus holder')
# The holder is a hollow dark sleeve, open at the outer right edge.
remove('Stylus holder sleeve')
vertices=[]; faces=[]; count=64
for x, r in [(68,2.5),(77.6,2.5),(77.6,2.05),(68,2.05)]:
    for i in range(count):
        a=i*math.tau/count; vertices.append((x,2+r*math.sin(a),2.8+r*math.cos(a)))
for k in range(3):
    for i in range(count):
        j=(i+1)%count; faces.append((k*count+i,k*count+j,(k+1)*count+j,(k+1)*count+i))
mesh=bpy.data.meshes.new('Hollow horizontal stylus holder'); mesh.from_pydata(vertices,[],faces); mesh.update(); mesh.materials.append(black)
obj=bpy.data.objects.new('Stylus holder sleeve',mesh); bpy.context.scene.collection.objects.link(obj); obj.parent=base
for face in mesh.polygons: face.use_smooth=True
remove('Stylus holder depth'); cylinder('Stylus holder depth',2.06,.10,(68,2,2.8),dark,'X')

cap=profile('SD card cover',6.8,28,1.2,[1.3]*4,(77.3,-19,5.5),black,base,.5)
cap.rotation_euler.y=math.pi/2

# Two recessed rubber pads on the underside rear rail, visible in image5.
for x in [-26,26]:
    cut=cylinder('Rear pad cutter',2.2,.5,(x,38,.05),black)
    difference(body,cut,'Recessed rubber pad')
    remove('Rear rubber pad '+str(x))
    cylinder('Rear rubber pad '+str(x),2.1,.12,(x,38,.16),black)

# Older boolean passes introduced unassigned material slots. They appeared as
# white surfaces in otherwise black sockets; preserve each valid assignment.
for obj in bpy.data.objects['3DS_XL'].children_recursive:
    if obj.type!='MESH': continue
    slots=obj.data.materials
    missing=[i for i,m in enumerate(slots) if m is None]
    for face in obj.data.polygons:
        if face.material_index in missing: face.material_index=0
    for i in reversed(missing): slots.pop(index=i)
bpy.context.view_layer.update()
print('Corrected rear port handedness, side stylus/SD relief, shoulder wraps and unassigned aperture materials.')
