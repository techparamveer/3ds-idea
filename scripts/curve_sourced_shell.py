"""Apply measured, shallow broad-face curvature to the preserved sourced XL.

Run main() through Blender MCP with silver-source.blend open. This writes a
separate silver-curved checkpoint. Original UV artwork, controls, hinge, inner
faces and source checkpoints remain preserved. Mesh refinement interpolates the
source's own shading frames; exported custom attributes carry them across the
Blender exporter, which otherwise recomputes incompatible tangent handedness.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import struct
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'model/candidates/joshua-xl'
SOURCE = FOLDER / 'silver-source.glb'
OUTPUT = FOLDER / 'silver-curved.glb'
PARAMETERS = {
    'lid': {'center_xy': [-.21038844, -.336445], 'xx': 3.606189186842222e-5, 'yy': 5.2627505398761533e-5,
            'x_taper': [65, 77.5], 'y_taper': [30, 45], 'z_gate': [17, 21.9], 'sign': -1},
    'base': {'center_xy': [-.21038844, -5.8], 'xx': 6.600533540204883e-5, 'yy': 1.6094834918654625e-4,
             'x_taper': [65, 77.5], 'y_taper': [30, 38], 'z_gate': [2, 5], 'sign': 1},
    'maximum_edge_mm': 2.5,
    'reference': 'docs/reference-scan-measurements.json',
    'interpretation': 'Symmetric quadratic terms from widest fitted broad-face region; placement tilt and asymmetric scan twist excluded. Smooth taper preserves existing perimeter and interior mating faces. One physical scan, not manufacturer CAD.',
}
LID_ATTACHMENTS = {13, 14, 36, 37, 42, 43, 50}


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / file)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def smooth(value, low, high):
    t = np.clip((value-low)/(high-low), 0, 1)
    return t*t*(3-2*t)


def displacement(points, kind):
    config = PARAMETERS[kind]
    x, y = (points[:, :2] - config['center_xy']).T
    taper = (1-smooth(abs(x), *config['x_taper'])) * (1-smooth(abs(y), *config['y_taper']))
    gate = smooth(points[:, 2], *config['z_gate'])
    if kind == 'base':
        gate = 1-gate
    return config['sign']*(config['xx']*x*x + config['yy']*y*y)*taper*gate


def deform(points, normals, tangents, kind):
    result = points.copy()
    result[:, 2] += displacement(points, kind)
    # Central differences evaluate the explicit smooth deformation independently
    # of the artist's custom normals. It changes only the final Jacobian row.
    derivatives = []
    for axis in range(3):
        offset = np.zeros(3); offset[axis] = .001
        derivatives.append((displacement(points+offset, kind)-displacement(points-offset, kind))/.002)
    dx, dy, dz = derivatives
    vertical = 1+dz
    assert np.min(vertical) > .7, 'deformation folds or excessively compresses the surface'
    changed_n = normals.copy()
    changed_n[:, 2] = normals[:, 2]/vertical
    changed_n[:, 0] -= dx*changed_n[:, 2]
    changed_n[:, 1] -= dy*changed_n[:, 2]
    changed_n /= np.linalg.norm(changed_n, axis=1)[:, None]
    changed_t = None
    if tangents is not None:
        changed_t = tangents.copy()
        changed_t[:, 2] += dx*tangents[:, 0] + dy*tangents[:, 1] + dz*tangents[:, 2]
        changed_t[:, :3] -= np.sum(changed_t[:, :3]*changed_n, axis=1)[:, None]*changed_n
        changed_t[:, :3] /= np.linalg.norm(changed_t[:, :3], axis=1)[:, None]
    return result, changed_n, changed_t


def refine(positions, normals, tangents, uvs, faces, kind, *, edge_filter=None, max_iterations=12):
    """Conforming shared-edge bisection; no Catmull-Clark shrink or UV re-unwrap."""
    values = [np.r_[p, n, t, uv] for p, n, t, uv in zip(positions, normals, tangents, uvs)]
    faces = [tuple(map(int, f)) for f in faces]
    for _ in range(max_iterations):
        edges = set()
        for a, b, c in faces:
            for i, j in [(a, b), (b, c), (c, a)]:
                p, q = values[i][:3], values[j][:3]
                affected = edge_filter(p, q) if edge_filter is not None else (
                    kind == 'lid' or min(p[2], q[2]) < PARAMETERS['base']['z_gate'][1])
                if affected and np.linalg.norm(p-q) > PARAMETERS['maximum_edge_mm']:
                    edges.add(tuple(sorted((i, j))))
        if not edges:
            break
        middle = {}
        for i, j in sorted(edges):
            assert values[i][9] == values[j][9], 'refinement crosses an incompatible source tangent seam'
            value = (values[i]+values[j])/2
            value[3:6] /= np.linalg.norm(value[3:6])
            value[6:9] -= value[3:6]*np.dot(value[3:6], value[6:9])
            value[6:9] /= np.linalg.norm(value[6:9])
            middle[(i, j)] = len(values)
            values.append(value)
        output = []
        for a, b, c in faces:
            ab, bc, ca = (middle.get(tuple(sorted(pair))) for pair in [(a, b), (b, c), (c, a)])
            marked = sum(x is not None for x in (ab, bc, ca))
            if marked == 0: output.append((a, b, c))
            elif marked == 3: output.extend([(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)])
            elif marked == 1:
                if ab is not None: output.extend([(a, ab, c), (ab, b, c)])
                elif bc is not None: output.extend([(a, b, bc), (a, bc, c)])
                else: output.extend([(a, b, ca), (ca, b, c)])
            else:
                if ab is None: output.extend([(c, ca, bc), (a, b, ca), (b, bc, ca)])
                elif bc is None: output.extend([(a, ab, ca), (b, c, ab), (c, ca, ab)])
                else: output.extend([(b, bc, ab), (c, a, bc), (a, ab, bc)])
        faces = output
    else:
        raise RuntimeError('Refinement did not converge')
    data = np.asarray(values)
    return data[:, :3], data[:, 3:6], data[:, 6:10], data[:, 10:12], np.asarray(faces)


def restore_export_frames(path):
    audit = module('curve_glb_reader', 'analyze_sourced_rig.py')
    _, doc, binary = audit.load_glb(path)
    blob = bytearray(binary)
    parts = 0
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            attrs = primitive['attributes']
            if '_FRAME_N' not in attrs:
                raise RuntimeError('Derived export lost its carried normal frame: '+mesh['name'])
            attrs['NORMAL'] = attrs.pop('_FRAME_N')
            normal = audit.accessor(doc, binary, attrs['NORMAL'])
            assert np.max(abs(np.linalg.norm(normal, axis=1)-1)) < 2e-5
            if '_FRAME_T' in attrs:
                xyz = audit.accessor(doc, binary, attrs.pop('_FRAME_T'))
                w = audit.accessor(doc, binary, attrs.pop('_FRAME_W'))
                assert np.max(abs(np.sum(xyz*normal, axis=1))) < 2e-5
                assert np.isin(w, [-1, 1]).all()
                values = np.column_stack([xyz, w]).astype('<f4')
                blob.extend(b'\0'*(-len(blob)%4))
                view = len(doc['bufferViews'])
                doc['bufferViews'].append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': values.nbytes, 'target': 34962})
                blob.extend(values.tobytes())
                attrs['TANGENT'] = len(doc['accessors'])
                doc['accessors'].append({'bufferView': view, 'componentType': 5126, 'count': len(values), 'type': 'VEC4'})
            parts += 1
    doc['buffers'][0]['byteLength'] = len(blob)
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' '*(-len(encoded)%4)
    blob.extend(b'\0'*(-len(blob)%4))
    data = struct.pack('<III', 0x46546c67, 2, 28+len(encoded)+len(blob)) + struct.pack('<II', len(encoded), 0x4e4f534a) + encoded + struct.pack('<II', len(blob), 0x004e4942) + blob
    pending = path.with_suffix('.pending.glb')
    pending.write_bytes(data)
    pending.replace(path)
    return parts


def main():
    import bpy
    from mathutils import Vector
    scene = bpy.context.scene
    root, hinge = scene.objects['3DS_XL'], scene.objects['Hinge']
    assert Path(bpy.data.filepath) == FOLDER / 'silver-source.blend'
    assert root.get('source_finish') == 'silver-adaptation'
    audit = module('curve_source_reader', 'analyze_sourced_rig.py')
    source_bytes, doc, binary = audit.load_glb(SOURCE)
    frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    old_meshes = []
    report = {'source_sha256': hashlib.sha256(source_bytes).hexdigest(), 'parameters': PARAMETERS, 'objects': [],
              'reference_only_scan_vertices_used_in_model': False}
    success = False
    try:
        for obj, _ in actions: obj.animation_data.action = None
        root.rotation_euler = (0, 0, 0); hinge.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        for node in doc['nodes']:
            if 'mesh' not in node: continue
            obj = scene.objects[node['name']]
            primitive = doc['meshes'][node['mesh']]['primitives'][0]
            attrs = primitive['attributes']
            p = audit.accessor(doc, binary, attrs['POSITION']).astype(float)[:, [0, 2, 1]]; p[:, 1] *= -1
            n = audit.accessor(doc, binary, attrs['NORMAL']).astype(float)[:, [0, 2, 1]]; n[:, 1] *= -1
            t = None
            if 'TANGENT' in attrs:
                t = audit.accessor(doc, binary, attrs['TANGENT']).astype(float)[:, [0, 2, 1, 3]]; t[:, 1] *= -1
            uv = audit.accessor(doc, binary, attrs['TEXCOORD_0']).astype(float)
            faces = audit.accessor(doc, binary, primitive['indices']).reshape(-1, 3)
            # Imported rigid component objects use translation only in closed rest.
            matrix = np.array(obj.matrix_world)
            assert np.allclose(matrix[:3, :3], np.eye(3), atol=1e-6)
            offset = matrix[:3, 3]
            p += offset
            before_faces = len(faces)
            cid = obj.get('source_component_id')
            kind = None
            if obj.name == 'Sourced outer lid': kind = 'lid'
            elif obj.parent.name == 'Base' and not obj.name.startswith('Button_'): kind = 'base'
            if obj.name in ['Sourced outer lid', 'Sourced graphite chassis']:
                assert t is not None
                p, n, t, uv, faces = refine(p, n, t, uv, faces, kind)
            undeformed = p.copy()
            if kind:
                p, n, t = deform(p, n, t, kind)
            elif obj.parent == hinge and obj.get('source_mesh_index') == 0 and cid in LID_ATTACHMENTS:
                center = (p.min(axis=0)+p.max(axis=0))/2
                center[2] = 22.21
                p[:, 2] += displacement(center[None, :], 'lid')[0]
            changed = np.linalg.norm(p-undeformed, axis=1)
            geometry = bpy.data.meshes.new(obj.name+' measured broad curvature')
            geometry.from_pydata((p-offset).tolist(), [], faces.tolist())
            geometry.update()
            for poly in geometry.polygons: poly.use_smooth = True
            layer = geometry.uv_layers.new(name='UVMap')
            indices = np.array([loop.vertex_index for loop in geometry.loops])
            blender_uv = uv.copy(); blender_uv[:, 1] = 1-blender_uv[:, 1]
            layer.data.foreach_set('uv', blender_uv[indices].astype(np.float32).ravel())
            geometry.normals_split_custom_set_from_vertices(n.tolist())
            def carry(name, values):
                vector = values.ndim == 2 and values.shape[1] == 3
                attribute = geometry.attributes.new(name, 'FLOAT_VECTOR' if vector else 'FLOAT', 'POINT')
                attribute.data.foreach_set('vector' if vector else 'value', values.astype(np.float32).ravel())
            glb_n = n[:, [0, 2, 1]].copy(); glb_n[:, 2] *= -1
            carry('_FRAME_N', glb_n)
            if t is not None:
                glb_t = t[:, [0, 2, 1]].copy(); glb_t[:, 2] *= -1
                carry('_FRAME_T', glb_t); carry('_FRAME_W', t[:, 3])
            for material in obj.data.materials: geometry.materials.append(material)
            old_meshes.append((obj, obj.data))
            obj.data = geometry
            report['objects'].append({'name': obj.name, 'triangles_before': before_faces, 'triangles_after': len(faces),
                                      'maximum_displacement_mm': float(changed.max()), 'vertices_moved': int((changed > 1e-7).sum())})
        root['shell_curvature'] = json.dumps(PARAMETERS)
        root['source_tangent_frames'] = 'Source normal/tangent frames interpolated during shared-edge refinement, transformed by the shallow curvature Jacobian, and carried through export. Tangent W preserved.'
        root['source_changes'] += ' Added shallow broad-face curvature measured from a physical XL reference scan, preserving rolled boundaries and interior mating faces; attached exterior cameras follow the lid.'
        report['total_triangles'] = sum(item['triangles_after'] for item in report['objects'])
        success = True
    finally:
        if not success:
            for obj, mesh in reversed(old_meshes):
                failed = obj.data; obj.data = mesh; bpy.data.meshes.remove(failed)
        for obj, action in actions: obj.animation_data.action = action
        scene.frame_set(frame)
        bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-curved.blend'))
    exporter = module('curve_exporter', 'texture_sourced_model.py')
    exporter.export_static(root, hinge, OUTPUT, restore_frames=False, export_attributes=True)
    report['frames_restored_parts'] = restore_export_frames(OUTPUT)
    (FOLDER/'curvature-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'file': str(OUTPUT), 'triangles': report['total_triangles'],
                      'changed': [item for item in report['objects'] if item['maximum_displacement_mm'] > 1e-7]}, indent=2))


if __name__ == '__main__':
    main()
