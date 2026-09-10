"""Power material and cropped-normal UV export verification."""
import hashlib
import unittest
import numpy as np
from PIL import Image
from test_web_model import load,FOLDER
from test_plastic_normals import attribute,material

class PowerFinishTests(unittest.TestCase):
    def test_only_power_material_and_second_uv_change(self):
        before,after=load('silver-power-fit.glb'),load('silver-power-finish.glb')
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
                self.assertEqual(set(p['attributes']) | ({'TEXCOORD_1'} if old['name']=='Button_POWER' else set()),set(q['attributes']))
                for key in p['attributes']:self.assertEqual(attribute(before,p['attributes'][key]),attribute(after,q['attributes'][key]))
                self.assertEqual(attribute(before,p['indices']),attribute(after,q['indices']))
                m,n=material(before,p['material']),material(after,q['material'])
                if old['name']=='Button_POWER':
                    normal_hash=hashlib.sha256((FOLDER/'derived-textures/power-rim-normal-crop.png').read_bytes()).hexdigest()
                    self.assertEqual(n['normalTexture']['index'],normal_hash)
                    self.assertEqual(n['normalTexture']['texCoord'],1)
                    n['normalTexture']=m['normalTexture']
                    uv0=np.frombuffer(attribute(after,q['attributes']['TEXCOORD_0']),dtype='<f4').reshape(-1,2)
                    uv1=np.frombuffer(attribute(after,q['attributes']['TEXCOORD_1']),dtype='<f4').reshape(-1,2)
                    np.testing.assert_allclose(uv1,(uv0*4096-[3220,494])/[831,229],atol=2e-6)
                    self.assertEqual(n['pbrMetallicRoughness']['metallicRoughnessTexture']['index'],expected)
                    n['pbrMetallicRoughness']['metallicRoughnessTexture']['index']=m['pbrMetallicRoughness']['metallicRoughnessTexture']['index']
                    if 'occlusionTexture' in n:
                        self.assertEqual(n['occlusionTexture']['index'],expected)
                        n['occlusionTexture']['index']=m['occlusionTexture']['index']
                    n['name']=m['name']
                self.assertEqual(m,n,old['name'])

    def test_symbol_samples_and_unmasked_normal_pixels_are_preserved(self):
        asset=load('silver-power-finish.glb');d=asset[0]
        node=next(n for n in d['nodes'] if n.get('name')=='Button_POWER')
        p=d['meshes'][node['mesh']]['primitives'][0]
        xyz=np.frombuffer(attribute(asset,p['attributes']['POSITION']),dtype='<f4').reshape(-1,3)
        uv=np.frombuffer(attribute(asset,p['attributes']['TEXCOORD_0']),dtype='<f4').reshape(-1,2)
        r=np.linalg.norm(xyz[:,[0,2]]-[-.0925045,.000011444],axis=1)
        selected=(r<2.2)&(xyz[:,1]>.5);self.assertGreater(int(selected.sum()),1000)
        pixels=np.floor(uv[selected]*4096).astype(int)
        mask=np.asarray(Image.open(FOLDER/'derived-textures/power-rim-mask.png'))
        self.assertEqual(int(mask[pixels[:,1],pixels[:,0]].max()),0)
        old=np.asarray(Image.open(FOLDER/'derived-textures/body-etched-normal.png'))
        new=np.asarray(Image.open(FOLDER/'derived-textures/power-rim-normal.png'))
        self.assertTrue(np.array_equal(old[mask==0],new[mask==0]))
        self.assertGreater(int(np.any(old!=new,axis=-1).sum()),0)
        crop=np.asarray(Image.open(FOLDER/'derived-textures/power-rim-normal-crop.png'))
        self.assertTrue(np.array_equal(crop,new[494:723,3220:4051]))

    def test_map_preserves_occlusion_and_metallic(self):
        a=np.asarray(Image.open(FOLDER/'derived-textures/body-legends-metallic-roughness.png').convert('RGB'))
        b=np.asarray(Image.open(FOLDER/'derived-textures/dpad-metallic-roughness.png').convert('RGB'))
        self.assertTrue(np.array_equal(a[...,[0,2]],b[...,[0,2]]))
        self.assertTrue(np.all((b[...,1]>=117)&(b[...,1]<=138)))
        self.assertGreater(int(b[...,1].max()),int(b[...,1].min()))

if __name__=='__main__':unittest.main()
