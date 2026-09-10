"""Transfer the inspected EUR ink plate through the source mesh's actual UVs.

Run through Blender MCP from silver-grain.blend after create_eur_ink_plate.py.
An isolated UV-space mesh carries native underside millimetres into the shader.
This avoids an approximate global atlas transform. Production mesh data, rig,
control geometry, and every other material remain unchanged.
"""
import bpy
import importlib.util
import json
import hashlib
import uuid
from pathlib import Path

ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER = ROOT/'model/candidates/joshua-xl'
DERIVED = FOLDER/'derived-textures'
CENTER_X = -.21038844
PAPER = {'center':[0,-30], 'outer':[42.2,8.2,1.1], 'inner':[41.6,7.6,.9]}
CLEAR_ART = [(-28,28,14,21.5),(-44,44,-10.5,9.5),(-11.5,11.5,-19.5,-12)]
CLEAR_OLD_STICKER = (-23.5,23.5,-34.8,-21.5)


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name,ROOT/'scripts'/filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def render_atlases(body, source):
    prefix = 'EurAtlas_'+uuid.uuid4().hex[:8]
    scene = bpy.data.scenes.new(prefix)
    objects, meshes, materials, images = [], [], [], []
    camera_data = world = None
    paths = {}
    try:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 1
        scene.cycles.seed = 0
        scene.cycles.use_denoising = False
        scene.cycles.use_adaptive_sampling = False
        scene.cycles.max_bounces = 0
        scene.cycles.pixel_filter_type = 'BOX'
        scene.cycles.filter_width = .01
        scene.render.use_persistent_data = False
        scene.render.resolution_x = scene.render.resolution_y = 4096
        scene.render.resolution_percentage = 100
        scene.render.dither_intensity = 0
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_depth = '8'
        scene.render.image_settings.compression = 100
        scene.render.use_compositing = False
        scene.render.use_sequencer = False
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0
        scene.view_settings.gamma = 1
        scene.view_settings.use_curve_mapping = False
        world = bpy.data.worlds.new(prefix)
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
        scene.world = world

        def image(path, name):
            image = bpy.data.images.load(str(path),check_existing=False)
            image.name = prefix+name
            image.colorspace_settings.name = 'Non-Color'
            images.append(image)
            return image

        ink_image = image(DERIVED/'eur-ink-plate.png',' ink')
        mask_image = image(DERIVED/'paint-mask.png',' mask')
        base_image = next(n.image for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.name=='Sourced silver base colour')
        normal_image = next(n.image for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.name=='Paint grain Image_3')
        mr_image = next(n.image for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.name=='Paint grain Image_1')

        def material(name):
            mat = bpy.data.materials.new(prefix+name)
            mat.use_nodes = True
            materials.append(mat)
            mat.node_tree.nodes.clear()
            out = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
            emit = mat.node_tree.nodes.new('ShaderNodeEmission')
            mat.node_tree.links.new(emit.outputs[0],out.inputs['Surface'])
            return mat,emit

        background,bg_emission = material(' background')
        bg_image = background.node_tree.nodes.new('ShaderNodeTexImage')
        bg_image.interpolation = 'Closest'
        background.node_tree.links.new(bg_image.outputs['Color'],bg_emission.inputs['Color'])
        patch,patch_emission = material(' patch')
        nodes,links = patch.node_tree.nodes,patch.node_tree.links

        def connect(value,socket):
            if isinstance(value,(float,int)) and socket.type=='RGBA':socket.default_value=(value,value,value,1)
            elif isinstance(value,(float,int,list,tuple)):socket.default_value=value
            else:links.new(value,socket)

        def math(op,a,b=None):
            n=nodes.new('ShaderNodeMath');n.operation=op
            connect(a,n.inputs[0])
            if b is not None:connect(b,n.inputs[1])
            return n.outputs[0]

        def vector(op,a,b=None):
            n=nodes.new('ShaderNodeVectorMath');n.operation=op
            connect(a,n.inputs[0])
            if b is not None:connect(b,n.inputs['Scale'] if op=='SCALE' else n.inputs[1])
            return n.outputs[0]

        def mix(a,b,factor):
            n=nodes.new('ShaderNodeMixRGB');n.blend_type='MIX'
            for value,socket in zip([factor,a,b],n.inputs):connect(value,socket)
            return n.outputs[0]

        def combine(values):
            n=nodes.new('ShaderNodeCombineXYZ')
            for value,socket in zip(values,n.inputs):connect(value,socket)
            return n.outputs[0]

        def separate(value):
            n=nodes.new('ShaderNodeSeparateXYZ');connect(value,n.inputs[0]);return n.outputs

        def texture(image,uv,interpolation='Closest'):
            n=nodes.new('ShaderNodeTexImage');n.image=image;n.interpolation=interpolation;n.extension='CLIP'
            connect(uv,n.inputs['Vector']);return n.outputs['Color']

        uv = nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap'
        native = nodes.new('ShaderNodeUVMap');native.uv_map='NativeMM'
        X,Y,_ = separate(native.outputs['UV'])
        base = texture(base_image,uv.outputs['UV'])
        normal = texture(normal_image,uv.outputs['UV'])
        mr = texture(mr_image,uv.outputs['UV'])
        old_mask = texture(mask_image,uv.outputs['UV'])
        plate_uv = combine([math('ADD',math('DIVIDE',X,120),.5),math('ADD',math('DIVIDE',math('ADD',Y,8),67.5),.5),0.0])
        ink = texture(ink_image,plate_uv,'Linear')

        def rectangle(bounds):
            x0,x1,y0,y1=bounds
            return math('MULTIPLY',math('MULTIPLY',math('GREATER_THAN',X,x0),math('LESS_THAN',X,x1)),math('MULTIPLY',math('GREATER_THAN',Y,y0),math('LESS_THAN',Y,y1)))

        clear_art=0.0
        for bounds in CLEAR_ART:clear_art=math('MAXIMUM',clear_art,rectangle(bounds))
        clear_sticker=rectangle(CLEAR_OLD_STICKER)
        clear_finish=math('MAXIMUM',clear_art,clear_sticker)

        def rounded(spec):
            w,h,r=spec
            qx=math('SUBTRACT',math('ABSOLUTE',math('SUBTRACT',X,PAPER['center'][0])),w/2-r)
            qy=math('SUBTRACT',math('ABSOLUTE',math('SUBTRACT',Y,PAPER['center'][1])),h/2-r)
            distance=math('SUBTRACT',math('ADD',math('SQRT',math('ADD',math('MULTIPLY',math('MAXIMUM',qx,0),math('MAXIMUM',qx,0)),math('MULTIPLY',math('MAXIMUM',qy,0),math('MAXIMUM',qy,0)))),math('MINIMUM',math('MAXIMUM',qx,qy),0)),r)
            coverage=math('SUBTRACT',.5,math('DIVIDE',distance,.08))
            return math('MINIMUM',math('MAXIMUM',coverage,0),1)

        paper_outer,paper_inner=rounded(PAPER['outer']),rounded(PAPER['inner'])
        edit=math('MAXIMUM',clear_finish,math('MAXIMUM',paper_outer,ink))
        silver=(.30,.315,.33,1)
        color=mix(base,silver,clear_art)
        color=mix(color,(.02,.023,.022,1),paper_outer)
        color=mix(color,(.70,.72,.70,1),paper_inner)
        color=mix(color,(.014,.015,.015,1),ink)
        paint_mask=math('MULTIPLY',math('MULTIPLY',mix(old_mask,1.0,clear_art),math('SUBTRACT',1,ink)),math('SUBTRACT',1,paper_outer))

        noise=nodes.new('ShaderNodeTexNoise');noise.noise_dimensions='3D'
        noise.inputs['Scale'].default_value=1600;noise.inputs['Detail'].default_value=1;noise.inputs['Roughness'].default_value=.5
        links.new(uv.outputs['UV'],noise.inputs['Vector'])
        rgb=separate(noise.outputs['Color'])
        grain_delta=combine([math('MULTIPLY',math('SUBTRACT',rgb[i],.5),.24) for i in (0,1)]+[0.0])
        flat=(127/255,128/255,1.0)
        unpacked=vector('SUBTRACT',vector('SCALE',flat,2),(1,1,1))
        grain=vector('ADD',vector('SCALE',vector('NORMALIZE',vector('ADD',unpacked,grain_delta)),.5),(.5,.5,.5))
        normal=mix(normal,grain,clear_finish)
        normal=mix(normal,(*flat,1),math('MAXIMUM',paper_outer,ink))
        grain_r=math('ADD',79/255,math('MULTIPLY',math('SUBTRACT',noise.outputs['Fac'],.5),.16))
        mr=mix(mr,combine([1.0,grain_r,0.0]),clear_finish)
        mr=mix(mr,(1,.5,0,1),ink)
        mr=mix(mr,(1,.67,0,1),paper_outer)

        def obj(name,verts,faces,uvs,native_mm,mat):
            mesh=bpy.data.meshes.new(prefix+name);meshes.append(mesh)
            mesh.from_pydata(verts,[],faces);mesh.update()
            layer=mesh.uv_layers.new(name='UVMap')
            for loop in mesh.loops:layer.data[loop.index].uv=uvs[loop.vertex_index]
            if native_mm is not None:
                layer=mesh.uv_layers.new(name='NativeMM')
                for loop in mesh.loops:layer.data[loop.index].uv=native_mm[loop.vertex_index]
            mesh.materials.append(mat)
            obj=bpy.data.objects.new(prefix+name,mesh);objects.append(obj);scene.collection.objects.link(obj)
            return obj

        obj(' background',[(0,0,0),(4096,0,0),(4096,4096,0),(0,4096,0)],[(0,1,2,3)],[(0,0),(1,0),(1,1),(0,1)],None,background)
        vertices,faces,uvs,mm=[],[],[],[]
        source_uv=body.data.uv_layers['UVMap']
        for polygon in body.data.polygons:
            points=[body.data.vertices[body.data.loops[i].vertex_index].co for i in polygon.loop_indices]
            if polygon.normal.z>-.9 or max(p.z for p in points)>3:continue
            start=len(vertices)
            for loop,p in zip(polygon.loop_indices,points):
                u,v=source_uv.data[loop].uv
                vertices.append((u*4096,v*4096,.1));uvs.append((u,v));mm.append((-(p.x-CENTER_X),p.y))
            faces.append(tuple(range(start,len(vertices))))
        assert len(faces)>1000
        obj(' underside UV patch',vertices,faces,uvs,mm,patch)
        camera_data=bpy.data.cameras.new(prefix);camera_data.type='ORTHO';camera_data.ortho_scale=4096;camera_data.clip_end=20000
        camera=bpy.data.objects.new(prefix+' camera',camera_data);objects.append(camera);scene.collection.objects.link(camera)
        camera.location=(2048,2048,10000);camera.rotation_euler=(0,0,0);scene.camera=camera

        for name,original,result,transform,mode in [
            ('basecolor',base_image,color,'Standard','RGB'),
            ('paint-mask',mask_image,paint_mask,'Raw','BW'),
            ('normal',normal_image,normal,'Raw','RGB'),
            ('metallic-roughness',mr_image,mr,'Raw','RGB'),
            ('edit-mask',None,edit,'Raw','BW'),
        ]:
            scene.view_settings.view_transform=transform
            scene.render.image_settings.color_mode=mode
            if original is None:
                for link in list(bg_emission.inputs['Color'].links):background.node_tree.links.remove(link)
                bg_emission.inputs['Color'].default_value=(0,0,0,1)
            else:bg_image.image=original
            links.new(result,patch_emission.inputs['Color'])
            path=DERIVED/('body-eur-'+name+'.png')
            scene.render.filepath=str(path)
            print('Rendering EUR '+name,flush=True)
            with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0]):
                result=bpy.ops.render.render(write_still=True,scene=scene.name,use_viewport=False)
            assert 'FINISHED' in result
            # A completed render can still be empty (for example, camera clipping).
            # Probe the known clear-paint centre before any production mutation.
            probe=bpy.data.images.load(str(path),check_existing=False)
            try:
                probe.colorspace_settings.name='Non-Color'
                offset=(1962*4096+3050)*4
                sample=list(probe.pixels[offset:offset+4])
                if name in ['paint-mask','edit-mask']:assert sample[0]>.95,(name,sample)
                elif name=='normal':assert sample[2]>.9,(name,sample)
                elif name=='metallic-roughness':assert sample[0]>.95 and .1<sample[1]<.9,(name,sample)
                else:assert min(sample[:3])>.3,(name,sample)
            finally:bpy.data.images.remove(probe)
            paths[name]=path
    finally:
        bpy.data.scenes.remove(scene)
        for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
        for mesh in meshes:bpy.data.meshes.remove(mesh)
        for material in materials:bpy.data.materials.remove(material)
        for image in images:bpy.data.images.remove(image)
        if camera_data is not None:bpy.data.cameras.remove(camera_data)
        if world is not None:bpy.data.worlds.remove(world)
        image=bpy.data.images.get('Render Result')
        if image is not None:
            try:image.buffers_free()
            except RuntimeError:pass
    return paths


def main():
    assert Path(bpy.data.filepath).resolve()==(FOLDER/'silver-grain.blend').resolve()
    scene=bpy.context.scene
    root,hinge=scene.objects['3DS_XL'],scene.objects['Hinge']
    assert root.get('source_markings_region')=='USA'
    source=bpy.data.materials['Sourced silver fine paint and graphite PBR']
    paths=render_atlases(scene.objects['Sourced graphite chassis'],source)
    adapted=source.copy();adapted.name='Sourced silver EUR photographic markings'
    adapted['console_paint_mask']='/models/candidates/joshua-xl-eur-paint-mask.png'
    changes={'Sourced silver base colour':'basecolor','Paint grain Image_3':'normal','Paint grain Image_1':'metallic-roughness'}
    for node in adapted.node_tree.nodes:
        if node.type!='TEX_IMAGE' or not node.image or node.image.name not in changes:continue
        name=changes[node.image.name]
        node.image=bpy.data.images.load(str(paths[name]),check_existing=False)
        node.image.name='EUR '+name
        node.image.colorspace_settings.name='sRGB' if name=='basecolor' else 'Non-Color'
        node.image.pack()
    for obj in root.children_recursive:
        if obj.type=='MESH' and obj.get('source_mesh_index')==0:
            assert obj.data.materials[0]==source
            obj.data.materials[0]=adapted
    root['source_markings_region']='EUR'
    root['underside_lettering_method']='Photographic ink reconstruction. User image 5 supplies visible symbols and serial; inspected lower-resolution EUR photograph supplies four-line text and GS group. Physical placement is estimated, not manufacturer CAD. No factory font or barcode encoding claim.'
    root['source_changes']=root['source_changes'].replace('original USA regulatory markings remain pending EUR adaptation.','USA regulatory markings retained at the initial silver checkpoint.')+' Replaced underside USA artwork with photographed EUR ink, certification row and user serial sticker; repositioned the main wordmark and replaced old empty-sticker relief.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-eur.blend'))
    output=FOLDER/'silver-eur.glb'
    module('eur_export','texture_sourced_model.py').export_static(root,hinge,output,restore_frames=False,export_attributes=True)
    module('eur_frames','curve_sourced_shell.py').restore_export_frames(output)
    report={'input':'silver-grain.blend','output':'silver-eur.blend','clear_art_native_mm':CLEAR_ART,'clear_old_sticker_native_mm':CLEAR_OLD_STICKER,'new_paper':PAPER,
            'method':'Isolated UV-space copy of actual underside triangles with a native millimetre UV layer; no production geometry changed.',
            'maps':{name:{'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for name,path in paths.items()}}
    (FOLDER/'eur-atlas-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Saved '+str(output),flush=True)


if __name__=='__main__':
    main()
