"""Read-only full-image isolation audit for the smooth engraving atlas."""
from pathlib import Path
import hashlib,json,runpy
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'model/candidates/joshua-xl';DERIVED=FOLDER/'derived-textures'
# Revalidate actual source mesh coverage and uncontaminated baseline columns.
regions=runpy.run_path(str(ROOT/'scripts/audit_etched_regions.py'))['REGIONS']
mask=np.zeros((4096,4096),bool)
for x0,y0,x1,y1 in regions.values():mask[y0:y1,x0:x1]=True
report={'source':'silver-legends.glb','maps':{}}
for name in ['basecolor','normal']:
    old=np.array(Image.open(DERIVED/('body-legends-'+name+'.png')))
    path=DERIVED/('body-etched-'+name+'.png');new=np.array(Image.open(path))
    assert old.shape==new.shape==(4096,4096,3)
    changed=np.any(old!=new,axis=2)
    outside=int(np.count_nonzero(changed&~mask))
    assert outside==0,(name,'Changed unrelated pixels',outside)
    assert changed.sum()>100
    if name=='basecolor':assert np.all(new.astype(int)<=old.astype(int))
    report['maps'][name]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'changed_pixels':int(changed.sum()),'outside_edit_changed':outside}
report['interpretation']='Smooth fitted stencil; estimated engraving depth and cavity shade. Not a factory font.'
(FOLDER/'etched-pixel-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
