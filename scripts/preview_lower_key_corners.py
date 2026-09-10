"""Reversible source-mesh trial for the SELECT/START outer rear corners.

One millimetre is a photographic estimate. No texture, rig or live asset edits.
"""
from pathlib import Path
import importlib
import json
import bpy
import numpy as np
import analyze_sourced_rig as reader
import round_sourced_speaker_holes as refinement
import render_sourced_dimensions as renderer

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    _, doc, binary = reader.load_glb(FOLDER/'silver-restrained-paint.glb')
    saved = []
    report = {}
    try:
        for name, sign in [('Button_SELECT', -1), ('Button_START', 1)]:
            obj = bpy.data.objects[name]
            old = obj.data
            node = next(n for n in doc['nodes'] if n.get('name') == name)
            primitive = doc['meshes'][node['mesh']]['primitives'][0]
            attrs = primitive['attributes']
            p = reader.accessor(doc, binary, attrs['POSITION']).astype(float)[:, [0, 2, 1]]; p[:, 1] *= -1
            n = reader.accessor(doc, binary, attrs['NORMAL']).astype(float)[:, [0, 2, 1]]; n[:, 1] *= -1
            t = reader.accessor(doc, binary, attrs['TANGENT']).astype(float)[:, [0, 2, 1, 3]]; t[:, 1] *= -1
            uv = reader.accessor(doc, binary, attrs['TEXCOORD_0']).astype(float)
            faces = reader.accessor(doc, binary, primitive['indices']).reshape(-1, 3)
            outer = (p[:, 0]*sign).max()
            centre = np.array([outer-1, p[:, 1].max()-1])

            def field(points):
                q = points[:, :2]*[sign, 1]-centre
                r = np.linalg.norm(q, axis=1)
                selected = (q[:, 0] > 0) & (q[:, 1] > 0)
                out = points.copy()
                scale = np.max(q[selected], axis=1)/r[selected]
                out[selected, :2] += q[selected]*(scale-1)[:, None]*[sign, 1]
                return out

            p, n, t, uv, faces = refinement.refine_speaker_patch(
                p, n, t, uv, faces, 'lid',
                edge_filter=lambda a, b: max(a[0]*sign, b[0]*sign) > outer-1.4 and max(a[1], b[1]) > centre[1]-.4)
            changed = field(p)
            columns = []
            for axis in range(3):
                delta = np.zeros(3); delta[axis] = .0001
                columns.append((field(p+delta)-field(p-delta))/.0002)
            jacobian = np.stack(columns, axis=2)
            determinant = np.linalg.det(jacobian)
            assert determinant.min() > .3
            n = np.linalg.solve(jacobian.swapaxes(1, 2), n[..., None])[..., 0]
            n /= np.linalg.norm(n, axis=1)[:, None]
            mesh = bpy.data.meshes.new(name+' rounded corner trial')
            mesh.from_pydata(changed.tolist(), [], faces.tolist()); mesh.update()
            for poly in mesh.polygons: poly.use_smooth = True
            loops = np.array([loop.vertex_index for loop in mesh.loops])
            uv[:, 1] = 1-uv[:, 1]
            mesh.uv_layers.new(name=old.uv_layers[0].name).data.foreach_set('uv', uv[loops].astype(np.float32).ravel())
            mesh.normals_split_custom_set_from_vertices(n.tolist())
            for material in old.materials: mesh.materials.append(material)
            obj.data = mesh; saved.append((obj, old, mesh))
            report[name] = {'radius_estimate_mm': 1, 'triangles': len(faces),
                            'max_displacement_mm': float(np.linalg.norm(changed-p, axis=1).max()),
                            'minimum_jacobian': float(determinant.min())}
        importlib.reload(renderer)
        renderer.VIEWS = [('keys', -155, (0, -40, 160), (0, -40, 14), 95, 0)]
        renderer.main('lower-keys-rounded-trial', resolution=(1400, 650))
        (FOLDER/'lower-key-corner-trial.json').write_text(json.dumps(report, indent=2)+'\n')
        print(json.dumps(report))
    finally:
        for obj, old, mesh in saved:
            obj.data = old
            bpy.data.meshes.remove(mesh)


if __name__ == '__main__':
    main()
