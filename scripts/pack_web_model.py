"""Pack a web GLB with lossless textures; retain all geometry and decoded pixels.

Requires Pillow with WebP. Authoring GLBs and texture sources remain untouched.
"""
import argparse
import copy
import hashlib
import io
import json
from pathlib import Path
import struct
from PIL import Image


def digest(data): return hashlib.sha256(data).hexdigest()


def main(source, output):
    assert source.resolve() != output.resolve(), 'Keep the authoring GLB intact'
    data = source.read_bytes()
    magic, version, length = struct.unpack_from('<4sII', data)
    assert magic == b'glTF' and version == 2 and length == len(data)
    size, kind = struct.unpack_from('<I4s', data, 12); assert kind == b'JSON'
    doc = json.loads(data[20:20+size]); binary = data[28+size:]
    assert len(doc['buffers']) == 1
    original = copy.deepcopy(doc)
    replacements, converted, report = {}, set(), []
    for index, image in enumerate(doc['images']):
        view_index = image['bufferView']; view = doc['bufferViews'][view_index]
        raw = binary[view.get('byteOffset', 0):view.get('byteOffset', 0)+view['byteLength']]
        with Image.open(io.BytesIO(raw)) as decoded:
            rgba = decoded.convert('RGBA')
            encoded = io.BytesIO()
            rgba.save(encoded, format='WEBP', lossless=True, exact=True, method=4)
            candidate = encoded.getvalue()
            with Image.open(io.BytesIO(candidate)) as check:
                assert check.size == rgba.size and check.convert('RGBA').tobytes() == rgba.tobytes(), image.get('name')
            use = len(candidate) < len(raw)
            if use:
                assert view_index not in replacements
                replacements[view_index] = candidate
                image['mimeType'] = 'image/webp'; converted.add(index)
            report.append({'name': image.get('name'), 'image_index': index,
                           'dimensions': list(rgba.size), 'rgba_sha256': digest(rgba.tobytes()),
                           'before_bytes': len(raw), 'after_bytes': len(candidate) if use else len(raw),
                           'format': 'webp' if use else 'original', 'pixels_identical': True})
            print(image.get('name'), len(raw), '->', report[-1]['after_bytes'], flush=True)
    for texture in doc['textures']:
        if texture.get('source') in converted:
            texture.setdefault('extensions', {})['EXT_texture_webp'] = {'source': texture.pop('source')}
    if converted:
        for key in ['extensionsUsed', 'extensionsRequired']:
            if 'EXT_texture_webp' not in doc.setdefault(key, []): doc[key].append('EXT_texture_webp')
    packed = bytearray()
    for index, view in enumerate(doc['bufferViews']):
        raw = binary[view.get('byteOffset', 0):view.get('byteOffset', 0)+view['byteLength']]
        payload = replacements.get(index, raw)
        packed.extend(b'\0' * (-len(packed) % 4))
        view['byteOffset'], view['byteLength'] = len(packed), len(payload)
        packed.extend(payload)
        if index not in replacements:
            assert bytes(packed[view['byteOffset']:view['byteOffset']+view['byteLength']]) == raw
    packed.extend(b'\0' * (-len(packed) % 4)); doc['buffers'][0]['byteLength'] = len(packed)
    for key in ['nodes', 'meshes', 'accessors', 'materials', 'animations', 'skins', 'samplers', 'scenes']:
        assert doc.get(key) == original.get(key), key
    text = json.dumps(doc, separators=(',', ':')).encode(); text += b' ' * (-len(text) % 4)
    result = struct.pack('<4sII', b'glTF', 2, 28+len(text)+len(packed)) + struct.pack('<I4s', len(text), b'JSON') + text + struct.pack('<I4s', len(packed), b'BIN\0') + packed
    output.write_bytes(result)
    audit = {'source': source.name, 'output': output.name, 'source_sha256': digest(data),
             'output_sha256': digest(result), 'before_bytes': len(data), 'after_bytes': len(result),
             'saved_fraction': 1-len(result)/len(data), 'images': report,
             'geometry_rig_materials_identical': True}
    output.with_suffix('.packing.json').write_text(json.dumps(audit, indent=2)+'\n')
    print(json.dumps({k: v for k, v in audit.items() if k != 'images'}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path); parser.add_argument('output', type=Path)
    args = parser.parse_args(); main(args.source, args.output)
