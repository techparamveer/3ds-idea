"""Preservation and encoded texture checks for the UV1 lower-key map revision."""
import io,unittest
from collections import Counter
import numpy as np
from PIL import Image
from test_web_model import load,view,FOLDER
from test_plastic_normals import material,attribute
CAPS={'Button_SELECT','Button_HOME','Button_START'}

def values(asset,index):
 a=asset[0]['accessors'][index];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 dtype={5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]
 return np.frombuffer(attribute(asset,index),dtype=dtype).reshape(-1,size)

def triangles(asset,primitives):
 result=Counter()
 for p in primitives:
  attrs=[values(asset,p['attributes'][k]) for k in ['POSITION','NORMAL','TANGENT','TEXCOORD_0']]
  rows=np.concatenate(attrs,axis=1)
  for tri in values(asset,p['indices']).reshape(-1,3):
   vertices=[rows[i].tobytes() for i in tri]
   result[min(b''.join(vertices[j:]+vertices[:j]) for j in range(3))]+=1
 return result

class LowerLabelMaps(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.old=load('silver-lid-face.glb');cls.new=load('silver-lower-labels.glb')
 def test_geometry_frames_rig_and_other_materials_preserved(self):
  a,b=self.old,self.new;nodes={n['name']:n for n in b[0]['nodes']};self.assertEqual(len(nodes),len(a[0]['nodes']))
  for old in a[0]['nodes']:
   new=nodes[old['name']]
   for k in ['translation','rotation','scale','matrix']:self.assertEqual(old.get(k),new.get(k))
   self.assertEqual([a[0]['nodes'][i]['name'] for i in old.get('children',[])],[b[0]['nodes'][i]['name'] for i in new.get('children',[])])
   if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
   if 'mesh' not in old:continue
   pp=a[0]['meshes'][old['mesh']]['primitives'];qq=b[0]['meshes'][new['mesh']]['primitives']
   if old['name'] in CAPS:
    self.assertEqual(len(qq),2);self.assertEqual(triangles(a,pp),triangles(b,qq))
    unchanged=[q for q in qq if b[0]['materials'][q['material']]['name']!='Sourced clean lower-key lettering']
    self.assertEqual(len(unchanged),1);self.assertEqual(material(a,pp[0]['material']),material(b,unchanged[0]['material']))
   else:
    self.assertEqual(len(pp),len(qq))
    for p,q in zip(pp,qq):
     self.assertEqual(p['attributes'].keys(),q['attributes'].keys())
     for k in p['attributes']:self.assertEqual(attribute(a,p['attributes'][k]),attribute(b,q['attributes'][k]))
     self.assertEqual(attribute(a,p['indices']),attribute(b,q['indices']));self.assertEqual(material(a,p['material']),material(b,q['material']))
 def test_label_maps_use_uv1_and_preserve_authored_pixels(self):
  a=self.new;d=a[0];m=next(m for m in d['materials'] if m['name']=='Sourced clean lower-key lettering')
  maps={'basecolor':m['pbrMetallicRoughness']['baseColorTexture'],'metallic-roughness':m['pbrMetallicRoughness']['metallicRoughnessTexture'],'normal':m['normalTexture'],'specular':m['extensions']['KHR_materials_specular']['specularTexture']}
  for key,info in maps.items():
   self.assertEqual(info['texCoord'],1);tex=d['textures'][info['index']];im=d['images'][tex['source']]
   actual=np.asarray(Image.open(io.BytesIO(view(a,im['bufferView']))).convert('RGBA'))
   expected=np.asarray(Image.open(FOLDER/'derived-textures'/f'lower-clean-{key}.png').convert('RGB'))
   self.assertEqual(actual.shape[:2],(1024,1024))
   self.assertTrue(np.array_equal(actual[...,3],expected[...,0]) if key=='specular' else np.array_equal(actual[...,:3],expected),key)
 def test_new_material_is_only_on_planar_cap_tops(self):
  a=self.new;d=a[0];capcount=0
  for n in d['nodes']:
   if 'mesh' not in n:continue
   pp=d['meshes'][n['mesh']]['primitives'];allpos=np.concatenate([values(a,p['attributes']['POSITION']) for p in pp]);height=allpos[:,1].max()
   for p in pp:
    if d['materials'][p['material']]['name']!='Sourced clean lower-key lettering':continue
    self.assertIn(n['name'],CAPS);capcount+=1
    pos=values(a,p['attributes']['POSITION']);self.assertTrue(np.all(abs(pos[:,1]-height)<1e-5))
    uv=values(a,p['attributes']['TEXCOORD_1']);self.assertTrue(np.all((uv>=0)&(uv<=1)))
  self.assertEqual(capcount,3)
 def test_mip_filter_neighbourhood_has_padded_surface_values(self):
  a=self.new;d=a[0]
  normal=np.asarray(Image.open(FOLDER/'derived-textures/lower-clean-normal.png').convert('RGB'))
  rough=np.asarray(Image.open(FOLDER/'derived-textures/lower-clean-metallic-roughness.png').convert('RGB'))[...,1]
  for n in d['nodes']:
   if n.get('name') not in CAPS:continue
   for p in d['meshes'][n['mesh']]['primitives']:
    if d['materials'][p['material']]['name']!='Sourced clean lower-key lettering':continue
    xy=np.floor(values(a,p['attributes']['TEXCOORD_1'])*1024).astype(int)
    for ox,oy in [(-8,-8),(-8,8),(8,-8),(8,8),(0,0)]:
     q=np.clip(xy+[ox,oy],0,1023)
     self.assertTrue(np.all(normal[q[:,1],q[:,0]].any(axis=1)),n['name'])
     self.assertTrue(np.all(rough[q[:,1],q[:,0]]>0),n['name'])
if __name__=='__main__':unittest.main()
