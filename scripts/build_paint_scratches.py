"""Bake sparse, world-scaled hairline wear into silver-panel roughness only."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from build_socket_surface_maps import raster
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'model/candidates/joshua-xl';TEX=FOLDER/'derived-textures'
def main():
 rng=np.random.default_rng(3012012);paint=np.array(Image.open(TEX/'body-eur-paint-mask.png').convert('L'))/255
 reports={}
 for kind,source,count in [('lid','body-legends-metallic-roughness.png',22),('cover','socket-graphite-metallic-roughness.png',14)]:
  strokes=[]
  for _ in range(count):
   a=rng.uniform([-60,-27],[60,27]);angle=rng.uniform(0,np.pi*2);length=rng.uniform(2.5,9)
   b=a+length*np.array([np.cos(angle),np.sin(angle)])
   strokes.append((a,b,float(rng.uniform(.045,.08)),float(rng.uniform(.07,.12))))
  if kind=='lid':strokes.append((np.array([-12,-12]),np.array([-5,-9]),.06,.1))
  else:strokes.append((np.array([42,-15]),np.array([48,-11]),.06,.1))
  mask=np.zeros((4096,4096),np.float32);data=np.load(ROOT/('.local/paint-'+kind+'-uv.npz'))
  for face,uv in zip(data['faces'],data['uv']):
   p=data['points'][face]
   if (kind=='lid' and p[:,2].max()<20) or (kind=='cover' and p[:,2].min()>3):continue
   lo=p[:,:2].min(0);hi=p[:,:2].max(0)
   candidates=[(a,b,width,amount) for a,b,width,amount in strokes if np.all(np.maximum(a,b)+width>=lo) and np.all(np.minimum(a,b)-width<=hi)]
   if not candidates:continue
   result=raster(uv)
   if result is None:continue
   lo,hi,u,v,inside=result
   q=p[0]+u[...,None]*(p[1]-p[0])+v[...,None]*(p[2]-p[0]);value=np.zeros(u.shape)
   for a,b,width,amount in candidates:
    d=b-a;t=np.clip(np.sum((q[...,:2]-a)*d,axis=-1)/np.dot(d,d),0,1)
    distance=np.linalg.norm(q[...,:2]-a-t[...,None]*d,axis=-1)
    # Feathered width and tapered ends avoid hard painted-looking lines.
    alpha=np.clip(1-distance/width,0,1)*np.minimum(1,np.minimum(t,1-t)*12)
    value=np.maximum(value,alpha*amount)
   value*=inside*paint[lo[1]:hi[1],lo[0]:hi[0]]
   region=mask[lo[1]:hi[1],lo[0]:hi[0]];np.maximum(region,value,out=region)
  original=np.array(Image.open(TEX/source));out=original.copy();out[:,:,1]=np.rint(np.minimum(255,original[:,:,1]+mask*255)).astype(np.uint8)
  assert np.array_equal(original[:,:,[0,2]],out[:,:,[0,2]])
  changed=np.any(original!=out,axis=-1);assert not np.any(changed&(paint==0))
  path=TEX/('paint-'+kind+'-scratches-metallic-roughness.png');Image.fromarray(out).save(path)
  Image.fromarray(np.rint(mask/.12*255).astype(np.uint8)).save(TEX/('paint-'+kind+'-scratch-mask.png'))
  normal_source='body-etched-normal.png' if kind=='lid' else 'body-socket-normal.png'
  original_n=np.array(Image.open(TEX/normal_source));n=original_n[:,:,:3].astype(np.float32)/127.5-1
  gy,gx=np.gradient(mask/.12)
  # Estimated two-micrometre groove, at roughly 13 atlas pixels per millimetre.
  n[:,:,0]+=.026*gx;n[:,:,1]-=.026*gy
  n/=np.maximum(np.linalg.norm(n,axis=-1,keepdims=True),1e-8)
  normal=np.rint(np.clip(n*.5+.5,0,1)*255).astype(np.uint8)
  changed_region=(gx!=0)|(gy!=0)
  normal[~changed_region|(paint==0)]=original_n[~changed_region|(paint==0),:3]
  normal_path=TEX/('paint-'+kind+'-scratches-normal.png');Image.fromarray(normal).save(normal_path)
  reports[kind]={'source':source,'output':path.name,'strokes':[{'a':a.tolist(),'b':b.tolist(),'half_width_mm':width,'roughness_delta':amount} for a,b,width,amount in strokes],'changed_pixels':int(changed.sum()),'outside_paint_changes':0,'red_blue_unchanged':True,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'normal_source':normal_source,'normal_output':normal_path.name,'normal_sha256':hashlib.sha256(normal_path.read_bytes()).hexdigest(),'normal_changed_pixels':int(np.any(normal!=original_n[:,:,:3],axis=-1).sum())}
 (FOLDER/'paint-scratches-report.json').write_text(json.dumps(reports,indent=2)+'\n');print({k:v['changed_pixels'] for k,v in reports.items()})
if __name__=='__main__':main()
