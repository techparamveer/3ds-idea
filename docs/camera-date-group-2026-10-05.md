# Camera gallery date-group cell — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-date-group-20261005` from
fidelity `898d0752`. One leftover: the lower-LCD date cell. No Azahar. No
production browser. No preview 3021. No CDP 9320. No recapture. Capture stays
inert. This is not a 1:1 claim. Tests and this note do not close pixels,
input, motion or audio. Coordinator recapture remains the acceptance gate.

## Assigned defect

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser of bind `d9ddf309` at runtime `898d0752`, HNI SDMC:

| Item | SHA-256 |
| --- | --- |
| Browser upper | `184bdfdf148d41cecc10d245f14708a38d4afc7c1776c4d9a6bf7eef067694d6` |
| Browser lower | `0d0ffe41fed0cebe34d78ae196cf1694ffeeb3fde59379a027b8969b35845dea` |
| Report | `a6925bfc30c9137ae7fe5ed5a1d53f2b51fc58c232a9ae8e9eca9bc7d40e05b1` |

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole still stays upper **33522** / lower
**12872**. Cube centre `(383,17)` stays `(100,100,100)` on both, badge box
**7**. Unread-dot and Welcome p3/p4 interiors were not retuned.

`cameraDateGroupOrange` already writes `ThmbBase` constant 5 from source
`(120,193,31,255)` to `cameraBrowseUserColor` `(255,161,0,255)`. Native
samples at `(70,85)` and at the pane centre `(85,75)` are already that
orange. The constant was not the leftover.

## Recounted rect

Native lower is the 400×480 crop `(40,240,320,240)`. The official report's
first lower component is `[52,49,66,52]`, **3396** pixels. That is
`P_BrwsFld/ThmbBase`: size 66×52, translation `[1,-1]`, origin 4, drawn at
the large date-cell centre `(84,74)`. Canvas Y flips the layout Y, so the
pane centre is `(85,75)` and the top-left is `(52,49)`. An independent
recount of that rectangle on the frozen pair is also **3396** (max delta
255). The guessed box `[36,52,108,124]` is not the pane.

| Sample | Native | Browser |
| --- | --- | --- |
| Fill centre `(85,75)` | `(255,161,0)` | `(178,112,0)` |
| Assigned sample `(70,85)` | `(255,161,0)` | `(230,209,173)` |

`(178,112,0)` is UserBG orange multiplied by luminance 178.
`(230,209,173)` is white date-text coverage over that darkened orange
(`173/255` of white on `(178,112,0)` lands on those three channels). The
beige sample is the text sitting on the grey-tinted fill, not a second
colour constant.

## Dump owner

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`. Image
base `0x100000`. Converter **ctr-native-web 1.2.0**, extractor CTRTool
1.3.0 (`e4bae2eb1b254af5f4849d5807c92b3caff768fab5d5ead5f50ca0fe4ac7ff81`).
`code.bin` SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

`ThmbBase` TEV stage 0 multiplies constant register 6 by texture 0.
`constantSelectors` 102 selects `constantColors[5]` for both RGB and alpha.
Stage 1 adds the zero buffer. With a white texel the result is opaque
UserBG orange. With luminance 178 it is `(178,112,0)`.

| Clip, frame 0 | Texture | Centre texel |
| --- | --- | --- |
| `P_BrwsFld_PicL` | `P_Thmb_DatePho2x3.bclim` | `(178,178,178,255)` |
| `P_BrwsFld_PicL_Op` | `P_Thmb_Date2x3.bclim` | `(255,255,255,255)` |

The painter was binding only `P_BrwsFld_PicL` for the date row, so the
browser multiplied the correct orange by the grey photo-folder texture.
Native shows the white date texture.

Name table `0x44036c`: index 2 `PicL`, index 5 `PicL_Op` (string
`0x421c7a`, the only pointer is `0x440380`). Byte table `0x347f9d` is
eight kinds by three sizes, large column first:

| Kind | Large clip |
| --- | --- |
| 0, 1 | `PicL_Op` |
| 2, 3, 4 | `PicL` |
| 5 | `PicL_SD` |
| 6 | `MovL` |
| 7 | `MovL_SD` |

`0x2ceab8` and `0x2ceb80` read `table[kind*3 + size]` and bind that name.
The settled browse is the large 66×52 grid, so the date-cell fill owner is
`P_BrwsFld_PicL_Op` frame 0. Kinds 0 and 1 share that one large clip.
`PicM_Op` and `PicS_Op` are the other sizes and stay unbound. Folder rows
still bind `P_BrwsFld_Default` plus `P_BrwsFld_PicL`.

## Provenance

| Element | Manifest key | Dump path | SHA-256 |
| --- | --- | --- | --- |
| Browse archive | `packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ` | `ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a` |
| `P_BrwsFld` | `resourceSources.layouts.P_BrwsFld` | `lyt/P_Brws_D.arc.LZ/blyt/P_BrwsFld.bclyt` | `b12a383b73d75d331f2c1278c17ddeab82ba2cdf6503348ff0c9959e296877b0` |
| `P_BrwsFld_PicL_Op` | `resourceSources.animations.P_BrwsFld_PicL_Op` | `lyt/P_Brws_D.arc.LZ/anim/P_BrwsFld_PicL_Op.bclan` | `0a17bcf87481b99cb3e45ba36cf80403de1ecfe4a38d050421b74d35f3b64e24` |
| `P_Thmb_Date2x3.bclim` | `resourceSources.textures.P_Thmb_Date2x3.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_Thmb_Date2x3.bclim` | `e24df821dba8f6539838557a76315fa0a17a5b78474802b52fa2f037be4dfa61` |
| Published LA8 PNG | `textures/59599fc9fcbfe5d45994181d5eb770a5b2216578fdefeb26387dcee7d4d012af.png` | converted BCLIM | `59599fc9fcbfe5d45994181d5eb770a5b2216578fdefeb26387dcee7d4d012af` |

Title `0004001000022400` v4097, content index 0, content ID `0000001a`.
The published texture is LA8 (`picaFormat` 5). No screenshot yellow, no
`azahar-12p4-fit`, no CSS, font or mip change. `cameraBrowseUserColor` is
unchanged.

## Change

`cameraScreenPacks` now requests `P_BrwsFld_PicL_Op`. The date row binds
only `{name:'P_BrwsFld_PicL_Op', frame:0}`. `cameraDateGroupOrange` still
writes constant 5. `TxtThmb` stays `DD/MM\nYYYY` at `[49.92,40]`.

## Tests

`tests/camera-date-group.test.mjs` locks the frozen hashes, the `(70,85)`
and `(85,75)` samples, and the 3396-pixel pane. Before the bind, the
`PicL_Op` request assertion failed. After the bind both tests pass.
`tests/stock-native-camera.test.mjs` still passes; folder rows remain
`Default` + `PicL`.

## Still open

The frozen pair was not recaptured, so the scored leftover is unchanged:
upper **33522**, lower **12872**, date pane **3396**. Selection still
disagrees (native right-hand thumb, browser `HNI_0001`). Rate, zoom,
photo crop, Parakeet, the 3D badge and Welcome `TxtDlg` are outside this
slice. Whole-scenario acceptance stays fail until the coordinator
recaptures.
