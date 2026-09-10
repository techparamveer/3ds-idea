"""Retain source cap texture variation inside a photograph-fitted roughness range."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 source=FOLDER/'derived-textures/body-legends-metallic-roughness.png'
 dest=FOLDER/'derived-textures/abxy-metallic-roughness.png'
 a=np.array(Image.open(source));b=a.copy()
 b[:,:,1]=np.rint(255*.46+.08*a[:,:,1]).astype(np.uint8)
 assert np.array_equal(a[:,:,[0,2]],b[:,:,[0,2]])
 Image.fromarray(b).save(dest)
 report={'source':source.name,'output':dest.name,'roughness_transform':'0.46 + 0.08 * original','normal_strength':.15,'red_blue_unchanged':True,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
 (FOLDER/'abxy-finish-report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report))
if __name__=='__main__':main()
