"""Build exportable lower-cap maps in UV1, retaining carried UV0 shading frames."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
import analyze_sourced_rig as reader
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl';OUT=FOLDER/'derived-textures'
SIZE=1024;DEPTH=.02

def sample(im,uv):
 h,w=im.shape[:2];xy=uv*[w,h]-.5;ij=np.floor(xy).astype(int);f=xy-ij;i,j=ij.T;i=np.clip(i,0,w-2);j=np.clip(j,0,h-2);fx,fy=f.T
 if im.ndim==3:fx=fx[:,None];fy=fy[:,None]
 return (im[j,i]*(1-fx)+im[j,i+1]*fx)*(1-fy)+(im[j+1,i]*(1-fx)+im[j+1,i+1]*fx)*fy

def unit(a):return a/np.maximum(np.linalg.norm(a,axis=-1,keepdims=True),1e-12)
def load(name):return np.asarray(Image.open(OUT/name).convert('RGB'),dtype=np.float32)/255

def main():
 raw,d,b=reader.load_glb(FOLDER/'silver-lid-face.glb');spec=json.loads((FOLDER/'legends-atlas-report.json').read_text())
 base=load('body-eur-basecolor.png');base=np.where(base<=.04045,base/12.92,((base+.055)/1.055)**2.4)
 mr=load('body-legends-metallic-roughness.png');normal=load('body-etched-normal.png')
 mask=np.asarray(Image.open(OUT/'lower-label-clean-mask.png').convert('L'),dtype=float)/255
 dy,dx=np.gradient(mask);dx*=SIZE/32;dy*=-SIZE/24
 arrays={'basecolor':np.zeros((SIZE,SIZE,3)), 'metallic-roughness':np.zeros((SIZE,SIZE,3)), 'normal':np.zeros((SIZE,SIZE,3)), 'specular':np.ones((SIZE,SIZE,3))}
 coverage=np.zeros((SIZE,SIZE),bool);counts={}
 for row,name in enumerate(['Button_SELECT','Button_HOME','Button_START']):
  node=next(n for n in d['nodes'] if n.get('name')==name);pr=d['meshes'][node['mesh']]['primitives'][0];a={k:reader.accessor(d,b,v).astype(float) for k,v in pr['attributes'].items() if k in ['POSITION','NORMAL','TANGENT','TEXCOORD_0']}
  p,n,t,uv=[a[k] for k in ['POSITION','NORMAL','TANGENT','TEXCOORD_0']];faces=reader.accessor(d,b,pr['indices']).reshape(-1,3)
  top=faces[(p[faces,1]>p[:,1].max()-1e-5).all(axis=1)];centre=np.array(spec['measurements'][name]['center_local_mm'])
  xy=np.stack(((16+p[:,0]-centre[0])/32,((row+.5)*8+p[:,2]+centre[1])/24),axis=-1)*SIZE-.5
  uv_per_y=np.array(spec['measurements'][name]['uv_per_y_mm'])*[1,-1]
  count=0
  for tri in top:
   q=xy[tri];lo=np.maximum(np.floor(q.min(0)).astype(int),0);hi=np.minimum(np.ceil(q.max(0)).astype(int),SIZE-1)
   if (hi<lo).any():continue
   yy,xx=np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1];v=np.stack((xx,yy),-1).reshape(-1,2)
   matrix=np.stack((q[1]-q[0],q[2]-q[0]),axis=1)
   if abs(np.linalg.det(matrix))<1e-10:continue
   weights=(v-q[0])@np.linalg.inv(matrix).T;weights=np.c_[1-weights.sum(1),weights]
   inside=(weights>=-1e-7).all(1);v=v[inside];weights=weights[inside]
   if not len(v):continue
   ix,iy=v.T;tex=weights@uv[tri];ink=mask[iy,ix,None]
   colour=sample(base,tex)*(1-.82*ink)
   colour=np.where(colour<=.0031308,colour*12.92,1.055*np.maximum(colour,0)**(1/2.4)-.055)
   rough=sample(mr,tex)
   point=weights@p[tri];local_y=-point[:,2]-centre[1]
   rows=[]
   for edge in [-2.15,2.15]:
    rows.append(sample(mr,tex+(edge-local_y)[:,None]*uv_per_y))
   blend=np.clip((local_y+2.15)/4.3,0,1)[:,None];baseline=rows[0]*(1-blend)+rows[1]*blend
   clear=np.clip((spec['legends'][name]['clear_width_mm']/2-abs(point[:,0]-centre[0]))/.5,0,1)*np.clip((2.25-abs(local_y))/.45,0,1)
   rough[:,1]=rough[:,1]*(1-clear)+baseline[:,1]*clear
   rough[:,1]=rough[:,1]*(1-ink[:,0])+.52*ink[:,0]
   nn=unit(weights@n[tri]);tt=weights@t[tri,:3];tt=unit(tt-nn*np.sum(tt*nn,axis=1)[:,None]);bb=np.cross(nn,tt)*np.sign(weights@t[tri,3])[:,None]
   old=unit(sample(normal,tex)*2-1);world=tt*old[:,0,None]+bb*old[:,1,None]+nn*old[:,2,None]
   # A recess has height -DEPTH*mask; local native +Y is glTF -Z.
   world=unit(world+DEPTH*np.stack((dx[iy,ix],np.zeros(len(ix)),-dy[iy,ix]),axis=-1))
   mapped=unit(np.stack((np.sum(world*tt,1),np.sum(world*bb,1),np.sum(world*nn,1)),axis=-1))*.5+.5
   for key,value in [('basecolor',colour),('metallic-roughness',rough),('normal',mapped),('specular',np.repeat(1-.95*ink,3,axis=1))]:arrays[key][iy,ix]=value
   coverage[iy,ix]=True;count+=len(ix)
  counts[name]={'top_triangles':len(top),'covered_samples':count,'central_band_uv_fit_error':spec['measurements'][name]['uv_fit_max_error']}
 assert np.all(coverage[mask>.01]),'letter map extends off cap tops'
 # Twenty-four texels protect trilinear/minified browser edge filtering.
 filled=coverage.copy()
 for _ in range(24):
  oldfilled=filled.copy()
  for sy,sx in [(0,1),(0,-1),(1,0),(-1,0)]:
   candidate=np.roll(np.roll(oldfilled,sy,0),sx,1)&~filled
   for key in arrays:arrays[key][candidate]=np.roll(np.roll(arrays[key],sy,0),sx,1)[candidate]
   filled|=candidate
 files={}
 for key,value in arrays.items():
  output=OUT/f'lower-clean-{key}.png';Image.fromarray(np.uint8(np.rint(np.clip(value,0,1)*255))).save(output);files[key]={'file':output.name,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
 Image.fromarray(np.uint8(coverage)*255).save(OUT/'lower-clean-coverage.png')
 (FOLDER/'lower-label-maps-report.json').write_text(json.dumps({'source_sha256':hashlib.sha256(raw).hexdigest(),'size':SIZE,'padding_pixels':24,'depth_estimate_mm':DEPTH,'caps':counts,'files':files,'normal_frame':'Encoded against carried UV0 tangent basis; image sampling uses UV1.','roughness_cleanup':'Interpolate glyph-free rows through the original cleared legend band before adding the new mask.'},indent=2)+'\n')
 print(json.dumps(counts))
if __name__=='__main__':main()
