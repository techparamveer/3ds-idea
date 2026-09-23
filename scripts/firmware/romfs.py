"""Bounded read-only CTR RomFS reader for validated plaintext NCCH resources.

Layout follows Project_CTR libnintendo-n3ds romfs.h, ivfc.h and IvfcStream.cpp.
Return member bytes; never execute contents or write paths from the container.
"""
import hashlib
import struct


def align(value, boundary): return (value + boundary - 1) // boundary * boundary


def span(data, offset, size):
    if offset < 0 or size < 0 or offset + size > len(data):
        raise ValueError('RomFS range outside container')
    return data[offset:offset + size]


def ivfc_data(raw):
    span(raw, 0, 0x5c)
    if raw[:4] != b'IVFC' or struct.unpack_from('<I', raw, 4)[0] != 0x10000:
        raise ValueError('Not CTR RomFS IVFC')
    if struct.unpack_from('<I', raw, 0x54)[0] != 0x5c:
        raise ValueError('Invalid IVFC header size')
    master_size = struct.unpack_from('<I', raw, 8)[0]
    levels = [struct.unpack_from('<QQI', raw, 12 + index * 24) for index in range(3)]
    if any(not 5 <= log <= 24 for _, _, log in levels): raise ValueError('Invalid IVFC block size')
    sizes = [level[1] for level in levels]; blocks = [1 << level[2] for level in levels]
    offsets = [0, 0, align(0x60 + master_size, blocks[2])]
    offsets[0] = align(offsets[2] + sizes[2], blocks[0])
    offsets[1] = align(offsets[0] + sizes[0], blocks[1])
    parent = span(raw, 0x60, master_size)
    for offset, size, block in zip(offsets, sizes, blocks):
        count = (size + block - 1) // block
        if len(parent) != count * 32: raise ValueError('Invalid IVFC hash table size')
        padded = span(raw, offset, count * block)
        for index in range(count):
            actual = hashlib.sha256(padded[index * block:(index + 1) * block]).digest()
            if actual != parent[index * 32:(index + 1) * 32]: raise ValueError('IVFC block hash mismatch')
        parent = padded[:size]
    return span(raw, offsets[2], sizes[2])


def members(raw):
    data = ivfc_data(raw)
    span(data, 0, 0x28)
    header = struct.unpack_from('<10I', data)
    if header[0] != 0x28 or header[1] != 0x28 or header[9] != align(header[7] + header[8], 16):
        raise ValueError('Invalid RomFS header')
    previous_end = 0x28
    for index in (1, 3, 5, 7):
        offset, size = header[index:index + 2]
        if offset < previous_end: raise ValueError('Overlapping RomFS metadata')
        span(data, offset, size); previous_end = offset + size
    if header[9] > len(data): raise ValueError('Invalid RomFS file data offset')

    def table(offset, size, fixed, fmt):
        raw_table = span(data, offset, size); rows = {}; cursor = 0
        while cursor < size:
            fields = struct.unpack(fmt, span(raw_table, cursor, fixed))
            name_size = fields[-1]
            if name_size % 2: raise ValueError('Invalid UTF-16 RomFS name length')
            name = span(raw_table, cursor + fixed, name_size).decode('utf-16-le')
            if any(char in name for char in '/\\\0') or name in ('.', '..'):
                raise ValueError('Unsafe RomFS member name')
            rows[cursor] = (fields, name)
            cursor += fixed + align(name_size, 4)
        if cursor != size: raise ValueError('Invalid RomFS entry alignment')
        return rows

    directories = table(header[3], header[4], 24, '<6I')
    files = table(header[7], header[8], 32, '<IIQQII')
    root, name = directories.get(0, ((), None))
    if name != '' or root[0] != 0 or root[1] != 0xffffffff:
        raise ValueError('Invalid RomFS root directory')
    paths = {0: ''}; seen_paths = {''}
    def directory_path(index, visiting=None):
        if index in paths: return paths[index]
        visiting = set() if visiting is None else visiting
        if index in visiting or len(visiting) >= 128: raise ValueError('RomFS directory cycle or excessive depth')
        if index not in directories: raise ValueError('Missing RomFS parent directory')
        fields, name = directories[index]
        if not name: raise ValueError('Empty RomFS member name')
        path = '/'.join(filter(None, (directory_path(fields[0], visiting | {index}), name)))
        if path in seen_paths: raise ValueError('Duplicate RomFS path')
        paths[index] = path; seen_paths.add(path)
        return path
    for index in directories: directory_path(index)
    result = {}
    for fields, name in files.values():
        if not name: raise ValueError('Empty RomFS member name')
        parent, _, offset, size, _, _ = fields
        path = '/'.join(filter(None, (directory_path(parent), name)))
        if path in seen_paths: raise ValueError('Duplicate RomFS path')
        seen_paths.add(path); result[path] = span(data, header[9] + offset, size)
    return result
