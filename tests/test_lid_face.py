"""Check localized lid specular export without changing geometry or other maps."""
import io,unittest
import numpy as np
from PIL import Image
from test_web_model import load,view,FOLDER
from test_plastic_normals import attribute,material
class LidFaceTests(unittest.TestCase):
 def test_only_lid_specular_binding_changes(self):
  before,after=load('silver-upper-width.glb'),load('silver-lid-face.glb');nodes={n['name']:n for n in after[0]['nodes']}
  self.assertEqual(len(nodes),len(before[0]['nodes']))
  for old in before[0]['nodes']:
   new=nodes[old['name']]
   for key in ['translation','rotation','scale','matrix']:self.assertEqual(old.get(key),new.get(key))
   self.assertEqual([before[0]['nodes'][i]['name'] for i in old.get('children',[])],[after[0]['nodes'][i]['name'] for i in new.get('children',[])])
   if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
   if 'mesh' not in old:continue
   aa=before[0]['meshes'][old['mesh']]['primitives'];bb=after[0]['meshes'][new['mesh']]['primitives'];self.assertEqual(len(aa),len(bb))
   for a,b in zip(aa,bb):
    self.assertEqual(a['attributes'].keys(),b['attributes'].keys())
    for k in a['attributes']:self.assertEqual(attribute(before,a['attributes'][k]),attribute(after,b['attributes'][k]))
    self.assertEqual(attribute(before,a['indices']),attribute(after,b['indices']))
    m,n=material(before,a['material']),material(after,b['material'])
    if old['name']=='Sourced inner lid':
     self.assertNotEqual(m['extensions']['KHR_materials_specular']['specularTexture']['index'],n['extensions']['KHR_materials_specular']['specularTexture']['index'])
     n['extensions']['KHR_materials_specular']['specularTexture']['index']=m['extensions']['KHR_materials_specular']['specularTexture']['index'];n['name']=m['name']
    self.assertEqual(m,n,old['name'])
 def test_exported_alpha_matches_masked_specular_channel(self):
  asset=load('silver-lid-face.glb');d=asset[0];n=next(n for n in d['nodes'] if n.get('name')=='Sourced inner lid');p=d['meshes'][n['mesh']]['primitives'][0];m=d['materials'][p['material']]
  tex=d['textures'][m['extensions']['KHR_materials_specular']['specularTexture']['index']];im=d['images'][tex['source']]
  exported=np.asarray(Image.open(io.BytesIO(view(asset,im['bufferView']))).convert('RGBA'))
  authored=np.asarray(Image.open(FOLDER/'derived-textures/lid-face-specular.png').convert('RGB'))
  self.assertTrue(np.array_equal(exported[...,3],authored[...,0]))
  old=np.asarray(Image.open(FOLDER/'derived-textures/body-legends-specular.png').convert('RGB'));mask=np.asarray(Image.open(FOLDER/'derived-textures/lid-face-specular-mask.png'))
  self.assertTrue(np.array_equal(old[mask==0],authored[mask==0]));self.assertTrue(np.array_equal(old[...,1:],authored[...,1:]))
  self.assertTrue(np.all(authored[...,0]<=old[...,0]));self.assertGreater(np.count_nonzero(old[...,0]!=authored[...,0]),0)
 def test_barrel_and_back_vertex_uv_samples_are_protected(self):
  asset=load('silver-lid-face.glb');d=asset[0];n=next(n for n in d['nodes'] if n.get('name')=='Sourced inner lid');a=d['meshes'][n['mesh']]['primitives'][0]['attributes']
  xyz=np.frombuffer(attribute(asset,a['POSITION']),dtype='<f4').reshape(-1,3);uv=np.frombuffer(attribute(asset,a['TEXCOORD_0']),dtype='<f4').reshape(-1,2)
  selected=(xyz[:,2]<2)|(xyz[:,1]>1);self.assertGreater(int(selected.sum()),7000)
  xy=np.clip(np.floor(uv[selected]*4096).astype(int),0,4095)
  mask=np.asarray(Image.open(FOLDER/'derived-textures/lid-face-specular-mask.png'))
  self.assertEqual(int(mask[xy[:,1],xy[:,0]].max()),0)
if __name__=='__main__':unittest.main()
