"""Localized inner-lid specular appearance study; original atlas retained."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageFilter
import analyze_sourced_rig as reader
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def smooth(t):
 t=np.clip(t,0,1);return t*t*(3-2*t)
def main():
 _,doc,binary=reader.load_glb(FOLDER/'silver-upper-width.glb');node=next(n for n in doc['nodes'] if n.get('name')=='Sourced inner lid');prim=doc['meshes'][node['mesh']]['primitives'][0];a=prim['attributes']
 p=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
 n=reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
 uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float);faces=reader.accessor(doc,binary,prim['indices']).reshape(-1,3)
 original=np.asarray(Image.open(FOLDER/'derived-textures/body-legends-specular.png').convert('RGB'));h,w=original.shape[:2];mask=np.zeros((h,w),dtype=np.float32);protected=np.zeros((h,w),dtype=np.uint8)
 for face in faces:
  tri=uv[face]*[w,h]-.5;lo=np.maximum(np.floor(tri.min(0)).astype(int),0);hi=np.minimum(np.ceil(tri.max(0)).astype(int),[w-1,h-1])
  if np.any(hi<lo):continue
  mat=np.stack([tri[1]-tri[0],tri[2]-tri[0]],axis=1)
  if abs(np.linalg.det(mat))<1e-9:continue
  yy,xx=np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1];bc=(np.stack([xx,yy],axis=-1)-tri[0])@np.linalg.inv(mat).T
  inside=(bc[...,0]>=-1e-6)&(bc[...,1]>=-1e-6)&(bc.sum(-1)<=1+1e-6)
  point=p[face[0]]+bc[...,0,None]*(p[face[1]]-p[face[0]])+bc[...,1,None]*(p[face[2]]-p[face[0]])
  norm=n[face[0]]+bc[...,0,None]*(n[face[1]]-n[face[0]])+bc[...,1,None]*(n[face[2]]-n[face[0]])
  weight=smooth((-point[...,1]-6)/4)*smooth((point[...,2]+1.8)/.35)*(1-smooth((point[...,2]+1.15)/.4))*smooth((-norm[...,2]-.85)/.14)
  region=mask[lo[1]:hi[1]+1,lo[0]:hi[0]+1];region[inside]=np.maximum(region[inside],weight[inside])
  shield=protected[lo[1]:hi[1]+1,lo[0]:hi[0]+1];shield[inside & ((point[...,1]>-4)|(point[...,2]>0)|(norm[...,2]>-.5))]=255
 mask=np.asarray(Image.fromarray(np.rint(mask*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))).astype(float)/255
 protected=np.asarray(Image.fromarray(protected).filter(ImageFilter.MaxFilter(3)));mask[protected>0]=0
 result=original.copy();result[...,0]=np.rint(original[...,0]*(1-.75*mask)).astype('uint8')
 out=FOLDER/'derived-textures/lid-face-specular.png';Image.fromarray(result).save(out);Image.fromarray(np.rint(mask*255).astype('uint8')).save(FOLDER/'derived-textures/lid-face-specular-mask.png')
 report={'factor_on_flat_face':.25,'source':'body-legends-specular.png','output':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'changed_pixels':int(np.any(result!=original,axis=-1).sum()),'scope':'Only front-facing, near-planar inner-lid surface below local Y=-6; barrel/back/steep edges explicitly protected. Appearance estimate, not measured material reflectance.'}
 (FOLDER/'lid-face-specular-study.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
