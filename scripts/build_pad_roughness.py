"""Preserve subtle pad roughness variation with a matte rubber range."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 source=FOLDER/'derived-textures/body-legends-metallic-roughness.png'
 old=np.array(Image.open(source).convert('RGB'));result=old.copy()
 result[...,1]=np.rint(255*.67+.06*old[...,1]).astype(np.uint8)
 assert np.array_equal(result[...,[0,2]],old[...,[0,2]])
 out=FOLDER/'derived-textures/pad-rubber-metallic-roughness.png';Image.fromarray(result).save(out)
 report={'source':source.name,'output':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'roughness_range':[.67,.73],'base_colour_multiplier':.8,'scope':'Button_Circle material only; unchanged geometry and other maps'}
 (FOLDER/'pad-rubber-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
