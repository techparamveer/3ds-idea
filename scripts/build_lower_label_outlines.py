"""Clean vector stencils fitted to original-XL photographic glyph boxes.

No font files. These are constrained authored outlines, not factory artwork.
Pixel boxes are measured in the 16-pixel-high reference crops from the existing
legends atlas report. Supersampling removes crop noise, not source uncertainty.
"""
from pathlib import Path
import json,math
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl';OUT=FOLDER/'derived-textures'

def curve(a,b,c,d):
 return [tuple((1-t)**3*a[j]+3*(1-t)**2*t*b[j]+3*(1-t)*t*t*c[j]+t**3*d[j] for j in range(2)) for t in [i/64 for i in range(65)]]

def paths(c):
 if c=='E':return [[(.92,.08),(.08,.08),(.08,.92),(.92,.92)],[(.08,.5),(.8,.5)]]
 if c=='L':return [[(.08,.08),(.08,.92),(.92,.92)]]
 if c=='T':return [[(.06,.08),(.94,.08)],[(.5,.08),(.5,.92)]]
 if c=='H':return [[(.08,.08),(.08,.92)],[(.92,.08),(.92,.92)],[(.08,.5),(.92,.5)]]
 if c=='M':return [[(.07,.92),(.07,.08),(.5,.92),(.93,.08),(.93,.92)]]
 if c=='A':return [[(.06,.92),(.5,.08),(.94,.92)],[(.24,.61),(.76,.61)]]
 if c=='R':return [[(.08,.92),(.08,.08),(.56,.08)]+curve((.56,.08),(1.04,.08),(1.04,.5),(.56,.5))[1:]+[(.08,.5)],[(.5,.5),(.94,.92)]]
 if c=='S':return [curve((.91,.2),(.72,-.02),(.08,.04),(.08,.28))+curve((.08,.28),(.08,.52),(.92,.46),(.92,.7))[1:]+curve((.92,.7),(.92,1),(.26,1),(.08,.8))[1:]]
 if c=='C':return [curve((.91,.2),(.65,-.08),(.07,.05),(.07,.5))+curve((.07,.5),(.07,.95),(.65,1.08),(.91,.8))[1:]]
 if c=='O':return [[(.5+.44*math.cos(t),.5+.44*math.sin(t)) for t in [2*math.pi*i/128 for i in range(129)]]]
 raise ValueError(c)

BOXES={
 'SELECT':[('S',4,11),('E',14,22),('L',25,32),('E',35,43),('C',45,53),('T',56,65)],
 'HOME':[('H',28,37),('O',40,52),('M',56,68),('E',72,80)],
 'START':[('S',4,12),('T',14,23),('A',24,34),('R',37,45),('T',47,56)]}

def main():
 report=json.loads((FOLDER/'legends-atlas-report.json').read_text())
 atlas=Image.new('L',(4096,4096));draw=ImageDraw.Draw(atlas)
 specout={}
 for row,(word,boxes) in enumerate(BOXES.items()):
  spec=report['legends']['Button_'+word];x0,y0,x1,y1=spec['crop'];w,h=spec['size_mm'];sx=w/(x1-x0);sy=h/(y1-y0)
  # Atlas uses 32 mm horizontally, three 8 mm-high rows. SVG uses photo pixels.
  svg=[]
  stroke_width={"SELECT":1.15,"HOME":1.15,"START":1.0}[word]
  def emit(points,stroke):
   def transform(point):
    x,y=point
    return ((16+(x-(x1-x0)/2)*sx)*128,((row+.5)*8+(y-8)*sy)*4096/24)
   # Stroke in reference-pixel coordinates first, then apply the anisotropic
   # photo-to-cap projection. This keeps SVG and atlas stroke geometry aligned.
   for a,b in zip(points,points[1:]):
    dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
    if length==0:continue
    nx,ny=-dy/length*stroke/2,dx/length*stroke/2
    draw.polygon([transform(v) for v in [(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),(b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)]],fill=255)
   for x,y in points[1:-1]:
    draw.ellipse([transform((x-stroke/2,y-stroke/2)),transform((x+stroke/2,y+stroke/2))],fill=255)
   svg.append('<polyline points="'+' '.join(f'{x:.4f},{y:.4f}' for x,y in points)+f'" fill="none" stroke="black" stroke-width="{stroke}" stroke-linejoin="round"/>')
  for c,left,right in boxes:
   for p in paths(c):emit([(left+x*(right-left),3.7+y*8.4) for x,y in p],stroke_width)
  if word=='HOME':
   # The reference has a closed lower edge and a rectangular light opening,
   # not an open-bottom doorway. Keep the roof/body silhouette and the hole
   # separate to prevent the earlier generic house interpretation.
   outer=[(3.5,6.3),(11.3,1.2),(19.1,6.3),(16.7,6.3),(16.7,12.3),(5.9,12.3),(5.9,6.3)]
   hole=[(8.0,7.1),(14.6,7.1),(14.6,10.6),(8.0,10.6)]
   def project(point):
    x,y=point
    return ((16+(x-(x1-x0)/2)*sx)*128,((row+.5)*8+(y-8)*sy)*4096/24)
   draw.polygon([project(p) for p in outer],fill=255);draw.polygon([project(p) for p in hole],fill=0)
   def svgpath(poly):return 'M'+' L'.join(f'{x},{y}' for x,y in poly)+' Z'
   svg.append('<path d="'+svgpath(outer)+' '+svgpath(hole)+'" fill="black" fill-rule="evenodd"/>')
  (OUT/f'lower-label-{word.lower()}-outline.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1-x0} 16">'+''.join(svg)+'</svg>\n')
  specout[word]={'row':row,'glyph_boxes_photo_pixels':boxes,'height_box':[3.7,12.1],'stroke_photo_pixels':stroke_width,'size_mm':spec['size_mm'],'house':'authored filled roof/body with closed-bottom rectangular opening' if word=='HOME' else None}
 atlas=atlas.resize((1024,1024),Image.Resampling.LANCZOS);atlas.save(OUT/'lower-label-clean-mask.png')
 (FOLDER/'lower-label-outline-study.json').write_text(json.dumps({'source':report['source'],'atlas_mm':[32,24],'labels':specout,'limits':'Photograph-constrained authored glyphs; not factory vectors. Curve geometry, stroke width and house interpretation remain estimates.'},indent=2)+'\n')
 print('Wrote lower-label SVG outlines and 1024-square mask.')
if __name__=='__main__':main()
