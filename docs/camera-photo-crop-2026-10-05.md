# Camera upper HNI photo crop — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-photo-crop-20261005` from
fidelity `1da03426`. One leftover: the upper-LCD HNI photograph. No Azahar.
No production browser. No preview 3021. No CDP. No recapture. Capture stays
inert. Runtime is unchanged. This is not a 1:1 claim. This note does not
close pixels, input, motion or audio.

Browse-slider chrome, the date-cell `PicL_Op` / `ThmbBase` / `TxtThmb`
bind, the 2D/3D badge, and lower selection were not retuned.

## Assigned still

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser upper after the PicL_Op recapture at `1da03426`,
byte-identical with the badge SDMC upper:

| Item | SHA-256 |
| --- | --- |
| Browser upper | `184bdfdf148d41cecc10d245f14708a38d4afc7c1776c4d9a6bf7eef067694d6` |
| Report | `c691ba22ebffc395f9406e9d10587bb2cd45aee4c261168d727e10f79b1f63cc` |

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Native upper is the top 400×240 of the
combined PNG. Independent recount of that pair:

| Region | Count | What it is |
| --- | --- | --- |
| Whole upper | **33522** (max **46**) | Matches the report |
| Connected component | **16943**, box `[2,0,175,240]` | Report's first region: the phone |
| Next component | **9409**, box `[163,156,237,84]` | The beige box under the phone |
| Photo box `[0,370)×[20,220)` | **26311** | Assigned photo-ish interior |

`(44,30)` is native `(76,82,65)` versus browser `(122,120,110)`.
`(200,120)` is native `(189,182,156)` versus browser `(188,183,154)`.
Cube centre `(383,17)` is `(100,100,100)` on both. Mean signed
native−browser error on the whole upper is about `+0.19, −0.03, +0.17`.
Lower **10482** (slider, date text, selection) is out of scope.

## Dump owner

The 33522 is not a second source rectangle, a different HNI file, or the
other MPO eye. It is the residual of the window already bound from
`code.bin`, after Canvas bilinear, against the native framebuffer.

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`, image
base `0x100000`. Private executable
`contents/0000-0000001a/exefs/code.bin`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The photograph is not a pack texture. Converter **ctr-native-web 1.2.0**
produced the finder chrome around it; it did not convert this JPEG.
`P_FinderVS_U` is only the 400×240 frame
([photo-fit audit](camera-photo-fit-source-audit.md),
[stereo fixture fit](camera-upper-stereo-fixture-fit.md)).

| Element | Manifest / site | Dump path | SHA-256 |
| --- | --- | --- | --- |
| `code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Finder archive | `packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json` | `lyt/P_Finder_U.arc.LZ` | `5c75b6dc90e688adbf6b986833d6dc126b4c66b5eef2f7d6919c8e19a206cbb5` |
| `P_FinderVS_U` | `resourceSources.layouts.P_FinderVS_U` | `lyt/P_Finder_U.arc.LZ/blyt/P_FinderVS_U.bclyt` | `4e8555e4e65b45de6965ed6c8e44f95d793d2ecc4ee09d759759cf7a8e9ac16f` |
| `HNI_0001.JPG` | private SDMC, not a manifest key | `DCIM/100NIN03/HNI_0001.JPG` | `e2dda4bd244008fa3d096e09a6f3bfda2441c4c6bb7bfd03da6bcc4c2f0e9938` |
| `HNI_0001.MPO` | private SDMC, not a manifest key | `DCIM/100NIN03/HNI_0001.MPO` | `aa1bf8fc76ce959756713348eef34f2c3cc3c1f6ae3998085403af7927cca747` |

Browse bind `0x284b54` calls fit `0x210230` with mode 2 and the margin
literal at `0x284f1c` (**40.0**). For 640×480 that scale is **0.75**.
`0x210200` reads the Nintendo note float at image `+0x13c` and multiplies
by decoded/original width. `HNI_0001.MPO` still has `3DS1` at the note
and **−44.553070068359375** at `3DS1+0x28` (file offset 516). The source
window is `[8.78026, 80, 542.11359, 400]`. `drawStockMediaImage` already
clips that window to 400×240. Portfolio JPEGs still omit
`verificationStereo` and stay on the mono contain branch.

## What was scored

Decoded RGB of `HNI_0001.JPG`, `HNI_0002.JPG` and `HNI_0003.JPG` is
identical. The file hashes differ; the pixels do not. MPO frame 0 matches
that JPEG. MPO frame 1 does not (mean absolute error about 25.4 against
frame 0). Framing frame 1 with the same window scores **55446** in the
photo box. The native still is frame 0.

A bilinear sample of that window against the browser upper leaves **219**
photo-box pixels over 2/255, and those sit on the x=369 chrome edge
(max 159), not in the photograph. `(200,120)` matches the JPEG texel
`(188,183,154)`. The browser is already drawing the bound window. The
**26311** / **33522** is that window versus the native framebuffer.

`(44,30)` lands at source `(67.61, 120.17)`, between JPEG texels
`(25,25,15)` and `(183,181,169)`. Bilinear of those texels is the browser
sample `(122,120,110)`. Native `(76,82,65)` sits closer to the dark texel
on this one bezel edge. The same edge continues through the neighbouring
columns. It is the phone outline on the contact sheet, not a different
photograph.

No nearby window is better. Photo-box counts for a bilinear resample of
frame 0, same scale, extra screen shift:

| Shift | Photo-box pixels over 2/255 |
| --- | --- |
| `(0, 0)` | **27146** |
| `(+0.5, 0)` | 28872 |
| `(−0.5, 0)` | 31225 |
| `(0, +0.5)` | 32373 |
| scale 0.99 or 1.01 | 35167 / 35814 |
| parallax 0 | 55018 |
| opposite parallax | 57439 |

Nearest, bicubic, a Gaussian blur and an unsharp mask all score worse
than bilinear at this window. Quantizing both LCDs to RGB565 leaves
**30976**. There is no unused kernel constant that closes the count.

`0x210af0` is not that crop. After the fit scale it forms
`decodedWidth × 0.134375` (86 at width 640), divides the scaled parallax
through that term (ratio **0.481941** for this note), calls `0x315070`,
then applies `0.3 + 1.428571×` and clamps to **±1** (`0x210bb8`,
`0x210bb4`, `0x210bbc` / `0x210bc0`, and the store clamp in `0x210a14`).
The result is written to the image object `+0x24c` and `+0x238`. A ±1
normalized value is not a source-rectangle inset. The capture is 3D-off
([badge note](camera-3d-badge-2026-10-04.md)); the 2D window above is
already the shift that minimizes the still. Binding `0x210af0` as extra
zoom or an extra pixel shift would be a guess, and the shift search says
it would raise the count.

## Decision

No runtime change. The bound stereo window stays. The remaining **33522**
is a source gap: the title's JPEG decode and PICA sample of this same
window, which `0x210230` does not describe. The photo-fit audit already
left that final writer unreplayed. Shipping a reconstructed photograph,
a cover crop, or a capture-fitted phase would retune a window the dump
and this still both already select.

Slider strip `[0,170,320,210]`, date text, the badge and lower selection
stay where the date-group recapture left them.

## Checks

No source file changed, so no focused runtime test was added. The frozen
hashes and the `(44,30)` sample are the table above. `npm test` and
`npm run build` were not run. No Azahar or browser session was driven.
Coordinator recapture is not asked for: the pixels under comparison did
not change. Whole `camera-readonly-view-photos-page1` stays fail.
