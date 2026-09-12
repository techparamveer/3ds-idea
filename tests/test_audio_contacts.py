"""Export preservation and physical/shading checks for the added jack interior."""
import unittest
import numpy as np
from test_web_model import load
from test_plastic_normals import attribute, material
from test_lower_label_maps import values

ADDED={'Audio_Bore_Housing','Audio_Contact_Arc','Audio_Contact_Leaf'}

class AudioContacts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.a=load('silver-audio-finish.glb');cls.b=load('silver-audio-contacts.glb')

    def test_existing_geometry_materials_and_rig_unchanged(self):
        a,b=self.a,self.b;nodes={n['name']:n for n in b[0]['nodes']}
        self.assertEqual(set(nodes)-{n['name'] for n in a[0]['nodes']},ADDED)
        self.assertEqual(len(a[0]['images']),len(b[0]['images']))
        for old in a[0]['nodes']:
            new=nodes[old['name']]
            for key in ['translation','rotation','scale','matrix']:
                self.assertEqual(old.get(key),new.get(key))
            self.assertEqual([a[0]['nodes'][i]['name'] for i in old.get('children',[])],
                             [b[0]['nodes'][i]['name'] for i in new.get('children',[]) if b[0]['nodes'][i]['name'] not in ADDED])
            if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
            if 'mesh' not in old:continue
            pp=a[0]['meshes'][old['mesh']]['primitives'];qq=b[0]['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(pp),len(qq))
            for p,q in zip(pp,qq):
                self.assertEqual(p['attributes'].keys(),q['attributes'].keys())
                for key in p['attributes']:
                    self.assertEqual(attribute(a,p['attributes'][key]),attribute(b,q['attributes'][key]))
                self.assertEqual(attribute(a,p['indices']),attribute(b,q['indices']))
                self.assertEqual(material(a,p['material']),material(b,q['material']))

    def test_interiors_attached_to_base_and_within_socket(self):
        b=self.b;nodes={n['name']:n for n in b[0]['nodes']}
        children={b[0]['nodes'][i]['name'] for i in nodes['Base']['children']}
        self.assertTrue(ADDED<=children)
        for name in ADDED:
            node=nodes[name]
            self.assertNotIn('matrix',node)
            self.assertEqual(node.get('translation',[0,0,0]),[0,0,0])
            for p in b[0]['meshes'][node['mesh']]['primitives']:
                pos=values(b,p['attributes']['POSITION'])
                # Native mm -> glTF X,Z,-Y. These bounds keep all additions
                # behind the existing mouth and inside its source aperture.
                self.assertTrue(np.all(pos>=[-62,4,37]))
                self.assertTrue(np.all(pos<=[-57,9,44.31]))
                radius=np.linalg.norm(pos[:,:2]-[-59.50925,6.3141],axis=1)
                self.assertLessEqual(radius.max(),2.014)
                m=b[0]['materials'][p['material']]
                self.assertFalse(m.get('doubleSided',False))
                self.assertEqual(m['pbrMetallicRoughness'].get('metallicFactor',1),0 if 'Housing' in name else 1)

    def test_non_degenerate_faces_and_uv_consistent_export_frames(self):
        b=self.b
        for node in b[0]['nodes']:
            if node['name'] not in ADDED:continue
            for p in b[0]['meshes'][node['mesh']]['primitives']:
                a=p['attributes'];pos=values(b,a['POSITION']);n=values(b,a['NORMAL']);t=values(b,a['TANGENT']);uv=values(b,a['TEXCOORD_0'])
                idx=values(b,p['indices']).reshape(-1,3)
                e1=pos[idx[:,1]]-pos[idx[:,0]];e2=pos[idx[:,2]]-pos[idx[:,0]]
                cross=np.cross(e1,e2)
                self.assertTrue(np.all(np.linalg.norm(cross,axis=1)>1e-9))
                self.assertTrue(np.isfinite(np.concatenate([n,t],axis=1)).all())
                np.testing.assert_allclose(np.linalg.norm(n,axis=1),1,atol=2e-5)
                np.testing.assert_allclose(np.linalg.norm(t[:,:3],axis=1),1,atol=2e-5)
                np.testing.assert_allclose(np.sum(n*t[:,:3],axis=1),0,atol=2e-5)
                d1=uv[idx[:,1]]-uv[idx[:,0]];d2=uv[idx[:,2]]-uv[idx[:,0]]
                det=d1[:,0]*d2[:,1]-d1[:,1]*d2[:,0]
                self.assertTrue(np.all(np.abs(det)>1e-9))
                bitangent=(-e1*d2[:,0,None]+e2*d1[:,0,None])/det[:,None]
                for corner in range(3):
                    j=idx[:,corner]
                    expected=np.sign(np.sum(np.cross(n[j],t[j,:3])*bitangent,axis=1))
                    np.testing.assert_array_equal(t[j,3],expected)

if __name__=='__main__':unittest.main()
