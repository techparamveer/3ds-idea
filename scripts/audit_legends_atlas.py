"""Read-only image/UV audit of Blender's lower-key texture outputs."""
from pathlib import Path
import hashlib
import json
import struct
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'model/candidates/joshua-xl'
DERIVED = FOLDER/'derived-textures'
report = {'source': 'silver-front.glb', 'maps': {}}
mask = np.array(Image.open(DERIVED/'body-legends-edit-mask.png')) > 0
ink = np.array(Image.open(DERIVED/'body-legends-ink-mask.png'))
assert mask.shape == (4096, 4096) and ink.shape == mask.shape
assert 1000 < np.count_nonzero(mask) < 45000
assert np.count_nonzero(ink > 100) > 200
assert np.count_nonzero((ink > 0) & ~mask) == 0

data = (FOLDER/'silver-front.glb').read_bytes()
size = struct.unpack_from('<I', data, 12)[0]
doc = json.loads(data[20:20+size])
binary = data[28+size:]
def accessor(index):
    item = doc['accessors'][index]
    view = doc['bufferViews'][item['bufferView']]
    dtype = {5123:'<u2',5125:'<u4',5126:'<f4'}[item['componentType']]
    width = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[item['type']]
    offset = view.get('byteOffset',0)+item.get('byteOffset',0)
    stride = view.get('byteStride', np.dtype(dtype).itemsize*width)
    return np.ndarray((item['count'],width), dtype=dtype, buffer=binary,
                      offset=offset, strides=(stride,np.dtype(dtype).itemsize)).copy()

coverage = np.zeros_like(mask)
for name in ['Button_SELECT','Button_HOME','Button_START']:
    node = next(n for n in doc['nodes'] if n.get('name') == name)
    primitive = doc['meshes'][node['mesh']]['primitives'][0]
    p = accessor(primitive['attributes']['POSITION'])
    uv = accessor(primitive['attributes']['TEXCOORD_0'])*4096
    part = np.zeros_like(mask)
    for tri in accessor(primitive['indices']).reshape(-1,3):
        normal = np.cross(p[tri[1]]-p[tri[0]],p[tri[2]]-p[tri[0]])
        if normal[1]/np.linalg.norm(normal) < .9:
            continue
        a,b,c = uv[tri]
        lo = np.maximum(np.floor(np.minimum.reduce([a,b,c])).astype(int)-1,0)
        hi = np.minimum(np.ceil(np.maximum.reduce([a,b,c])).astype(int)+1,4096)
        X,Y = np.meshgrid(np.arange(lo[0],hi[0])+.5,np.arange(lo[1],hi[1])+.5)
        d,e = b-a,c-a
        determinant = d[0]*e[1]-d[1]*e[0]
        u = ((X-a[0])*e[1]-(Y-a[1])*e[0])/determinant
        v = (d[0]*(Y-a[1])-d[1]*(X-a[0]))/determinant
        part[lo[1]:hi[1],lo[0]:hi[0]] |= (u>=0)&(v>=0)&(u+v<=1)
    assert np.count_nonzero((ink>100)&part)>50, name+' needs readable transferred ink'
    report[name] = {'ink_pixels': int(np.count_nonzero((ink>0)&part)),
                    'core_ink_pixels': int(np.count_nonzero((ink>200)&part))}
    coverage |= part
coverage = np.maximum.reduce([np.roll(coverage,(dy,dx),(0,1)) for dy in [-1,0,1] for dx in [-1,0,1]])
assert np.count_nonzero(mask & ~coverage) == 0, 'Edits escaped the three top-face UV regions'
overlap = {}
for node in doc['nodes']:
    if 'mesh' not in node:
        continue
    primitive = doc['meshes'][node['mesh']]['primitives'][0]
    if primitive.get('material') != 0:
        continue
    p = accessor(primitive['attributes']['POSITION'])
    uv = accessor(primitive['attributes']['TEXCOORD_0'])*4096
    count = 0
    for tri in accessor(primitive['indices']).reshape(-1,3):
        normal = np.cross(p[tri[1]]-p[tri[0]],p[tri[2]]-p[tri[0]])
        if node['name'] in ['Button_SELECT','Button_HOME','Button_START'] and normal[1]/np.linalg.norm(normal) > .9:
            continue
        a,b,c = uv[tri]
        lo = np.maximum(np.floor(np.minimum.reduce([a,b,c])).astype(int),0)
        hi = np.minimum(np.ceil(np.maximum.reduce([a,b,c])).astype(int),4096)
        local_mask = mask[lo[1]:hi[1],lo[0]:hi[0]]
        if not np.any(local_mask):
            continue
        d,e = b-a,c-a
        determinant = d[0]*e[1]-d[1]*e[0]
        if abs(determinant)<1e-7:
            continue
        rows,columns = np.nonzero(local_mask)
        X,Y = columns+lo[0]+.5,rows+lo[1]+.5
        u = ((X-a[0])*e[1]-(Y-a[1])*e[0])/determinant
        v = (d[0]*(Y-a[1])-d[1]*(X-a[0]))/determinant
        count += int(np.count_nonzero((u>1e-5)&(v>1e-5)&(u+v<1-1e-5)))
    if count:
        overlap[node['name']] = count
assert not overlap, ('Unrelated source faces share edited UV pixels', overlap)
report['other_face_overlap'] = overlap
for name in ['basecolor','normal','metallic-roughness']:
    before = np.array(Image.open(DERIVED/('body-eur-'+name+'.png')))
    path = DERIVED/('body-legends-'+name+'.png')
    after = np.array(Image.open(path))
    assert before.shape == after.shape == (4096,4096,3)
    changed = np.any(before != after, axis=2)
    outside = int(np.count_nonzero(changed & ~mask))
    assert outside == 0, (name, outside)
    assert np.count_nonzero(changed)>200
    if name == 'basecolor':
        assert np.all(after[ink>200].astype(int).mean(1) < before[ink>200].astype(int).mean(1)), 'Ink must darken the substrate'
    report['maps'][name] = {'changed_pixels': int(np.count_nonzero(changed)),
                            'outside_edit_changed': outside, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
report['edited_pixels'] = int(np.count_nonzero(mask))
report['outside_top_faces'] = 0
path = DERIVED/'body-legends-specular.png'
specular = np.array(Image.open(path))
assert specular.shape == mask.shape
assert np.all(specular[~mask] == 255)
expected = np.rint(255-.95*ink.astype(float))
assert abs(specular.astype(float)-expected).max() <= 1
assert specular.min() >= 12 and np.count_nonzero(specular<150)>100
report['maps']['specular'] = {'changed_pixels': int(np.count_nonzero(specular!=255)),
    'outside_edit_changed': 0, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
(FOLDER/'legends-pixel-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
