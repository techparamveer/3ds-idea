"""Compress D-pad roughness variation; retain source occlusion/metallic channels."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    source=FOLDER/'derived-textures/body-legends-metallic-roughness.png'
    original=np.asarray(Image.open(source).convert('RGB'))
    result=original.copy()
    result[...,1]=np.rint(255*.46+.08*original[...,1]).astype(np.uint8)
    output=FOLDER/'derived-textures/dpad-metallic-roughness.png'
    Image.fromarray(result).save(output)
    report={'source':source.name,'output':output.name,'roughness_offset':.46,'roughness_scale':.08,'normal_strength':.15,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'red_blue_unchanged':bool(np.array_equal(result[...,[0,2]],original[...,[0,2]]))}
    (FOLDER/'dpad-finish-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
