"""Register separately converted visual resources in the firmware delivery."""
import hashlib
import json
from pathlib import Path


def register_resources(manifest, output, key, title_id, source_path, source_sha256, files):
    relative = output.resolve().relative_to(manifest.parent.resolve())
    if relative.parts[0] != 'models' or Path(source_path).is_absolute() or '..' in Path(source_path).parts:
        raise ValueError('Invalid model delivery/source path')
    record = json.loads(manifest.read_text())
    if title_id not in record['sources']:
        raise ValueError('Model title is absent from the extracted manifest')
    record.setdefault('models', {})[key] = (relative / files[0]).as_posix()
    provenance = {'titleId': title_id, 'path': source_path, 'sha256': source_sha256}
    for name in files:
        payload = (output / name).read_bytes()
        kind = 'model-texture' if name.endswith('.png') else 'camera' if name == 'camera.json' else 'model'
        record['resources'][(relative / name).as_posix()] = {
            'kind': kind, 'size': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(), 'sources': [provenance]}
    manifest.write_text(json.dumps(record, sort_keys=True, separators=(',', ':')) + '\n')
