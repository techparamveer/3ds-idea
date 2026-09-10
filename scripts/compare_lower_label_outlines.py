"""Compare photographic and authored stencils at the source crop resolution."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'model/candidates/joshua-xl'
def main():
 report=json.loads((FOLDER/'legends-atlas-report.json').read_text())
 photo=Image.open(ROOT/'.local/references/front/techradar-original.jpg').convert('RGB');rgb=np.asarray(photo)/255
 linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);gray=linear@np.array([.2126,.7152,.0722])
 atlas=Image.open(FOLDER/'derived-textures/lower-label-clean-mask.png')
 board=Image.new('RGB',(1150,560),'#eeeeee');draw=ImageDraw.Draw(board);metrics={}
 for row,word in enumerate(['SELECT','HOME','START']):
  s=report['legends']['Button_'+word];x,y,xx,yy=s['crop'];levels=np.array(s['threshold_srgb'])/255;lo,hi=np.where(levels<=.04045,levels/12.92,((levels+.055)/1.055)**2.4)
  old=np.clip((hi-gray[y:yy,x:xx])/(hi-lo),0,1)
  w,h=s['size_mm'];box=((16-w/2)/32*1024,((row+.5)*8-h/2)/24*1024,(16+w/2)/32*1024,((row+.5)*8+h/2)/24*1024)
  sampled=atlas.resize((xx-x,16),Image.Resampling.LANCZOS,box=box);new=np.asarray(sampled)/255
  metrics[word]={'source_crop_size':[xx-x,16],'reference_mask_coverage':float(old.sum()),'authored_mask_coverage':float(new.sum()),'coverage_ratio':float(new.sum()/old.sum()),'mean_absolute_alpha_difference':float(abs(new-old).mean())}
  sources=[photo.crop((x,y,xx,yy)),Image.fromarray(np.uint8(np.rint((1-old)*255))).convert('RGB'),Image.fromarray(np.uint8(255-np.asarray(sampled))).convert('RGB')]
  draw.text((10,row*180+8),word,fill='black')
  for col,(im,title) in enumerate(zip(sources,['Photograph','Photo-derived mask','Clean outline at same pixel size'])):
   draw.text((10+col*380,row*180+28),title,fill='black');im=im.resize((344,96),Image.Resampling.NEAREST);board.paste(im,(10+col*380,row*180+50))
 board.save(FOLDER/'lower-label-outline-source-comparison.png')
 (FOLDER/'lower-label-outline-pixel-comparison.json').write_text(json.dumps({'method':'Resample authored atlas into exact original photographic crop dimensions, then nearest-neighbour enlarge only for inspection. Coverage is diagnostic, not a factory-fidelity score.','labels':metrics},indent=2)+'\n')
 print(json.dumps(metrics))
if __name__=='__main__':main()
