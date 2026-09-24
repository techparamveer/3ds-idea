"""Replay the actual global Sound room visibility writer, not same-offset layouts."""
import argparse
import hashlib
import json
import struct
from pathlib import Path
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import UC_ARM_REG_R7, UC_ARM_REG_SP

SHA = '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9'

def replay(code):
    assert hashlib.sha256(code).hexdigest() == SHA
    cases = []
    for control, index, host_flags, mode_value in [(0,0,0,None),(0xc4,1,0,None),(0xc4,0,0,None),(0xc4,1,0xd0,None),(0,0,0,0),(0,0,0,1),(0,0,0,255)]:
        u=Uc(UC_ARCH_ARM,UC_MODE_ARM);u.mem_map(0x100000,(len(code)+0xfff)&~0xfff);u.mem_write(0x100000,code);u.mem_map(0x500000,0x10000)
        app,controls,host,holder,mode,room=range(0x500000,0x506000,0x1000)
        def w(a,v): u.mem_write(a,struct.pack('<I',v))
        w(app+0x78,controls);w(app+0x58,host);w(app+0x70,holder);w(app+0x8c,room)
        w(controls+0x30,control);w(host+0x148,index);w(host+0x30,host_flags);w(holder+0x254,0 if mode_value is None else mode);w(room+0x30,0x3de)
        if mode_value is not None:u.mem_write(mode+0xa0,bytes([mode_value]))
        u.reg_write(UC_ARM_REG_R7,app);u.reg_write(UC_ARM_REG_SP,0x50f000)
        u.emu_start(0x235e00,0x235e84,count=1000)
        result=struct.unpack('<H',u.mem_read(room+0x30,2))[0]
        enabled=not(control&0xc4 and index and not host_flags&0xd0) and (mode_value is None or mode_value!=0)
        assert result==(0x3de&~0x1c if enabled else 0x3de)
        cases.append({'controlFlags':control,'hostIndex':index,'hostFlags':host_flags,'modeByte':mode_value,'roomFlags':result,'enabled':enabled})
    # The historical 0x272xxx matches write a layout returned by 0x20bb38 to
    # another owner+0x8c. It is not the global model allocated at 0x1c674c.
    word=lambda a:struct.unpack_from('<I',code,a-0x100000)[0]
    assert word(0x27231c)==0xe284608c
    assert word(0x272320)==0xe3a000ac
    assert word(0x272378)==0xebfe65ee  # bl 0x20bb38
    return {'schema':1,'codeSha256':SHA,'globalRoom':'app+0x8c from 0x1c674c/0x1c6754','writer':'0x235e00..0x235e80','modePredicate':'0x28fcf8 (null child returns true; otherwise signed byte child+0xa0)','managedDisableMask':'0x1c','cases':cases,'unrelatedLayoutConstructor':'0x27231c..0x2723ac','scope':'raw native field cases, not invented scene/save-state labels'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--code',type=Path,required=True);p.add_argument('--report',type=Path,required=True);a=p.parse_args();r=replay(a.code.read_bytes());a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
