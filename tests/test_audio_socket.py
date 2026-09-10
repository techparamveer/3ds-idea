"""Export invariants for coordinated audio socket/opening rounding."""
import unittest
from collections import Counter
import numpy as np
from test_web_model import load
from test_lower_label_maps import values
from test_plastic_normals import attribute, material

CHANGED = {'Source_0_part_19', 'Sourced graphite chassis'}


def exterior_triangles(asset, primitive):
    p = values(asset, primitive['attributes']['POSITION'])
    uv = values(asset, primitive['attributes']['TEXCOORD_0'])
    faces = values(asset, primitive['indices']).reshape(-1, 3)
    # Conservative box surrounds the complete deformation and refinement.
    near = (p[:,0]>-66)&(p[:,0]<-53)&(p[:,1]>0)&(p[:,1]<12.5)&(p[:,2]>41)
    keep = ~np.any(near[faces],axis=1)
    result = Counter()
    for tri in faces[keep]:
        v = [np.r_[p[i],uv[i]].tobytes() for i in tri]
        result[min(b''.join(v[j:]+v[:j]) for j in range(3))] += 1
    return result


class AudioSocket(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.old, cls.new = load('silver-cover-seam.glb'), load('silver-audio-socket.glb')

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
            # The source-fitted center and float32 export allow 0.0001 mm on
            # the refined insert; unchanged whole-chassis bounds stay tighter.
            tol=1e-4 if name=='Source_0_part_19' else 1e-5
            np.testing.assert_allclose(p.min(axis=0),q.min(axis=0),atol=tol,rtol=0)
            np.testing.assert_allclose(p.max(axis=0),q.max(axis=0),atol=tol,rtol=0)
            n=values(b,new['attributes']['NORMAL']);t=values(b,new['attributes']['TANGENT'])
            self.assertTrue(np.isfinite(q).all() and np.isfinite(n).all() and np.isfinite(t).all())
            self.assertLess(np.max(abs(np.linalg.norm(n,axis=1)-1)),1e-5)
            self.assertLess(np.max(abs(np.linalg.norm(t[:,:3],axis=1)-1)),1e-5)
            self.assertLess(np.max(abs(np.sum(n*t[:,:3],axis=1))),1e-5)
            self.assertTrue(np.isin(t[:,3],[-1,1]).all())

    def test_rear_socket_rings_are_round_and_densely_sampled(self):
        asset=self.new
        node=next(n for n in asset[0]['nodes'] if n.get('name')=='Source_0_part_19')
        pr=asset[0]['meshes'][node['mesh']]['primitives'][0]
        p=values(asset,pr['attributes']['POSITION'])
        p=np.unique(p[abs(p[:,2]-43.9869)<.0001],axis=0)
        q=p[:,:2]-np.array([-59.50925,6.3141])
        r=np.linalg.norm(q,axis=1)
        for selected,expected in [(r>2.4,2.89425),(r<2.4,2.01295)]:
            self.assertGreaterEqual(selected.sum(),64)
            self.assertLess(np.max(abs(r[selected]-expected)),.0002)
            angles=np.sort(np.arctan2(q[selected,1],q[selected,0]))
            gaps=np.diff(np.r_[angles,angles[0]+2*np.pi])
            # Less than one pixel at the 18 mm / 1000 px macro scale.
            self.assertLess(expected*(1-np.cos(gaps.max()/2)),.011)


if __name__=='__main__': unittest.main()
