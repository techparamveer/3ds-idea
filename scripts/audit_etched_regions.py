"""Read-only identification of the native relief trial's atlas regions."""
from pathlib import Path
import hashlib
import json
import struct
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl'
REGIONS={'POWER':(373,124,428,284),'MIC':(623,475,653,518)}
data=(FOLDER/'silver-legends.glb').read_bytes()
size=struct.unpack_from('<I',data,12)[0]
doc=json.loads(data[20:20+size]);binary=data[28+size:]

def accessor(index):
    a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
    dtype={5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]
    width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    step=np.dtype(dtype).itemsize
    return np.ndarray((a['count'],width),dtype=dtype,buffer=binary,
        offset=v.get('byteOffset',0)+a.get('byteOffset',0),
        strides=(v.get('byteStride',step*width),step))

image=np.array(Image.open(FOLDER/'derived-textures/body-legends-normal.png'))
report={'checkpoint_sha256':hashlib.sha256(data).hexdigest(),'regions':{},
        'status':'Native trial only; homepage and saved production shader unchanged.'}
for name,(x0,y0,x1,y1) in REGIONS.items():
    columns=image[y0:y1,[x0,x1]]
    # The former MIC rectangle intersected a bevel (normal B as low as 195).
    # Both reference columns must describe the flat substrate, not that edge.
    assert columns[:,:,2].min()==255,(name,'bevel contaminates baseline')
    X,Y=np.meshgrid(np.arange(x0,x1)+.5,np.arange(y0,y1)+.5)
    coverage={}
    for node in doc['nodes']:
        if 'mesh' not in node:continue
        p=doc['meshes'][node['mesh']]['primitives'][0]
        if p.get('material')!=0:continue
        uv=accessor(p['attributes']['TEXCOORD_0'])*4096
        mask=np.zeros(X.shape,bool)
        for indices in accessor(p['indices']).reshape(-1,3):
            a,b,c=uv[indices]
            if np.max([a[0],b[0],c[0]])<x0 or np.min([a[0],b[0],c[0]])>x1:continue
            if np.max([a[1],b[1],c[1]])<y0 or np.min([a[1],b[1],c[1]])>y1:continue
            d,e=b-a,c-a;det=d[0]*e[1]-d[1]*e[0]
            if abs(det)<1e-7:continue
            u=((X-a[0])*e[1]-(Y-a[1])*e[0])/det
            v=(d[0]*(Y-a[1])-d[1]*(X-a[0]))/det
            mask|=(u>=0)&(v>=0)&(u+v<=1)
        if mask.any():coverage[node['name']]=int(mask.sum())
    assert list(coverage)==['Sourced graphite chassis'],(name,coverage)
    assert coverage['Sourced graphite chassis']==X.size
    report['regions'][name]={'rectangle_png_pixels':[x0,y0,x1,y1],
        'baseline_min_rgb':columns.min((0,1)).tolist(),
        'baseline_max_rgb':columns.max((0,1)).tolist(),'covered_pixels':coverage}
output=FOLDER/'etched-region-audit.json'
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
