"""Restore source hinge roughness through a bounded, interpolated UV mask."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from build_socket_surface_maps import raster
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl'

def strength(p):
    t=np.clip((p[...,1]+7.4),0,1)
    return t*t*(3-2*t)

def main():
    data=np.load(ROOT/'.local/hinge-uv-data.npz');points=data['points'];faces=data['faces'];uvs=data['uv']
    mask=np.zeros((4096,4096),np.float32)
    for face,uv in zip(faces,uvs):
        p=points[face]
        if p[:,1].max()<=-7.4:continue
        result=raster(uv)
        if result is None:continue
        lo,hi,u,v,inside=result
        value=strength(p[0]+u[...,None]*(p[1]-p[0])+v[...,None]*(p[2]-p[0]))*inside
        np.maximum(mask[lo[1]:hi[1],lo[0]:hi[0]],value,out=mask[lo[1]:hi[1],lo[0]:hi[0]])
    conflicts=0
    for face,uv in zip(faces,uvs):
        result=raster(uv)
        if result is None:continue
        lo,hi,u,v,inside=result
        region=mask[lo[1]:hi[1],lo[0]:hi[0]]
        if not np.any(region):continue
        p=points[face];expected=strength(p[0]+u[...,None]*(p[1]-p[0])+v[...,None]*(p[2]-p[0]))
        conflicts+=int(np.count_nonzero(inside&(np.abs(region-expected)>.02)))
    assert conflicts==0,conflicts
    path=FOLDER/'derived-textures'
    original=np.array(Image.open(path/'body-graphite-metallic-roughness.png').convert('RGB'))
    source=np.array(Image.open(path/'body-legends-metallic-roughness.png').convert('RGB'))
    result=original.copy()
    result[...,1]=np.rint(original[...,1]*(1-mask)+source[...,1]*mask).astype(np.uint8)
    output=path/'body-hinge-metallic-roughness.png';Image.fromarray(result).save(output)
    Image.fromarray(np.rint(mask*255).astype(np.uint8)).save(path/'hinge-roughness-mask.png')
    changed=np.any(result!=original,axis=2)
    report=dict(changed_pixels=int(changed.sum()),outside_mask_changes=int(np.count_nonzero(changed&(mask==0))),shared_uv_conflicts=conflicts,red_blue_unchanged=bool(np.array_equal(result[...,[0,2]],original[...,[0,2]])),sha256=hashlib.sha256(output.read_bytes()).hexdigest(),local_y_transition_mm=[-7.4,-6.4])
    (FOLDER/'hinge-roughness-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
