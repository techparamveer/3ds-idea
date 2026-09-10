"""Independent export invariants for the dark-plastic normal correction."""
import copy
import hashlib
import unittest
import numpy as np
from PIL import Image
from test_web_model import load, view, FOLDER


def attribute(asset, index):
    doc, _ = asset
    accessor = doc['accessors'][index]
    data = view(asset, accessor['bufferView'])
    width = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4}[accessor['type']]*{5121:1,5123:2,5125:4,5126:4}[accessor['componentType']]
    stride = doc['bufferViews'][accessor['bufferView']].get('byteStride', width)
    start = accessor.get('byteOffset', 0)
    return b''.join(data[start+i*stride:start+i*stride+width] for i in range(accessor['count']))


def material(asset, index):
    doc, _ = asset
    result = copy.deepcopy(doc['materials'][index])
    def resolve(obj):
        for key, value in obj.items():
            if not isinstance(value, dict): continue
            if key.endswith('Texture') and 'index' in value:
                texture = doc['textures'][value['index']]
                image = doc['images'][texture['source']]
                value['index'] = hashlib.sha256(view(asset, image['bufferView'])).hexdigest()
                value['sampler'] = doc.get('samplers', [])[texture['sampler']] if 'sampler' in texture else None
            else: resolve(value)
    resolve(result)
    return result


class PlasticNormalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.before = load('silver-screen-backings.glb')
        cls.after = load('silver-plastic-normals.glb')

    def test_geometry_rig_all_uvs_and_unrelated_materials_preserved(self):
        before, after = self.before[0], self.after[0]
        self.assertEqual(len(before['nodes']), len(after['nodes']))
        nodes = {n['name']:n for n in after['nodes']}
        affected = {'Sourced graphite chassis':'deck', 'Sourced inner lid':'lid'}
        for old in before['nodes']:
            new = nodes[old['name']]
            for key in ['translation','rotation','scale','matrix']:
                self.assertEqual(old.get(key), new.get(key), (old['name'],key))
            self.assertEqual([before['nodes'][i]['name'] for i in old.get('children',[])], [after['nodes'][i]['name'] for i in new.get('children',[])])
            if 'mesh' not in old: continue
            a, b = before['meshes'][old['mesh']]['primitives'], after['meshes'][new['mesh']]['primitives']
            self.assertEqual(len(a), len(b))
            for p, q in zip(a,b):
                self.assertEqual(p['attributes'].keys(), q['attributes'].keys())
                for key in p['attributes']:
                    self.assertEqual(attribute(self.before,p['attributes'][key]),attribute(self.after,q['attributes'][key]), (old['name'],key))
                self.assertEqual(attribute(self.before,p['indices']),attribute(self.after,q['indices']))
                m, n = material(self.before,p['material']), material(self.after,q['material'])
                if old['name'] in affected:
                    part = affected[old['name']]
                    expected = hashlib.sha256((FOLDER/f'derived-textures/plastic-normal-study-{part}.png').read_bytes()).hexdigest()
                    self.assertEqual(n['normalTexture']['index'],expected)
                    n['normalTexture']['index'] = m['normalTexture']['index']
                    n['name'] = m['name']
                self.assertEqual(m,n,old['name'])

    def test_fully_painted_silver_texels_unchanged(self):
        paint = np.asarray(Image.open(FOLDER/'derived-textures/body-eur-paint-mask.png').convert('L')) == 255
        for part, source in [('deck','paint-cover-restrained-normal.png'),('lid','body-slider-dot-normal.png')]:
            a = np.asarray(Image.open(FOLDER/'derived-textures'/source).convert('RGB'))
            b = np.asarray(Image.open(FOLDER/f'derived-textures/plastic-normal-study-{part}.png').convert('RGB'))
            self.assertTrue(np.array_equal(a[paint],b[paint]))
            self.assertGreater(np.count_nonzero(a != b),0)


if __name__ == '__main__': unittest.main()
