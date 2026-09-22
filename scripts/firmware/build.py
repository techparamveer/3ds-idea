"""Compile owner's decrypted CTR resources into explicitly allowlisted web assets.

Raw extraction and reports stay on the supplied artifact volume. The public
directory receives only converted PNG/JSON; never CIA, ExeFS, credentials or saves.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import platform
import re
import struct
import subprocess
import sys
import zlib

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
from convert_bcfnt import convert as convert_font
from unpack_home_resources import decompress, unpack_darc
from firmware.native import decode_layout, decode_animation, decode_msbt, decode_mstl
from firmware.texture import decode_bclim, decode_texture, png

FIRMWARE = '10.7.0-32E'
CONVERTER_VERSION = '1.2.0'
HOME = '0004003000009802'
SHARED = '0004009b00014002'
HOME_STYLE_PATHS = {'message/EU_English/RI_mstl_LZ.bin', 'message_hud/EU_English/RI_mstl_LZ.bin'}
EXCLUDED = {'0004001000022d00', '0004001000022e00'}
TITLES = {
    HOME: ('home', 'HOME Menu', 'system'),
    '0004001000022000': ('settings', 'System Settings', 'app'),
    '0004001000022100': ('download-play', 'Download Play', 'app'),
    '0004001000022200': ('activity-log', 'Activity Log', 'app'),
    '0004001000022300': ('health-and-safety', 'Health and Safety Information', 'app'),
    '0004001000022400': ('camera', 'Nintendo 3DS Camera', 'app'),
    '0004001000022500': ('sound', 'Nintendo 3DS Sound', 'app'),
    '0004001000022700': ('mii-maker', 'Mii Maker', 'app'),
    '0004001000022800': ('mii-plaza', 'StreetPass Mii Plaza', 'app'),
    '0004001000022900': ('eshop', 'Nintendo eShop', 'app'),
    '0004001000022b00': ('nintendo-zone', 'Nintendo Zone Viewer', 'app'),
    '000400100002c100': ('nnid-settings', 'Nintendo Network ID Settings', 'app'),
    '0004003000009902': ('camera-applet', 'Camera', 'applet'),
    '0004003000009b02': ('manual', 'Instruction Manual', 'applet'),
    '0004003000009c02': ('game-notes', 'Game Notes', 'applet'),
    '0004003000009d02': ('browser', 'Internet Browser', 'applet'),
    '0004003000009f02': ('friends', 'Friend List', 'applet'),
    '000400300000a002': ('notifications', 'Notifications', 'applet'),
    '000400300000b902': ('amiibo-settings', 'amiibo Settings', 'applet'),
    '000400300000ba02': ('miiverse-post', 'Post to Miiverse', 'applet'),
    '000400300000be02': ('miiverse', 'Miiverse', 'applet'),
    '000400300000c502': ('error', 'Error Dialog', 'applet'),
    '000400300000cd02': ('circle-pad-pro', 'Circle Pad Pro', 'applet'),
    '000400300000d002': ('keyboard', 'Software Keyboard', 'applet'),
    '000400300000d102': ('mii-selector', 'Mii Selector', 'applet'),
    '000400300000d302': ('camera-picker', 'Camera Picker', 'applet'),
    '000400300000d402': ('sound-picker', 'Sound Picker', 'applet'),
    '000400300000d602': ('eshop-applet', 'Nintendo eShop Applet', 'applet'),
    '000400300000f602': ('memo', 'Memo Applet', 'applet'),
}
DENIED_SUFFIXES = {'.key', '.pem', '.p12', '.der', '.crr', '.crs', '.cro', '.shbin', '.cdc', '.code'}
DENIED_NAMES = {'masterkey.bin', 'ticket', 'certs', '.code'}


def digest(data): return hashlib.sha256(data).hexdigest()
def encode(value): return (json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(',', ':'), allow_nan=False)+'\n').encode()


def public_path(root, url):
    """Resolve a manifest URL without allowing filesystem or URL escapes."""
    if not isinstance(url, str) or not url or any(c in url for c in '\\:#?'):
        raise ValueError('Invalid public resource URL')
    path = PurePosixPath(url)
    if path.is_absolute() or any(p in ('', '.', '..') for p in url.split('/')):
        raise ValueError('Public resource URL must be a canonical relative path')
    target = root.joinpath(*path.parts)
    if not target.resolve().is_relative_to(root.resolve()):
        raise ValueError('Public resource escapes output directory')
    return target


def converter_provenance(ctrtool):
    scripts = ['firmware/build.py', 'firmware/native.py', 'firmware/texture.py',
               'convert_bcfnt.py', 'unpack_home_resources.py']
    result = subprocess.run([str(ctrtool), '--help'], capture_output=True, text=True, timeout=10)
    # CTRTool prints its identity with help, returning 1 for this invocation.
    match = re.search(r'^CTRTool v([^\s]+)', result.stdout+result.stderr, re.MULTILINE)
    if not match: raise ValueError('Unable to identify selected CTRTool version')
    return {'name': 'ctr-native-web', 'version': CONVERTER_VERSION,
            'scripts': {f'scripts/{name}': digest((SCRIPTS/name).read_bytes()) for name in scripts},
            'extractor': {'name': 'CTRTool', 'version': match[1], 'sha256': digest(ctrtool.read_bytes())}}


def cia_metadata(data, expected_title):
    if len(data) < 32: raise ValueError('Truncated CIA')
    header, kind, version, cert, ticket, tmd, meta, size = struct.unpack_from('<IHHIIIIQ', data)
    align = lambda n: (n+63)&~63
    tmd_at = align(align(header)+cert)+align(ticket)
    content_at = tmd_at+align(tmd)
    sig_sizes = {0x10000: 0x240, 0x10001: 0x140, 0x10002: 0x80, 0x10003: 0x240, 0x10004: 0x140, 0x10005: 0x80}
    sig = int.from_bytes(data[tmd_at:tmd_at+4], 'big')
    if sig not in sig_sizes: raise ValueError('Unsupported TMD signature container')
    base = tmd_at+sig_sizes[sig]
    if base+0x9c4+48 > tmd_at+tmd or content_at+size > len(data): raise ValueError('CIA sections outside input')
    title = data[base+0x4c:base+0x54].hex()
    count = int.from_bytes(data[base+0x9e:base+0xa0], 'big')
    if title != expected_title or count != 1: raise ValueError('Unexpected CIA title/content count')
    if int.from_bytes(data[base+0x9ca:base+0x9cc], 'big') & 1: raise ValueError('CIA is still encrypted')
    ncch = data[content_at:content_at+size]
    if ncch[0x100:0x104] != b'NCCH' or not ncch[0x18f]&4: raise ValueError('NCCH is still encrypted')
    expected_length = int.from_bytes(ncch[0x104:0x108], 'little')*512
    if expected_length != len(ncch): raise ValueError('NCCH content length mismatch')
    return {'titleId': title, 'version': int.from_bytes(data[base+0x9c:base+0x9e], 'big'),
            'sourceSha256': digest(data), 'contentSha256': digest(ncch), 'size': len(data),
            'productCode': ncch[0x150:0x160].split(b'\0', 1)[0].decode('ascii')}


def extract(ctrtool, package, scratch, metadata):
    marker = scratch/'source.json'
    if marker.exists() and json.loads(marker.read_text()) == metadata:
        return scratch/'romfs', scratch/'exefs'
    scratch.mkdir(parents=True, exist_ok=True)
    if any((scratch/n).exists() for n in ('romfs', 'exefs')):
        # Old output must not silently mingle with a different firmware revision.
        raise ValueError(f'Extraction directory already exists without matching provenance: {scratch}')
    result = subprocess.run([str(ctrtool), '--plain', '--quiet', f'--romfsdir={scratch / "romfs"}',
                             f'--exefsdir={scratch / "exefs"}', str(package)], capture_output=True, text=True, check=False)
    (scratch/'ctrtool.log').write_text(result.stdout+result.stderr)
    if result.returncode: raise ValueError(f'CTRTool failed; see {scratch / "ctrtool.log"}')
    marker.write_bytes(encode(metadata))
    return scratch/'romfs', scratch/'exefs'


class Builder:
    def __init__(self, output):
        self.output = output; self.records = {}; self.unsupported = []; self.texture_cache = {}
    def write(self, path, data, source, kind):
        target = public_path(self.output, path)
        if target.suffix not in ('.png', '.json'):
            raise ValueError('Public export is not allowlisted')
        record = {'kind': kind, 'size': len(data), 'sha256': digest(data), 'sources': [source]}
        if path in self.records:
            old = self.records[path]
            if old['sha256'] != record['sha256']: raise ValueError('Conflicting exported resource')
            if source not in old['sources']: old['sources'].append(source)
        else: self.records[path] = record
        target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
        return path
    def texture(self, raw, source):
        key = digest(raw)
        if key not in self.texture_cache:
            info, rgba = decode_bclim(raw); image = png(info['width'], info['height'], rgba)
            self.texture_cache[key] = (info, image)
        info, image = self.texture_cache[key]
        url = self.write(f'textures/{digest(image)}.png', image, source, 'texture')
        return {**info, 'url': url, 'sha256': digest(image), 'sourceSha256': key}
    def font(self, raw, name, source):
        manifest, sheets = convert_font(raw, compact=True)
        for filename, image in zip(manifest['sheets'], sheets): self.write(f'fonts/{name}/{filename}', image, source, 'font-sheet')
        return self.write(f'fonts/{name}/font.json', encode(manifest), source, 'font')
    def pack(self, resources, name, title, source_path, source_hash):
        result = {'schema': 1, 'name': name, 'titleId': title, 'sourceSha256': source_hash,
                  'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}, 'unsupported': [],
                  'resourceSources': {'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}}}
        for path, raw in sorted(resources.items()):
            source = {'titleId': title, 'path': source_path+'/'+path, 'sha256': digest(raw)}
            key = Path(path).stem
            try:
                if raw[:4] == b'CLYT': bucket, value = 'layouts', decode_layout(raw)
                elif raw[:4] == b'CLAN': bucket, value = 'animations', decode_animation(raw)
                elif len(raw) >= 40 and raw[-40:-36] == b'CLIM':
                    bucket, key, value = 'textures', Path(path).name, self.texture(raw, source)
                elif raw[:8] == b'MsgStdBn': bucket, value = 'messages', decode_msbt(raw)
                elif title == HOME and path in HOME_STYLE_PATHS:
                    bucket, key, value = 'styles', path, decode_mstl(raw)
                    result.setdefault(bucket, {})
                    result['resourceSources'].setdefault(bucket, {})
                else:
                    result['unsupported'].append({'path': path, 'sha256': digest(raw), 'size': len(raw), 'reason': 'Unconverted resource type'})
                    continue
                if key in result[bucket]: raise ValueError(f'Duplicate {bucket} resource name: {key}')
                result[bucket][key] = value
                result['resourceSources'][bucket][key] = source
            except (ValueError, UnicodeError, struct.error, IndexError) as error:
                result['unsupported'].append({'path': path, 'sha256': digest(raw), 'reason': str(error)})
        for key, message in result['messages'].items():
            member = result['resourceSources']['messages'][key]['path'].removeprefix(source_path+'/')
            table = str(Path(member).parent/'RI_mstl_LZ.bin')
            if table in result.get('styles', {}):
                message['styleTable'] = table
        slug = TITLES[title][0]
        url = f'packs/{slug}/{name}.json'
        self.write(url, encode(result), {'titleId': title, 'path': source_path, 'sha256': source_hash}, 'pack')
        return url, result


def decode_layers(raw):
    for _ in range(4):
        if raw[:1] not in (b'\x10', b'\x11'): return raw
        raw = decompress(raw)
    raise ValueError('Excessive compression nesting')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--artifacts', required=True, type=Path)
    parser.add_argument('--ctrtool', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=SCRIPTS.parent/'public/os/firmware'/FIRMWARE)
    parser.add_argument('--home-only', action='store_true')
    args = parser.parse_args()
    if not args.ctrtool.is_file(): parser.error('An explicit installed CTRTool executable is required')
    if args.artifacts.resolve().is_relative_to(SCRIPTS.parent.resolve()): parser.error('Raw artifact output must be outside the repository')
    packages = {p.stem.lower(): p for p in args.source.glob('*.cia')}
    builder = Builder(args.output)
    manifest = {'schema': 1, 'firmware': FIRMWARE, 'region': 'EUR', 'locale': 'EU_English', 'sources': {}, 'fonts': {}, 'home': {}, 'titles': {},
                'converter': converter_provenance(args.ctrtool),
                'excludedTitles': sorted(EXCLUDED), 'limitations': ['Converted resources require native-screen visual verification.',
                 'Unsupported formats/fields are recorded explicitly; no substitute assets are generated.']}
    previous = args.output/'manifest.json'
    if previous.exists():
        old = json.loads(previous.read_text())
        for key in ('audio', 'models'):
            if key in old: manifest[key] = old[key]
        builder.records.update({k: v for k, v in old.get('resources', {}).items() if k.startswith(('audio/', 'models/'))})
    args.artifacts.mkdir(parents=True, exist_ok=True)
    selected = [HOME] if args.home_only else list(TITLES)
    for title in [SHARED, *selected]:
        if title not in packages: raise ValueError(f'Missing supplied title {title}')
        metadata = cia_metadata(packages[title].read_bytes(), title)
        manifest['sources'][title] = {**metadata, 'file': packages[title].name}
        slug = 'shared-font' if title == SHARED else TITLES[title][0]
        romfs, exefs = extract(args.ctrtool, packages[title], args.artifacts/'extracted'/slug, metadata)
        if title == SHARED:
            p = romfs/'cbf_std.bcfnt.lz'; raw = decode_layers(p.read_bytes())
            manifest['fonts']['shared'] = builder.font(raw, 'shared', {'titleId': title, 'path': p.name, 'sha256': digest(raw)})
            continue
        info = {'titleId': title, 'slug': slug, 'name': TITLES[title][1], 'kind': TITLES[title][2],
                'version': metadata['version'], 'sourceSha256': metadata['sourceSha256'], 'packs': [], 'fonts': {}, 'icon': None}
        icon = exefs/'icon.bin'
        if not icon.exists(): icon = exefs/'icon'
        if icon.is_file():
            smdh = icon.read_bytes()
            if smdh[:4] == b'SMDH' and len(smdh) >= 0x36c0:
                name = smdh[0x208:0x288].decode('utf-16-le').rstrip('\0')
                if name.strip() and name != '???': info['name'] = name
                image = png(48, 48, decode_texture(smdh[0x24c0:0x36c0], 48, 48, 3))
                info['icon'] = builder.write(f'icons/{slug}.png', image, {'titleId': title, 'path': 'ExeFS/icon', 'sha256': digest(smdh)}, 'title-icon')
        loose = {}
        for p in sorted(romfs.rglob('*')):
            if not p.is_file() or p.suffix.lower() in DENIED_SUFFIXES or p.name.lower() in DENIED_NAMES: continue
            relative = str(p.relative_to(romfs))
            # Only English messages enter the site's delivery set; inventory
            # does not discard the owner-provided original packages.
            if re.search(r'(?:EU_|US_)(?:Dutch|French|German|Italian|Portuguese|Russian|Spanish)(?:/|_)', relative): continue
            packed = p.read_bytes()
            try: raw = decode_layers(packed)
            except (ValueError, IndexError):
                builder.unsupported.append({'titleId': title, 'path': relative, 'size': len(packed), 'sha256': digest(packed), 'reason': 'Not supported LZ stream'}); continue
            source = {'titleId': title, 'path': relative, 'sha256': digest(raw)}
            if raw[:4] == b'darc':
                try: resources = unpack_darc(raw)
                except ValueError as error:
                    builder.unsupported.append({**source, 'reason': str(error)}); continue
                name = re.sub(r'[^a-zA-Z0-9_-]', '-', relative.removesuffix('_LZ.bin').removesuffix('.arc').removesuffix('.bin'))
                url, pack = builder.pack(resources, name, title, relative, digest(packed))
                info['packs'].append(url)
                if title == HOME: manifest['home'][name] = url
            elif (raw[:4] in (b'CLYT', b'CLAN') or raw[:8] == b'MsgStdBn' or
                  (len(raw) >= 40 and raw[-40:-36] == b'CLIM') or (title == HOME and relative in HOME_STYLE_PATHS)):
                loose[relative] = raw
            elif raw[:4] == b'CFNT':
                try:
                    font_name = 'hud' if title == HOME and p.name == 'Hud_JP.bcfnt' else slug+'/'+re.sub(r'[^a-zA-Z0-9_-]', '-', p.stem)
                    url = builder.font(raw, font_name, source)
                    info['fonts'][p.name] = url
                    if title == HOME and p.name == 'Hud_JP.bcfnt': manifest['fonts']['hud'] = url
                except ValueError as error:
                    builder.unsupported.append({**source, 'reason': 'Font: '+str(error)})
            elif raw[:4] in (b'CGFX', b'CSAR', b'CWAV', b'CSTM'):
                # Owned by the separate model/audio conversion commands.
                continue
            else:
                builder.unsupported.append({**source, 'size': len(raw), 'reason': 'Unconverted application resource container'})
        if loose:
            url, pack = builder.pack(loose, 'messages-and-loose', title, 'RomFS', metadata['contentSha256'])
            info['packs'].append(url)
            if title == HOME: manifest['home']['messages'] = url
        manifest['titles'][title] = info
        print(json.dumps({'title': title, 'name': info['name'], 'packs': len(info['packs']), 'icon': bool(info['icon'])}), flush=True)
    manifest['resources'] = dict(sorted(builder.records.items()))
    manifest['unsupported'] = builder.unsupported
    (args.output/'manifest.json').write_bytes(encode(manifest))
    report = {'firmware': FIRMWARE, 'titles': len(manifest['titles']), 'resources': len(builder.records), 'bytes': sum(r['size'] for r in builder.records.values()),
              'manifestSha256': digest(encode(manifest)), 'unsupportedContainers': len(builder.unsupported),
              'environment': {'python': platform.python_version(), 'platform': platform.platform(),
                              'zlib': zlib.ZLIB_VERSION, 'zlibRuntime': zlib.ZLIB_RUNTIME_VERSION},
              'invocation': {'source': str(args.source.resolve()), 'ctrtool': str(args.ctrtool.resolve()),
                             'artifacts': str(args.artifacts.resolve()), 'output': str(args.output.resolve()), 'homeOnly': args.home_only}}
    (args.artifacts/'build-report.json').write_bytes(encode(report)); print(json.dumps(report), flush=True)


if __name__ == '__main__': main()
