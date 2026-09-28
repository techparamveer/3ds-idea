"""Offline PCM export for the supplied keyboard's mono PCM16/IMA BCWAV resources.

This decodes source samples once. It does not synthesize SSEQ, resample, apply
cue parameters, or establish native playback timing/gain/loop policy.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import wave

from unpack_home_resources import prepare

TITLE = '000400300000d002'
VERSION = 4096
ARCHIVE = 'swkbd_bcwav_LZ.bin'
ARCHIVE_SHA256 = '2172d8e08d58840b6e1450a6e5a3ee4e8159b4f2f908267ff3d92ecb3dc680a4'
CODE_SHA256 = 'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0'
STEP = (7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31,
        34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143,
        157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544,
        598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707,
        1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871,
        5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
        15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767)
INDEX = (-1, -1, -1, -1, 2, 4, 6, 8)


def sha(data): return hashlib.sha256(data).hexdigest()
def json_bytes(value): return (json.dumps(value, sort_keys=True, indent=2, allow_nan=False)+'\n').encode()


def decode_bcwav(raw):
    """Strict observed CWAV profile. Return metadata and interleaved s16le PCM."""
    def require(condition, message):
        if not condition: raise ValueError(message)

    def read(fmt, at, lo=0, hi=None):
        end = len(raw) if hi is None else hi
        require(lo <= at and at+struct.calcsize(fmt) <= end, 'BCWAV field outside section')
        return struct.unpack_from(fmt, raw, at)

    require(64 <= len(raw) <= 64*1024*1024, 'Invalid BCWAV size')
    magic, bom, header, version, size, count, reserved = read('<4sHHIIHH', 0)
    require((magic, bom, header, version, size, count, reserved) ==
            (b'CWAV', 0xfeff, 64, 0x02010000, len(raw), 2, 0), 'Unsupported BCWAV header')
    sections = []
    for at, kind, tag in [(20, 0x7000, b'INFO'), (32, 0x7001, b'DATA')]:
        mark, pad, offset, length = read('<HHII', at)
        require(mark == kind and pad == 0 and offset >= header and length >= 8 and offset+length <= len(raw),
                'Invalid BCWAV section reference')
        require(read('<4sI', offset) == (tag, length), 'BCWAV section size/tag mismatch')
        sections.append((offset, offset+length))
    (info, info_end), (data, data_end) = sections
    require(info_end <= data and data_end == len(raw), 'Overlapping or incomplete BCWAV sections')
    codec, loop, pad, rate, loop_start, samples, original_loop, channels = read('<BBHIIIII', info+8, info, info_end)
    require(codec in (1, 3), f'Unsupported BCWAV encoding {codec}')
    require(channels == 1, f'Unsupported BCWAV channel count {channels}')
    require(loop in (0, 1) and pad == 0 and 1 <= rate <= 192000 and 1 <= samples <= 16*1024*1024,
            'Invalid BCWAV sample metadata')
    require(0 <= loop_start < samples and (loop or loop_start == 0), 'Invalid BCWAV loop boundary')
    table = info+28
    mark, pad, relative = read('<HHI', table+4, info, info_end)
    require(mark == 0x7100 and pad == 0 and relative >= 12, 'Invalid BCWAV channel reference')
    channel = table+relative
    mark, pad, audio_relative, state_mark, state_pad, state_relative, reserved = read('<HHIHHII', channel, info, info_end)
    require(mark == 0x1f00 and pad == state_pad == reserved == 0, 'Invalid BCWAV channel metadata')
    audio = data+8+audio_relative
    byte_count = samples*2 if codec == 1 else (samples+1)//2
    require(data+8 <= audio and audio+byte_count <= data_end, 'Truncated BCWAV sample payload')
    meta = {'encoding': 'PCM16LE' if codec == 1 else 'IMA_ADPCM', 'channels': channels,
            'sampleRate': rate, 'samples': samples, 'loop': {'enabled': bool(loop), 'start': loop_start,
            'endExclusive': samples}, 'originalLoopWord': original_loop, 'dataOffset': audio}
    if codec == 1:
        require(state_mark == 0 and state_relative == 0xffffffff, 'Unexpected PCM codec state')
        pcm = raw[audio:audio+byte_count]
    else:
        require(state_mark == 0x0301 and state_relative >= 20, 'Invalid IMA codec reference')
        history, index, loop_history, loop_index = read('<hHhH', channel+state_relative, channel+20, info_end)
        require(index <= 88 and loop_index <= 88, 'Invalid IMA step index')
        meta['imaState'] = {'initial': {'history': history, 'index': index},
                            'loop': {'history': loop_history, 'index': loop_index}}
        pcm = bytearray(samples*2)
        for sample in range(samples):
            nibble = (raw[audio+sample//2] >> (4*(sample % 2))) & 15
            step = STEP[index]
            delta = (step >> 3) + ((step >> 2) if nibble & 1 else 0)
            delta += (step >> 1) if nibble & 2 else 0
            delta += step if nibble & 4 else 0
            history = max(-32768, min(32767, history + (-delta if nibble & 8 else delta)))
            index = max(0, min(88, index+INDEX[nibble & 7]))
            struct.pack_into('<h', pcm, sample*2, history)
        pcm = bytes(pcm)
    meta['pcmSha256'] = sha(pcm)
    return meta, pcm


def wav_bytes(meta, pcm):
    out = io.BytesIO()
    with wave.open(out, 'wb') as wav:
        wav.setparams((meta['channels'], 2, meta['sampleRate'], meta['samples'], 'NONE', 'not compressed'))
        wav.writeframes(pcm)
    return out.getvalue()


def source_tables(code):
    """Read the pinned native tables; names identify cues, not callback phases."""
    if sha(code) != CODE_SHA256: raise ValueError('Unexpected keyboard executable')
    def words(address, count): return struct.unpack_from('<'+'I'*count, code, address-0x100000)
    def string(address):
        at = address-0x100000
        return code[at:code.index(0, at)].decode('ascii')
    members = {0x1b7adc+i*8: string(words(0x1b7adc+i*8, 1)[0]) for i in range(16)}
    cues = []
    for cue in range(19):
        address = 0x1b7b5c+cue*28
        kind, name, resource, *parameters = words(address, 7)
        cues.append({'id': cue, 'name': string(name), 'tableAddress': address, 'kindWord': kind,
                     'member': members[resource] if resource else None,
                     'parameterWords': [f'{word:08x}' for word in parameters]})
    return list(members.values()), cues


def export(extracted, output, reference_decoder):
    """Export only to a new private directory, with independent PCM comparison."""
    extracted, output, reference_decoder = map(Path, (extracted, output, reference_decoder))
    repo = Path(__file__).resolve().parents[2]
    if output.resolve().is_relative_to(repo) or output.exists():
        raise ValueError('Output must be a new private directory outside the repository')
    source = json.loads((extracted/'source.json').read_text())
    if (source['titleId'], source['version']) != (TITLE, VERSION): raise ValueError('Unexpected keyboard title/version')
    raw = (extracted/'romfs'/ARCHIVE).read_bytes()
    if sha(raw) != ARCHIVE_SHA256: raise ValueError('Unexpected keyboard sound archive')
    code = (extracted/'exefs/code.bin').read_bytes()
    members, cues = source_tables(code)
    resources, archive = prepare(raw)
    if set(members) != set(resources): raise ValueError('Native resource table/archive mismatch')
    # This CLI returns 1 for the informational -V command; require valid identity JSON.
    identity = json.loads(subprocess.run([str(reference_decoder), '-V'], capture_output=True, text=True).stdout)
    reference = {'binarySha256': sha(reference_decoder.read_bytes()), 'version': identity['version']}
    manifest = {'schema': 1, 'titleId': TITLE, 'titleVersion': VERSION, 'sourceSha256': source['sourceSha256'],
                'contentSha256': source['contentSha256'], 'codeSha256': sha(code), 'archive': archive,
                'cues': cues, 'resources': {}, 'referenceDecoder': reference,
                'limits': ['SSEQ synthesis unsupported', 'Cue parameters preserved as raw words, not applied',
                           'Single-pass source PCM only; native gain, pitch, loop playback and timing not reproduced']}
    content = next(c for c in source['contents'] if c['index'] == source['resourceContentIndex'])
    manifest.update(contentIndex=content['index'], contentId=content['id'])
    manifest['converter'] = {path: sha((repo/'scripts'/path).read_bytes())
                             for path in ('firmware/keyboard_audio.py', 'unpack_home_resources.py')}
    generated = {}
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='keyboard-audio-', dir=output.parent) as tmp:
        scratch = Path(tmp)
        for index, name in enumerate(members):
            member = resources[name]
            record = {'resourceId': index, 'sourcePath': ARCHIVE+'/'+name, 'sourceSha256': sha(member), 'sourceSize': len(member)}
            if name.endswith('.sseq'):
                record.update(kind='sequence', supported=False, reason='SSEQ synthesis and native sequence semantics unresolved')
            else:
                meta, pcm = decode_bcwav(member)
                path = scratch/name; path.write_bytes(member)
                reference_meta = json.loads(subprocess.run([str(reference_decoder), '-m', '-I', str(path)],
                                            check=True, capture_output=True, text=True).stdout)
                expected_loop = {'start': meta['loop']['start'], 'end': meta['loop']['endExclusive']} if meta['loop']['enabled'] else None
                if (reference_meta['sampleRate'], reference_meta['channels'], reference_meta['numberOfSamples'], reference_meta['loopingInfo']) != \
                        (meta['sampleRate'], meta['channels'], meta['samples'], expected_loop):
                    raise ValueError(f'Independent BCWAV metadata mismatch: {name}')
                subprocess.run([str(reference_decoder), '-i', '-o', str(path)+'.wav', str(path)],
                               check=True, capture_output=True, text=True)
                with wave.open(str(path)+'.wav', 'rb') as wav:
                    actual = (wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes())
                    if actual != (meta['channels'], 2, meta['sampleRate'], meta['samples']) or wav.readframes(wav.getnframes()) != pcm:
                        raise ValueError(f'Independent BCWAV PCM mismatch: {name}')
                url = 'clips/'+name.removesuffix('.bcwav')+'.wav'
                generated[url] = wav_bytes(meta, pcm)
                record.update(kind='wave', supported=True, **meta, url=url, wavSha256=sha(generated[url]),
                              referencePcmEqual=True)
                record['referenceEncoding'] = reference_meta['encoding']
            manifest['resources'][name] = record
    output.mkdir()
    for url, raw in generated.items():
        path = output/url; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(raw)
    (output/'manifest.json').write_bytes(json_bytes(manifest))
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extracted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--reference-decoder', type=Path, required=True, help='Built vgmstream-cli for sample-exact comparison')
    args = parser.parse_args()
    result = export(args.extracted, args.output, args.reference_decoder)
    print(json.dumps({'resources': len(result['resources']), 'cues': len(result['cues']), 'output': str(args.output)}))
