"""Audit delivery hashes, provenance and native cross-references without a GPU.

This establishes resource integrity, not reference-screen visual equivalence.
Reports and optional private extraction inputs remain outside the repository.
"""
import argparse
from collections import Counter
import json
from pathlib import Path, PurePosixPath
import struct
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from firmware.build import FIRMWARE, HOME, SHARED, TITLES, SCRIPTS, digest, encode, public_path, decode_layers
from firmware.build import SETTINGS, SYSTEM_UPDATER, SETTINGS_MESSAGE_ARCHIVE, SETTINGS_STYLE_PAIRS, MESSAGE_LOCALE, message_locale
from firmware.build import unpack_archive, unpack_stock_table, STOCK_TABLE_TITLES, STOCK_TABLE_PATHS
from firmware.cia import content_record, content_directory
from unpack_home_resources import unpack_darc


def flatten(nodes):
    for node in nodes:
        yield node
        yield from flatten(node['children'])


def compare_delivery(left, right):
    """Compare actual bytes and complete file sets, not just claimed hashes."""
    def inventory(root):
        return {path.relative_to(root).as_posix(): digest(path.read_bytes())
                for path in sorted(root.rglob('*')) if path.is_file()}
    a, b = inventory(Path(left)), inventory(Path(right))
    return {'equal': a == b, 'files': len(a), 'onlyLeft': sorted(a.keys()-b.keys()),
            'onlyRight': sorted(b.keys()-a.keys()),
            'changed': sorted(name for name in a.keys() & b.keys() if a[name] != b[name])}


def audit(root, artifacts=None, repository=None):
    root = Path(root)
    manifest = json.loads((root/'manifest.json').read_text())
    report = {'schema': 1, 'firmware': manifest['firmware'], 'manifestSha256': digest((root/'manifest.json').read_bytes()),
              'counts': Counter(), 'errors': [], 'warnings': [], 'privateSourcesChecked': 0}
    records = manifest['resources']
    cache = {}

    def check(condition, message):
        if not condition: report['errors'].append(message)

    def reference(url, context):
        check(url in records, f'{context}: missing resource record {url}')
        return url in records

    def source_check(source, context):
        title = source.get('titleId')
        check(title in manifest['sources'], f'{context}: unknown source title {title}')
        metadata = manifest['sources'].get(title, {})
        contents = metadata.get('contents', [])
        content = None
        if len(contents) > 1 or 'contentIndex' in source or 'contentId' in source:
            content = content_record(metadata, source.get('contentIndex'))
            if source.get('contentId') != content['id']:
                raise ValueError('Missing/mismatched content identity')
        if artifacts is None or title not in {SHARED, *TITLES}: return
        slug = 'shared-font' if title == SHARED else TITLES[title][0]
        title_root = Path(artifacts)/'extracted'/slug
        base = content_directory(title_root, metadata, content['index']) if content else title_root
        name = source['path']
        # Pack roots hash the stored compressed archive; members and fonts hash
        # decoded bytes. Both identities are verified against the actual source.
        key = (title, content['index'] if content else None, name)
        if key not in cache:
            if name.startswith('ExeFS/'):
                path = public_path(base/'exefs', name[6:])
                if not path.exists(): path = path.with_suffix('.bin')
                cache[key] = [digest(path.read_bytes())]
            else:
                parts = name.removeprefix('RomFS/').split('/')
                for end in range(len(parts), 0, -1):
                    relative = '/'.join(parts[:end])
                    path = public_path(base/'romfs', relative)
                    if not path.is_file(): continue
                    archive_key = (title, content['index'] if content else None, relative, 'decoded')
                    if archive_key not in cache:
                        packed = path.read_bytes(); decoded = decode_layers(packed)
                        members = unpack_archive(decoded) if decoded[:4] in (b'darc', b'SARC') else {}
                        if title in STOCK_TABLE_TITLES and relative in STOCK_TABLE_PATHS:
                            members = unpack_stock_table(decoded)
                            for member, data in list(members.items()):
                                if data[:4] in (b'darc', b'SARC'):
                                    members.update({member+'/'+name: value for name, value in unpack_archive(data).items()})
                        cache[archive_key] = (packed, decoded, members)
                    packed, decoded, members = cache[archive_key]
                    cache[key] = ([digest(members['/'.join(parts[end:])])] if end < len(parts)
                                  else [digest(packed), digest(decoded)])
                    break
                else:
                    if name == 'RomFS':
                        stored = json.loads((title_root/'source.json').read_text())
                        if content:
                            original = content_record(stored, content['index'])
                            if original != content: raise ValueError('Private content metadata mismatch')
                            cache[key] = [original['sha256']]
                        else:
                            cache[key] = [stored['contentSha256']]
                    else: raise ValueError(f'Missing private resource: {name}')
        check(source['sha256'] in cache[key], f'{context}: private source hash mismatch for {name}')
        report['privateSourcesChecked'] += 1

    check(manifest['schema'] == 1 and manifest['firmware'] == FIRMWARE, 'Unexpected manifest schema/firmware')
    converter = manifest.get('converter', {})
    check(bool(converter.get('version')) and bool(converter.get('scripts')) and bool(converter.get('extractor')), 'Missing converter identity')
    if repository:
        for name, sha in converter.get('scripts', {}).items():
            check(digest(public_path(Path(repository), name).read_bytes()) == sha, f'Converter source changed: {name}')
    for title, source in manifest['sources'].items():
        check(source.get('titleId') == title, f'Source title mismatch: {title}')
        check(Path(source.get('file', '')).name == source.get('file') and bool(source.get('file')), f'Missing/absolute source filename: {title}')
        if source.get('contents'):
            try:
                contents = source['contents']
                for content in contents: content_record(source, content['index'])
                check(len({c['id'] for c in contents}) == len(contents), f'{title}: duplicate content ids')
                selected = content_record(source, source['resourceContentIndex'])
                applications = [c for c in contents if c['ncch']['formType'] in (2, 3) and c['ncch']['contentType'] == 0]
                check((len(applications) == 1 and selected == applications[0]) or
                      (len(contents) == 1 and not applications), f'{title}: ambiguous resource content')
                check(source['contentSha256'] == selected['sha256'], f'{title}: selected content hash mismatch')
                check(all(c['sha256'] == c['tmdSha256'] and c['ncch']['programId'] == title for c in contents),
                      f'{title}: content hash/program identity mismatch')
                if artifacts is not None and title in {SHARED, *TITLES}:
                    slug = 'shared-font' if title == SHARED else TITLES[title][0]
                    stored = json.loads((Path(artifacts)/'extracted'/slug/'source.json').read_text())
                    check(stored['sourceSha256'] == source['sourceSha256'], f'{title}: private CIA hash mismatch')
                    if 'contents' in stored:
                        check(stored['contents'] == contents, f'{title}: private content metadata mismatch')
                    else:
                        check(len(contents) == 1 and stored['contentSha256'] == selected['sha256'],
                              f'{title}: incompatible legacy extraction')
            except (ValueError, KeyError, OSError) as error:
                report['errors'].append(f'{title}: {error}')
    for url, record in records.items():
        try:
            raw = public_path(root, url).read_bytes()
            check(digest(raw) == record['sha256'] and len(raw) == record['size'], f'Resource hash/size mismatch: {url}')
            if not url.startswith(('audio/', 'models/')):
                check(url.endswith(('.png', '.json')), f'Unexpected public format: {url}')
                for source in record['sources']: source_check(source, url)
        except (ValueError, KeyError, OSError) as error: report['errors'].append(f'{url}: {error}')
    report['counts']['resources'] = len(records)
    # Orphans are reported rather than deleted: a separately owned command may
    # still be compiling its manifest. Unknown files are never silently removed.
    for path in sorted(root.rglob('*')):
        if path.is_file():
            url = path.relative_to(root).as_posix()
            if url != 'manifest.json' and url not in records and not url.startswith(('models/', 'audio/')):
                report['warnings'].append({'kind': 'unreferencedFile', 'path': url})
    for url in manifest['home'].values(): reference(url, 'HOME')
    font_urls = set(manifest['fonts'].values())
    for title in manifest['titles'].values():
        for url in title['packs']: reference(url, title['name'])
        font_urls.update(title.get('fonts', {}).values())
        if title.get('icon'): reference(title['icon'], title['name'])
    for url in sorted(font_urls):
        if not reference(url, 'font'): continue
        font = json.loads(public_path(root, url).read_text()); dimensions = []
        for sheet in font['sheets']:
            sheet_url = str(Path(url).parent/sheet)
            if not reference(sheet_url, url): continue
            raw = public_path(root, sheet_url).read_bytes()
            check(raw.startswith(b'\x89PNG\r\n\x1a\n'), f'Invalid font image: {sheet_url}')
            dimensions.append(struct.unpack_from('>II', raw, 16))
        glyphs = [*font['glyphs'].values(), *([font['fallback']] if font['fallback'] else [])]
        for glyph in glyphs:
            check(0 <= glyph['sheet'] < len(dimensions), f'{url}: glyph sheet out of bounds')
            if 0 <= glyph['sheet'] < len(dimensions):
                w, h = dimensions[glyph['sheet']]
                check(0 <= glyph['x'] <= glyph['x']+glyph['width'] <= w and
                      0 <= glyph['y'] <= glyph['y']+glyph['height'] <= h, f'{url}: glyph rectangle out of bounds')
        report['counts']['glyphs'] += len(font['glyphs'])
        report['counts']['fontAtlases'] += len(font['sheets'])
    packs = sorted(url for url, record in records.items() if record['kind'] == 'pack')
    for url in packs:
        pack = json.loads(public_path(root, url).read_text())
        selection = pack.get('localeSelection')
        localized_settings = pack['titleId'] in (SETTINGS, SYSTEM_UPDATER) and any(
            s.get('path') == SETTINGS_MESSAGE_ARCHIVE for s in records[url]['sources'])
        check(not localized_settings or selection is not None, f'{url}: missing Settings locale selection')
        if selection is not None:
            check(localized_settings and selection.get('locale') == MESSAGE_LOCALE, f'{url}: unexpected locale selection')
            selected_paths = set(); rejected_paths = set()
            for disposition, paths in [('selected', selected_paths), ('rejected', rejected_paths)]:
                for source in selection.get(disposition, []):
                    try:
                        locale = message_locale(source['path'])
                        check(all(source.get(k) == pack.get(k) for k in ('titleId', 'contentIndex', 'contentId')),
                              f'{url}: locale-selection content identity mismatch')
                        check(locale == source.get('locale'), f'{url}: source locale mismatch')
                        check((locale == MESSAGE_LOCALE) == (disposition == 'selected'), f'{url}: incorrect locale disposition')
                        check(source['path'] not in paths, f'{url}: duplicate locale-selection path')
                        paths.add(source['path'])
                        source_check(source, f'{url}/{disposition}')
                    except (ValueError, KeyError, OSError) as error:
                        report['errors'].append(f'{url}/{disposition}: {error}')
            check(not selected_paths.intersection(rejected_paths), f'{url}: selected/rejected paths overlap')
            required_paths = {SETTINGS_MESSAGE_ARCHIVE+'/'+path
                              for pair in SETTINGS_STYLE_PAIRS.items() for path in pair}
            check(required_paths.issubset(selected_paths), f'{url}: missing required Settings message/style pairs')
            converted = [s for bucket in ('messages', 'styles') for s in pack.get('resourceSources', {}).get(bucket, {}).values()]
            selected = [{k: v for k, v in s.items() if k != 'locale'} for s in selection.get('selected', [])]
            if pack.get('uiSelection', {}).get('schema') == 1:
                # Locale selection describes the complete source archive; a UI
                # delivery can retain only named banks and their sibling styles.
                check(all(source in selected for source in converted),
                      f'{url}: selected message/style provenance differs from converted resources')
            else:
                check(sorted(converted, key=lambda s: s['path']) == sorted(selected, key=lambda s: s['path']),
                      f'{url}: selected message/style provenance differs from converted resources')
        multi_content = len(manifest['sources'].get(pack['titleId'], {}).get('contents', [])) > 1
        if multi_content:
            identity = {key: pack.get(key) for key in ('contentIndex', 'contentId')}
            check(all(all(source.get(key) == value for key, value in identity.items())
                      for source in records[url]['sources']), f'{url}: pack content identity mismatch')
        for bucket in ('layouts', 'animations', 'textures', 'messages', 'styles'):
            members = pack.get(bucket, {})
            report['counts'][bucket] += len(members)
            sources = pack.get('resourceSources', {}).get(bucket, {})
            check(set(sources) == set(members), f'{url}: missing {bucket} member provenance')
            for key, source in sources.items():
                if multi_content:
                    check(all(source.get(k) == v for k, v in identity.items()), f'{url}/{key}: member content identity mismatch')
                try: source_check(source, f'{url}/{key}')
                except (ValueError, KeyError, OSError) as error: report['errors'].append(f'{url}/{key}: {error}')
        for name, texture in pack['textures'].items():
            if reference(texture['url'], name):
                check(records[texture['url']]['sha256'] == texture['sha256'], f'{name}: texture hash mismatch')
        for name, layout in pack['layouts'].items():
            context = f'{url}/{name}'
            for issue in layout['unsupported']:
                report['warnings'].append({'kind': 'unsupportedLayoutField', 'resource': context, 'detail': issue})
            panes = list(flatten(layout['roots'])); pane_names = {p['name'] for p in panes}
            for texture in layout['textures']: check(texture in pack['textures'], f'{context}: missing texture {texture}')
            for material in layout['materials']:
                for issue in material['unsupported']:
                    report['warnings'].append({'kind': 'unsupportedMaterialField', 'resource': context, 'material': material['name'], 'detail': issue})
                for texture in material['textureMaps']:
                    check(0 <= texture['texture'] < len(layout['textures']), f'{context}: texture index out of bounds')
            for group in flatten(layout['groups']):
                for pane in group['panes']: check(pane in pane_names, f'{context}: missing group pane {pane}')
            for pane in panes:
                pictures = [pane[k] for k in ('picture', 'text') if k in pane]
                if 'window' in pane: pictures += [pane['window']['content'], *pane['window']['frames']]
                for picture in pictures:
                    check(0 <= picture['material'] < len(layout['materials']), f'{context}/{pane["name"]}: missing material')
                if 'text' in pane:
                    check(0 <= pane['text']['font'] < len(layout['fonts']), f'{context}/{pane["name"]}: missing font')
        for name, animation in pack['animations'].items():
            context = f'{url}/{name}'
            for issue in animation['unsupported']:
                report['warnings'].append({'kind': 'unsupportedAnimationField', 'resource': context, 'detail': issue})
            candidates = [key for key in pack['layouts'] if name.startswith(key+'_')]
            check(bool(candidates), f'{context}: no parent layout')
            if not candidates: continue
            layout = pack['layouts'][max(candidates, key=len)]
            groups = {g['name'] for g in flatten(layout['groups'])}
            panes = {p['name'] for p in flatten(layout['roots'])}
            materials = {m['name']: m for m in layout['materials']}
            for group in animation['groups']: check(group in groups, f'{context}: missing group {group}')
            for texture in animation['textures']: check(texture in pack['textures'], f'{context}: missing texture {texture}')
            for track in animation['tracks']:
                material = materials.get(track['target']) if track['binding'] == 'material' else None
                check(track['target'] in (materials if track['binding'] == 'material' else panes), f'{context}: missing target {track["target"]}')
                if track['tag'] == 'CLTS' and material and track['index'] >= len(material['textureMatrices']):
                    identity = 1 if track['component'] in (3, 4) else 0
                    report['warnings'].append({'kind': 'unallocatedTextureMatrix', 'pack': url, 'animation': name,
                                               'target': track['target'], 'index': track['index'], 'component': track['component'],
                                               'behavior': 'nativeSkip', 'nonIdentity': any(
                                                   key['value'] != identity or key.get('slope', 0) != 0 for key in track['keys'])})
                if track['tag'] == 'CLMC': check(0 <= track['component'] < 28, f'{context}: material color out of bounds')
                if track['tag'] == 'CLTP':
                    for key in track['keys']: check(0 <= key['value'] < len(animation['textures']), f'{context}: texture pattern out of bounds')
                report['counts']['tracks'] += 1
        for name, messages in pack['messages'].items():
            if 'uiSelection' in pack:
                indices = pack['uiSelection'].get('sourceMessageIndices', {}).get(name, [])
                check(len(indices) == len(messages['messages']) and
                      all(isinstance(index, int) and index >= 0 for index in indices) and
                      indices == sorted(set(indices)), f'{url}/{name}: invalid selected source message indexes')
            for label, index in messages['labels'].items():
                check(0 <= index < len(messages['messages']), f'{url}/{name}: message label {label} out of bounds')
            table_name = messages.get('styleTable')
            if selection is not None:
                source = pack['resourceSources']['messages'][name]
                member = source['path'].removeprefix(SETTINGS_MESSAGE_ARCHIVE+'/')
                expected_table = SETTINGS_STYLE_PAIRS.get(member)
                check(expected_table is not None and table_name == expected_table, f'{url}/{name}: wrong source-locale style binding')
                style_source = pack.get('resourceSources', {}).get('styles', {}).get(table_name, {})
                check(style_source.get('path') == SETTINGS_MESSAGE_ARCHIVE+'/'+str(expected_table) and
                      PurePosixPath(source['path']).parent == PurePosixPath(style_source.get('path', '')).parent and
                      all(source.get(k) == style_source.get(k) for k in ('titleId', 'contentIndex', 'contentId')),
                      f'{url}/{name}: style source differs from message archive/content/locale')
            if table_name is not None:
                table = pack.get('styles', {}).get(table_name)
                check(table is not None, f'{url}/{name}: missing style table {table_name}')
                if table is not None:
                    for message in messages['messages']:
                        index = message['styleIndex']
                        check(index is None or 0 <= index < len(table['styles']), f'{url}/{name}: style index out of bounds')
            for issue in messages['unsupported']:
                report['warnings'].append({'kind': 'unsupportedMessageField', 'resource': f'{url}/{name}', 'detail': issue})
        for name, table in pack.get('styles', {}).items():
            report['counts']['messageStyles'] += len(table['styles'])
            for issue in table['unsupported']:
                report['warnings'].append({'kind': 'unsupportedStyleField', 'resource': f'{url}/{name}', 'detail': issue})
        for issue in pack['unsupported']: report['warnings'].append({'kind': 'unsupportedResource', 'pack': url, **issue})
    report['warnings'] += [{'kind': 'unsupportedContainer', **issue} for issue in manifest.get('unsupported', [])]
    report['warningCounts'] = dict(Counter(w['kind'] for w in report['warnings']))
    report['ok'] = not report['errors']
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=SCRIPTS.parent/'public/os/firmware'/FIRMWARE)
    parser.add_argument('--artifacts', type=Path, help='Private extraction root, to verify source hashes')
    parser.add_argument('--repository', type=Path, help='Verify converter script hashes against this checkout')
    parser.add_argument('--compare', type=Path, help='Compare bytes/file set with an independently rebuilt delivery directory')
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    if args.report.resolve().is_relative_to(SCRIPTS.parent.resolve()): parser.error('Reports must stay outside the repository')
    result = audit(args.output, args.artifacts, args.repository)
    if args.compare:
        result['reproducibility'] = compare_delivery(args.output, args.compare)
        if not result['reproducibility']['equal']:
            result['errors'].append('Independent delivery build differs'); result['ok'] = False
    args.report.parent.mkdir(parents=True, exist_ok=True); args.report.write_bytes(encode(result))
    print(json.dumps({key: result[key] for key in ('ok', 'counts', 'warningCounts', 'privateSourcesChecked')}))
    for error in result['errors']: print(error, file=sys.stderr)
    raise SystemExit(0 if result['ok'] else 1)
