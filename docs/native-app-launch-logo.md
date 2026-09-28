# Original app-launch logo resource

The supplied EUR Sound title (`0004001000022500`, version 3088, CTR-N-HESP)
contains an original `ExeFS/logo.bin`. Its NCCH dedicated logo region has size
zero; this older title stores the resource in ExeFS instead. The resource
contains `NintendoLogo_U_00` and `NintendoLogo_D_00`, separate from HOME's
`CmnFadeNinLogo_*` transition wrappers.

## Source and bounded extraction

- Supplied Sound CIA SHA-256:
  `25d7c0803392d4b2febd2ce1eb6879c63a000d2b39cbaefcbe4ebf8d3a649f72`
- Content 0 / `0000000b` SHA-256:
  `da6fce19bff1e663cadf03d3a103bccc9d65c18c3890b7a50cae26c62c24268d`
- ExeFS logo: 8,192 bytes, SHA-256
  `2a98c49d919e254e15dc213cab47a800ed63b248dcd43119e8fb82d9e62ae51c`
- Existing LZ11 decoder yields 25,928 bytes. The DARC header declares 25,896;
  the final 32 bytes are an opaque trailer, retained in private provenance.
  They are **not** the SHA-256 of the preceding DARC. No meaning or signature
  verification is claimed for that trailer.
- Passing exactly the header-declared DARC bytes into the unchanged existing
  bounded unpacker succeeds. Its file bounds are checked within that archive.
  DARC SHA-256:
  `ac25282e42a65afe15b557c47d9b1fab0d7c0846bb14a1a152f3e00fc02cf5d6`.

Existing `unpack_home_resources` and `firmware.build.Builder.pack` export all
16 members without unsupported resources or layout/animation sections. No
firmware execution, ARM analysis, new decoder or browser capture was used.

## Ready output

Private SSD artifact directory:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/app-launch-logo/`

`delivery/packs/sound/nintendo-launch-logo.json` is a regular NativePack;
`delivery/textures/` holds eight straight-RGBA PNGs. `delivery/provenance.json`
records source/member/output/converter hashes. `reproduce.py` calls only the
existing converters and verifies source identity, all output hashes, counts,
unsupported fields and real alpha channels. It accepts `--repository`,
`--source` (the original extracted logo) and a fresh `--output` path.

| Texture member | Size | Role visible in decoded alpha |
| --- | --- | --- |
| 3dsLogo_00 | 128 × 16 | NINTENDO lettering |
| 3dsLogo_01 | 32 × 16 | split outlined symbol used by upper/lower O panes |
| 3dsLogo_02 | 64 × 32 | 3 glyph |
| 3dsLogo_03 | 128 × 32 | DS glyphs |
| Nintendo_128x64 | 128 × 64 | lower-screen Nintendo wordmark |
| LTMask_00, LT_00, LT_01 | 16 × 16; 32 × 32; 32 × 32 | transition light/mask textures |

Seven textures use A4 and one uses LA8. Every texture has alpha ranging from
0 to 255 with both transparent and visible pixels. Alpha-on-black diagnostics
confirmed the original Nintendo/DS glyph shapes; those diagnostics are private
and are not replacement delivery textures. Retain `picaFormat` when using the
native renderer; RGB preview bytes alone do not describe native A4 sampling.

The complete mark is assembled by native panes/materials, not stored as a single
flattened image. The exported pack preserves pane hierarchy, UV cropping,
materials and animation tracks, avoiding a guessed reconstruction. Layouts are
400 × 240 upper and 320 × 240 lower. Each has SceneOutA (60 frames, non-looping),
SceneOutB (30 frames, looping), and SceneOutC (15 frames, non-looping). Their
names/durations are source data, **not** proof of runtime scheduling. Do not
apply all alternate clips together or infer elapsed milliseconds from them.

## Public pack and integration

The narrow export now lives at
`public/os/firmware/10.7.0-32E/packs/launch/logo.json`, with eight PNGs in its
`textures/` subdirectory and `provenance.json` alongside it. Texture URLs include
`packs/launch/` because the existing loader resolves against the firmware
manifest, not against the pack JSON. The provenance `resources` map uses those
same manifest-relative paths and can be merged into the shared manifest.
The intended HOME reference is `home.launch = 'packs/launch/logo.json'`.

Reproduce using `python3 -B scripts/firmware/export_launch_logo.py --source LOGO
--output LAUNCH_DIRECTORY --scratch PRIVATE_SSD_DIRECTORY` (on one command line).
Two fresh conversions produced byte-identical public output: ten files including
the pack, eight textures and provenance. Every resource URL, byte count and hash
was verified. Raw extracted members and the opaque trailer binary stay private.

For the upper layout, source glyph panes are `P_Nin_00`, `P_3_00`, `P_Ds_00`,
with the split outlined glyph as children of `P_Nin_00`. SceneOutA starts the
Nintendo/DS glyphs at alpha 0, reaching 255 at frame 40; the 3 glyph starts at
frame 20 and reaches alpha 255/scale 1 at frame 60. SceneOutB holds those glyphs
while the large `P_Red_*`/`P_Blk_*` light/mask panes retain their authored effect.
SceneOutC fades the parent `N_W_00` from alpha 255 at -1 to zero at frame 14.
The lower wordmark fades in during A frames 0–15, holds in B and fades via
`N_Root_00` during C. `P_NinLogo_00` is origin 7 (bottom centre), 128 × 64, at
(0, -120), placing its lower edge at the bottom of the 320 × 240 display.

This is a transparent artwork/effect layer, not an opaque LCD background. Keep
the existing HOME transition's dark background beneath it. The source includes
400 × 240 light/mask panes with blending; do not replace them with guessed solid
rectangles or treat the white A4 PNG preview RGB as native sampled RGB. This is
resource interpretation, not an observed runtime sequence or browser sign-off.

The coordinator owns adding the shared manifest reference and binding the layer
within the app-opening transition. This task has not changed that shared
manifest or runtime painting. Source texture and
container support are verified; actual composed browser placement, material
appearance, animation sequencing and fidelity remain integration checks.


The exporter now carries verified Sound content identity (index 0, id 0000000b)
through the pack, every member and texture source, and delivery records. Sound
has multiple CIA contents; omitting this identity previously failed the delivery
provenance audit. The rebuilt pack preserves the visual layouts, animations and
texture pixels. The combined delivery audit now passes with 1,542 records, while
its documented unsupported-feature warnings remain. The amiibo integration also
retains its newly added source-title metadata alongside existing global records.
