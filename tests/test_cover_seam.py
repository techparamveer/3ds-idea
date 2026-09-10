"""Export invariants for the lower-cover corner seam."""
import unittest
from collections import Counter
import numpy as np
from test_web_model import load
from test_lower_label_maps import values
from test_plastic_normals import attribute, material

CHANGED = {'Sourced graphite chassis'}


def exterior_triangles(asset, primitive):
    p = values(asset, primitive['attributes']['POSITION'])
    uv = values(asset, primitive['attributes']['TEXCOORD_0'])
    faces = values(asset, primitive['indices']).reshape(-1, 3)
    # Conservative box surrounds the complete deformation and refinement.
    near = (abs(p[:,0]+.210388)>61)&(p[:,2]>31)
    keep = ~np.any(near[faces],axis=1)
    result = Counter()
    for tri in faces[keep]:
        v = [np.r_[p[i],uv[i]].tobytes() for i in tri]
        result[min(b''.join(v[j:]+v[:j]) for j in range(3))] += 1
    return result


class CoverSeam(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.old, cls.new = load('silver-sd-outline.glb'), load('silver-cover-seam.glb')

    def test_rig_materials_and_other_geometry_preserved(self):
        a,b = self.old,self.new
        nodes={n['name']:n for n in b[0]['nodes']}
        self.assertEqual(len(nodes),len(a[0]['nodes']))
        for old in a[0]['nodes']:
            new=nodes[old['name']]
            for k in ['translation','rotation','scale','matrix']:
                self.assertEqual(old.get(k),new.get(k))
            self.assertEqual([a[0]['nodes'][i]['name'] for i in old.get('children',[])],
                             [b[0]['nodes'][i]['name'] for i in new.get('children',[])])
            if old['name']!='3DS_XL': self.assertEqual(old.get('extras'),new.get('extras'))
            if 'mesh' not in old: continue
            pp=a[0]['meshes'][old['mesh']]['primitives'];qq=b[0]['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(pp),len(qq))
            for p,q in zip(pp,qq):
                self.assertEqual(material(a,p['material']),material(b,q['material']))
                self.assertEqual(p['attributes'].keys(),q['attributes'].keys())
                if old['name'] in CHANGED:
                    self.assertEqual(exterior_triangles(a,p),exterior_triangles(b,q))
                    continue
                self.assertEqual(attribute(a,p['indices']),attribute(b,q['indices']))
                for k in p['attributes']:
                    self.assertEqual(attribute(a,p['attributes'][k]),attribute(b,q['attributes'][k]))

    def test_frames_and_extents(self):
        a,b=self.old,self.new
        for name in CHANGED:
            def primitive(asset):
                node=next(n for n in asset[0]['nodes'] if n.get('name')==name)
                return asset[0]['meshes'][node['mesh']]['primitives'][0]
            old,new=primitive(a),primitive(b)
            p=values(a,old['attributes']['POSITION']);q=values(b,new['attributes']['POSITION'])
            np.testing.assert_allclose(p.min(axis=0),q.min(axis=0),atol=1e-5,rtol=0)
            np.testing.assert_allclose(p.max(axis=0),q.max(axis=0),atol=1e-5,rtol=0)
            n=values(b,new['attributes']['NORMAL']);t=values(b,new['attributes']['TANGENT'])
            self.assertTrue(np.isfinite(q).all() and np.isfinite(n).all() and np.isfinite(t).all())
            self.assertLess(np.max(abs(np.linalg.norm(n,axis=1)-1)),1e-5)
            self.assertLess(np.max(abs(np.linalg.norm(t[:,:3],axis=1)-1)),1e-5)
            self.assertLess(np.max(abs(np.sum(n*t[:,:3],axis=1))),1e-5)
            self.assertTrue(np.isin(t[:,3],[-1,1]).all())

    def test_four_inconsistent_source_signs_repaired_at_preserved_uvs(self):
        a,b=self.old,self.new
        def attrs(asset):
            node=next(n for n in asset[0]['nodes'] if n.get('name')=='Sourced graphite chassis')
            return asset[0]['meshes'][node['mesh']]['primitives'][0]['attributes']
        aa,bb=attrs(a),attrs(b)
        old_uv=values(a,aa['TEXCOORD_0']);new_uv=values(b,bb['TEXCOORD_0'])
        old_t=values(a,aa['TANGENT']);new_t=values(b,bb['TANGENT'])
        expected={}
        for index in [602,603,604,607]:
            self.assertEqual(old_t[index,3],-1)
            key=tuple(old_uv[index]);expected[key]=expected.get(key,0)+1
        # Some source faces deliberately duplicate the same position, UV and
        # tangent direction with opposite signs. Preserve those other copies.
        for uv,count in expected.items():
            before=np.all(abs(old_uv-uv)<1e-7,axis=1)
            after=np.all(abs(new_uv-uv)<1e-7,axis=1)
            self.assertEqual(int(np.sum(new_t[after,3]==1)-np.sum(old_t[before,3]==1)),count)
            self.assertEqual(int(np.sum(old_t[before,3]==-1)-np.sum(new_t[after,3]==-1)),count)
        node=next(n for n in b[0]['nodes'] if n.get('name')=='Sourced graphite chassis')
        pr=b[0]['meshes'][node['mesh']]['primitives'][0]
        faces=values(b,pr['indices']).reshape(-1,3);p=values(b,bb['POSITION'])[faces]
        seam=np.all((abs(p[:,:,0]+.210388)>62)&(p[:,:,2]>32)&(p[:,:,1]>5.3)&(p[:,:,1]<5.95),axis=1)
        self.assertFalse(np.any(np.ptp(new_t[faces[seam],3],axis=1)>0))


if __name__=='__main__': unittest.main()
