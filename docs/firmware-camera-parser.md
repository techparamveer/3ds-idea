# CGFX camera extraction

`scripts/firmware-cgfx/camera.py` extracts a static Aim/Perspective camera from
the supplied resource. It preserves source coordinates and radians. It does not
fit a camera to a screenshot, instantiate Three.js objects or alter native data.

The pinned SPICA exporter fails on the supplied `BannerCamera_LZ.bin` during
`Gfx.Open`, attempting to convert `GfxDictionary<GfxAnimGroup>` to `GfxEmitter`.
This bounded reader follows the camera dictionary and its view/projection
pointers directly. It does not recursively deserialize the animation binding
graph that triggers that failure. The existing model/texture exporter remains a
separate integration concern.

## Integration

From a Python script in the same directory:

```python
from camera import parse_cameras, load_camera_resource

# Pure parser for already decompressed CGFX bytes:
record = parse_cameras(decoded, source_name=source.name)

# File wrapper also accepts LZ10/LZ11 via unpack_home_resources.py:
record = load_camera_resource(source)
```

The result has `schema: 1`, `sourceName`, `sourceSha256` (decompressed CGFX),
`converter: "bounded-cgfx-camera-v1"` and `cameras`. The file wrapper also adds
`compressedSourceSha256`, hashing the exact input file, including an LZ header
when present. No absolute source path is exported. Callers registering a camera
in the firmware manifest should use that input hash for resource provenance.

Each camera contains:

- `name`, `position`, `rotation` (radians), `scale`;
- `viewType: "Aim"`, `aimTarget`, `aimTwist` (radians);
- `projectionType: "Perspective"`, `perspectiveFovRadians`, `aspect`, `near`, `far`;
- `wScale` and numeric `sourceOffsets` for the camera, transform, view and projection.

The view uses the source position and Aim target; zero twist gives an up vector
of positive Y for the verified camera looking along negative Z. Three.js takes
vertical field of view in degrees, so convert `perspectiveFovRadians` at that
boundary. Preserve scene units. Separate stereo calculations and parent banner
animation are outside this parser.

CLI usage writes a single JSON file to an explicitly chosen location. Omit
`--output` to print JSON. The output directory must already exist.

```sh
python3 scripts/firmware-cgfx/camera.py /path/to/BannerCamera_LZ.bin \
  --output /path/to/scratch/banner-camera.json
```

## Format foundation and scope

Field layouts follow SPICA commit
[`bd29a7828595d7839cda2ac61c76bb63f9071250`](https://github.com/gdkchan/SPICA/tree/bd29a7828595d7839cda2ac61c76bb63f9071250/SPICA/Formats/CtrGfx),
specifically `GfxHeader`, `Gfx`, `GfxDictionary`, `GfxDictionaryNode`, `GfxObject`,
`GfxNode`, `GfxNodeTransform` and the `Camera/` definitions. This reader supports
little-endian CGFX revision `0x05000000` and CCAM revision `0x06000000`. Unknown
revisions, camera forms or invalid pointers fail with `CameraParseError`; the
parser supplies no guessed camera.

| Structure | Relative byte offset | Meaning |
| --- | --- | --- |
| CGFX header | `0x00..0x13` | Magic, byte order, header length, revision, file length, section count |
| DATA payload | slot 5 of the resource count/pointer pairs | Cameras; each pair is eight bytes |
| DATA payload | slot 12 | Camera animation clips; nonempty clips are unsupported |
| DICT | `0x00`, `0x04`, `0x08` | Magic, byte length, value count |
| DICT | `0x0c + 0x10 * index` | Nodes; index zero is the Patricia root sentinel |
| DICT node | `0x04`, `0x06`, `0x08`, `0x0c` | Left/right node indices, relative name pointer, relative value pointer |
| GfxCamera | `0x00`, `0x04`, `0x08`, `0x0c` | Type `0x4000000a`, CCAM, revision, name pointer |
| GfxCamera | `0x20` | Child count; child cameras are unsupported |
| GfxCamera | `0x30`, `0x3c`, `0x48` | Scale, rotation, translation; three floats each |
| GfxCamera | `0xb4`, `0xb8` | View/projection enums; both zero for Aim/Perspective |
| GfxCamera | `0xbc`, `0xc0`, `0xc4` | Relative view pointer, projection pointer, W scale |
| Aim | `0x00`, `0x04`, `0x08`, `0x14` | Type `0x80000000`, flags, target, twist |
| Perspective | `0x00`, `0x04`, `0x08`, `0x0c`, `0x10` | Type `0x20000000`, near, far, aspect, vertical FOV |

Pointers are signed, relative to their own field, and must stay within DATA.
The dictionary and camera locations are discovered from pointers, not fixed at
the positions found in this firmware. The parser checks section coverage,
dictionary counts/indices, duplicate cameras, UTF-8 names, finite floats,
nonsingular scale and valid clipping/FOV ranges. It supports up to 1,024 cameras
and bounds input/decompression at 64 MiB. Aim inheritance flags, camera children,
LookAt/Rotate views, orthogonal/frustum projections and animation clips are
explicitly unsupported. It does not validate unrelated resource dictionaries,
metadata, local/world cached matrices or animation binding descriptions.

## Verified HOME camera

The explicitly supplied HOME 10.7.0-32E camera resource decodes to one camera
named `BannerCamera`: position `(0, 1, 44.7859992980957)`, rotation `(0, 0, 0)`,
scale `(1, 1, 1)`, Aim target `(0, 1, 0)`, twist zero. Perspective FOV is
`0.5235987901687622` radians (approximately 30°), aspect
`1.6666666269302368`, near `26.5`, far `1000`. W scale is zero.

Compressed input SHA-256:
`54df078dfb80a7fe55b391d10993353fe3b9ae2135a87f204b1ad8f641cc4ad9`.
Decompressed CGFX SHA-256:
`19d1009bc472a34626a10ec903d689fbd4b3b6951addc28beaa4f155db9bf897`.

In that decoded resource the camera dictionary is at `0x94`, camera at `0xc0`,
Aim at `0x3a4`, and Perspective at `0x3bc`. Private native-code tracing also
connects this resource to scene index 1, camera slot 0, the same scene used by
the folder banner. That disassembly remains outside the repository.

For a 400 × 240 mono viewport, the vertical focal length is
`120 / tan(FOV / 2) = 447.8461` pixels. This gives approximately 10 pixels per
unit at Z=0. A 20-unit text plane at Z=4.95 projects to
`20 * 447.8461 / (44.786 - 4.95) = 224.8449` pixels. This numerical consequence
supports the observed native text width; it is not a browser fidelity sign-off.

## Verification

Synthetic tests contain no native resource bytes:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/firmware-cgfx -p 'test_camera.py' -v
```

For an explicit private-resource verification, set `FIRMWARE_CAMERA_SOURCE` to
the supplied HOME 10.7.0-32E `BannerCamera_LZ.bin`. Optionally set
`FIRMWARE_CAMERA_TEST_SCRATCH` to an existing scratch directory so temporary CLI
fixtures stay there. The additional test checks both source hashes, decoded
parameters and the text-plane projection. Without that source variable the
private test is skipped. Renderer integration and matched native/browser views
remain the responsibility of the caller.

The CLI can also register its output in an existing delivery manifest. Add
`--manifest /delivery/manifest.json --model-key homeCamera --title-id 0004003000009802 --source-path 3D/BannerCamera_LZ.bin`, with `--output /delivery/models/home-camera/camera.json`.
The shared `manifest.py` helper records file hash/size and compressed source
provenance, while the firmware builder preserves separately converted models.
