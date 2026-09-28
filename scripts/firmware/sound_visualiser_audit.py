#!/usr/bin/env python3
"""Static audit of the Sound (EUR 10.7.0-32E) upper-screen visualiser models.

Extracts the twelve LZ11 CGFX entries of `romfs/res/S.pack`, converts each with the
pinned SPICA exporter through `scripts/firmware-cgfx/convert.py`, classifies every
material against the browser PICA renderer's vocabulary, and checks selection facts in
the original `code.bin` with Capstone. Nothing is emulated or rasterised and no audio
behaviour is reconstructed. Converted models and the private report are written
outside the repository; `--summary` writes the hash/feature summary kept under
`docs/evidence/`, which carries no private paths.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts' / 'firmware-cgfx'))
sys.path.insert(0, str(ROOT / 'scripts'))
from convert import convert  # noqa: E402  (pinned SPICA wrapper)
from unpack_home_resources import decompress  # noqa: E402

CODE_SHA256 = '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9'
PACK_SHA256 = '05550cfa807aa19cd27347e1b309a60aed7f20cf208be13ea2bab1bc942f161d'
BASE = 0x100000
TITLE = '0004001000022500'

# Vocabulary accepted by src/scene/firmware-model.ts and src/scene/cgfx-lighting.ts.
SOURCES = {'PrimaryColor', 'FragmentPrimaryColor', 'FragmentSecondaryColor', 'Texture0', 'Texture1', 'Texture2', 'Texture3', 'Previous', 'PreviousBuffer', 'Constant'}
OPERANDS = {'Color', 'Alpha', 'Red', 'Green', 'Blue', 'OneMinusColor', 'OneMinusAlpha', 'OneMinusRed', 'OneMinusGreen', 'OneMinusBlue'}
COMBINERS = {'Replace', 'Modulate', 'Add', 'AddSigned', 'Interpolate', 'Subtract', 'MultAdd', 'AddMult', 'Dot3RGB', 'Dot3RGBA'}
BLEND_FACTORS = {'Zero', 'One', 'SourceAlpha', 'OneMinusSourceAlpha', 'DestinationAlpha', 'OneMinusDestinationAlpha', 'SourceColor', 'OneMinusSourceColor', 'DestinationColor', 'OneMinusDestinationColor'}

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--code', type=Path, required=True, help='private exefs/code.bin')
p.add_argument('--pack', type=Path, required=True, help='private romfs/res/S.pack')
p.add_argument('--dotnet', type=Path, required=True)
p.add_argument('--exporter', type=Path, required=True, help='built Exporter.dll from scripts/firmware-cgfx')
p.add_argument('--output', type=Path, required=True, help='private directory for decompressed input, converted models and textures')
p.add_argument('--report', type=Path, required=True, help='private JSON report')
p.add_argument('--summary', type=Path, help='public summary JSON (hashes and features only)')
opt = p.parse_args()

code, pack = opt.code.read_bytes(), opt.pack.read_bytes()
assert hashlib.sha256(code).hexdigest() == CODE_SHA256, 'unexpected Sound code.bin'
assert hashlib.sha256(pack).hexdigest() == PACK_SHA256, 'unexpected Sound S.pack'
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)


def word(a): return struct.unpack_from('<I', code, a - BASE)[0]


def cstring(a):
    o = a - BASE
    if not 0 <= o < len(code): raise ValueError('outside code.bin')
    text = code[o:code.index(b'\0', o)].decode('ascii')
    if not text or not text.isprintable(): raise ValueError('not a printable string')
    return text


def ins(a):
    x = next(md.disasm(code[a - BASE:a - BASE + 4], a))
    text = f'{x.mnemonic} {x.op_str}'
    if x.mnemonic in ('add', 'sub') and ', pc, #' in x.op_str:
        imm = int(x.op_str.split('#')[1], 0)
        target = a + 8 + (imm if x.mnemonic == 'add' else -imm)
        try: return text, cstring(target)
        except (UnicodeDecodeError, ValueError): return text, hex(target)
    if x.mnemonic == 'ldr' and '[pc, #' in x.op_str:
        literal = word(a + 8 + int(x.op_str.split('#')[1].rstrip(']'), 0))
        try: return text, cstring(literal)
        except (UnicodeDecodeError, ValueError, IndexError): return text, hex(literal)
    if x.mnemonic == 'vldr' and '[pc, #' in x.op_str:
        literal = word(a + 8 + int(x.op_str.split('#')[1].rstrip(']'), 0))
        return text, struct.unpack('<f', struct.pack('<I', literal))[0]
    return text, None


facts = []


def fact(group, a, instruction, resolved=None):
    text, value = ins(a)
    assert text == instruction, f'{a:#x}: {text!r} != {instruction!r}'
    assert resolved is None or value == resolved, f'{a:#x}: {value!r} != {resolved!r}'
    facts.append({'group': group, 'address': f'{a:#x}', 'instruction': text, **({'resolves': value} if resolved is not None else {})})


# --- S.pack entries and conversion -------------------------------------------------
entries = []
for i in range(0, len(pack), 0x40):
    name = pack[i:i + 0x38].split(b'\0')[0]
    if not name: break
    offset, size = struct.unpack_from('<II', pack, i + 0x38)
    payload = pack[offset:offset + size]
    assert payload[0] == 0x11, f'{name!r} is not LZ11'
    entries.append({'name': name.decode(), 'offset': offset, 'size': size, 'compressedSha256': hashlib.sha256(payload).hexdigest(), 'payload': payload})
assert len(entries) == 12, len(entries)

opt.output.mkdir(parents=True, exist_ok=True)
models = []
for entry in entries:
    model_name = entry['name'].removesuffix('.LZ')
    stem = model_name.removesuffix('.bcmdl')
    scratch = opt.output / 'scratch' / stem
    source_dir = opt.output / 'source'
    source_dir.mkdir(parents=True, exist_ok=True)
    source = source_dir / entry['name']
    source.write_bytes(entry['payload'])
    decoded = decompress(entry['payload'])
    entry['decompressedSize'] = len(decoded)
    entry['decompressedSha256'] = hashlib.sha256(decoded).hexdigest()
    converted = opt.output / 'converted' / stem
    convert(source, converted, scratch, opt.dotnet, opt.exporter)
    model = json.loads((converted / 'model.json').read_text())
    assert model['sourceSha256'] == entry['decompressedSha256']
    assert model['compressedSourceSha256'] == entry['compressedSha256']
    del entry['payload']

    record = {'entry': entry['name'], 'model': model_name, **{k: entry[k] for k in ('offset', 'size', 'compressedSha256', 'decompressedSize', 'decompressedSha256')},
              'converter': model['converter'], 'spicaRevision': model['spicaRevision'],
              'textures': [{'name': t['name'], 'width': t['width'], 'height': t['height'], 'format': t['format'], 'sha256': t['sha256']} for t in model['textures']],
              'animations': {k: len(model[k]) for k in ('skeletalAnimations', 'materialAnimations', 'visibilityAnimations', 'cameraAnimations')},
              'cameras': [], 'lights': [], 'luts': [l.get('Name') for l in model['luts']], 'models': []}
    for camera in model['cameras']:
        if not isinstance(camera, dict): continue
        proj, view = camera.get('Projection') or {}, camera.get('View') or {}
        record['cameras'].append({'name': camera.get('Name'), 'projectionType': camera.get('ProjectionType'), 'viewType': camera.get('ViewType'),
                                  'aspectRatio': proj.get('AspectRatio'), 'fovY': proj.get('FOVY'), 'zNear': proj.get('ZNear'), 'zFar': proj.get('ZFar'),
                                  'translation': camera.get('TransformTranslation'), 'target': view.get('Target'), 'twist': view.get('Twist')})
    for light in model['lights']:
        if isinstance(light, dict): record['lights'].append({'name': light.get('Name'), 'type': light.get('Type'), 'nativeType': light.get('NativeType'), 'enabled': light.get('IsEnabled')})
    for m in model['models']:
        issues, notes = set(), set()
        vocabulary = {'sources': set(), 'usedSources': set(), 'operands': set(), 'combiners': set(), 'mappingTypes': set(), 'transformTypes': set(), 'bumpModes': set(), 'fragmentFlags': set(), 'blendFactors': set(), 'depthFunctions': set(), 'culling': set(), 'textureFormats': set()}
        for mat in m['materials']:
            params = mat['MaterialParams']
            for stage in params['TexEnvStages']:
                vocabulary['sources'].update(stage['Source']['Color'] + stage['Source']['Alpha'])
                # Replace consumes one operand, two-input combiners two, Interpolate/MultAdd/AddMult three.
                for channel in ('Color', 'Alpha'):
                    combiner = stage['Combiner'][channel]
                    consumed = 1 if combiner == 'Replace' else 3 if combiner in ('Interpolate', 'MultAdd', 'AddMult') else 2
                    vocabulary['usedSources'].update(stage['Source'][channel][:consumed])
                vocabulary['operands'].update(stage['Operand']['Color'] + stage['Operand']['Alpha'])
                vocabulary['combiners'].update((stage['Combiner']['Color'], stage['Combiner']['Alpha']))
                if stage['Combiner']['Alpha'].startswith('Dot3'): issues.add('alpha Dot3 combiner')
            bound = sum(1 for key in ('Texture0Name', 'Texture1Name', 'Texture2Name') if mat[key])
            for coord in params['TextureCoords'][:bound]:
                vocabulary['mappingTypes'].add(coord['MappingType']); vocabulary['transformTypes'].add(coord['TransformType'])
                if coord['MappingType'] != 'UvCoordinateMap': issues.add(f"{coord['MappingType']} texture coordinates (renderer applies UV mapping only)")
            vocabulary['bumpModes'].add(params.get('BumpMode'))
            if params.get('BumpMode') not in (None, 'NotUsed'): issues.add(f"{params['BumpMode']} bump mapping (cgfx-lighting.ts falls back to the approximation)")
            flags = str(params.get('FragmentFlags', '0'))
            if flags != '0': vocabulary['fragmentFlags'].update(f.strip() for f in flags.split(','))
            for key in ('Reflection', 'GeoFactor', 'Dist1'):
                if key in flags: issues.add(f'{key} fragment lighting (approximate)')
            blend = params['BlendFunction']
            vocabulary['blendFactors'].update((blend['ColorSrcFunc'], blend['ColorDstFunc'], blend['AlphaSrcFunc'], blend['AlphaDstFunc']))
            if blend['ColorEquation'] != 'FuncAdd' or blend['AlphaEquation'] != 'FuncAdd': issues.add(f"blend equation {blend['ColorEquation']}/{blend['AlphaEquation']}")
            if params['ColorOperation']['BlendMode'] != 'Blend': issues.add(f"color operation {params['ColorOperation']['BlendMode']}")
            vocabulary['depthFunctions'].add(f"{'on' if params['DepthColorMask']['Enabled'] else 'off'}/{params['DepthColorMask']['DepthFunc']}")
            vocabulary['culling'].add(params['FaceCulling'])
            if params.get('StencilTest', {}).get('Enabled'): notes.add('authored stencil test')
        reads_lighting = any(s in vocabulary['usedSources'] for s in ('FragmentPrimaryColor', 'FragmentSecondaryColor'))
        if reads_lighting: notes.add('consumed combiner operands read fragment lighting colors' + ('; the resource has no light, so the renderer uses its fixed approximation' if not record['lights'] else ''))
        for src in vocabulary['sources'] - SOURCES: issues.add(f'PICA source {src}')
        for op in vocabulary['operands'] - OPERANDS: issues.add(f'PICA operand {op}')
        for comb in vocabulary['combiners'] - COMBINERS: issues.add(f'PICA combiner {comb}')
        for factor in vocabulary['blendFactors'] - BLEND_FACTORS: notes.add(f'blend factor {factor} falls back to SrcAlpha/OneMinusSrcAlpha')
        vocabulary['textureFormats'] = {t['format'] for t in model['textures']}
        skinning, primitives, bones_used = set(), set(), set()
        for mesh in m['meshes']:
            for sub in mesh['submeshes']:
                skinning.add(sub['skinning']); primitives.add(sub['primitive']); bones_used.update(sub['bones'])
                if sub['primitive'] != 'Triangles': issues.add(f"primitive {sub['primitive']}")
        billboards = [(b['Name'], b.get('NativeBillboardMode')) for b in m['skeleton'] if b.get('NativeBillboardMode') not in (None, 0)]
        for name, mode in billboards:
            if mode != 5: issues.add(f'billboard mode {mode} on {name}')
        # Bind-pose placement of the mesh-bound bones. Bones authored at one shared
        # transform can only be separated by runtime code, so that bind pose is not a
        # displayable resting pose.
        placements = {}
        for index in sorted(bones_used):
            bone = m['skeleton'][index]
            key = tuple(round(bone[k][axis], 4) for k in ('Translation', 'Rotation', 'Scale') for axis in 'XYZ')
            placements.setdefault(key, []).append(bone['Name'])
        shared = [{'bones': names, 'translation': [round(v, 4) for v in key[:3]]} for key, names in placements.items() if len(names) > 1]
        record['models'].append({'name': m['name'], 'meshes': len(m['meshes']), 'materials': [mat['Name'] for mat in m['materials']], 'bones': len(m['skeleton']),
                                 'bonesBoundByMeshes': len(bones_used), 'distinctBindPlacements': len(placements), 'sharedBindPlacements': shared,
                                 'skinning': sorted(skinning), 'primitives': sorted(primitives), 'billboards': billboards,
                                 'vocabulary': {k: sorted(str(v) for v in vals) for k, vals in vocabulary.items()},
                                 'rendererSupport': 'supported' if not issues else 'unsupported-or-approximate', 'issues': sorted(issues), 'notes': sorted(notes)})
    models.append(record)

# --- Executable facts -----------------------------------------------------------------
# Each model path is referenced only from its own class code (pc-relative), never from a
# table: the executable, not a layout or clip, decides which model is loaded.
path_refs = {}
for a in range(BASE, BASE + 0x1f0000, 4):
    x = next(md.disasm(code[a - BASE:a - BASE + 4], a), None)
    if x is None or x.mnemonic != 'add' or not x.op_str.startswith('r0, pc, #'): continue
    target = a + 8 + int(x.op_str.split('#')[1], 0)
    try: s = cstring(target)
    except (UnicodeDecodeError, ValueError): continue
    if s.startswith('res/S--'): path_refs.setdefault(s, []).append(f'{a:#x}')
literal_refs = {}
for a in range(BASE, BASE + len(code) - 3, 4):
    w = word(a)
    if 0x100000 <= w < BASE + len(code):
        try: s = cstring(w)
        except (UnicodeDecodeError, ValueError): continue
        if s.startswith('res/S--'): literal_refs.setdefault(s, []).append(f'{a:#x}')
for record in models:
    name = 'res/S--' + record['model']
    record['executableReferences'] = {'pcRelative': path_refs.get(name, []), 'literalPool': literal_refs.get(name, [])}
    assert record['executableReferences']['pcRelative'] or record['executableReferences']['literalPool'], name

# Visualiser factory 0x266300(host, index): deletes the current object, stores the index at
# host+0x148 and dispatches 0..8 through a jump table; each case allocates one class and
# writes its vtable. Index 0 creates nothing, index 8 enables the layout at host+0x14c.
fact('factory', 0x26634c, 'cmp r5, #9')
fact('factory', 0x266350, 'str r5, [r4, #0x148]')
fact('factory', 0x266354, 'ldrlo pc, [pc, r5, lsl #2]')
fact('factory', 0x266344, 'str r7, [r4, #0xcc]')
jump_table = [word(0x26635c + 4 * i) for i in range(9)]
assert jump_table == [0x266900, 0x266380, 0x266400, 0x266480, 0x26651c, 0x266818, 0x26667c, 0x266708, 0x2668f0], [hex(v) for v in jump_table]
fact('factory', 0x2668fc, 'b #0x266140')
fact('factory', 0x26618c, 'bic r1, r1, #0x1e')


def case_vtable(entry):
    """First .data literal stored through `str r0, [r5]` after the allocation of a case."""
    a = entry
    for _ in range(64):
        x = next(md.disasm(code[a - BASE:a - BASE + 4], a))
        if x.mnemonic == 'ldr' and x.op_str.startswith('r0, [pc, #'):
            literal = word(a + 8 + int(x.op_str.split('#')[1].rstrip(']'), 0))
            for b in range(a + 4, a + 20, 4):
                y = next(md.disasm(code[b - BASE:b - BASE + 4], b))
                if y.mnemonic == 'str' and y.op_str == 'r0, [r5]': return literal
                if y.op_str.startswith('r0,'): break  # r0 rewritten before any store
        a += 4
    raise AssertionError(f'no vtable store in case {entry:#x}')


def vtable_model(vtable):
    """Model path named pc-relatively by any function in the first eight vtable slots."""
    for slot in range(8):
        function = word(vtable + 4 * slot)
        if not BASE <= function < BASE + 0x1f0000: continue
        for a in range(function, function + 0x600, 4):
            x = next(md.disasm(code[a - BASE:a - BASE + 4], a), None)
            if x is None or x.mnemonic != 'add' or not x.op_str.startswith('r0, pc, #'): continue
            try: s = cstring(a + 8 + int(x.op_str.split('#')[1], 0))
            except (UnicodeDecodeError, ValueError): continue
            if s.startswith('res/S--'): return s
    return None


cases = []
for index, entry in enumerate(jump_table):
    if index == 0:
        cases.append({'index': 0, 'entry': f'{entry:#x}', 'kind': 'none', 'note': 'no visualiser object; host+0xcc stays null and the host+0x14c layout stays disabled'})
    elif index == 8:
        cases.append({'index': 8, 'entry': f'{entry:#x}', 'kind': 'layout', 'note': 'branches to 0x266140, which enables the layout object at host+0x14c; no CGFX model class'})
    else:
        vtable = case_vtable(entry)
        cases.append({'index': index, 'entry': f'{entry:#x}', 'kind': 'cgfx-class', 'vtable': f'{vtable:#x}', 'model': vtable_model(vtable)})
expected = {1: 'res/S--S_Vis_Span_U.bcmdl', 2: 'res/S--S_Vis_Wave_U.bcmdl', 3: 'res/S--S_Vis_ExBike_U.bcmdl', 4: None, 5: 'res/S--S_Vis_PlayYan_U.bcmdl', 6: 'res/S--S_Vis_Lifting_U.bcmdl', 7: 'res/S--S_Vis_Clock_U.bcmdl'}
for case in cases:
    if case['kind'] == 'cgfx-class': assert case['model'] == expected[case['index']], case
fact('factory', 0x252bf0, 'add r0, pc, #0x128', 'res/S--S_Vis_Span_U.bcmdl')
fact('factory', 0x254438, 'add r0, pc, #0x190', 'res/S--S_Vis_Wave_U.bcmdl')
fact('factory', 0x256dd0, 'add r0, pc, #0x394', 'res/S--S_Vis_ExBike_U.bcmdl')
fact('factory', 0x25e200, 'add r0, pc, #0x39c', 'res/S--S_Vis_Lifting_U.bcmdl')
fact('factory', 0x2612b4, 'add r0, pc, #0x2e4', 'res/S--S_Vis_Clock_U.bcmdl')
fact('factory', 0x2610ec, 'add r0, pc, #0xd0', 'res/S--S_Vis_Clock_U_Cogwheel.bcmdl')
fact('factory', 0x264c44, 'add r0, pc, #0x288', 'res/S--S_Vis_PlayYan_U.bcmdl')
assert [word(a) for a in (0x372578, 0x37257c, 0x372580, 0x372584)] == [0x3246d2, 0x3246f5, 0x324718, 0x32473b]
cases[6]['note'] = 'the case also allocates helper vtables 0x321910 and 0x321924'
cases[7]['note'] = 'the case also allocates helper vtables 0x321964 and 0x321958; slot function 0x260e8c names S_Vis_Clock_U_Cogwheel'
cases[5]['note'] = 'the four PlayYan star paths sit in a literal table at 0x372578'
cases[4]['note'] = 'unidentified: no res/S-- path or layout name in its vtable functions (0x25b90c-0x25bcd8); allocation 0xe2ac bytes'

# Selection: L/R cycle 0x1de8c8(app, delta) wraps the signed index byte modulo 9, skips
# index 8 unless host+0x260 > 0, and applies it through 0x266d04 -> 0x266300.
fact('cycle', 0x1de8d0, 'ldr r2, [r0, #0x13c]')
fact('cycle', 0x1de8d4, 'ldrb r0, [r2]')
fact('cycle', 0x1de8d8, 'add r0, r0, r1')
fact('cycle', 0x1de8dc, 'sxtb r0, r0')
fact('cycle', 0x1de8ec, 'addlt r0, r0, #9')
fact('cycle', 0x1de8f4, 'cmp r0, #9')
fact('cycle', 0x1de8fc, 'sub r0, r0, #9')
fact('cycle', 0x1de910, 'cmp r0, #8')
fact('cycle', 0x1de91c, 'ldr r0, [r0, #0x260]')
fact('cycle', 0x1de96c, 'cmp r0, #3')
fact('cycle', 0x1de970, 'cmpne r0, #6')
fact('cycle', 0x1de9a4, 'ldrsb r1, [r0]')
fact('cycle', 0x1de9ac, 'bl #0x266d04')
fact('cycle', 0x266d0c, 'b #0x266300')
fact('cycle', 0x237d3c, 'mvn r1, #0')
fact('cycle', 0x237d44, 'bl #0x1de8c8')
fact('cycle', 0x237d54, 'mov r1, #0')
fact('cycle', 0x237d5c, 'bl #0x1de8c8')
fact('cycle', 0x1c4f68, 'mov r1, #0')
fact('cycle', 0x1c4f6c, 'bl #0x266300')
# The index byte lives at settings singleton [0x3771ec] + 0x10b4; the application object
# (0x15f68 bytes, constructor 0x238cb8) keeps a pointer to it at +0x13c.
fact('index', 0x28feac, 'ldr r0, [pc, #0x34]', '0x15f68')
fact('index', 0x28fec0, 'b #0x238cb8')
fact('index', 0x238ce4, 'ldr r5, [pc, #0x5b8]', '0x3771ec')
fact('index', 0x238dd4, 'ldr r1, [r5]')
fact('index', 0x238dd8, 'add r1, r1, #0x1000')
fact('index', 0x238ddc, 'add r1, r1, #0xb4')
fact('index', 0x238de0, 'str r1, [r0, #0x13c]')
fact('index', 0x2bbca8, 'ldr r0, [pc, #0x88]', '0x117c')
fact('index', 0x2bbd08, 'ldr r0, [pc, #0x38]', '0x320174')
fact('index', 0x2bbd14, 'str r0, [r4]')
fact('index', 0x2bbd30, 'str r4, [r6]')
# Singleton vtable slot 5 is a this+0x24 thunk into the save-block defaults initializer
# 0x1908e0, which writes 1 to block+0x1090 = singleton+0x10b4. The same block offsets
# +0x92/+0x93 are read elsewhere through singleton+0x1000+0x24, and the two sub-objects
# it assigns (+0xc64, +0xe78) are the ones the singleton constructor builds at +0xc88
# and +0xe9c. Default visualiser index = 1 = case 1 = S_Vis_Span_U.
assert word(0x320188) == 0x1908d8
fact('default', 0x1908d8, 'add r0, r0, #0x24')
fact('default', 0x1908dc, 'mov r0, r0')
fact('default', 0x1908e0, 'push {r4, r5, r6, r7, r8, sb, sl, lr}')
fact('default', 0x1908e8, 'mov r7, #1')
fact('default', 0x1908f8, 'mov r6, #0')
fact('default', 0x19096c, 'add r0, r4, #0xc00')
fact('default', 0x190974, 'add r0, r0, #0x64')
fact('default', 0x190998, 'add r0, r4, #0xc00')
fact('default', 0x1909a0, 'add r0, r0, #0x278')
fact('default', 0x1909a8, 'add r5, r4, #0x1000')
fact('default', 0x1909ec, 'strb r7, [r5, #0x90]')
fact('default', 0x1909f0, 'strb r6, [r5, #0x91]')
fact('default', 0x1909f8, 'strb r6, [r5, #0x92]')
fact('default', 0x190a04, 'strb r6, [r5, #0x93]')
fact('default', 0x2bbd18, 'add r0, r4, #0xc00')
fact('default', 0x2bbd1c, 'add r0, r0, #0x88')
fact('default', 0x2bbd0c, 'add r5, r4, #0xc00')
fact('default', 0x2bbd10, 'add r5, r5, #0x84')
fact('default', 0x2bbd24, 'add r0, r5, #0x218')
fact('default', 0x1ec918, 'ldr r0, [sl]')
fact('default', 0x1ec91c, 'add r0, r0, #0x1000')
fact('default', 0x1ec920, 'add r0, r0, #0x24')
fact('default', 0x1ec924, 'ldrsb r1, [r0, #0x92]')
fact('default', 0x1ec930, 'ldrsb r5, [r0, #0x93]')

# S_Back_U is the global entry room. The 0x272xxx +0x8c matches below
# belong to a different layout owner; keep them only as a regression record.
# Actual global flags are updated individually at 0x235e00..0x235e80.
fact('background', 0x192038, 'ldr r1, [pc, #0x74]', '0x31fa58')
fact('background', 0x19203c, 'str r1, [r0], #0x40')
fact('background', 0x191f10, 'add r0, pc, #0x98', 'res/S--S_Back_U.bcmdl')
fact('background', 0x191f64, 'add r0, pc, #0x44', 'res/S--S_Back_U.bcmdl')
fact('background', 0x191f60, 'vldr s0, [pc, #0x64]', 11.5)
fact('background', 0x191f6c, 'vldr s0, [pc, #0x5c]', 0.5)
fact('background', 0x1c674c, 'blne #0x192030')
fact('background', 0x1c6754, 'str r0, [r4, #0x8c]')
fact('background', 0x1c67ac, 'ldr r0, [r4, #0x8c]')
fact('background', 0x1c67b4, 'orr r1, r1, #0x1e')
fact('background', 0x272874, 'ldr r4, [pc, #0x308]', '0x372190')
fact('background', 0x2729a0, 'ldr r1, [r1, #0x70]')
fact('background', 0x2729b0, 'ldr r0, [r7, #0x8c]')
fact('background', 0x2729b8, 'bic r1, r1, #0x1e')
fact('background', 0x2729d8, 'ldr r0, [r7, #0x8c]')
fact('background', 0x2729e0, 'orr r1, r1, #0x1e')
fact('background', 0x27202c, 'ldr r0, [r5, #0x8c]')
fact('background', 0x272034, 'bic r1, r1, #0x1e')
fact('background', 0x271fd4, 'ldr r4, [pc, #0xb8]', '0x372190')
fact('background', 0x2903a0, 'ldr r0, [pc]')
assert word(0x2903a8) == 0x372190
enable_sites = []
for a in range(BASE, BASE + 0x1f0000, 4):
    x = next(md.disasm(code[a - BASE:a - BASE + 4], a), None)
    if x is None or x.mnemonic != 'ldr' or not x.op_str.endswith('#0x8c]'): continue
    for b in range(a + 4, a + 20, 4):
        y = next(md.disasm(code[b - BASE:b - BASE + 4], b), None)
        if y and y.mnemonic in ('bic', 'orr') and y.op_str.endswith('#0x1e'):
            enable_sites.append({'load': f'{a:#x}', 'toggle': f'{b:#x}', 'operation': 'enable' if y.mnemonic == 'bic' else 'disable'}); break
assert {s['toggle'] for s in enable_sites} == {'0x1c67b4', '0x272034', '0x2723e0', '0x2729b8', '0x2729e0'}, enable_sites
cec_vtables = []
for a in range(BASE + 0x1f0000, BASE + len(code) - 3, 4):
    if word(a) != 0x2903a0: continue
    vtable = a - 8
    literal_sites = [b for b in range(BASE, BASE + 0x1f0000, 4) if word(b) == vtable]
    names = set()
    for site in literal_sites:
        for b in range(site - 0x400, site + 0x400, 4):
            y = next(md.disasm(code[b - BASE:b - BASE + 4], b), None)
            if y and y.mnemonic == 'add' and ', pc, #' in y.op_str:
                try: s = cstring(b + 8 + int(y.op_str.split('#')[1], 0))
                except (UnicodeDecodeError, ValueError): continue
                if s.startswith('S_Cec'): names.add(s)
    cec_vtables.append({'vtable': f'{vtable:#x}', 'predicate': f'{word(vtable + 0x70):#x}', 'layouts': sorted(names)})
assert len(cec_vtables) == 8 and all(v['layouts'] for v in cec_vtables), cec_vtables

span = next(m for m in models if m['model'] == 'S_Vis_Span_U.bcmdl')['models'][0]
assert span['sharedBindPlacements'] == [{'bones': [f'LightLine{i:02d}' for i in range(32)], 'translation': [0, -45, 0]}], span['sharedBindPlacements']
no_clips = all(all(v == 0 for v in m['animations'].values()) for m in models)
summary = {
    'schema': 1, 'title': TITLE, 'firmware': '10.7.0-32E',
    'sources': {'codeSha256': CODE_SHA256, 'packSha256': PACK_SHA256, 'packPath': 'romfs/res/S.pack', 'converter': models[0]['converter'], 'spicaRevision': models[0]['spicaRevision']},
    'models': [{k: v for k, v in m.items() if k not in ('converter', 'spicaRevision')} for m in models],
    'embeddedAnimations': 0 if no_clips else sum(sum(m['animations'].values()) for m in models),
    'visualiserFactory': {'function': '0x266300', 'indexField': 'host+0x148', 'jumpTable': '0x26635c', 'cases': cases,
                          'cycle': {'function': '0x1de8c8', 'modulo': 9, 'index8Condition': 'host+0x260 > 0', 'checkedIndices': [3, 6], 'callers': {'0x237d44': -1, '0x237d5c': 0, '0x1c4f6c (direct factory)': 0}},
                          'indexStorage': {'settingsSingleton': '[0x3771ec] (0x117c bytes, constructor 0x2bbca4, vtable 0x320174)', 'offset': '0x10b4', 'applicationPointer': 'app+0x13c (constructor 0x238cb8)',
                                           'defaultsInitializer': '0x1908e0 through the this+0x24 thunk 0x1908d8 in vtable slot 5 (0x320188)', 'defaultValue': 1, 'defaultCase': 'S_Vis_Span_U.bcmdl',
                                           'caveat': 'the saved value may differ once the user has cycled visualisers; the save-load path was not traced'}},
    'upperBackground': {'model': 'S_Back_U.bcmdl', 'objectConstructor': '0x192030', 'vtable': '0x31fa58', 'loader': '0x191e98', 'cameraDistance': 11.5, 'cameraSecondConstant': 0.5,
                        'createdDisabledBy': '0x1c65c8 (app+0x8c)',
                        'unrelatedSameOffsetMatches': {'toggleSites': enable_sites, 'typeOwners': cec_vtables, 'layoutConstructor': '0x27231c..0x2723ac'},
                        'activeWriter': '0x235e00..0x235e80', 'modePredicate': '0x28fcf8',
                        'evidence': 'sound-room-replay.json',
                        'conclusion': 'S_Back_U is the captured entry room; the former StreetPass-only inference confused two owners with the same field offset'},
    'restingPose': {
        'status': 'unproven',
        'assetDefinedPose': 'bind pose only; no skeletal, material, visibility or camera clip exists in any of the 12 resources',
        'defaultVisualiser': 'S_Vis_Span_U (index 1) on default settings',
        'defaultBindPose': 'not displayable: LightLine00-31 share one bind transform (0,-45,0) and LightLineSide sits at (0,-40,0); the Span class places the bars at runtime',
        'runtimeDrivers': 'bone transforms are written by the visualiser classes at runtime; audio coupling and the silent placement were not traced',
        'backgroundVisibility': 'Entry room visibility is separately traced in sound-room-replay.json; playback visualiser placement remains unproven'},
    'nextGate': [
        'Trace the Span class (vtable 0x321890; slots 0x252b70, 0x252670, 0x251b2c) for the bar layout and its silent-audio heights before drawing any resting pose.',
        'Confirm the save-load path keeps byte +0x1090 (visualiser index) or record how it is restored, so the default remains Span for a fresh save.',
        'Add a stock-screen upper CGFX path (scene-owned renderer, embedded Aim camera, Canvas transfer) before any Sound model is composed; the HOME banner path is hardwired to HOME resources.',
        'Renderer additions are needed only for Clock (AsBump lighting) and ExBike/Lifting (ProjectionMap coordinates); Span, Wave, PlayYan and the stars are within the current PICA support.'],
}
report = {**summary, 'facts': facts, 'output': str(opt.output)}
opt.report.parent.mkdir(parents=True, exist_ok=True)
opt.report.write_text(json.dumps(report, indent=2) + '\n')
if opt.summary:
    opt.summary.parent.mkdir(parents=True, exist_ok=True)
    opt.summary.write_text(json.dumps(summary, indent=2, sort_keys=True) + '\n')
print(json.dumps({'facts': len(facts), 'models': len(models), 'embeddedAnimations': summary['embeddedAnimations'],
                  'supported': [m['model'] for m in models if all(x['rendererSupport'] == 'supported' for x in m['models'])],
                  'unsupportedOrApproximate': [m['model'] for m in models if any(x['rendererSupport'] != 'supported' for x in m['models'])]}))
