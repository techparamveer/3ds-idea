"""Trace the EUR Settings Language page (language_eu) as data.

Reads the original Settings RomFS and code image without executing either, then
compares the source composition with the published presentation pack. It
reports the region redirect, row order and CFG codes, list and slide-bar
constants, source members and label texts that the read-only page relies on.
"""
import argparse
import json
from pathlib import Path
import struct

from unpack_home_resources import decompress, unpack_darc
from firmware.native import decode_msbt
from audit_settings_data_lists import (CODE_BASE, CODE_SHA256, TABLE_SHA256, FOOTER_TABLE,
                                       c_string, digest, pc_relative, scene_record)

SCENES = ('basic_top4', 'language', 'language_eu', 'language_tw', 'start_language', 'start_lang_eu')
RANGES = {
    'region-redirect': (0x231748, 0x2317a0),
    'scene-factory-language': (0x216664, 0x21667c),
    'language-setup': (0x22c748, 0x22c7d0),
    'eu-constructor': (0x22c7d0, 0x22cb78),
    'list-constructor': (0x19f204, 0x19f56c),
    'list-refresh': (0x1a022c, 0x1a07b8),
    'slidebar-setup': (0x1f37c4, 0x1f38c0),
}
SITES = {
    'region-redirect': [(0x231748, 'scene replaced'), (0x231758, 'EUR source record'),
                        (0x231774, 'scene replaced'), (0x231788, 'EUR source record')],
    'scene-factory': [(0x216664, 'scene type')],
    'language-setup': [(0x22c76c, 'startup scene check')],
    'eu-constructor': [(0x22c974, 'slide-bar pane and child layout'), (0x22c978, 'list layout'),
                       *((0x22c9c4 + 0x20*i, f'row {i} label') for i in range(8)),
                       (0x22cad8, 'pitch: first mount'), (0x22caf0, 'pitch: second mount')],
}
WORDS = {
    0x22c75c: 'cmp r0, #1  region USA takes the fixed four-button path',
    0x22cac0: 'mov r0, #8  row count', 0x22cac4: 'mov r1, #4  visible rows', 0x22cac8: 'mov r2, #2  leading slots',
    0x19f238: 'mvn r1, #0  last top -1', 0x19f23c: 'str r8, [r4, #0x54]  top 0',
    0x19f244: 'stm r2, {r1, r8}  +0x58 = -1, decided +0x5c = 0',
}
CFG_TABLE = 0x22c8b0
THUMB_LITERALS = {'grooveInset': 0x1f381c, 'perHiddenRow': 0x1f3820, 'minimum': 0x1f384c}
MEMBERS = {'layout_LZ.bin': {'layout.json': ['blyt/Country_D_00.bclyt', 'anim/Country_D_00_SceneIn_00.bclan',
                                             'anim/Country_D_00_SceneIn_01.bclan']},
           'button_LZ.bin': {'button.json': ['blyt/T_SB.bclyt', 'blyt/R_SlideBar.bclyt', 'anim/T_SB_Decide.bclan']}}
LABELS = ['language', 'language_comm_u', 'base_2b_back', 'base_2b_decide', 'eu_english', 'eu_french', 'eu_german',
          'eu_spanish', 'eu_italian', 'eu_dutch', 'eu_portuguese', 'eu_russian']


def vldr_literal(word, address):
    """Literal address of VFP `vldr sN, [pc, #±imm]`, or None for any other instruction."""
    if word >> 28 == 0xf or word & 0x0f3f0f00 != 0x0d1f0a00:
        return None
    offset = (word & 0xff) * 4
    return ((address + 8) & ~3) + (offset if word & 0x00800000 else -offset)


def mov_immediate(word, register):
    """Value of `mov rN, #imm` (unrotated), or None."""
    if word & 0x0ffff000 != 0x03a00000 | register << 12 or (word >> 8) & 0xf:
        return None
    return word & 0xff


def bclyt_pane_size(data, name):
    """Size of a named CLYT pane: magic, size, 4 flag bytes, name[16], user[8], T, R, S, size."""
    target = name.encode().ljust(16, b'\0')
    for offset in range(0, len(data) - 0x4c, 4):
        if data[offset:offset + 4] in (b'pan1', b'pic1', b'txt1', b'wnd1', b'bnd1') and data[offset + 12:offset + 28] == target:
            return list(struct.unpack_from('<2f', data, offset + 0x44))
    raise ValueError('Missing source pane: ' + name)


def thumb_height(groove, count, visible, inset, per_row, minimum):
    """0x1f37c4: groove - inset - (count - visible) * per_row, raised to the minimum."""
    return max(groove - inset - (count - visible)*per_row, minimum)


def audit(romfs, code, published):
    if digest(code) != CODE_SHA256:
        raise ValueError('Unexpected Settings code image')
    word = lambda address: struct.unpack_from('<I', code, address - CODE_BASE)[0]
    single = lambda address: struct.unpack_from('<f', code, address - CODE_BASE)[0]
    table_raw = (romfs/'table_LZ.bin').read_bytes()
    if digest(table_raw) != TABLE_SHA256:
        raise ValueError('Unexpected Settings scene table')
    table = unpack_darc(decompress(table_raw))
    scenes = {name: scene_record(table[name + '.bin']) for name in SCENES}
    footers = [c_string(code, word(FOOTER_TABLE + 4*i)) if word(FOOTER_TABLE + 4*i) else '' for i in range(6)]
    sites = {}
    for group, items in SITES.items():
        sites[group] = []
        for address, role in items:
            target = pc_relative(word(address), address)
            if target is None:
                raise ValueError(f'{address:#x} is not a PC-relative operand')
            sites[group].append({'instruction': hex(address), 'target': hex(target), 'role': role,
                                 'string': c_string(code, target)})
    words = {hex(address): {'word': f'{word(address):08x}', 'meaning': meaning} for address, meaning in WORDS.items()}
    cfg_codes = []
    for row in range(8):
        target = word(CFG_TABLE + 4*row)
        value = mov_immediate(word(target), 3)
        if value is None:
            raise ValueError(f'CFG case {row} at {target:#x} is not mov r3, #imm')
        cfg_codes.append({'row': row, 'case': hex(target), 'cfgLanguage': value})
    literals = {}
    for name, address in THUMB_LITERALS.items():
        target = vldr_literal(word(address), address)
        if target is None:
            raise ValueError(f'{address:#x} is not a VFP literal load')
        literals[name] = {'instruction': hex(address), 'literal': hex(target), 'value': single(target)}
    ranges = {name: {'start': hex(start), 'endExclusive': hex(end),
                     'sha256': digest(code[start - CODE_BASE:end - CODE_BASE])} for name, (start, end) in RANGES.items()}
    source_members, published_members, archives = {}, {}, {}
    for archive, packs in MEMBERS.items():
        content = archives[archive] = unpack_darc(decompress((romfs/archive).read_bytes()))
        for pack_name, members in packs.items():
            pack = json.loads((published/pack_name).read_bytes())
            for member in members:
                key, bucket = Path(member).stem, 'layouts' if member.startswith('blyt/') else 'animations'
                source_members[f'{archive}/{member}'] = digest(content[member]) if member in content else None
                record = pack['resourceSources'].get(bucket, {}).get(key)
                published_members[f'{pack_name}/{key}'] = record is not None and record['sha256'] == source_members[f'{archive}/{member}']
    groove = bclyt_pane_size(archives['button_LZ.bin']['blyt/R_SlideBar.bclyt'], 'B_Groove_00')[1]
    thumb = thumb_height(groove, 8, 4, literals['grooveInset']['value'], literals['perHiddenRow']['value'],
                         literals['minimum']['value'])
    bank = decode_msbt(unpack_darc(decompress((romfs/'message_EU_LZ.bin').read_bytes()))['message_mset/EU_English/mset.msbt'])
    published_labels = json.loads((published/'message_EU.json').read_bytes())['messages']['mset']['labels']
    labels = {label: {'text': bank['messages'][bank['labels'][label]]['text'] if label in bank['labels'] else None,
                      'published': label in published_labels} for label in LABELS}
    missing = sorted([k for k, v in published_members.items() if not v] + [k for k, v in labels.items() if not v['published']])
    return {'codeSha256': CODE_SHA256, 'tableSha256': TABLE_SHA256, 'scenes': scenes,
            'footerTable': {'address': hex(FOOTER_TABLE), 'names': footers},
            'sites': sites, 'words': words, 'cfgLanguageByRow': cfg_codes,
            'thumb': {'literals': literals, 'grooveHeight': groove, 'count': 8, 'visible': 4, 'height': thumb},
            'ranges': ranges, 'sourceMembers': source_members, 'publishedMembers': published_members,
            'labels': labels, 'missingFromPublication': missing}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('romfs', 'code', 'published', 'report'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    for path in (args.romfs, args.code, args.published, args.report):
        if not path.is_absolute():
            raise SystemExit(f'Expected absolute path: {path}')
    report = audit(args.romfs, args.code.read_bytes(), args.published)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(f"{len(report['missingFromPublication'])} Language dependencies missing; thumb {report['thumb']['height']:g}")


if __name__ == '__main__':
    main()
