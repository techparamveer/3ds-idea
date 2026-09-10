"""Photographic SELECT/HOME/START ink through the sourced cap UVs, via Blender MCP.

Start from silver-front.blend. The photo's glyphs and house symbol are retained;
no font is substituted. Derived maps are rendered in an isolated UV-space scene.
"""
from pathlib import Path
import hashlib
import json
import uuid
import bpy
import numpy as np
import fit_sourced_dimensions as pipeline

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'model/candidates/joshua-xl'
DERIVED = FOLDER/'derived-textures'
PHOTO = ROOT/'.local/references/front/techradar-original.jpg'
URL = 'https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg'
LEGENDS = {
    'Button_SELECT': {'crop': [727, 792, 798, 808], 'size_mm': [12.35, 3.4], 'threshold_srgb': [35, 68], 'clear_width_mm': 18},
    'Button_HOME': {'crop': [874, 792, 960, 808], 'size_mm': [15.0, 3.4], 'threshold_srgb': [33, 64], 'clear_width_mm': 20},
    'Button_START': {'crop': [1041, 792, 1102, 808], 'size_mm': [10.61, 3.4], 'threshold_srgb': [30, 59], 'clear_width_mm': 18},
}


def linear(byte):
    value = byte/255
    return value/12.92 if value <= .04045 else ((value+.055)/1.055)**2.4


def render_atlases(source):
    prefix = 'LegendAtlas_' + uuid.uuid4().hex[:8]
    scene = bpy.data.scenes.new(prefix)
    objects, meshes, materials, images = [], [], [], []
    world = camera_data = None
    paths, measurements = {}, {}
    try:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 1
        scene.cycles.use_denoising = False
        scene.cycles.use_adaptive_sampling = False
        scene.cycles.max_bounces = 0
        scene.cycles.pixel_filter_type = 'BOX'
        scene.cycles.filter_width = .01
        scene.render.resolution_x = scene.render.resolution_y = 4096
        scene.render.resolution_percentage = 100
        scene.render.dither_intensity = 0
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_depth = '8'
        scene.render.image_settings.compression = 100
        scene.render.use_compositing = scene.render.use_sequencer = False
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0
        scene.view_settings.gamma = 1
        world = bpy.data.worlds.new(prefix)
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
        scene.world = world
        photo = bpy.data.images.load(str(PHOTO), check_existing=False)
        photo.colorspace_settings.name = 'sRGB'
        images.append(photo)
        original = {name: next(n.image for n in source.node_tree.nodes
                              if n.type == 'TEX_IMAGE' and n.image and n.image.name == 'EUR '+name)
                    for name in ['basecolor', 'normal', 'metallic-roughness']}

        def material(name):
            mat = bpy.data.materials.new(prefix+name)
            materials.append(mat)
            mat.use_nodes = True
            mat.node_tree.nodes.clear()
            output = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
            emit = mat.node_tree.nodes.new('ShaderNodeEmission')
            mat.node_tree.links.new(emit.outputs[0], output.inputs['Surface'])
            return mat, emit

        def obj(name, vertices, faces, uv, mm, mat):
            mesh = bpy.data.meshes.new(prefix+name)
            meshes.append(mesh)
            mesh.from_pydata(vertices, [], faces)
            mesh.update()
            for layer_name, data in [('UVMap', uv), ('CapMM', mm)]:
                if data is None:
                    continue
                layer = mesh.uv_layers.new(name=layer_name)
                for loop in mesh.loops:
                    layer.data[loop.index].uv = data[loop.vertex_index]
            mesh.materials.append(mat)
            result = bpy.data.objects.new(prefix+name, mesh)
            objects.append(result)
            scene.collection.objects.link(result)
            return result

        background, bg_emit = material(' background')
        bg_image = background.node_tree.nodes.new('ShaderNodeTexImage')
        bg_image.interpolation = 'Closest'
        background.node_tree.links.new(bg_image.outputs['Color'], bg_emit.inputs['Color'])
        obj(' background', [(0,0,0),(4096,0,0),(4096,4096,0),(0,4096,0)],
            [(0,1,2,3)], [(0,0),(1,0),(1,1),(0,1)], None, background)
        outputs = []
        for name, spec in LEGENDS.items():
            cap = bpy.data.objects[name]
            top = [p for p in cap.data.polygons if p.normal.z > .9]
            assert len(top) == 2
            corners = [(cap.data.vertices[cap.data.loops[i].vertex_index].co.copy(),
                        cap.data.uv_layers['UVMap'].data[i].uv.copy()) for p in top for i in p.loop_indices]
            xyz = np.array([p for p, _ in corners])
            center = (xyz.min(0)+xyz.max(0))/2
            design = np.column_stack([xyz[:, :2], np.ones(len(xyz))])
            fitted = np.linalg.lstsq(design, np.array([uv for _, uv in corners]), rcond=None)[0]
            dv_dy = fitted[1]
            measurements[name] = {'center_local_mm': center.tolist(), 'uv_per_y_mm': dv_dy.tolist(),
                                  'uv_fit_max_error': float(abs(design@fitted-np.array([uv for _, uv in corners])).max())}
            patch, emit = material(' '+name)
            nodes, links = patch.node_tree.nodes, patch.node_tree.links
            def connect(value, socket):
                if isinstance(value, (int, float)) and socket.type == 'RGBA':
                    socket.default_value = (value, value, value, 1)
                elif isinstance(value, (int, float, list, tuple)):
                    socket.default_value = value
                else:
                    links.new(value, socket)
            def math(op, a, b=None):
                node = nodes.new('ShaderNodeMath'); node.operation = op
                connect(a, node.inputs[0])
                if b is not None: connect(b, node.inputs[1])
                return node.outputs[0]
            def combine(values):
                node = nodes.new('ShaderNodeCombineXYZ')
                for value, socket in zip(values, node.inputs): connect(value, socket)
                return node.outputs[0]
            def separate(value):
                node = nodes.new('ShaderNodeSeparateXYZ'); connect(value, node.inputs[0]); return node.outputs
            def mix(a, b, factor):
                node = nodes.new('ShaderNodeMixRGB'); node.blend_type = 'MIX'
                for value, socket in zip([factor, a, b], node.inputs): connect(value, socket)
                return node.outputs[0]
            def vector(op, a, b=None):
                node = nodes.new('ShaderNodeVectorMath'); node.operation = op
                connect(a, node.inputs[0])
                if b is not None: connect(b, node.inputs['Scale'] if op == 'SCALE' else node.inputs[1])
                return node.outputs[0]
            def texture(image, uv, interpolation='Closest'):
                node = nodes.new('ShaderNodeTexImage'); node.image = image
                node.interpolation = interpolation; node.extension = 'CLIP'
                connect(uv, node.inputs['Vector']); return node.outputs['Color']
            def clamp(value):
                return math('MINIMUM', math('MAXIMUM', value, 0), 1)
            coords = nodes.new('ShaderNodeUVMap'); coords.uv_map = 'UVMap'
            native = nodes.new('ShaderNodeUVMap'); native.uv_map = 'CapMM'
            X, Y, _ = separate(native.outputs['UV'])
            base = texture(original['basecolor'], coords.outputs[0])
            normal = texture(original['normal'], coords.outputs[0])
            mr = texture(original['metallic-roughness'], coords.outputs[0])
            x0,y0,x1,y1 = spec['crop']; width,height = spec['size_mm']
            U = math('DIVIDE', math('ADD', x0, math('MULTIPLY', math('ADD', math('DIVIDE', X, width), .5), x1-x0)), photo.size[0])
            V = math('SUBTRACT', 1, math('DIVIDE', math('ADD', y0, math('MULTIPLY', math('SUBTRACT', .5, math('DIVIDE', Y, height)), y1-y0)), photo.size[1]))
            color = texture(photo, combine([U,V,0.0]), 'Linear')
            gray = nodes.new('ShaderNodeRGBToBW'); connect(color, gray.inputs[0])
            low, high = [linear(v) for v in spec['threshold_srgb']]
            ink = clamp(math('DIVIDE', math('SUBTRACT', high, gray.outputs[0]), high-low))
            gate = math('MULTIPLY', math('LESS_THAN', math('ABSOLUTE', X), width/2), math('LESS_THAN', math('ABSOLUTE', Y), height/2))
            ink = math('MULTIPLY', ink, gate)
            clear = math('MULTIPLY', clamp(math('DIVIDE', math('SUBTRACT', spec['clear_width_mm']/2, math('ABSOLUTE', X)), .5)),
                         clamp(math('DIVIDE', math('SUBTRACT', 2.25, math('ABSOLUTE', Y)), .45)))
            # Sample glyph-free rows at the same X, retaining the source's slow
            # normal variation that compensates its custom smooth vertex normals.
            samples = []
            for row in [-2.15, 2.15]:
                delta = math('SUBTRACT', row, Y)
                offset = combine([math('MULTIPLY', delta, float(dv_dy[0])), math('MULTIPLY', delta, float(dv_dy[1])), 0.0])
                samples.append(texture(original['normal'], vector('ADD', coords.outputs[0], offset), 'Linear'))
            baseline = mix(samples[0], samples[1], clamp(math('DIVIDE', math('ADD', Y, 2.15), 4.3)))
            unpacked = vector('SUBTRACT', vector('SCALE', baseline, 2), (1,1,1))
            flat = vector('ADD', vector('SCALE', vector('NORMALIZE', unpacked), .5), (.5,.5,.5))
            dark = vector('SCALE', base, .18)
            channels = separate(mr)
            results = {'basecolor': mix(base, dark, ink), 'normal': mix(normal, flat, clear),
                       'metallic-roughness': mix(mr, combine([channels[0], .52, channels[2]]), ink),
                       'specular': math('SUBTRACT', 1, math('MULTIPLY', .95, ink)),
                       'edit-mask': math('MAXIMUM', clear, ink), 'ink-mask': ink}
            outputs.append((patch, emit, results))
            vertices, faces, uv, mm = [], [], [], []
            for polygon in top:
                start = len(vertices)
                for loop in polygon.loop_indices:
                    point = cap.data.vertices[cap.data.loops[loop].vertex_index].co
                    u,v = cap.data.uv_layers['UVMap'].data[loop].uv
                    vertices.append((u*4096,v*4096,.1)); uv.append((u,v))
                    mm.append((point.x-center[0],point.y-center[1]))
                faces.append(tuple(range(start,len(vertices))))
            obj(' '+name, vertices, faces, uv, mm, patch)
        camera_data = bpy.data.cameras.new(prefix)
        camera_data.type = 'ORTHO'; camera_data.ortho_scale = 4096; camera_data.clip_end = 20000
        camera = bpy.data.objects.new(prefix+' camera', camera_data)
        objects.append(camera); scene.collection.objects.link(camera)
        camera.location = (2048,2048,10000); camera.rotation_euler = (0,0,0); scene.camera = camera
        for name in ['basecolor','normal','metallic-roughness','specular','edit-mask','ink-mask']:
            scene.view_settings.view_transform = 'Standard' if name == 'basecolor' else 'Raw'
            scene.render.image_settings.color_mode = 'BW' if name.endswith('mask') or name == 'specular' else 'RGB'
            if name in original:
                bg_image.image = original[name]
            else:
                for link in list(bg_emit.inputs['Color'].links): background.node_tree.links.remove(link)
                bg_emit.inputs['Color'].default_value = (1,1,1,1) if name == 'specular' else (0,0,0,1)
            for patch, emit, values in outputs:
                patch.node_tree.links.new(values[name], emit.inputs['Color'])
            path = DERIVED/('body-legends-'+name+'.png')
            scene.render.filepath = str(path)
            print('Rendering lower-key '+name, flush=True)
            with bpy.context.temp_override(scene=scene, view_layer=scene.view_layers[0]):
                result = bpy.ops.render.render(write_still=True, scene=scene.name, use_viewport=False)
            assert 'FINISHED' in result
            paths[name] = path
    finally:
        bpy.data.scenes.remove(scene)
        for obj in objects: bpy.data.objects.remove(obj, do_unlink=True)
        for mesh in meshes: bpy.data.meshes.remove(mesh)
        for material in materials: bpy.data.materials.remove(material)
        for image in images: bpy.data.images.remove(image)
        if camera_data: bpy.data.cameras.remove(camera_data)
        if world: bpy.data.worlds.remove(world)
        result = bpy.data.images.get('Render Result')
        if result is not None:
            try: result.buffers_free()
            except RuntimeError: pass
    report = {'source': {'url': URL, 'sha256': hashlib.sha256(PHOTO.read_bytes()).hexdigest()},
              'legends': LEGENDS, 'measurements': measurements,
              'ink_finish': {'basecolor_multiplier': .18, 'roughness': .52, 'specular_factor': .05},
              'method': 'Photographic ink thresholding projected through actual source top-face UVs. Glyph-free normal rows interpolate beneath the old relief. Geometry unchanged.',
              'maps': {name: {'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for name,path in paths.items()}}
    (FOLDER/'legends-atlas-report.json').write_text(json.dumps(report, indent=2)+'\n')
    return paths


def main():
    assert Path(bpy.data.filepath).resolve() == (FOLDER/'silver-front.blend').resolve()
    source = bpy.data.materials['Sourced silver EUR photographic markings']
    render_atlases(source)
    print('Derived maps ready for an independent pixel audit; native model unchanged.')


def install():
    """Install only the audited map files, then save/export a new checkpoint."""
    assert Path(bpy.data.filepath).resolve() == (FOLDER/'silver-front.blend').resolve()
    audit = json.loads((FOLDER/'legends-pixel-audit.json').read_text())
    assert audit['outside_top_faces'] == 0
    assert not audit['other_face_overlap']
    for name, checks in audit['maps'].items():
        assert checks['outside_edit_changed'] == 0
        assert hashlib.sha256((DERIVED/('body-legends-'+name+'.png')).read_bytes()).hexdigest() == checks['sha256']
    source = bpy.data.materials['Sourced silver EUR photographic markings']
    adapted = source.copy()
    adapted.name = 'Sourced silver photographic lower-key legends'
    names = {'EUR '+name: name for name in audit['maps']}
    for node in adapted.node_tree.nodes:
        if node.type != 'TEX_IMAGE' or not node.image or node.image.name not in names:
            continue
        name = names[node.image.name]
        node.image = bpy.data.images.load(str(DERIVED/('body-legends-'+name+'.png')), check_existing=False)
        node.image.name = 'Key legends '+name
        node.image.colorspace_settings.name = 'sRGB' if name == 'basecolor' else 'Non-Color'
        node.image.pack()
    specular = adapted.node_tree.nodes.new('ShaderNodeTexImage')
    specular.image = bpy.data.images.load(str(DERIVED/'body-legends-specular.png'), check_existing=False)
    specular.image.name = 'Key legends specular'
    specular.image.colorspace_settings.name = 'Non-Color'
    specular.image.pack()
    factor = adapted.node_tree.nodes.new('ShaderNodeMath')
    factor.operation = 'MULTIPLY'
    # Blender's default .5 IOR level corresponds to glTF specular factor 1.
    factor.inputs[1].default_value = .5
    channels = adapted.node_tree.nodes.new('ShaderNodeSeparateColor')
    # Explicit red lets glTF repack this grayscale map into specular alpha.
    adapted.node_tree.links.new(specular.outputs['Color'], channels.inputs['Color'])
    adapted.node_tree.links.new(channels.outputs['Red'], factor.inputs[0])
    adapted.node_tree.links.new(factor.outputs[0], adapted.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'])
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    for obj in root.children_recursive:
        if obj.type == 'MESH' and obj.get('source_mesh_index') == 0:
            assert obj.data.materials[0] == source
            obj.data.materials[0] = adapted
    root['lower_key_legend_method'] = json.dumps({'reference': URL, 'legends': LEGENDS,
        'interpretation': 'Photographed glyphs and house symbol. Estimated placement/contrast; finite reference resolution. Not a verified factory font.'})
    root['source_changes'] += ' Replaced lower-key SELECT/HOME/START legends with photographed dark ink; interpolated glyph-free normal rows beneath old relief. Geometry, UVs and other atlas pixels retained.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-legends.blend'))
    output = FOLDER/'silver-legends.glb'
    pipeline.module('legends_export', 'texture_sourced_model.py').export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    pipeline.module('legends_frames', 'curve_sourced_shell.py').restore_export_frames(output)
    print('Saved audited lower-key checkpoint: '+str(output))


if __name__ == '__main__':
    main()
