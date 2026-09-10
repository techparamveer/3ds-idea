"""Read-only upper surround profile and candidate outer-band clearance audit."""
from pathlib import Path
import json
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    scene = bpy.context.scene; root = scene.objects['3DS_XL']; hinge = scene.objects['Hinge']
    mesh = scene.objects['Sourced inner lid'].data; mesh.calc_loop_triangles()
    tree = BVHTree.FromPolygons([v.co for v in mesh.vertices], [tuple(t.vertices) for t in mesh.loop_triangles], all_triangles=True)
    profiles = {}
    for y in [-41.416, -70, -10]:
        samples = []
        for k in range(540, 641):
            x = k/10
            point, _, _, _ = tree.ray_cast(Vector((x, y, -10)), Vector((0, 0, 1)), 20)
            samples.append([x, point.z if point is not None else None])
        profiles[str(y)] = samples
    saved = [(o, o.animation_data.action, o.matrix_basis.copy()) for o in (root, hinge)]
    frame = scene.frame_current; clearance = {}
    try:
        for o, _, _ in saved:
            o.animation_data.action = None; o.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        inverse = hinge.matrix_world.inverted()
        # Rectangular candidate band outside the measured aperture. This is
        # only a conservative study region, not a proposed finished corner shape.
        for obj in scene.objects:
            if obj.type != 'MESH' or not obj.name.startswith('Button_'): continue
            gaps = []
            for vertex in obj.data.vertices:
                p = inverse@obj.matrix_world@vertex.co
                x, y = abs(p.x), abs(p.y+41.416)
                if not (x <= 57.5 and y <= 37.2 and (x >= 56.05 or y >= 35.8)): continue
                hit, _, _, _ = tree.ray_cast(Vector((p.x, p.y, -10)), Vector((0, 0, 1)), 20)
                if hit is not None: gaps.append(hit.z-p.z)
            if gaps: clearance[obj.name] = {'vertex_samples': len(gaps), 'minimum_gap_mm': min(gaps)}
    finally:
        for o, action, _ in saved: o.animation_data.action = action
        scene.frame_set(frame)
        for o, _, matrix in saved: o.matrix_basis = matrix
        bpy.context.view_layer.update()
    report = {'source': Path(bpy.data.filepath).name,
              'coordinates': 'hinge-local millimetres; smaller Z faces the controls when closed',
              'horizontal_profiles': profiles, 'candidate_outer_band_clearance': clearance,
              'limits': 'Uncalibrated source geometry; vertex clearance in a rectangular study band, not a swept-solid proof or factory dimension.'}
    (FOLDER/'upper-frame-profile-audit.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(clearance))


if __name__ == '__main__': main()
