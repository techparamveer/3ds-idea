"""Render allowlisted native HOME cues from the owner's decrypted sound archive.

DualRip interprets the original CSEQ bytecode, CBNK instruments and CWAV samples
offline. Only PCM cues and provenance enter the site, never firmware code. Pin
the renderer revision: changes to driver arithmetic can change rendered PCM.
The exact EUR HOME profile patches a disposable source copy. This is a
diagnostic candidate with explicit runtime assumptions, not a fidelity claim.
"""
from pathlib import Path
import argparse
import hashlib
import json
from firmware.home_audio_profile import isolated_renderer, validate_archive, validate_source

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


def render(source, output, renderer, source_record, names, rate=32728, scratch=None):
    if output.exists():
        raise ValueError('Use a new output directory to avoid stale or mixed audio packs')
    if not names or len(set(names)) != len(names) or any(name not in CUES for name in names):
        raise ValueError('Expected unique allowlisted cue aliases')
    if rate not in (32728, 32000, 44100, 48000):
        raise ValueError('Unsupported sample rate')
    title = json.loads(source_record.read_text())
    validate_source(source, title)
    with isolated_renderer(renderer, scratch) as profile:
        from dualrip.formats.ctr.archive import CtrArchive
        from dualrip.formats.ctr import cstm, cseq
        from dualrip.engine.ctr.render import render_entry
        # Exact embedded archive only; never load unverified neighboring extData.
        archive = CtrArchive(source.read_bytes(), [], source.name)
        metadata, waves = validate_archive(archive, [CUES[name] for name in names])
        available = {sound.name: sound for sound in archive.sounds}
        output.mkdir(parents=True)
        result = {
            'schema': 1, 'firmware': '10.7.0-32E', 'title': title,
            'source': 'romfs/sound/menu.bcsar', 'sourceSha256': sha(source),
            'converter': {'name': 'render_firmware_audio', 'version': 3, 'sha256': sha(Path(__file__))},
            'renderer': {'name': 'DualRip', 'url': 'https://github.com/TetraSsky/DualRip', 'revision': DUALRIP_REVISION},
            'profile': profile, 'validatedMonoBankWaves': waves,
            'method': 'offline CSEQ interpretation with original CBNK/CWAV and a versioned HOME-only stereo startup patch',
            'verification': 'diagnostic candidate; native runtime gain, timing and PCM equivalence unresolved',
            'cues': {},
        }
        for alias in names:
            sound = available[CUES[alias]]
            blob, _ = cseq.parse_cseq(archive.ctx.file_bytes(sound.file_id, 'seq'))
            handled = {}
            channels, loop, unapplied = render_entry(
                blob, sound.start_offset, archive.ctx.make_lookup(sound.bank_ids), rate,
                sound.channel_prio or 64, base_vol=sound.volume, handled=handled)
            native_rate = rate
            samples = len(channels[0])
            if not samples or any(len(channel) != samples for channel in channels):
                raise ValueError(f'Invalid rendered channels for {sound.name}')
            if loop:
                if not 0 <= loop[0] < loop[1] <= samples:
                    raise ValueError(f'Invalid loop in {sound.name}: {loop}')
                channels = [channel[:loop[1]] for channel in channels]
                samples = loop[1]
            path = output / f'{alias}.wav'
            cstm.write_wav(str(path), channels, native_rate, loop)
            banks = [{'id': bank_id, 'waveArchives': archive.bank_wave_archives(bank_id)}
                     for bank_id in sound.bank_ids]
            result['cues'][alias] = {
                'name': sound.name, 'index': sound.index, 'kind': sound.kind,
                'url': path.name, 'sha256': sha(path), 'size': path.stat().st_size,
                'sampleRate': native_rate, 'channels': len(channels), 'samples': samples,
                'loopStart': loop[0] if loop else None, 'loopEnd': loop[1] if loop else None,
                'sourceVolume': sound.volume, 'banks': banks,
                'sourceOptions': metadata[sound.name],
                'handledProfileCommands': handled, 'unappliedCommands': unapplied,
            }
            print(f'{alias}: {samples / native_rate:.3f}s, loop={loop}, handled={handled}, unapplied={unapplied}', flush=True)
        (output / 'audio.json').write_text(json.dumps(result, indent=2) + '\n')
        return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--renderer', type=Path, required=True)
    parser.add_argument('--scratch', type=Path, required=True, help='SSD directory for disposable renderer sources')
    parser.add_argument('--source-record', type=Path, required=True)
    parser.add_argument('--only', nargs='+', choices=list(CUES), default=list(CUES))
    parser.add_argument('--rate', type=int, default=32728, choices=[32728, 32000, 44100, 48000])
    args = parser.parse_args()
    render(args.source, args.output, args.renderer, args.source_record, args.only, args.rate, args.scratch)
