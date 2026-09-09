"""Read-only topology/pose audit for the downloaded Joshua P. 3DS XL geometry.

Works on raw glTF mesh coordinates, before scene-node transforms. Welding is
analytical only: it never modifies vertices, UVs, normals, or the source GLB.
Requires NumPy. Output component IDs are sorted by descending triangle count,
then first triangle index, so they are reproducible for this source asset.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def load_glb(path):
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from("<III", raw)
    assert magic == 0x46546C67 and version == 2 and length == len(raw)
    offset = 12
    document = None
    binary = None
    while offset < len(raw):
        size, kind = struct.unpack_from("<II", raw, offset)
        payload = raw[offset + 8:offset + 8 + size]
        if kind == 0x4E4F534A:
            document = json.loads(payload)
        elif kind == 0x004E4942:
            binary = payload
        offset += 8 + size
    assert document is not None and binary is not None
    return raw, document, binary


def accessor(document, binary, index):
    item = document["accessors"][index]
    view = document["bufferViews"][item["bufferView"]]
    dtype = np.dtype({5120: "i1", 5121: "u1", 5122: "<i2", 5123: "<u2", 5125: "<u4", 5126: "<f4"}[item["componentType"]])
    columns = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[item["type"]]
    return np.ndarray((item["count"], columns), dtype, binary,
                      view.get("byteOffset", 0) + item.get("byteOffset", 0),
                      (view.get("byteStride", dtype.itemsize * columns), dtype.itemsize)).copy()


def connected_components(points, faces, tolerance):
    # Grid quantization joins duplicated UV/normal seam vertices without altering
    # the production mesh. A tolerance sweep below checks component stability.
    keys = {}
    vertex_ids = []
    for vertex_index, point in enumerate(points):
        key = tuple(np.rint(point / tolerance).astype(np.int64)) if tolerance else vertex_index
        vertex_ids.append(keys.setdefault(key, len(keys)))
    parent = list(range(len(keys)))

    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    for face in faces:
        first = find(vertex_ids[face[0]])
        for index in face[1:]:
            parent[find(vertex_ids[index])] = first
    groups = {}
    for triangle, face in enumerate(faces):
        groups.setdefault(find(vertex_ids[face[0]]), []).append(triangle)
    return sorted(groups.values(), key=lambda indices: (-len(indices), indices[0]))


def rounded(values):
    return np.asarray(values).round(8).tolist()


def component_report(component_id, triangle_indices, points, faces):
    indices = np.unique(faces[triangle_indices])
    vertices = points[indices].astype(float)
    low, high = vertices.min(0), vertices.max(0)
    centered = vertices - vertices.mean(0)
    values, axes = np.linalg.eigh(centered.T @ centered / len(vertices))
    normal = axes[:, 0]
    if normal[1] < 0:
        normal *= -1
    spans = np.ptp(centered @ axes, axis=0)
    return {
        "id": component_id,
        "triangles": len(triangle_indices),
        "vertices_in_source": len(indices),
        "bounds_min": rounded(low),
        "bounds_max": rounded(high),
        "bounds_center": rounded((low + high) / 2),
        "bounds_size": rounded(high - low),
        "plane_normal_toward_positive_y": rounded(normal),
        "plane_rms_error": round(float(np.sqrt(max(0, values[0]))), 8),
        "pca_spans_small_to_large": rounded(spans),
        "triangle_indices": triangle_indices,
        "vertex_indices": indices.tolist(),
    }


def fit_hinge_circle(points):
    # The principal hinge barrel is parallel to X. Fit circles to its Y/Z
    # cross-section; report inliers/residual rather than claiming a measured axis.
    region = points[(points[:, 1] >= -0.1) & (points[:, 1] < 6.7)
                    & (points[:, 2] > -3.5) & (points[:, 2] < 3.5)]
    yz = np.unique(np.round(region[:, [1, 2]], 5), axis=0).astype(float)
    if len(yz) < 3:
        return {"status": "fewer than three cross-section samples"}
    rng = np.random.default_rng(17053)
    best = None
    for _ in range(20000):
        sample = yz[rng.choice(len(yz), 3, replace=False)]
        a = 2 * (sample[1:] - sample[0])
        if abs(np.linalg.det(a)) < 1e-8:
            continue
        center = np.linalg.solve(a, (sample[1:] ** 2).sum(1) - (sample[0] ** 2).sum())
        radius = np.linalg.norm(sample[0] - center)
        if not (1 < radius < 4 and 1 < center[0] < 5 and -1 < center[1] < 1):
            continue
        errors = abs(np.linalg.norm(yz - center, axis=1) - radius)
        inliers = errors < 0.0001
        score = int(inliers.sum())
        if best is None or score > best[0]:
            best = (score, inliers, center, radius)
    if best is None:
        return {"status": "no confident fit"}
    selected = yz[best[1]]
    a = np.column_stack((2 * selected, np.ones(len(selected))))
    solution = np.linalg.lstsq(a, (selected ** 2).sum(1), rcond=None)[0]
    center = solution[:2]
    radius = np.sqrt(solution[2] + center @ center)
    residual = np.linalg.norm(selected - center, axis=1) - radius
    return {
        "status": "geometric candidate; inspect barrel/end caps before final rig",
        "axis_direction_raw": [1, 0, 0],
        "axis_point_raw": [0, *rounded(center)],
        "barrel_radius_raw": round(float(radius), 8),
        "unique_yz_samples_considered": len(yz),
        "inlier_count": len(selected),
        "radial_rms_error": round(float(np.sqrt(np.mean(residual ** 2))), 8),
        "inlier_yz": rounded(selected),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, nargs="?", default=ROOT / "model/candidates/joshua-xl/geometry-inspection.glb")
    parser.add_argument("--report", type=Path, default=ROOT / "model/candidates/joshua-xl/component-report.json")
    args = parser.parse_args()
    raw, document, binary = load_glb(args.source)
    report = {
        "source": str(args.source),
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "coordinates": "Raw glTF POSITION coordinates, before every node transform: X left/right, Y up, Z toward front of base. Values are source units, not confirmed mm.",
        "weld_tolerance": 0.0001,
        "welding": "Analysis only; source arrays and UV seams preserved. Components are independent per primitive/material.",
        "source_nodes": document["nodes"],
        "meshes": [],
    }
    for mesh_index, mesh in enumerate(document["meshes"]):
        for primitive_index, primitive in enumerate(mesh["primitives"]):
            assert primitive.get("mode", 4) == 4
            points = accessor(document, binary, primitive["attributes"]["POSITION"])
            faces = accessor(document, binary, primitive["indices"]).reshape(-1, 3)
            groups = connected_components(points, faces, report["weld_tolerance"])
            entry = {
                "mesh_index": mesh_index, "primitive_index": primitive_index,
                "mesh_name": mesh["name"],
                "tolerance_sweep_component_counts": {str(t): len(connected_components(points, faces, t)) for t in [0, .00001, .0001, .001]},
                "components": [component_report(i, tris, points, faces) for i, tris in enumerate(groups)],
            }
            report["meshes"].append(entry)
            if mesh_index == 0:
                report["hinge_circle_candidate"] = fit_hinge_circle(points)
                report["hinge_independent_checks"] = {
                    "fixed_base_barrel": fit_hinge_circle(points[np.unique(faces[groups[0]])]),
                    "moving_lid_barrel": fit_hinge_circle(points[np.unique(faces[groups[1]])]),
                }
    screen_components = report["meshes"][2]["components"]
    flat_screens = [c for c in screen_components if c["triangles"] == 2 and c["bounds_size"][0] > 40]
    assert len(flat_screens) == 2
    lower = min(flat_screens, key=lambda c: c["bounds_center"][1])
    upper = max(flat_screens, key=lambda c: c["bounds_center"][1])
    normal = np.array(upper["plane_normal_toward_positive_y"])
    tilt = math.degrees(math.acos(np.clip(normal[1], -1, 1)))
    report["screen_pose"] = {
        "lower_component": lower["id"], "upper_component": upper["id"],
        "upper_normal_raw": normal.tolist(),
        "upper_plane_tilt_degrees": round(tilt, 6),
        "inferred_open_angle_degrees": round(180 - tilt, 6),
        "to_close": "Rotate the separated lid about +X by inferred_open_angle_degrees around the fitted hinge-axis candidate, then inspect for shell collision. Do not include the creator's global presentation-node tilt in the mechanical hinge angle.",
    }
    report["rig_assignment_candidates"] = {
        "basis": "Geometric inference from component bounds and known original-XL layout; confirm small parts in the imported model before final assignment.",
        "main_primitive_lid_components": [1, 3, 7, 8, 13, 14, 21, 31, 35, 36, 37, 42, 43, 47, 50],
        "image_primitive_lid_components": [1, 2, 4],
        "screen_primitive_lid_components": [0, 1, 2, 4],
        "all_other_components": "fixed base; controls below get independent press transforms within that base",
        "main_primitive_controls": {
            "Circle": 6, "Dpad": 18, "A": 29, "B": 26, "X": 28, "Y": 27,
            "HOME": 46, "SELECT": 44, "START": 45, "POWER": 25,
            "R_shoulder_candidate": 4, "L_shoulder_candidate": 5,
        },
        "main_primitive_shells": {"base_body": 0, "lid_inner": 1, "base_rear_strip": 2, "lid_outer": 3},
        "image_screens": {"lower": 3, "upper": 4},
        "screen_glass": {"lower": 3, "upper": 4},
    }
    axis_point = np.array(report["hinge_circle_candidate"]["axis_point_raw"])
    theta = math.radians(report["screen_pose"]["inferred_open_angle_degrees"])
    rotation = np.array([[1, 0, 0], [0, math.cos(theta), -math.sin(theta)], [0, math.sin(theta), math.cos(theta)]])
    closed_points = []
    lid_keys = ["main_primitive_lid_components", "image_primitive_lid_components", "screen_primitive_lid_components"]
    for mesh_index, mesh in enumerate(document["meshes"]):
        primitive = mesh["primitives"][0]
        points = accessor(document, binary, primitive["attributes"]["POSITION"]).astype(float)
        lid_ids = report["rig_assignment_candidates"][lid_keys[mesh_index]]
        for component in report["meshes"][mesh_index]["components"]:
            vertices = points[component["vertex_indices"]]
            if component["id"] in lid_ids:
                vertices = (vertices - axis_point) @ rotation.T + axis_point
            closed_points.append(vertices)
    closed_points = np.vstack(closed_points)
    dimensions = np.ptp(closed_points, axis=0)
    mm_per_source_unit = 156 / dimensions[0]
    report["candidate_closed_scale_audit"] = {
        "raw_dimensions_xyz": rounded(dimensions),
        "mm_per_source_unit_for_156mm_width": round(float(mm_per_source_unit), 8),
        "dimensions_xyz_mm_with_uniform_scale": rounded(dimensions * mm_per_source_unit),
        "lower_screen_mesh_span_mm": rounded(np.array(lower["pca_spans_small_to_large"])[1:] * mm_per_source_unit),
        "upper_screen_mesh_span_mm": rounded(np.array(upper["pca_spans_small_to_large"])[1:] * mm_per_source_unit),
        "limit": "Based on inferred lid assignments; screen-plane spans are geometry extents, not a claim about active image bounds in the still-missing textures. Uniform scaling alone does not prove every Nintendo dimension matches.",
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    assert hashlib.sha256(args.source.read_bytes()).hexdigest() == report["source_sha256"]
    print(json.dumps({"report": str(args.report), "counts": [len(m["components"]) for m in report["meshes"]],
                      "hinge": {k: v for k, v in report["hinge_circle_candidate"].items() if k != "inlier_yz"},
                      "screen_pose": report["screen_pose"]}, indent=2))


if __name__ == "__main__":
    main()
