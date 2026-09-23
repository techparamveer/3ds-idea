"""Strict common_back.sseq control timeline, independent of native ARM replay.

Only the source-required opcodes are supported. This interprets track controls
and note scheduling; it does not synthesize envelopes, PCM or hardware audio.
"""
import struct
from firmware.keyboard_audio import sha

SEQUENCE_SHA256 = '6b3913db5b1e493053a71000d7567a53a1a0ae1c9afd929746a9d7f64b08e817'


def interpret(raw):
    if sha(raw) != SEQUENCE_SHA256: raise ValueError('Unexpected keyboard sequence')
    if struct.unpack_from('<4sHHIHH4sII', raw) != (b'SSEQ',0xfeff,0x100,128,16,1,b'DATA',112,28):
        raise ValueError('Unsupported SSEQ header')
    base = 28; end = len(raw)
    if raw[base] != 0xfe: raise ValueError('Missing source track allocation')
    mask = struct.unpack_from('<H', raw, base+1)[0] | 1
    tracks = {i: {'pc': base+3 if i == 0 else None, 'wait': 0, 'program': 0,
                  'volume': 127, 'pan': 0, 'adsr': [None]*4}
              for i in range(16) if mask & (1 << i)}
    events = []; notes = []; ended = []; tick = 0
    def read(track, size):
        at = track['pc']
        if at is None or not base <= at <= end-size: raise ValueError('SSEQ read outside source')
        track['pc'] += size
        return raw[at:at+size]
    def variable(track):
        value = 0
        for _ in range(4):
            byte = read(track,1)[0]; value = (value << 7) | (byte & 127)
            if not byte & 128: return value
        raise ValueError('Overlong SSEQ variable integer')
    for tick in range(1000):
        active = False
        for index, track in tracks.items():
            if track['pc'] is None: continue
            if track['wait'] > 0: track['wait'] -= 1
            if track['wait'] > 0: active = True; continue
            for _ in range(1000):
                offset = track['pc']; opcode = read(track,1)[0]
                events.append({'tick':tick,'track':index,'offset':offset,'opcode':opcode})
                if opcode < 0x80:
                    velocity = read(track,1)[0]; duration = variable(track)
                    if not 1 <= duration <= 1000: raise ValueError('Unsupported note duration')
                    notes.append({'tick':tick,'track':index,'offset':offset,'key':opcode,'velocity':velocity,
                                  'duration':duration,'program':track['program'],'volume':track['volume'],
                                  'pan':track['pan'],'adsr':list(track['adsr'])})
                    track['wait'] = duration; active = True; break
                if opcode == 0x80:
                    track['wait'] = variable(track)
                    if track['wait'] > 0: active = True; break
                elif opcode == 0x81: track['program'] = variable(track)
                elif opcode == 0x93:
                    target = read(track,1)[0]; destination = int.from_bytes(read(track,3),'little')+base
                    if target not in tracks or target == index or not base <= destination < end:
                        raise ValueError('Invalid source track target')
                    tracks[target]['pc'] = destination
                elif opcode == 0xc0: track['pan'] = read(track,1)[0]-64
                elif opcode == 0xc1: track['volume'] = read(track,1)[0]
                elif 0xd0 <= opcode <= 0xd3: track['adsr'][opcode-0xd0] = read(track,1)[0]
                elif opcode == 0xff:
                    track['pc'] = None; ended.append({'tick':tick,'track':index}); break
                else: raise ValueError(f'Unsupported SSEQ opcode {opcode:#x}')
            else: raise ValueError('SSEQ opcode budget exhausted')
        if not active: break
    else: raise ValueError('SSEQ tick budget exhausted')
    return {'sourceSha256':sha(raw),'allocatedTrackIds':list(tracks),'events':events,'notes':notes,
            'trackEnds':ended,'completionTick':tick,
            'limits':['Track control timeline only; envelopes, transport and hardware rendering remain separate']}
