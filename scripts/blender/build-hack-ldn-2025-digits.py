"""Draw 2025 in the traced HACK LDN lettering's weight. Output path must be absolute.
Stems match H/L/D/N (73px) and bars match their horizontals (62px) at the
same 330px cap height, so the third row reads as one face with the logo.
Overlapping strokes stay separate solids; Blender fills each curve even-odd.
"""
import math,json,sys
from pathlib import Path
CAP=330;OV=7;V=73;T=62
def width(tx,ty):return V-(V-T)*abs(tx)
def ellipse(cx,cy,rx,ry,t0,t1,n=48):
    return [(cx+rx*math.cos(math.radians(t0+(t1-t0)*i/n)),cy-ry*math.sin(math.radians(t0+(t1-t0)*i/n))) for i in range(n+1)]
def stroke(pts,closed=False):
    """Mitered variable-width outline; returns list of rings."""
    n=len(pts);left=[];right=[]
    def dirn(a,b):
        dx,dy=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dy);return dx/l,dy/l
    for i in range(n):
        if closed:p,q=pts[i-1],pts[(i+1)%n]
        else:p,q=pts[max(i-1,0)],pts[min(i+1,n-1)]
        if closed or 0<i<n-1:
            d1=dirn(p,pts[i]);d2=dirn(pts[i],q)
            nx1,ny1=-d1[1],d1[0];nx2,ny2=-d2[1],d2[0]
            mx,my=nx1+nx2,ny1+ny2;ml=math.hypot(mx,my);mx,my=mx/ml,my/ml
            cos=mx*nx1+my*ny1
            h1=width(*d1)/2;h2=width(*d2)/2;h=(h1+h2)/2/max(cos,.25)
        else:
            d=dirn(p,q);mx,my=-d[1],d[0];h=width(*d)/2
        x,y=pts[i];left.append((x+mx*h,y+my*h));right.append((x-mx*h,y-my*h))
    if closed:
        rings=[left,right[::-1]]
        return sorted(rings,key=lambda r:-abs(area(r)))
    return [left+right[::-1]]
def area(r):return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(r,r[1:]+r[:1]))/2
def tangent_end(cx,cy,rx,ry,corner,lo,hi):
    """Arc angle where the line to corner leaves tangentially (decreasing t)."""
    best=None
    for k in range(4000):
        t=lo+(hi-lo)*k/3999;r=math.radians(t)
        px,py=cx+rx*math.cos(r),cy-ry*math.sin(r)
        tx,ty=rx*math.sin(r),ry*math.cos(r);l=math.hypot(tx,ty)
        dx,dy=corner[0]-px,corner[1]-py;dl=math.hypot(dx,dy)
        err=abs(tx/l*dy/dl-ty/l*dx/dl)
        if best is None or err<best[0]:best=(err,t)
    return best[1]
def two(x0):
    cx,cy=x0+128,104;rx,ry=128-37,104-(-OV+T/2)
    corner=(x0+40,CAP-T/2)
    te=tangent_end(cx,cy,rx,ry,corner,-80,10)
    arc=ellipse(cx,cy,rx,ry,168,te)
    return [stroke(arc+[corner,(x0+258,CAP-T/2)])]
def zero(x0):
    cx,cy=x0+132,CAP/2;rx,ry=132-V/2,CAP/2+OV-T/2
    n=96;e=2.25
    pts=[]
    for i in range(n):
        a=2*math.pi*i/n;c,s=math.cos(a),math.sin(a)
        pts.append((cx+rx*math.copysign(abs(c)**(2/e),c),cy-ry*math.copysign(abs(s)**(2/e),s)))
    return [stroke(pts[::-1],closed=True)]
def five(x0):
    bar=stroke([(x0+238,T/2),(x0+62,T/2),(x0+52,172)])
    cx,cy=x0+128,218;rx,ry=128-37,CAP+OV-T/2-218
    bowl=stroke(ellipse(cx,cy,rx,ry,150,-150))
    b=bar[0];m=len(b)//2;w=bowl[0]
    quad=[b[m-1],b[m],w[-1],w[0]]
    cx0=sum(p[0] for p in quad)/4;cy0=sum(p[1] for p in quad)/4
    quad.sort(key=lambda p:math.atan2(p[1]-cy0,p[0]-cx0))
    return [bar,bowl,[quad]]
ADV=290
TOP=786
LOGO_LEFT,LOGO_WIDTH=87,1224
if __name__=='__main__':
    output=Path(sys.argv[1]);assert output.is_absolute()
    glyphs=[two(0),zero(ADV),two(2*ADV),five(3*ADV)]
    xs=[x for g in glyphs for solid in g for ring in solid for x,_ in ring]
    dx=LOGO_LEFT+(LOGO_WIDTH-(max(xs)-min(xs)))/2-min(xs)
    out=[{'char':c,'solids':[[[[round(x+dx,1),round(y+TOP,1)] for x,y in ring] for ring in solid] for solid in g]} for c,g in zip('2025',glyphs)]
    ys=[y for g in out for solid in g['solids'] for ring in solid for _,y in ring]
    output.write_text(json.dumps({'cap':CAP,'stem':V,'bar':T,'bounds':[LOGO_LEFT,round(min(ys)),LOGO_WIDTH,round(max(ys)-min(ys))],'glyphs':out})+'\n')
    print('2025 glyph solids:',[len(g['solids']) for g in out])
