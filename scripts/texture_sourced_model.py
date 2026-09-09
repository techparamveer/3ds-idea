"""Restore the completed Sketchfab PBR asset onto the separately rigged meshes.

Run main() through Blender MCP with rigged-geometry.blend open. A native source
import may already be present for inspection. Writes a new textured-source file,
preserving the original geometry-only checkpoint and the previous homepage asset.
"""
import bpy
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path

ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER = ROOT / 'model/candidates/joshua-xl'
SOURCE = ROOT / '.local/sources/joshua-xl/original.glb'
SOURCE_HASH = 'cc369289729c1b6cc24dd5aa17802d6984aa75da60ff81e187aeb9ac0fde2f6e'


def export_static(root, hinge, path):
    scene = bpy.context.scene
    saved_frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    try:
        for o, _ in actions:
            o.animation_data.action = None
        root.rotation_euler = (0, 0, 0)
        hinge.rotation_euler = (0, 0, 0)
        root.scale = (.001,) * 3
        bpy.ops.object.select_all(action='DESELECT')
        root.select_set(True)
        for o in root.children_recursive:
            o.select_set(True)
        bpy.context.view_layer.objects.active = root
        bpy.context.view_layer.update()
        with bpy.context.temp_override(active_object=root, object=root):
            result = bpy.ops.export_scene.gltf(
                filepath=str(path), export_format='GLB', use_selection=True,
                export_apply=True, export_extras=True, export_animations=False,
                export_current_frame=True, export_cameras=False, export_lights=False,
                export_tangents=True,
            )
            if 'FINISHED' not in result:
                raise RuntimeError(f'glTF export did not complete: {result}')
    finally:
        root.scale = (1,) * 3
        for o, action in actions:
            o.animation_data.action = action
        scene.frame_set(saved_frame)
        bpy.context.view_layer.update()
    # Blender recalculates tangent frames instead of importing the creator's
    # explicit glTF tangents. Restore those frames only after a successful export.
    spec = importlib.util.spec_from_file_location(
        'restore_sourced_tangents', ROOT / 'scripts/restore_sourced_tangents.py')
    restorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(restorer)
    return restorer.restore_file(path, write=True)


def main():
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_HASH
    scene = bpy.context.scene
    root = scene.objects['3DS_XL']
    hinge = scene.objects['Hinge']
    assert root.get('source_author') and len([o for o in root.children_recursive if o.type == 'MESH']) == 68
    if 'standardSurface1' not in bpy.data.materials:
        bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    source_materials = [bpy.data.materials[n] for n in ('standardSurface1', 'image', 'screen')]
    for o in root.children_recursive:
        if o.type != 'MESH':
            continue
        material_index = int(o['source_mesh_index'])
        o.data.materials.clear()
        o.data.materials.append(source_materials[material_index])
        if o.get('source_uv_convention') != 'blender-v-up-from-original-gltf':
            for layer in o.data.uv_layers:
                for loop in layer.data:
                    loop.uv.y = 1 - loop.uv.y
            o['source_uv_convention'] = 'blender-v-up-from-original-gltf'
        # The native glTF importer names the normal-map UV layer explicitly.
        # Match it so tangent-space normal maps use the restored source UVs.
        o.data.uv_layers.active.name = 'UVMap'
    # Remove only the temporary native source hierarchy, now that its materials
    # have users on the rig. This leaves the source file and rig checkpoints intact.
    imported_root = scene.objects.get('Sketchfab_model')
    if imported_root:
        for o in list(imported_root.children_recursive) + [imported_root]:
            bpy.data.objects.remove(o, do_unlink=True)
    for mat in source_materials:
        for node in mat.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image and not node.image.packed_file:
                node.image.pack()
    root['texture_download_complete'] = True
    root['source_sha256'] = SOURCE_HASH
    root['source_changes'] = (
        'Separated 68 rigid components; removed presentation transform; fitted '
        '0–155 degree hinge; normalized width to 156 mm; authored control pivots '
        'and provisional live-display anchors; restored original PBR textures '
        'and corrected UV V convention. Source red finish and USA markings retained.'
    )
    root['source_finish'] = 'original-red'
    root['source_markings_region'] = 'USA'
    scene.frame_set(85)
    native = FOLDER / 'textured-source.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(native))
    export_static(root, hinge, FOLDER / 'textured-source.glb')
    print(json.dumps({'blend': str(native), 'glb': str(FOLDER / 'textured-source.glb'),
                      'textures_complete': True, 'finish': 'source red; silver adaptation pending'}))


if __name__ == '__main__':
    main()
