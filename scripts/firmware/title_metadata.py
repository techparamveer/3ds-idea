"""Publish the English SMDH long description used by Game Notes.

Inputs are read as data. This adds text/provenance only; the Notes-specific
64x64 icon conversion and live panel composition are intentionally separate.
"""
import argparse
import hashlib
import json
from pathlib import Path


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def long_description(smdh):
    if len(smdh) < 0x36c0 or smdh[:4] != b'SMDH':
        raise ValueError('Expected a complete SMDH icon payload')
    # 0x10371c..0x103760: language*0x200+0x88; English is language 1.
    # Native destination holds 0x80 UTF-16 units including the terminator.
    field = smdh[0x288:0x386]
    end = next((i for i in range(0, len(field), 2) if field[i:i+2] == b'\0\0'), len(field))
    return field[:end].decode('utf-16-le')


def description_metadata(smdh, source):
    if source.get('path') != 'ExeFS/icon' or source.get('sha256') != sha256(smdh):
        raise ValueError('SMDH does not match its icon provenance')
    return {'longDescription': long_description(smdh),
            'longDescriptionSource': dict(source),
            'longDescriptionConversion': {'name': 'smdh-notes-english-description', 'version': 1,
                'scriptSha256': sha256(Path(__file__).read_bytes()), 'languageIndex': 1,
                'fieldOffset': 0x288, 'maxCodeUnits': 127}}


def publish(manifest, icons):
    # Compute every record before modifying/writing the manifest.
    updates = {}
    for title_id, path in icons.items():
        title = manifest['titles'][title_id]
        icon = manifest['resources'][title['icon']]
        sources = [s for s in icon['sources'] if s.get('titleId') == title_id and s.get('path') == 'ExeFS/icon']
        if len(sources) != 1:
            raise ValueError('Expected exactly one matching title icon source')
        updates[title_id] = description_metadata(Path(path).read_bytes(), sources[0])
    for title_id, value in updates.items():
        manifest['titles'][title_id].update(value)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--icon', action='append', required=True, metavar='TITLE_ID=ABSOLUTE_PATH')
    args = parser.parse_args()
    if not args.manifest.is_absolute(): parser.error('--manifest must be absolute')
    icons = {}
    for entry in args.icon:
        title_id, path = entry.split('=', 1)
        if not Path(path).is_absolute(): parser.error('icon paths must be absolute')
        if title_id in icons: parser.error('duplicate title icon')
        icons[title_id] = path
    manifest = publish(json.loads(args.manifest.read_text()), icons)
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=True, sort_keys=True, separators=(',', ':'), allow_nan=False)+'\n')
    print(f'Published {len(icons)} source-backed English long descriptions; resources unchanged.')


if __name__ == '__main__':
    main()
