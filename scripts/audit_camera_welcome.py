#!/usr/bin/env python3
"""Read-only Camera welcome descriptor audit; no emulation or firmware writes."""
import argparse
import hashlib
import json
from pathlib import Path
import struct


def audit(guide, messages):
    digest = hashlib.sha256(guide).hexdigest()
    assert digest == 'a82c23b20f1638ff6c6f4acf8aa9c26cb012bbb184965281fa1ca69a6fbdc293'
    assert guide[:4] == b'GBIN'
    offset, records = 8, []
    for _ in range(struct.unpack_from('<I', guide, 4)[0]):
        assert guide[offset:offset + 4] == b'GUID'
        count = struct.unpack_from('<I', guide, offset + 4)[0]
        title = guide[offset + 0x20:offset + 0x30].split(b'\0')[0].decode('ascii')
        pages = []
        for index in range(count):
            start = offset + 0x30 + index * 0x14
            pages.append({'label': guide[start:start + 16].split(b'\0')[0].decode('ascii'),
                          'mode': struct.unpack_from('<I', guide, start + 16)[0]})
        records.append({'title': title, 'pages': pages})
        offset += 0x30 + count * 0x14
    assert offset == len(guide)
    welcome = records[0]
    assert welcome == {'title': 'T_003', 'pages': [
        {'label': 'D_003_0', 'mode': 2}, {'label': 'D_003_1', 'mode': 3},
        {'label': 'D_003_2', 'mode': 3}, {'label': 'D_003_3', 'mode': 3},
        {'label': 'D_003_4', 'mode': 4}]}
    bank = messages['messages']['P_tips']
    illustrations = []
    for page in welcome['pages']:
        tokens = bank['messages'][bank['labels'][page['label']]]['tokens']
        token = next((t for t in tokens if t.get('group') == 4 and t.get('type') == 1), None)
        if token:
            data = bytes.fromhex(token['arguments'])
            assert int.from_bytes(data[:2], 'little') == len(data[2:])
            illustrations.append(data[2:].decode('utf-16le'))
        else:
            illustrations.append(None)
    assert illustrations == [None, None, 'P_Guid05_U', 'P_Guid01_U', 'P_Guid02_U']
    return {'guideSha256': digest, 'recordCount': len(records), 'welcome': welcome,
            'illustrations': illustrations,
            'scope': 'Descriptor and message bindings only; native lifecycle, saved first-run flags and pixels are not established.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--guide', type=Path, required=True)
    parser.add_argument('--messages', type=Path, required=True)
    args = parser.parse_args()
    assert args.guide.is_absolute() and args.messages.is_absolute()
    print(json.dumps(audit(args.guide.read_bytes(), json.loads(args.messages.read_text())), indent=2))
