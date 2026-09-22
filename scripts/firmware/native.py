"""Bounded conversion of native CTR layout, animation and message resources.

Unknown data remains explicit; this parser makes no visual-fidelity claim.
"""
import hashlib
import math
import struct


class Reader:
    def __init__(self, data): self.data = data
    def bytes(self, at, n):
        if at < 0 or n < 0 or at+n > len(self.data): raise ValueError('Read outside resource')
        return self.data[at:at+n]
    def read(self, fmt, at):
        values = struct.unpack('<'+fmt, self.bytes(at, struct.calcsize('<'+fmt)))
        if any(isinstance(v, float) and not math.isfinite(v) for v in values): raise ValueError('Non-finite resource value')
        return values
    def u32(self, at): return self.read('I', at)[0]
    def string(self, at, n=None):
        end = self.data.index(0, at) if n is None else at+n
        return self.bytes(at, end-at).split(b'\0', 1)[0].decode('utf-8')


def sections(data, magic):
    r = Reader(data)
    sig, bom, header, version, size, count, reserved = r.read('4sHHIIHH', 0)
    if sig != magic or bom != 0xfeff or header < 20 or size != len(data) or size > 64*1024*1024:
        raise ValueError('Invalid native resource header')
    result, at = [], header
    for _ in range(count):
        tag, length = r.read('4sI', at)
        if length < 8: raise ValueError('Invalid section size')
        result.append((tag.decode('ascii'), Reader(r.bytes(at, length))))
        at += length
    if at != len(data): raise ValueError('Unaccounted native bytes')
    return version, result


def _picture(r, at):
    material, n = r.read('HH', at+16)
    return {'colors': [list(r.bytes(at+i*4, 4)) for i in range(4)], 'material': material,
            'uvSets': [list(r.read('8f', at+20+i*32)) for i in range(n)]}


def _material(data):
    r = Reader(data)
    flags = r.u32(48)
    result = {'name': r.string(0, 20), 'bufferColor': list(r.bytes(20, 4)),
              'constantColors': [list(r.bytes(24+i*4, 4)) for i in range(6)], 'flags': flags,
              'textureOnly': bool(flags & 0x800), 'textureMaps': [], 'textureMatrices': [],
              'coordinateGenerators': [], 'tevStages': [], 'unsupported': []}
    at = 52
    for _ in range(flags & 3):
        index, s, t = r.read('HBB', at); at += 4
        result['textureMaps'].append({'texture': index, 'wrapS': s&3, 'wrapT': t&3, 'minFilter': (s>>2)&3, 'magFilter': (t>>2)&3})
    for _ in range((flags>>2)&3):
        x, y, angle, sx, sy = r.read('5f', at); at += 20
        result['textureMatrices'].append({'translation': [x, y], 'rotation': angle, 'scale': [sx, sy]})
    for _ in range((flags>>4)&3):
        kind, source, reserved = r.read('BBH', at); at += 4
        result['coordinateGenerators'].append({'type': kind, 'source': source, 'reserved': reserved})
    for _ in range((flags>>6)&7):
        color, alpha, constants = r.read('III', at); at += 12
        stage = {'constantSelectors': constants, 'rawWords': [color, alpha, constants]}
        for label, word in [('color', color), ('alpha', alpha)]:
            stage[label] = {'sources': [(word>>s)&15 for s in (0, 4, 8)], 'operands': [(word>>s)&15 for s in (12, 16, 20)],
                            'mode': (word>>24)&15, 'scale': 1 << ((word>>28)&3), 'savePrevious': bool(word & (1<<30))}
        result['tevStages'].append(stage)
    if flags & (1<<9):
        function, reference = r.read('If', at); at += 8
        result['alphaCompare'] = {'function': function, 'reference': reference}
    for label, bit in [('colorBlend', 10), ('alphaBlend', 12)]:
        if flags & (1<<bit):
            operation, source, dest, logic = r.read('4B', at); at += 4
            result[label] = {'operation': operation, 'sourceFactor': source, 'destinationFactor': dest, 'logic': logic}
    if at < len(data):
        result['unsupported'].append({'kind': 'materialExtensions', 'flags': flags & ~0x1fff, 'bytes': r.bytes(at, len(data)-at).hex()})
    return result


def decode_layout(data):
    version, items = sections(data, b'CLYT')
    out = {'version': version, 'canvas': None, 'textures': [], 'fonts': [], 'materials': [], 'roots': [], 'groups': [], 'unsupported': []}
    parents, previous, groups, last_group = [], None, [], None
    for tag, r in items:
        if tag == 'lyt1':
            origin, w, h = r.read('Iff', 8); out['canvas'] = {'origin': origin, 'width': w, 'height': h}
        elif tag in ('txl1', 'fnl1'):
            count = r.u32(8)
            out['textures' if tag == 'txl1' else 'fonts'] = [r.string(12+r.u32(12+i*4)) for i in range(count)]
        elif tag == 'mat1':
            offsets = [r.u32(12+i*4) for i in range(r.u32(8))] + [len(r.data)]
            if offsets != sorted(offsets): raise ValueError('Unordered material offsets')
            out['materials'] = [_material(r.bytes(a, b-a)) for a, b in zip(offsets, offsets[1:])]
        elif tag in ('pan1', 'pic1', 'txt1', 'wnd1', 'bnd1'):
            flags, origin, alpha, reserved = r.read('4B', 8)
            pane = {'kind': tag, 'name': r.string(12, 16), 'flags': flags, 'origin': origin, 'alpha': alpha,
                    'userData': r.bytes(28, 8).hex(), 'translation': list(r.read('3f', 36)), 'rotation': list(r.read('3f', 48)),
                    'scale': list(r.read('2f', 60)), 'size': list(r.read('2f', 68)), 'children': []}
            if tag == 'pic1': pane['picture'] = _picture(r, 76)
            if tag == 'txt1':
                capacity, length, material, font, alignment, line, text_flags, pad, offset = r.read('4H4BI', 76)
                text_bytes = r.bytes(offset, min(length, len(r.data)-offset)) if offset else b''
                pane['text'] = {'capacity': capacity, 'length': length, 'material': material, 'font': font, 'alignment': alignment,
                                'lineAlignment': line, 'flags': text_flags, 'value': text_bytes.decode('utf-16-le').rstrip('\0'),
                                'topColor': list(r.bytes(92, 4)), 'bottomColor': list(r.bytes(96, 4)),
                                'size': list(r.read('2f', 100)), 'characterSpacing': r.read('f', 108)[0], 'lineSpacing': r.read('f', 112)[0]}
            if tag == 'wnd1':
                count, flags, pad, content, table = r.read('BBHII', 92)
                # CTR stores fixed-point inflation followed by integer frame
                # sizes, each in left/right/top/bottom order (not four floats).
                pane['window'] = {'inflation': [v/16 for v in r.read('4H', 76)],
                                  'frameSize': list(r.read('4H', 84)), 'flags': flags,
                                  'content': _picture(r, content), 'frames': []}
                for i in range(count):
                    ptr = r.u32(table+i*4); material, flip, pad = r.read('HBB', ptr)
                    pane['window']['frames'].append({'material': material, 'flip': flip})
            (parents[-1]['children'] if parents else out['roots']).append(pane); previous = pane
        elif tag == 'pas1':
            if previous is None or len(parents) >= 64: raise ValueError('Invalid pane start')
            parents.append(previous); previous = None
        elif tag == 'pae1':
            if not parents: raise ValueError('Invalid pane end')
            parents.pop(); previous = None
        elif tag == 'grp1':
            last_group = {'name': r.string(8, 16), 'panes': [r.string(28+i*16, 16) for i in range(r.u32(24))], 'children': []}
            (groups[-1]['children'] if groups else out['groups']).append(last_group)
        elif tag == 'grs1':
            if last_group is None: raise ValueError('Invalid group start')
            groups.append(last_group); last_group = None
        elif tag == 'gre1':
            if not groups: raise ValueError('Invalid group end')
            groups.pop()
        elif tag == 'usd1':
            entries = []
            for i in range(r.u32(8)):
                at = 12+i*12; key, value, count, kind = r.read('IIHH', at)
                entry = {'name': r.string(at+key), 'type': kind}
                if kind == 0: entry['value'] = r.string(at+value)
                elif kind in (1, 2): entry['value'] = list(r.read(('i' if kind == 1 else 'f')*count, at+value))
                else: entry['unsupported'] = True
                entries.append(entry)
            if previous is not None: previous['metadata'] = entries
            else: out['unsupported'].append({'tag': tag, 'entries': entries})
        else: out['unsupported'].append({'tag': tag, 'bytes': r.data.hex()})
    if parents or groups: raise ValueError('Unterminated layout hierarchy')
    return out


PROPERTIES = {
    'CLPA': ['translation.x', 'translation.y', 'translation.z', 'rotation.x', 'rotation.y', 'rotation.z', 'scale.x', 'scale.y', 'size.width', 'size.height'],
    'CLTS': ['texture.translation.x', 'texture.translation.y', 'texture.rotation', 'texture.scale.x', 'texture.scale.y'],
    'CLVI': ['visible'], 'CLTP': ['texture.pattern'],
}


def decode_animation(data):
    version, items = sections(data, b'CLAN')
    out = {'version': version, 'frames': 0, 'loop': False, 'groups': [], 'textures': [], 'tracks': [], 'unsupported': []}
    for tag, r in items:
        if tag == 'pat1':
            order, count, name, groups, first, last, child = r.read('HHIIhhB', 8)
            out.update(name=r.string(name), order=order, sourceFrameRange=[first, last], childBinding=bool(child),
                       groups=[r.string(groups+i*20, 20) for i in range(count)])
        elif tag == 'pai1':
            frames, loop, pad, texture_count, target_count, table = r.read('HBBHHI', 8)
            out.update(frames=frames, loop=bool(loop))
            out['textures'] = [r.string(20+r.u32(20+i*4)) for i in range(texture_count)]
            for i in range(target_count):
                base = r.u32(table+i*4)
                target = r.string(base, 20)
                count, binding, reserved = r.read('BBH', base+20)
                for j in range(count):
                    info = base+r.u32(base+24+j*4)
                    kind = r.string(info, 4); n = r.read('B', info+4)[0]
                    for k in range(n):
                        track = info+r.u32(info+8+k*4)
                        index, component, curve, pad, count, reserved, keys = r.read('4BHHI', track)
                        record = {'target': target, 'binding': 'material' if binding == 1 else 'pane' if binding == 0 else binding,
                                  'tag': kind, 'index': index, 'component': component, 'interpolation': {1: 'step', 2: 'hermite'}.get(curve, 'unsupported'), 'keys': []}
                        if kind in PROPERTIES and component < len(PROPERTIES[kind]): record['property'] = PROPERTIES[kind][component]
                        elif kind == 'CLVC': record['property'] = 'alpha' if component == 16 else f'vertexColor.{component//4}.{component%4}'
                        elif kind == 'CLMC': record['property'] = f'materialColor.{component//4}.{component%4}'
                        else: record['property'] = 'unsupported'
                        if curve not in (1, 2):
                            out['unsupported'].append({'kind': 'curve', 'tag': kind, 'curve': curve, 'target': target}); continue
                        for key in range(count):
                            at = track+keys+key*(8 if curve == 1 else 12)
                            if curve == 1:
                                frame, value, pad = r.read('fHH', at); record['keys'].append({'frame': frame, 'value': value})
                            else:
                                frame, value, slope = r.read('3f', at); record['keys'].append({'frame': frame, 'value': value, 'slope': slope})
                        if any(a['frame'] > b['frame'] for a, b in zip(record['keys'], record['keys'][1:])): raise ValueError('Unordered animation keys')
                        # Duplicate frame keys are intentional split tangents, retained.
                        if record['property'] == 'unsupported': out['unsupported'].append({'kind': 'trackProperty', 'tag': kind, 'component': component})
                        out['tracks'].append(record)
        else: out['unsupported'].append({'tag': tag, 'bytes': r.data.hex()})
    return out


def decode_mstl(data):
    """Read HOME's RI_mstl table, not MSBP's shorter SYL3 record format.

    Native 10.7 EUR HOME: 0x1338f0 resolves TSY1 to base+4+44*index;
    0x11e5b0 applies the four floats below. The TextBox constructor at
    0x1a42c8 confirms the width/height and spacing destinations. The other
    seven words have no established runtime semantics and stay unnamed.
    This headerless format must only be selected by known resource path.
    """
    r = Reader(data)
    count = r.u32(0)
    if count > 65536 or len(data) != 4+44*count:
        raise ValueError('Invalid HOME message style table size')
    out = {'recordSize': 44, 'styles': [], 'unsupported': [
        {'kind': 'styleFields', 'offsets': [0, 4, 8, 12, 16, 20, 40]}]}
    for index in range(count):
        at = 4+index*44
        sy, sx, line, character = r.read('4f', at+24)
        out['styles'].append({'fontScale': [sx, sy], 'lineSpacing': line,
                              'characterSpacing': character,
                              'unresolvedWords': {str(offset): r.u32(at+offset)
                                                  for offset in (0, 4, 8, 12, 16, 20, 40)}})
    return out


def decode_msbt(data):
    r = Reader(data)
    if r.bytes(0, 8) != b'MsgStdBn' or r.read('H', 8)[0] != 0xfeff or r.u32(18) != len(data): raise ValueError('Invalid MSBT header')
    encoding, version, count = r.read('BBH', 12)
    if encoding != 1: raise ValueError('Only UTF-16 MSBT supported')
    labels, texts, unknown, at = {}, [], [], 32
    styles, attributes = None, None
    for _ in range(count):
        tag, size = r.read('4sI', at); s = Reader(r.bytes(at+16, size))
        if tag == b'LBL1':
            for i in range(s.u32(0)):
                n, pos = s.read('II', 4+i*8)
                for _ in range(n):
                    length = s.read('B', pos)[0]; label = s.bytes(pos+1, length).decode('utf-8'); pos += 1+length
                    labels[label] = s.u32(pos); pos += 4
        elif tag == b'TSY1':
            if size % 4: raise ValueError('Invalid message style table')
            styles = list(s.read('i'*(size//4), 0))
        elif tag == b'ATR1':
            n, width = s.read('II', 0)
            if n > 65536: raise ValueError('Excessive message attribute count')
            end = 8+n*width
            attributes = {'count': n, 'recordSize': width,
                          'records': [s.bytes(8+i*width, width).hex() for i in range(n)] if width else [],
                          'stringTable': s.bytes(end, size-end).hex()}
        elif tag == b'TXT2':
            n = s.u32(0); offsets = [s.u32(4+i*4) for i in range(n)] + [len(s.data)]
            for begin, end in zip(offsets, offsets[1:]):
                raw = s.bytes(begin, end-begin); pos, tokens, chars = 0, [], []
                while pos+2 <= len(raw):
                    code = int.from_bytes(raw[pos:pos+2], 'little'); pos += 2
                    if code == 0: break
                    if code in (0x0e, 0x0f):
                        if chars: tokens.append({'text': ''.join(chars)}); chars = []
                        if pos+4 > len(raw): raise ValueError('Truncated message control')
                        group, kind = struct.unpack_from('<HH', raw, pos); pos += 4
                        token = {'control': code, 'group': group, 'type': kind}
                        if code == 0x0e:
                            if pos+2 > len(raw): raise ValueError('Truncated message arguments')
                            length = int.from_bytes(raw[pos:pos+2], 'little'); pos += 2
                            if pos+length > len(raw): raise ValueError('Truncated message arguments')
                            token['arguments'] = raw[pos:pos+length].hex(); pos += length
                        tokens.append(token)
                    else: chars.append(chr(code))
                if chars: tokens.append({'text': ''.join(chars)})
                texts.append({'text': ''.join(token.get('text', '') for token in tokens), 'tokens': tokens})
        else: unknown.append({'tag': tag.decode('ascii'), 'size': size, 'sha256': hashlib.sha256(s.data).hexdigest()})
        at = (at+16+size+15)&~15
    if styles is not None:
        if len(styles) != len(texts): raise ValueError('Message style count mismatch')
        for message, style in zip(texts, styles): message['styleIndex'] = None if style == -1 else style
    if attributes is not None and attributes['count'] != len(texts): raise ValueError('Message attribute count mismatch')
    return {'version': version, 'labels': labels, 'messages': texts, 'attributes': attributes, 'unsupported': unknown}
