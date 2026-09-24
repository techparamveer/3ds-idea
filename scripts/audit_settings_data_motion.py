"""Read-only source audit of Settings Data Management entry/loading motion."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from firmware.build import unpack_archive, decompress
from firmware.native import decode_animation, decode_layout
from audit_settings_data_lists import CODE_SHA256, pc_relative, c_string
BASE = 0x100000
RANGES = {'loading-constructor': (0x20cfa8, 0x20d2cc),
          'loading-update': (0x20d5fc, 0x20dd0c),
          'leave-callback': (0x20dd0c, 0x20dd70),
          'entry-name-builder': (0x235940, 0x2359b8)}
SITES = {0x20d188: 'SMngCTRData_D_00_BtnIn.bclan',
         0x20d19c: 'SMngCTRData_D_00_TextIn.bclan',
         0x20d228: 'WaitIcon_WIconIn.bclan',
         0x20d240: 'WaitIcon_WIconLoop.bclan',
         0x20dd38: 'N_WaitIcon_00'}
STATES = [0x20dc3c, 0x20d65c, 0x20d980, 0x20da50, 0x20dc3c,
          0x20dc3c, 0x20dc3c, 0x20dab4, 0x20da88, 0x20dad8,
          0x20db0c, 0x20db24, 0x20dbb0, 0x20dc3c, 0x20dbec,
          0x20dc3c, 0x20dbd0]

def inspect(code, romfs):
    if hashlib.sha256(code).hexdigest() != CODE_SHA256:
        raise ValueError('Unexpected Settings code image')
    word = lambda address: struct.unpack_from('<I', code, address-BASE)[0]
    sites = {}
    for address, expected in SITES.items():
        target = pc_relative(word(address), address)
        actual = c_string(code, target)
        if actual != expected: raise ValueError('Changed source motion binding')
        sites[hex(address)] = {'address': hex(target), 'value': actual}
    states = [word(0x20d618+i*4) for i in range(17)]
    if states != STATES: raise ValueError('Changed loading state dispatch')
    entry_names = [c_string(code, word(0x299d8c+i*4)) for i in range(14)]
    resources = {}
    for filename, names in {
        'button_LZ.bin': ['WaitIcon'],
        'layout_LZ.bin': ['SMngCTRData_D_00'],
    }.items():
        for path, raw in unpack_archive(decompress((romfs/filename).read_bytes())).items():
            if not any(Path(path).name.startswith(name) for name in names): continue
            if path.endswith('.bclan'):
                clip = decode_animation(raw)
                resources[filename+'/'+path] = {'sha256': hashlib.sha256(raw).hexdigest(),
                    **{key: clip[key] for key in ('frames', 'loop', 'groups', 'tracks', 'unsupported')}}
            elif path.endswith('.bclyt'):
                layout = decode_layout(raw)
                resources[filename+'/'+path] = {'sha256': hashlib.sha256(raw).hexdigest(),
                    'groups': layout['groups'], 'unsupported': layout['unsupported']}
    return {'codeSha256': CODE_SHA256,
        'ranges': {name: {'start': hex(a), 'endExclusive': hex(b),
            'sha256': hashlib.sha256(code[a-BASE:b-BASE]).hexdigest()} for name,(a,b) in RANGES.items()},
        'sites': sites, 'stateDispatch': [hex(v) for v in states], 'entryNames': entry_names,
        'resources': resources,
        'sequence': ['constructor starts WaitIcon WIconIn and WIconLoop; BtnIn/TextIn at start',
            'state 1 waits on scene loading flag/global status; no-thread branch has counter > 10',
            'loading completion sets WIconIn direction 1 and calls play; calls Loop virtual slot 0x14, then state 2',
            'state 2 waits for WIconIn to stop, starts BtnIn and TextIn, then state 3',
            'state 3 waits for BtnIn to stop, then state 4 enables controls'],
        'limits': ['Normal SceneIn_00/01 selection, virtual-slot current-frame semantics and update ordering unresolved',
            'Storage/worker completion is not a browser duration or a source clip endpoint',
            'No native timing, interruption or paired-LCD comparison; no firmware execution',
            'Live UI remains the explicit settled accessible-empty-SD adaptation']}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'romfs', 'report'): parser.add_argument('--'+name, required=True, type=Path)
    args = parser.parse_args()
    if not all(p.is_absolute() for p in (args.code,args.romfs,args.report)):
        parser.error('Use absolute paths')
    result = inspect(args.code.read_bytes(), args.romfs)
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'ranges':len(RANGES),'clips':sum('tracks' in r for r in result['resources'].values()),'report':str(args.report)}))
if __name__ == '__main__': main()
