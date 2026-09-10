"""Upper cover export: original geometry/UVs plus correctly mapped border textures."""
import hashlib
import io
import unittest
import numpy as np
from PIL import Image
from test_web_model import load,view,FOLDER
from test_plastic_normals import attribute,material

class UpperCoverTests(unittest.TestCase):
    def test_preserves_geometry_rig_original_uvs_and_other_materials(self):
        before,after=load('silver-dpad-finish.glb'),load('silver-upper-cover.glb')
        nodes={n['name']:n for n in after[0]['nodes']};self.assertEqual(len(nodes),len(before[0]['nodes']))
        for old in before[0]['nodes']:
            new=nodes[old['name']]
            for key in ['translation','rotation','scale','matrix']:self.assertEqual(old.get(key),new.get(key))
            self.assertEqual([before[0]['nodes'][i]['name'] for i in old.get('children',[])],[after[0]['nodes'][i]['name'] for i in new.get('children',[])])
            if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
            if 'mesh' not in old:continue
            a=before[0]['meshes'][old['mesh']]['primitives'];b=after[0]['meshes'][new['mesh']]['primitives'];self.assertEqual(len(a),len(b))
            for p,q in zip(a,b):
                self.assertEqual(set(q['attributes']),set(p['attributes'])|({'TEXCOORD_1'} if old['name']=='Screen_Top' else set()))
                for key in p['attributes']:self.assertEqual(attribute(before,p['attributes'][key]),attribute(after,q['attributes'][key]),(old['name'],key))
                self.assertEqual(attribute(before,p['indices']),attribute(after,q['indices']))
                if old['name']!='Screen_Top':self.assertEqual(material(before,p['material']),material(after,q['material']))
                else:
                    m=material(after,q['material']);prior=material(before,p['material'])
                    self.assertEqual(m['extensions'],prior['extensions']);self.assertEqual(m['extras'],prior['extras'])
                    self.assertEqual(m['doubleSided'],prior['doubleSided']);self.assertNotIn('alphaMode',m)
                    self.assertNotIn('normalTexture',m);self.assertNotIn('occlusionTexture',m)
                    pbr=m['pbrMetallicRoughness'];self.assertEqual(pbr['metallicFactor'],0)
                    self.assertEqual(pbr.get('roughnessFactor',1),1);self.assertEqual(pbr.get('baseColorFactor',[1,1,1,1]),[1,1,1,1])
                    for key in ['baseColorTexture','metallicRoughnessTexture']:self.assertEqual(pbr[key]['texCoord'],1)
                    self.assertEqual(pbr['baseColorTexture']['index'],hashlib.sha256((FOLDER/'derived-textures/upper-cover-colour.png').read_bytes()).hexdigest())
                    position=np.frombuffer(attribute(after,q['attributes']['POSITION']),dtype='<f4').reshape(-1,3)
                    uv=np.frombuffer(attribute(after,q['attributes']['TEXCOORD_1']),dtype='<f4').reshape(-1,2)
                    expected=(position[:,[0,2]]-position[:,[0,2]].min(axis=0))/np.ptp(position[:,[0,2]],axis=0)
                    np.testing.assert_allclose(uv,expected,atol=1e-6)

    def test_exported_roughness_pixels_match_authored_transition(self):
        asset=load('silver-upper-cover.glb');doc=asset[0]
        node=next(n for n in doc['nodes'] if n['name']=='Screen_Top')
        primitive=doc['meshes'][node['mesh']]['primitives'][0]
        material=doc['materials'][primitive['material']]
        texture=doc['textures'][material['pbrMetallicRoughness']['metallicRoughnessTexture']['index']]
        image=doc['images'][texture['source']]
        actual=np.asarray(Image.open(io.BytesIO(view(asset,image['bufferView']))).convert('RGB'))
        expected=np.asarray(Image.open(FOLDER/'derived-textures/upper-cover-metallic-roughness.png').convert('RGB'))
        self.assertTrue(np.array_equal(actual[...,1],expected[...,1]))
        self.assertEqual(int(actual[1024,1024,1]),46)
        self.assertEqual(int(actual[1024,10,1]),89)

if __name__=='__main__':unittest.main()
