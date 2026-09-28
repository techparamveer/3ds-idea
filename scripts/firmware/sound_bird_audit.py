"""Bounded source audit of Sound entry bird owners; no live scheduling inferred."""
import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from unpack_home_resources import decompress, unpack_darc
from firmware.native import decode_layout, decode_animation
from firmware.texture import decode_bclim, png

CODE_SHA = '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9'
BASE = 0x100000

def audit(code, archive, output=None):
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    facts = []
    def fact(address, expected):
        x = next(md.disasm(code[address-BASE:address-BASE+4], address))
        actual = x.mnemonic+' '+x.op_str
        assert actual == expected, (hex(address), actual, expected)
        facts.append({'address':hex(address), 'instruction':actual})
    def word(a): return struct.unpack_from('<I', code, a-BASE)[0]
    def string(a): return code[a-BASE:code.index(b'\0', a-BASE)].decode()
    for a, text in [
        (0x231a98,'str r0, [r4, #0xf0]'),(0x231ab4,'str r0, [r4, #0xf4]'),
        (0x231ac4,'bl #0x2484d8'),(0x2484f4,'str r1, [r0, #0xc98]'),
        (0x2484f8,'str r2, [r0, #0xcdc]'),(0x248560,'orr r1, r1, #0x1e'),
        (0x2485bc,'orr r1, r1, #0x1e'),(0x231aec,'bl #0x1e052c'),
        (0x231af8,'str r0, [sb, #0xd8]'),(0x231b4c,'vmla.f32 s0, s1, s16'),
        (0x231b94,'mov r1, #0xa'),(0x231b9c,'cmp r8, #3'),
        (0x1e042c,'str r0, [r4, #0xf8]'),(0x1e0450,'strb r6, [r4, #0x108]'),
        (0x1e0490,'mov r1, #0'),(0x1e048c,'mov r2, #0x14'),
        (0x2364b0,'vldr s0, [r7, #0x38]'),(0x2364b8,'ldr r0, [r0, #0xd8]'),
        (0x2364bc,'bl #0x1fc830'),(0x2364c4,'cmp r4, #3'),
        (0x1fc84c,'vmov.f32 s17, s0'),(0x1fc938,'vsub.f32 s0, s0, s17'),
        (0x1fc948,'bhs #0x1fc9b4'),(0x1fc958,'mov r2, #6'),
        (0x1fc95c,'mov r1, #1'),(0x1fc960,'bl #0x1fcf60'),
        (0x1fc96c,'bl #0x1fcd8c'),(0x1fcd98,'str r1, [r0, #0xf8]'),
        (0x1fce1c,'bl #0x20bed8'),(0x1fce44,'mov r2, #0x12c'),
        (0x1fce48,'mov r1, #0x32'),(0x1fce5c,'vstr s0, [r5, #0xfc]'),
        (0x1fcf74,'add ip, r2, #1'),(0x1fcfa8,'umull r2, r0, r2, ip'),
        (0x1fcfac,'add r0, r0, r1'),(0x1fca90,'bl #0x1fcf60'),
        (0x1fcaf4,'vstr s0, [r4, #0xa0]'),(0x1fcb18,'b #0x1fcd8c'),
    ]: fact(a,text)
    assert string(0x231e48) == 'ParakeetEx_U'
    assert [struct.unpack_from('<f',code,a-BASE)[0] for a in [0x231e3c,0x231e40,0x231e44]] == [50,-157,-72]
    table = [string(word(0x371f14+i*4)) for i in range(13)]
    assert table == ['Wait','RandomA','RandomB','RandomC','RandomD','RandomF','RandomG','RandomI','RandomJ','OutL_U','InL_U','Wait','FlyLoopL']
    files = unpack_darc(decompress(archive))
    wrapper = decode_layout(files['blyt/ParakeetEx_U.bclyt'])
    mount = wrapper['roots'][0]['children'][0]
    assert mount['name'] == '-L-ChaA' and mount['metadata'][0]['value'] == 'Parakeet/ParakeetA_U'
    clips={}
    for suffix in ['Wait','RandomA','RandomB','RandomC','RandomD','RandomF','RandomG','RandomI','RandomJ','InL_U','OutL_U','FlyLoopL']:
        name='ParakeetA_U_'+suffix
        raw=files['anim/'+name+'.bclan'];clip=decode_animation(raw)
        assert not clip['unsupported']
        clips[name]={'sha256':hashlib.sha256(raw).hexdigest(), 'frames':clip['frames'], 'loop':clip['loop'],
                     'textures':clip['textures'], 'patternKeys':next(t['keys'] for t in clip['tracks'] if t['property']=='texture.pattern')}
    assert clips['ParakeetA_U_Wait']['patternKeys'] == [{'frame':0.0,'value':0},{'frame':60.0,'value':1}]
    if output:
        output.mkdir(parents=True,exist_ok=True)
        for name in sorted({t for clip in clips.values() for t in clip['textures']}):
            info,rgba=decode_bclim(files['timg/'+name]);(output/(name+'.png')).write_bytes(png(info['width'],info['height'],rgba))
    return {'schema':1,'codeSha256':CODE_SHA,'archiveSha256':hashlib.sha256(archive).hexdigest(),
            'instructionFacts':facts,'upperExtendedStateTable':table,'upperExtendedInitialBase':{'x':-157,'stepX':50,'y':-72,'count':3,'randomXExtent':10},
            'wrapperSha256':hashlib.sha256(files['blyt/ParakeetEx_U.bclyt']).hexdigest(),'childMount':mount,'clips':clips,
            'gate':'Live owner activation, app+0x38 delta producer/units, shared RNG consumption, child animation scheduling and third-bird flight/visibility order remain unproven. No live change.'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--code',type=Path,required=True);p.add_argument('--archive',type=Path,required=True);p.add_argument('--report',type=Path,required=True);p.add_argument('--textures',type=Path)
    a=p.parse_args();r=audit(a.code.read_bytes(),a.archive.read_bytes(),a.textures);a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(r,indent=2)+'\n');print('Verified',len(r['instructionFacts']),'native instruction facts and',len(r['clips']),'original clips')
