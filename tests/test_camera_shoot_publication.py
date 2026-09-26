"""Published Camera environment remains a deterministic source resource."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.publish_camera_shoot import publish, ENTRY_SHA, MODEL_SHA, DEST, DELIVERY_SHA
PUBLIC = ROOT/'public/os/firmware/10.7.0-32E'


class CameraShootPublicationTests(unittest.TestCase):
    def test_delivered_model_identity_and_texture_closure(self):
        manifest = json.loads((PUBLIC/'manifest.json').read_text())
        url = manifest['models']['cameraShootBackground']
        self.assertEqual(url, DEST+'/model.json')
        self.assertEqual(hashlib.sha256((PUBLIC/url).read_bytes()).hexdigest(), DELIVERY_SHA)
        model = json.loads((PUBLIC/url).read_text())
        self.assertEqual(model['compressedSourceSha256'], ENTRY_SHA)
        self.assertEqual(model['sourceSha256'], MODEL_SHA)
        self.assertEqual(model['converter']['version'], '1.4.2')
        self.assertEqual(model['spicaRevision'], 'bd29a7828595d7839cda2ac61c76bb63f9071250')
        self.assertEqual([(m['name'], len(m['meshes'])) for m in model['models']],
                         [('P_Shoot_D', 3), ('X_Arw', 2), ('Z_Arw', 2), ('A_stick', 3)])
        self.assertEqual([m['Name'] for m in model['models'][0]['materials']], ['Grid1', 'target'])
        self.assertEqual([(t['name'], t['format'], t['width'], t['height']) for t in model['textures']],
                         [('grid', 'LA8', 32, 32), ('Btn', 'L8', 32, 64),
                          ('Arrow1', 'LA8', 64, 128), ('Arrow2', 'A8', 32, 64)])
        self.assertEqual(model['cameras'][0]['Name'], 'camera1')
        self.assertEqual(model['cameras'][0]['Projection']['AspectRatio'], 1.5)
        self.assertEqual(model['lights'][0]['Name'], 'pointLight1')
        self.assertEqual(model['lights'][0]['NativeType'], 'Point')
        for key in ('skeletalAnimations', 'materialAnimations', 'visibilityAnimations', 'cameraAnimations'):
            self.assertEqual(model[key], [])
        for name in ['model.json']+[t['url'] for t in model['textures']]:
            relative = DEST+'/'+name
            data = (PUBLIC/relative).read_bytes()
            record = manifest['resources'][relative]
            self.assertEqual(record['sha256'], hashlib.sha256(data).hexdigest())
            self.assertEqual(record['size'], len(data))
            self.assertEqual(record['sources'], [{'titleId': '0004001000022400',
                'contentIndex': 0, 'contentId': '0000001a',
                'path': 'contents/0000-0000001a/romfs/res/P_Shoot_D.bcenv.LZ', 'sha256': ENTRY_SHA}])
            if name != 'model.json':
                self.assertEqual(record['sha256'], next(t['sha256'] for t in model['textures'] if t['url'] == name))

    def test_wrong_source_is_rejected_before_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = root/'wrong'; source.write_bytes(b'not the Camera resource')
            with self.assertRaisesRegex(ValueError, 'Unexpected Camera shoot source'):
                publish(source, root/'converted', root/'output')
            self.assertFalse((root/'output').exists())


if __name__ == '__main__':
    unittest.main()
