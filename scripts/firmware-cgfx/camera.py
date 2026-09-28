"""Bounded CGFX Aim/Perspective camera reader; never executes firmware.

Field layouts follow SPICA bd29a7828595d7839cda2ac61c76bb63f9071250.
See docs/firmware-camera-parser.md for the supported subset and offsets.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import struct

MAX_BYTES = 64 * 1024 * 1024
CGFX_REVISION = 0x05000000
CAMERA_REVISION = 0x06000000
CAMERA_TYPE = 0x4000000A
AIM_TYPE = 0x80000000
PERSPECTIVE_TYPE = 0x20000000
# Only require the resource table prefix through CameraAnimations. Later
# resource slots vary across CGFX revisions and are irrelevant to this reader.
RESOURCE_NAMES = (
    'models', 'textures', 'luts', 'materials', 'shaders', 'cameras',
    'lights', 'fogs', 'scenes', 'skeletalAnimations', 'materialAnimations',
    'visibilityAnimations', 'cameraAnimations',
)


class CameraParseError(ValueError):
    """Malformed or unsupported camera input, with no guessed fallback values."""


class _Reader:
    def __init__(self, data, start=0, end=None):
        self.data = data
        self.start = start
        self.end = len(data) if end is None else end

    def require(self, offset, size):
        if offset < self.start or size < 0 or offset + size > self.end:
            raise CameraParseError(f'Range 0x{offset:x}+0x{size:x} outside section')

    def unpack(self, fmt, offset):
        self.require(offset, struct.calcsize(fmt))
        return struct.unpack_from(fmt, self.data, offset)

    def u32(self, offset):
        return self.unpack('<I', offset)[0]

    def floats(self, offset, count):
        values = self.unpack('<' + 'f' * count, offset)
        if not all(math.isfinite(value) for value in values):
            raise CameraParseError(f'Non-finite camera value at 0x{offset:x}')
        return list(values)

    def pointer(self, offset, size=1):
        delta = self.unpack('<i', offset)[0]
        if not delta:
            raise CameraParseError(f'Null required pointer at 0x{offset:x}')
        target = offset + delta
        self.require(target, size)
        return target

    def name(self, pointer_offset):
        start = self.pointer(pointer_offset)
        end = self.data.find(b'\0', start, min(self.end, start + 4096))
        if end <= start:
            raise CameraParseError(f'Empty or unterminated name at 0x{start:x}')
        try:
            return self.data[start:end].decode('utf-8')
        except UnicodeDecodeError as error:
            raise CameraParseError(f'Invalid UTF-8 name at 0x{start:x}') from error


def _camera(reader, offset, dictionary_name):
    # GfxObject + GfxNode + GfxNodeTransform + GfxCamera, including type tag.
    reader.require(offset, 0xC8)
    if reader.u32(offset) != CAMERA_TYPE or reader.data[offset + 4:offset + 8] != b'CCAM':
        raise CameraParseError('Expected GfxCamera/CCAM object')
    if reader.u32(offset + 8) != CAMERA_REVISION:
        raise CameraParseError('Unsupported CCAM revision')
    name = reader.name(offset + 0x0C)
    if name != dictionary_name:
        raise CameraParseError('Camera and dictionary names disagree')
    if reader.u32(offset + 0x20):
        raise CameraParseError('Camera child nodes are unsupported')

    scale = reader.floats(offset + 0x30, 3)
    rotation = reader.floats(offset + 0x3C, 3)
    position = reader.floats(offset + 0x48, 3)
    if any(value == 0 for value in scale):
        raise CameraParseError('Camera scale is singular')
    if reader.u32(offset + 0xB4) != 0 or reader.u32(offset + 0xB8) != 0:
        raise CameraParseError('Only Aim views and Perspective projections are supported')
    view = reader.pointer(offset + 0xBC, 0x18)
    projection = reader.pointer(offset + 0xC0, 0x14)
    if reader.u32(view) != AIM_TYPE or reader.u32(projection) != PERSPECTIVE_TYPE:
        raise CameraParseError('Camera view/projection type tags disagree with their enums')
    if reader.u32(view + 4) != 0:
        raise CameraParseError('Aim target inheritance flags are unsupported')
    target = reader.floats(view + 8, 3)
    twist = reader.floats(view + 0x14, 1)[0]
    near, far, aspect, fov = reader.floats(projection + 4, 4)
    if target == position:
        raise CameraParseError('Aim eye and target coincide')
    if not (0 < near < far and aspect > 0 and 0 < fov < math.pi):
        raise CameraParseError('Invalid perspective clipping planes, aspect or FOV')
    return {
        'name': name, 'position': position, 'rotation': rotation, 'scale': scale,
        'viewType': 'Aim', 'aimTarget': target, 'aimTwist': twist,
        'projectionType': 'Perspective', 'perspectiveFovRadians': fov,
        'aspect': aspect, 'near': near, 'far': far,
        'wScale': reader.floats(offset + 0xC4, 1)[0],
        'sourceOffsets': {'camera': offset, 'scale': offset + 0x30,
                          'rotation': offset + 0x3C, 'position': offset + 0x48,
                          'view': view, 'projection': projection},
    }


def parse_cameras(data: bytes, source_name: str = '') -> dict:
    """Decode static cameras from CGFX bytes without filesystem writes or defaults.

    sourceSha256 hashes these decompressed bytes. Unrelated resource graphs,
    camera metadata and animation binding descriptions are not deserialized.
    """
    if not 20 <= len(data) <= MAX_BYTES:
        raise CameraParseError('Invalid or excessive CGFX size')
    header = _Reader(data)
    magic, bom, length, revision, size, sections = header.unpack('<4sHHIII', 0)
    if magic != b'CGFX' or bom != 0xFEFF or length != 20:
        raise CameraParseError('Expected little-endian CGFX with a 20-byte header')
    if revision != CGFX_REVISION:
        raise CameraParseError('Unsupported CGFX revision')
    if size != len(data) or not 1 <= sections <= 16:
        raise CameraParseError('CGFX length or section count is invalid')
    cursor = length
    contents = None
    for index in range(sections):
        tag, section_size = header.unpack('<4sI', cursor)
        if section_size < 8:
            raise CameraParseError('Invalid section size')
        header.require(cursor, section_size)
        if tag == b'DATA' and index == 0:
            contents = _Reader(data, cursor + 8, cursor + section_size)
        elif tag != b'IMAG':
            raise CameraParseError('Expected one leading DATA section, then optional IMAG sections')
        cursor += section_size
    if cursor != len(data) or contents is None:
        raise CameraParseError('CGFX sections do not cover the file or DATA is absent')

    contents.require(contents.start, len(RESOURCE_NAMES) * 8)
    if contents.u32(contents.start + RESOURCE_NAMES.index('cameraAnimations') * 8):
        raise CameraParseError('Animated cameras are unsupported')
    camera_entry = contents.start + RESOURCE_NAMES.index('cameras') * 8
    count = contents.u32(camera_entry)
    if not 1 <= count <= 1024:
        raise CameraParseError('Expected between 1 and 1024 cameras')
    dictionary = contents.pointer(camera_entry + 4, 12)
    tag, tree_size, tree_count = contents.unpack('<4sII', dictionary)
    if tag != b'DICT' or tree_count != count or tree_size != 12 + 16 * (count + 1):
        raise CameraParseError('Invalid camera dictionary header/count/size')
    contents.require(dictionary, tree_size)
    cameras = []
    names, offsets = set(), set()
    for index in range(count + 1):
        node = dictionary + 12 + 16 * index
        left, right = contents.unpack('<HH', node + 4)
        if left > count or right > count:
            raise CameraParseError('Camera dictionary node index is out of range')
        if index == 0:  # Patricia root is a sentinel, not a camera.
            continue
        name = contents.name(node + 8)
        offset = contents.pointer(node + 12, 0xC8)
        if name in names or offset in offsets:
            raise CameraParseError('Duplicate camera dictionary entry')
        cameras.append(_camera(contents, offset, name))
        names.add(name)
        offsets.add(offset)
    return {'schema': 1, 'sourceName': source_name,
            'sourceSha256': hashlib.sha256(data).hexdigest(),
            'converter': 'bounded-cgfx-camera-v1', 'cameras': cameras}


def load_camera_resource(source: Path) -> dict:
    """Read CGFX or Nintendo LZ10/LZ11 input, retaining both source hashes."""
    with source.open('rb') as stream:
        original = stream.read(MAX_BYTES + 1)
    if not original or len(original) > MAX_BYTES:
        raise CameraParseError('Empty or excessive camera resource')
    data = original
    if original[0] in (0x10, 0x11):
        helper = Path(__file__).resolve().parents[1] / 'unpack_home_resources.py'
        spec = importlib.util.spec_from_file_location('_camera_lz', helper)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        data = module.decompress(original, limit=MAX_BYTES)
    result = parse_cameras(data, source.name)
    result['compressedSourceSha256'] = hashlib.sha256(original).hexdigest()
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, help='Write JSON here; default is stdout')
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--model-key')
    parser.add_argument('--title-id')
    parser.add_argument('--source-path')
    args = parser.parse_args()
    if any((args.manifest, args.model_key, args.title_id, args.source_path)) and not all((args.output, args.manifest, args.model_key, args.title_id, args.source_path)):
        parser.error('Manifest registration requires output and all four registration arguments')
    if args.output and args.output.resolve() == args.source.resolve():
        parser.error('Output must not replace the source resource')
    try:
        result = load_camera_resource(args.source)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    text = json.dumps(result, indent=2, allow_nan=False) + '\n'
    if args.output:
        args.output.write_text(text, encoding='utf-8')
        if args.manifest:
            from manifest import register_resources
            register_resources(args.manifest, args.output.parent, args.model_key, args.title_id,
                               args.source_path, result['compressedSourceSha256'], [args.output.name])
    else:
        print(text, end='')


if __name__ == '__main__':
    main()
