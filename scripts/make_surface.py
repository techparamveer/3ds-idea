from PIL import Image, ImageDraw
import random
from pathlib import Path
random.seed(37)
p=Path(__file__).resolve().parents[1]/'public/textures';p.mkdir(parents=True,exist_ok=True)
n=1024
im=Image.new('RGB',(n,n));im.putdata([(v,v,v) for v in [int(max(58,min(110,random.gauss(80,5)))) for _ in range(n*n)]])
d=ImageDraw.Draw(im)
for i in range(130):
 x=random.randrange(n);y=random.randrange(n);d.line((x,y,x+random.randrange(3,48),y+random.randrange(-5,6)),fill=(105,105,105),width=1)
im.save(p/'silver-roughness.png')
