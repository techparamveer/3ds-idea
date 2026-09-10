"""Record matched-image patch values; not a physical reflectance calibration."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
PATCHES={'lid_left':(600,200),'lid_right':(1240,200),'pad':(591,590),'deck_right':(1250,720),'deck_left':(565,745)}
def main():
    paths={'reference':ROOT/'.local/references/front/techradar-original.jpg'}
    for name in ['reference-lit','reference-reduced-fill-lit','reference-off-axis-lit','reference-lid-no-specular-lit','reference-lid-roughness-lit']:
        paths[name]=ROOT/'model/candidates/joshua-xl'/(name+'-matched.png')
    values={}
    for name,path in paths.items():
        image=np.asarray(Image.open(path).convert('RGB'));values[name]={key:np.median(image[y-5:y+6,x-5:x+6],axis=(0,1)).tolist() for key,(x,y) in PATCHES.items()}
    report={'patch_centers_pixels':PATCHES,'patch_size_pixels':11,'median_srgb_bytes':values,'limits':'Matched image-space diagnostic. Promotional grading, lighting, local projection differences and renderer colour management are not calibrated. These values cannot establish physical albedo, IOR or roughness.'}
    (ROOT/'model/candidates/joshua-xl/reference-lighting-patches.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':main()
