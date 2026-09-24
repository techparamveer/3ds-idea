"""Trace Other Settings focus entry and return behavior as source data.

Reads the original EUR 10.7.0-32E Settings code/RomFS without executing it,
checks the delivered BasicTop and I_User resources, and pins the native and
browser comparison captures. The report separates the logical current control
from the Select clip frame shown after a cross-scene transition.
"""
import argparse
import json
from pathlib import Path

from unpack_home_resources import decompress, unpack_darc
from audit_settings_data_lists import CODE_BASE, CODE_SHA256, TABLE_SHA256, digest, scene_record


SCENES = ('basic_top1', 'basic_top2', 'basic_top3', 'basic_top4', 'user_info', 'date_time')
RANGES = {
    'selection-manager-init': (0x1982d8, 0x19831c, 'e1d529707c601bc975eb7574232787dd386b5f727087c0e93a732fac3028ccc4'),
    'scene-focus-setup': (0x215df4, 0x21605c, 'bc05d459f5e9863dd357a3d2ca6056789b661653cfd10090c75a4f13b279ca04'),
    'transition-resolver': (0x22ea84, 0x22ece0, '5688f2c8c6c839586f118209834a1413bccad0463f5d4b3e25339f6c64c5d590'),
    'basic-top-setup': (0x22ed4c, 0x22efd4, 'e1660261c42cfc1f76af1181b8e4be7726ffbf2e8484486811c6056414c88b46'),
    'focus-register': (0x1a0084, 0x1a0188, '3117afcb56c58a6285ea15c1496e85e512940f86120c761de02ea5ea3503b32f'),
    'basic-top-entry': (0x22f854, 0x22f9c8, '34b7f58920ffb7a91f751802ea79e154d21d95a51ae193808f8f0e12b71b0bb0'),
    'basic-top-dispatch': (0x22fbc8, 0x22fdb4, '2f8724fb9e9de20f19a8bd19602050c8ccaaf8282621afc985ae19ed240f4d16'),
}
# Exact ARM words. These checks intentionally avoid relying on a disassembler.
WORDS = {
    0x1982d8: ('e3a02000', 'selection manager initializes with zero'),
    0x1982e0: ('e580203c', 'store logical current index 0 at +0x3c'),
    0x215e48: ('ebfe0922', 'construct selection manager'),
    0x215e80: ('e28f1f77', 'BasicTop_D_00 layout-name operand'),
    0x215e90: ('e3a0700a', 'BasicTop_D_00 selects manager action 10'),
    0x215f80: ('e5857048', 'store selected manager action'),
    0x216038: ('e5950040', 'load selection manager'),
    0x21603c: ('e5951048', 'load BasicTop manager action'),
    0x216040: ('e3a02000', 'initial manager input target 0'),
    0x216044: ('ebfe07b2', 'apply initial manager action'),
    0x22f868: ('e5970004', 'load transition source scene'),
    0x22f86c: ('e3700001', 'source scene == -1'),
    0x22f870: ('15961000', 'otherwise load current target scene'),
    0x22f874: ('11500001', 'source scene == current target scene'),
    0x22f898: ('05960000', 'same/no-source path uses current scene for page resolution'),
    0x22f89c: ('ebfd9d99', 'resolve basic_top page index'),
    0x22f8a0: ('e0850100', 'select this + 0x10 + page * 4'),
    0x22f8a4: ('e3a01000', 'focus registration argument 0'),
    0x22f8a8: ('e5900010', 'load current-page focus control'),
    0x22f8ac: ('ebfdc1f4', 'register current-page focus control'),
    0x22f944: ('e5971004', 'load transition source for row widgets'),
    0x22f948: ('e3710001', 'source scene == -1'),
    0x22f94c: ('15962000', 'otherwise load current target scene'),
    0x22f950: ('11510002', 'source scene == current target scene'),
    0x22f958: ('03a01000', 'equal path temporary 0'),
    0x22f95c: ('13a01001', 'cross-scene path temporary 1'),
    0x22f960: ('e2211001', 'invert: equal -> 1, cross-scene -> 0'),
    0x22f964: ('e5922010', 'load row-widget virtual state callback'),
    0x22f968: ('e12fff32', 'call row-widget callback'),
    0x22fc64: ('e3550002', 'event kind 2 is page change'),
    0x22fc88: ('e1500007', 'compare current and target page'),
    0x22fc8c: ('c3a06007', 'one page direction dispatch code 7'),
    0x22fc90: ('d3a06006', 'other page direction dispatch code 6'),
    0x22fcb4: ('e7915107', 'load target basic_top scene by page'),
    0x22fcf0: ('e1a01002', 'event kind 1 forwards target row'),
    0x22fcf8: ('ebfffe1a', 'activate target row/detail'),
    0x22ecd8: ('e3e00000', 'transition resolver prepares -1'),
    0x22ecdc: ('e5880004', 'clear transition source after resolution'),
}
MEMBERS = {
    'layout.json': {
        'layout_LZ.bin': {
            'layouts': {'BasicTop_D_00': 'blyt/BasicTop_D_00.bclyt'},
            'animations': {'BasicTop_D_00_SpecialIn_00': 'anim/BasicTop_D_00_SpecialIn_00.bclan'},
        },
    },
    'button.json': {
        'button_LZ.bin': {
            'layouts': {'I_User': 'blyt/I_User.bclyt'},
            'animations': {'I_User_Select': 'anim/I_User_Select.bclan'},
        },
    },
}


def checked_words(code):
    result = {}
    for address, (expected, meaning) in WORDS.items():
        actual = f"{int.from_bytes(code[address - CODE_BASE:address - CODE_BASE + 4], 'little'):08x}"
        if actual != expected:
            raise ValueError(f'Unexpected word at {address:#x}: {actual} != {expected}')
        result[hex(address)] = {'bytes': actual, 'meaning': meaning}
    return result


def source_and_publication(romfs, published):
    archives, result = {}, {}
    for pack_name, archive_groups in MEMBERS.items():
        pack = json.loads((published / pack_name).read_bytes())
        for archive_name, groups in archive_groups.items():
            archive = archives.setdefault(
                archive_name, unpack_darc(decompress((romfs / archive_name).read_bytes())))
            for bucket, members in groups.items():
                for key, member in members.items():
                    source_hash = digest(archive[member]) if member in archive else None
                    provenance = pack.get('resourceSources', {}).get(bucket, {}).get(key)
                    result[f'{pack_name}/{key}'] = {
                        'source': f'{archive_name}/{member}',
                        'sourceSha256': source_hash,
                        'publishedSha256': provenance.get('sha256') if provenance else None,
                        'matches': provenance is not None and provenance.get('sha256') == source_hash,
                    }
    return result


def select_frames(published):
    clip = json.loads((published / 'button.json').read_bytes())['animations']['I_User_Select']
    tracks = {}
    for track in clip['tracks']:
        if track['target'] == 'Window_01' and track['property'] == 'visible':
            tracks['windowVisible'] = track['keys']
        if track['target'] == 'TextBox_00' and track['property'] == 'materialColor.1.0':
            tracks['textRed'] = track['keys']
    if clip['sourceFrameRange'] != [0, 1] or clip['frames'] != 2:
        raise ValueError('Unexpected I_User_Select frame range')
    if tracks.get('windowVisible') != [{'frame': 0.0, 'value': 1}, {'frame': 1.0, 'value': 0}]:
        raise ValueError('Unexpected I_User_Select Window_01 visibility track')
    return {'frames': clip['frames'], 'sourceFrameRange': clip['sourceFrameRange'], 'tracks': tracks}


def capture(path):
    return {'path': str(path), 'sha256': digest(path.read_bytes()), 'bytes': path.stat().st_size}


def audit(romfs, code, published, native_capture, browser_capture):
    if digest(code) != CODE_SHA256:
        raise ValueError('Unexpected Settings code image')
    table_raw = (romfs / 'table_LZ.bin').read_bytes()
    if digest(table_raw) != TABLE_SHA256:
        raise ValueError('Unexpected Settings scene table')
    table = unpack_darc(decompress(table_raw))
    scenes = {name: scene_record(table[name + '.bin']) for name in SCENES}
    ranges = {}
    for name, (start, end, expected) in RANGES.items():
        actual = digest(code[start - CODE_BASE:end - CODE_BASE])
        if actual != expected:
            raise ValueError(f'Unexpected {name} range: {actual} != {expected}')
        ranges[name] = {'start': hex(start), 'endExclusive': hex(end), 'sha256': actual}
    publication = source_and_publication(romfs, published)
    missing = sorted(name for name, item in publication.items() if not item['matches'])
    return {
        'codeSha256': CODE_SHA256,
        'tableSha256': TABLE_SHA256,
        'scenes': scenes,
        'words': checked_words(code),
        'ranges': ranges,
        'publication': publication,
        'missingFromPublication': missing,
        'selectClip': select_frames(published),
        'captures': {'native': capture(native_capture), 'browser': capture(browser_capture)},
        'derivedState': {
            'crossSceneRowCallbackArgument': 0,
            'sameSceneRowCallbackArgument': 1,
            'entryLogicalRow': 0,
            'firstDownTargetRow': 1,
            'pageChangeLogicalRow': 0,
            'detailBackLogicalRow': 0,
            'crossSceneVisualSelectFrame': 0,
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('romfs', 'code', 'published', 'native-capture', 'browser-capture', 'report'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    paths = (args.romfs, args.code, args.published, args.native_capture, args.browser_capture, args.report)
    for path in paths:
        if not path.is_absolute():
            raise SystemExit(f'Expected absolute path: {path}')
    report = audit(args.romfs, args.code.read_bytes(), args.published,
                   args.native_capture, args.browser_capture)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(f"{len(report['missingFromPublication'])} focus resources missing; "
          f"cross-scene callback {report['derivedState']['crossSceneRowCallbackArgument']}")


if __name__ == '__main__':
    main()
