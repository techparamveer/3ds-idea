"""Read complete plaintext CTR CIA contents without exposing tickets or keys."""
import hashlib
import struct


def _sha(data): return hashlib.sha256(data).hexdigest()
def _align(value, alignment): return (value + alignment - 1) & -alignment


def _ncch(data, title):
    if len(data) < 0x200 or data[0x100:0x104] != b'NCCH':
        raise ValueError('Missing or truncated NCCH header')
    flags = data[0x188:0x190]
    if not flags[7] & 4: raise ValueError('NCCH is still encrypted')
    version = int.from_bytes(data[0x112:0x114], 'little')
    if version not in (0, 2) or flags[6] != 0:
        raise ValueError('Unsupported NCCH version/block size')
    if int.from_bytes(data[0x104:0x108], 'little') * 512 != len(data):
        raise ValueError('NCCH content length mismatch')
    program = f'{int.from_bytes(data[0x118:0x120], "little"):016x}'
    partition = f'{int.from_bytes(data[0x108:0x110], "little"):016x}'
    if program != title: raise ValueError('NCCH program identity differs from TMD title')
    form, kind = flags[5] & 3, flags[5] >> 2
    if form not in (1, 2, 3): raise ValueError('Unsupported NCCH form')
    executable = form in (2, 3)
    if executable and partition != title:
        raise ValueError('Executable NCCH partition identity differs from title')
    exheader = int.from_bytes(data[0x180:0x184], 'little')
    if exheader != (0x400 if executable else 0):
        raise ValueError('NCCH form/exheader mismatch')
    regions = {'header': (0, 0xa00 if executable else 0x200)}
    for name, at in [('plain', 0x190), ('logo', 0x198), ('exefs', 0x1a0), ('romfs', 0x1b0)]:
        offset, size = struct.unpack_from('<II', data, at)
        offset *= 512; size *= 512
        if bool(offset) != bool(size) or (size and (offset < 0x200 or offset + size > len(data))):
            raise ValueError(f'NCCH {name} outside content')
        regions[name] = (offset, size)
    if bool(regions['exefs'][1]) != executable or bool(regions['romfs'][1]) != (form in (1, 3)):
        raise ValueError('NCCH form/filesystem mismatch')
    ranges = sorted((offset, offset + size) for offset, size in regions.values() if size)
    if any(end > len(data) for _, end in ranges) or any(a[1] > b[0] for a, b in zip(ranges, ranges[1:])):
        raise ValueError('NCCH sections overlap or exceed content')
    for at, name in [(0x1a8, 'exefs'), (0x1b8, 'romfs')]:
        if int.from_bytes(data[at:at+4], 'little') * 512 > regions[name][1]:
            raise ValueError('NCCH protected region exceeds filesystem')
    return {'partitionId': partition, 'programId': program, 'formatVersion': version,
            'formType': form, 'contentType': kind, 'flags': flags.hex(),
            'productCode': data[0x150:0x160].split(b'\0', 1)[0].decode('ascii'),
            'regions': {name: {'offset': offset, 'size': size} for name, (offset, size) in regions.items()}}


def cia_metadata(data, expected_title):
    if len(data) < 0x2020: raise ValueError('Truncated CIA header')
    header, kind, version, cert, ticket, tmd, meta, size = struct.unpack_from('<IHHIIIIQ', data)
    if header != 0x2020 or kind != 0 or version != 0:
        raise ValueError('Unsupported CIA header/type/version')
    sections = {}; end = header
    for name, length in [('certificate', cert), ('ticket', ticket), ('tmd', tmd), ('content', size), ('footer', meta)]:
        start = _align(end, 64) if length else end
        end = start + length
        if end > len(data): raise ValueError(f'CIA {name} section outside input')
        sections[name] = (start, length)
    if len(data) - end >= 64 or any(data[end:]): raise ValueError('Unexpected trailing CIA data')
    tmd_at, tmd_size = sections['tmd']
    sig_sizes = {0x10000: 0x240, 0x10001: 0x140, 0x10002: 0x80,
                 0x10003: 0x240, 0x10004: 0x140, 0x10005: 0x80}
    sig = int.from_bytes(data[tmd_at:tmd_at+4], 'big')
    if tmd_size < 4 or sig not in sig_sizes: raise ValueError('Unsupported TMD signature container')
    base = tmd_at + sig_sizes[sig]
    if base + 0x9c4 > tmd_at + tmd_size: raise ValueError('Truncated TMD header')
    title = data[base+0x4c:base+0x54].hex()
    count = int.from_bytes(data[base+0x9e:base+0xa0], 'big')
    if title != expected_title or count == 0: raise ValueError('Unexpected CIA title/content count')
    if base + 0x9c4 + count * 48 > tmd_at + tmd_size: raise ValueError('Truncated TMD content records')
    enabled = {i for i in range(65536) if data[32+i//8] & (0x80 >> (i % 8))}
    contents = []; indices = set(); ids = set(); cursor = 0
    content_at, content_size = sections['content']
    for i in range(count):
        record = base + 0x9c4 + i * 48
        cid, index, flags, length = struct.unpack_from('>IHHQ', data, record)
        if index in indices or cid in ids: raise ValueError('Duplicate TMD content index/id')
        indices.add(index); ids.add(cid)
        if index not in enabled: raise ValueError('Partial CIA content set is unsupported')
        if flags & 1: raise ValueError('CIA content is still encrypted')
        cursor = _align(cursor, 16)
        if length < 0x200 or length % 512 or cursor + length > content_size:
            raise ValueError('TMD content size/alignment outside CIA section')
        offset = content_at + cursor
        raw = data[offset:offset+length]
        ncch = _ncch(raw, title)
        actual = _sha(raw); expected = data[record+16:record+48].hex()
        if actual != expected: raise ValueError('TMD content hash mismatch')
        contents.append({'index': index, 'id': f'{cid:08x}', 'flags': flags,
                         'size': length, 'offset': offset, 'sha256': actual,
                         'tmdSha256': expected, 'ncch': ncch})
        cursor += length
    if enabled != indices: raise ValueError('CIA bitmap contains unknown content indices')
    if cursor != content_size: raise ValueError('CIA content size does not match TMD records')
    applications = [c for c in contents if c['ncch']['formType'] in (2, 3) and c['ncch']['contentType'] == 0]
    if len(applications) == 1:
        selected = applications[0]
    elif len(contents) == 1 and not applications:
        selected = contents[0]  # e.g. the shared-font CFA, preserving the old contract.
    else:
        raise ValueError('No unique executable application content')
    return {'titleId': title, 'version': int.from_bytes(data[base+0x9c:base+0x9e], 'big'),
            'sourceSha256': _sha(data), 'contentSha256': selected['sha256'], 'size': len(data),
            'productCode': selected['ncch']['productCode'], 'contents': contents,
            'resourceContentIndex': selected['index']}


def content_record(metadata, index):
    matches = [c for c in metadata.get('contents', []) if type(index) is int and c['index'] == index]
    if len(matches) != 1: raise ValueError('Unknown content index')
    content_key(matches[0])
    return matches[0]


def content_key(content):
    if (type(content['index']) is not int or not 0 <= content['index'] <= 65535 or
            not isinstance(content['id'], str) or len(content['id']) != 8 or
            any(c not in '0123456789abcdef' for c in content['id'])):
        raise ValueError('Invalid content index/id')
    return f'{content["index"]:04x}-{content["id"]}'


def content_directory(scratch, metadata, index):
    content = content_record(metadata, index)
    return scratch if len(metadata['contents']) == 1 else scratch/'contents'/content_key(content)


def content_provenance(metadata, index):
    content = content_record(metadata, index)
    return {} if len(metadata['contents']) == 1 else {'contentIndex': index, 'contentId': content['id']}
