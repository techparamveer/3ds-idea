"""Export the supplied Sound ExeFS logo with existing bounded visual converters."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from unpack_home_resources import decompress, unpack_darc
from firmware.build import Builder, encode
from firmware.texture import decode_bclim

SOURCE_SHA = '2a98c49d919e254e15dc213cab47a800ed63b248dcd43119e8fb82d9e62ae51c'
PREFIX = 'packs/launch/'


def export(source, output, scratch):
    sha = lambda data: hashlib.sha256(data).hexdigest()
    raw = source.read_bytes()
    if sha(raw) != SOURCE_SHA:
        raise ValueError('Expected the verified supplied Sound ExeFS/logo.bin')
    decoded = decompress(raw)
    size = struct.unpack_from('<I', decoded, 12)[0]
    if size != 25896 or len(decoded) != 25928:
        raise ValueError('Unexpected archive/trailer boundary')
    archive, trailer = decoded[:size], decoded[size:]
    files = unpack_darc(archive)  # Independently bounds every member to declared DARC.
    builder = Builder(scratch)
    _, pack = builder.pack(files, 'nintendo-launch-logo', '0004001000022500', 'ExeFS/logo.bin', sha(raw))
    if len(files) != 16 or pack['unsupported'] or any(item['unsupported'] for item in [*pack['layouts'].values(), *pack['animations'].values()]):
        raise ValueError('Unexpected or unsupported resource')
    output.mkdir(parents=True, exist_ok=True)
    records = {}
    for name, texture in pack['textures'].items():
        _, rgba = decode_bclim(files['timg/' + name])
        if min(rgba[3::4]) != 0 or max(rgba[3::4]) != 255:
            raise ValueError('Expected a transparent source texture')
        old = texture['url']
        image = (scratch / old).read_bytes()
        if sha(image) != texture['sha256']:
            raise ValueError('Converted texture hash mismatch')
        target = output / old
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(image)
        texture['url'] = PREFIX + old  # URL base is the shared firmware manifest.
        records[PREFIX + old] = builder.records[old]
    packed = encode(pack)
    (output / 'logo.json').write_bytes(packed)
    records[PREFIX + 'logo.json'] = {'kind': 'pack', 'size': len(packed), 'sha256': sha(packed),
        'sources': [{'titleId': '0004001000022500', 'path': 'ExeFS/logo.bin', 'sha256': sha(raw)}]}
    scripts = ['scripts/firmware/export_launch_logo.py', 'scripts/unpack_home_resources.py',
        'scripts/firmware/build.py', 'scripts/firmware/native.py', 'scripts/firmware/texture.py']
    repo = Path(__file__).resolve().parents[2]
    provenance = {'schema': 1, 'pack': PREFIX + 'logo.json', 'source': {
        'titleId': '0004001000022500', 'version': 3088, 'productCode': 'CTR-N-HESP',
        'ciaSha256': '25d7c0803392d4b2febd2ce1eb6879c63a000d2b39cbaefcbe4ebf8d3a649f72',
        'contentSha256': 'da6fce19bff1e663cadf03d3a103bccc9d65c18c3890b7a50cae26c62c24268d',
        'path': 'ExeFS/logo.bin', 'sha256': sha(raw), 'bytes': len(raw)},
        'decodedSha256': sha(decoded), 'decodedBytes': len(decoded), 'darcBytes': size,
        'darcSha256': sha(archive), 'opaqueTrailerHex': trailer.hex(),
        'opaqueTrailerMatchesArchiveSha256': hashlib.sha256(archive).digest() == trailer,
        'resources': records, 'converterScripts': {path: sha((repo / path).read_bytes()) for path in scripts},
        'counts': {'layouts': len(pack['layouts']), 'animations': len(pack['animations']), 'textures': len(pack['textures'])}}
    (output / 'provenance.json').write_bytes(encode(provenance))
    return provenance


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path, help='Dedicated packs/launch directory, not the manifest root')
    parser.add_argument('--scratch', required=True, type=Path, help='Private SSD output for the existing pack builder')
    args = parser.parse_args()
    report = export(args.source, args.output, args.scratch)
    print(json.dumps({'pack': report['pack'], 'counts': report['counts'], 'sha256': report['resources'][report['pack']]['sha256']}))
