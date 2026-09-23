"""Keyboard ARM alpha arithmetic; no native matrices, bounds or GPU claim."""
from pathlib import Path
import importlib.util,json,sys
D=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).parent
spec=importlib.util.spec_from_file_location('g',D/'global-schedule.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
r=g.Global();m=g.m
pane=r.alloc(0x300);parent=r.alloc(0x300);info=r.alloc(0x100);r.w(pane+0xc,parent)
rows=[]
for alpha,flags,enabled,factor,expected,childFactor in [(255,1,0,1.,255,1.),(255,3,1,1.,255,1.),(0,3,0,1.,0,0.),(255,1,1,0.,0,0.),(0,1,0,1.,0,1.),(128,3,1,.5,64,128/510)]:
 r.u.mem_write(pane+0xb4,bytes([alpha]));r.u.mem_write(pane+0xb7,bytes([flags]));r.u.mem_write(info+0x88,bytes([enabled]));r.f(info+0x7c,factor)
 r.u.reg_write(m.UC_ARM_REG_R4,pane);r.u.reg_write(m.UC_ARM_REG_R6,info)
 r.bounded(0x176584,0x1765b8,[],'effectiveAlpha')
 effective=r.u.mem_read(pane+0xb5,1)[0];assert effective==expected
 end=0x1765f8 if flags&2 and alpha!=255 else 0x17664c
 r.bounded(0x1765b8,end,[],'childAlphaFactor')
 inherited=r.fs(info+0x7c,1)[0];assert abs(inherited-childFactor)<1e-7
 rows.append({'paneAlpha':alpha,'paneFlags':flags,'inheritedEnabled':enabled,'incomingFactor':factor,'effectiveAlpha':effective,'childFactor':inherited})
out={'codeSha256':'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0','originalRanges':['176584..1765b8','1765b8..1765f8 or17664c'],'probes':rows,'scope':'Original keyboard ARM effective-byte conversion and influence-alpha child factor. Synthetic pane/draw-info. Does not execute animation curves, world matrices, clipping, bounds or GPU.'}
(D/'parent-alpha.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
