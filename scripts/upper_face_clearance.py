"""Seat the upper LCD behind the inner face and give closed controls clearance.

The former front panels were stacked outside a solid slab, intersecting the
D-pad when closed. Rebuild the aperture as a real recess inside the same22mm
envelope. Depths are fit estimates, not manufacturer section drawings.
"""
import bpy, math, bmesh
from pathlib import Path
ROOT=Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
lid=bpy.data.objects['Hinge']; black=bpy.data.materials['Graphite ABS']; dark=bpy.data.materials['Recess shadow']
source=(ROOT/'scripts/refine_model.py').read_text()
exec(source[source.index('def profile'):source.index('base=bpy.data.objects')])
face=profile('Inner lid graphite face',155.4,82.2,2.2,[1.2,1.2,10.5,10.5],(0,-46.1,1.05),black,lid,.65)
def cut_aperture(obj,width,height,radius=2):
    cut=profile('Upper display aperture cutter',width,height,5,[radius]*4,(0,-43.5,1),black,lid,.08)
    bpy.context.view_layer.update(); mod=obj.modifiers.new('Recessed LCD aperture','BOOLEAN')
    mod.operation='DIFFERENCE'; mod.solver='EXACT'; mod.object=cut
    bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cut,do_unlink=True)
cut_aperture(face,112.3,69.82)
bezel=profile('Upper screen recessed bezel',112.2,69.72,.32,[2]*4,(0,-43.5,.20),dark,lid,.09)
cut_aperture(bezel,106.22,63.74,.6)
# The perimeter seam is an edge band, not an opaque plate across the display.
seam=bpy.data.objects['Lid perimeter seam']; bm=bmesh.new(); bm.from_mesh(seam.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if len(f.verts)>20],context='FACES')
bm.to_mesh(seam.data); bm.free(); seam.data.update()
bpy.data.objects['Screen_Top'].location.z=.24
if not lid.get('inner_clearance_revision'):
    for obj in lid.children:
        if obj.name.startswith(('Inner camera','Lid rubber','Speaker perforation','Lid contact square','3D print','3D off print')):
            obj.location.z+=1.15
    lid['inner_clearance_revision']=1
lid['inner_face_closed_z_mm']=15.45
lid['top_display_surface_local_z_mm']=.145
bpy.context.view_layer.update()
print('Recessed upper LCD and restored0.25mm nominal clearance over the D-pad.')
