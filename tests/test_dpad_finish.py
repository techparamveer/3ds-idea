"""D-pad material-only export verification."""
import hashlib
import unittest
import numpy as np
from PIL import Image
from test_web_model import load,FOLDER
from test_plastic_normals import attribute,material

class DpadFinishTests(unittest.TestCase):
    def test_only_dpad_roughness_binding_and_normal_scale_change(self):
        before,after=load('silver-dpad-fit.glb'),load('silver-dpad-finish.glb')
        nodes={n['name']:n for n in after[0]['nodes']}
        self.assertEqual(len(nodes),len(before[0]['nodes']))
        expected=hashlib.sha256((FOLDER/'derived-textures/dpad-metallic-roughness.png').read_bytes()).hexdigest()
        for old in before[0]['nodes']:
            new=nodes[old['name']]
            for key in ['translation','rotation','scale','matrix']:self.assertEqual(old.get(key),new.get(key))
            self.assertEqual([before[0]['nodes'][i]['name'] for i in old.get('children',[])],[after[0]['nodes'][i]['name'] for i in new.get('children',[])])
            if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
            if 'mesh' not in old:continue
            a=before[0]['meshes'][old['mesh']]['primitives'];b=after[0]['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(a),len(b))
            for p,q in zip(a,b):
                self.assertEqual(p['attributes'].keys(),q['attributes'].keys())
                for key in p['attributes']:self.assertEqual(attribute(before,p['attributes'][key]),attribute(after,q['attributes'][key]))
                self.assertEqual(attribute(before,p['indices']),attribute(after,q['indices']))
                m,n=material(before,p['material']),material(after,q['material'])
                if old['name']=='Button_Dpad':
                    self.assertAlmostEqual(n['normalTexture']['scale'],.15,places=6)
                    if 'scale' in m['normalTexture']:n['normalTexture']['scale']=m['normalTexture']['scale']
                    else:n['normalTexture'].pop('scale')
                    self.assertEqual(n['pbrMetallicRoughness']['metallicRoughnessTexture']['index'],expected)
                    n['pbrMetallicRoughness']['metallicRoughnessTexture']['index']=m['pbrMetallicRoughness']['metallicRoughnessTexture']['index']
                    if 'occlusionTexture' in n:
                        self.assertEqual(n['occlusionTexture']['index'],expected)
                        n['occlusionTexture']['index']=m['occlusionTexture']['index']
                    n['name']=m['name']
                self.assertEqual(m,n,old['name'])

    def test_map_preserves_occlusion_and_metallic(self):
        a=np.asarray(Image.open(FOLDER/'derived-textures/body-legends-metallic-roughness.png').convert('RGB'))
        b=np.asarray(Image.open(FOLDER/'derived-textures/dpad-metallic-roughness.png').convert('RGB'))
        self.assertTrue(np.array_equal(a[...,[0,2]],b[...,[0,2]]))
        self.assertTrue(np.all((b[...,1]>=117)&(b[...,1]<=138)))
        self.assertGreater(int(b[...,1].max()),int(b[...,1].min()))

if __name__=='__main__':unittest.main()
