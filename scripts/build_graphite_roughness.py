"""Compress dark dielectric roughness variation, preserving silver/metal/ink."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl/derived-textures'
def fade(x,a,b):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def main():
 paint=np.array(Image.open(FOLDER/'body-eur-paint-mask.png').convert('L'),dtype=np.float32)/255
 report={}
 for prefix,base,mr in [('body','body-etched-basecolor.png','body-legends-metallic-roughness.png'),('socket','body-socket-basecolor.png','body-socket-metallic-roughness.png')]:
  color=np.array(Image.open(FOLDER/base).convert('RGB'),dtype=np.float32)/255
  old=np.array(Image.open(FOLDER/mr).convert('RGB'));source=old.astype(np.float32)/255
  mask=(1-paint)*(1-fade(color.max(axis=2),.20,.35))*(1-fade(source[...,2],.05,.15))*fade(source[...,1],.20,.30)
  rough=source[...,1];target=.60+.10*rough
  result=old.copy();result[...,1]=np.rint(255*(rough*(1-mask)+target*mask)).astype(np.uint8)
  out=FOLDER/(prefix+'-graphite-metallic-roughness.png');Image.fromarray(result).save(out)
  changed=result[...,1]!=old[...,1]
  assert np.array_equal(result[...,[0,2]],old[...,[0,2]])
  assert not np.any(changed&(paint==1))
  report[prefix]={'source':mr,'output':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'changed_pixels':int(changed.sum()),'paint_changes':int(np.count_nonzero(changed&(paint==1))),'old_roughness_quantiles':np.quantile(rough[mask>.99],[0,.1,.5,.9,1]).tolist()}
 (FOLDER.parent/'graphite-roughness-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
