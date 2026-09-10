"""Record image-space screen/frame transitions; this is not calibrated CAD."""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'.local/references/front/techradar-original.jpg'

def main():
    grey=np.asarray(Image.open(SOURCE).convert('RGB'),dtype=float).mean(axis=2)
    cuts=[]
    for row in [170,220,370,410]:
        line=np.median(grey[row-3:row+4],axis=0);gradient=np.diff(line)
        def transition(start,end,sign):return float(start+np.argmax(sign*gradient[start:end])+.5)
        outer_l=transition(623,632,-1);outer_r=transition(1202,1209,1)
        active_l=transition(644,650,1);active_r=transition(1183,1189,-1)
        cuts.append({'row':row,'outer_frame_x':[outer_l,outer_r],'bright_panel_x':[active_l,active_r],'outer_to_panel_ratio':(outer_r-outer_l)/(active_r-active_l),'outer_width_if_panel_is_106p2_mm':106.2*(outer_r-outer_l)/(active_r-active_l)})
    report={'source_url':'https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg','sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'method':'Median seven-row luminance profile; strongest directed gradient in manually selected edge windows. Pixel intervals at half-pixel boundaries.','caveat':'Bright panel is a displayed/rendered image edge, not independently calibrated LCD glass. Perspective, shadows and artwork limit metric inference. Published 106.2 mm active width is used only as a conditional scale.','cuts':cuts}
    (ROOT/'model/candidates/joshua-xl/upper-reference-edges.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
