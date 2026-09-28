"""Bounded PICA200 texture/CLIM decoding. No firmware code is executed.

Format IDs follow libctru GPU_TEXCOLOR; CLIM uses its own explicit mapping.
Pixel channels are decoded to straight RGBA, top-left origin, without scaling.
"""
import struct
import zlib

PICA_NAMES = ['RGBA8', 'RGB8', 'RGBA5551', 'RGB565', 'RGBA4', 'LA8',
              'HILO8', 'L8', 'A8', 'LA4', 'L4', 'A4', 'ETC1', 'ETC1A4']
BITS = [32, 24, 16, 16, 16, 16, 16, 8, 8, 8, 4, 4, 4, 8]
CLIM_TO_PICA = [7, 8, 9, 5, 6, 3, 1, 2, 4, 0, 12, 13, 10, 11]
MORTON = [sum(((x >> b) & 1) << (2*b) for b in range(3)) for x in range(8)]
ETC_MODIFIERS = [(2, 8), (5, 17), (9, 29), (13, 42), (18, 60), (24, 80), (33, 106), (47, 183)]


def png(width, height, rgba):
    if len(rgba) != width * height * 4:
        raise ValueError('RGBA length mismatch')
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    scan = b''.join(b'\0' + rgba[y*width*4:(y+1)*width*4] for y in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>2I5B', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(scan, 9)) + chunk(b'IEND', b'')


def _expand(v, bits):
    # PICA and ETC1 replicate the most significant bits into the low bits.
    # Rounded normalization differs by one for e.g. a 5-bit value of 3.
    return (v << (8-bits)) | (v >> (2*bits-8))


def _etc_block(block):
    diff, flip = (block >> 33) & 1, (block >> 32) & 1
    if diff:
        base = [(block >> s) & 31 for s in (59, 51, 43)]
        delta = [(block >> s) & 7 for s in (56, 48, 40)]
        other = [v + (d if d < 4 else d - 8) for v, d in zip(base, delta)]
        if any(v < 0 or v > 31 for v in other):
            raise ValueError('ETC1 differential component outside range')
        colors = [[_expand(v, 5) for v in rgb] for rgb in (base, other)]
    else:
        colors = [[((block >> s) & 15)*17 for s in shifts] for shifts in ((60, 52, 44), (56, 48, 40))]
    tables = [(block >> s) & 7 for s in (37, 34)]
    out = []
    for y in range(4):
        for x in range(4):
            bit = x*4 + y
            half = int((y if flip else x) >= 2)
            change = ETC_MODIFIERS[tables[half]][(block >> bit) & 1]
            if (block >> (bit + 16)) & 1:
                change = -change
            out.append(tuple(max(0, min(255, c + change)) for c in colors[half]))
    return out


def decode_texture(data, width, height, fmt):
    """Decode an 8-pixel-tiled texture; dimensions are storage dimensions."""
    if not isinstance(fmt, int) or not 0 <= fmt < len(BITS):
        raise ValueError(f'Unsupported PICA texture format {fmt}')
    if not (8 <= width <= 4096 and 8 <= height <= 4096 and width % 8 == height % 8 == 0):
        raise ValueError('Texture dimensions must be bounded multiples of eight')
    needed = width*height*BITS[fmt]//8
    if needed > 64*1024*1024 or len(data) < needed:
        raise ValueError('Truncated/excessive texture payload')
    out = bytearray(width*height*4)
    if fmt >= 12:
        at = 0
        for ty in range(0, height, 8):
            for tx in range(0, width, 8):
                for by, bx in ((0, 0), (0, 4), (4, 0), (4, 4)):
                    alpha = int.from_bytes(data[at:at+8], 'little') if fmt == 13 else (1 << 64)-1
                    if fmt == 13:
                        at += 8
                    pixels = _etc_block(int.from_bytes(data[at:at+8], 'little'))
                    at += 8
                    for y in range(4):
                        for x in range(4):
                            dest = ((ty+by+y)*width+tx+bx+x)*4
                            out[dest:dest+4] = bytes((*pixels[y*4+x], ((alpha >> (4*(x*4+y))) & 15)*17))
        return bytes(out)
    for y in range(height):
        for x in range(width):
            index = ((y//8)*(width//8)+x//8)*64 + MORTON[x%8] + (MORTON[y%8] << 1)
            bits = BITS[fmt]
            if bits == 4:
                val = ((data[index//2] >> (4*(index%2))) & 15)*17
                rgba = (val, val, val, 255) if fmt == 10 else (255, 255, 255, val)
            else:
                start = index*(bits//8)
                val = int.from_bytes(data[start:start+bits//8], 'little')
                if fmt == 0:
                    rgba = ((val>>24)&255, (val>>16)&255, (val>>8)&255, val&255)
                elif fmt == 1:
                    rgba = ((val>>16)&255, (val>>8)&255, val&255, 255)
                elif fmt == 2:
                    rgba = (_expand(val>>11, 5), _expand((val>>6)&31, 5), _expand((val>>1)&31, 5), (val&1)*255)
                elif fmt == 3:
                    rgba = (_expand(val>>11, 5), _expand((val>>5)&63, 6), _expand(val&31, 5), 255)
                elif fmt == 4:
                    rgba = (((val>>12)&15)*17, ((val>>8)&15)*17, ((val>>4)&15)*17, (val&15)*17)
                elif fmt == 5:
                    rgba = (val>>8, val>>8, val>>8, val&255)
                elif fmt == 6:
                    rgba = (val>>8, val&255, 0, 255)
                elif fmt == 7:
                    rgba = (val, val, val, 255)
                elif fmt == 8:
                    rgba = (255, 255, 255, val)
                else:
                    rgba = ((val>>4)*17, (val>>4)*17, (val>>4)*17, (val&15)*17)
            dest = (y*width+x)*4
            out[dest:dest+4] = bytes(rgba)
    return bytes(out)


def decode_bclim(data):
    if len(data) < 40 or data[-40:-36] != b'CLIM':
        raise ValueError('Expected BCLIM footer')
    magic, bom, header, version, size, sections, reserved = struct.unpack_from('<4sHHIIHH', data, len(data)-40)
    tag, header_size, width, height, fmt, length = struct.unpack_from('<4sIHHII', data, len(data)-20)
    if bom != 0xfeff or header != 20 or size != len(data) or sections != 1 or tag != b'imag' or header_size != 16 or length != len(data)-40:
        raise ValueError('Invalid BCLIM header/payload')
    if not 0 <= fmt < len(CLIM_TO_PICA) or not 0 < width <= 4096 or not 0 < height <= 4096:
        raise ValueError('Invalid BCLIM dimensions/format')
    sw, sh = max(8, 1 << (width-1).bit_length()), max(8, 1 << (height-1).bit_length())
    pica = CLIM_TO_PICA[fmt]
    if sw*sh*BITS[pica]//8 > length:
        sw, sh = (width+7)&~7, (height+7)&~7
    rgba = decode_texture(data[:length], sw, sh, pica)
    cropped = b''.join(rgba[y*sw*4:y*sw*4+width*4] for y in range(height))
    return {'width': width, 'height': height, 'format': fmt, 'picaFormat': pica, 'formatName': PICA_NAMES[pica]}, cropped
