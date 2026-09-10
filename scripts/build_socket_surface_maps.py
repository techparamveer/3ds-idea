"""Bake a bounded socket treatment from Blender's exported UV/position triangles."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl/derived-textures'
CENTER=np.array([-62.2249641459375,15.174867628173828])
def fade(v,a,b):
 t=np.clip((v-a)/(b-a),0,1);return t*t*(3-2*t)
def strength(p):
 r=np.linalg.norm(p[...,:2]-CENTER,axis=-1)
 return fade(r,6.5,8)*(1-fade(r,12.5,14))*fade(p[...,2],10,12)
def raster(uv):
 q=uv*np.array([4096,-4096])+[0,4096]
 lo=np.maximum(np.floor(q.min(0)).astype(int),0);hi=np.minimum(np.ceil(q.max(0)).astype(int),4096)
 if np.any(hi<=lo):return None
 a,b,c=q;v0=b-a;v1=c-a;det=v0[0]*v1[1]-v0[1]*v1[0]
 if abs(det)<1e-8:return None
 x,y=np.meshgrid(np.arange(lo[0],hi[0])+.5,np.arange(lo[1],hi[1])+.5);v2=np.stack([x,y],-1)-a
 u=(v2[...,0]*v1[1]-v2[...,1]*v1[0])/det;v=(v0[0]*v2[...,1]-v0[1]*v2[...,0])/det
 inside=(u>=-1e-7)&(v>=-1e-7)&(u+v<=1+1e-7)
 return lo,hi,u,v,inside
def main():
 data=np.load(ROOT/'.local/socket-uv-data.npz');p=data['points'];faces=data['faces'];uvs=data['uv']
 mask=np.zeros((4096,4096),np.float32)
 for face,uv in zip(faces,uvs):
  points=p[face];lo=points.min(0);hi=points.max(0)
  if hi[2]<=10 or np.any(lo[:2]>CENTER+14) or np.any(hi[:2]<CENTER-14):continue
  result=raster(uv)
  if result is None:continue
  lo,hi,u,v,inside=result
  values=strength(points[0]+u[...,None]*(points[1]-points[0])+v[...,None]*(points[2]-points[0]))*inside
  region=mask[lo[1]:hi[1],lo[0]:hi[0]];np.maximum(region,values,out=region)
 # Shared UVs in the same chassis must describe the same intended treatment.
 conflicts=np.zeros_like(mask,dtype=bool)
 for face,uv in zip(faces,uvs):
  q=uv*np.array([4096,-4096])+[0,4096];lo=np.maximum(np.floor(q.min(0)).astype(int),0);hi=np.minimum(np.ceil(q.max(0)).astype(int),4096)
  if np.any(hi<=lo) or not np.any(mask[lo[1]:hi[1],lo[0]:hi[0]]>.01):continue
  result=raster(uv)
  if result is None:continue
  lo,hi,u,v,inside=result;points=p[face]
  expected=strength(points[0]+u[...,None]*(points[1]-points[0])+v[...,None]*(points[2]-points[0]))
  conflicts[lo[1]:hi[1],lo[0]:hi[0]]|=inside&(np.abs(mask[lo[1]:hi[1],lo[0]:hi[0]]-expected)>.02)
 assert not conflicts.any(),f'{conflicts.sum()} overlapping UV treatment conflicts'
 Image.fromarray(np.rint(mask*255).astype(np.uint8)).save(FOLDER/'socket-edit-mask.png')
 report={'nonzero_mask_pixels':int(np.count_nonzero(mask)), 'shared_uv_conflicts':int(conflicts.sum()),'maps':{}}
 for kind,source in [('basecolor','body-etched-basecolor.png'),('normal','body-etched-normal.png'),('metallic-roughness','body-legends-metallic-roughness.png')]:
  original=np.array(Image.open(FOLDER/source).convert('RGB'));x=original.astype(float)/255;f=mask[...,None]
  if kind=='basecolor':
   linear=np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4);linear=linear*(1-f)+np.array([.014,.015,.017])*f
   result=np.where(linear<=.0031308,linear*12.92,1.055*linear**(1/2.4)-.055)
  elif kind=='normal':result=x*(1-f*.85)+np.array([.5,.5,1])*f*.85
  else:
   result=x.copy();result[...,1]=x[...,1]*(1-mask)+.68*mask;result[...,2]=x[...,2]*(1-mask)
  result=np.rint(np.clip(result,0,1)*255).astype(np.uint8);result[mask==0]=original[mask==0]
  changed=np.any(result!=original,axis=2);assert not np.any(changed&(mask==0))
  path=FOLDER/('body-socket-'+kind+'.png');Image.fromarray(result).save(path)
  report['maps'][kind]={'changed_pixels':int(changed.sum()),'outside_mask_changes':int(np.count_nonzero(changed&(mask==0))),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 (ROOT/'model/candidates/joshua-xl/socket-surface-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
