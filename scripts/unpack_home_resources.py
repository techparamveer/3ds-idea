"""Unpack decrypted HOME Menu LZ10/LZ11/DARC data; never decrypt or execute it."""
import argparse
import hashlib
import json
from pathlib import Path
import struct

LIMIT = 64 * 1024 * 1024


def decompress(data, limit=LIMIT):
    if len(data) < 4 or data[0] not in (0x10, 0x11):
        raise ValueError('Expected Nintendo LZ10 or LZ11')
    kind, size, pos = data[0], int.from_bytes(data[1:4], 'little'), 4
    if not size and kind == 0x11:
        if len(data) < 8:
            raise ValueError('Truncated extended size')
        size, pos = int.from_bytes(data[4:8], 'little'), 8
    if not 0 < size <= limit:
        raise ValueError('Invalid or excessive decompressed size')
    out = bytearray()

    def byte():
        nonlocal pos
        if pos >= len(data):
            raise ValueError('Truncated LZ stream')
        value = data[pos]
        pos += 1
        return value

    while len(out) < size:
        flags = byte()
        for bit in range(7, -1, -1):
            if len(out) == size:
                break
            if not flags & (1 << bit):
                out.append(byte())
                continue
            a, b = byte(), byte()
            indicator = a >> 4
            if kind == 0x10:
                length, distance = indicator + 3, ((a & 15) << 8 | b) + 1
            elif indicator == 0:
                c = byte()
                length, distance = ((a & 15) << 4 | b >> 4) + 0x11, ((b & 15) << 8 | c) + 1
            elif indicator == 1:
                c, d = byte(), byte()
                length = ((a & 15) << 12 | b << 4 | c >> 4) + 0x111
                distance = ((c & 15) << 8 | d) + 1
            else:
                length, distance = indicator + 1, ((a & 15) << 8 | b) + 1
            if distance > len(out) or len(out) + length > size:
                raise ValueError('Invalid LZ back-reference')
            for _ in range(length):
                out.append(out[-distance])
    return bytes(out)


def unpack_darc(data):
    if len(data) < 40 or len(data) > LIMIT:
        raise ValueError('Invalid DARC length')
    magic, bom, header, version, size, table, table_size, payload = struct.unpack_from('<4sHHIIIII', data)
    if magic != b'darc' or bom != 0xfeff or header != 28 or size != len(data):
        raise ValueError('Expected little-endian DARC')
    if table < header or table_size < 12 or table + table_size > payload or payload > size:
        raise ValueError('Invalid DARC table bounds')
    root_name, parent, count = struct.unpack_from('<III', data, table)
    if root_name >> 24 != 1 or parent != 0 or not 1 <= count <= 65536 or count * 12 > table_size:
        raise ValueError('Invalid DARC root')
    names = table + count * 12
    end_names = table + table_size
    files, seen = {}, set()
    stack = [(count, '', 0)]
    for index in range(1, count):
        while index >= stack[-1][0]:
            stack.pop()
        raw, offset, length = struct.unpack_from('<III', data, table + index * 12)
        name_at = names + (raw & 0xffffff)
        if raw >> 24 not in (0, 1) or name_at < names or name_at >= end_names or name_at % 2:
            raise ValueError('Invalid DARC name offset/type')
        end = name_at
        while end + 2 <= end_names and data[end:end + 2] != b'\0\0':
            end += 2
        if end + 2 > end_names:
            raise ValueError('Unterminated DARC name')
        name = data[name_at:end].decode('utf-16-le')
        if not name or name in ('.', '..') or any(c in name for c in '/\\:') or any(ord(c) < 32 for c in name):
            raise ValueError('Unsafe DARC path component')
        path = stack[-1][1] + name
        if path.casefold() in seen:
            raise ValueError('Duplicate DARC path')
        seen.add(path.casefold())
        if raw >> 24:
            if not index < length <= stack[-1][0] or offset != stack[-1][2] or len(stack) >= 64:
                raise ValueError('Invalid DARC directory range/parent')
            stack.append((length, path + '/', index))
        else:
            if offset < payload or offset + length > size:
                raise ValueError('DARC file outside payload')
            files[path] = data[offset:offset + length]
    return files


def identify(data):
    return {b'CLYT': 'layout', b'CLAN': 'animation', b'CFNT': 'font',
            b'MsgS': 'message', b'CGFX': 'model', b'darc': 'archive'}.get(bytes(data[:4]),
                'texture' if len(data) >= 40 and data[-40:-36] == b'CLIM' else 'unknown')


def inspect_resource(data):
    """Read section boundaries, preserving unknown sections without guessing fields."""
    result = {'kind': identify(data), 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    if result['kind'] in ('layout', 'animation'):
        if len(data) < 20:
            raise ValueError('Truncated layout/animation header')
        magic, bom, header, version, size, count, reserved = struct.unpack_from('<4sHHIIHH', data)
        if bom != 0xfeff or header < 20 or size != len(data) or header > size:
            raise ValueError('Invalid layout/animation header')
        sections, at = [], header
        for _ in range(count):
            if at + 8 > size:
                raise ValueError('Truncated resource section')
            tag, length = struct.unpack_from('<4sI', data, at)
            if length < 8 or at + length > size:
                raise ValueError('Invalid resource section size')
            sections.append({'tag': tag.decode('ascii', errors='replace'), 'offset': at, 'size': length})
            at += length
        if at != size:
            raise ValueError('Unaccounted resource bytes')
        result.update(version=version, sections=sections)
    return result


def prepare(data):
    if len(data) > LIMIT:
        raise ValueError('Input exceeds 64 MiB')
    decoded = decompress(data) if data[:1] in (b'\x10', b'\x11') else data
    files = unpack_darc(decoded)
    return files, {'schema': 1, 'sourceSha256': hashlib.sha256(data).hexdigest(),
                   'decodedSha256': hashlib.sha256(decoded).hexdigest(),
                   'resources': {path: inspect_resource(content) for path, content in files.items()}}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('output', type=Path, help='New directory; existing output is refused')
    args = parser.parse_args()
    try:
        if args.archive.stat().st_size > LIMIT:
            raise ValueError('Input exceeds 64 MiB')
        files, manifest = prepare(args.archive.read_bytes())
        # Validate the entire archive before creating any output.
        args.output.mkdir(parents=True, exist_ok=False)
        root = args.output / 'resources'
        root.mkdir()
        for name, content in files.items():
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        (args.output / 'inventory.json').write_text(json.dumps(manifest, indent=2) + '\n')
    except (ValueError, OSError, struct.error, UnicodeError) as error:
        parser.exit(1, f'Unpacking failed: {error}\n')
