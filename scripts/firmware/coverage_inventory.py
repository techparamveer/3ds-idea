"""Read-only firmware animation/audio coverage inventory.

This reports exact source identities and static runtime references. A literal
reference is evidence of code wiring only, never motion or audible parity.
"""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(repo, dump, extracted):
    root = repo / 'public/os/firmware/10.7.0-32E'
    manifest_path = root / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    runtime = {p.relative_to(repo).as_posix(): p.read_text(errors='replace')
               for p in (repo / 'src').rglob('*') if p.suffix in {'.ts', '.tsx', '.js'}}
    def references(name):
        # Whole quoted string avoids counting coincidental substring mentions.
        return [path for path, body in runtime.items()
                if any(q + name + q in body for q in ("'", '"', '`'))]

    titles = {}
    for path in sorted(dump.glob('*.cia')):
        title = path.stem.lower()
        source = manifest['sources'].get(title)
        titles[title] = {'ciaPath': str(path), 'ciaSize': path.stat().st_size,
                         'manifestSelected': source is not None,
                         'version': source.get('version') if source else None,
                         'ciaSha256': source.get('sourceSha256') if source else None,
                         'extractionPresent': False}
    for title, info in manifest['sources'].items():
        titles.setdefault(title, {'ciaPath': None, 'manifestSelected': True,
                                  'version': info.get('version'), 'ciaSha256': info.get('sourceSha256')})
    for source_file in sorted(extracted.glob('*/source.json')):
        source = json.loads(source_file.read_text())
        title = source.get('titleId')
        if title:
            titles.setdefault(title, {})['extractionPresent'] = True
            titles[title]['extractionMetadataPath'] = str(source_file)

    animations = []
    unsupported = []
    resource_types = defaultdict(lambda: {'packs': 0, 'layouts': 0, 'animations': 0,
                                          'textures': 0, 'messages': 0})
    for pack_path in sorted(root.glob('packs/**/*.json')):
        pack = json.loads(pack_path.read_text())
        pack_url = pack_path.relative_to(root).as_posix()
        title = pack.get('titleId')
        if title is None:
            continue  # Auxiliary provenance JSON, not a decoded UI pack.
        version = manifest['sources'].get(title, {}).get('version')
        resource_types[title]['packs'] += 1
        for kind in ('layouts', 'animations', 'textures', 'messages'):
            resource_types[title][kind] += len(pack.get(kind, {}))
        for name, animation in sorted(pack.get('animations', {}).items()):
            source = pack.get('resourceSources', {}).get('animations', {}).get(name, {})
            animations.append({'titleId': title, 'titleVersion': version,
                               'pack': pack_url, 'name': name, 'source': source,
                               'frames': animation.get('frames'), 'loop': animation.get('loop'),
                               'runtimeLiteralReferences': references(name),
                               'unsupportedFields': animation.get('unsupported', [])})
        for issue in pack.get('unsupported', []):
            unsupported.append({'titleId': title, 'titleVersion': version,
                                'pack': pack_url, **issue})

    audio_path = root / 'audio/audio.json'
    audio = json.loads(audio_path.read_text()) if audio_path.exists() else {}
    cues = []
    for key, cue in sorted(audio.get('cues', {}).items()):
        output = root / 'audio' / cue['url']
        cues.append({'key': key, 'sourceTitle': audio.get('title'),
                     'sourcePath': audio.get('source'),
                     'sourceSha256': audio.get('sourceSha256'),
                     'archiveId': cue.get('archiveId'), 'sequenceIndex': cue.get('index'),
                     'output': output.relative_to(root).as_posix(),
                     'outputSha256': cue.get('sha256'),
                     'outputHashMatches': output.is_file() and sha(output) == cue.get('sha256'),
                     'runtimeLiteralReferences': references(key),
                     'unappliedCommands': cue.get('unappliedCommands', {})})
    published_audio = [p.relative_to(root).as_posix() for p in sorted((root / 'audio').rglob('*'))
                       if p.is_file()]
    unlisted_audio = sorted(set(published_audio) - {'audio/audio.json'} - {x['output'] for x in cues})
    unsupported_containers = manifest.get('unsupported', [])
    counts = {'dumpCias': len(list(dump.glob('*.cia'))), 'manifestSourceTitles': len(manifest['sources']),
              'privateExtractedTitles': sum(bool(t.get('extractionPresent')) for t in titles.values()),
              'publishedAnimations': len(animations),
              'animationsWithoutExactRuntimeLiteral': sum(not x['runtimeLiteralReferences'] for x in animations),
              'animationsWithUnsupportedFields': sum(bool(x['unsupportedFields']) for x in animations),
              'publishedCues': len(cues), 'cuesWithoutExactRuntimeLiteral': sum(not x['runtimeLiteralReferences'] for x in cues),
              'unsupportedPackResources': len(unsupported),
              'unsupportedContainers': len(unsupported_containers), 'unlistedAudioFiles': len(unlisted_audio)}
    by_title = defaultdict(lambda: {'animations': 0, 'animationsWithoutExactRuntimeLiteral': 0,
                                    'animationsWithUnsupportedFields': 0, 'unsupportedPackResources': 0, 'cues': 0})
    for x in animations:
        row = by_title[x['titleId']]; row['animations'] += 1
        row['animationsWithoutExactRuntimeLiteral'] += not bool(x['runtimeLiteralReferences'])
        row['animationsWithUnsupportedFields'] += bool(x['unsupportedFields'])
    for x in unsupported: by_title[x['titleId']]['unsupportedPackResources'] += 1
    for x in cues: by_title[x['sourceTitle']['titleId']]['cues'] += 1
    for title, kinds in resource_types.items(): by_title[title]['resourceTypes'] = kinds
    for x in unsupported_containers:
        by_title[x['titleId']]['unsupportedContainers'] = by_title[x['titleId']].get('unsupportedContainers', 0) + 1
    sound_wait = next((x for x in animations if x['titleId'] == '0004001000022500'
                       and x['name'] == 'ParakeetA_U_Wait'), None)
    return {'schema': 1, 'manifestPath': str(manifest_path), 'manifestSha256': sha(manifest_path),
            'audioManifestPath': str(audio_path), 'audioManifestSha256': sha(audio_path) if audio_path.exists() else None,
            'firmware': manifest['firmware'], 'counts': counts, 'byTitle': dict(sorted(by_title.items())),
            'titles': titles, 'animations': animations, 'cues': cues,
            'unsupportedPackResources': unsupported, 'unsupportedContainers': unsupported_containers,
            'unlistedAudioFiles': unlisted_audio,
            'nextImplementationTarget': {
                'titleId': '0004001000022500', 'titleVersion': manifest['sources']['0004001000022500']['version'],
                'name': 'ParakeetA_U_Wait', 'source': sound_wait['source'], 'pack': sound_wait['pack'],
                'frames': sound_wait['frames'], 'runtimeCode': 'src/os/stock-native-sound.ts',
                'observation': 'Sound draws the published looping upper bird clip with frame:0; motion remains static in the browser capture.',
                'acceptanceGate': 'Bind advancing source frame and compare matched native/browser frame checkpoints; audio tier remains separate.'
            } if sound_wait else None,
            'limitations': ['Only manifest-selected public packs are decoded for animation coverage.',
                            'Private extraction metadata exists for only the titles marked extractionPresent; other CIA internals are not inventoried.',
                            'Exact quoted runtime references are static indicators, not proof of active drawing or playback. Dynamic bindings can appear unused.',
                            'Audio coverage includes published cue outputs; unconverted archive sequences, streams, banks and wave resources are not enumerated.',
                            'Motion, input, browser pixels and native audio are not compared.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', type=Path, required=True)
    parser.add_argument('--dump', type=Path, required=True)
    parser.add_argument('--extracted', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if args.report.resolve().is_relative_to(args.repository.resolve()):
        parser.error('Report must stay outside the repository')
    result = inventory(args.repository, args.dump, args.extracted)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    print(json.dumps(result['counts'], sort_keys=True))
