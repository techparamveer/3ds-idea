"""Decode a 3DS CIC's 48px RGB565 image into lossless RGBA PNG.

The pinned Notifications CICs contain a zero-filled 24px image followed by
48×48 RGB565 texels in 8×8 Morton tiles. This converter intentionally rejects
other shapes; it does not infer a format from an arbitrary byte count.
"""
import argparse
import struct
import zlib
from pathlib import Path


def chunk(kind, payload):
    return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))


def decode(data):
    if len(data) != 5760 or any(data[:1152]):
        raise ValueError('Expected pinned CIC shape: empty 24px plane and 48px RGB565 plane')
    rgba = bytearray(48 * 48 * 4)
    for tile_y in range(6):
        for tile_x in range(6):
            for y in range(8):
                for x in range(8):
                    morton = sum((((x >> bit) & 1) << (2 * bit)) |
                                 (((y >> bit) & 1) << (2 * bit + 1)) for bit in range(3))
                    source = 1152 + ((tile_y * 6 + tile_x) * 64 + morton) * 2
                    pixel = int.from_bytes(data[source:source + 2], 'little')
                    target = ((tile_y * 8 + y) * 48 + tile_x * 8 + x) * 4
                    r, g, b = (pixel >> 11) & 31, (pixel >> 5) & 63, pixel & 31
                    rgba[target:target + 4] = (
                        (r << 3) | (r >> 2),
                        (g << 2) | (g >> 4),
                        (b << 3) | (b >> 2),
                        255,
                    )
    rows = b''.join(b'\0' + rgba[y * 48 * 4:(y + 1) * 48 * 4] for y in range(48))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 48, 48, 8, 6, 0, 0, 0)) +
            chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(decode(args.source.read_bytes()))


if __name__ == '__main__':
    main()
