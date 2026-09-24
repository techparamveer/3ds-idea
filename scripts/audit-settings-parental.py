"""Read Settings scene records and static parental tables; never execute firmware."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from unpack_home_resources import decompress, unpack_darc

TABLE_HASH = '1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794'
CODE_HASH = '1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5'
FIELDS = (['body', 'secondary'] + [f'footerLabel{i}' for i in range(3)]
          + [f'optionLabel{i}' for i in range(8)] + [f'footerTarget{i}' for i in range(3)]
          + [f'optionTarget{i}' for i in range(8)]
          + ['lowerLayout', 'controller', 'upperCommon', 'upperLayout', 'icon', 'title', 'upperBody'])

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def record(raw):
    # Original loader 0x234398 copies 0x24 header bytes, then reads 31 fields.
    # A field consumes up to 16 bytes OR one newline. A full 16-byte field
    # does not consume another byte; splitlines() corrupts adjacent full fields.
    cursor, fields = 0x24, {}
    for name in FIELDS:
        value = bytearray()
        for _ in range(16):
            if cursor >= len(raw):
                raise ValueError(f'Truncated scene at {name}')
            byte = raw[cursor]
            cursor += 1
            if byte == 10:
                break
            value.append(byte)
        fields[name] = value.decode('ascii')
    if raw[cursor:].strip(b'\0\r\n'):
        raise ValueError('Unexpected trailing scene bytes')
    return {'sha256': digest(raw), 'header': raw[:0x24].hex(), 'fields': fields}

def audit(content, converted):
    table = (content / 'romfs/table_LZ.bin').read_bytes()
    code = (content / 'exefs/code.bin').read_bytes()
    if digest(table) != TABLE_HASH or digest(code) != CODE_HASH:
        raise ValueError('This audit is address-specific to the supplied Settings content')
    members = unpack_darc(decompress(table))
    names_raw = members['mset_table_file_name.bin']
    names = [names_raw[i:i+16].split(b'\0')[0].decode('ascii') for i in range(0, len(names_raw), 16)]
    records = {}
    for name, raw in sorted(members.items()):
        if name.startswith(('pare_', 'pr_dlg_')):
            item = record(raw)
            item['id'] = names.index(name.removesuffix('.bin')) + 1
            records[name.removesuffix('.bin')] = item
    messages = json.loads((converted / 'message_EU.json').read_text())['messages']['mset']
    def text(label):
        return messages['messages'][messages['labels'][label]]['text']
    def cstring(address):
        return code[address-0x100000:].split(b'\0', 1)[0].decode('ascii')
    variants = []
    for kind, label_base, target_base, count in [('default', 0x26b3b0, 0x26a71c, 12), ('mode1', 0x26b36c, 0x26a80c, 9), ('mode2', 0x26b390, 0x26a8c0, 8)]:
        rows = []
        for i in range(count):
            label = cstring(struct.unpack_from('<I', code, label_base-0x100000+i*4)[0])
            rows.append({'label': label, 'text': text(label), 'target': cstring(target_base+i*20)})
        variants.append({'mode': kind, 'labelTable': hex(label_base), 'targetTable': hex(target_base), 'rowsBeforeRuntimeFiltering': rows})
    labels = {value for item in records.values() for value in item['fields'].values() if value in messages['labels']}
    layouts = {}
    for pack, wanted in [('layout', ['StartChild_D_00', 'PareFact_D_00', 'PareSelect_D_00', 'PareMiive_D_00', 'PareRtng_D_00']), ('up', ['PareFact_U_00', 'PareRtng_U_00']), ('button', ['B_PareSB', 'T_OnOff'])]:
        data = json.loads((converted / f'{pack}.json').read_text())
        for name in wanted:
            panes = []
            def walk(children):
                for pane in children:
                    panes.append({key: pane[key] for key in ['name', 'translation', 'size', 'text'] if key in pane})
                    walk(pane.get('children', []))
            walk(data['layouts'][name]['roots'])
            layouts[name] = {'pack': pack, 'panes': panes, 'clips': [key for key in data['animations'] if key.startswith(name+'_')]}
    return {'titleId': '0004001000022000', 'contentId': '0000003d', 'tableSha256': digest(table), 'codeSha256': digest(code), 'records': records, 'messages': {label: text(label) for label in sorted(labels)}, 'restrictionVariants': variants, 'layouts': layouts, 'limits': ['Static tables are subject to executable state-dependent mutation.', 'Runtime filtering mode and persisted parental data are not supplied by RomFS.', 'No firmware, PIN, network, configuration write or browser verification performed.']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--content', type=Path, required=True)
    parser.add_argument('--converted', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if not all(p.is_absolute() for p in [args.content, args.converted, args.report]):
        parser.error('Use absolute paths')
    result = audit(args.content, args.converted)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2, ensure_ascii=False)+'\n')
    print(json.dumps({'scenes': len(result['records']), 'messages': len(result['messages']), 'layouts': len(result['layouts']), 'report': str(args.report)}))
