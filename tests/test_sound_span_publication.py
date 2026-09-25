import hashlib
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT/'public/os/firmware/10.7.0-32E'


class SoundSpanPublicationTests(unittest.TestCase):
    def test_default_span_model_and_title_band_keep_native_sources(self):
        manifest = json.loads((PUBLIC/'manifest.json').read_text())
        title = '0004001000022500'
        url = manifest['models']['soundSpan']
        self.assertEqual(url, 'models/sound-span/model.json')
        model = json.loads((PUBLIC/url).read_text())
        self.assertEqual(model['sourceSha256'],
                         'ff9ce249149f835ecce97f693e3f2e1cabe3a2cfebb6bcdbb124d36d4005cf23')
        self.assertEqual(model['compressedSourceSha256'],
                         'c9558d7c10d0d6354b63aeb39ca173707cdb927d3344f23e51d5229c4b953244')
        self.assertEqual(model['models'][0]['name'], 'S_Vis_Span_U')
        self.assertEqual(len(model['models'][0]['meshes']), 34)
        self.assertEqual(model['skeletalAnimations'], [])
        for relative in [url, *(f'models/sound-span/{t["url"]}' for t in model['textures'])]:
            data = (PUBLIC/relative).read_bytes()
            record = manifest['resources'][relative]
            self.assertEqual(record['sha256'], hashlib.sha256(data).hexdigest())
            self.assertEqual(record['size'], len(data))
            self.assertEqual(record['sources'][0]['titleId'], title)
            self.assertEqual(record['sources'][0]['contentIndex'], 0)
            self.assertEqual(record['sources'][0]['contentId'], '0000000b')
            self.assertEqual(record['sources'][0]['path'],
                             'contents/0000-0000000b/romfs/res/S.pack/S_Vis_Span_U.bcmdl.LZ')

        info_url = 'packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json'
        info = json.loads((PUBLIC/info_url).read_text())
        band = info['layouts']['S_Inf_U-TitleBar']
        self.assertEqual(band['textures'],
                         ['TitleBar_Base.bclim', 'TitleBar_Bevel.bclim', 'TitleBar_Reflect.bclim'])
        self.assertEqual(info['resourceSources']['layouts']['S_Inf_U-TitleBar']['path'],
                         'lyt/S_Inf_U.arc.LZ/blyt/S_Inf_U-TitleBar.bclyt')
        self.assertEqual(manifest['resources'][info_url]['sha256'],
                         hashlib.sha256((PUBLIC/info_url).read_bytes()).hexdigest())


if __name__ == '__main__':
    unittest.main()
