"""Derive bounded cavity colour from the source slider-relief normal atlas.

Retains the source glyph outlines; does not substitute a typeface. The height
integration follows the source atlas's encoded axes, not a new geometry map.
"""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
REGIONS={'3d':(1042,2066,1091,2128),'off':(885,2045,932,2124),'dot':(897,2015,922,2042),'triangle':(924,2020,1074,2070)}
def main():
 normal=np.array(Image.open(FOLDER/'derived-textures/body-etched-normal.png').convert('RGB'))
 mask=np.zeros(normal.shape[:2],np.float32)
 for name,(x0,y0,x1,y1) in REGIONS.items():
  n=normal[y0:y1,x0:x1].astype(float)/127.5-1
  gx=-n[...,0]/np.maximum(n[...,2],.2);gy=-n[...,1]/np.maximum(n[...,2],.2)
  gx-=np.median(gx);gy-=np.median(gy)
  kx=2*np.pi*np.fft.fftfreq(x1-x0)[None,:];ky=2*np.pi*np.fft.fftfreq(y1-y0)[:,None];den=kx*kx+ky*ky;den[0,0]=1
  h=np.fft.ifft2(-1j*(kx*np.fft.fft2(gx)+ky*np.fft.fft2(gy))/den).real
  h-=np.median(np.r_[h[:3].ravel(),h[-3:].ravel(),h[:,:3].ravel(),h[:,-3:].ravel()])
  yy,xx=np.indices(h.shape);edge=np.clip(np.minimum.reduce([xx,yy,x1-x0-1-xx,y1-y0-1-yy])/2,0,1)
  value=np.clip((-h-.15)/1.2,0,1)*edge
  np.maximum(mask[y0:y1,x0:x1],value,out=mask[y0:y1,x0:x1])
 source=FOLDER/'derived-textures/body-etched-basecolor.png';old=np.array(Image.open(source).convert('RGB'));x=old.astype(float)/255
 linear=np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4);linear*=1-mask[...,None]*.65
 result=np.rint(255*np.where(linear<=.0031308,linear*12.92,1.055*linear**(1/2.4)-.055)).astype(np.uint8);result[mask==0]=old[mask==0]
 changed=np.any(result!=old,axis=2);assert not np.any(changed&(mask==0))
 out=FOLDER/'derived-textures/body-slider-basecolor.png';Image.fromarray(result).save(out)
 Image.fromarray(np.rint(mask*255).astype(np.uint8)).save(FOLDER/'derived-textures/slider-cavity-mask.png')
 report={'regions':REGIONS,'source':source.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'changed_pixels':int(changed.sum()),'outside_mask_changes':int(np.count_nonzero(changed&(mask==0))),'linear_cavity_multiplier':.35,'scope':'Inner lid only: bounded cavity colour and OFF-dot relief inversion; source glyph shapes retained'}
 x0,y0,x1,y1=REGIONS['dot'];yy,xx=np.indices((y1-y0,x1-x0));r=np.hypot(xx+x0-909,yy+y0-2029);w=np.clip((12-r)/3,0,1);w=w*w*(3-2*w)
 corrected=normal.copy();original=normal[y0:y1,x0:x1,:2].astype(float)
 corrected[y0:y1,x0:x1,:2]=np.rint(original*(1-w[...,None])+(255-original)*w[...,None]).astype(np.uint8)
 normal_out=FOLDER/'derived-textures/body-slider-dot-normal.png';Image.fromarray(corrected).save(normal_out)
 report['dot_normal']={'sha256':hashlib.sha256(normal_out.read_bytes()).hexdigest(),'changed_pixels':int(np.any(corrected!=normal,axis=2).sum()),'radius_pixels':[9,12],'blue_channel_unchanged':bool(np.array_equal(corrected[...,2],normal[...,2]))}
 (FOLDER/'slider-cavity-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
