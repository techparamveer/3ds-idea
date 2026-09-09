"""Add provisional live-display anchors to the preserved Joshua P. XL rig.

Execute through Blender MCP with model/candidates/joshua-xl/rigged-geometry.blend
already open. This pass does not edit source meshes, proportions, UVs or normals.
The active display dimensions are Nintendo's specifications; their centres are
provisional because the source's complete screen textures have not arrived.

The two empty rotations describe XY planes in the exported Three.js coordinate
system. A Blender empty's visible axes do not indicate the display face.
"""

import json
import math
import shutil
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER = ROOT / 'model/candidates/joshua-xl'
BLEND_PATH = FOLDER / 'rigged-geometry.blend'
GLB_PATH = FOLDER / 'rigged-geometry.glb'
PREVIEW_PATH = ROOT / 'public/models/candidates/joshua-xl.glb'
REPORT_PATH = FOLDER / 'rig-report.json'
SOURCE_URL = (
    'https://sketchfab.com/3d-models/'
    'nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc'
)
LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'
LAYOUT_STATUS = (
    'Provisional: Nintendo active display dimensions centred within source glass '
    'geometry; actual source texture boundaries are unverified.'
)
SPECS = {
    'top': {
        'screen': 'Screen_Top',
        'anchor': 'DisplayAnchor_Top',
        'parent': 'Hinge',
        'width_mm': 106.2,
        'height_mm': 63.72,
        'native_z_offset_mm': -0.02,
        'native_rotation_x': math.pi / 2,
    },
    'bottom': {
        'screen': 'Screen_Bottom',
        'anchor': 'DisplayAnchor_Bottom',
        'parent': 'Base',
        'width_mm': 84.96,
        'height_mm': 63.72,
        'native_z_offset_mm': 0.02,
        'native_rotation_x': -math.pi / 2,
    },
}


def local_glass_bounds(screen, parent):
    """Return source glass bounds in its rigid parent's native mm coordinates."""
    to_parent = parent.matrix_world.inverted() @ screen.matrix_world
    corners = [to_parent @ Vector(corner) for corner in screen.bound_box]
    low = Vector(tuple(min(point[axis] for point in corners) for axis in range(3)))
    high = Vector(tuple(max(point[axis] for point in corners) for axis in range(3)))
    return low, high


def exported_document(path):
    """Check the exported GLB is complete before mirroring it to the preview."""
    with path.open('rb') as handle:
        magic, version, length = struct.unpack('<4sII', handle.read(12))
        assert magic == b'glTF' and version == 2, 'Invalid exported GLB header'
        assert length == path.stat().st_size, 'Exported GLB is incomplete'
        json_length, chunk_type = struct.unpack('<II', handle.read(8))
        assert chunk_type == 0x4E4F534A, 'Expected GLB JSON chunk'
        return json.loads(handle.read(json_length))


def main():
    assert Path(bpy.data.filepath).resolve() == BLEND_PATH.resolve(), (
        f'Open the preserved candidate first: {BLEND_PATH}'
    )
    scene = bpy.context.scene
    required = ['3DS_XL', 'Base', 'Hinge', 'Source_1_part_03', 'Source_1_part_04']
    required += [spec['screen'] for spec in SPECS.values()]
    missing = [name for name in required if name not in scene.objects]
    assert not missing, f'Candidate components are missing: {missing}'
    root = scene.objects['3DS_XL']
    base = scene.objects['Base']
    hinge = scene.objects['Hinge']
    assert base.parent == root and hinge.parent == root, 'Unexpected rig hierarchy'
    assert all(abs(value - 1.0) < 1e-6 for value in root.scale), (
        'Candidate must be open in its native millimetre workspace, root scale 1'
    )
    for spec in SPECS.values():
        assert scene.objects[spec['screen']].type == 'MESH'
        assert scene.objects[spec['screen']].parent == scene.objects[spec['parent']]
        previous = bpy.data.objects.get(spec['anchor'])
        assert previous is None or previous.type == 'EMPTY', (
            f"Refusing to replace a mesh named {spec['anchor']}"
        )
    report = json.loads(REPORT_PATH.read_text())
    scene.frame_set(85)
    bpy.context.view_layer.update()

    layout = {'version': 1, 'layout_status': LAYOUT_STATUS, 'screens': {}}
    anchor_report = {}
    for key, spec in SPECS.items():
        parent = scene.objects[spec['parent']]
        screen = scene.objects[spec['screen']]
        low, high = local_glass_bounds(screen, parent)
        centre = (low + high) / 2
        centre.z += spec['native_z_offset_mm']
        anchor = bpy.data.objects.get(spec['anchor'])
        if anchor is None:
            anchor = bpy.data.objects.new(spec['anchor'], None)
            scene.collection.objects.link(anchor)
        elif anchor.name not in scene.objects:
            scene.collection.objects.link(anchor)
        anchor.parent = parent
        anchor.matrix_parent_inverse = Matrix.Identity(4)
        anchor.location = centre
        anchor.rotation_mode = 'XYZ'
        anchor.rotation_euler = (spec['native_rotation_x'], 0, 0)
        anchor.scale = (1, 1, 1)
        anchor.empty_display_type = 'PLAIN_AXES'
        anchor.empty_display_size = 4
        anchor['console_display_anchor'] = key
        anchor['layout_status'] = LAYOUT_STATUS
        anchor['active_display_mm'] = [spec['width_mm'], spec['height_mm']]
        anchor['glass_source'] = spec['screen']
        anchor['native_z_offset_mm'] = spec['native_z_offset_mm']
        layout['screens'][key] = {
            'anchor': spec['anchor'],
            'width_mm': spec['width_mm'],
            'height_mm': spec['height_mm'],
        }
        anchor_report[key] = {
            'anchor': spec['anchor'],
            'parent': spec['parent'],
            'local_position_mm': list(centre),
            'source_glass_bounds_mm': {'min': list(low), 'max': list(high)},
            'source_glass_extent_mm': list(high - low),
            'native_rotation_x_radians': spec['native_rotation_x'],
            'native_z_offset_mm': spec['native_z_offset_mm'],
        }

    root['console_layout'] = layout
    for name in ('Source_1_part_03', 'Source_1_part_04'):
        scene.objects[name]['console_replace_with_display'] = True
        scene.objects[name]['console_replacement_reason'] = (
            'Source baked screen artwork; hide at runtime when adding live displays. '
            'Source geometry is preserved.'
        )
    root['source_changes'] = (
        'Separated rigid components; removed presentation transform; fitted an '
        'X-axis hinge with 0–155 degree motion; uniformly normalized width to '
        '156 mm; added control pivots and provisional live-display anchors. '
        'Original geometry, UVs and normals retained. Source PBR textures remain '
        'incomplete; inspection materials are substitutes.'
    )
    bpy.context.view_layer.update()

    # Save with the normal native scale, intact animation, and open preview pose.
    with bpy.context.temp_override(active_object=root, object=root):
        result = bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    assert result == {'FINISHED'}, f'Native save failed: {result}'

    selected = list(bpy.context.selected_objects)
    active = bpy.context.view_layer.objects.active
    saved_actions = [
        (obj, obj.animation_data.action)
        for obj in (root, hinge) if obj.animation_data is not None
    ]
    saved_root_location = root.location.copy()
    saved_rotations = [(obj, obj.rotation_euler.copy()) for obj in (root, hinge)]
    try:
        for obj, _action in saved_actions:
            obj.animation_data.action = None
        scene.frame_set(1)
        root.location = (0, 0, 0)
        root.rotation_euler = (0, 0, 0)
        root.scale = (0.001, 0.001, 0.001)
        hinge.rotation_euler = (0, 0, 0)
        bpy.ops.object.select_all(action='DESELECT')
        root.select_set(True)
        for obj in root.children_recursive:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = root
        bpy.context.view_layer.update()
        with bpy.context.temp_override(active_object=root, object=root):
            result = bpy.ops.export_scene.gltf(
                filepath=str(GLB_PATH), export_format='GLB', use_selection=True,
                export_apply=True, export_extras=True, export_animations=False,
                export_current_frame=True, export_cameras=False, export_lights=False,
            )
        assert result == {'FINISHED'}, f'GLB export failed: {result}'
    finally:
        root.location = saved_root_location
        root.scale = (1, 1, 1)
        for obj, action in saved_actions:
            obj.animation_data.action = action
        scene.frame_set(85)
        # Also preserve a manually posed candidate with no assigned action.
        for obj, rotation in saved_rotations:
            if obj.animation_data is None or obj.animation_data.action is None:
                obj.rotation_euler = rotation
        bpy.ops.object.select_all(action='DESELECT')
        for obj in selected:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = active
        bpy.context.view_layer.update()

    document = exported_document(GLB_PATH)
    nodes = {node.get('name'): node for node in document['nodes']}
    assert not document.get('animations'), 'Static export unexpectedly has animations'
    assert nodes['3DS_XL']['extras']['console_layout']['version'] == 1
    for name in ('3DS_XL', 'Hinge'):
        quaternion = nodes[name].get('rotation', [0, 0, 0, 1])
        assert all(abs(quaternion[i]) < 1e-6 for i in range(3))
        assert abs(abs(quaternion[3]) - 1.0) < 1e-6
        assert 'matrix' not in nodes[name], 'Unexpected matrix in static rigid rig'
    assert all(abs(v) < 1e-6 for v in nodes['3DS_XL'].get('translation', [0, 0, 0]))
    for key, spec in SPECS.items():
        assert spec['anchor'] in nodes, f'Missing exported anchor: {key}'
    for name in ('Source_1_part_03', 'Source_1_part_04'):
        assert nodes[name]['extras']['console_replace_with_display'] is True
    PREVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(GLB_PATH, PREVIEW_PATH)
    PREVIEW_PATH.with_suffix('.LICENSE.txt').write_text(
        'Nintendo 3DS XL — sourced model preview\n\n'
        'Original model: Nintendo 3DS XL\n'
        'Author: Joshua P. / Pansdaz (@Pansdaz)\n'
        f'Source: {SOURCE_URL}\n'
        f'Licence: Creative Commons Attribution 4.0 International — {LICENSE_URL}\n\n'
        'Modifications: separated 68 rigid components while preserving source '
        'geometry, UVs and vertex normals; removed the presentation transform; '
        'uniformly scaled width to 156 mm; fitted an X-axis 0–155 degree hinge; '
        'added independent control pivots and provisional live-display anchors; '
        'flagged baked display artwork for runtime replacement.\n\n'
        'Incomplete texture download: the authenticated source GLB transfer '
        'stalled at 4,636,960 of 28,850,812 bytes. Complete geometry buffers were '
        'retained; incomplete source images were omitted. Inspection materials '
        'are substitutes. This asset does not represent the creator’s finished '
        'PBR textures.\n\n'
        f'Display placement: {LAYOUT_STATUS}\n'
        'The candidate envelope and visual fidelity remain under evaluation. '
        'Nintendo names and marks identify the depicted hardware; no endorsement '
        'by Nintendo or the original model author is implied.\n',
        encoding='utf-8',
    )
    report['active_display_mm'] = {
        key: {'width': spec['width_mm'], 'height': spec['height_mm']}
        for key, spec in SPECS.items()
    }
    report['layout_status'] = LAYOUT_STATUS
    report['display_anchors'] = anchor_report
    report['baked_display_artwork_runtime_hidden'] = ['Source_1_part_03', 'Source_1_part_04']
    REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({
        'blend': str(BLEND_PATH), 'glb': str(GLB_PATH),
        'preview': str(PREVIEW_PATH), 'console_layout': layout,
        'display_anchors': anchor_report,
        'source_meshes_modified': False,
    }, indent=2))


if __name__ == '__main__':
    main()
