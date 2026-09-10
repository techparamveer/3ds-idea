"""Render selected material colour sockets to isolated, exportable UV atlases."""
from pathlib import Path
import bpy

def render(material, outputs, destination):
    scene=bpy.data.scenes.new('Isolated UV socket export')
    mesh=camera_data=world=None;objects=[]
    nodes,links=material.node_tree.nodes,material.node_tree.links
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL' and n.is_active_output)
    old=output.inputs['Surface'].links[0].from_socket
    emission=nodes.new('ShaderNodeEmission');links.new(emission.outputs[0],output.inputs['Surface'])
    paths={}
    try:
        scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=1
        scene.cycles.use_denoising=False;scene.cycles.use_adaptive_sampling=False
        scene.cycles.max_bounces=0;scene.cycles.pixel_filter_type='BOX';scene.cycles.filter_width=.01
        scene.render.resolution_x=scene.render.resolution_y=4096;scene.render.resolution_percentage=100
        scene.render.dither_intensity=0;scene.render.use_compositing=False;scene.render.use_sequencer=False
        scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
        scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=15
        scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
        world=bpy.data.worlds.new(scene.name);world.use_nodes=True
        world.node_tree.nodes['Background'].inputs['Color'].default_value=(0,0,0,1);scene.world=world
        mesh=bpy.data.meshes.new(scene.name);mesh.from_pydata([(0,0,0),(1,0,0),(1,1,0),(0,1,0)],[],[(0,1,2,3)])
        layer=mesh.uv_layers.new(name='UVMap')
        for loop in mesh.loops:layer.data[loop.index].uv=mesh.vertices[loop.vertex_index].co[:2]
        mesh.materials.append(material);quad=bpy.data.objects.new(scene.name,mesh)
        scene.collection.objects.link(quad);objects.append(quad)
        camera_data=bpy.data.cameras.new(scene.name);camera_data.type='ORTHO';camera_data.ortho_scale=1
        camera=bpy.data.objects.new(scene.name+' camera',camera_data);camera.location=(.5,.5,3)
        scene.collection.objects.link(camera);objects.append(camera);scene.camera=camera
        for name,socket in outputs.items():
            links.new(socket,emission.inputs['Color'])
            scene.view_settings.view_transform='Standard' if name=='basecolor' else 'Raw'
            path=Path(str(destination)+'-'+name+'.png');scene.render.filepath=str(path)
            with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0]):
                result=bpy.ops.render.render(write_still=True,scene=scene.name)
            assert 'FINISHED' in result
            paths[name]=path
            print('Rendered '+str(path),flush=True)
    finally:
        links.new(old,output.inputs['Surface']);nodes.remove(emission)
        bpy.data.scenes.remove(scene)
        for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
        if mesh:bpy.data.meshes.remove(mesh)
        if camera_data:bpy.data.cameras.remove(camera_data)
        if world:bpy.data.worlds.remove(world)
        image=bpy.data.images.get('Render Result')
        if image:
            try:image.buffers_free()
            except RuntimeError:pass
    return paths
