"""Export invariants for the coordinated cap and chassis opening refinement."""
import unittest
import numpy as np
from test_web_model import load
from test_plastic_normals import attribute, material


class PowerFitTests(unittest.TestCase):
    def test_only_cap_and_chassis_geometry_changes_with_preserved_rig_and_materials(self):
        before,after=load('silver-upper-cover.glb'),load('silver-power-fit.glb')
        nodes={n['name']:n for n in after[0]['nodes']}
        self.assertEqual(len(nodes),len(before[0]['nodes']))
        for old in before[0]['nodes']:
            new=nodes[old['name']]
            for key in ['translation','rotation','scale','matrix']:
                self.assertEqual(old.get(key),new.get(key),(old['name'],key))
            self.assertEqual([before[0]['nodes'][i]['name'] for i in old.get('children',[])],[after[0]['nodes'][i]['name'] for i in new.get('children',[])])
            if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
            if 'mesh' not in old:continue
            a=before[0]['meshes'][old['mesh']]['primitives'];b=after[0]['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(a),len(b))
            for p,q in zip(a,b):
                self.assertEqual(material(before,p['material']),material(after,q['material']),old['name'])
                self.assertEqual(p['attributes'].keys(),q['attributes'].keys())
                if old['name'] not in ['Button_POWER','Sourced graphite chassis']:
                    for key in p['attributes']:self.assertEqual(attribute(before,p['attributes'][key]),attribute(after,q['attributes'][key]))
                    self.assertEqual(attribute(before,p['indices']),attribute(after,q['indices']))
                else:
                    pos=np.frombuffer(attribute(before,p['attributes']['POSITION']),dtype='<f4').reshape(-1,3)
                    nxt=np.frombuffer(attribute(after,q['attributes']['POSITION']),dtype='<f4').reshape(-1,3)
                    self.assertTrue(np.isfinite(nxt).all())
                    np.testing.assert_allclose(nxt.min(axis=0),pos.min(axis=0),atol=1e-5)
                    np.testing.assert_allclose(nxt.max(axis=0),pos.max(axis=0),atol=1e-5)
                    normal=np.frombuffer(attribute(after,q['attributes']['NORMAL']),dtype='<f4').reshape(-1,3)
                    tangent=np.frombuffer(attribute(after,q['attributes']['TANGENT']),dtype='<f4').reshape(-1,4)
                    np.testing.assert_allclose(np.linalg.norm(normal,axis=1),1,atol=2e-5)
                    np.testing.assert_allclose(np.linalg.norm(tangent[:,:3],axis=1),1,atol=2e-5)
                    np.testing.assert_allclose((normal*tangent[:,:3]).sum(axis=1),0,atol=2e-5)
                    self.assertTrue(np.isin(tangent[:,3],[-1,1]).all())
                    uv=np.frombuffer(attribute(after,q['attributes']['TEXCOORD_0']),dtype='<f4')
                    self.assertTrue(np.isfinite(uv).all())
                    index=after[0]['accessors'][q['indices']]
                    ix=np.frombuffer(attribute(after,q['indices']),dtype='<u2' if index['componentType']==5123 else '<u4').reshape(-1,3)
                    area=np.linalg.norm(np.cross(nxt[ix[:,1]]-nxt[ix[:,0]],nxt[ix[:,2]]-nxt[ix[:,0]]),axis=1)
                    self.assertGreater(float(area.min()),1e-10)


if __name__=='__main__':unittest.main()
