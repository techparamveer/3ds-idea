"""Read-only plan-view outline comparison with the reference-only physical scan."""
from pathlib import Path
import json,struct,hashlib
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
STL=np.dtype([('normal','<f4',(3,)),('vertices','<f4',(3,3)),('attribute','<u2')])

def hull(points):
    # Reduce dense scan data to angular extrema before a monotone-chain hull.
    center=(points.min(0)+points.max(0))/2
    delta=points-center;angle=np.arctan2(delta[:,1],delta[:,0])
    bins=np.minimum(((angle+np.pi)/(2*np.pi)*7200).astype(int),7199)
    radius=np.einsum('ij,ij->i',delta,delta)
    order=np.lexsort((radius,bins));last=np.r_[bins[order][1:]!=bins[order][:-1],True]
    reduced=points[order[last]]
    p=sorted(set(map(tuple,reduced)))
    def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lower=[];upper=[]
    for sequence,target in [(p,lower),(reversed(p),upper)]:
        for point in sequence:
            while len(target)>=2 and cross(target[-2],target[-1],point)<=1e-8:target.pop()
            target.append(point)
    return np.array(lower[:-1]+upper[:-1])

def main():
    source=ROOT/'.local/reference-scans/wesk/Top Shell.stl'
    with source.open('rb') as stream:stream.seek(80);count=struct.unpack('<I',stream.read(4))[0]
    triangles=np.memmap(source,dtype=STL,mode='r',offset=84,shape=(count,))
    points=triangles['vertices'][::10].reshape(-1,3).astype(float)
    report=json.loads((ROOT/'docs/reference-scan-measurements.json').read_text())
    fit=report['parts'][0]['fits'][-1]['coefficients_c_x_y_xx_xy_yy']
    normal=np.array([-fit[1],-fit[2],1]);normal/=np.linalg.norm(normal)
    u=np.array([1,0,fit[1]]);u/=np.linalg.norm(u);v=np.cross(normal,u)
    scan=points@np.column_stack([u,v]);scan=hull(scan);scan-=(scan.min(0)+scan.max(0))/2
    # Rounded front versus clipped hinge-side corners establish opposite depth
    # directions in these two files. This is orientation, not a scale fit.
    scan[:,1]*=-1
    snapshot=np.load(ROOT/'.local/reference-scans/current-lid.npz')
    source_hash=hashlib.sha256((ROOT/'model/candidates/joshua-xl/silver-etched.glb').read_bytes()).hexdigest()
    assert str(snapshot['source_sha256'])==source_hash
    current=snapshot['points']
    model=hull(current[:,:2]);model-=(model.min(0)+model.max(0))/2
    out={'source':'https://bitbuilt.net/forums/threads/3ds-xl-ll-scan.7046/',
         'model_checkpoint':'silver-etched.glb','model_sha256':source_hash,
         'method':'Every tenth scan triangle vertices; orthonormal broad-plane tilt removal; 7200 angular extrema; convex hull. Translation alignment only, no scale fitting.',
         'scan_span_mm':np.ptp(scan,axis=0).tolist(),'model_span_mm':np.ptp(model,axis=0).tolist(),
         'scan_hull_vertices':len(scan),'model_hull_vertices':len(model),
         'orientation':'Scan depth reversed: rounded front aligned with the model camera/front edge; clipped hinge corners aligned at rear.',
         'limits':'Convex silhouette only. Scan artifacts, undercuts and orientation must be checked before any geometry change. Not manufacturer CAD.'}
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig,axes=plt.subplots(1,3,figsize=(13,5))
    for ax in axes:
        ax.plot(*np.vstack([scan,scan[0]]).T,color='#ad4d33',lw=1.4,label='Reference scan')
        ax.plot(*np.vstack([model,model[0]]).T,color='#24546e',lw=1.2,label='Lid before smoothing')
        ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_xlabel('Width coordinate (mm)');ax.set_ylabel('Depth coordinate (mm)')
    axes[0].set_title('Lid plan-view outlines');axes[0].legend(fontsize=8)
    axes[1].set(xlim=(62,80),ylim=(-48,-28),title='Negative-depth right corner')
    axes[2].set(xlim=(62,80),ylim=(28,48),title='Positive-depth right corner')
    fig.suptitle('Source shell versus physical-scan silhouette — front/hinge sides aligned')
    for name,outline in [('scan',scan),('model',model)]:
        selected=outline[(outline[:,0]>64)&(outline[:,1]<-34)]
        center=np.linalg.lstsq(np.column_stack([2*selected,np.ones(len(selected))]),np.sum(selected*selected,axis=1),rcond=None)[0]
        radius=float(np.sqrt(center[2]+np.dot(center[:2],center[:2])))
        out[name+'_front_corner_circle']={'center_xy':center[:2].tolist(),'radius_mm':radius,
            'points':len(selected),'rms_radial_mm':float(np.sqrt(np.mean((np.linalg.norm(selected-center[:2],axis=1)-radius)**2)))}
    fig.tight_layout();fig.savefig(ROOT/'docs/lid-outline-comparison.png',dpi=150);plt.close(fig)
    (ROOT/'docs/lid-outline-comparison.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps(out,indent=2))

if __name__=='__main__':main()
