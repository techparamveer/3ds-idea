"""Trace the supplied HACK LDN screenshot. Paths must be absolute.
Requires OpenCV, NumPy and Pillow. The dark screenshot grid is discarded.
"""
import sys,json,hashlib
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
source,output,svg=map(Path,sys.argv[1:])
assert all(p.is_absolute() for p in (source,output,svg))
im=np.array(Image.open(source).convert('RGB'))
mask=(im.min(axis=2)>170).astype('uint8')*255
contours,hierarchy=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
parts=[]
for i,contour in enumerate(contours):
    if hierarchy[0][i][3]!=-1 or cv2.contourArea(contour)<1000:continue
    x,y,w,h=cv2.boundingRect(contour)
    paths=[cv2.approxPolyDP(contour,.65,True)[:,0,:].tolist()]
    child=hierarchy[0][i][2]
    while child!=-1:
        paths.append(cv2.approxPolyDP(contours[child],.65,True)[:,0,:].tolist())
        child=hierarchy[0][child][0]
    parts.append({'bounds':[x,y,w,h],'paths':paths})
parts.sort(key=lambda p:(p['bounds'][1]>400,p['bounds'][0]))
for name,part in zip(['H','A','C','K','arrow','L','D','N'],parts):part['name']=name
assert len(parts)==8
output.write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'bounds':[87,47,1224,724],'parts':parts},indent=2)+'\n')
paths=[]
for part in parts:
    d=' '.join('M '+' L '.join(f'{x} {y}' for x,y in path)+' Z' for path in part['paths'])
    paths.append(f'<path d="{d}"/>')
svg.parent.mkdir(parents=True,exist_ok=True)
svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="45 5 1308 808"><g fill="#31373f" fill-rule="evenodd">'+''.join(paths)+'</g></svg>\n')
print('Traced:', ', '.join(p['name'] for p in parts))
