# HOME Create Folder footer source audit — 2 October 2026

Base `9820379ce85b861ae824533219d8093080446551`, branch
`codex/home-create-folder-footer-20261002`. This is the one bounded source-only
slice allowed for the stable Create Folder footer residual. It makes no runtime
or asset change: the decoded layout, message style and direct glyph sampler are
already selected correctly, while the remaining differences do not have a
source-backed correction.

## Fixed comparison

The coordinator's fixed comparison uses empty masks, threshold 2 and no
translation, scale, geometry, colour or phase fitting. The lower-LCD footer ROI
is `(0,210,320,30)`.

| Pair | Native own-PNG SHA-256 | Browser lower SHA-256 | Pixels above 2 / max / RGB MAE |
| --- | --- | --- | --- |
| post-delete Folder 1 | `89c9934f782a5fd31b9b86cfc64d62a54ac4ae70cc740fffe3184d4a54762001` | `9a66b858c08e53f32ef551c7a0ac078aabf29cbc295da2400a1cbcf1561c3034` | 799 / 66 / 0.898090 |
| post-delete Folder 2 repeat | `263381a6c39a41358391179335d2d12cf49fd3df51b7227e9e5cc8b3ad26d441` | same browser state | 799 / 66 / 0.898090 |
| earlier vacant-root control | `742d5c991197182408612bce2722859cb33986ed507a1763bb5ac8636badb6de` | `d7bd494c46ebe748c8cfc5e9e724f3d6d8dfe9064ed0138f01200cac57b6af7b` | 799 / 66 / 0.898090 |

All three native footer crops have raw RGB SHA-256
`adc1034f1474d397cc096eb54851216e33776512a25b1e12794afef436389a3a`.
Both browser states have raw RGB SHA-256
`fc69e4fbb45917cc8e1b5a69cc1710899a3960af4247039e3c3a52bb555c8a87`.
The absolute difference bytes and threshold masks are also identical across all
three pairs. This rules out the observed native cursor phase and post-delete
population differences as causes of this footer residual.

The report is
`home-create-folder-footer-20261002/comparison/baseline/report.json` under the
private internal artifact root, SHA-256
`4643574f9325a78d7484aada1b2b42ce3a8ec6cf81bbcea85e909528a0be7e11`.
That initial three-pair report was expanded in place to include the fresh
seven-state workflow; the current report SHA-256 is
`a0dad32aa9eae50dd32d8991c697ee6b67a121255f0944e4872bc7311ef540f5`.
The initial report hash above is historical, not the current file identity.
Its unchanged inspected 4x footer sheet has SHA-256
`0524f2a5caa799938526e9392e54237870844c2da442fe3a49629b0bb514d4a9`.

## Residual partition

The threshold mask contains exactly three 8-connected components:

- 780 pixels at `(0,210)..(319,220)`, maximum delta 41. This is the complete
  rounded top edge and side-edge colour component of the settled source button.
  It includes the previously reported 694 pixels from the narrower
  `(0,212,320,28)` applet-footer crop.
- 13 pixels at `x188, y221..233`, maximum delta 5.
- 6 pixels at `x174, y227..232`, maximum delta 66.

The latter two single-column components intersect the `Create Folder` ink.
They total 19 pixels; this spatial classification does not prove that the font
raster, rather than composition beneath or around the ink, caused them. The
other 780 form a material-shaped button/edge component. “Material-shaped” is a
description of the mask topology, not layer ownership. Its shape and colour are
consistent with the previously traced theme/material candidate route, but the
captures do not establish that route as active or causal.

## Source trace

The runtime already follows the pinned native route for a vacant root slot:

- `getHomeFooter` returns the existing one-button `create-folder` action;
- `firmware-presentation.ts` selects `N_BtnW_C_01`, binds settled
  `LncBtmBtn_02_SceneIn` frame 15, and fills the three source text layers from
  `menu_msbt_LZ/lau_1b_make_folder`;
- the decoded message is exactly `Create Folder`, message index 421, style 182,
  with source font scale `0.699999988079071` on both axes and zero character and
  line spacing;
- the active foreground pane `T_BtnFW_C_01` retains the authored 314x21 box,
  centred alignment and source material; and
- `textSampling: 'lcd'` samples the original alpha atlas at final LCD centres.
  No capture-fitted `textCoverageAdaptation` is applied.

There is no alternate message token, style, pane, settled pose or source
animation that supports shifting or resizing these glyphs. Applying a local
translation, changing advances or enabling the existing
`azahar-12p4-fit` coverage mode would fit the captured columns rather than
implement a traced native rule. The captures also do not prove that the 19
pixels arise from a hardware raster rule. A shared renderer change is therefore
neither justified nor made by this HOME-owned slice.

The earlier footer-theme executable trace establishes one candidate producer:
native function `0x2ac8c4` can write RGB material slots 0, 2 and 1 for
`P_BtnW_C_01` and `P_EdgeW_C_01`. It does not establish that the captured
settled footer took that route or that its unavailable values caused all 780
pixels. The candidate values depend on a live theme gate and nine runtime RGB
bytes, which are absent from the pinned dump and could not be safely read from
the isolated emulator. `SceneIn` contains pane translation/alpha tracks, not a
replacement palette. Reusing capture colours would therefore be a screenshot
fit. Resolving the candidate requires the settled gate and nine RGB bytes, or
an independent trace establishing a different producer/rendering cause.

## Element-to-source mapping

| Element | Manifest / pack key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| One-button layout and centre panes | `manifest.home.launcher` -> `layouts.LncBtmBtn_02` | `romfs/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Settled pose | `animations.LncBtmBtn_02_SceneIn` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| English label | `home.messages` -> `menu_msbt_LZ/lau_1b_make_folder` | `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Style 182 | `home.messages` -> `styles[message/EU_English/RI_mstl_LZ.bin][182]` | `RomFS/message/EU_English/RI_mstl_LZ.bin` | `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |
| Shared alpha glyph atlas | `manifest.fonts.shared` | system-font title `0004009b00014002`, `cbf_std.bcfnt.lz` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

The HOME source is EUR 10.7.0-32E title `0004003000009802`, version 24576,
content index 0 / content ID `00000082`. The CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
`launcher_LZ.bin` is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
Delivered launcher/message/font-manifest SHA-256 values are respectively
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`,
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`
and `d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

## Verification boundary

The focused regression locks the decoded Create Folder label/style, centre
pane, settled source pose, direct LCD sampler and absence of a fitted coverage
mode. This worker used no GUI, browser, Azahar, audio session or production
build. The coordinator owns any later integrated recapture.

The footer remains a `source-gap`: the cause of the 780 material-shaped pixels
is unproved, with the unavailable live-theme record only a candidate route, and
the cause of the 19 glyph-edge pixels is likewise unproved. No pixels are
masked, no adaptation is introduced and the whole scenario remains
`fail/unverified`. Other root-body population, cursor phase, exact input,
motion and native cue timing remain separate unresolved differences.
