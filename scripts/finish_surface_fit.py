"""Fix fit defects identified in the first textured inspection renders."""
import bpy,math
base=bpy.data.objects['Base'];black=bpy.data.materials['Graphite ABS']
for name in ['SELECT','HOME','START']:
    o=bpy.data.objects['Button_'+name];o.scale.x*=26.8/o.dimensions.x
# This label extends closest to the underside crown. Retain the nominal envelope.
o=bpy.data.objects['Bottom model marking']
low=min((o.matrix_local@v.co).z for v in o.data.vertices)
if low<0:o.location.z-=low
# Replace the old solid cylinder that covered the drilled headphone aperture.
old=bpy.data.objects['Headphone jack rim'];bpy.data.objects.remove(old,do_unlink=True)
vs=[];fs=[];N=64
for r,y in [(2.05,-46.49),(1.75,-46.49),(1.66,-45.3)]:
    for i in range(N):a=i*math.tau/N;vs.append((-60+r*math.cos(a),y,6+r*math.sin(a)))
for k in range(2):
    for i in range(N):j=(i+1)%N;fs.append((k*N+i,k*N+j,(k+1)*N+j,(k+1)*N+i))
mesh=bpy.data.meshes.new('Hollow audio socket');mesh.from_pydata(vs,[],fs);mesh.update();mesh.materials.append(black)
o=bpy.data.objects.new('Headphone jack rim',mesh);bpy.context.scene.collection.objects.link(o);o.parent=base
for p in mesh.polygons:p.use_smooth=True
print('Removed key-strip intersections, restored exact envelope and opened the audio ring.')
