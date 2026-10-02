# HOME Create Folder footer residual comparison

Date: 2 October 2026

Branch: `codex/home-create-folder-footer-compare-20261002`

Base: `9820379ce85b861ae824533219d8093080446551`

## Scope and method

This is a bounded comparison-only audit of the full-width Create Folder footer
shown for a selected vacant root slot. It changes no runtime, asset, shared
progress/map document or private scenario matrix. The supplied native/browser
images are compared at raw lower-LCD coordinates with empty masks and RGB
threshold 2. No translation, scale, phase, colour or geometry fit is used.

The fixed private manifest is
`home-create-folder-footer-20261002/comparison/manifest.json`, SHA-256
`3407a69262de48e1dcc0aadd9635777b8c3572982aa11f29bc25ee5fd3ca6332`.
Native inputs are Azahar's own 400x480 RGB PNGs, cropped at
`(40,240,320,240)`. The exact footer ROI is the existing source clip
`x0/y210/320x30`.

## Fixed inputs

| Pair | Native input / SHA-256 | Browser lower / SHA-256 | Role |
| --- | --- | --- | --- |
| post-delete Folder 1 | `_02.10.26_17.01.36.758.png` / `89c9934f782a5fd31b9b86cfc64d62a54ac4ae70cc740fffe3184d4a54762001` | `browser-after/delete-result/lower.png` / `9a66b858c08e53f32ef551c7a0ac078aabf29cbc295da2400a1cbcf1561c3034` | current primary |
| post-delete Folder 2 | `_02.10.26_17.04.17.601.png` / `263381a6c39a41358391179335d2d12cf49fd3df51b7227e9e5cc8b3ad26d441` | same production-after lower | independent native repeat |
| prior vacant root | `_02.10.26_16.33.36.263.png` / `742d5c991197182408612bce2722859cb33986ed507a1763bb5ac8636badb6de` | `browser-aligned/empty/lower.png` / `d7bd494c46ebe748c8cfc5e9e724f3d6d8dfe9064ed0138f01200cac57b6af7b` | earlier independent baseline |

The current browser capture is runtime `2f074d64`; the earlier vacant-root
browser capture is runtime `b8773a90`. Native/browser population, input cadence
and animation epochs remain unmatched.

## Exact shared signature

All three native footer crops are byte-identical. All three browser footer
crops are also byte-identical, including the earlier vacant-root baseline:

- native raw RGB footer SHA-256:
  `adc1034f1474d397cc096eb54851216e33776512a25b1e12794afef436389a3a`
- browser raw RGB footer SHA-256:
  `fc69e4fbb45917cc8e1b5a69cc1710899a3960af4247039e3c3a52bb555c8a87`
- absolute RGB difference SHA-256:
  `a23e39e840279c87d122f9e13da3c6045f912a7b86f66286fcac2104439bfa20`
- threshold-mask SHA-256:
  `9b50894b1d287c101cec0dabda36dfb191ac0104c20d61d5986988de7a7928dc`

The exact residual is therefore not caused by the Delete route, folder number,
capture epoch or the newer runtime. It is a stable residual of the shared
decoded Create Folder footer presentation.

Each pair has 799 of 9,600 footer pixels above delta 2, maximum channel delta
66, MAE 0.898090 and RMSE 3.652078. The tight eight-connected topology is also
identical in every pair:

| Diagnostic component | Pixels >2 | Bounds | Maximum delta | Interpretation |
| --- | ---: | --- | ---: | --- |
| panel/edge component | 780 | `x0..319/y210..220` | 41 | full-width separator plus mirrored rounded outer edge |
| text column 1 | 13 | `x188/y221..233` | 5 | one-pixel-wide Create Folder glyph residual |
| text column 2 | 6 | `x174/y227..232` | 66 | one-pixel-wide Create Folder glyph residual |

Within the 780-pixel panel component, the full-width rows y212 and y213 account
for exactly 640 pixels. That separator band has maximum delta 30, MAE 7.180208
and RMSE 9.904702. The remaining 140 panel pixels are only the rounded/outer
edge: x0..20 and x299..319 at y210, x0..21 and x298..319 at y211, narrowing
symmetrically through x0/x319 at y219..220. There is no residual in the flat
panel interior below the edge outside the two text columns.

The dominant separator colours reproduce the existing theme-material finding:
272 pixels are native `(210,212,220)` versus browser `(210,208,205)`, and 268
pixels are native `(206,208,217)` versus browser `(209,207,204)`. The text
residual is separate and contains only 19 pixels.

## Whole-lower controls

The full lower LCD remains population- and cursor-phase-mismatched. Those
differences are retained rather than masked:

| Pair | Full lower >2 / max / MAE | Toolbar >2 / max | Root body >2 | Selection ROI >2 / max |
| --- | --- | --- | ---: | --- |
| post-delete Folder 1 | 14,968 / 255 / 7.017131 | 0 / 2 | 14,169 | 364 / 27 |
| post-delete Folder 2 | 15,108 / 255 / 7.046072 | 0 / 2 | 14,309 | 504 / 47 |
| prior vacant root | 15,208 / 255 / 7.179779 | 0 / 2 | 14,409 | 604 / 156 |

The toolbar is at the static pixel tier in every pair. The footer is exactly
stable while the cursor and root population controls vary, independently
confirming that the 799-pixel footer signature is not a phase selection.

## Source ownership and next evidence

The visible element is HOME `0004003000009802` v24576, content index 0 / ID
`00000082`, `home.launcher/layouts.LncBtmBtn_02` at settled
`LncBtmBtn_02_SceneIn` frame 15, clipped to `[0,210,320,30]`. The label is
`home.messages/menu_msbt_LZ/lau_1b_make_folder`.

| Element | CIA-internal member | SHA-256 |
| --- | --- | --- |
| footer layout | `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| English Create Folder message/style | `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |

The HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
`launcher_LZ.bin` is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
the delivered launcher pack is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The established source audit traces the panel RGB producer but still lacks the
settled native active-theme gate and nine runtime RGB bytes. The separator and
rounded-edge component is consistent with that known source gap. Fitting the
native cool colours from screenshots would violate the source contract, so
this comparison does not propose a colour correction. The two text columns
should remain a separate source/render trace rather than being hidden by a
panel adjustment.

If a shared `LncBtmBtn_02` source fix is produced, the coordinator must
recapture this Create Folder state and controls for other footer modes, at
minimum single Open, Notes/Friends applet Open and asymmetric two-button
Settings/Open. A Create Folder-only improvement is insufficient to accept a
shared footer change.

## Artifacts and status

The private analyzer is `comparison/analyze-footer.mjs`, SHA-256
`c85e68b1c423d22f51fb470345280fe1cc68f293c98a6ad9173c7a45e31a1d42`.
The baseline report is `comparison/baseline/report.json`, SHA-256
`9797355ba63fc6ed06314519a85fbecc644bbde8029e8460956a46e0b9c22d9c`.
Both sheets were inspected:

- full lower native/browser/heatmap sheet SHA-256
  `4b111090ce3149d0b4948de3fa030898bc7a5b8f0665fa7495f1bdbfe1e35baa`
- 4x footer-detail native/browser/heatmap sheet SHA-256
  `0524f2a5caa799938526e9392e54237870844c2da442fe3a49629b0bb514d4a9`

This is source-identified, browser-inspected comparison evidence. It does not
establish exact input, motion, audio or whole-scenario acceptance. The source
gap and scenario remain fail/unverified while fresh production-after evidence
is pending.
