"""Render one body-colour atlas quad, then apply a silver PBR material variant.

Run only through Blender MCP after opening the preserved textured-source.blend.
This replaces the failed multi-object EMIT bake. The temporary CPU Cycles scene
contains one quad, one camera and one source image; none of the original scene's
geometry or other six textures is linked into it. Original source UVs, meshes,
normals, maps and the red checkpoint are not edited.

The audited red-paint classifier also covers atlas padding. Do not loosen it:
the source's black plastic contains small red-channel noise, and connector gold
must remain unchanged. The generated PNG is saved before production materials
are changed. A failed render leaves the original scene ready to inspect/reopen.
"""

import hashlib
import importlib.util
import json
import struct
import uuid
from pathlib import Path

import bpy


ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER = ROOT / 'model/candidates/joshua-xl'
SOURCE_BLEND = FOLDER / 'textured-source.blend'
OUTPUT_BLEND = FOLDER / 'silver-source.blend'
OUTPUT_GLB = FOLDER / 'silver-source.glb'
OUTPUT_PNG = FOLDER / 'derived-textures/body-silver-basecolor.png'
OUTPUT_MASK = FOLDER / 'derived-textures/paint-mask.png'
BODY_PNG_SHA256 = '9e5dfaffd8dae55ec5330a59d37b0be7281d83649fb3f6ae217d702d1fcf1651'
SOURCE_SHA256 = 'cc369289729c1b6cc24dd5aa17802d6984aa75da60ff81e187aeb9ac0fde2f6e'
TARGET_LINEAR = (0.30, 0.315, 0.33)
CHROMA_MIN = 0.005
GB_TOLERANCE = 0.000001
CLASSIFICATION_REPORT = {
    'source_body_png_sha256': BODY_PNG_SHA256,
    'linear_red_minus_max_green_blue_gt': CHROMA_MIN,
    'linear_abs_green_minus_blue_lt': GB_TOLERANCE,
    'qualified_source_pixels': 5044041,
    'qualified_pixels_in_other_component_uvs': 0,
    'eligible_source_components': [0, 3, 32],
    'max_equal_gb_red_noise_in_other_component_uvs': 0.0049066245555877686,
    'method': (
        'Read-only raster coverage of every main-material triangle outside '
        'components 0/3/32, evaluated against the original 4096x4096 atlas. '
        'Global classification includes padding; neutral ink and charger gold '
        'do not pass. It is an atlas audit, not a hardware colour measurement.'
    ),
}


def linear(value):
    value /= 255.0
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def find_body_texture(material):
    shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    links = shader.inputs['Base Color'].links
    assert len(links) == 1, 'Expected the original linked body base colour'
    texture = links[0].from_node
    assert texture.type == 'TEX_IMAGE' and texture.image, (
        'Expected the unmodified direct Image_0 base-colour texture'
    )
    image = texture.image
    assert tuple(image.size) == (4096, 4096)
    assert image.colorspace_settings.name == 'sRGB'
    if image.packed_file:
        digest = hashlib.sha256(image.packed_file.data).hexdigest()
    else:
        with open(bpy.path.abspath(image.filepath), 'rb') as handle:
            digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    assert digest == BODY_PNG_SHA256, 'Body image differs from the audited source'
    return texture, image


def png_dimensions(path, expected_colour_type=2):
    with path.open('rb') as handle:
        header = handle.read(33)
        handle.seek(-12, 2)
        trailer = handle.read(12)
    assert header[:8] == b'\x89PNG\r\n\x1a\n' and header[12:16] == b'IHDR'
    width, height, depth, colour_type = struct.unpack('>IIBB', header[16:26])
    assert (width, height, depth, colour_type) == (4096, 4096, 8, expected_colour_type), (
        'Expected a 4096-square 8-bit PNG with the requested colour mode'
    )
    assert trailer[4:8] == b'IEND', 'PNG output is incomplete'


def render_atlas(source_image):
    """Render a single emission quad without linking any source model objects."""
    prefix = 'SilverAtlas_' + uuid.uuid4().hex[:10]
    atlas = bpy.data.scenes.new(prefix)
    owned_objects = []
    mesh = camera_data = material = world = None
    pending = OUTPUT_PNG.with_name('body-silver-basecolor.pending.png')
    OUTPUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    try:
        atlas.render.engine = 'CYCLES'
        atlas.cycles.device = 'CPU'
        atlas.cycles.samples = 1
        atlas.cycles.seed = 0
        atlas.cycles.use_denoising = False
        atlas.cycles.use_adaptive_sampling = False
        atlas.cycles.max_bounces = 0
        atlas.render.use_persistent_data = False
        atlas.render.resolution_x = atlas.render.resolution_y = 4096
        atlas.render.resolution_percentage = 100
        atlas.render.film_transparent = False
        atlas.render.dither_intensity = 0
        atlas.render.image_settings.file_format = 'PNG'
        atlas.render.image_settings.color_mode = 'RGB'
        atlas.render.image_settings.color_depth = '8'
        atlas.render.image_settings.compression = 15
        atlas.render.use_file_extension = True
        atlas.render.filepath = str(pending)
        atlas.render.use_compositing = False
        atlas.render.use_sequencer = False
        atlas.display_settings.display_device = 'sRGB'
        atlas.view_settings.view_transform = 'Standard'
        atlas.view_settings.look = 'None'
        atlas.view_settings.exposure = 0
        atlas.view_settings.gamma = 1
        atlas.view_settings.use_curve_mapping = False
        # Tiny box filtering plus closest texture sampling preserves the existing
        # per-pixel print antialiasing instead of filtering the 4K atlas twice.
        atlas.cycles.pixel_filter_type = 'BOX'
        atlas.cycles.filter_width = 0.01
        world = bpy.data.worlds.new(prefix + '_World')
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
        atlas.world = world

        material = bpy.data.materials.new(prefix + '_Emission')
        material.use_nodes = True
        nodes, links = material.node_tree.nodes, material.node_tree.links
        nodes.clear()
        output = nodes.new('ShaderNodeOutputMaterial')
        emitter = nodes.new('ShaderNodeEmission')
        emitter.inputs['Strength'].default_value = 1
        links.new(emitter.outputs[0], output.inputs['Surface'])
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = source_image
        texture.extension = 'REPEAT'
        texture.interpolation = 'Closest'
        separate = nodes.new('ShaderNodeSeparateColor')
        separate.mode = 'RGB'
        links.new(texture.outputs['Color'], separate.inputs['Color'])

        def math_node(operation, first=None, second=None):
            node = nodes.new('ShaderNodeMath')
            node.operation = operation
            for index, value in enumerate((first, second)):
                if value is None:
                    continue
                if isinstance(value, (int, float)):
                    node.inputs[index].default_value = value
                else:
                    links.new(value, node.inputs[index])
            return node

        red, green, blue = (separate.outputs[c] for c in ('Red', 'Green', 'Blue'))
        other = math_node('MAXIMUM', green, blue)
        chroma = math_node('SUBTRACT', red, other.outputs[0])
        red_gate = math_node('GREATER_THAN', chroma.outputs[0], CHROMA_MIN)
        gb_difference = math_node('SUBTRACT', green, blue)
        gb_abs = math_node('ABSOLUTE', gb_difference.outputs[0])
        equal_gate = math_node('LESS_THAN', gb_abs.outputs[0], GB_TOLERANCE)
        gate = math_node('MULTIPLY', red_gate.outputs[0], equal_gate.outputs[0])
        paint = [linear(v) for v in (186, 38, 38)]
        amount = math_node('DIVIDE', chroma.outputs[0], paint[0] - paint[1])
        amount.use_clamp = True
        masked_amount = math_node('MULTIPLY', amount.outputs[0], gate.outputs[0])
        delta = nodes.new('ShaderNodeVectorMath')
        delta.operation = 'SCALE'
        delta.inputs[0].default_value = [TARGET_LINEAR[i] - paint[i] for i in range(3)]
        links.new(masked_amount.outputs[0], delta.inputs['Scale'])
        colour = nodes.new('ShaderNodeVectorMath')
        colour.operation = 'ADD'
        links.new(texture.outputs['Color'], colour.inputs[0])
        links.new(delta.outputs[0], colour.inputs[1])
        links.new(colour.outputs[0], emitter.inputs['Color'])

        mesh = bpy.data.meshes.new(prefix + '_Quad')
        mesh.from_pydata([(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)], [], [(0, 1, 2, 3)])
        mesh.update()
        uv = mesh.uv_layers.new(name='AtlasUV')
        for loop in mesh.loops:
            position = mesh.vertices[loop.vertex_index].co
            uv.data[loop.index].uv = (position.x, position.y)
        mesh.materials.append(material)
        quad = bpy.data.objects.new(prefix + '_Quad', mesh)
        atlas.collection.objects.link(quad)
        owned_objects.append(quad)
        camera_data = bpy.data.cameras.new(prefix + '_Camera')
        camera_data.type = 'ORTHO'
        camera_data.ortho_scale = 1
        camera = bpy.data.objects.new(prefix + '_Camera', camera_data)
        camera.location = (0.5, 0.5, 3)
        camera.rotation_euler = (0, 0, 0)
        atlas.collection.objects.link(camera)
        owned_objects.append(camera)
        atlas.camera = camera
        print('Silver atlas: isolated CPU scene, one image, one quad, 4096x4096, one sample', flush=True)
        with bpy.context.temp_override(scene=atlas, view_layer=atlas.view_layers[0]):
            result = bpy.ops.render.render(write_still=True, scene=atlas.name, use_viewport=False)
        assert 'FINISHED' in result, f'Atlas render failed: {result}'
        png_dimensions(pending)
        pending.replace(OUTPUT_PNG)
        print(f'Silver atlas saved: {OUTPUT_PNG}', flush=True)

        # Render the exact same binary gate for the runtime VGPU material mask.
        # Reuse the scene, UVs, camera, pixel sampling and source image; only
        # emission colour and PNG output mode change for this second pass.
        mask_pending = OUTPUT_MASK.with_name('paint-mask.pending.png')
        links.new(gate.outputs[0], emitter.inputs['Color'])
        atlas.render.image_settings.color_mode = 'BW'
        atlas.render.filepath = str(mask_pending)
        with bpy.context.temp_override(scene=atlas, view_layer=atlas.view_layers[0]):
            result = bpy.ops.render.render(write_still=True, scene=atlas.name, use_viewport=False)
        assert 'FINISHED' in result, f'Paint mask render failed: {result}'
        png_dimensions(mask_pending, expected_colour_type=0)
        mask_pending.replace(OUTPUT_MASK)
        print(f'Paint mask saved: {OUTPUT_MASK}', flush=True)
    finally:
        # Remove only data created here. Never purge source images or orphans.
        bpy.data.scenes.remove(atlas)
        for obj in owned_objects:
            bpy.data.objects.remove(obj, do_unlink=True)
        if mesh is not None:
            bpy.data.meshes.remove(mesh)
        if camera_data is not None:
            bpy.data.cameras.remove(camera_data)
        if material is not None:
            bpy.data.materials.remove(material)
        if world is not None:
            bpy.data.worlds.remove(world)
        # The PNG is the render result checkpoint; release its large float buffer.
        result_image = bpy.data.images.get('Render Result')
        if result_image is not None:
            try:
                result_image.buffers_free()
            except RuntimeError as error:
                print(f'Could not release Render Result buffer: {error}', flush=True)


def main():
    assert Path(bpy.data.filepath).resolve() == SOURCE_BLEND.resolve(), (
        f'Open the untouched red checkpoint first: {SOURCE_BLEND}'
    )
    scene = bpy.context.scene
    root = scene.objects['3DS_XL']
    assert root.get('texture_download_complete')
    assert root.get('source_sha256') == SOURCE_SHA256
    assert root.get('source_finish') == 'original-red'
    meshes = [obj for obj in root.children_recursive
              if obj.type == 'MESH' and obj.get('source_mesh_index') == 0]
    original = bpy.data.materials['standardSurface1']
    assert len(meshes) == 58
    assert all(obj.data.materials[0] == original for obj in meshes)
    assert all(obj.get('source_uv_convention') == 'blender-v-up-from-original-gltf' for obj in meshes)
    texture_node, source_image = find_body_texture(original)
    render_atlas(source_image)

    # Material edits begin only after the render file is complete and the isolated
    # render scene has been removed. The red source checkpoint stays untouched.
    derived = bpy.data.images.load(str(OUTPUT_PNG), check_existing=False)
    derived.name = 'Sourced silver base colour'
    derived.colorspace_settings.name = 'sRGB'
    derived.pack()
    adapted = original.copy()
    adapted.name = 'Sourced silver and graphite PBR'
    adapted['console_material_role'] = 'sourced-body'
    adapted['console_paint_mask'] = '/models/candidates/joshua-xl-paint-mask.png'
    # Replacing the image on the copied base-colour node preserves its original
    # vector input, sampler and every normal/roughness/metallic/emissive link.
    adapted.node_tree.nodes[texture_node.name].image = derived
    old_changes = root.get('source_changes', '')
    old_bake = root.get('silver_colour_bake')
    if old_bake is not None:
        old_bake = old_bake.to_dict()
    try:
        for obj in meshes:
            obj.data.materials[0] = adapted
        root['source_finish'] = 'silver-adaptation'
        root['silver_colour_bake'] = {
            'method': 'isolated single-quad CPU emission atlas render',
            'target_linear_rgb': list(TARGET_LINEAR),
            'classification': CLASSIFICATION_REPORT,
            'preserved': 'source UVs/geometry/normals, neutral ink/wear, other PBR maps',
            'padding': 'same paint classifier applied to the full atlas including padding',
        }
        root['source_changes'] = old_changes.replace(' Source red finish and USA markings retained.', '') + (
            ' Replaced red paint contributions with a silver atlas colour pass; '
            'original USA regulatory markings remain pending EUR adaptation.'
        )
        with bpy.context.temp_override(active_object=root, object=root):
            result = bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
        assert 'FINISHED' in result, f'Silver native save failed: {result}'
    except Exception:
        for obj in meshes:
            obj.data.materials[0] = original
        root['source_finish'] = 'original-red'
        root['source_changes'] = old_changes
        if old_bake is None:
            if 'silver_colour_bake' in root:
                del root['silver_colour_bake']
        else:
            root['silver_colour_bake'] = old_bake
        bpy.data.materials.remove(adapted)
        bpy.data.images.remove(derived)
        raise

    print(f'Silver native checkpoint saved: {OUTPUT_BLEND}; exporting separately', flush=True)
    spec = importlib.util.spec_from_file_location('source_texture_pass', ROOT / 'scripts/texture_sourced_model.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    tangent_report = module.export_static(root, scene.objects['Hinge'], OUTPUT_GLB)
    print(json.dumps({
        'blend': str(OUTPUT_BLEND), 'glb': str(OUTPUT_GLB),
        'base_colour': str(OUTPUT_PNG), 'paint_mask': str(OUTPUT_MASK),
        'source_finish': root['source_finish'],
        'source_geometry_uv_normals_changed': False,
        'region': 'USA markings remain; EUR adaptation pending',
        'classifier': CLASSIFICATION_REPORT,
        'tangent_restore': tangent_report,
    }, indent=2))


if __name__ == '__main__':
    main()
