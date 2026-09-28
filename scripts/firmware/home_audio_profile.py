"""Validated, isolated application of the versioned HOME-only DualRip patch."""
from contextlib import contextmanager
import hashlib
import io
import json
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tarfile
import tempfile

HERE = Path(__file__).resolve().parent
PROFILE_PATH = HERE / 'home_audio_profile.json'
PATCH_PATH = HERE / 'home_audio_dualrip.patch'
MATH_PATH = HERE / 'home_audio_math.py'
CLOCK_PATH = HERE / 'home_audio_clock.py'
VOICE_PATH = HERE / 'home_audio_voice.py'
DSP_PATH = HERE / 'home_audio_dsp.py'
PROFILE = json.loads(PROFILE_PATH.read_text())


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_source(source, title):
    if sha(source) != PROFILE['archiveSha256']:
        raise ValueError('Unsupported archive: HOME profile requires the exact validated archive hash')
    if any(title.get(key) != value for key, value in PROFILE['sourceRecord'].items()):
        raise ValueError('Unsupported HOME source title/version/provenance')


def validate_archive(archive, names):
    """Preserve and validate sound flags and raw wave channel counts before mixing."""
    from dualrip.formats.ctr.csar import REF_SOUNDS, nw4c_sections
    from dualrip.formats.ctr.cseq import parse_cwar
    csar = archive.csar
    entries = csar._info_table(REF_SOUNDS)
    allowed = PROFILE['soundOptions']
    if not names or len(set(names)) != len(names) or any(name not in allowed for name in names):
        raise ValueError('Cue list must be nonempty, unique and HOME-allowlisted')
    metadata = {}
    selected = [sound for sound in archive.sounds if sound.name in allowed]
    if len(selected) != len(allowed):
        raise ValueError('Missing or duplicate HOME sounds')
    banks = set()
    for sound in selected:
        offset = entries[sound.index]
        flags, = struct.unpack_from('<I', csar.data, offset + 0x14)
        values = csar._flag_values(csar.data, offset + 0x18, flags)
        record = {'flags': hex(flags), 'values': {str(k): v for k, v in values.items()},
                  'volume': sound.volume, 'player': sound.player_id}
        if record != allowed[sound.name] or values.get(1) != 0 or sound.kind != 'sequence':
            raise ValueError(f'Unsupported sound options: {sound.name}')
        metadata[sound.name] = {**record, 'panMode': 0, 'panCurve': 0}
        banks.update(sound.bank_ids)
    if sorted(banks) != PROFILE['bankIds']:
        raise ValueError('Unexpected HOME banks')
    waves = sorted({pair for bank_id in banks for pair in archive.ctx.bank(bank_id).waves})
    inventory = []
    for war, wave in waves:
        raw = parse_cwar(archive.ctx.file_bytes(csar.wars[war], 'war'))[wave]
        info, _ = nw4c_sections(raw, b'CWAV')[0x7000]
        channels, = struct.unpack_from('<I', raw, info + 0x1c)
        if channels != 1:
            raise ValueError('HOME pan profile rejects stereo sources')
        inventory.append({'archive': war, 'wave': wave, 'channels': channels})
    if inventory != PROFILE['referencedBankWaves']:
        raise ValueError('Unexpected HOME wave inventory')
    return metadata, inventory


@contextmanager
def isolated_renderer(renderer, scratch):
    """Export tracked pinned sources; patch only the disposable copy, never checkout."""
    renderer = Path(renderer).resolve()
    if scratch is None:
        raise ValueError('An explicit SSD scratch directory is required')
    scratch = Path(scratch).resolve()
    scratch.mkdir(parents=True, exist_ok=True)
    git = ['git', '-C', str(renderer)]
    revision = subprocess.check_output(git + ['rev-parse', 'HEAD'], text=True).strip()
    if revision != PROFILE['rendererRevision']:
        raise ValueError('Unexpected DualRip revision')
    if subprocess.check_output(git + ['status', '--porcelain', '--untracked-files=no'], text=True).strip():
        raise ValueError('Renderer source has unrecorded modifications')
    if any(name == 'dualrip' or name.startswith('dualrip.') for name in sys.modules):
        raise ValueError('Run with no DualRip modules previously imported')
    # git archive excludes all untracked files and bytecode caches.
    source_tar = subprocess.check_output(git + ['archive', '--format=tar', 'HEAD', 'dualrip'])
    with tempfile.TemporaryDirectory(prefix='home-audio-renderer-', dir=scratch) as temp:
        root = Path(temp)
        with tarfile.open(fileobj=io.BytesIO(source_tar)) as package:
            package.extractall(root, filter='data')
        original = {}
        for rel, expected in PROFILE['patchedSourceHashes'].items():
            original[rel] = sha(root / rel)
            if original[rel] != expected:
                raise ValueError(f'Unexpected pinned source: {rel}')
        subprocess.run(['git', 'apply', '--check', str(PATCH_PATH)], cwd=root, check=True)
        subprocess.run(['git', 'apply', str(PATCH_PATH)], cwd=root, check=True)
        math_rel = 'dualrip/engine/ctr/home_audio_math.py'
        shutil.copyfile(MATH_PATH, root / math_rel)
        clock_rel = 'dualrip/engine/ctr/home_audio_clock.py'
        shutil.copyfile(CLOCK_PATH, root / clock_rel)
        voice_rel = 'dualrip/engine/ctr/home_audio_voice.py'
        shutil.copyfile(VOICE_PATH, root / voice_rel)
        dsp_rel = 'dualrip/engine/ctr/home_audio_dsp.py'
        shutil.copyfile(DSP_PATH, root / dsp_rel)
        provenance = {
            'id': PROFILE['id'], 'profileSha256': sha(PROFILE_PATH),
            'patchSha256': sha(PATCH_PATH), 'adapterSha256': sha(Path(__file__)),
            'mathSha256': sha(MATH_PATH), 'clockSha256': sha(CLOCK_PATH),
            'voiceSha256': sha(VOICE_PATH), 'voiceArithmetic': PROFILE['voiceArithmetic'],
            'dspSha256': sha(DSP_PATH), 'captureDsp': PROFILE['captureDsp'],
            'sequenceClock': PROFILE['sequenceClock'],
            'renderTimeline': PROFILE['renderTimeline'],
            'archiveVolume': PROFILE['archiveVolume'], 'originalFiles': original,
            'patchedFiles': {rel: sha(root / rel) for rel in [*original, math_rel, clock_rel, voice_rel, dsp_rel]},
            'nativeOutputMode': PROFILE['nativeOutputMode'],
            'captureSemantics': PROFILE['captureSemantics'],
            'runtimeAssumptions': PROFILE['runtimeAssumptions'],
            'remainingGaps': PROFILE['remainingGaps'],
        }
        sys.path.insert(0, str(root))
        try:
            yield provenance
        finally:
            sys.path.remove(str(root))
            for name in list(sys.modules):
                if name == 'dualrip' or name.startswith('dualrip.'):
                    del sys.modules[name]
