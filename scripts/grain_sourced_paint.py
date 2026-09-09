"""Bake restrained paint grain into the curved source's existing PBR atlases.

Run through Blender MCP from silver-curved.blend. Two isolated emission renders
preserve all unmasked pixels; only paint normal and roughness receive grain.
The original silver colour, wear, print, metallic channel and geometry remain.
No production scene geometry is linked into the atlas render.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import uuid
import bpy

ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER = ROOT / 'model/candidates/joshua-xl'
SETTINGS = {'noise_scale_uv': 1600.0, 'normal_xy_strength': .24,
            'roughness_strength': .16, 'seed': 0,
            'interpretation': 'Authored fine paint grain estimated from silver-unit photographs; not measured paint constants.'}


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def bake_maps(source_material):
    prefix = 'PaintGrain_' + uuid.uuid4().hex[:8]
    scene = bpy.data.scenes.new(prefix)
    owned = []
    mesh = camera_data = material = world = mask_image = None
    output_paths = {}
    try:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 1
        scene.cycles.seed = SETTINGS['seed']
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
        scene.render.image_settings.color_mode = 'RGB'
        scene.render.image_settings.color_depth = '8'
        scene.render.image_settings.compression = 15
        scene.render.use_compositing = False
        scene.render.use_sequencer = False
        scene.view_settings.view_transform = 'Raw'
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0
        scene.view_settings.gamma = 1
        scene.view_settings.use_curve_mapping = False
        world = bpy.data.worlds.new(prefix)
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
        scene.world = world
        material = bpy.data.materials.new(prefix)
        material.use_nodes = True
        nodes, links = material.node_tree.nodes, material.node_tree.links
        nodes.clear()
        output = nodes.new('ShaderNodeOutputMaterial')
        emission = nodes.new('ShaderNodeEmission')
        links.new(emission.outputs[0], output.inputs['Surface'])

        def connect(value, socket):
            if isinstance(value, (float, int, tuple, list)):
                socket.default_value = value
            else:
                links.new(value, socket)

        def math(operation, a, b=None):
            node = nodes.new('ShaderNodeMath')
            node.operation = operation
            connect(a, node.inputs[0])
            if b is not None: connect(b, node.inputs[1])
            return node.outputs[0]

        def vector(operation, a, b=None):
            node = nodes.new('ShaderNodeVectorMath')
            node.operation = operation
            connect(a, node.inputs[0])
            if b is not None: connect(b, node.inputs['Scale'] if operation == 'SCALE' else node.inputs[1])
            return node.outputs[0]

        def separate(value):
            node = nodes.new('ShaderNodeSeparateXYZ')
            connect(value, node.inputs[0])
            return node.outputs

        def combine(values):
            node = nodes.new('ShaderNodeCombineXYZ')
            for value, socket in zip(values, node.inputs): connect(value, socket)
            return node.outputs[0]

        def image_node(image):
            node = nodes.new('ShaderNodeTexImage')
            node.image = image
            node.interpolation = 'Closest'
            node.extension = 'REPEAT'
            return node

        mask_image = bpy.data.images.load(str(FOLDER/'derived-textures/paint-mask.png'), check_existing=False)
        mask_image.colorspace_settings.name = 'Non-Color'
        mask = image_node(mask_image).outputs['Color']
        noise = nodes.new('ShaderNodeTexNoise')
        noise.noise_dimensions = '3D'
        noise.inputs['Scale'].default_value = SETTINGS['noise_scale_uv']
        noise.inputs['Detail'].default_value = 1
        noise.inputs['Roughness'].default_value = .5
        uv = nodes.new('ShaderNodeTexCoord')
        links.new(uv.outputs['UV'], noise.inputs['Vector'])
        rgb = separate(noise.outputs['Color'])
        delta = combine([math('MULTIPLY', math('SUBTRACT', rgb[i], .5), SETTINGS['normal_xy_strength']) for i in (0, 1)] + [0.0])
        original = image_node(None)
        original_channels = separate(original.outputs['Color'])
        unpacked = vector('SUBTRACT', vector('SCALE', original.outputs['Color'], 2.0), (1.0, 1.0, 1.0))
        changed_normal = vector('ADD', vector('SCALE', vector('NORMALIZE', vector('ADD', unpacked, delta)), .5), (.5, .5, .5))
        roughness = math('ADD', original_channels[1], math('MULTIPLY', math('SUBTRACT', noise.outputs['Fac'], .5), SETTINGS['roughness_strength']))
        changed_mr = combine([original_channels[0], math('MINIMUM', math('MAXIMUM', roughness, 0.0), 1.0), original_channels[2]])
        mix = nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MIX'
        links.new(mask, mix.inputs[0])
        links.new(original.outputs['Color'], mix.inputs[1])
        links.new(mix.outputs[0], emission.inputs['Color'])

        mesh = bpy.data.meshes.new(prefix)
        mesh.from_pydata([(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)], [], [(0, 1, 2, 3)])
        mesh.update()
        layer = mesh.uv_layers.new(name='AtlasUV')
        for loop in mesh.loops:
            p = mesh.vertices[loop.vertex_index].co
            layer.data[loop.index].uv = p.x, p.y
        mesh.materials.append(material)
        quad = bpy.data.objects.new(prefix, mesh)
        scene.collection.objects.link(quad)
        owned.append(quad)
        camera_data = bpy.data.cameras.new(prefix)
        camera_data.type = 'ORTHO'
        camera_data.ortho_scale = 1
        camera = bpy.data.objects.new(prefix+'_Camera', camera_data)
        camera.location = (.5, .5, 3)
        camera.rotation_euler = (0, 0, 0)
        scene.collection.objects.link(camera)
        owned.append(camera)
        scene.camera = camera
        checker = module('grain_png_check', 'silver_sourced_material_lowmem.py')
        for kind, source_name, result in [('normal', 'Image_3', changed_normal), ('metallic-roughness', 'Image_1', changed_mr)]:
            original.image = next(n.image for n in source_material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and n.image.name == source_name)
            assert original.image.colorspace_settings.name == 'Non-Color'
            links.new(result, mix.inputs[2])
            path = FOLDER/'derived-textures'/('body-paint-grain-'+kind+'.png')
            pending = path.with_suffix('.pending.png')
            scene.render.filepath = str(pending)
            print('Rendering isolated paint grain atlas: '+kind, flush=True)
            with bpy.context.temp_override(scene=scene, view_layer=scene.view_layers[0]):
                result = bpy.ops.render.render(write_still=True, scene=scene.name, use_viewport=False)
            assert 'FINISHED' in result
            checker.png_dimensions(pending)
            pending.replace(path)
            output_paths[source_name] = path
    finally:
        bpy.data.scenes.remove(scene)
        for obj in owned: bpy.data.objects.remove(obj, do_unlink=True)
        if mesh is not None: bpy.data.meshes.remove(mesh)
        if camera_data is not None: bpy.data.cameras.remove(camera_data)
        if material is not None: bpy.data.materials.remove(material)
        if world is not None: bpy.data.worlds.remove(world)
        if mask_image is not None: bpy.data.images.remove(mask_image)
        image = bpy.data.images.get('Render Result')
        if image is not None:
            try: image.buffers_free()
            except RuntimeError: pass
    return output_paths


def main():
    assert Path(bpy.data.filepath).resolve() == (FOLDER/'silver-curved.blend').resolve()
    scene = bpy.context.scene
    root, hinge = scene.objects['3DS_XL'], scene.objects['Hinge']
    source = bpy.data.materials['Sourced silver and graphite PBR']
    paths = bake_maps(source)
    # Checkpoint files exist before any production material is changed.
    material = source.copy()
    material.name = 'Sourced silver fine paint and graphite PBR'
    for node in material.node_tree.nodes:
        if node.type != 'TEX_IMAGE' or not node.image or node.image.name not in paths: continue
        name = node.image.name
        node.image = bpy.data.images.load(str(paths[name]), check_existing=False)
        node.image.name = 'Paint grain '+name
        node.image.colorspace_settings.name = 'Non-Color'
        node.image.pack()
    for obj in root.children_recursive:
        if obj.type == 'MESH' and obj.get('source_mesh_index') == 0:
            assert obj.data.materials[0] == source
            obj.data.materials[0] = material
    root['paint_grain'] = json.dumps(SETTINGS)
    root['source_changes'] += ' Added estimated fine paint grain to masked normal/roughness maps, retaining source wear and unpainted material pixels.'
    output = FOLDER/'silver-grain.glb'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-grain.blend'))
    module('grain_export', 'texture_sourced_model.py').export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    module('grain_frames', 'curve_sourced_shell.py').restore_export_frames(output)
    report = {'settings': SETTINGS, 'maps': {name: {'file':str(path.relative_to(ROOT)), 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for name, path in paths.items()}}
    (FOLDER/'paint-grain-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print('Saved '+str(output), flush=True)


if __name__ == '__main__':
    main()
