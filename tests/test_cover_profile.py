"""Preservation checks for the localized underside cross-section correction."""
import unittest
import numpy as np
from test_web_model import load
from test_lower_label_maps import values
from test_plastic_normals import attribute, material


class CoverProfile(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.old = load('silver-lower-labels.glb')
        cls.new = load('silver-cover-profile.glb')

    def test_other_meshes_materials_rig_and_uvs_preserved(self):
        a, b = self.old, self.new
        nodes = {n['name']: n for n in b[0]['nodes']}
        self.assertEqual(len(nodes), len(a[0]['nodes']))
        for old in a[0]['nodes']:
            new = nodes[old['name']]
            for key in ['translation', 'rotation', 'scale', 'matrix']:
                self.assertEqual(old.get(key), new.get(key))
            self.assertEqual([a[0]['nodes'][i]['name'] for i in old.get('children', [])],
                             [b[0]['nodes'][i]['name'] for i in new.get('children', [])])
            if old['name'] != '3DS_XL':
                self.assertEqual(old.get('extras'), new.get('extras'))
            if 'mesh' not in old:
                continue
            pp = a[0]['meshes'][old['mesh']]['primitives']
            qq = b[0]['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(pp), len(qq))
            for p, q in zip(pp, qq):
                self.assertEqual(material(a, p['material']), material(b, q['material']))
                self.assertEqual(attribute(a, p['indices']), attribute(b, q['indices']))
                self.assertEqual(p['attributes'].keys(), q['attributes'].keys())
                for key in p['attributes']:
                    if old['name'] == 'Sourced graphite chassis' and key in ['POSITION', 'NORMAL', 'TANGENT']:
                        continue
                    self.assertEqual(attribute(a, p['attributes'][key]), attribute(b, q['attributes'][key]))

    def test_change_confined_to_cover_corners_with_valid_frames(self):
        a, b = self.old, self.new
        def attrs(asset):
            node = next(n for n in asset[0]['nodes'] if n.get('name') == 'Sourced graphite chassis')
            return asset[0]['meshes'][node['mesh']]['primitives'][0]['attributes']
        aa, bb = attrs(a), attrs(b)
        p, q = values(a, aa['POSITION']), values(b, bb['POSITION'])
        displacement = np.linalg.norm(q-p, axis=1)
        changed = displacement > 1e-6
        self.assertGreater(changed.sum(), 1000)
        self.assertLess(displacement.max(), .17)
        self.assertTrue(np.array_equal(p[:, [0, 2]], q[:, [0, 2]]))
        self.assertTrue(np.all((p[changed, 1] > 1.4) & (p[changed, 1] < 4.7)))
        self.assertTrue(np.all(np.abs(p[changed, 0]+.210388) > 64))
        self.assertTrue(np.all(p[changed, 2] > 33))
        self.assertTrue(np.array_equal(p.min(axis=0), q.min(axis=0)))
        self.assertTrue(np.array_equal(p.max(axis=0), q.max(axis=0)))
        n, t = values(b, bb['NORMAL']), values(b, bb['TANGENT'])
        self.assertTrue(np.isfinite(n).all() and np.isfinite(t).all())
        self.assertLess(np.max(abs(np.linalg.norm(n, axis=1)-1)), 1e-5)
        self.assertLess(np.max(abs(np.linalg.norm(t[:, :3], axis=1)-1)), 1e-5)
        self.assertLess(np.max(abs(np.sum(n*t[:, :3], axis=1))), 1e-5)
        self.assertTrue(np.array_equal(values(a, aa['TANGENT'])[:, 3], t[:, 3]))
        permitted = (np.abs(p[:, 0]+.210388) > 64) & (p[:, 2] > 33) & (p[:, 1] > 1.4) & (p[:, 1] < 4.7)
        self.assertTrue(np.array_equal(values(a, aa['NORMAL'])[~permitted], n[~permitted]))
        self.assertTrue(np.array_equal(values(a, aa['TANGENT'])[~permitted], t[~permitted]))
        node = next(v for v in a[0]['nodes'] if v.get('name') == 'Sourced graphite chassis')
        primitive = a[0]['meshes'][node['mesh']]['primitives'][0]
        indices = values(a, primitive['indices']).reshape(-1, 3)
        old_faces, new_faces = p[indices].astype(float), q[indices].astype(float)
        old_cross = np.cross(old_faces[:, 1]-old_faces[:, 0], old_faces[:, 2]-old_faces[:, 0])
        new_cross = np.cross(new_faces[:, 1]-new_faces[:, 0], new_faces[:, 2]-new_faces[:, 0])
        valid = np.linalg.norm(old_cross, axis=1) > 1e-10
        self.assertTrue(np.all(np.sum(old_cross[valid]*new_cross[valid], axis=1) > 0))


if __name__ == '__main__':
    unittest.main()
