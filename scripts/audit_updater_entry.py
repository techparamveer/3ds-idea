"""Audit the read-only System Update question against its original resources.

Reads firmware as data. No firmware, service call or update is executed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from unpack_home_resources import decompress, unpack_darc
from firmware.native import decode_layout, decode_animation, decode_msbt

BASE = 0x100000
CODE_HASH = '1c5427729c7b6d9b0449fe8b74e9bf1419e7437579e4a47fceb5807295267a14'
MEMBERS = {
    'base': {'layouts': ['Bg_U_00', 'Bg_D_00', 'Base_D_01']},
    'up': {'layouts': ['CommonBG_U_00', 'TextBG_U_00', 'IconUpdate'],
           'animations': ['CommonBG_U_00_SceneIn_01', 'TextBG_U_00_TextFadeIn']},
    'layout': {'layouts': ['MessageOnly_D_00'],
               'animations': ['MessageOnly_D_00_SceneIn_00']},
}
LABELS = {'update_title': 'System Update', 'update_comm_u': 'Update your Nintendo 3DS system.',
          'update_comm': 'Connect to the internet\nand update the system?',
          'base_2b_cancel': 'Cancel', 'base_2b_ok': 'OK'}
RANGES = {'update-scene-init': (0x1792d4, 0x17934c),
          'footer-selection-and-labels': (0x183c2c, 0x183dcc),
          'background-constructor': (0x184364, 0x1843f4),
          'background-record-state': (0x184218, 0x184248),
          'background-transition': (0x18390c, 0x1839b0),
          'title-state-clip': (0x1845d0, 0x184678)}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def audit(romfs, code, published):
    if sha(code) != CODE_HASH:
        raise ValueError('Unexpected System Updater code image')
    word = lambda a: struct.unpack_from('<I', code, a-BASE)[0]
    def string(a):
        o = a-BASE
        return code[o:code.index(b'\0', o)].decode('ascii')
    table_raw = (romfs/'table_LZ.bin').read_bytes()
    table = unpack_darc(decompress(table_raw))
    record = table['update.bin']
    assert record[0] == 2 and record[0x23] == 1
    assert record[0x24:].startswith(b'update_comm\n\nbase_2b_cancel\nbase_2b_ok\n')
    assert b'MessageOnly_D_00Update\nCommonBG_U_00\nTextBG_U_00\nIconUpdate\nupdate_title\nupdate_comm_u' in record
    footer = string(word(0x2603e0 + 4*record[0]))
    assert footer == 'Base_D_01'
    assert string(word(0x2615b8)) == 'SceneIn_%2.2d.bclan'
    assert word(0x1845fc) == 0xe5d62023  # read record byte +0x23
    assert word(0x184368) == 0xe3a06000 and word(0x184384) == 0xe5806180
    resources = {}
    for name, buckets in MEMBERS.items():
        archive_name = name + '_LZ.bin'
        archive = unpack_darc(decompress((romfs/archive_name).read_bytes()))
        pack = json.loads((published/(name+'.json')).read_bytes())
        for bucket, names in buckets.items():
            for item in names:
                member = ('blyt/'+item+'.bclyt') if bucket == 'layouts' else ('anim/'+item+'.bclan')
                decoded = (decode_layout if bucket == 'layouts' else decode_animation)(archive[member])
                assert decoded == pack[bucket][item], item
                source = pack['resourceSources'][bucket][item]
                assert source['sha256'] == sha(archive[member]), item
                resources[name+'/'+item] = source
    archive = unpack_darc(decompress((romfs/'message_EU_LZ.bin').read_bytes()))
    source = decode_msbt(archive['message_mset/EU_English/mset.msbt'])
    delivered = json.loads((published/'message_EU.json').read_bytes())['messages']['mset']
    for label, text in LABELS.items():
        assert source['messages'][source['labels'][label]]['text'] == text, label
        assert delivered['messages'][delivered['labels'][label]]['text'] == text, label
    return {'codeSha256': sha(code), 'tableSha256': sha(table_raw),
            'record': {'sha256': sha(record), 'header': record[:0x24].hex(),
                       'footer': footer, 'titleState': record[0x23],
                       'fields': record[0x24:].rstrip(b'\0').decode('ascii').split('\n')},
            'ranges': {n: {'start': hex(a), 'endExclusive': hex(b), 'sha256': sha(code[a-BASE:b-BASE])}
                       for n, (a, b) in RANGES.items()},
            'sourceMatchesDelivery': resources, 'labels': LABELS,
            'limits': ['Read-only update scene; OK is inert and Cancel returns to its portfolio caller.',
                       'Native initial scene choice, APT argument routing and transition timing are not established.',
                       'No network/update operation, browser run or native LCD comparison.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['romfs', 'code', 'published', 'report']:
        parser.add_argument('--'+name, required=True, type=Path)
    args = parser.parse_args()
    if any(not p.is_absolute() for p in vars(args).values()):
        parser.error('All paths must be absolute')
    report = audit(args.romfs, args.code.read_bytes(), args.published)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2)+'\n')
    print('Updater question: source record, code, resources and labels verified.')
