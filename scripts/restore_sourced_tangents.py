"""Restore the creator's explicit normal/tangent frames after Blender glTF export.

Blender imports normals but discards source tangents. Recomputing tangents after
its UV V conversion does not reproduce this asset's explicit glTF tangent W.
This postprocess restores source NORMAL/TANGENT data, transformed into each rigid
component's exported local space. It never changes positions, UVs, indices,
materials, image bytes, hierarchy or the editable Blender file.

Run through the bundled Python or Blender's Python (NumPy required):
  python scripts/restore_sourced_tangents.py path/to/export.glb       # audit
  python scripts/restore_sourced_tangents.py path/to/export.glb --write

The original component triangle order is checked using every corner's position,
UV and normal before it is used as correspondence. Reordered/rebuilt geometry
fails explicitly rather than assigning plausible but unverified tangent frames.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import struct
import tempfile

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'model/candidates/joshua-xl'
SOURCE = FOLDER / 'geometry-inspection.glb'
COMPONENTS = FOLDER / 'component-report.json'

_spec = importlib.util.spec_from_file_location('sourced_geometry_audit', ROOT / 'scripts/analyze_sourced_rig.py')
_audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_audit)


def local_matrix(node):
    if 'matrix' in node:
        return np.asarray(node['matrix'], dtype=float).reshape(4, 4).T
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    rotation = np.array([
        [1 - 2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
        [2*(x*y+z*w), 1 - 2*(x*x+z*z), 2*(y*z-x*w)],
        [2*(x*z-y*w), 2*(y*z+x*w), 1 - 2*(x*x+y*y)],
    ])
    result = np.eye(4)
    result[:3, :3] = rotation @ np.diag(node.get('scale', [1, 1, 1]))
    result[:3, 3] = node.get('translation', [0, 0, 0])
    return result


def restore_file(path, *, write=False, source=SOURCE, component_report=COMPONENTS):
    path, source = Path(path), Path(source)
    source_raw, original, source_binary = _audit.load_glb(source)
    report = json.loads(Path(component_report).read_text())
    assert hashlib.sha256(source_raw).hexdigest() == report['source_sha256'], 'component report/source mismatch'
    raw, document, binary = _audit.load_glb(path)
    nodes = document['nodes']
    root_index = next(i for i, node in enumerate(nodes) if node.get('name') == '3DS_XL')
    root = nodes[root_index]
    parents = {child: i for i, node in enumerate(nodes) for child in node.get('children', [])}
    matrices = {root_index: np.eye(4)}

    def in_root(index):
        if index not in matrices:
            assert index in parents, 'sourced mesh must descend from 3DS_XL'
            matrices[index] = in_root(parents[index]) @ local_matrix(nodes[index])
        return matrices[index]

    hinge_index = next(i for i, node in enumerate(nodes) if node.get('name') == 'Hinge')
    hinge_matrix = in_root(hinge_index)
    assert np.allclose(hinge_matrix[:3, :3], np.eye(3), atol=1e-6), 'export must use the closed hinge rest pose'
    hinge = hinge_matrix[:3, 3]
    scale = float(root['extras']['source_uniform_scale_to_mm'])
    assert scale > 0
    axis = np.asarray(report['hinge_circle_candidate']['axis_point_raw'], dtype=float)
    angle = math.radians(report['screen_pose']['inferred_open_angle_degrees'])
    close = np.array([[1, 0, 0], [0, math.cos(angle), -math.sin(angle)], [0, math.sin(angle), math.cos(angle)]])
    lids = set(report['rig_assignment_candidates']['main_primitive_lid_components'])
    source_primitive = original['meshes'][0]['primitives'][0]
    attributes = source_primitive['attributes']
    source_positions = _audit.accessor(original, source_binary, attributes['POSITION']).astype(float)
    source_normals = _audit.accessor(original, source_binary, attributes['NORMAL']).astype(float)
    source_tangents = _audit.accessor(original, source_binary, attributes['TANGENT']).astype(float)
    source_uvs = _audit.accessor(original, source_binary, attributes['TEXCOORD_0']).astype(float)
    source_faces = _audit.accessor(original, source_binary, source_primitive['indices']).reshape(-1, 3)
    output_binary = bytearray(binary)
    summary = {'path': str(path), 'write': write, 'parts': 0, 'vertices': 0,
               'max_position_error_mm': 0., 'max_uv_error': 0., 'max_input_normal_error': 0.,
               'tangent_w_changes': 0, 'restored_attributes': ['NORMAL', 'TANGENT']}
    seen = set()

    def append_attribute(values, type_name):
        data = np.asarray(values, dtype='<f4').tobytes()
        output_binary.extend(b'\0' * (-len(output_binary) % 4))
        offset = len(output_binary)
        output_binary.extend(data)
        view_index = len(document['bufferViews'])
        document['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(data), 'target': 34962})
        accessor_index = len(document['accessors'])
        document['accessors'].append({'bufferView': view_index, 'componentType': 5126,
                                      'count': len(values), 'type': type_name})
        return accessor_index

    for node_index, node in enumerate(nodes):
        extras = node.get('extras', {})
        if extras.get('source_mesh_index') != 0:
            continue  # Other source primitives never had explicit tangent data.
        cid = extras['source_component_id']
        assert cid not in seen, 'duplicate component'
        seen.add(cid)
        part = next(item for item in report['meshes'][0]['components'] if item['id'] == cid)
        primitives = document['meshes'][node['mesh']]['primitives']
        assert len(primitives) == 1, f'{node["name"]}: component must have one primitive'
        primitive = primitives[0]
        target_attributes = primitive['attributes']
        positions = _audit.accessor(document, binary, target_attributes['POSITION']).astype(float)
        normals = _audit.accessor(document, binary, target_attributes['NORMAL']).astype(float)
        uvs = _audit.accessor(document, binary, target_attributes['TEXCOORD_0']).astype(float)
        indices = _audit.accessor(document, binary, primitive['indices']).reshape(-1)
        expected_ids = source_faces[part['triangle_indices']].reshape(-1)
        assert len(indices) == len(expected_ids), f'{node["name"]}: source triangle count changed'
        rotation = close if cid in lids else np.eye(3)
        expected_positions = ((source_positions[expected_ids] - axis) @ rotation.T) * scale + hinge
        expected_normals = source_normals[expected_ids] @ rotation.T
        matrix = in_root(node_index)
        linear = matrix[:3, :3]
        assert np.linalg.det(linear) > 0, f'{node["name"]}: reflected object transform is unsupported'
        lengths = np.linalg.norm(linear, axis=0)
        assert np.allclose(lengths, lengths[0], atol=1e-6), 'nonuniform component scale is unsupported'
        rotation_to_root = linear / lengths[0]
        assert np.allclose(rotation_to_root.T @ rotation_to_root, np.eye(3), atol=1e-6), 'sheared component is unsupported'
        actual_positions = positions[indices] @ linear.T + matrix[:3, 3]
        actual_normals = normals[indices] @ rotation_to_root.T
        position_error = float(np.max(np.linalg.norm(actual_positions - expected_positions, axis=1)))
        uv_error = float(np.max(np.abs(uvs[indices] - source_uvs[expected_ids])))
        normal_error = float(np.max(np.linalg.norm(actual_normals - expected_normals, axis=1)))
        assert position_error < .002, f'{node["name"]}: source corner positions/order differ ({position_error} mm)'
        assert uv_error < 2e-6, f'{node["name"]}: source UVs/order differ ({uv_error}); repair V before restoring frames'
        assert normal_error < .005, f'{node["name"]}: source normals/order differ ({normal_error})'
        summary['max_position_error_mm'] = max(summary['max_position_error_mm'], position_error)
        summary['max_uv_error'] = max(summary['max_uv_error'], uv_error)
        summary['max_input_normal_error'] = max(summary['max_input_normal_error'], normal_error)
        restored_normals = np.full_like(normals, np.nan)
        restored_tangents = np.full((len(positions), 4), np.nan)
        expected_tangents = source_tangents[expected_ids].copy()
        expected_tangents[:, :3] = expected_tangents[:, :3] @ rotation.T @ rotation_to_root
        expected_normals = expected_normals @ rotation_to_root
        for corner, index in enumerate(indices):
            if not np.isnan(restored_tangents[index, 0]):
                assert np.allclose(restored_tangents[index], expected_tangents[corner], atol=2e-6, rtol=0), f'{node["name"]}: merged source tangent seam; preserve vertex splits when exporting'
                assert np.allclose(restored_normals[index], expected_normals[corner], atol=2e-6, rtol=0), f'{node["name"]}: merged source normal seam'
            restored_normals[index] = expected_normals[corner]
            restored_tangents[index] = expected_tangents[corner]
        assert np.isfinite(restored_tangents).all() and np.isfinite(restored_normals).all(), 'unreferenced exported vertices'
        if 'TANGENT' in target_attributes:
            previous = _audit.accessor(document, binary, target_attributes['TANGENT'])
            summary['tangent_w_changes'] += int(np.count_nonzero(previous[:, 3] != restored_tangents[:, 3]))
        target_attributes['NORMAL'] = append_attribute(restored_normals, 'VEC3')
        target_attributes['TANGENT'] = append_attribute(restored_tangents, 'VEC4')
        summary['parts'] += 1
        summary['vertices'] += len(positions)

    assert seen == {part['id'] for part in report['meshes'][0]['components']}, 'source body component missing'
    document['buffers'][0]['byteLength'] = len(output_binary)
    root['extras']['source_tangent_frames'] = 'Original NORMAL and TANGENT restored per source triangle corner; rigid closing rotation applied; tangent W preserved.'
    if write:
        json_bytes = json.dumps(document, separators=(',', ':'), ensure_ascii=False).encode()
        json_bytes += b' ' * (-len(json_bytes) % 4)
        output_binary.extend(b'\0' * (-len(output_binary) % 4))
        result = (struct.pack('<III', 0x46546C67, 2, 28 + len(json_bytes) + len(output_binary))
                  + struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
                  + struct.pack('<II', len(output_binary), 0x004E4942) + output_binary)
        # Same-volume atomic replacement avoids partially written browser assets.
        fd, temporary = tempfile.mkstemp(prefix=path.name + '.', suffix='.tmp', dir=path.parent)
        try:
            with os.fdopen(fd, 'wb') as stream:
                stream.write(result)
            os.replace(temporary, path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('path', type=Path)
    parser.add_argument('--write', action='store_true', help='replace the supplied exported GLB after all correspondence checks pass')
    args = parser.parse_args()
    print(json.dumps(restore_file(args.path, write=args.write), indent=2))
