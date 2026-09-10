"""Reversible rounded cap-rim trial based on the sourced bevel envelope."""
import importlib
import json
from pathlib import Path
import bpy
import numpy as np
import render_sourced_dimensions as renderer

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def refine(obj):
    mesh = obj.data.copy(); obj.data = mesh
    p = np.array([v.co[:] for v in mesh.vertices]); old = p.copy()
    centre = (p[:, :2].min(axis=0)+p[:, :2].max(axis=0))/2
    q = p[:, :2]-centre; radius = np.linalg.norm(q, axis=1)
    radial = q/np.maximum(radius[:, None], 1e-8)
    top = p[:, 2].max()
    # The source has a 0.4505 mm straight chamfer, ending at a planar top.
    shoulder = top-.4505
    t = np.clip((p[:, 2]-shoulder)/(top-shoulder), 0, 1)
    angle = t*np.pi/2
    band = (p[:, 2] > shoulder+1e-4) & (p[:, 2] < top-1e-4)
    # Advect the existing chamfer vertices into a quarter ellipse, retaining
    # their original radial variation and all vertices on the top/side seams.
    bevel_width = .46
    p[band, :2] += radial[band]*(bevel_width*(np.cos(angle[band])-(1-t[band])))[:, None]
    # Source radial interpolation varies slightly around the rim. Constrain
    # the rounded band to the original cap diameter, including those errors.
    limit = min(np.ptp(old[:, 0]), np.ptp(old[:, 1]))/2
    changed_radius = np.linalg.norm(p[band, :2]-centre, axis=1)
    p[band, :2] = centre+radial[band]*np.minimum(changed_radius, limit)[:, None]
    p[band, 2] = shoulder+(top-shoulder)*np.sin(angle[band])
    # Geometric normal of that ellipse; side and top meet it continuously.
    n = np.column_stack((radial*(top-shoulder)*np.cos(angle)[:, None], bevel_width*np.sin(angle)))
    n /= np.maximum(np.linalg.norm(n, axis=1)[:, None], 1e-8)
    n[radius < 1e-6] = [0, 0, 1]
    tangent = np.array([a.vector[:] for a in mesh.attributes['_FRAME_T'].data])[:, [0, 2, 1]]
    tangent[:, 1] *= -1
    tangent -= n*np.sum(n*tangent, axis=1)[:, None]
    tangent /= np.linalg.norm(tangent, axis=1)[:, None]
    assert np.isfinite(tangent).all()
    mesh.vertices.foreach_set('co', p.astype(np.float32).ravel()); mesh.update()
    mesh.normals_split_custom_set_from_vertices(n.tolist())
    for name, values in [('_FRAME_N', n), ('_FRAME_T', tangent)]:
        carried = values[:, [0, 2, 1]].copy(); carried[:, 2] *= -1
        mesh.attributes[name].data.foreach_set('vector', carried.astype(np.float32).ravel())
    return {'object': obj.name, 'changed_vertices': int(band.sum()),
            'maximum_displacement_mm': float(np.linalg.norm(p-old, axis=1).max()),
            'minimum_z_before': float(old[:, 2].min()), 'maximum_z_before': float(top),
            'minimum_z_after': float(p[:, 2].min()), 'maximum_z_after': float(p[:, 2].max())}


def main():
    originals = [(bpy.data.objects['Button_'+key], bpy.data.objects['Button_'+key].data) for key in 'ABXY']
    try:
        report = [refine(obj) for obj, _ in originals]
        importlib.reload(renderer)
        renderer.VIEWS = [('abxy', -155, (61, -45, 150), (61, 9, 14), 33, 0)]
        renderer.main('abxy-rollover-trial')
        (FOLDER/'abxy-rollover-trial-report.json').write_text(json.dumps(report, indent=2)+'\n')
        print(json.dumps(report))
    finally:
        for obj, original in originals:
            trial = obj.data; obj.data = original
            if trial != original: bpy.data.meshes.remove(trial)


if __name__ == '__main__': main()
