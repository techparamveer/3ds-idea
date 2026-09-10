"""Round sourced lower-key caps and matching chassis recess as one local pass."""
from pathlib import Path
import importlib
import json
import bpy
import numpy as np
import analyze_sourced_rig as reader
import round_sourced_speaker_holes as refinement
import render_sourced_dimensions as renderer
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main(install=False):
    assert Path(bpy.data.filepath).name == 'silver-restrained-paint.blend'
    _, doc, binary = reader.load_glb(FOLDER/'silver-restrained-paint.glb')
    saved, corners, report = [], [], {}
    keep_meshes = False
    try:
        for name, sign in [('Button_SELECT', -1), ('Button_START', 1), ('Sourced graphite chassis', 0)]:
            obj = bpy.data.objects[name]; old = obj.data
            assert max(abs(a) for a in obj.rotation_euler) < 1e-6
            offset = np.array(obj.location)
            node = next(n for n in doc['nodes'] if n.get('name') == name)
            primitive = doc['meshes'][node['mesh']]['primitives'][0]; attrs = primitive['attributes']
            p = reader.accessor(doc, binary, attrs['POSITION']).astype(float)[:, [0, 2, 1]]; p[:, 1] *= -1; p += offset
            n = reader.accessor(doc, binary, attrs['NORMAL']).astype(float)[:, [0, 2, 1]]; n[:, 1] *= -1
            t = reader.accessor(doc, binary, attrs['TANGENT']).astype(float)[:, [0, 2, 1, 3]]; t[:, 1] *= -1
            uv = reader.accessor(doc, binary, attrs['TEXCOORD_0']).astype(float)
            faces = reader.accessor(doc, binary, primitive['indices']).reshape(-1, 3)
            old_count = len(faces)
            if sign:
                centre = np.array([(p[:, 0]*sign).max()-1, p[:, 1].max()-1])
                specs = [(sign, centre, np.ones(2))]
                corners.append((sign, centre, np.array([(40.36148 if sign < 0 else 39.94071)-centre[0], -39.14468-centre[1]])))
            else:
                specs = corners

            def field(points):
                out = points.copy()
                for direction, centre, radius in specs:
                    q = (points[:, :2]*[direction, 1]-centre)/radius
                    distance = np.linalg.norm(q, axis=1)
                    extent = q.max(axis=1)
                    selected = (q[:, 0] > 0) & (q[:, 1] > 0)
                    weight = 1-refinement.smooth(extent[selected], 1, 2.5)
                    if not sign: weight *= refinement.smooth(points[selected, 2], 12.5, 13.6)
                    amount = (extent[selected]/distance[selected]-1)*weight
                    out[selected, :2] += q[selected]*amount[:, None]*radius*[direction, 1]
                return out

            def eligible(a, b):
                if sign:
                    return max(a[0]*sign, b[0]*sign) > specs[0][1][0]-.4 and max(a[1], b[1]) > specs[0][1][1]-.4
                if not sign and min(a[2], b[2]) < 12.5: return False
                for direction, centre, radius in specs:
                    qa = (a[:2]*[direction, 1]-centre)/radius
                    qb = (b[:2]*[direction, 1]-centre)/radius
                    if np.all(np.maximum(qa, qb) > -.25) and np.all(np.minimum(qa, qb) < 2.6): return True
                return False

            print('Refining '+name, flush=True)
            p, n, t, uv, faces = refinement.refine_speaker_patch(p, n, t, uv, faces, 'lid', edge_filter=eligible, maximum_iterations=20)
            changed = field(p)
            columns = []
            for axis in range(3):
                delta = np.zeros(3); delta[axis] = .0001
                columns.append((field(p+delta)-field(p-delta))/.0002)
            jacobian = np.stack(columns, axis=2); determinant = np.linalg.det(jacobian)
            assert determinant.min() > .3
            n = np.linalg.solve(jacobian.swapaxes(1, 2), n[..., None])[..., 0]; n /= np.linalg.norm(n, axis=1)[:, None]
            t[:, :3] = np.einsum('nij,nj->ni', jacobian, t[:, :3])
            t[:, :3] -= n*np.sum(n*t[:, :3], axis=1)[:, None]; t[:, :3] /= np.linalg.norm(t[:, :3], axis=1)[:, None]
            mesh = bpy.data.meshes.new(name+' rounded lower key strip')
            mesh.from_pydata((changed-offset).tolist(), [], faces.tolist()); mesh.update()
            for poly in mesh.polygons: poly.use_smooth = True
            loops = np.array([loop.vertex_index for loop in mesh.loops]); uv[:, 1] = 1-uv[:, 1]
            mesh.uv_layers.new(name=old.uv_layers[0].name).data.foreach_set('uv', uv[loops].astype(np.float32).ravel())
            mesh.normals_split_custom_set_from_vertices(n.tolist())
            for key, value in [('_FRAME_N', n[:, [0, 2, 1]].copy()), ('_FRAME_T', t[:, [0, 2, 1]].copy()), ('_FRAME_W', t[:, 3])]:
                vector = value.ndim == 2
                if vector: value[:, 2] *= -1
                attr = mesh.attributes.new(key, 'FLOAT_VECTOR' if vector else 'FLOAT', 'POINT')
                attr.data.foreach_set('vector' if vector else 'value', value.astype(np.float32).ravel())
            for material in old.materials: mesh.materials.append(material)
            obj.data = mesh; saved.append((obj, old, mesh))
            report[name] = {'corners': [{'direction': s, 'centre_mm': c.tolist(), 'radius_mm': r.tolist()} for s, c, r in specs],
                            'triangles_before': old_count, 'triangles_after': len(faces),
                            'max_displacement_mm': float(np.linalg.norm(changed-p, axis=1).max()),
                            'minimum_jacobian': float(determinant.min())}
        importlib.reload(renderer)
        renderer.VIEWS = [('keys', -155, (0, -40, 160), (0, -40, 14), 95, 0)]
        renderer.main('lower-keys-joint', resolution=(1400, 650))
        (FOLDER/'lower-key-strip-report.json').write_text(json.dumps(report, indent=2)+'\n')
        if install:
            root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
            root['lower_key_corners'] = json.dumps(report)
            root['source_changes'] += ' Rounded SELECT/START outer rear corners and corresponding deck recess, retaining cap placement and existing textures.'
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-lower-keys.blend'))
            output = FOLDER/'silver-lower-keys.glb'
            exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
            frames.restore_export_frames(output)
            keep_meshes = True
        print(json.dumps(report))
    finally:
        if not keep_meshes:
            for obj, old, mesh in saved:
                obj.data = old; bpy.data.meshes.remove(mesh)


if __name__ == '__main__':
    main()
