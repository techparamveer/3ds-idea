"""Bounded CTR pah1 animation-share records (not pane reparenting).

The supplied keyboard's 0x177c2c binder reads 36-byte records, with names at
+0 and +17. See docs/native-animation-share-validation.md for native evidence.
"""
import struct


def decode_animation_hierarchy(data):
    """Decode one complete little-endian pah1 section; reject unknown bytes."""
    if len(data) < 16:
        raise ValueError('Truncated pah1 header')
    tag, size, offset, count, reserved = struct.unpack_from('<4sIIHH', data)
    if tag != b'pah1' or size != len(data) or reserved:
        raise ValueError('Invalid pah1 header')
    if offset < 16 or offset % 4 or offset + count * 36 != size:
        raise ValueError('Invalid pah1 record bounds')
    if any(data[16:offset]):
        raise ValueError('Unsupported pah1 header extension')

    def name(raw):
        end = raw.find(b'\0')
        if end <= 0 or any(raw[end:]) or any(c < 0x20 or c > 0x7e for c in raw[:end]):
            raise ValueError('Invalid pah1 name')
        return raw[:end].decode('ascii')

    records = []
    for i in range(count):
        at = offset + i * 36
        if any(data[at+34:at+36]):
            raise ValueError('Unsupported pah1 record extension')
        records.append({'sourcePane': name(data[at:at+17]),
                        'targetGroup': name(data[at+17:at+34])})
    return records
