"""Render allowlisted native HOME cues from the owner's decrypted sound archive.

DualRip interprets the original CSEQ bytecode, CBNK instruments and CWAV samples
offline. Only PCM cues and provenance enter the site, never firmware code. Pin
the renderer revision: changes to driver arithmetic can change rendered PCM.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys

DUALRIP_REVISION = 'c00e809ad4fcc44056a5b3c11d30f6a698b92be0'
CUES = {
    'music': 'BGM_CTR_HOME',
    'music-resume': 'BGM_CTR_HOME_NO_INTRO',
    'select': 'SE_CTR_HOME_ICON_SELECT',
    'open': 'SE_CTR_HOME_START',
    'back': 'SE_CTR_COMMON_CANCEL',
    'home': 'SE_CTR_HOME_HOMEBUTTON',
    'power': 'SE_CTR_HOME_POPUP_POWER',
    'touch': 'SE_CTR_HOME_ICON_TOUCH',
    'grab': 'SE_CTR_HOME_ICON_GRAB',
    'drop': 'SE_CTR_HOME_ICON_EXCHANGE',
    'folder-open': 'SE_CTR_HOME_OPEN_FOLDER',
    'folder-close': 'SE_CTR_HOME_CLOSE_FOLDER',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render(source, output, renderer, source_record, names, rate=32728):
    revision = subprocess.check_output(['git', '-C', str(renderer), 'rev-parse', 'HEAD'], text=True).strip()
    if revision != DUALRIP_REVISION:
        raise ValueError(f'DualRip must be at {DUALRIP_REVISION}, found {revision}')
    if subprocess.check_output(['git', '-C', str(renderer), 'status', '--porcelain', '--untracked-files=no'], text=True).strip():
        raise ValueError('Renderer source has unrecorded modifications')
    if output.exists():
        raise ValueError('Use a new output directory to avoid stale or mixed audio packs')
    title = json.loads(source_record.read_text())
    if title.get('titleId') != '0004003000009802':
        raise ValueError('Expected European HOME Menu source record')
    sys.path.insert(0, str(renderer.resolve()))
    from dualrip.formats.ctr import open_bcsar, cstm
    archive = open_bcsar(str(source))
    available = {sound.name: sound for sound in archive.sounds}
    if any(CUES[name] not in available for name in names):
        raise ValueError('Missing requested native cue')
    output.mkdir(parents=True)
    result = {
        'schema': 1, 'firmware': '10.7.0-32E', 'title': title,
        'source': 'romfs/sound/menu.bcsar', 'sourceSha256': sha(source),
        'converter': {'name': 'render_firmware_audio', 'version': 1, 'sha256': sha(Path(__file__))},
        'renderer': {'name': 'DualRip', 'url': 'https://github.com/TetraSsky/DualRip', 'revision': revision},
        'method': 'offline CSEQ interpretation with original CBNK instruments and CWAV samples',
        'verification': 'pending matched Azahar timing and waveform comparison',
        'cues': {},
    }
    for alias in names:
        sound = available[CUES[alias]]
        archive.unapplied.clear()
        native_rate, channels, loop = archive.render(sound, rate)
        samples = len(channels[0])
        if not samples or any(len(channel) != samples for channel in channels):
            raise ValueError(f'Invalid rendered channels for {sound.name}')
        # Export exactly one intro/loop, retaining the driver's sample boundaries.
        if loop:
            if not 0 <= loop[0] < loop[1] <= samples:
                raise ValueError(f'Invalid loop in {sound.name}: {loop}')
            channels = [channel[:loop[1]] for channel in channels]
            samples = loop[1]
        path = output / f'{alias}.wav'
        cstm.write_wav(str(path), channels, native_rate, loop)
        banks = []
        for bank_id in sound.bank_ids:
            banks.append({'id': bank_id, 'waveArchives': archive.bank_wave_archives(bank_id)})
        result['cues'][alias] = {
            'name': sound.name, 'index': sound.index, 'kind': sound.kind,
            'url': path.name, 'sha256': sha(path), 'size': path.stat().st_size,
            'sampleRate': native_rate, 'channels': len(channels), 'samples': samples,
            'loopStart': loop[0] if loop else None, 'loopEnd': loop[1] if loop else None,
            'sourceVolume': sound.volume, 'banks': banks,
            'unappliedCommands': dict(archive.unapplied),
        }
        print(f'{alias}: {samples / native_rate:.3f}s, loop={loop}, unapplied={archive.unapplied}', flush=True)
    (output / 'audio.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--renderer', type=Path, required=True)
    parser.add_argument('--source-record', type=Path, required=True)
    parser.add_argument('--only', nargs='+', choices=list(CUES), default=list(CUES))
    parser.add_argument('--rate', type=int, default=32728, choices=[32728, 32000, 44100, 48000])
    args = parser.parse_args()
    render(args.source, args.output, args.renderer, args.source_record, args.only, args.rate)
