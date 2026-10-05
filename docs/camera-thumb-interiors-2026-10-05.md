# Camera browse thumbnail interiors — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-thumb-interiors-20261005` from
fidelity `04f3d6bf`. One leftover: the photo texels inside the two large
lower-LCD browse thumbs after the `PicL_SD` white-frame bind. No Azahar.
No production browser. No preview 3021. No CDP. No recapture. Capture stays
inert. The painter is unchanged. This is not a 1:1 claim. This note does
not close pixels, input, motion, or audio.

The white `PicL_SD` frame, date pane **1006**, slider **1992**, Settings
third **630**, upper photo crop **33522**, gallery selection cursor,
Slideshow header, Welcome, and Sound were not retuned.

## Assigned still

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Browser lower after the `PicL_SD` recapture at `89efb7a3`:

| Item | SHA-256 |
| --- | --- |
| Browser lower | `62d8c212f8f68f4960ca4a98d0ad23f2c914d02f47e663ce40eb0a85b5826647` |
| Report | `53fa2e6f007207a299db3e908d741efdeb89d4a1f83e8b91c89273bd959f7191` |

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **8958**. Upper **33522** is
byte-identical `184bdfdf148d41cecc10d245f14708a38d4afc7c1776c4d9a6bf7eef067694d6`.

Official empty-mask components:

| Component | Rectangle | Count |
| --- | --- | ---: |
| Middle thumb | `[125,46,70,56]` | **1148** |
| Right thumb | `[201,46,70,56]` | **1148** |
| Middle photo interior | `[133,59,54,31]` | **846** |
| Right photo interior | `[209,58,54,32]` | **918** |

The 1148 components are the thumb boxes. Their interiors are separate
components. The red gallery cursor still sits on the browser's middle cell
and the native right cell; that placement stays the labelled gap in
[camera-selection-2026-10-05.md](camera-selection-2026-10-05.md). This note
is only the photo texels inside `ThmbMask`.

## Dump owner

The thumbnail slot is already the rectangle the painter fills. There is no
second crop, UV, or texture that uniquely owns the remaining texels.

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`, image
base `0x100000`. Private executable
`contents/0000-0000001a/exefs/code.bin`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

`P_BrwsPic/ThmbPic` is **56×42** at translation `(0,0)`, origin centre,
identity UV `(0,0)–(1,1)`. Its material `magFilter` is **1**, which the
layout raster treats as linear (`magFilter !== 0`). Child `ThmbMask` is
**66×52** at `(1,−1)`. `P_BrwsPic_PicL_SD` frame 0 only steps `ThmbMask`
pattern to **1** (`P_Thmb_Pho2x3.bclim`). It has no `ThmbPic` track.
`P_BrwsPic_Default` frame 0 leaves `ThmbPic` translation at **0**.

BrowseThumbnail constructor `0x2d5cac` is the only caller of `0x2b881c`.
At `0x2d60bc`–`0x2d60c8` it passes height **42** (`mov r3, #0x2a`, word
`0xe3a0302a`), width **56** (`mov r2, #0x38`, word `0xe3a02038`), and
`bl 0x2b881c` (word `0xebff89d3`). `0x2b8848` (`strd r2, r3, [ip]`, word
`0xe1cc20f0`) stores that pair at the start of the new object. The other
immediates in the call (`128`, byte `14`, bytes `1, 1`) are stored beside
the size. They are not a second width and height. No other call creates
this object.

That 56×42 is `cameraThumbPicSize`. Gallery photos already draw into
`cameraThumbPicRect` before the mask, and a loaded photo sets `ThmbPic`
alpha 0 so the placeholder stays hidden. A 640×480 still fills that
rectangle exactly, because both are 4:3.

The photograph is not a pack texture. `ThmbPic`'s authored texture is the
load placeholder `P_Thmb_Load2x3.bclim`. The large image records built by
`0x2eebe4` are a different buffer: both loop passes store **1024×768**
(`mov` `0x400` / `0x300` at `0x2eecb0` / `0x2eecb8`) into a **1024** texture
derived from literals `0x3ff` and `0x2ff`. That is not 56×42 and not the
EXIF thumbnail.

`HNI_0001.JPG` SHA-256
`e2dda4bd244008fa3d096e09a6f3bfda2441c4c6bb7bfd03da6bcc4c2f0e9938`
contains an EXIF JPEG at file offset 694, 2920 bytes, decoded **160×120**,
SHA-256 `5b9a23323226857ea2ced712e1127ad4e4fbc7566d77e8fdc56d417e3ca4a297`.
The constructor above does not store 160 or 120. `HNI_0001`, `HNI_0002`,
and `HNI_0003` still share one decoded RGB image, as in the
[photo-crop note](camera-photo-crop-2026-10-05.md).

## What was scored

Native lower is the combined PNG crop `(40,240,320,240)`. The middle
`ThmbPic` is canvas `[132,53,56,42]` on cell centre `(160,74)`. The right
cell is `[208,53,56,42]`. Counts below are every texel in the middle
rectangle `[133,59,54,31]`, not the connected component of **846**. An
sRGB sample of the frozen pair, same threshold:

| Candidate, sampled through the existing 56×42 slot | Middle hole over 2 | Mean abs channel |
| --- | ---: | ---: |
| Browser lower, as captured | 1020 of 1674 | ~10 |
| Full 640×480 JPEG, bilinear contain | 1102 | 12.2 |
| Full JPEG, nearest | 1032 | 12.3 |
| Full JPEG, box | 1183 | 11.7 |
| Finder stereo window `[8.78,80,533.33×320]`, contain | 1258 | 27.6 |
| EXIF 160×120, bilinear | 1002 | 5.8 |
| EXIF 160×120, nearest | 794 | 4.5 |

The stereo window is the upper finder fit from `0x210230`. It is worse in
this hole, so the interiors are not that crop. The EXIF thumbnail is closer
and is not the size `0x2b881c` stores; nearest sampling also contradicts
`ThmbPic`'s linear filter, and 794 texels stay over 2. Shifts of a pixel
or two, and uniform zooms of the full-frame window, do not beat the
current slot.

Flat texels already agree. `(160,74)` is native `(189,182,156)` and browser
`(188,183,154)`. `(180,70)` is the same pair. Signed error across the middle
hole is about `+0.45, +0.30, +0.52`. The large misses sit on the phone
outline, the same class of residual the upper crop left after the bound
window: the title's decode and scale into this buffer, which these words
do not describe.

## Decision

No runtime change. The bound slot stays 56×42 under the white `PicL_SD`
mask. Replacing it with the EXIF thumbnail, the finder window, or a
reconstructed kernel would retune a size the constructor and the layout
already share. The remaining **846** and **918** are a source gap: the
unreplayed fill of that 56×42 thumbnail object. The cell-publication audit
already left photo-texture upload outside the replayed writer.

## Provenance

| Element | Manifest / site | Dump path | SHA-256 |
| --- | --- | --- | --- |
| `code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Browse archive | `packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ` | `ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a` |
| `P_BrwsPic` | `resourceSources.layouts.P_BrwsPic` | `lyt/P_Brws_D.arc.LZ/blyt/P_BrwsPic.bclyt` | `1b6ffac3073b947620b4c837c56a831561cac6d061b6af7834db695b3d29cc88` |
| `P_Thmb_Pho2x3.bclim` | `resourceSources.textures.P_Thmb_Pho2x3.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_Thmb_Pho2x3.bclim` | `b5abba45ee76eefc1f75dd1d93b04f38fdbff3065a7c48791650ec137dfaf5ab` |
| `HNI_0001.JPG` | private SDMC, not a manifest key | `DCIM/100NIN03/HNI_0001.JPG` | `e2dda4bd244008fa3d096e09a6f3bfda2441c4c6bb7bfd03da6bcc4c2f0e9938` |

Converter **ctr-native-web 1.2.0** for the frame texture. The JPEG is the
private fixture, not a converted pack image. No screenshot fit and no new
border.

## Checks

No source file changed, so no focused runtime test was added. `npm test`
and `npm run build` were not run. No Azahar or browser session was driven.
Coordinator recapture is not asked for: the pixels under comparison did
not change. Whole `camera-readonly-view-photos-page1` stays fail. Not 1:1.

## Independent review

Grok 4.6 `camera-thumb-interiors-review-20261005-r1`: **APPROVE** of
`84d636e3` (cherry-pick of `dbd493f7`). Painter unchanged. BrowseThumbnail
`0x2d5cac` is the only `BL` to `0x2b881c` and stores **56×42**. `0x2eebe4`
stores **1024×768**. EXIF thumbnail is **160×120** and is not that slot.
Official interiors stay **846/918**. TxtSet recapture left those counts
untouched. Not 1:1.
