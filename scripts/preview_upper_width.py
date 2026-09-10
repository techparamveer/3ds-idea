"""Reversible 115 mm upper opening trial against whole-lid calibrated references."""
from pathlib import Path
import hashlib
import json
import numpy as np
import bpy
import fit_sourced_dimensions as pipeline

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'
PARAMETERS = {
    'side_inset_mm': -1.5,
    'x_plateau_mm': [54, 59],
    'x_support_mm': [47, 64],
    'front_y_transition_mm': [-39.5, -37.5],
    'hinge_y_transition_mm': [31.9, 34.2],
    'back_z_transition_mm': [17, 18],
    'interpretation': 'Image-derived upper aperture correction. Preserve the LCD, side speakers, controls, outer cover and hinge. Not a manufacturer measurement.',
}


def move(points):
    x = points[:, 0] + .2103884369
    y, z = points[:, 1], points[:, 2]
    outer, inner = PARAMETERS['x_support_mm'], PARAMETERS['x_plateau_mm']
    weight = pipeline.smooth(abs(x), [outer[0], inner[0]]) * (1-pipeline.smooth(abs(x), [inner[1], outer[1]]))
    weight *= pipeline.smooth(y, PARAMETERS['front_y_transition_mm']) * (1-pipeline.smooth(y, PARAMETERS['hinge_y_transition_mm']))
    weight *= 1-pipeline.smooth(z, PARAMETERS['back_z_transition_mm'])
    result = points.copy()
    result[:, 0] -= PARAMETERS['side_inset_mm']*np.sign(x)*weight
    return result


def main():
    assert Path(bpy.data.filepath).resolve() == (FOLDER/'silver-power-finish.blend').resolve()
    reader = pipeline.module('front_reader', 'analyze_sourced_rig.py')
    data, doc, binary = reader.load_glb(FOLDER/'silver-power-finish.glb')
    scene = bpy.context.scene
    root, hinge = scene.objects['3DS_XL'], scene.objects['Hinge']
    obj = scene.objects['Sourced inner lid']
    frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    old_matrices=[(o,o.matrix_basis.copy()) for o in (root,hinge)]
    old_mesh = obj.data
    new_mesh = None
    success = False
    try:
        for o, _ in actions:
            o.animation_data.action = None
        root.rotation_euler = (0, 0, 0)
        hinge.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        origin = np.array(obj.matrix_world.translation)
        node = next(n for n in doc['nodes'] if n['name'] == obj.name)
        primitive = doc['meshes'][node['mesh']]['primitives'][0]
        attrs = primitive['attributes']
        def native(attribute):
            values = reader.accessor(doc, binary, attrs[attribute]).astype(float)
            result = values[:, [0, 2, 1, 3] if values.shape[1] == 4 else [0, 2, 1]].copy()
            result[:, 1] *= -1
            return result
        points, normals, tangents = native('POSITION')+origin, native('NORMAL'), native('TANGENT')
        uv = reader.accessor(doc, binary, attrs['TEXCOORD_0']).astype(float)
        faces = reader.accessor(doc, binary, primitive['indices']).reshape(-1, 3)
        moved = move(points)
        jacobian = np.stack([(move(points+np.eye(3)[i]*.001)-move(points-np.eye(3)[i]*.001))/.002
                             for i in range(3)], axis=2)
        determinant = np.linalg.det(jacobian)
        # Outward movement compresses the unchanged five-mm outer transition;
        # measured minimum is .55, still positive and nonsingular.
        assert min(determinant) > .5, 'Aperture deformation folds or collapses a surface'
        normals = np.linalg.solve(jacobian.transpose(0, 2, 1), normals[..., None])[..., 0]
        normals /= np.linalg.norm(normals, axis=1)[:, None]
        tangents[:, :3] = np.einsum('nij,nj->ni', jacobian, tangents[:, :3])
        tangents[:, :3] -= np.sum(normals*tangents[:, :3], axis=1)[:, None]*normals
        tangents[:, :3] /= np.linalg.norm(tangents[:, :3], axis=1)[:, None]
        new_mesh = bpy.data.meshes.new('Sourced inner lid narrower aperture')
        new_mesh.from_pydata((moved-origin).tolist(), [], faces.tolist())
        new_mesh.update()
        for polygon in new_mesh.polygons:
            polygon.use_smooth = True
        indices = np.array([loop.vertex_index for loop in new_mesh.loops])
        uv[:, 1] = 1-uv[:, 1]
        new_mesh.uv_layers.new(name='UVMap').data.foreach_set('uv', uv[indices].astype(np.float32).ravel())
        new_mesh.normals_split_custom_set_from_vertices(normals.tolist())
        def carry(name, values):
            vector = values.ndim == 2
            attribute = new_mesh.attributes.new(name, 'FLOAT_VECTOR' if vector else 'FLOAT', 'POINT')
            attribute.data.foreach_set('vector' if vector else 'value', values.astype(np.float32).ravel())
        for name, values in [('_FRAME_N', normals), ('_FRAME_T', tangents[:, :3])]:
            glb = values[:, [0, 2, 1]].copy()
            glb[:, 2] *= -1
            carry(name, glb)
        carry('_FRAME_W', tangents[:, 3])
        for material in old_mesh.materials:
            new_mesh.materials.append(material)
        obj.data = new_mesh
        bpy.context.view_layer.update()
        all_points = np.array([tuple(o.matrix_world@v.co) for o in root.children_recursive
                               if o.type == 'MESH' for v in o.data.vertices])
        size = np.ptp(all_points, axis=0)
        assert np.max(abs(size-[156, 93, 22])) < 1e-4, size.tolist()
        report = {'source_sha256': hashlib.sha256(data).hexdigest(), 'parameters': PARAMETERS,
                  'changed_mesh': obj.name, 'changed_vertices': int(np.sum(np.any(abs(moved-points)>1e-8, axis=1))),
                  'maximum_displacement_mm': float(np.max(np.linalg.norm(moved-points, axis=1))),
                  'minimum_jacobian_determinant': float(min(determinant)), 'closed_xyz_mm': size.tolist()}
        import importlib,audit_sourced_front
        importlib.reload(audit_sourced_front)
        audit_sourced_front.main('layout-wide-trial')
        print(json.dumps(report))
    finally:
        if not success and new_mesh:
            obj.data = old_mesh
            bpy.data.meshes.remove(new_mesh)
        for o, action in actions:
            o.animation_data.action = action
        scene.frame_set(frame)
        for o,m in old_matrices:o.matrix_basis=m
        bpy.context.view_layer.update()
    (FOLDER/'layout-wide-trial-report.json').write_text(json.dumps(report, indent=2)+'\n')

if __name__=='__main__':main()
