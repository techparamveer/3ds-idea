"""Reversible photo-constrained socket interior; dimensions are estimates."""
from pathlib import Path
import math
import json
import numpy as np
import bpy
import render_sourced_dimensions as render

CENTER=(-59.50925,6.3141)


def material(name,color,metallic,roughness):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    mat.use_backface_culling=True
    mat['console_material_role']='audio-contact-metal' if metallic else 'audio-housing'
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Metallic'].default_value=metallic
    bsdf.inputs['Roughness'].default_value=roughness
    return mat


def shell(name, profile, mat, start=0,end=2*math.pi,segments=96,closed_profile=False):
    # Profile coordinates are (radius, native Y). Circular section lies in X/Z.
    p=[];uv=[];faces=[]
    for j,(radius,y) in enumerate(profile):
        for i in range(segments+1):
            a=start+(end-start)*i/segments
            p.append((CENTER[0]+radius*math.cos(a),y,CENTER[1]+radius*math.sin(a)))
            uv.append((i/segments,j/(len(profile)-1)))
    for j in range(len(profile)-1):
        for i in range(segments):
            a=j*(segments+1)+i;b=a+segments+1
            faces.extend([(a,b,b+1),(a,b+1,a+1)])
    if closed_profile:
        for i in range(segments):
            a=(len(profile)-1)*(segments+1)+i;b=i
            faces.extend([(a,b,b+1),(a,b+1,a+1)])
        for i in [0,segments]:
            q=[j*(segments+1)+i for j in range(len(profile))]
            faces.extend([(q[0],q[1],q[2]),(q[0],q[2],q[3])] if i==segments else [(q[0],q[2],q[1]),(q[0],q[3],q[2])])
    from mathutils import Vector
    faces=[tuple(reversed(f)) for f in faces if (Vector(p[f[1]])-Vector(p[f[0]])).cross(Vector(p[f[2]])-Vector(p[f[0]])).length>1e-9]
    if closed_profile:
        origin=Vector(p[0])
        volume=sum((Vector(p[a])-origin).dot((Vector(p[b])-origin).cross(Vector(p[c])-origin)) for a,b,c in faces)/6
        if volume<0:faces=[tuple(reversed(f)) for f in faces]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(p,[],faces);mesh.update()
    layer=mesh.uv_layers.new(name='UVMap')
    for loop in mesh.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
    for polygon in mesh.polygons:polygon.use_smooth=True
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    obj.parent=bpy.data.objects['Base'];mesh.materials.append(mat)
    return obj


def leaf(mat):
    p=[];faces=[]
    # A bowed contact, set inside the mouth instead of pasted across its front.
    for j in range(25):
        t=j/24;z=-1.05+2.1*t
        x=.38+.13*math.cos(2*math.pi*t)
        y=-43.45+.75*(2*t-1)**2
        for dx,dy in [(-.17,0),(.17,0),(.17,.075),(-.17,.075)]:
            p.append((CENTER[0]+x+dx,y+dy,CENTER[1]+z))
    for j in range(24):
        for k in range(4):
            a=j*4+k;b=j*4+(k+1)%4
            faces.extend([(a,b,b+4),(a,b+4,a+4)])
    faces.extend([(0,2,1),(0,3,2),(96,97,98),(96,98,99)])
    mesh=bpy.data.meshes.new('Audio leaf contact trial');mesh.from_pydata(p,[],faces);mesh.update()
    obj=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(obj)
    obj.parent=bpy.data.objects['Base'];mesh.materials.append(mat)
    for poly in mesh.polygons:poly.use_smooth=True
    return obj


def prepare_frames(obj):
    """Carry Blender's smooth corner normals with valid per-triangle UV frames.

    These new untextured PBR parts use local planar UVs, not a photographed atlas.
    Native UV V is flipped by glTF, so the exported bitangent sign is derived
    explicitly in the glTF coordinate/UV convention.
    """
    old=obj.data;positions=[];normals=[];tangents=[];uvs=[];signs=[]
    for poly in old.polygons:
        assert len(poly.vertices)==3
        p=np.array([old.vertices[i].co[:] for i in poly.vertices],float)
        e1,e2=p[1]-p[0],p[2]-p[0]
        tangent=e1/np.linalg.norm(e1)
        face=np.cross(e1,e2);assert np.linalg.norm(face)>1e-9
        face/=np.linalg.norm(face);bitangent=np.cross(face,tangent)
        uv=[(0,0),(np.linalg.norm(e1),0),(np.dot(e2,tangent),np.dot(e2,bitangent))]
        for j,loop in enumerate(poly.loop_indices):
            n=np.array(old.corner_normals[loop].vector[:],float);n/=np.linalg.norm(n)
            t=tangent-n*np.dot(n,tangent);t/=np.linalg.norm(t)
            positions.append(p[j]);normals.append(n);tangents.append(t);uvs.append(uv[j])
            signs.append(-float(np.sign(np.dot(np.cross(n,t),bitangent))))
    positions=np.array(positions);normals=np.array(normals);tangents=np.array(tangents)
    mesh=bpy.data.meshes.new(obj.name+' export frames')
    mesh.from_pydata(positions.tolist(),[],np.arange(len(positions)).reshape(-1,3).tolist());mesh.update()
    for poly in mesh.polygons:poly.use_smooth=True
    mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',np.array(uvs,np.float32).ravel())
    mesh.normals_split_custom_set_from_vertices(normals.tolist())
    for name,data in [('_FRAME_N',normals[:,[0,2,1]].copy()),('_FRAME_T',tangents[:,[0,2,1]].copy()),('_FRAME_W',np.array(signs))]:
        vector=data.ndim==2
        if vector:data[:,2]*=-1
        attribute=mesh.attributes.new(name,'FLOAT_VECTOR' if vector else 'FLOAT','POINT')
        attribute.data.foreach_set('vector' if vector else 'value',data.astype(np.float32).ravel())
    for mat in old.materials:mesh.materials.append(mat)
    obj.data=mesh;bpy.data.meshes.remove(old)


def main(persist=False,preview=True):
    assert Path(bpy.data.filepath).name=='silver-audio-finish.blend'
    objects=[];materials=[];views=render.VIEWS;keep=False
    try:
        plastic=material('Audio internal housing',(.012,.014,.016),0,.5)
        metal=material('Audio estimated plated contacts',(.48,.37,.19),1,.3)
        materials.extend([plastic,metal])
        objects.append(shell('Audio_Bore_Housing',[(2.013,-44.30),(1.79,-44.05),(1.79,-37.6),(0,-37.6)],plastic))
        objects.append(shell('Audio_Contact_Arc',[(1.76,-43.2),(1.24,-43.65),(1.20,-43.57),(1.72,-43.12)],metal,math.radians(155),math.radians(205),32,True))
        objects.append(leaf(metal));objects[-1].name='Audio_Contact_Leaf'
        for obj in objects:prepare_frames(obj)
        report={
            'status':'photograph-constrained estimate, not factory dimensions',
            'reference':'https://commons.wikimedia.org/wiki/File:3DS_XL_and_New_3DS_XL_-_front.jpg',
            'bore_diameter_mm':3.58,'housing_depth_mm':6.7,'leaf_thickness_mm':.075,
            'objects':[{ 'name':o.name,'triangles':len(o.data.polygons),
                'bounds_mm':[[min(v.co[i] for v in o.data.vertices),max(v.co[i] for v in o.data.vertices)] for i in range(3)]} for o in objects]}
        render.VIEWS=[('front',0,(-59.5,-160,6.3),(-59.5,-45,6.3),18,0),
                      ('under',0,(-90,-130,-55),(-59.5,-44,5.7),22,0),
                      ('photo-angle',0,(-70,-180,-25),(-59.5,-44,6.3),18,0)]
        if preview:render.main('audio-contacts-trial',resolution=(1000,750))
        folder=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
        (folder/'audio-contacts-study.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
        if persist:
            import texture_sourced_model as exporter
            import curve_sourced_shell as frames
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
            root['audio_interior_estimate']=json.dumps(report)
            root['source_changes']+=' Added a photograph-constrained audio housing and two visible contact surfaces; dimensions and alloy are estimates.'
            render.VIEWS=views;render.main('audio-contacts-final',resolution=(1000,750))
            bpy.ops.wm.save_as_mainfile(filepath=str(folder/'silver-audio-contacts.blend'));keep=True
            exporter.export_static(root,hinge,folder/'silver-audio-contacts.glb',restore_frames=False,export_attributes=True)
            frames.restore_export_frames(folder/'silver-audio-contacts.glb')
    finally:
        render.VIEWS=views
        if not keep:
            for obj in objects:
                mesh=obj.data;bpy.data.objects.remove(obj,do_unlink=True);bpy.data.meshes.remove(mesh)
            for mat in materials:bpy.data.materials.remove(mat)

if __name__=='__main__':main()
