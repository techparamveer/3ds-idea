"""Publish the pinned Notifications unread-marker child layout and textures."""
import argparse
import hashlib
import json
from pathlib import Path

from build import Builder, CONVERTER_VERSION, encode
from unpack_home_resources import decompress, unpack_darc

TITLE = '000400300000a002'
ARCHIVE_HASH = '293255a901abe9b7e312aee4b0c00785c94db85192b150159b7d0ab8a3f98217'
MEMBERS = {
    'blyt/RcvLamp_00.bclyt',
    'anim/RcvLamp_00_ReceiveBlue.bclan',
    'anim/RcvLamp_00_ReceiveGreen.bclan',
    'anim/RcvLamp_00_ReceiveGreenBlue.bclan',
    'anim/RcvLamp_00_ReceiveOrange.bclan',
    'anim/RcvLamp_00_SceneIn.bclan',
    'anim/RcvLamp_00_SceneOut.bclan',
    'timg/RL_00.bclim', 'timg/RL_01.bclim',
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--romfs', required=True, type=Path,
                        help='absolute path to pinned decrypted Notifications romfs')
    parser.add_argument('--output', required=True, type=Path,
                        help='absolute path to public/os/firmware/10.7.0-32E')
    args = parser.parse_args()
    if not args.romfs.is_absolute() or not args.output.is_absolute():
        parser.error('Both paths must be absolute')
    archive = (args.romfs/'receivelamp_LZ.bin').read_bytes()
    if hashlib.sha256(archive).hexdigest() != ARCHIVE_HASH:
        raise ValueError('Pinned Notifications receivelamp archive hash mismatch')
    members = unpack_darc(decompress(archive))
    if set(members) != MEMBERS:
        raise ValueError('Unexpected Notifications receive-lamp archive members')
    manifest_path = args.output/'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if manifest['titles'][TITLE]['version'] != 4097:
        raise ValueError('Wrong Notifications title version')
    builder = Builder(args.output)
    identity = {'contentId': '00000012', 'contentIndex': 0, 'titleVersion': 4097}
    path, pack = builder.pack(members, 'receivelamp', TITLE, 'receivelamp_LZ.bin',
                              ARCHIVE_HASH, identity)
    if path != 'packs/notifications/contents/0000-00000012/receivelamp.json' or pack['unsupported']:
        raise ValueError('Receive-lamp pack is incomplete')
    for key, record in builder.records.items():
        record['conversion'] = {
            'name': 'ctr-native-web', 'version': CONVERTER_VERSION,
            'publisherSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        }
        previous = manifest['resources'].get(key)
        if previous and previous['sha256'] != record['sha256']:
            raise ValueError(f'Conflicting public resource {key}')
        if previous:
            previous['sources'] = [source for source in previous['sources']
                                   if source.get('titleId') != TITLE or source.get('path') != record['sources'][0]['path']]
            for source in record['sources']:
                if source not in previous['sources']: previous['sources'].append(source)
            if key == path or not previous.get('conversion'):
                previous['conversion'] = record['conversion']
        else: manifest['resources'][key] = record
    packs = manifest['titles'][TITLE]['packs']
    if path not in packs: packs.append(path)
    manifest_path.write_bytes(encode(manifest))


if __name__ == '__main__': main()
