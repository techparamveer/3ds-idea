"""Read-only identification of the native relief trial's atlas regions."""
from pathlib import Path
import hashlib
import json
import struct
import ast
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl'
REGIONS={'POWER':(373,124,428,284),'MIC':(623,475,653,518)}
tree=ast.parse((ROOT/'scripts/inspect_etched_legends.py').read_text())
glyphs=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign)
            and any(isinstance(t,ast.Name) and t.id=='PHOTO_GLYPHS' for t in n.targets))
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
    physical_fit=None
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
            center=np.array([(x0+x1)/2,(y0+y1)/2])
            bary=np.linalg.solve(np.column_stack([d,e]),center-a)
            if np.all(bary>=0) and bary.sum()<=1:
                xyz=accessor(p['attributes']['POSITION'])[indices]
                physical_fit=np.linalg.solve(np.column_stack([uv[indices],np.ones(3)]),xyz)
        if mask.any():coverage[node['name']]=int(mask.sum())
    assert list(coverage)==['Sourced graphite chassis'],(name,coverage)
    assert coverage['Sourced graphite chassis']==X.size
    assert physical_fit is not None
    pitch=np.linalg.norm(physical_fit[:2],axis=1)
    assert np.allclose(pitch,glyphs[name]['pitch_mm'],atol=.00001,rtol=0)
    gx0,gy0,gx1,gy1=glyphs[name]['glyph_rect']
    assert x0<gx0<gx1<x1 and y0<gy0<gy1<y1
    report['regions'][name]={'rectangle_png_pixels':[x0,y0,x1,y1],
        'baseline_min_rgb':columns.min((0,1)).tolist(),
        'baseline_max_rgb':columns.max((0,1)).tolist(),'covered_pixels':coverage,
        'atlas_pixel_to_local_position':physical_fit.tolist(),
        'physical_pixel_pitch_mm':pitch.tolist(),
        'photographic_projection':glyphs[name],
        'projected_crop_width_height_mm':[(gy1-gy0)*pitch[1],(gx1-gx0)*pitch[0]]}
output=FOLDER/'etched-region-audit.json'
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
