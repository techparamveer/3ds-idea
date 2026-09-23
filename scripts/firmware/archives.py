"""Read-only stock resource archives; no member paths are written to disk.

SARC v0x100: https://nintendo-formats.com/libs/sead/sarc.html
The 64-byte table wrapper is limited by build.py to observed Camera/Sound paths.
"""
from pathlib import PurePosixPath
import struct


def bounded(raw, start, size):
    if start < 0 or size < 0 or start + size > len(raw): raise ValueError('Archive range outside data')
    return raw[start:start + size]


def safe_name(raw):
    name = raw.decode('utf-8')
    if not name or PurePosixPath(name).is_absolute() or any(p in ('', '.', '..') for p in name.split('/')) or any(c in name for c in '\\\0:#?'):
        raise ValueError('Unsafe archive member name')
    return name


def unpack_sarc(raw):
    bounded(raw, 0, 0x20)
    if raw[:4] != b'SARC' or raw[6:8] not in (b'\xff\xfe', b'\xfe\xff'): raise ValueError('Invalid SARC signature/BOM')
    order = '<' if raw[6:8] == b'\xff\xfe' else '>'
    header, _, length, data_offset, version, reserved = struct.unpack_from(order+'HHIIHH', raw, 4)
    if header != 0x14 or length != len(raw) or version != 0x100 or reserved:
        raise ValueError('Invalid SARC header')
    if raw[20:24] != b'SFAT': raise ValueError('Missing SARC SFAT')
    size, count, multiplier = struct.unpack_from(order+'HHI', raw, 24)
    if size != 12 or not 0 < count <= 0x3fff: raise ValueError('Invalid SARC node table')
    names_header = 32 + count * 16
    if bounded(raw, names_header, 8)[:4] != b'SFNT' or struct.unpack_from(order+'HH', raw, names_header + 4) != (8, 0):
        raise ValueError('Invalid SARC name table')
    names_start = names_header + 8
    if not names_start <= data_offset <= len(raw): raise ValueError('Invalid SARC data offset')
    result = {}; last_hash = -1; collision = 0; ranges = []
    for index in range(count):
        expected, attributes, start, end = struct.unpack_from(order+'4I', raw, 32 + index * 16)
        if expected < last_hash: raise ValueError('Unsorted SARC hashes')
        collision = collision + 1 if expected == last_hash else 1; last_hash = expected
        if attributes >> 24 != collision: raise ValueError('Unsupported anonymous/colliding SARC member')
        name_start = names_start + (attributes & 0xffffff) * 4
        if not names_start <= name_start < data_offset: raise ValueError('SARC name offset outside table')
        name_end = raw.find(b'\0', name_start, data_offset)
        if name_end < 0: raise ValueError('Unterminated SARC name')
        encoded = raw[name_start:name_end]; name = safe_name(encoded); actual = 0
        for byte in encoded: actual = (actual * multiplier + byte) & 0xffffffff
        if actual != expected: raise ValueError('SARC filename hash mismatch')
        if name in result: raise ValueError('Duplicate SARC path')
        result[name] = bounded(raw, data_offset + start, end - start)
        if end > start: ranges.append((start, end))
    ranges.sort()
    if any(right[0] < left[1] for left, right in zip(ranges, ranges[1:])): raise ValueError('Overlapping SARC payloads')
    return result


def unpack_stock_table(raw):
    bounded(raw, 0, 64)
    table_end = struct.unpack_from('<I', raw, 56)[0]
    if not 64 <= table_end <= min(len(raw), 1024 * 1024) or table_end % 128:
        raise ValueError('Invalid stock table boundary')
    result = {}; previous = table_end; padding = False
    for cursor in range(0, table_end, 64):
        row = bounded(raw, cursor, 64)
        if not any(row): padding = True; continue
        if padding: raise ValueError('Nonzero stock table padding')
        end = row.find(b'\0', 0, 56)
        if end < 0 or any(row[end:56]): raise ValueError('Invalid stock table name padding')
        name = safe_name(row[:end]); start, size = struct.unpack_from('<II', row, 56)
        if name in result or start < previous or start % 128: raise ValueError('Duplicate/overlapping stock table member')
        result[name] = bounded(raw, start, size); previous = start + size
    if not result: raise ValueError('Empty stock table')
    return result
