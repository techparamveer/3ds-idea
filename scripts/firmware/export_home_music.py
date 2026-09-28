"""Export the exact guarded HOME music resources, never firmware executable code."""
from pathlib import Path
import argparse
import hashlib
import json
import struct
import numpy as np
from .home_audio_profile import isolated_renderer, validate_archive, validate_source, PROFILE

ALIASES = {'music': 'BGM_CTR_HOME', 'music-resume': 'BGM_CTR_HOME_NO_INTRO'}
COMMANDS = {0x80,0x81,0x88,0x89,0x8a,0xb0,0xb6,0xc0,0xc1,0xc4,0xc5,0xc6,0xc7,
            0xca,0xcb,0xcc,0xcd,0xd0,0xd1,0xd2,0xd3,0xd5,0xd7,0xd9,0xe0,0xe1,0xfd}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def reachable(blob, start):
    """Validate the bounded command grammar and all statically reachable targets."""
    from dualrip.engine.ctr.sequencer import skip_command
    seen, occupied, pending = {}, {}, [start]
    while pending:
        pos = pending.pop()
        while pos not in seen:
            if not 0 <= pos < len(blob):
                raise ValueError('Invalid sequence target')
            cmd = blob[pos]
            if cmd >= 128 and cmd not in COMMANDS:
                raise ValueError(f'Unsupported reachable music command {cmd:02x}')
            end = skip_command(blob, pos)
            if end > len(blob) or end <= pos:
                raise ValueError('Truncated music command')
            for byte in range(pos, end):
                if byte in occupied:
                    raise ValueError('Sequence target overlaps command operands')
                occupied[byte] = pos
            seen[pos] = cmd
            if cmd == 0x88:
                if not 0 < blob[pos + 1] < 16:
                    raise ValueError('Invalid opened track')
                pending.append(int.from_bytes(blob[pos + 2:pos + 5], 'big'))
            if cmd in (0x89, 0x8a):
                pending.append(int.from_bytes(blob[pos + 1:pos + 4], 'big'))
            if cmd in (0x89, 0xfd):
                break
            pos = end
    return sorted(seen)


def export(source, output, renderer, scratch, source_record):
    if output.exists():
        raise ValueError('Use a fresh private output directory')
    title = json.loads(source_record.read_text())
    validate_source(source, title)
    with isolated_renderer(renderer, scratch) as profile:
        from dualrip.formats.ctr.archive import CtrArchive
        from dualrip.formats.ctr.cseq import parse_cseq, VelRegion
        from dualrip.engine.ctr.home_audio_math import PAN_LUT
        from dualrip.engine.ctr.home_audio_voice import (
            ATTACK_LUT, PITCH_SEMITONE, PITCH_FRACTION, GAIN_LUT, SUSTAIN_LUT, SINE_LUT)
        archive = CtrArchive(source.read_bytes(), [], source.name)
        options, _ = validate_archive(archive, list(ALIASES.values()))
        files, sources, entries, banks, waves, table_desc = {}, {}, {}, {}, {}, {}
        def add(name, data, origin):
            files[name] = bytes(data)
            sources[name] = origin
            return name
        def tree(value, available):
            if isinstance(value, VelRegion):
                region = {key: getattr(value, key) for key in value.__slots__}
                wave_id = f'{value.war_slot}:{value.wav_index}'
                if available and wave_id not in waves:
                    w = archive.ctx.cwav(value.war_slot, value.wav_index)
                    if w.rate != 44100 or not w.loop or value.interp != 0:
                        raise ValueError('Unsupported music wave configuration')
                    pcm = np.asarray(w.samples, dtype='<i2').tobytes()
                    raw = archive.ctx._cwar_cache[value.war_slot][value.wav_index]
                    waves[wave_id] = {'file': add(f'wave-{value.war_slot}-{value.wav_index}.pcm', pcm,
                        {'waveArchive': value.war_slot, 'wave': value.wav_index,
                         'cwavSha256': sha(raw)}), 'rate': w.rate, 'loop': w.loop,
                        'loopStart': w.loop_start, 'loopEnd': w.loop_end, 'samples': len(w.samples)}
                return region
            if isinstance(value, (tuple, list)):
                return [tree(item, available) for item in value]
            return value
        for alias, name in ALIASES.items():
            sound = next(sound for sound in archive.sounds if sound.name == name)
            raw = archive.ctx.file_bytes(sound.file_id, 'seq')
            blob, _ = parse_cseq(raw)
            positions = reachable(blob, sound.start_offset)
            from dualrip.engine.ctr.cprims import readvl
            for pos in positions:
                if blob[pos] == 0xb6 and blob[pos + 1] != 0:
                    raise ValueError('Unsupported bank selection')
                if blob[pos] == 0x81:
                    program, _ = readvl(blob, pos + 1)
                    if program not in (5, 6, 11, 14):
                        raise ValueError('Unavailable music program')
                    for key in range(128):
                        for velocity in range(128):
                            if archive.ctx.bank(1).lookup(program, key, velocity) is None:
                                raise ValueError('Missing reachable bank region')
            entries[alias] = {'file': add(f'{alias}.cseq', blob,
                {'sound': name, 'fileId': sound.file_id, 'cseqSha256': sha(raw)}),
                'start': sound.start_offset, 'banks': sound.bank_ids, 'volume': sound.volume,
                'priority': sound.channel_prio, 'reachableCommands': len(positions), 'options': options[name]}
            for bank_id in sound.bank_ids:
                if bank_id == 0xffffff:
                    continue
                bank = archive.ctx.bank(bank_id)
                banks[str(bank_id)] = {'instruments': [tree(node, i in (5, 6, 11, 14))
                    for i, node in enumerate(bank.instruments)], 'cbnkSha256': sha(bank.data),
                    'availablePrograms': [5, 6, 11, 14], 'unavailablePrograms': [0, 1]}
        if set(banks) != {'1'} or set(waves) != {f'3:{i}' for i in range(5)}:
            raise ValueError('Unexpected music resource coverage')
        table_data = bytearray()
        for name, values, fmt in [('pan',PAN_LUT,'f'),('attack',ATTACK_LUT,'f'),
                ('pitchSemitone',PITCH_SEMITONE,'f'),('pitchFraction',PITCH_FRACTION,'f'),
                ('gain',GAIN_LUT,'f'),('sustain',SUSTAIN_LUT,'h'),('sine',SINE_LUT,'b')]:
            raw = struct.pack('<' + fmt * len(values), *values)
            table_desc[name] = {'offset':len(table_data),'count':len(values),'format':fmt,'sha256':sha(raw)}
            table_data.extend(raw)
        add('tables.bin', table_data, {'method':'exact v8 arithmetic table bytes', 'voiceSha256':profile['voiceSha256'],
                                      'mathSha256':profile['mathSha256']})
        manifest = {'schema':1, 'kind':'native-home-music', 'sampleRate':32728, 'frameSamples':160,
            'title':PROFILE['sourceRecord'], 'archive':{'path':'romfs/sound/menu.bcsar','sha256':sha(source.read_bytes())},
            'converter':{'name':'export_home_music','version':1,'sha256':sha(Path(__file__).read_bytes())},
            'profile':profile, 'entries':entries, 'banks':banks, 'waves':waves, 'tables':table_desc,
            'resources':{name:{'bytes':len(data),'sha256':sha(data),'source':sources[name]} for name,data in sorted(files.items())},
            'limits':['v8 model equivalence only','native allocation under voice pressure unverified',
                      'pinned Azahar interpolation model, not hardware DSP parity','stereo startup runtime assumptions']}
        output.mkdir(parents=True)
        for name, data in files.items():
            (output / name).write_bytes(data)
        (output / 'music.json').write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
        return manifest


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--renderer',type=Path,required=True);p.add_argument('--scratch',type=Path,required=True)
    p.add_argument('--source-record',type=Path,required=True)
    args=p.parse_args();export(args.source,args.output,args.renderer,args.scratch,args.source_record)
