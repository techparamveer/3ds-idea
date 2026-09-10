"""Read-only checks of EUR atlas scope, erased US ink and replaced sticker relief."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
DERIVED=FOLDER/'derived-textures'
SOURCES={'basecolor':'body-silver-basecolor','paint-mask':'paint-mask',
         'normal':'body-paint-grain-normal','metallic-roughness':'body-paint-grain-metallic-roughness'}


def main():
    mask=np.array(Image.open(DERIVED/'body-eur-edit-mask.png'))
    allowed=mask>0
    assert 300000<int(allowed.sum())<800000,'Expected a bounded underside edit'
    report={'edit_coverage_pixels':int(allowed.sum()),'atlas_pixels':4096**2,'maps':{}}
    for kind,old in SOURCES.items():
        source=DERIVED/(old+'.png');output=DERIVED/('body-eur-'+kind+'.png')
        a=np.array(Image.open(source)).astype(np.int16)
        b=np.array(Image.open(output)).astype(np.int16)
        assert a.shape==b.shape
        changed=np.any(a!=b,axis=2) if a.ndim==3 else a!=b
        outside=int((changed&~allowed).sum())
        assert outside==0,(kind,outside)
        assert int(changed.sum())>20000,'Empty or unchanged output cannot pass'
        ys,xs=np.where(changed)
        report['maps'][kind]={'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
            'changed_pixels':int(changed.sum()),'changed_outside_edit_mask':outside,
            'changed_bounds_xyxy':[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]}
        if kind=='basecolor':
            # These old printed strips lie between the relocated wordmark and
            # new EUR block, and above the new wordmark. They must be clean paint.
            for strip in [b[2170:2225,2600:3480],b[2350:2378,2730:3370]]:
                assert np.array_equal(strip,np.broadcast_to([149,152,155],strip.shape))
            report['old_us_upper_text_and_wordmark_strips']='uniform restored silver paint'
            white=np.all(b[1730:1810,2800:3300]>200,axis=2)
            assert int(white.sum())>20000,'The new serial paper must be present'
            report['serial_paper_bright_pixels_in_probe']=int(white.sum())
        elif kind=='paint-mask':
            assert np.all(b[2170:2225,2600:3480]==255)
            assert b[1812,3275]<5,'New white paper must be excluded from paint-only VGPU grain'
        elif kind=='normal':
            # The old blank sticker's upper lip lies above the new sticker.
            # Clearing it must remove the strong old relief, not paint over it.
            region=b[1850:1865,2830:3280]
            deviation=np.maximum(abs(region[:,:,0]-127),abs(region[:,:,1]-128))
            assert int(deviation.max())<=16
            report['old_sticker_lip_max_normal_xy_deviation_8bit']=int(deviation.max())
        elif kind=='metallic-roughness':
            assert np.array_equal(a[:,:,[0,2]],b[:,:,[0,2]]),'Red/metallic channels must stay exact'
            assert abs(int(b[1812,3275,1])-round(.67*255))<=1
    (FOLDER/'eur-pixel-audit.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__=='__main__':main()
