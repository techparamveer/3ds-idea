"""Only the audio insert's normal strength may differ in the new export."""
import unittest
from test_web_model import load
from test_plastic_normals import attribute, material


class AudioFinish(unittest.TestCase):
    def test_exact_geometry_rig_maps_and_unrelated_materials(self):
        a,b=load('silver-audio-socket.glb'),load('silver-audio-finish.glb')
        nodes={n['name']:n for n in b[0]['nodes']}
        self.assertEqual(len(nodes),len(a[0]['nodes']))
        affected=0
        for old in a[0]['nodes']:
            new=nodes[old['name']]
            for key in ['translation','rotation','scale','matrix']:
                self.assertEqual(old.get(key),new.get(key))
            self.assertEqual([a[0]['nodes'][i]['name'] for i in old.get('children',[])],
                             [b[0]['nodes'][i]['name'] for i in new.get('children',[])])
            if old['name']!='3DS_XL':self.assertEqual(old.get('extras'),new.get('extras'))
            if 'mesh' not in old:continue
            pp=a[0]['meshes'][old['mesh']]['primitives'];qq=b[0]['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(pp),len(qq))
            for p,q in zip(pp,qq):
                self.assertEqual(p['attributes'].keys(),q['attributes'].keys())
                for key in p['attributes']:
                    self.assertEqual(attribute(a,p['attributes'][key]),attribute(b,q['attributes'][key]))
                self.assertEqual(attribute(a,p['indices']),attribute(b,q['indices']))
                m,n=material(a,p['material']),material(b,q['material'])
                if old['name']=='Source_0_part_19':
                    affected+=1
                    self.assertAlmostEqual(m['normalTexture'].get('scale',1),1)
                    self.assertAlmostEqual(n['normalTexture']['scale'],.2)
                    n['normalTexture'].pop('scale')
                    if 'scale' in m['normalTexture']:n['normalTexture']['scale']=m['normalTexture']['scale']
                    n['name']=m['name']
                self.assertEqual(m,n,old['name'])
        self.assertEqual(affected,1)

if __name__=='__main__':unittest.main()
