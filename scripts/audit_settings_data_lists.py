"""Trace Settings Data Management Software/Extra Data empty scenes as data.

Reads the original Settings RomFS and code image without executing either, then
compares the source composition with the published presentation pack. Missing
publication is reported, separated into dependencies of the presented
accessible-empty-SD state and labels used only by the other SD states.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from unpack_home_resources import decompress, unpack_darc
from firmware.native import decode_msbt

CODE_BASE = 0x100000
CODE_SHA256 = '1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5'
TABLE_SHA256 = '1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794'
SCENES = ('datamng_ctr_top', 'datamng_ctr_soft', 'datamng_ctr_data')
FOOTER_TABLE = 0x2987bc
PAGE_LABEL_TABLE = 0x299c54
RANGES = {
    'empty-state': (0x19793c, 0x197c1c),
    'kind-media': (0x199808, 0x199da0),
    'lower-constructor': (0x20cfa8, 0x20d5fc),
    'lower-load-state': (0x20d5fc, 0x20da50),
    'upper-init': (0x217e98, 0x218474),
    'upper-sd-update': (0x218474, 0x2185dc),
    'clip-frame': (0x1c70d0, 0x1c7140),
    'clip-range': (0x1bce84, 0x1bceac),
}
# PC-relative operand sites: (instruction, role). Roles name the setter argument.
SITES = {
    'empty-state': [
        (0x197978, 'pane: visible = list empty'), (0x197998, 'pane: visible = list present'),
        (0x1979b4, 'pane: visible = list present'), (0x1979d0, 'pane: visible = list present'),
        (0x1979ec, 'pane: visible = list present'),
        (0x197ad4, 'pane'), (0x197ad8, 'label: default kind'),
        (0x197af4, 'label: SD state 1'), (0x197b10, 'label: SD state 3'),
        (0x197b2c, 'label: SD state 4'), (0x197b48, 'label: kind 1'), (0x197b64, 'label: kind 3'),
    ],
    'lower-constructor': [
        (0x20cfe0, 'pane: page label from kind table'), (0x20d0d0, 'pane'),
        (0x20d0d8, 'label: kind != 5'), (0x20d198, 'group'), (0x20d19c, 'clip'),
        (0x20d184, 'group'), (0x20d188, 'clip'),
    ],
    'upper-init': [
        (0x217f2c, 'group'), (0x217f30, 'clip'), (0x217f3c, 'scene'), (0x217f5c, 'pane'),
        (0x217f60, 'label: datamng_ctr_soft'), (0x217f6c, 'scene'), (0x217f88, 'label: datamng_ctr_data'),
        (0x2183f8, 'pane'), (0x2183fc, 'label'), (0x218410, 'pane'), (0x218414, 'label'),
        (0x218420, 'pane: visible'),
    ],
}
# Exact words establishing list kind (+0x48) and media (+0x50).
WORDS = {0x199868: 'mov sb, #0', 0x19986c: 'mov sl, #1', 0x19987c: 'str sb, [r5, #0x48]  datamng_ctr_soft',
         0x199938: 'str sl, [r5, #0x48]  datamng_ctr_data', 0x199d48: 'str sl, [r5, #0x50]  non-DSi media'}
LAYOUTS = {'layout_LZ.bin': ['blyt/SMngCTRData_D_00.bclyt', 'anim/SMngCTRData_D_00_SceneIn_00.bclan',
                             'anim/SMngCTRData_D_00_SceneIn_01.bclan', 'anim/SMngCTRData_D_00_TextIn.bclan',
                             'anim/SMngCTRData_D_00_BtnIn.bclan'],
           'up_LZ.bin': ['blyt/SMng_U_01.bclyt', 'anim/SMng_U_01_NonSD.bclan']}
LABELS = ['dat_sof_title_u', 'dat_opt_title_u', 'dat_3ds_comm1_u', 'dat_3ds_comm2_u', 'dat_3ds_comm',
          'dat_soft_page', 'dat_opt_page', 'dat_no_software', 'dat_no_option', 'dat_no_sd', 'dat_ng_sd',
          'dat_writeprotect', 'dat_sd_u', 'dat_block_u', 'dat_no_sd_u', 'dat_ng_sd_u', 'dat_protect_u',
          'base_2b_back']
# SD states 1, 3 and 4. The portfolio presents state 2 (accessible, empty SD).
ALTERNATIVE_STATE_LABELS = {'dat_no_sd', 'dat_ng_sd', 'dat_writeprotect', 'dat_no_sd_u', 'dat_ng_sd_u', 'dat_protect_u'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def scene_record(raw):
    """Header bytes are copied verbatim; +0 is footer kind and +0x23 background state."""
    return {'sha256': digest(raw), 'header': raw[:0x24].hex(), 'footer': raw[0], 'state': raw[0x23],
            'strings': raw[0x24:].rstrip(b'\0').decode('latin1').split('\n')}


def pc_relative(word, address):
    """Target of ARM `add/sub Rd, pc, #imm`, or None for any other instruction."""
    if word >> 28 == 0xf or word & 0x0fef0000 not in (0x028f0000, 0x024f0000):
        return None
    rotate, imm8 = (word >> 8) & 0xf, word & 0xff
    imm = ((imm8 >> 2 * rotate) | (imm8 << (32 - 2 * rotate))) & 0xffffffff if rotate else imm8
    return address + 8 + (imm if word & 0x00800000 else -imm)


def classify_missing(missing):
    """Split unpublished dependencies by whether the presented SD state needs them."""
    return {'missingForSelectedState': sorted(set(missing) - ALTERNATIVE_STATE_LABELS),
            'unpublishedAlternativeStates': sorted(set(missing) & ALTERNATIVE_STATE_LABELS)}


def c_string(code, address):
    start = address - CODE_BASE
    return code[start:code.index(b'\0', start)].decode('latin1')


def audit(romfs, code, published):
    if digest(code) != CODE_SHA256:
        raise ValueError('Unexpected Settings code image')
    word = lambda address: struct.unpack_from('<I', code, address - CODE_BASE)[0]
    table_raw = (romfs/'table_LZ.bin').read_bytes()
    if digest(table_raw) != TABLE_SHA256:
        raise ValueError('Unexpected Settings scene table')
    table = unpack_darc(decompress(table_raw))
    scenes = {name: scene_record(table[name + '.bin']) for name in SCENES}
    footers = [c_string(code, word(FOOTER_TABLE + 4*i)) if word(FOOTER_TABLE + 4*i) else '' for i in range(6)]
    pages = [c_string(code, word(PAGE_LABEL_TABLE + 4*i)) for i in range(4)]
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
    ranges = {name: {'start': hex(start), 'endExclusive': hex(end),
                     'sha256': digest(code[start - CODE_BASE:end - CODE_BASE])} for name, (start, end) in RANGES.items()}
    source_members, published_pack = {}, {}
    for archive, members in LAYOUTS.items():
        content = unpack_darc(decompress((romfs/archive).read_bytes()))
        source_members.update({f'{archive}/{name}': digest(content[name]) if name in content else None for name in members})
    for pack_name, members in (('layout.json', LAYOUTS['layout_LZ.bin']), ('up.json', LAYOUTS['up_LZ.bin'])):
        pack = json.loads((published/pack_name).read_bytes())
        for member in members:
            key = Path(member).stem
            bucket = 'layouts' if member.startswith('blyt/') else 'animations'
            published_pack[f'{pack_name}/{key}'] = key in pack[bucket]
    bank = decode_msbt(unpack_darc(decompress((romfs/'message_EU_LZ.bin').read_bytes()))['message_mset/EU_English/mset.msbt'])
    published_labels = json.loads((published/'message_EU.json').read_bytes())['messages']['mset']['labels']
    labels = {label: {'text': bank['messages'][bank['labels'][label]]['text'] if label in bank['labels'] else None,
                      'published': label in published_labels} for label in LABELS}
    missing = sorted([k for k, v in published_pack.items() if not v] + [k for k, v in labels.items() if not v['published']])
    return {'codeSha256': CODE_SHA256, 'tableSha256': TABLE_SHA256, 'scenes': scenes,
            'footerTable': {'address': hex(FOOTER_TABLE), 'names': footers},
            'pageLabelTable': {'address': hex(PAGE_LABEL_TABLE), 'labels': pages},
            'sites': sites, 'words': words, 'ranges': ranges, 'sourceMembers': source_members,
            'publishedPack': published_pack, 'labels': labels, 'missingFromPublication': missing,
            **classify_missing(missing)}


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
    print(f"{len(report['missingForSelectedState'])} accessible-empty-SD dependencies missing; "
          f"{len(report['unpublishedAlternativeStates'])} alternative SD-state labels unpublished")


if __name__ == '__main__':
    main()
