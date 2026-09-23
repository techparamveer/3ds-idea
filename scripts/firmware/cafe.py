"""Bounded amiibo NintendoWare FLYT/FLAN/FLIM 7.2 readers.

Only the observed CTR version is accepted. Source-only part overrides, texture
combiners and projections remain explicit unsupported rendering dependencies.
No magic relabeling, executable inspection, or implied all-version support.
"""
import struct

from firmware.native import Reader, sections, _picture, PROPERTIES
from firmware.texture import BITS, CLIM_TO_PICA, PICA_NAMES, decode_texture

VERSION = 0x07020000


def _sections(data, magic):
    version, items = sections(data, magic)
    if version != VERSION or data[6:8] != b'\x14\x00':
        raise ValueError('Unsupported amiibo NintendoWare version/header')
    return version, items


def decode_bflim(data):
    """CTR 7.2 logical dimensions; tiled storage axes swap before rotation."""
    if len(data) < 40: raise ValueError('Truncated BFLIM')
    r = Reader(data[-40:])
    magic, bom, header, version, size, count, pad = r.read('4sHHIIHH', 0)
    tag, block, width, height, align, fmt, swizzle, length = r.read('4sIHHHBBI', 20)
    if (magic != b'FLIM' or bom != 0xfeff or header != 20 or version != VERSION or
            size != len(data) or count != 1 or pad or tag != b'imag' or block != 16 or
            length != len(data)-40 or align != 128):
        raise ValueError('Unsupported BFLIM header/payload')
    if not (0 < width <= 4096 and 0 < height <= 4096 and 0 <= fmt < len(CLIM_TO_PICA)):
        raise ValueError('Invalid BFLIM dimensions/format')
    if swizzle not in (0, 4, 8): raise ValueError('Unsupported BFLIM orientation')
    rw, rh = (height, width) if swizzle else (width, height)
    sw, sh = max(8, 1 << (rw-1).bit_length()), max(8, 1 << (rh-1).bit_length())
    pica = CLIM_TO_PICA[fmt]
    if sw*sh*BITS[pica]//8 != length: raise ValueError('Unexpected BFLIM storage extent')
    raw = decode_texture(data[:length], sw, sh, pica)
    out = bytearray(width*height*4)
    for y in range(height):
        for x in range(width):
            sx, sy = (x, y) if not swizzle else (rw-1-y, x) if swizzle == 4 else (y, x)
            src, dst = (sy*sw+sx)*4, (y*width+x)*4
            out[dst:dst+4] = raw[src:src+4]
    return {'width': width, 'height': height, 'format': fmt, 'picaFormat': pica,
            'formatName': PICA_NAMES[pica], 'sourceFormat': 'FLIM', 'version': version,
            'swizzle': swizzle, 'alignment': align, 'storageSize': [sw, sh]}, bytes(out)


def _material(data):
    r = Reader(data); flags = r.u32(36)
    out = {'name': r.string(0, 28), 'flags': flags, 'sourceFormat': 'FLYT',
           'bufferColor': list(r.bytes(28, 4)), 'constantColors': [list(r.bytes(32, 4))],
           'textureOnly': False, 'textureMaps': [], 'textureMatrices': [],
           'coordinateGenerators': [], 'tevStages': [], 'unsupported': []}
    at = 40
    for _ in range(flags & 3):
        index, s, t = r.read('HBB', at); at += 4
        out['textureMaps'].append({'texture': index, 'wrapS': s & 3, 'wrapT': t & 3,
                                  'minFilter': s >> 2, 'magFilter': t >> 2})
        if s not in (0, 1, 2, 4, 5, 6) or t not in (0, 1, 2, 4, 5, 6):
            out['unsupported'].append({'kind': 'flytWrap', 'values': [s, t]})
    for _ in range((flags >> 2) & 3):
        x, y, angle, sx, sy = r.read('5f', at); at += 20
        out['textureMatrices'].append({'translation': [x, y], 'rotation': angle, 'scale': [sx, sy]})
    for _ in range((flags >> 4) & 3):
        kind, source = r.read('BB', at); extra = r.bytes(at+2, 6); at += 8
        out['coordinateGenerators'].append({'type': kind, 'source': source, 'sourceExtra': extra.hex()})
        if kind != 0 or source > 2 or any(extra):
            out['unsupported'].append({'kind': 'flytCoordinateGenerator', 'type': kind, 'source': source, 'extra': extra.hex()})
    for _ in range((flags >> 6) & 3):
        color, alpha, reserved = r.read('BBH', at); at += 4
        out.setdefault('sourceCombiners', []).append({'color': color, 'alpha': alpha, 'reserved': reserved})
        out['unsupported'].append({'kind': 'flytTextureCombiner', 'color': color, 'alpha': alpha})
    if flags & (1 << 9):
        function, reference = r.read('If', at); at += 8
        out['alphaCompare'] = {'function': function, 'reference': reference}
        if function > 7: out['unsupported'].append({'kind': 'flytAlphaCompare', 'function': function})
    for label, shift in [('colorBlend', 10), ('alphaBlend', 12)]:
        count = (flags >> shift) & 3
        blends = []
        for _ in range(count):
            operation, src, dst, logic = r.read('4B', at); at += 4
            blends.append({'operation': operation, 'sourceFactor': src, 'destinationFactor': dst, 'logic': logic})
        if count == 1: out[label] = blends[0]
        if count > 1: out['unsupported'].append({'kind': 'flytBlendCount', 'label': label, 'values': blends})
    if flags & (1 << 14):
        out['sourceIndirect'] = list(r.read('3f', at)); at += 12
        out['unsupported'].append({'kind': 'flytIndirect'})
    for _ in range((flags >> 15) & 3):
        values = list(r.read('4f', at)); option = r.read('B', at+16)[0]
        padding = r.bytes(at+17, 3).hex(); at += 20
        out.setdefault('sourceProjections', []).append({'transform': values, 'option': option, 'padding': padding})
        out['unsupported'].append({'kind': 'flytProjection', 'option': option})
    if flags & (1 << 17):
        out['sourceShadowBlend'] = r.bytes(at, 8).hex(); at += 8
        out['unsupported'].append({'kind': 'flytShadowBlend'})
    if flags & ~0x3feff: out['unsupported'].append({'kind': 'flytMaterialFlags', 'flags': flags & ~0x3feff})
    if at != len(data): out['unsupported'].append({'kind': 'flytMaterialTail', 'bytes': r.bytes(at, len(data)-at).hex()})
    return out


def _origin(raw):
    if raw & 3 == 3 or (raw >> 2) & 3 == 3: raise ValueError('Invalid FLYT origin')
    return (1, 0, 2)[raw & 3] + 3*(1, 0, 2)[(raw >> 2) & 3]


def _pane(tag, r, depth=0):
    if depth >= 32: raise ValueError('Excessive FLYT part nesting')
    flags, origin, alpha, magnify = r.read('4B', 8)
    out = {'kind': tag, 'sourceFormat': 'FLYT', 'name': r.string(12, 24), 'userData': r.bytes(36, 8).hex(),
           'flags': flags, 'origin': _origin(origin), 'sourceOrigin': origin, 'alpha': alpha,
           'sourceMagnifyFlags': magnify, 'translation': list(r.read('3f', 44)),
           'rotation': list(r.read('3f', 56)), 'scale': list(r.read('2f', 68)),
           'size': list(r.read('2f', 76)), 'children': [], 'unsupported': []}
    if origin >> 4: out['unsupported'].append({'kind': 'flytParentOrigin', 'origin': origin >> 4})
    if tag == 'pic1': out['picture'] = _picture(r, 84)
    elif tag == 'txt1':
        capacity, length, material, font, alignment, line, text_flags, pad, italic, offset = r.read('4H4BfI', 84)
        if length % 2: raise ValueError('Odd FLYT UTF16 length')
        value = r.bytes(offset, length).decode('utf-16-le').rstrip('\0') if length else ''
        call = r.u32(128); perchar = r.u32(160)
        out['text'] = {'capacity': capacity, 'length': length, 'material': material, 'font': font,
                       'alignment': _origin(alignment), 'lineAlignment': line, 'flags': text_flags,
                       'value': value, 'topColor': list(r.bytes(104, 4)), 'bottomColor': list(r.bytes(108, 4)),
                       'size': list(r.read('2f', 112)), 'characterSpacing': r.read('f', 120)[0],
                       'lineSpacing': r.read('f', 124)[0], 'callName': r.string(call) if call else '',
                       'sourceItalic': italic, 'sourceShadow': r.bytes(132, 28).hex()}
        if italic or text_flags & ~2 or perchar:
            out['unsupported'].append({'kind': 'flytTextEffects', 'flags': text_flags, 'italic': italic, 'perCharacterOffset': perchar})
    elif tag == 'wnd1':
        count, flags, pad, content, table = r.read('BBHII', 100)
        out['window'] = {'inflation': list(r.read('4H', 84)), 'frameSize': list(r.read('4H', 92)),
                         'flags': flags, 'content': _picture(r, content), 'frames': []}
        if any(out['window']['inflation']): out['unsupported'].append({'kind': 'flytWindowInflation'})
        for i in range(count):
            material, flip, pad = r.read('HBB', r.u32(table+i*4))
            out['window']['frames'].append({'material': material, 'flip': flip})
    elif tag == 'prt1':
        count = r.u32(84); r.bytes(96, count*40)
        part = {'layout': r.string(96+count*40), 'magnify': list(r.read('2f', 88)), 'entries': []}
        for i in range(count):
            at = 96+i*40
            usage, basic, material, pad, prop, user, info = r.read('4B3I', at+24)
            entry = {'name': r.string(at, 24), 'usageFlags': usage, 'basicUsageFlags': basic,
                     'materialUsageFlags': material, 'sourceOffsets': [prop, user, info]}
            if prop:
                subtag = r.string(prop, 4); length = r.u32(prop+4)
                sub = Reader(r.bytes(prop, length))
                if subtag not in ('pan1', 'bnd1', 'pic1', 'txt1', 'wnd1', 'prt1'): raise ValueError('Unknown part property pane')
                entry['property'] = _pane(subtag, sub, depth+1)
            if user:
                if r.bytes(user, 4) != b'usd1': raise ValueError('Invalid part user data')
                entry['userDataBytes'] = r.bytes(user, r.u32(user+4)).hex()
            if info:
                entry['paneInfoBytes'] = r.bytes(info, 52).hex()
                entry['basicInfo'] = {'userData': r.bytes(info, 8).hex(),
                                      'translation': list(r.read('3f', info+8)),
                                      'rotation': list(r.read('3f', info+20)),
                                      'scale': list(r.read('2f', info+32)),
                                      'size': list(r.read('2f', info+40)),
                                      'alpha': r.read('B', info+48)[0],
                                      'padding': r.bytes(info+49, 3).hex()}
            part['entries'].append(entry)
        out['part'] = part
        out['unsupported'].append({'kind': 'flytPartComposition', 'layout': part['layout']})
    return out


def _control(r):
    name, main, parts, animations, part_table, animation_table = r.read('IIHHII', 8)
    def strings(at, count):
        r.bytes(at, count*4)
        return [r.string(at+r.u32(at+i*4)) for i in range(count)]
    return {'name': r.string(name), 'panes': [r.string(main+i*24, 24) for i in range(parts)],
            'animations': strings(main+parts*24, animations),
            'paneAliases': strings(part_table, parts), 'animationAliases': strings(animation_table, animations)}


def decode_flyt(data):
    version, items = _sections(data, b'FLYT')
    out = {'version': version, 'sourceFormat': 'FLYT', 'canvas': None, 'textures': [], 'fonts': [],
           'materials': [], 'roots': [], 'groups': [], 'unsupported': []}
    parents, previous, groups, last = [], None, [], None
    for tag, r in items:
        if tag == 'lyt1':
            origin, w, h, pw, ph = r.read('I4f', 8)
            out['canvas'] = {'origin': origin, 'width': w, 'height': h}
            out['sourceLayout'] = {'name': r.string(28), 'partsSize': [pw, ph]}
        elif tag in ('txl1', 'fnl1'):
            count = r.u32(8); r.bytes(12, count*4)
            out['textures' if tag == 'txl1' else 'fonts'] = [r.string(12+r.u32(12+i*4)) for i in range(count)]
        elif tag == 'mat1':
            count = r.u32(8); r.bytes(12, count*4)
            offsets = [r.u32(12+i*4) for i in range(count)] + [len(r.data)]
            if offsets != sorted(offsets) or offsets[0] < 12+4*count: raise ValueError('Invalid FLYT material table')
            out['materials'] = [_material(r.bytes(a, b-a)) for a, b in zip(offsets, offsets[1:])]
        elif tag in ('pan1', 'pic1', 'txt1', 'wnd1', 'bnd1', 'prt1'):
            previous = _pane(tag, r)
            (parents[-1]['children'] if parents else out['roots']).append(previous)
        elif tag == 'pas1':
            if previous is None or len(parents) >= 64: raise ValueError('Invalid FLYT pane start')
            parents.append(previous); previous = None
        elif tag == 'pae1':
            if not parents: raise ValueError('Invalid FLYT pane end')
            parents.pop(); previous = None
        elif tag == 'grp1':
            count = r.read('H', 42)[0]; r.bytes(44, count*24)
            last = {'name': r.string(8, 34), 'panes': [r.string(44+i*24, 24) for i in range(count)], 'children': []}
            (groups[-1]['children'] if groups else out['groups']).append(last)
        elif tag == 'grs1':
            if last is None or len(groups) >= 64: raise ValueError('Invalid FLYT group start')
            groups.append(last); last = None
        elif tag == 'gre1':
            if not groups: raise ValueError('Invalid FLYT group end')
            groups.pop(); last = None
        elif tag == 'cnt1': out.setdefault('sourceControls', []).append(_control(r))
        else: out['unsupported'].append({'tag': tag, 'bytes': r.data.hex()})
    if parents or groups or out['canvas'] is None: raise ValueError('Incomplete FLYT hierarchy/canvas')
    _initial_portal_capabilities(out)
    return out


def _initial_portal_capabilities(layout):
    """Only the original portal's observed resource combinations are enabled."""
    name = layout['sourceLayout']['name']
    if name != 'PortalSceneCTR': return
    def walk(panes):
        for pane in panes:
            yield pane
            yield from walk(pane['children'])
    for pane in walk(layout['roots']):
        part = pane.get('part')
        if not part or part['layout'] not in ('PortalBtn', 'PortalBtnSub', 'BtnBtm_03') or part['magnify'] != [1.0, 1.0]: continue
        valid = True
        for entry in part['entries']:
            prop = entry.get('property'); basic = entry.get('basicInfo')
            valid = valid and entry['usageFlags'] in (0, 1) and entry['materialUsageFlags'] == 0
            valid = valid and entry['basicUsageFlags'] in (0, 0x10, 0x18, 0x28) and not entry.get('userDataBytes')
            valid = valid and ((entry['basicUsageFlags'] == 0 and basic is None) or
                              (basic is not None and basic['padding'] == '000000'))
            valid = valid and (prop is None or prop['kind'] in ('pic1', 'txt1'))
            valid = valid and (entry['usageFlags'] != 1 or prop is not None and prop['kind'] == 'txt1')
        if valid:
            pane['unsupported'] = [v for v in pane['unsupported'] if v.get('kind') != 'flytPartComposition']
            part['capability'] = 'amiibo-portal-v1'


def decode_flan(data):
    version, items = _sections(data, b'FLAN')
    out = {'version': version, 'sourceFormat': 'FLAN', 'frames': 0, 'loop': False,
           'groups': [], 'textures': [], 'tracks': [], 'unsupported': []}
    for tag, r in items:
        if tag == 'pat1':
            order, count, name, groups, first, last, child = r.read('HHIIhhB', 8)
            # Real 7.2 amiibo group records occupy 36 bytes, not the older 28.
            r.bytes(groups, count*36)
            out.update(name=r.string(name), order=order, sourceFrameRange=[first, last], childBinding=bool(child),
                       groups=[r.string(groups+i*36, 36) for i in range(count)])
        elif tag == 'pai1':
            frames, loop, pad, nt, count, table = r.read('HBBHHI', 8)
            out.update(frames=frames, loop=bool(loop))
            r.bytes(20, nt*4); r.bytes(table, count*4)
            out['textures'] = [r.string(20+r.u32(20+i*4)) for i in range(nt)]
            for i in range(count):
                base = r.u32(table+i*4); target = r.string(base, 28)
                tags, binding, pad = r.read('BBH', base+28); r.bytes(base+32, tags*4)
                if binding not in (0, 1):
                    out['unsupported'].append({'kind': 'flytAnimationBinding', 'binding': binding, 'target': target}); continue
                for j in range(tags):
                    info = base+r.u32(base+32+j*4); kind = r.string(info, 4); n = r.u32(info+4)
                    r.bytes(info+8, n*4)
                    for k in range(n):
                        track = info+r.u32(info+8+k*4)
                        index, component, curve, count, pad, keys = r.read('BBHHHI', track)
                        rec = {'target': target, 'binding': 'material' if binding else 'pane', 'tag': kind,
                               'index': index, 'component': component, 'interpolation': {1: 'step', 2: 'hermite'}.get(curve, 'unsupported'),
                               'property': 'unsupported', 'keys': []}
                        cl = 'CL'+kind[2:]
                        if kind.startswith('FL') and cl in PROPERTIES and component < len(PROPERTIES[cl]): rec['property'] = PROPERTIES[cl][component]
                        elif kind == 'FLVC' and component <= 16: rec['property'] = 'alpha' if component == 16 else f'vertexColor.{component//4}.{component%4}'
                        elif kind == 'FLMC' and component < 8: rec['property'] = f'materialColor.{component//4}.{component%4}'
                        if curve not in (1, 2):
                            out['unsupported'].append({'kind': 'flytCurve', 'curve': curve, 'target': target}); continue
                        for key in range(count):
                            at = track+keys+key*(8 if curve == 1 else 12)
                            frame, value, extra = r.read('fHH' if curve == 1 else '3f', at)
                            rec['keys'].append({'frame': frame, 'value': value, **({'slope': extra} if curve == 2 else {})})
                        if any(a['frame'] > b['frame'] for a, b in zip(rec['keys'], rec['keys'][1:])): raise ValueError('Unordered FLAN keys')
                        if rec['property'] == 'unsupported': out['unsupported'].append({'kind': 'flytTrackProperty', 'tag': kind, 'component': component})
                        out['tracks'].append(rec)
        else: out['unsupported'].append({'tag': tag, 'bytes': r.data.hex()})
    return out
