"""Fit a symmetric pinhole view to independently picked display corners."""
from pathlib import Path
import json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
# Measured from silver-upper-width at closed, unrotated native-mm rest.
HINGE=np.array([-.2103884071,40.1071281433,16.6314620972])
CENTERS=[np.array([-.2103864998,-1.3087120056,15.8505449295]),np.array([-.2103881687,-2.4663503170,13.9363594055])]
SIZES=[(106.2,63.72),(84.96,63.72)]
OBSERVED=np.array([[646,130],[1187,130],[1187,455],[646,455],[698,543],[1135,543],[1157,774],[676,774]],float)
def points(opening):
    out=[];c,s=np.cos(-opening),np.sin(-opening);rot=np.array([[1,0,0],[0,c,-s],[0,s,c]])
    for i,(center,(w,h)) in enumerate(zip(CENTERS,SIZES)):
        offsets=np.array([[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]])
        if i==1:offsets[:,1]*=-1
        p=center+offsets
        if i==0:p=(p-HINGE)@rot.T+HINGE
        out.extend(p)
    return np.array(out)
def project(params):
    elev,opening,ld,lf,cy,cx=params;d,f=np.exp(ld),np.exp(lf)
    forward=np.array([0,np.cos(elev),-np.sin(elev)]);up=np.array([0,np.sin(elev),np.cos(elev)])
    camera=-forward*d;camera[0]=HINGE[0]
    q=points(opening)-camera;depth=q@forward
    return np.stack([f*q[:,0]/depth+cx,-f*(q@up)/depth+cy],axis=1)
def fit(start):
    p=start.copy();lam=.01
    lo=np.array([np.radians(10),np.radians(90),np.log(100),np.log(100),-20000,800])
    hi=np.array([np.radians(85),np.radians(179),np.log(100000),np.log(1000000),20000,1000])
    for _ in range(300):
        residual=(project(p)-OBSERVED).ravel();cost=residual@residual
        eps=np.array([1e-5,1e-5,1e-5,1e-5,.01,.01]);jac=np.stack([((project(p+np.eye(6)[i]*eps[i])-project(p-np.eye(6)[i]*eps[i]))/(2*eps[i])).ravel() for i in range(6)],axis=1)
        mat=jac.T@jac;step=np.linalg.solve(mat+lam*np.diag(np.maximum(np.diag(mat),1e-6)),jac.T@residual)
        nxt=np.clip(p-step,lo,hi);new=(project(nxt)-OBSERVED).ravel()
        if new@new<cost:
            p=nxt;lam=max(lam*.3,1e-12)
            if np.linalg.norm(step)<1e-7:break
        else:lam=min(lam*10,1e12)
    return p,float(np.mean((project(p)-OBSERVED)**2)**.5)
def main():
    trials=[fit(np.array([np.radians(e),np.radians(o),np.log(1200),np.log(6000),450,916.5])) for e in [35,50,65] for o in [120,145,165]]
    p,error=min(trials,key=lambda item:item[1]);e,o,ld,lf,cy,cx=p;distance,focal=np.exp(ld),np.exp(lf)
    report={'source_model':'silver-upper-width.glb','source_sha256':hashlib.sha256((ROOT/'model/candidates/joshua-xl/silver-upper-width.glb').read_bytes()).hexdigest(),'reference_url':'https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg','reference_pixels':[1794,1009],'observed_corners':OBSERVED.tolist(),'projected_corners':project(p).tolist(),'rmse_per_coordinate_pixels':error,'camera_elevation_degrees':float(np.degrees(e)),'hinge_open_degrees':float(np.degrees(o)),'distance_mm':float(distance),'focal_pixels':float(focal),'principal_pixels':[float(cx),float(cy)],'camera_mm':[float(HINGE[0]),float(-distance*np.cos(e)),float(distance*np.sin(e))],'sensor_width_mm':36,'lens_mm':float(focal*36/1794),'limits':'Symmetric pinhole fit to manually picked artwork/display corners; no lens distortion or independent physical calibration. Parameter estimates are for visual comparison, not recovered factory geometry or mandated viewer pose.'}
    (ROOT/'model/candidates/joshua-xl/reference-camera-fit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
