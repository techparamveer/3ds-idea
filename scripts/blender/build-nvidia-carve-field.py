"""Create a spiral reveal field from the original eye artwork.
Run with absolute contour JSON and output PNG paths. Requires NumPy, SciPy, Pillow.
The reference's cut starts at the lower-right tip, travels around the outside,
then curls inward. Distance along that same stroke drives the Blender carve.
"""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage,sparse
from scipy.sparse.csgraph import dijkstra
source,output=map(Path,sys.argv[1:])
assert source.is_absolute() and output.is_absolute()
width,height=1024,680
xmin,xmax,ymin,ymax=722.36974,1641.28177,243.70607,852.87366
mask=np.zeros((height,width),bool)
for contour in json.loads(source.read_text())['paths']['Eye_Mark']:
    layer=Image.new('1',(width,height))
    ImageDraw.Draw(layer).polygon([((x-xmin)/(xmax-xmin)*(width-1),(y-ymin)/(ymax-ymin)*(height-1)) for x,y in contour],fill=1)
    mask ^= np.array(layer)
box=np.zeros_like(mask)
box[:,int((1065.22873-xmin)/(xmax-xmin)*(width-1)):]=True
stroke=mask^box
labels,count=ndimage.label(stroke,np.ones((3,3)))
sizes=np.bincount(labels.ravel());sizes[0]=0
main=labels==sizes.argmax()
y,x=np.nonzero(main)
indices=np.full(main.shape,-1,np.int32);indices[y,x]=np.arange(len(x))
rows,cols,weights=[],[],[]
for dx,dy in [(1,0),(0,1),(1,1),(-1,1)]:
    nx,ny=x+dx,y+dy
    valid=(nx>=0)&(nx<width)&(ny>=0)&(ny<height)
    a=indices[y[valid],x[valid]];b=indices[ny[valid],nx[valid]]
    keep=b>=0;a,b=a[keep],b[keep]
    rows.extend([a,b]);cols.extend([b,a]);weights.extend([np.full(len(a),np.hypot(dx,dy))]*2)
graph=sparse.csr_matrix((np.concatenate(weights),(np.concatenate(rows),np.concatenate(cols))),shape=(len(x),len(x)))
# Center of the lower-right terminal cap, just inside the square.
start=np.argmin((x-width*.875)**2+(y-height*.63)**2)
distance=dijkstra(graph,directed=False,indices=start)
field=np.zeros(main.shape,float);field[y,x]=distance/distance.max()
# Extend the field across boundary samples to avoid thin unpainted mesh edges.
nearest=ndimage.distance_transform_edt(~main,return_distances=False,return_indices=True)
field=field[tuple(nearest)]
rgba=np.zeros((height,width,4),np.uint8)
rgba[:,:,0]=np.rint(field*254).astype(np.uint8)
rgba[:,:,1]=(box&~mask)*255
rgba[:,:,2]=(~box)*255
rgba[:,:,3]=255
Image.fromarray(rgba).save(output)
print('Carve field:',width,height,'stroke pixels:',len(x),'connected components:',count)
