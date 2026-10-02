# HOME Game Notes toolbar raster — 2 October 2026

## Bounded defect

This slice addresses only the unselected yellow Game Notes toolbar glyph in
`LncBase_D_01/P_Memo_10`. It does not change the known 694-pixel Open-footer
gap, HOME population, cursor or banner epochs, balloon positioning, tile
artwork, offsets, or palette constants.

The read-only comparison uses native own-PNG
`_02.10.26_12.10.02.428.png` (SHA-256
`a8d38cb04fd45b85232765c045a81ef421f50b8ae15b6aa2aaeeafef4685aebc`)
and production runtime `d4c96f26` lower LCD (SHA-256
`6a6ec684a6b57be2f7dc4fd7b45c47d280c392ea07eee767a291c7dcb97d2d87`).
In the half-open lower-LCD rectangle `[64,90) × [3,26)`, 201 of 598 pixels
exceed delta 2 and the maximum RGB-channel delta is 25. Exhaustive integer
translations through ±3 pixels rank `(0,0)` first. The named-region report is
SHA-256 `a11de07c94ef874fe51835a9d0974df182e5433a5101c44942971e575c7f7480`;
the inspected toolbar native/browser/difference sheet is SHA-256
`8ba8b62948d86d0aa8475cdf4f78b193816a6f34fca814b1690230d1e7dd876b`.

The coordinator subsequently saved four native Notes ROIs across the fresh
Health/Camera route; those four ROIs are byte-identical. A fresh production-
before Health → Camera → Health 200 ms route also reproduces 201 pixels over
delta 2 and maximum delta 25. The native input in that launch did not select
Camera, so this establishes repeatability of the bounded Notes residual, not
an exact-input native/browser pair or a whole-scenario pass.

## Native resource mapping

The complete element-to-source route is:

- manifest key `home.launcher` → `packs/home/launcher.json`, SHA-256
  `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
- EUR HOME title `0004003000009802` v24576, content index 0 / content ID
  `00000082`;
- `launcher_LZ.bin`, SHA-256
  `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
- `launcher_LZ.bin/blyt/LncBase_D_01.bclyt`, SHA-256
  `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf`;
- pane/material `P_Memo_10` under `N_Memo_00`, drawn at source size 36×36;
- `IcnCherry_10.bclim` L8, source SHA-256
  `f9d251d21cf6aa2f63bd91278fabd936221ec67406b6a646169f1cb0a44622e0`,
  delivered PNG SHA-256
  `b7bfe2e1107b8ab6d40b616c2b70b72f5f1ece94831142b312b14406cb07f306`;
- `IcnCherry_11.bclim` LA8, source SHA-256
  `cfa03ff0df374a909eb88b0e98378f160903fcc260e4c6392e0d304c26ebaffb`,
  delivered PNG SHA-256
  `6dc5a83d971315b9734fb7714e85714d26476ef37d9abfd2986cb49c3a6d1a78`;
- `IcnGrw_8_00.bclim` A8, source SHA-256
  `738dbfe353a887f9dcb568f5800f9435def7b2f5c1e5ec7fc7422839eded1a68`,
  delivered PNG SHA-256
  `1b26c20824b0d4e72ad172c031cc40488e9ee674f6ae3d30eb69396e58d2de7b`;
- converter `ctr-native-web` 1.2.0 and extractor CTRTool 1.3.0.

The application path remains `createFirmwareHome().toolbar` →
`NativeLayoutRenderer` → `LncBase_D_01`, with settled source bindings
`PaletteOut` frame 12 and `MvsToggle` frame 0.

## Source-bounded candidate

`P_Memo_10` has one decoded UV set. Its material has three texture maps and
the third coordinate generator, for `IcnGrw_8_00`, selects source UV attribute
1. That attribute is absent from the decoded picture. The browser renderer
previously replaced every absent UV attribute with a fabricated unit quad
`[0,0, 1,0, 0,1, 1,1]`, sweeping the 8×8 A8 grow texture across the 36×36
pane. That quad is not data present in the decoded picture. The bounded
candidate samples the absent attribute as an all-zero value.

An inventory of every delivered firmware layout finds this exact missing-UV
shape only once: `LncBase_D_01/P_Memo_10`, sampler 2, source 1, with one UV
set. Explicit UV sets and all other delivered panes therefore keep their
existing sampling.

The fitted-zero sample retains the authored six-stage TEV material and palette
constants. At local pane pixel `(20,4)` it yields `[225,190,0,255]`; the
fabricated unit quad yields `[235,193,0,255]`. Across the captured 26×23 ROI,
all 201 original differences occur on fully opaque material pixels. Replacing
only the absent attribute's invented unit quad with zero predicts 0 pixels
over delta 2 and maximum delta 1. The output alpha is byte-identical before
and after, so the correction does not change edge coverage or compositing.

The decoded resource proves that UV attribute 1 is absent; it does not prove
how native hardware initializes or reads that absent attribute. The exact
all-zero sampling rule is therefore an inferred, capture-fitted adaptation
until native initialization is traced. It is not a fitted color, texture,
offset, or theme value. The repeated residual and exact pixel prediction
support the bounded rule without turning it into source-proven behavior.

## Implementation and verification boundary

`rasterNativePicture` now permits the fitted all-zero UV only for the exact
delivered Notes shape: material `P_Memo_10`, sampler 2, source 1, one picture
UV set, the authored three-generator pattern, and the three named textures.
Any other missing selected UV fails explicitly. Authored UV sets retain their
existing path. The independent scalar reference applies the same test-only
contract. Regressions cover generic and near-Notes rejection, explicit UV
sampling, the fitted material byte result, source immutability, and alpha-byte
preservation across the complete 36×36 raster. Existing density/toolbar tests
ensure presentation bindings and pane positions are unchanged.

Worker checks passed:

- `git diff --check`;
- `node --test tests/native-presentation.test.mjs tests/native-raster-kernel.test.mjs tests/home-density-controls.test.mjs` — 49/49;
- `npm run typecheck`.

This worker did not run a production build, browser, Azahar, audio, or private
matrix update. The coordinator must integrate and capture the production after
image. Until that after comparison exists, the predicted 0/max-1 ROI is not
native acceptance, and the HOME idle scenario remains fail.
