"""Fit the sourced XL's published closed envelope through Blender MCP.

Start from silver-eur.blend. Preserve the broad crown, inner contact face, main
controls and live LCD sizes. Extend front/rear margins and thin the outer lid;
both hinge barrels translate together. Save a separate checkpoint.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'model/candidates/joshua-xl'
SOURCE = FOLDER/'silver-eur.glb'
OUTPUT = FOLDER/'silver-dimensions.glb'
PARAMETERS = {
    'target_closed_xyz_mm': [156, 93, 22],
    'depth_margin_transition_abs_y_mm': [24.5, 32.5],
    'rear_hinge_transition_y_mm': [31.9, 34.2],
    'base_hinge_transition_z_mm': [9.5, 11],
    'outer_lid_transition_z_mm': [17, 21.5],
    'specification': 'https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html',
    'interpretation': 'Published overall envelope. Local transition choices are authored; no manufacturer CAD claim. Inner contact face, control shapes and active display dimensions are preserved.',
}


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT/'scripts'/file)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def smooth(value, limits):
    t = np.clip((value-limits[0])/(limits[1]-limits[0]), 0, 1)
    return t*t*(3-2*t)


def move(points, kind, depth, height):
    result = points.copy()
    y, z = points[:, 1], points[:, 2]
    result[:, 1] += depth*np.sign(y)*smooth(abs(y), PARAMETERS['depth_margin_transition_abs_y_mm'])
    rear = smooth(y, PARAMETERS['rear_hinge_transition_y_mm'])
    if kind == 'lid':
        outer = smooth(z, PARAMETERS['outer_lid_transition_z_mm'])
        weight = rear+(1-rear)*outer
    elif kind == 'base':
        weight = rear*smooth(z, PARAMETERS['base_hinge_transition_z_mm'])
    else:
        # Glass and boot artwork remain planar at their original closed height.
        weight = np.zeros(len(points))
    result[:, 2] -= height*weight
    return result


def frames(points, normals, tangents, kind, depth, height):
    # J = [[1,0,0], [0,dY/dy,0], [0,dZ/dy,dZ/dz]]. Carry the source frame
    # through this local deformation rather than asking glTF to invent a basis.
    dy_offset = np.array([0, .001, 0])
    dz_offset = np.array([0, 0, .001])
    dy = (move(points+dy_offset, kind, depth, height)-move(points-dy_offset, kind, depth, height))/.002
    dz = (move(points+dz_offset, kind, depth, height)-move(points-dz_offset, kind, depth, height))/.002
    yy, zy, zz = dy[:, 1], dy[:, 2], dz[:, 2]
    # The 1.5 mm connector band below the fixed barrel absorbs a 0.206 mm
    # translation; its smooth transition reaches ~0.794 determinant. The lid
    # remains above ~0.931. Reject folds/collapse, not that intended connector.
    assert np.min(yy*zz) > .75, ('The correction folds or collapses a surface', kind, float(np.min(yy*zz)))
    n = normals.copy()
    n[:, 2] /= zz
    n[:, 1] = (normals[:, 1]-zy*n[:, 2])/yy
    n /= np.linalg.norm(n, axis=1)[:, None]
    t = None
    if tangents is not None:
        t = tangents.copy()
        t[:, 1] = yy*tangents[:, 1]
        t[:, 2] = zy*tangents[:, 1]+zz*tangents[:, 2]
        t[:, :3] -= np.sum(t[:, :3]*n, axis=1)[:, None]*n
        t[:, :3] /= np.linalg.norm(t[:, :3], axis=1)[:, None]
    return n, t


def main():
    import bpy
    from mathutils import Vector
    scene = bpy.context.scene
    assert Path(bpy.data.filepath).resolve() == (FOLDER/'silver-eur.blend').resolve()
    root, hinge = scene.objects['3DS_XL'], scene.objects['Hinge']
    reader = module('dimension_reader', 'analyze_sourced_rig.py')
    refiner = module('dimension_refiner', 'curve_sourced_shell.py')
    source_bytes, doc, binary = reader.load_glb(SOURCE)
    frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    original_locations = [(o, o.location.copy()) for o in root.children_recursive]
    replaced = []
    report = {'source_sha256': hashlib.sha256(source_bytes).hexdigest(), 'parameters': PARAMETERS, 'objects': []}
    success = False
    try:
        for obj, _ in actions:
            obj.animation_data.action = None
        root.rotation_euler = (0, 0, 0)
        hinge.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        origins = {o.name: np.array(o.matrix_world.translation) for o in [root, *root.children_recursive]}
        entries = []
        for node in doc['nodes']:
            if 'mesh' not in node:
                continue
            obj = scene.objects[node['name']]
            assert np.allclose(np.array(obj.matrix_world)[:3, :3], np.eye(3), atol=1e-6)
            primitive = doc['meshes'][node['mesh']]['primitives'][0]
            attrs = primitive['attributes']
            p = reader.accessor(doc, binary, attrs['POSITION']).astype(float)[:, [0, 2, 1]]
            p[:, 1] *= -1
            p += origins[obj.name]
            kind = 'lid' if obj.parent == hinge else 'base'
            if obj.get('source_mesh_index') != 0:
                kind = 'glass'
            entries.append((obj, primitive, p, kind))
        all_points = np.vstack([entry[2] for entry in entries])
        low, high = all_points.min(0), all_points.max(0)
        size = high-low
        assert abs(size[0]-156) < 1e-4 and 92 < size[1] < 93 and 22 < size[2] < 22.5
        depth, height = (93-size[1])/2, size[2]-22
        report.update({'before_closed_xyz_mm': size.tolist(), 'margin_extension_mm': float(depth),
                       'outer_height_reduction_mm': float(height), 'hinge_before_mm': origins[hinge.name].tolist()})
        new_origins = {root.name: origins[root.name]}
        for obj in root.children_recursive:
            kind = 'lid' if obj == hinge or obj.parent == hinge else 'base'
            new_origins[obj.name] = move(origins[obj.name][None, :], kind, depth, height)[0]
        for obj, primitive, p, kind in entries:
            moved = move(p, kind, depth, height)
            shift = moved-p
            rigid = np.max(np.ptp(shift, axis=0)) < 1e-9
            if rigid:
                # Keep the cap's exact local geometry and source frames.
                new_origins[obj.name] = origins[obj.name]+shift[0]
            else:
                attrs = primitive['attributes']
                n = reader.accessor(doc, binary, attrs['NORMAL']).astype(float)[:, [0, 2, 1]]
                n[:, 1] *= -1
                t = None
                if 'TANGENT' in attrs:
                    t = reader.accessor(doc, binary, attrs['TANGENT']).astype(float)[:, [0, 2, 1, 3]]
                    t[:, 1] *= -1
                uv = reader.accessor(doc, binary, attrs['TEXCOORD_0']).astype(float)
                faces = reader.accessor(doc, binary, primitive['indices']).reshape(-1, 3)
                if obj.name in ['Sourced inner lid', 'Sourced graphite chassis']:
                    # Long source triangles must not spread the hinge change
                    # across the preserved contact face. Refine without shrink.
                    assert t is not None
                    edge_filter = None
                    if obj.name == 'Sourced graphite chassis':
                        # Only the rear upper connector needs more geometry.
                        # Preserve unrelated front-side tangent discontinuities.
                        edge_filter = lambda a, b: max(a[1], b[1]) > 31.9 and max(a[2], b[2]) > 9.5
                    p, n, t, uv, faces = refiner.refine(p, n, t, uv, faces, 'lid', edge_filter=edge_filter)
                    moved = move(p, kind, depth, height)
                n, t = frames(p, n, t, kind, depth, height)
                geometry = bpy.data.meshes.new(obj.name+' published envelope')
                geometry.from_pydata((moved-new_origins[obj.name]).tolist(), [], faces.tolist())
                geometry.update()
                for poly in geometry.polygons:
                    poly.use_smooth = True
                layer = geometry.uv_layers.new(name='UVMap')
                indices = np.array([loop.vertex_index for loop in geometry.loops])
                uv[:, 1] = 1-uv[:, 1]
                layer.data.foreach_set('uv', uv[indices].astype(np.float32).ravel())
                geometry.normals_split_custom_set_from_vertices(n.tolist())

                def carry(name, values):
                    vector = values.ndim == 2 and values.shape[1] == 3
                    attribute = geometry.attributes.new(name, 'FLOAT_VECTOR' if vector else 'FLOAT', 'POINT')
                    attribute.data.foreach_set('vector' if vector else 'value', values.astype(np.float32).ravel())

                glb_n = n[:, [0, 2, 1]].copy()
                glb_n[:, 2] *= -1
                carry('_FRAME_N', glb_n)
                if t is not None:
                    glb_t = t[:, [0, 2, 1]].copy()
                    glb_t[:, 2] *= -1
                    carry('_FRAME_T', glb_t)
                    carry('_FRAME_W', t[:, 3])
                for material in obj.data.materials:
                    geometry.materials.append(material)
                replaced.append((obj, obj.data))
                obj.data = geometry
            report['objects'].append({'name': obj.name, 'rigid': bool(rigid),
                                      'maximum_displacement_mm': float(np.linalg.norm(shift, axis=1).max())})
        # Every mesh is directly under Base/Hinge. Anchors have no mesh children.
        for obj in root.children_recursive:
            assert obj.parent.name in new_origins
            obj.location = Vector(new_origins[obj.name]-new_origins[obj.parent.name])
        bpy.context.view_layer.update()
        points = np.array([tuple(o.matrix_world@v.co) for o in root.children_recursive if o.type == 'MESH' for v in o.data.vertices])
        final_size = np.ptp(points, axis=0)
        assert np.max(abs(final_size-[156, 93, 22])) < 2e-5, final_size
        report['after_closed_xyz_mm'] = final_size.tolist()
        report['hinge_after_mm'] = list(hinge.location)
        report['total_triangles'] = sum(len(o.data.polygons) for o in root.children_recursive if o.type == 'MESH')
        root['closed_envelope_fit'] = json.dumps(PARAMETERS)
        root['source_changes'] += ' Matched published 156 x 93 x 22 mm closed envelope by extending front/rear margins and reducing the outer cover height; translated both hinge barrels together and preserved the inner contact face, control shapes and active LCD dimensions.'
        success = True
    finally:
        if not success:
            for obj, mesh in reversed(replaced):
                failed = obj.data
                obj.data = mesh
                bpy.data.meshes.remove(failed)
            for obj, location in original_locations:
                obj.location = location
        for obj, action in actions:
            obj.animation_data.action = action
        scene.frame_set(frame)
        bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-dimensions.blend'))
    module('dimension_exporter', 'texture_sourced_model.py').export_static(root, hinge, OUTPUT, restore_frames=False, export_attributes=True)
    module('dimension_frames', 'curve_sourced_shell.py').restore_export_frames(OUTPUT)
    (FOLDER/'dimensions-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
