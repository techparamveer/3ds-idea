"""Read-only verification of the Blender/glTF specular-channel conversion."""
from pathlib import Path
import hashlib
import io
import json
import struct
import numpy as np
from PIL import Image

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
data = (FOLDER/'silver-legends.glb').read_bytes()
size = struct.unpack_from('<I',data,12)[0]
doc = json.loads(data[20:20+size])
binary = data[28+size:]
material = doc['materials'][0]
extension = material['extensions']['KHR_materials_specular']
assert extension.get('specularFactor',1) == 1
assert extension.get('specularColorFactor',[1,1,1]) == [1,1,1]
texture = extension['specularTexture']
assert texture.get('texCoord',0) == 0
image = doc['images'][doc['textures'][texture['index']]['source']]
view = doc['bufferViews'][image['bufferView']]
payload = binary[view['byteOffset']:view['byteOffset']+view['byteLength']]
pixels = np.array(Image.open(io.BytesIO(payload)).convert('RGBA'))
expected = np.array(Image.open(FOLDER/'derived-textures/body-legends-specular.png'))
assert pixels.shape == (4096,4096,4)
error = abs(pixels[:,:,3].astype(int)-expected.astype(int))
assert error.max() <= 1, ('Exported specular alpha differs from authored factor',int(error.max()))
mask = np.array(Image.open(FOLDER/'derived-textures/body-legends-edit-mask.png'))>0
assert np.all(pixels[:,:,3][~mask] == 255)
report = {'glb_sha256': hashlib.sha256(data).hexdigest(), 'specular_texture_sha256': hashlib.sha256(payload).hexdigest(),
          'maximum_alpha_error': int(error.max()), 'outside_edit_specular_factor': 1,
          'specular_texcoord': 0, 'minimum_specular_alpha': int(pixels[:,:,3].min()),
          'interpretation': 'Authored grayscale factor transferred into glTF specularTexture alpha; original factor retained outside the lettering.'}
(FOLDER/'legends-export-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
