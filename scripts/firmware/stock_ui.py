"""Publish selected converted stock UI resources without rebuilding HOME.

Input packs and provenance are produced by the existing firmware converter in a
private directory. Only the requested native resources and dependency PNGs/fonts
are added to an existing delivery manifest. No package/executable/audio is copied.
"""
import argparse
import copy
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from firmware.build import HOME, SHARED, EXCLUDED, public_path, digest, encode

UI_EXCLUDED = EXCLUDED | {'000400300000d002'}
CATEGORIES = ('layouts', 'animations', 'textures', 'messages', 'styles')

def supported(value):
    if isinstance(value, dict):
        if value.get('unsupported'): raise ValueError('Selected UI resource has unsupported fields')
        for child in value.values(): supported(child)
    elif isinstance(value, list):
        for child in value: supported(child)


def select_pack(pack, selection):
    result = {key: copy.deepcopy(value) for key, value in pack.items() if key not in (*CATEGORIES, 'resourceSources', 'unsupported')}
    result.update(layouts={}, animations={}, textures={}, messages={}, unsupported=[], resourceSources={})
    needed_textures = set(); fonts = set()
    for bucket in ('layouts', 'animations'):
        for name in selection.get(bucket, []):
            if name not in pack[bucket]: raise ValueError(f'Missing selected {bucket}: {name}')
            value = copy.deepcopy(pack[bucket][name]); supported(value)
            result[bucket][name] = value; needed_textures.update(value.get('textures', []))
            if bucket == 'layouts': fonts.update(value['fonts'])
    for name in sorted(needed_textures):
        if name not in pack['textures']: raise ValueError('Missing selected texture: '+name)
        result['textures'][name] = copy.deepcopy(pack['textures'][name])
    message_indices = {}
    for bank, labels in selection.get('messages', {}).items():
        source = pack['messages'][bank]
        if any(label not in source['labels'] for label in labels): raise ValueError('Missing selected message label')
        indices = sorted({source['labels'][label] for label in labels})
        mapping = {old: new for new, old in enumerate(indices)}
        value = {key: copy.deepcopy(v) for key, v in source.items() if key not in ('labels', 'messages')}
        value['labels'] = {label: mapping[source['labels'][label]] for label in sorted(labels)}
        value['messages'] = [copy.deepcopy(source['messages'][index]) for index in indices]
        result['messages'][bank] = value; message_indices[bank] = indices
        if 'styleTable' in value:
            table = value['styleTable']
            result.setdefault('styles', {})[table] = copy.deepcopy(pack['styles'][table])
    for bucket in CATEGORIES:
        if bucket in result:
            result['resourceSources'][bucket] = {name: copy.deepcopy(pack['resourceSources'][bucket][name]) for name in result[bucket]}
    result['uiSelection'] = {'schema': 1, 'sourceMessageIndices': message_indices,
                             'omittedUnsupportedResources': len(pack.get('unsupported', []))}
    return result, fonts


def validate_part_links(layouts):
    """Selected FLYT parts must have one explicit, acyclic selected dependency."""
    by_name = {}
    for name, layout in layouts:
        by_name.setdefault(name, []).append(layout)
    def links(panes):
        for pane in panes:
            if pane.get('part'): yield pane['part']['layout']
            yield from links(pane.get('children', []))
    def visit(layout, path):
        if len(path) > 8: raise ValueError('Excessive selected FLYT part depth')
        for name in links(layout['roots']):
            targets = by_name.get(name, [])
            if len(targets) != 1 or targets[0].get('sourceFormat') != 'FLYT':
                raise ValueError('Missing or ambiguous selected FLYT part: '+name)
            if name in path: raise ValueError('Cyclic selected FLYT part: '+name)
            visit(targets[0], path+[name])
    for name, layout in layouts:
        if layout.get('sourceFormat') == 'FLYT': visit(layout, [name])


def publish(source_root, output, plan):
    source = json.loads((source_root/'manifest.json').read_bytes())
    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    if source.get('firmware') != manifest.get('firmware') or source.get('locale') != manifest.get('locale'):
        raise ValueError('Source/delivery firmware or locale differs')
    protected = {key: copy.deepcopy(manifest.get(key)) for key in ('home', 'fonts', 'audio', 'models', 'converter')}
    old_home_title = copy.deepcopy(manifest['titles'][HOME]); old_home_source = copy.deepcopy(manifest['sources'][HOME])
    existing = copy.deepcopy(manifest['resources']); pending = {}; records = {}
    def original(url):
        data = public_path(source_root, url).read_bytes()
        record = source['resources'][url]
        if digest(data) != record['sha256'] or len(data) != record['size']: raise ValueError('Source resource hash differs: '+url)
        return data, copy.deepcopy(record)
    def copied(url):
        data, record = original(url)
        if url in existing and existing[url]['sha256'] != record['sha256']: raise ValueError('Existing dependency differs: '+url)
        # Content-addressed PNGs can already belong to HOME. The new pack's
        # resourceSources records its own source; preserve the existing global record.
        pending[url] = data; records[url] = copy.deepcopy(existing.get(url, record))
    for title, requested in plan['titles'].items():
        if title in UI_EXCLUDED or title in (HOME, SHARED): raise ValueError('Title outside stock UI scope')
        info = copy.deepcopy(source['titles'][title]); info['packs'] = []; info['fonts'] = {}
        needed_fonts = set(); selected_layouts = []
        for url, selection in requested['packs'].items():
            if url not in source['titles'][title]['packs']: raise ValueError('Unlisted source pack')
            data, record = original(url); pack = json.loads(data)
            if pack['titleId'] != title: raise ValueError('Pack title mismatch')
            selected, fonts = select_pack(pack, selection)
            selected_layouts.extend(selected['layouts'].items())
            namespace = f'contents/{pack["contentIndex"]:04x}-{pack["contentId"]}/' if 'contentIndex' in pack else ''
            needed_fonts.update(namespace + name for name in fonts)
            encoded = encode(selected)
            record.update(size=len(encoded), sha256=digest(encoded))
            pending[url] = encoded; records[url] = record; info['packs'].append(url)
            for texture in selected['textures'].values(): copied(texture['url'])
        validate_part_links(selected_layouts)
        for name in sorted(needed_fonts):
            url = source['titles'][title]['fonts'].get(name)
            if url:
                copied(url); font = json.loads(pending[url])
                for sheet in font['sheets']: copied(str(Path(url).parent/sheet))
                info['fonts'][name] = url
            elif name.split('/')[-1] in requested.get('fontBindings', {}):
                binding = requested['fontBindings'][name.split('/')[-1]]
                if binding not in manifest['fonts']: raise ValueError('Unknown shared font binding: '+binding)
                target = manifest['fonts'][binding]
                if existing.get(target, {}).get('kind') != 'font': raise ValueError('Unverified shared font binding: '+binding)
                # An explicit presentation binding to an existing native font,
                # not a claim about the application's internal resource mapping.
                info['fonts'][name] = target
            elif name.split('/')[-1] not in ('cbf_std.bcfnt', 'Hud_JP.bcfnt'):
                raise ValueError('Unbound stock font: '+name)
        if info.get('icon'): copied(info['icon'])
        info['uiSelection'] = {'schema': 1, 'planSha256': digest(encode(requested)),
                               'sourceManifestSha256': digest((source_root/'manifest.json').read_bytes()),
                               'publisherSha256': digest(Path(__file__).read_bytes()),
                               'sourceConverter': source.get('converter')}
        if requested.get('fontBindings'):
            info['uiSelection']['presentationFontBindings'] = copy.deepcopy(requested['fontBindings'])
        manifest['titles'][title] = info
        manifest['sources'][title] = copy.deepcopy(source['sources'][title])
    manifest['resources'].update(records)
    manifest['excludedTitles'] = sorted(set(manifest.get('excludedTitles', [])) | UI_EXCLUDED)
    if any(key in manifest['titles'] or key in manifest['sources'] for key in UI_EXCLUDED):
        raise ValueError('Delivery already contains an excluded title; reconcile separately')
    if protected != {key: manifest.get(key) for key in protected} or old_home_title != manifest['titles'][HOME] or old_home_source != manifest['sources'][HOME]:
        raise ValueError('HOME/shared delivery changed')
    for url, record in existing.items():
        if any(s.get('titleId') in (HOME, SHARED) for s in record.get('sources', [])):
            if manifest['resources'][url] != record: raise ValueError('HOME/shared provenance changed')
            actual = public_path(output, url).read_bytes()
            if digest(actual) != record['sha256']: raise ValueError('Existing HOME/shared bytes are not verified')
    # All validation finishes before any destination writes.
    for url, data in pending.items():
        target = public_path(output, url); target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
    manifest_path.write_bytes(encode(manifest))
    return {'titles': list(plan['titles']), 'resources': len(pending), 'bytes': sum(map(len, pending.values())),
            'manifestSha256': digest(encode(manifest)), 'homeAndSharedPreserved': True}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--plan', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(publish(args.source, args.output, json.loads(args.plan.read_bytes())), sort_keys=True))
