"""Decode a standalone, decrypted CFNT (A4/A8) to browser bitmap sheets.

No keys, decryption, firmware execution, or external Python dependencies.
Format references and limitations: docs/firmware-assets.md.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zlib


def png(width, height, rgba):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    scan = b''.join(b'\0' + rgba[y * width * 4:(y + 1) * width * 4] for y in range(height))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>2I5B', width, height, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(scan)) + chunk(b'IEND', b''))


def decode_sheet(data, width, height, fmt):
    """Unswizzle 8x8 Morton tiles; PNG rows run top to bottom."""
    if fmt not in (8, 11):
        raise ValueError(f'Unsupported TGLP format {fmt}: only A8 (8) and A4 (11) are supported')
    if any(v < 8 or v > 1024 or v & (v - 1) for v in (width, height)):
        raise ValueError('Expected power-of-two sheet dimensions from 8 to 1024')
    if len(data) < width * height * (8 if fmt == 8 else 4) // 8:
        raise ValueError('Truncated sheet')
    out = bytearray(width * height * 4)
    for y in range(height):
        for x in range(width):
            morton = sum(((x >> bit) & 1) << (bit * 2) | ((y >> bit) & 1) << (bit * 2 + 1) for bit in range(3))
            pixel = ((y // 8) * (width // 8) + x // 8) * 64 + morton
            alpha = data[pixel] if fmt == 8 else ((data[pixel // 2] >> (4 * (pixel % 2))) & 15) * 17
            at = (y * width + x) * 4
            out[at:at + 4] = bytes((255, 255, 255, alpha))
    return bytes(out)


def convert(data):
    def read(fmt, at):
        if at < 0 or at + struct.calcsize('<' + fmt) > len(data):
            raise ValueError('Pointer outside font / truncated data')
        return struct.unpack_from('<' + fmt, data, at)

    magic, bom, header_size, version, size, blocks = read('4sHHIII', 0)
    if magic != b'CFNT' or bom != 0xfeff or header_size != 20 or size != len(data):
        raise ValueError('Expected standalone little-endian CFNT, not encrypted content or shared-memory dump')
    if len(data) > 32 * 1024 * 1024 or blocks > 4096:
        raise ValueError('Font exceeds conversion limits')

    def block(at, kind):
        tag, length = read('4sI', at)
        if tag != kind or length < 8 or at + length > len(data):
            raise ValueError(f'Invalid {kind.decode()} block')
        return at + length

    block(20, b'FINF')
    _, line_feed, alternate, left, glyph_width, advance, encoding, tglp, cwdh, cmap, height, _, ascent, _ = read('BBHbBBBIIIBBBB', 28)
    if encoding != 1:
        raise ValueError('Only UTF-16 CMAP fonts are supported')
    block(tglp - 8, b'TGLP')
    cw, ch, baseline, _, sheet_size, count, fmt, cols, rows, sw, sh, sheet_offset = read('BBBBIHHHHHHI', tglp)
    if not (cw and ch and cols and rows and 0 < count <= 64 and height):
        raise ValueError('Invalid glyph / sheet dimensions')
    if cols * (cw + 1) > sw or rows * (ch + 1) > sh:
        raise ValueError('Cells extend beyond sheet')
    if sheet_offset + count * sheet_size > len(data):
        raise ValueError('Truncated sheet data')
    widths = {}
    mappings = {}

    def chain(at, kind):
        seen = set()
        while at:
            if at in seen or len(seen) >= 4096:
                raise ValueError('Cyclic / excessive block chain')
            seen.add(at)
            end = block(at - 8, kind)
            yield at, end
            at = read('I', at + (4 if kind == b'CWDH' else 8))[0]

    for at, end in chain(cwdh, b'CWDH'):
        first, last, _ = read('HHI', at)
        if last < first or at + 8 + (last - first + 1) * 3 > end:
            raise ValueError('Invalid width range')
        for index in range(first, last + 1):
            widths[index] = read('bBB', at + 8 + (index - first) * 3)
    for at, end in chain(cmap, b'CMAP'):
        first, last, method, _, _ = read('HHHHI', at)
        start = at + 12
        if last < first:
            raise ValueError('Invalid character range')
        if method == 0:
            if start + 2 > end:
                raise ValueError('Truncated direct map')
            offset = read('H', start)[0]
            entries = ((code, offset + code - first) for code in range(first, last + 1))
        elif method == 1:
            if start + (last - first + 1) * 2 > end:
                raise ValueError('Truncated table map')
            entries = ((code, read('H', start + (code - first) * 2)[0]) for code in range(first, last + 1))
        elif method == 2:
            n = read('H', start)[0]
            if start + 2 + n * 4 > end:
                raise ValueError('Truncated scan map')
            entries = (read('HH', start + 2 + i * 4) for i in range(n))
        else:
            raise ValueError(f'Unknown CMAP method {method}')
        for code, index in entries:
            if index != 0xffff:
                mappings[code] = index

    def glyph(index):
        if not 0 <= index < cols * rows * count:
            raise ValueError('Glyph index outside sheets')
        bearing, width, step = widths.get(index, (left, glyph_width, advance))
        if width > cw:
            raise ValueError('Glyph exceeds cell width')
        local = index % (cols * rows)
        return dict(sheet=index // (cols * rows), x=(local % cols) * (cw + 1) + 1,
                    y=(local // cols) * (ch + 1) + 1, width=width, height=ch, left=bearing, advance=step)

    manifest = dict(schema=1, sourceSha256=hashlib.sha256(data).hexdigest(), version=version,
                    height=height, ascent=ascent, baseline=baseline, lineFeed=line_feed,
                    sheets=[f'sheet-{i}.png' for i in range(count)],
                    glyphs={str(code): glyph(index) for code, index in mappings.items()},
                    fallback=None if alternate == 0xffff else glyph(alternate))
    sheets = [png(sw, sh, decode_sheet(data[sheet_offset + i * sheet_size:sheet_offset + (i + 1) * sheet_size], sw, sh, fmt)) for i in range(count)]
    return manifest, sheets


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('font', type=Path)
    parser.add_argument('output', type=Path, help='New output directory; never overwritten')
    args = parser.parse_args()
    try:
        if args.font.stat().st_size > 32 * 1024 * 1024:
            raise ValueError('Font exceeds 32 MiB')
        manifest, sheets = convert(args.font.read_bytes())
        args.output.mkdir(parents=True, exist_ok=False)
        for name, sheet in zip(manifest['sheets'], sheets):
            (args.output / name).write_bytes(sheet)
        (args.output / 'font.json').write_text(json.dumps(manifest, indent=2) + '\n')
    except (ValueError, OSError, struct.error) as error:
        parser.exit(1, f'Conversion failed: {error}\n')
