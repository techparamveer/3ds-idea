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
from firmware.cia import cia_metadata, content_directory, content_key, content_provenance
from firmware.archives import unpack_sarc, unpack_stock_table

FIRMWARE = '10.7.0-32E'
CONVERTER_VERSION = '1.4.0'
HOME = '0004003000009802'
SHARED = '0004009b00014002'
HOME_STYLE_PATHS = {'message/EU_English/RI_mstl_LZ.bin', 'message_hud/EU_English/RI_mstl_LZ.bin'}
STOCK_STYLE_PATHS = {
    '0004001000022300': {'message/EU_English/RI_mstl_LZ.bin'},
    '0004003000009f02': {'message/EU_English/RI_mstl_LZ.bin', 'message_hud/EU_English/RI_mstl_LZ.bin'},
    '000400300000a002': {'message/EU_English/RI_mstl_LZ.bin', 'message_hud/EU_English/RI_mstl_LZ.bin'},
}
SETTINGS = '0004001000022000'
SYSTEM_UPDATER = '0004001000022f00'
SETTINGS_MESSAGE_ARCHIVE = 'message_EU_LZ.bin'
SETTINGS_STYLE_PAIRS = {
    'message_hud/EU_English/hud.msbt': 'message_hud/EU_English/RI.mstl',
    'message_mset/EU_English/mset.msbt': 'message_mset/EU_English/RI.mstl',
}
MESSAGE_LOCALE = 'EU_English'
EXCLUDED = {
    '0004001000022100',  # Download Play
    '0004001000022200',  # Activity Log
    '0004001000022700',  # Mii Maker
    '0004001000022800',  # StreetPass Mii Plaza
    '0004001000022d00',  # Face Raiders
    '0004001000022e00',  # AR Games
}
TITLES = {
    HOME: ('home', 'HOME Menu', 'system'),
    '0004001000022000': ('settings', 'System Settings', 'app'),
    '0004001000022300': ('health-and-safety', 'Health and Safety Information', 'app'),
    '0004001000022400': ('camera', 'Nintendo 3DS Camera', 'app'),
    '0004001000022500': ('sound', 'Nintendo 3DS Sound', 'app'),
    '0004001000022900': ('eshop', 'Nintendo eShop', 'app'),
    '0004001000022a00': ('system-transfer', 'System Transfer', 'app'),
    '0004001000022b00': ('nintendo-zone', 'Nintendo Zone Viewer', 'app'),
    '0004001000022f00': ('system-updater', 'System Update', 'app'),
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
STOCK_TABLE_TITLES = {'0004001000022400', '0004001000022500'}
STOCK_TABLE_PATHS = {'lyt/C.LZ', 'msg/EU_English.LZ'}
STOCK_STYLE_NAMES = {'RI.mstl', 'RI.mstl.lz', 'RI.mstl.cmp', 'RI_mstl_LZ.bin'}


def stock_style(title, path):
    return title in TITLES and title not in (HOME, '000400300000d002') and PurePosixPath(path).name in STOCK_STYLE_NAMES


def unpack_archive(raw):
    return unpack_sarc(raw) if raw[:4] == b'SARC' else unpack_darc(raw)


def digest(data): return hashlib.sha256(data).hexdigest()
def encode(value): return (json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(',', ':'), allow_nan=False)+'\n').encode()


def message_locale(path):
    """Read a complete locale directory component, never a basename substring."""
    locales = [part for part in PurePosixPath(path).parts if re.fullmatch(r'[A-Z]{2}_[A-Za-z]+', part)]
    if len(locales) != 1: raise ValueError(f'Missing or ambiguous message locale: {path}')
    return locales[0]


def select_message_locale(resources, title, source_path, content):
    if title not in (SETTINGS, SYSTEM_UPDATER) or source_path != SETTINGS_MESSAGE_ARCHIVE: return resources, None
    selection = {'locale': MESSAGE_LOCALE, 'selected': [], 'rejected': []}
    selected = {}; banks = {}
    for path, raw in sorted(resources.items()):
        locale = message_locale(path)
        source = {'titleId': title, 'path': source_path+'/'+path, 'sha256': digest(raw), **content, 'locale': locale}
        if locale != MESSAGE_LOCALE:
            selection['rejected'].append(source)
            continue
        if path in SETTINGS_STYLE_PAIRS and raw[:8] != b'MsgStdBn':
            raise ValueError(f'Invalid selected Settings message signature: {path}')
        selection['selected'].append(source); selected[path] = raw
        if raw[:8] == b'MsgStdBn':
            key = PurePosixPath(path).stem
            if key in banks:
                raise ValueError(f'Ambiguous {locale} message bank {key}: {banks[key]}; {path}')
            banks[key] = path
    if not banks: raise ValueError(f'No {MESSAGE_LOCALE} message banks in {source_path}')
    missing = set(SETTINGS_STYLE_PAIRS).difference(banks.values())
    if missing:
        raise ValueError(f'Missing required Settings message banks: {", ".join(sorted(missing))}')
    for path in banks.values():
        if path not in SETTINGS_STYLE_PAIRS:
            raise ValueError(f'Unestablished Settings message/style binding: {path}')
        if SETTINGS_STYLE_PAIRS[path] not in selected:
            raise ValueError(f'Missing same-locale Settings style table for {path}')
    return selected, selection


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
    scripts = ['firmware/build.py', 'firmware/cia.py', 'firmware/native.py', 'firmware/animation_hierarchy.py', 'firmware/texture.py',
               'firmware/archives.py', 'convert_bcfnt.py', 'unpack_home_resources.py']
    result = subprocess.run([str(ctrtool), '--help'], capture_output=True, text=True, timeout=10)
    # CTRTool prints its identity with help, returning 1 for this invocation.
    match = re.search(r'^CTRTool v([^\s]+)', result.stdout+result.stderr, re.MULTILINE)
    if not match: raise ValueError('Unable to identify selected CTRTool version')
    return {'name': 'ctr-native-web', 'version': CONVERTER_VERSION,
            'scripts': {f'scripts/{name}': digest((SCRIPTS/name).read_bytes()) for name in scripts},
            'extractor': {'name': 'CTRTool', 'version': match[1], 'sha256': digest(ctrtool.read_bytes())}}


def extract(ctrtool, package, scratch, metadata):
    if cia_metadata(package.read_bytes(), metadata['titleId']) != metadata:
        raise ValueError('Package changed since metadata validation')
    selected = content_directory(scratch, metadata, metadata['resourceContentIndex'])
    marker = scratch/'source.json'
    legacy = {k: v for k, v in metadata.items() if k not in ('contents', 'resourceContentIndex')}
    if marker.exists():
        stored = json.loads(marker.read_text())
        if stored == metadata or (len(metadata['contents']) == 1 and stored == legacy):
            for content in metadata['contents']:
                folder = content_directory(scratch, metadata, content['index'])
                for name in ('romfs', 'exefs'):
                    if content['ncch']['regions'][name]['size'] and not (folder/name).is_dir():
                        raise ValueError('Incomplete cached extraction')
            return selected/'romfs', selected/'exefs'
        raise ValueError(f'Extraction provenance differs: {scratch}')
    scratch.mkdir(parents=True, exist_ok=True)
    if any((scratch/n).exists() for n in ('romfs', 'exefs', 'contents')):
        # Old output must not silently mingle with a different firmware revision.
        raise ValueError(f'Extraction directory already exists without matching provenance: {scratch}')
    for content in metadata['contents']:
        folder = content_directory(scratch, metadata, content['index'])
        folder.mkdir(parents=True, exist_ok=True)
        result = subprocess.run([str(ctrtool), '--plain', '--quiet', f'--ncch={content["index"]}',
                                f'--romfsdir={folder / "romfs"}', f'--exefsdir={folder / "exefs"}',
                                str(package)], capture_output=True, text=True, check=False)
        (folder/'ctrtool.log').write_text(result.stdout+result.stderr)
        if result.returncode: raise ValueError(f'CTRTool failed; see {folder / "ctrtool.log"}')
        for name in ('romfs', 'exefs'):
            if content['ncch']['regions'][name]['size'] and not (folder/name).is_dir():
                raise ValueError(f'CTRTool did not extract {name} for content {content["index"]}')
    marker.write_bytes(encode(metadata))
    return selected/'romfs', selected/'exefs'


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
    def pack(self, resources, name, title, source_path, source_hash, content=None):
        content = content or {}
        resources, selection = select_message_locale(resources, title, source_path, content)
        result = {'schema': 1, 'name': name, 'titleId': title, 'sourceSha256': source_hash, **content,
                  'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}, 'unsupported': [],
                  'resourceSources': {'layouts': {}, 'animations': {}, 'textures': {}, 'messages': {}}}
        if selection is not None: result['localeSelection'] = selection
        for path, raw in sorted(resources.items()):
            source = {'titleId': title, 'path': source_path+'/'+path, 'sha256': digest(raw), **content}
            key = Path(path).stem
            try:
                if raw[:4] == b'CLYT': bucket, value = 'layouts', decode_layout(raw)
                elif raw[:4] == b'CLAN': bucket, value = 'animations', decode_animation(raw)
                elif len(raw) >= 40 and raw[-40:-36] == b'CLIM':
                    bucket, key, value = 'textures', Path(path).name, self.texture(raw, source)
                elif raw[:8] == b'MsgStdBn': bucket, value = 'messages', decode_msbt(raw)
                elif ((title == HOME and path in HOME_STYLE_PATHS) or
                      path in STOCK_STYLE_PATHS.get(title, set()) or
                      stock_style(title, path) or
                      (selection is not None and path in SETTINGS_STYLE_PAIRS.values())):
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
                if selection is not None and (path in SETTINGS_STYLE_PAIRS or path in SETTINGS_STYLE_PAIRS.values()):
                    raise ValueError(f'Invalid selected Settings message/style resource {path}: {error}') from error
                result['unsupported'].append({'path': path, 'sha256': digest(raw), 'reason': str(error)})
        for key, message in result['messages'].items():
            member = result['resourceSources']['messages'][key]['path'].removeprefix(source_path+'/')
            table = SETTINGS_STYLE_PAIRS[member] if selection is not None else str(Path(member).parent/'RI_mstl_LZ.bin')
            if selection is None and title != HOME:
                candidates = [str(PurePosixPath(member).parent/name) for name in STOCK_STYLE_NAMES
                              if str(PurePosixPath(member).parent/name) in result.get('styles', {})]
                if len(candidates) > 1: raise ValueError('Ambiguous stock sibling message style')
                if candidates: table = candidates[0]
            if selection is not None and table not in result.get('styles', {}):
                raise ValueError(f'Undecodable same-locale Settings style table for {member}')
            if table in result.get('styles', {}):
                message['styleTable'] = table
        slug = TITLES[title][0]
        namespace = f'contents/{content["contentIndex"]:04x}-{content["contentId"]}/' if content else ''
        url = f'packs/{slug}/{namespace}{name}.json'
        self.write(url, encode(result), {'titleId': title, 'path': source_path, 'sha256': source_hash, **content}, 'pack')
        return url, result


def decode_layers(raw):
    for _ in range(4):
        if raw[:1] not in (b'\x10', b'\x11'): return raw
        raw = decompress(raw)
    raise ValueError('Excessive compression nesting')


def convert_title(builder, title, metadata, scratch, home):
    """Convert each extracted content independently; never merge resource names."""
    slug = TITLES[title][0]
    info = {'titleId': title, 'slug': slug, 'name': TITLES[title][1], 'kind': TITLES[title][2],
            'version': metadata['version'], 'sourceSha256': metadata['sourceSha256'], 'packs': [], 'fonts': {}, 'icon': None}
    if len(metadata['contents']) > 1: info['resourceContentIndex'] = metadata['resourceContentIndex']
    for content in metadata['contents']:
        folder = content_directory(scratch, metadata, content['index'])
        romfs, exefs = folder/'romfs', folder/'exefs'
        identity = content_provenance(metadata, content['index'])
        namespace = 'contents/'+content_key(content)+'/' if identity else ''
        icon = exefs/'icon.bin'
        if not icon.exists(): icon = exefs/'icon'
        if content['index'] == metadata['resourceContentIndex'] and icon.is_file():
            smdh = icon.read_bytes()
            if smdh[:4] == b'SMDH' and len(smdh) >= 0x36c0:
                name = smdh[0x208:0x288].decode('utf-16-le').rstrip('\0')
                if name.strip() and name != '???': info['name'] = name
                image = png(48, 48, decode_texture(smdh[0x24c0:0x36c0], 48, 48, 3))
                info['icon'] = builder.write(f'icons/{slug}.png', image, {'titleId': title, 'path': 'ExeFS/icon', 'sha256': digest(smdh), **identity}, 'title-icon')
        loose = {}
        for p in sorted(romfs.rglob('*')):
            if not p.is_file() or p.suffix.lower() in DENIED_SUFFIXES or p.name.lower() in DENIED_NAMES: continue
            relative = str(p.relative_to(romfs))
            if title != HOME:
                locales = [part for part in PurePosixPath(relative).parts[:-1]
                           if re.fullmatch(r'(?:EU|US|JP|CN|TW|KR)_[A-Za-z_]+', part)]
                if len(locales) > 1: raise ValueError('Ambiguous stock resource locale: '+relative)
                if locales and locales[0] != MESSAGE_LOCALE: continue
            # Only English messages enter the site's delivery set; inventory
            # does not discard the owner-provided original packages.
            if re.search(r'(?:EU_|US_)(?:Dutch|French|German|Italian|Portuguese|Russian|Spanish)(?:/|_)', relative): continue
            packed = p.read_bytes()
            try: raw = decode_layers(packed)
            except (ValueError, IndexError):
                builder.unsupported.append({'titleId': title, 'path': relative, 'size': len(packed), 'sha256': digest(packed), 'reason': 'Not supported LZ stream', **identity}); continue
            source = {'titleId': title, 'path': relative, 'sha256': digest(raw), **identity}
            if raw[:4] in (b'darc', b'SARC'):
                try: resources = unpack_archive(raw)
                except ValueError as error:
                    builder.unsupported.append({**source, 'reason': str(error)}); continue
                name = re.sub(r'[^a-zA-Z0-9_-]', '-', relative.removesuffix('_LZ.bin').removesuffix('.arc').removesuffix('.bin'))
                url, pack = builder.pack(resources, name, title, relative, digest(packed), identity)
                info['packs'].append(url)
                if title == HOME: home[name] = url
            elif title in STOCK_TABLE_TITLES and relative in STOCK_TABLE_PATHS:
                resources = unpack_stock_table(raw)
                if relative == 'msg/EU_English.LZ':
                    url, _ = builder.pack(resources, 'msg-EU_English', title, relative, digest(packed), identity)
                    info['packs'].append(url)
                else:
                    for member, data in resources.items():
                        if data[:4] not in (b'darc', b'SARC'): raise ValueError('Unsupported stock table nested archive')
                        url, _ = builder.pack(unpack_archive(data), 'lyt-C-'+member, title, relative+'/'+member, digest(data), identity)
                        info['packs'].append(url)
            elif (raw[:4] in (b'CLYT', b'CLAN') or raw[:8] == b'MsgStdBn' or
                  (len(raw) >= 40 and raw[-40:-36] == b'CLIM') or (title == HOME and relative in HOME_STYLE_PATHS) or
                  relative in STOCK_STYLE_PATHS.get(title, set()) or stock_style(title, relative)):
                loose[relative] = raw
            elif raw[:4] == b'CFNT':
                try:
                    font_name = 'hud' if title == HOME and p.name == 'Hud_JP.bcfnt' else slug+'/'+re.sub(r'[^a-zA-Z0-9_-]', '-', p.stem)
                    if identity: font_name = slug+'/'+namespace+re.sub(r'[^a-zA-Z0-9_-]', '-', p.stem)
                    url = builder.font(raw, font_name, source)
                    info['fonts'][namespace+p.name] = url
                except ValueError as error:
                    builder.unsupported.append({**source, 'reason': 'Font: '+str(error)})
            elif raw[:4] in (b'CGFX', b'CSAR', b'CWAV', b'CSTM'):
                # Owned by the separate model/audio conversion commands.
                continue
            else:
                builder.unsupported.append({**source, 'size': len(raw), 'reason': 'Unconverted application resource container'})
        if loose:
            url, pack = builder.pack(loose, 'messages-and-loose', title, 'RomFS', content['sha256'], identity)
            info['packs'].append(url)
            if title == HOME: home['messages'] = url
    return info


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
        info = convert_title(builder, title, metadata, args.artifacts/'extracted'/slug, manifest['home'])
        if title == HOME and 'Hud_JP.bcfnt' in info['fonts']:
            manifest['fonts']['hud'] = info['fonts']['Hud_JP.bcfnt']
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
