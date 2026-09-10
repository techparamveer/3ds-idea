"""Author photograph-fitted cap glyphs; not an identified factory font."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
WIDTHS={'A':2.85,'B':2.2,'X':2.7,'Y':2.7};HEIGHT=2.9;STROKE=.36

def cubic(p0,p1,p2,p3):
 t=np.linspace(0,1,49)[:,None]
 return ((1-t)**3*np.array(p0)+3*(1-t)**2*t*np.array(p1)+3*(1-t)*t*t*np.array(p2)+t**3*np.array(p3)).tolist()

def paths(key):
 if key=='A':return [[(0,0),(.5,1),(1,0)],[(.20,.40),(.80,.40)]]
 if key=='X':return [[(0,0),(1,1)],[(0,1),(1,0)]]
 if key=='Y':return [[(0,1),(.5,.48),(1,1)],[(.5,.48),(.5,0)]]
 return [[(0,0),(0,1),(.50,1)]+cubic((.50,1),(1.02,1),(1.02,.53),(.50,.53))[1:]+[(0,.53)],[(.50,.53)]+cubic((.50,.53),(1.15,.53),(1.15,0),(.50,0))[1:]+[(0,0)]]

def main():
 im=np.array(Image.open(FOLDER/'derived-textures/body-etched-basecolor.png'));out=im.copy();h,w=im.shape[:2]
 fits=json.loads((FOLDER/'abxy-glyph-uv-fit.json').read_text());reports={}
 for key,fit in fits.items():
  matrix=np.array(fit['uv_fit']);centre=np.array(fit['centre'])
  origin=np.r_[centre,1]@matrix;cx,cy=origin*np.array([w,-h])+np.array([0,h]);radius=39
  x0,y0=int(cx)-radius,int(cy)-radius;x1,y1=x0+2*radius,y0+2*radius
  yy,xx=np.mgrid[y0:y1,x0:x1];uv=np.stack([(xx+.5)/w,1-(yy+.5)/h],-1)
  local=(uv-matrix[2])@np.linalg.inv(matrix[:2])-centre
  r=np.linalg.norm(local,axis=-1);patch=out[y0:y1,x0:x1,:3]
  background=np.median(patch[(r>2.3)&(r<2.7)],axis=0)
  old=(np.max(patch,axis=-1)>80)&(r<2.2)
  ink=np.percentile(patch[old],95,axis=0)
  # Include antialiased edge pixels around the previous print.
  old=np.logical_or.reduce([np.roll(np.roll(old,dy,axis=0),dx,axis=1) for dy in range(-2,3) for dx in range(-2,3)])
  # Remove only the old printed pixels; underlying plastic is estimated from the adjacent cap.
  patch[old]=background.astype(np.uint8)
  alpha=np.zeros(xx.shape,float)
  for oy in range(8):
   for ox in range(8):
    uv=np.stack([(xx+(ox+.5)/8)/w,1-(yy+(oy+.5)/8)/h],-1)
    p=(uv-matrix[2])@np.linalg.inv(matrix[:2])-centre
    distance=np.full(xx.shape,np.inf)
    for path in paths(key):
     q=(np.array(path)-.5)*[WIDTHS[key]-STROKE,HEIGHT-STROKE]
     for a,b in zip(q[:-1],q[1:]):
      delta=b-a;t=np.clip(np.sum((p-a)*delta,axis=-1)/np.dot(delta,delta),0,1)
      distance=np.minimum(distance,np.linalg.norm(p-a-t[...,None]*delta,axis=-1))
    alpha+=(distance<=STROKE/2)/64
  patch[:]=np.rint(patch*(1-alpha[...,None])+ink*alpha[...,None]).astype(np.uint8)
  reports[key]={'width_mm':WIDTHS[key],'height_mm':HEIGHT,'stroke_mm':STROKE,'old_ink_pixels':int(old.sum()),'background_rgb':background.tolist(),'ink_rgb':ink.tolist()}
 dest=FOLDER/'derived-textures/abxy-fitted-basecolor.png';Image.fromarray(out).save(dest)
 report={'glyphs':reports,'changed_pixels':int(np.any(im!=out,axis=-1).sum()),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'status':'photograph-fitted authored glyphs; not a verified factory font'}
 (FOLDER/'abxy-ink-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
