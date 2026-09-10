"""Author the upper cover's matte border around a narrow black LCD edge."""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
WIDTH=121.3064079284668
HEIGHT=72.7902946472168
SIZE=2048

def main():
    x=(np.arange(SIZE)+.5)/SIZE*WIDTH-WIDTH/2
    y=(np.arange(SIZE)+.5)/SIZE*HEIGHT-HEIGHT/2
    signed=np.maximum(abs(x)[None,:]-53.5,abs(y)[:,None]-32.3)
    weight=np.clip(signed/.06+.5,0,1)
    linear=.007*weight
    srgb=np.where(linear<=.0031308,12.92*linear,1.055*linear**(1/2.4)-.055)
    colour=np.repeat(np.rint(srgb*255).astype(np.uint8)[...,None],3,axis=2)
    mr=np.zeros((SIZE,SIZE,3),dtype=np.uint8);mr[...,0]=255;mr[...,1]=np.rint((.18+.17*weight)*255).astype(np.uint8)
    report={'backing_mm':[WIDTH,HEIGHT],'black_edge_rectangle_mm':[107,64.6],'active_display_mm':[106.2,63.72],'border_linear_colour':.007,'roughness_inner_outer':[.18,.35],'edge_filter_mm':.06,'resolution':SIZE,'maps':{}}
    for name,data in [('colour',colour),('metallic-roughness',mr)]:
        path=FOLDER/f'derived-textures/upper-cover-{name}.png';Image.fromarray(data).save(path)
        report['maps'][name]={'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    (FOLDER/'upper-cover-border-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
