"""Attenuate power-cap rim normal distortion, preserving the central symbol."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageFilter
import analyze_sourced_rig as reader
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
    _,doc,binary=reader.load_glb(FOLDER/'silver-power-fit.glb')
    node=next(n for n in doc['nodes'] if n.get('name')=='Button_POWER')
    prim=doc['meshes'][node['mesh']]['primitives'][0];a=prim['attributes']
    pos=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];pos[:,1]*=-1
    uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float)
    faces=reader.accessor(doc,binary,prim['indices']).reshape(-1,3)
    source=FOLDER/'derived-textures/body-etched-normal.png';original=np.asarray(Image.open(source).convert('RGB'))
    h,w=original.shape[:2];mask=np.zeros((h,w),dtype=np.float32);protected=np.zeros((h,w),dtype=np.uint8)
    center=np.array([-.09250450134277344,-.000011444091796875])
    for face in faces:
        tri=uv[face]*[w,h]-.5
        lo=np.maximum(np.floor(tri.min(0)).astype(int),0);hi=np.minimum(np.ceil(tri.max(0)).astype(int),[w-1,h-1])
        if np.any(hi<lo):continue
        mat=np.stack([tri[1]-tri[0],tri[2]-tri[0]],axis=1)
        if abs(np.linalg.det(mat))<1e-9:continue
        yy,xx=np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
        bc=(np.stack([xx,yy],axis=-1)-tri[0])@np.linalg.inv(mat).T
        inside=(bc[...,0]>=-1e-6)&(bc[...,1]>=-1e-6)&(bc.sum(-1)<=1+1e-6)
        local=pos[face[0]]+bc[...,0,None]*(pos[face[1]]-pos[face[0]])+bc[...,1,None]*(pos[face[2]]-pos[face[0]])
        r=np.linalg.norm(local[...,:2]-center,axis=-1);t=np.clip((r-2.5)/.35,0,1);weight=t*t*(3-2*t)
        region=mask[lo[1]:hi[1]+1,lo[0]:hi[0]+1];region[inside]=np.maximum(region[inside],weight[inside])
        shield=protected[lo[1]:hi[1]+1,lo[0]:hi[0]+1];shield[inside & (r<2.45) & (local[...,2]>.5)]=255
    # Four-texel dilation supports filtering outside each UV island. The
    # protected center remains at zero after this small padding operation.
    mask=np.asarray(Image.fromarray(np.rint(mask*255).astype('uint8')).filter(ImageFilter.MaxFilter(9))).astype(np.float32)/255
    protected=np.asarray(Image.fromarray(protected).filter(ImageFilter.MaxFilter(5)))
    mask[protected>0]=0
    normal=original.astype(np.float32)/127.5-1
    normal[...,:2]*=(1-.85*mask[...,None]);normal/=np.maximum(np.linalg.norm(normal,axis=-1,keepdims=True),1e-8)
    result=np.rint(np.clip((normal+1)*127.5,0,255)).astype('uint8');result[mask==0]=original[mask==0]
    output=FOLDER/'derived-textures/power-rim-normal.png';Image.fromarray(result).save(output)
    Image.fromarray(np.rint(mask*255).astype('uint8')).save(FOLDER/'derived-textures/power-rim-mask.png')
    lo=np.maximum(np.floor(uv.min(0)*[w,h]).astype(int)-8,0);hi=np.minimum(np.ceil(uv.max(0)*[w,h]).astype(int)+8,[w,h])
    cropped=FOLDER/'derived-textures/power-rim-normal-crop.png'
    Image.fromarray(result).crop((*lo,*hi)).save(cropped)
    report={'crop_origin_pixels':lo.tolist(),'crop_size_pixels':(hi-lo).tolist(),'atlas_size_pixels':[w,h],'crop_sha256':hashlib.sha256(cropped.read_bytes()).hexdigest(),'source':source.name,'output':output.name,'protected_radius_mm':2.5,'transition_mm':.35,'rim_xy_normal_scale':.15,'padding_pixels':4,'changed_pixels':int(np.any(original!=result,axis=-1).sum()),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'symbol_protection_radius_mm':2.45,'note':'Top symbol region explicitly restored after UV padding; normal changes apply only to cloned power material.'}
    (FOLDER/'power-finish-study.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
