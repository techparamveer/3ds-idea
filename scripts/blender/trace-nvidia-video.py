"""Trace the supplied green logo into frame-sampled extruded pixel poses.
Usage: python trace-nvidia-video.py ABS_VIDEO ABS_JSON ABS_COLOR_ATLAS
Requires PyAV, NumPy and Pillow. The original video is never changed.
"""
import sys,json,hashlib
from pathlib import Path
import av,numpy as np
from PIL import Image
video,output,colors=map(Path,sys.argv[1:])
assert all(p.is_absolute() for p in (video,output,colors))
frames=list(av.open(str(video)).decode(video=0))
x0,y0,width,height=200,205,150,70
atlas=Image.new('RGB',(width*8,height*6))
poses=[]
for index,frame in enumerate(frames):
    image=frame.to_image()
    crop=np.array(image.crop((x0,y0,x0+width,y0+height)))
    rgb=crop.astype(float)
    mask=((rgb[:,:,1]>65)&(rgb[:,:,1]>rgb[:,:,0]*1.06)&(rgb[:,:,1]>rgb[:,:,2]*1.4)).astype(np.uint8)
    poses.append({'videoFrame':index,'pixels':[[int(x+x0),int(y+y0)] for y,x in np.argwhere(mask)]})
    atlas.paste(Image.fromarray(crop),(index%8*width,index//8*height))
output.write_text(json.dumps({'sourceSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'sourceFrames':len(frames),'fpsNumerator':30000,'fpsDenominator':1001,'trace':'Green pixel mask: G>65, G>1.06R, G>1.4B. Includes pale highlights, source compression and partial inner-stroke endpoint.','atlas':{'columns':8,'rows':6,'crop':[x0,y0,width,height]},'poses':poses},separators=(',',':'))+'\n')
atlas.save(colors)
print('Traced',len(poses),'source poses;',sum(len(f['pixels']) for f in poses),'source pixels')
