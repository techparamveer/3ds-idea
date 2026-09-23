"""Build a private lower nickname component pack from original resources."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from firmware.native import decode_layout, decode_animation, decode_msbt, decode_mstl
from firmware.texture import decode_bclim, png
from unpack_home_resources import decompress

LAYOUTS = ['BG', 'Btm2Btn', 'TextArea_02', 'KeytopModeSelect', 'Keytop_qwerty',
           'LncArw_00', 'WaitIcon', 'DecorCursor', 'DecorArea_select',
           'DecorArea_cellphone', 'DecorArea_roman', 'DecorTrans']
ANIMATIONS = ['Btm3Btn_i0', 'KeytopModeSelect_n0s1', 'LncArw_00_Appear',
              'DecorCursor_blink', 'Keytop_qwerty_n0s1', 'Keytop_qwerty_s1t0', 'Keytop_qwerty_i0']


def prepare(reference, output):
    output.mkdir(parents=True, exist_ok=True)
    (output / 'textures').mkdir(exist_ok=True)
    hashes = {}

    def read(path):
        data = path.read_bytes()
        hashes[str(path.relative_to(reference))] = hashlib.sha256(data).hexdigest()
        return data

    def member(name, kind, extension):
        archive = 'qwerty' if name.startswith('Keytop_qwerty') else 'common'
        return reference / f'members/swkbd_{archive}_LZ.bin/{kind}/{name}.{extension}'

    pack = {'schema': 1, 'name': 'nickname-lower', 'titleId': '000400300000d002',
            'layouts': {name: decode_layout(read(member(name, 'blyt', 'bclyt'))) for name in LAYOUTS},
            'animations': {name: decode_animation(read(member(name, 'anim', 'bclan'))) for name in ANIMATIONS},
            'textures': {}, 'messages': {}, 'styles': {}}
    needed = {name for resource in [*pack['layouts'].values(), *pack['animations'].values()] for name in resource['textures']}
    for name in sorted(needed):
        paths = [reference / f'members/swkbd_{archive}_LZ.bin/timg/{name}' for archive in ['common', 'qwerty']]
        sources = [read(path) for path in paths if path.exists()]
        assert sources and all(data == sources[0] for data in sources), name
        info, rgba = decode_bclim(sources[0])
        image = png(info['width'], info['height'], rgba)
        url = 'textures/' + hashlib.sha256(image).hexdigest() + '.png'
        (output / url).write_bytes(image)
        pack['textures'][name] = {**info, 'url': url}
    message_root = reference / 'extracted/romfs/message/EU_English'
    pack['messages']['english'] = {**decode_msbt(decompress(read(message_root / 'swkbd_msbt_LZ.bin'))), 'styleTable': 'english'}
    pack['styles']['english'] = decode_mstl(decompress(read(message_root / 'RI_mstl_LZ.bin')))
    config = read(reference / 'settings-nickname/empty-normalized-config.bin')

    def caller_string(offset):
        data = config[offset:offset + 34]
        return data.decode('utf-16le').split('\0', 1)[0]

    caller = {'cancel': caller_string(0x26), 'confirm': caller_string(0x6a)}
    assert caller == {'cancel': 'Cancel', 'confirm': 'OK'}
    (output / 'pack.json').write_text(json.dumps(pack, separators=(',', ':')) + '\n')
    (output / 'caller.json').write_text(json.dumps(caller, indent=2) + '\n')
    (output / 'provenance.json').write_text(json.dumps({'sourceHashes': hashes, 'textures': len(needed)}, indent=2) + '\n')
    return {'layouts': len(LAYOUTS), 'animations': len(ANIMATIONS), 'textures': len(needed)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference-root', type=Path, required=True)
    parser.add_argument('--artifact-dir', type=Path, required=True)
    args = parser.parse_args()
    assert args.reference_root.is_absolute() and args.artifact_dir.is_absolute()
    print(json.dumps(prepare(args.reference_root, args.artifact_dir)))
