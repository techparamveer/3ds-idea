"""Read-only provenance audit for Settings' SD Open Blocks field.

The value is supplied by filesystem IPC, not by RomFS. This audit does not
execute firmware, query host storage, or manufacture a portfolio block count.
"""
import argparse
import json
from pathlib import Path
import struct

from audit_settings_data_lists import CODE_BASE, CODE_SHA256, digest
from firmware.native import decode_animation, decode_layout
from unpack_home_resources import decompress, unpack_darc

WORDS = {
    0x19aa88: 0xe3520001,  # application media 1 (SD)
    0x19aa94: 0xe3a02002,  # filesystem system-media 2
    0x19aa98: 0xeb0059f5,  # call resource-byte wrapper 0x1b1274
    0x159aa4: 0xe59f1038,  # load IPC header
    0x159ab8: 0xef000032,  # SendSyncRequest
    0x159ae4: 0x08490040,  # GetArchiveResource
    0x1b12b8: 0xe59d0014,  # returned freeClusters
    0x1b12bc: 0xe59d100c,  # returned clusterSize
    0x1b12c0: 0xe0801190,  # unsigned 32x32 -> 64-bit byte count
    0x1b12c4: 0xe5850004, 0x1b12c8: 0xe5851000,
    0x19b1d0: 0xebfffe29,  # call media-byte query 0x19aa7c
    0x19b200: 0xe1cd00d0,  # load returned free bytes
    0x19b210: 0xe3a02802,  # divisor 0x20000 bytes per block
    0x19b214: 0xeb007fed,  # signed 64-bit division helper
    0x19b218: 0xe59f1040, 0x19b21c: 0xe7810104,
    0x19b260: 0x00299ca8,  # block array base; media 1 => 0x299cac
    0x2185a4: 0xe5952004,  # read SD entry
    0x2185b4: 0xebfe06bf,  # format via 0x19a0b8
    0x2185cc: 0xebfebfe5,  # assign TextBox_05
    0x2185ec: 0x00299ca8, 0x2185f0: 0x000f423f,  # limit 999999
    0x19a0c0: 0xe1520003, 0x19a0c8: 0xc1a02003,  # signed upper clamp
}
RANGES = {
    'ipc': (0x159a98, 0x159ae8),
    'byte-query': (0x1b1274, 0x1b12f0),
    'media-map': (0x19aa7c, 0x19aac8),
    'block-update': (0x19b19c, 0x19b264),
    'number-format': (0x19a0b8, 0x19a1d0),
    'upper-update': (0x218474, 0x2185f8),
}


def flatten(panes):
    for pane in panes:
        yield pane
        yield from flatten(pane.get('children', []))


def audit(code, up_archive, published):
    if digest(code) != CODE_SHA256:
        raise ValueError('Unexpected Settings code image')
    for address, expected in WORDS.items():
        if struct.unpack_from('<I', code, address - CODE_BASE)[0] != expected:
            raise ValueError(f'Instruction mismatch at {address:#x}')
    members = unpack_darc(decompress(up_archive))
    layout = decode_layout(members['blyt/SMng_U_01.bclyt'])
    clip = decode_animation(members['anim/SMng_U_01_NonSD.bclan'])
    panes = {p['name']: p for p in flatten(layout['roots'])}
    window = panes['SDWindow']['window']
    indexes = [window['content']['material'], *[f['material'] for f in window['frames']]]
    materials = [layout['materials'][i] for i in indexes]
    delivered = published['layouts']['SMng_U_01']
    if layout != delivered:
        raise ValueError('Published SMng_U_01 differs from decoded source')
    relevant_names = {'SDWindow', 'TextBox_05', *[m['name'] for m in materials]}
    return {
        'codeSha256': CODE_SHA256,
        'ranges': {name: {'start': hex(a), 'endExclusive': hex(b),
                         'sha256': digest(code[a-CODE_BASE:b-CODE_BASE])}
                   for name, (a, b) in RANGES.items()},
        'checkedWords': {hex(a): f'{w:08x}' for a, w in WORDS.items()},
        'valueOrigin': {'ipcHeader': '0x08490040', 'systemMedia': 2,
                        'formula': 'floor(clusterSize * freeClusters / 131072)',
                        'storage': '0x299cac', 'displayUpperLimit': 999999,
                        'layoutPlaceholder': panes['TextBox_05']['text']['value'],
                        'portfolioValue': None},
        'sourceMemberHashes': {name: digest(members[name]) for name in
                              ['blyt/SMng_U_01.bclyt', 'anim/SMng_U_01_NonSD.bclan']},
        'window': window, 'windowMaterials': materials,
        'relevantNonSDTracks': [t for t in clip['tracks'] if t['target'] in relevant_names],
        'publishedLayoutMatchesSource': True,
        'limits': ['No supplied SD allocation state; keep the runtime value blank.',
                   'Source material registers are verified; native final pixels are not.',
                   'No browser, emulator, filesystem IPC or firmware execution performed.'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'up-archive', 'published-up', 'report'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    if any(not p.is_absolute() for p in vars(args).values()):
        parser.error('All paths must be absolute')
    report = audit(args.code.read_bytes(), args.up_archive.read_bytes(),
                   json.loads(args.published_up.read_bytes()))
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print('Verified SD value provenance and source material; no portfolio block count supplied.')


if __name__ == '__main__':
    main()
