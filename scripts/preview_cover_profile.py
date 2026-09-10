"""Reversible local lower-cover cross-section fit, not a production exporter."""
from pathlib import Path
import json
import numpy as np
import bpy
import render_sourced_dimensions as render

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'


def smooth(x, a, b):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)


def main(persist=False):
    assert Path(bpy.data.filepath).name == 'silver-lower-labels.blend'
    obj = bpy.data.objects['Sourced graphite chassis']
    original = obj.data
    p = np.array([v.co[:] for v in original.vertices], dtype=float)
    q = p.copy()
    q[:, 0] = abs(q[:, 0] + .210388)
    delta = q[:, :2] - [64.28580567, -33.54466014]
    radius = np.linalg.norm(delta, axis=1)
    theta = np.arctan2(delta[:, 1], delta[:, 0])
    selected = (theta > -1.35) & (theta < -.25) & (p[:, 2] < 4.7) & (radius > 6) & (radius < 12.2)
    coef = np.polynomial.polynomial.polyfit((radius[selected]-9)/3, p[selected, 2], 4)
    fitted = np.polynomial.polynomial.polyval((radius-9)/3, coef)
    weight = smooth(theta, -1.5, -1.25) * (1-smooth(theta, -.3, -.05))
    weight *= smooth(radius, 6, 7) * (1-smooth(radius, 11.7, 12.15))
    weight *= 1-smooth(p[:, 2], 4.4, 4.7)
    # Preserve the cover seam, the broad crown and regions containing openings.
    weight *= ((q[:, 0] > 64) & (q[:, 1] < -33) & (p[:, 2] > 1.4))
    changed = p.copy()
    changed[:, 2] += weight*(fitted-p[:, 2])
    distance = np.linalg.norm(changed-p, axis=1)
    assert distance.max() < .25
    trial = original.copy()
    keep = False
    views = render.VIEWS
    render.VIEWS = [*views, ('corner', 0, (115, -110, -85), (67, -37, 3), 40, 0)]
    try:
        render.main('cover-profile-before', only=['underside', 'corner'], resolution=(1200, 900))
        obj.data = trial
        trial.vertices.foreach_set('co', changed.astype(np.float32).ravel())
        # Fit outward normals, then retain the source tangent direction projected
        # into the new tangent plane. UVs and tangent handedness stay unchanged.
        normal = np.empty((len(p), 3), dtype=np.float32)
        original.attributes['_FRAME_N'].data.foreach_get('vector', normal.ravel())
        normal = normal[:, [0, 2, 1]].astype(float)
        normal[:, 1] *= -1
        slope = np.polynomial.polynomial.polyval((radius-9)/3, np.polynomial.polynomial.polyder(coef))/3
        direction = delta/np.maximum(radius[:, None], 1e-8)
        direction[:, 0] *= np.sign(p[:, 0]+.210388)
        desired = np.column_stack([direction*slope[:, None], -np.ones(len(p))])
        desired /= np.linalg.norm(desired, axis=1)[:, None]
        normal = normal*(1-weight[:, None])+desired*weight[:, None]
        normal /= np.linalg.norm(normal, axis=1)[:, None]
        trial.normals_split_custom_set_from_vertices(normal.tolist())
        gltf_normal = normal[:, [0, 2, 1]].copy()
        gltf_normal[:, 2] *= -1
        tangent = np.empty((len(p), 3), dtype=np.float32)
        original.attributes['_FRAME_T'].data.foreach_get('vector', tangent.ravel())
        old_normal = np.empty((len(p), 3), dtype=np.float32)
        original.attributes['_FRAME_N'].data.foreach_get('vector', old_normal.ravel())
        active = weight > 0
        gltf_normal[~active] = old_normal[~active]
        projected = tangent[active].astype(float)
        projected -= gltf_normal[active]*np.sum(projected*gltf_normal[active], axis=1)[:, None]
        projected /= np.linalg.norm(projected, axis=1)[:, None]
        tangent[active] = projected
        trial.attributes['_FRAME_N'].data.foreach_set('vector', gltf_normal.astype(np.float32).ravel())
        trial.attributes['_FRAME_T'].data.foreach_set('vector', tangent.ravel())
        trial.update()
        render.main('cover-profile-trial', only=['underside', 'corner'], resolution=(1200, 900))
        report = {'source': 'silver-lower-labels.blend', 'degree': 4, 'coefficients': coef.tolist(),
                  'fit_samples': int(selected.sum()), 'vertices_changed': int((distance > 1e-7).sum()),
                  'maximum_displacement_mm': float(distance.max()),
                  'fit_rms_mm': float(np.sqrt(np.mean((fitted[selected]-p[selected, 2])**2))),
                  'scope': 'Reversible symmetric corner cross-section and normal trial; not factory CAD and not exported.'}
        (FOLDER/'cover-profile-trial.json').write_text(json.dumps(report, indent=2)+'\n')
        print(json.dumps(report))
        if persist:
            import texture_sourced_model as exporter
            import curve_sourced_shell as frames
            root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
            root['lower_cover_profile'] = json.dumps(report)
            root['source_changes'] += ' Refined the lower cover front-corner cross-section and shading frames.'
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-cover-profile.blend'))
            keep = True
            exporter.export_static(root, hinge, FOLDER/'silver-cover-profile.glb', restore_frames=False, export_attributes=True)
            frames.restore_export_frames(FOLDER/'silver-cover-profile.glb')
    finally:
        render.VIEWS = views
        if not keep:
            obj.data = original
            bpy.data.meshes.remove(trial)


if __name__ == '__main__':
    main()
