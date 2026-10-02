# HOME Camera icon-corner baseline and production-after comparison

Comparison branch: `codex/home-icon-corners-compare-20261002`

Comparison base: `da6dfcedf678f782c369b20d1594dcac7f7abe45`

Browser-before runtime: `1e5fb200` (the accepted Notes runtime)

Status: **production runtime `3bb6c6f3` closes the complete Camera icon target
to the static delta-2 pixel tier in four repeated states; whole HOME scenarios
remain fail**.

## Bounded finding

Across fresh Health, Camera-selected, Health-reselected and Health-repeat
captures, native and browser each repeat the complete 50x50 Camera icon
interior byte for byte. The fixed `iconInterior minus artwork` fringe has
**23 / 564 pixels above 2/255, maximum channel delta 246**. Those pixels are
confined to four 3x3 corner boxes: 6 top-left, 6 top-right, 5 bottom-left and
6 bottom-right. The remainder of the fringe has 0 / 532 pixels above 2 and
maximum 1.

The 44x44 artwork core has **1 / 1,936 pixels above 2, maximum 16**. Its
42x42 interior has 0 / 1,764 above 2 and maximum 1, leaving the already known
single artwork-edge pixel at `(221,183)`. This baseline therefore supports a
narrow source replay through `LncIconDist_01/P_Icon_00` and
`IconMask.bclim`; it does not support moving the tile, changing its colours,
or reopening the ordinary plate.

Stable RGBA crop identities are:

- native icon interior:
  `911b0c99ffeac129a286dfa9a92d612b2fd9e84914627bbf11a6c5d57a884bdb`;
- browser icon interior:
  `208743047603c4071cecec0db9be58ec61c6498678c63c118f8c56990c517a51`;
- native icon fringe:
  `a22a1912eb28a43931a6fa543ba2110491da4cbbb323a5402d7378bb089373f2`;
- browser icon fringe:
  `4d5af13dd335d97a4bbdae9bebff30b4a8f93520745f8cb6af80a1df3d0a3ee1`;
- native artwork core:
  `6a73ee4291fe9d29af8fa18638be25f497a65452e05404fcb66e81222b807e40`;
- browser artwork core:
  `73a7320e112087c5b39a7c92d5cb15754cfc2eb26946322826bd7340cba93c7d`.

## Inputs and repeatability

Native inputs are Azahar's own 400x480 PNGs. The lower LCD is cropped at
`(40,240,320,240)` without scaling. Browser inputs are the coordinator's raw
320x240 lower LCDs from the earlier ordinary-plate production-before run.

| State | Fresh native own-PNG SHA-256 | Browser lower SHA-256 | Browser capture metadata SHA-256 | HOME updates / selected |
| --- | --- | --- | --- | --- |
| Health initial | `0c355caf7123f47a86911e15d981f7bf36d8c948c7476ab71a0f413634e060e4` | `aa59a3dd4af0d88981264fb9db8ba9529757434880479901989eff4529bc8c75` | `1c0a9c8978acc66de3e5e904ab8f71ad4bf362ac821cd94b5cde72fd23d72a28` | 50 / 8 |
| Camera selected | `ae39c525904829d34f6517f47dfcf3f757d7a3e050c8c8f30ee8cea2f43833d4` | `48c04a595946904aaa8afffb7c1629ac5e1712c7ccf2833aa012e01ab6409e96` | `d71b8a2f495d8465e63975e834c9d47cb5b9573b36b66ae4139c1fe9a6c9c3aa` | 121 / 10 |
| Health reselected | `f7abc5fc4b8b555df83f9d939584efc8efc0c4a6748bd4c175bd905008f18b4b` | `ced1fe8bcd098867143096c4efb0ea4834919d032880c82810a6afe5669a2299` | `a18b8c809c8f22238056b8528e743b6765157f08815273c8e83c10ddd1b6ae50` | 191 / 8 |
| Health repeat | `0e690648671f14654fac0d7d574e9f72f3d2b4184dab20a5be7c787e95cfd835` | `928d752bbcaf7147a80c09ca354ef1d9a0e565d9fdf504a730a4ae32f9955783` | `e32aef1f25046b5339094bfff149caaac56a110782bb53e4274d24e7fbc28e54` | 362 / 8 |

For the icon interior, fringe, all four corner boxes, fringe remainder,
artwork core/edge/interior and Notes control, every fresh native crop equals
the preserved prior native crop. Every browser crop equals its production-
before baseline. The three Health-state plate controls also equal their prior
native crops. The Camera-selected plate differs from its prior capture at
1,909 pixels, maximum 120, because the selected cursor phase differs; the
target icon crops remain byte-identical. This is a control-state distinction,
not an icon regression.

The coordinator records the same 200 ms semantic Health -> Camera -> Health
route after direct-executable setup. Runtime metadata is muted and records
`inputMatched=false` and `epochMatched=false`; boot prefix, native HID/frame
epoch, population, HUD and presentation clock remain unmatched.

## Regional baseline

The Camera tile is `[202,284) x [122,204)`. The 50x50 icon interior is
`[218,268) x [137,187)`, and the 44x44 artwork is
`[221,265) x [140,184)`.

| Diagnostic mask | Pixels above 2 / total | Maximum | Classification |
| --- | ---: | ---: | --- |
| Icon fringe | **23 / 564** | **246** | Target: four corner components only. |
| Top-left / top-right corner | 6 / 9; 6 / 9 | 246; 246 | Target. |
| Bottom-left / bottom-right corner | 5 / 5; 6 / 9 | 246; 246 | Target. The bottom-left mask has five fringe pixels because the other four belong to the artwork edge. |
| Fringe remainder | **0 / 532** | **1** | Preserve. |
| Artwork core | **1 / 1,936** | **16** | Existing edge pixel; preserve or improve. |
| Artwork 42x42 interior | **0 / 1,764** | **1** | Preserve. |
| Notes control `[64,90) x [3,26)` | **0 / 598** | **1** | Accepted static pixel tier; preserve. |
| Open-footer control `[0,320) x [212,240)` | **694 / 8,960** | **30** | Known separate source gap; do not reopen. |

The ordinary plate outside the icon interior remains the control established
by [the ordinary-plate comparison](home-ordinary-plate-compare.md): the three
unselected Health states are **963 / 4,224**, maximum 26. Camera-selected is
2,373 / 4,224, maximum 177 because its selected cursor is present. Neither
number is an acceptance target for this slice.

## Whole-LCD control

The repository comparator was rerun with an empty mask for all four fresh
native/browser pairs. Every pair remains `unexplained-differences`; these are
controls, not scenario acceptance.

| State | Upper pixels >2 / mean / max | Lower pixels >2 / mean / max | Report SHA-256 |
| --- | --- | --- | --- |
| Health initial | 49,005 / 11.133861 / 215 | 15,617 / 5.157760 / 246 | `7adc8088ee9749180b31598ebaaefb35a33d16f0a4e23fe3ab63f124ad282a93` |
| Camera selected | 53,464 / 9.685875 / 215 | 16,205 / 5.656801 / 246 | `3140c4d2a21065529c60e028773023bdc5d5b516501cdc6f7a1b1478c110befe` |
| Health reselected | 43,862 / 8.188194 / 215 | 16,155 / 5.445295 / 246 | `0be83948571df196d787c28f8d264beb2472924545a8eed8d8bc38828be554c2` |
| Health repeat | 45,645 / 8.347910 / 255 | 15,723 / 5.387595 / 246 | `ce0541871863c345bbd1304394230a7f165b4c2a2635a06ac28949befac98abc` |

The opened whole-LCD sheets show expected population, HUD, banner, cursor,
plate and footer differences. No whole scenario passes from this baseline.

## Source provenance and fidelity boundary

| Element | Delivered key | Dump source | SHA-256 |
| --- | --- | --- | --- |
| HOME launcher | `manifest.home.launcher` -> `packs/home/launcher.json` | HOME `0004003000009802` v24576, content index 0 / ID `00000082`, `romfs/launcher_LZ.bin` | archive `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`; delivered pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |
| Icon layout/material | `layouts.LncIconDist_01`, pane `P_Icon_00` | `romfs/launcher_LZ.bin/blyt/LncIconDist_01.bclyt` | `125fd2772c35f967f596b0fbd8692a7d13d78a425eaccc72e85d46528507f76d` |
| Rounded mask | launcher texture `IconMask.bclim`, A4 | `romfs/launcher_LZ.bin/timg/IconMask.bclim` | source `de8c6815059f79db23984571fb864f56792a738b3391a3800e3d6bc47ab59983`; delivered PNG `06c7438a68a45aea82d0d43477897883d5fef1cb4176d4cda15225770e8dbd4a` |
| Camera artwork | `resources["icons/camera.png"]` | Camera `0004001000022400` v4097, content index 0 / ID `0000001a`, `ExeFS/icon` | source `53534942eaf5b9c11d94e5f5118b4fe1a624e40d83765893185fd2f30a2956a1`; delivered `eef80be1e6961951cb776306165fd141016760327e1c96f865a68ccb88a92f01` |

The HOME launcher's pinned CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

At browser-before runtime `1e5fb200`, the stock-grid path calls
`titleIcon` -> `titleArtwork` -> `c.drawImage` after the separate plate render. It
does not route the Camera artwork through the authored
`LncIconDist_01/P_Icon_00` material's second `IconMask.bclim` sampler. This is
the bounded browser-before fidelity gap. Source commit `01fb8e4a` replaces
only ordinary stock-grid title artwork with the existing guarded authored
material path; pickup, header, suspended, folder and portfolio artwork paths
remain unchanged. Production runtime `3bb6c6f3` is measured below.

## Production-after inputs

The coordinator integrated source commit `01fb8e4a` as production runtime
`3bb6c6f3` and captured the same semantic Health -> Camera -> Health route.
The browser inputs below are actual raw production captures, not source-replay
predictions.

| State | Upper SHA-256 | Lower SHA-256 | Capture metadata SHA-256 | HOME updates / selected |
| --- | --- | --- | --- | --- |
| Health initial | `dbd026e1330939d2b5815fb968332bf1dbd0fe80132b1c523f189046119ff7b1` | `005adf8fb0818eee4eba4211f47dfed81c6424b8dd3ab0a873aaf431feec9d0f` | `7205d8cf3a83775f3089ff6cdb3fd633eaf5084f38f47c887e304f3527695c1e` | 49 / 8 |
| Camera selected | `98b074467580b3dac97419998ef235ce70511e87b2302142319301edb7f3af6d` | `a0db3c076123c503fb1b92b84c1547cea7fb7c2f6dbf38dccb97a7511661d53c` | `dec9e800860890c96109b18bf325077d34e7aa8d84ea46acfbb483b89af0350b` | 117 / 10 |
| Health reselected | `4dc47423bc39708716a40df5f4beb83439bacefd9f05e6413bce8eacd7846e69` | `b22fd23b349193ea4e7fc89cf78b958e28a0e382b9e4b79208e53289c14324f1` | `1c196998dbe3d134cd298ca603e175ad89ff8a54737269637ae0fc82c3325e1b` | 185 / 8 |
| Health repeat | `a18257df65802384a353c31f873b6dbf2800d25c863f9d18431f2742adc102ba` | `aa1bd4fd5246f2f1799183d2f6acb9160bfe82166432bb108655f1909db772c2` | `482de478bba683231195e2b10e82d617ec37bb8a527746e19936f5707d78fd89` | 356 / 8 |

`browser-after/result.json` records runtime `3bb6c6f3`, the two 200 ms touch
steps, muted state and no browser errors; its SHA-256 is
`ae6cfbbf7bdd07c67c70a8fb5f10d35866de70da6eed2b5f66bab5fcd6a626d8`.
Each capture still records `inputMatched=false` and `epochMatched=false`.

## Production-after regional result

Every target and control measurement below repeats exactly across all four
production-after states except the selected-cursor plate control.

| Region | Browser-before vs native | Production-after vs native | Direct before -> after | Result |
| --- | ---: | ---: | ---: | --- |
| Complete icon interior | 24 / 2,500, max 246 | **0 / 2,500, max 2** | 24 / 2,500 changed above 2, max 245 | Static pixel tier. |
| Icon fringe | 23 / 564, max 246 | **0 / 564, max 2** | 23 / 564 changed above 2, max 245 | All four corner components closed. |
| Fringe remainder | 0 / 532, max 1 | **0 / 532, max 1** | RGB byte-identical | Preserved. |
| Artwork core | 1 / 1,936, max 16 | **0 / 1,936, max 1** | 1 / 1,936 changed above 2, max 16 | Existing edge pixel closed. |
| Artwork 42x42 interior | 0 / 1,764, max 1 | **0 / 1,764, max 1** | RGB byte-identical | Preserved. |
| Notes control | 0 / 598, max 1 | **0 / 598, max 1** | RGB byte-identical | Preserved. |
| Footer control | 694 / 8,960, max 30 | **694 / 8,960, max 30** | RGB byte-identical | Separate source gap unchanged. |

The production-after icon-interior RGB-channel mean absolute delta is
`0.125867`, RMSE `0.356277`; the fringe is `0.338652` / `0.585987`; and the
artwork core is `0.063877` / `0.252740`. The after icon, fringe and artwork
hashes each have one unique value across the four states. The 6x sheet shows
native, before and production-after in its first three columns, a nearly black
native/after difference in the fourth, and the corrected corners plus single
artwork-edge pixel in the direct before/after fifth column.

The three unselected Health plate controls are RGB byte-identical before and
after and remain 963 / 4,224 above 2, maximum 26 against native. The
Camera-selected after plate is 2,335 / 4,224, maximum 153 against native and
changes 1,624 pixels above 2, maximum 32 from browser-before. That state has a
different selected-cursor phase (updates 117 versus 121); it is not attributed
to the title-icon material change and is not an acceptance target.

## Production-after whole-LCD controls

All four empty-mask whole-LCD comparisons remain
`unexplained-differences`:

| State | Upper pixels >2 / mean / max | Lower pixels >2 / mean / max | Report SHA-256 |
| --- | --- | --- | --- |
| Health initial | 49,182 / 11.068017 / 215 | 15,673 / 5.109570 / 245 | `aa430d04fe01757a0ed08acc1cb28fbe6b28c23794f8af133c35ecc0e89cc521` |
| Camera selected | 53,545 / 9.671799 / 215 | 16,117 / 5.483793 / 245 | `991d750aca3259ce744aa540a71e6d69a71c7c0b3987e3dcc09f70416328cd6e` |
| Health reselected | 44,951 / 8.052733 / 215 | 16,127 / 5.503268 / 245 | `bedd652f15e695d5b17f26e9e10df71c04733dce95acdff69efb57034d2daf44` |
| Health repeat | 43,907 / 8.015660 / 255 | 15,101 / 5.200968 / 245 | `914ae25df4e7f1a587d64fd07c9384026411c4b21433f647c6073d973763b1d8` |

Direct whole browser-before/after comparisons change 1,852 / 1,164,
4,201 / 1,922, 4,553 / 1,086 and 4,582 / 2,126 upper/lower pixels above 2
for the four states respectively. Those counts include unmatched HUD, banner,
cursor and presentation epochs; they are not evidence that the icon candidate
changed those regions. The opened whole-LCD sheets retain the known
population, HUD, banner, cursor, plate and footer differences. No whole
scenario passes.

## Evidence classification and remaining limits

- Source-identified and delivered: the pinned HOME layout, authored mask,
  material state and Camera icon listed above.
- Implemented: source commit `01fb8e4a`; ordinary stock-grid titles only, with
  explicit material/resource guards and no fitted coordinate, UV, colour or
  replacement asset.
- Tested: the coordinator reports 1,789 passed, 0 failed, 23 skipped and one
  TODO, plus typecheck, build and shader checks passing for runtime
  `3bb6c6f3`. This comparison worker did not rerun the build or tests.
- Browser-inspected and native-compared: four actual production raw LCD pairs,
  the target sheet and representative whole-LCD sheets were opened at original
  resolution.
- Remaining: the original native title-texture setter/extent/UV and GPU
  precision are still not source-proven. Exact native input, boot prefix,
  population, epochs, motion and audio remain unmatched. Plate and footer
  source gaps remain. Strict 1:1 fidelity and whole-scenario acceptance remain
  unproven.

## Artifacts

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-icon-corners-20261002/comparison/`.

- reproducible comparator: `compare.mjs`, SHA-256
  `58e061e8a3f0c4e7fa817d651eb080770f0e60acb7102f0fc36202f17921a843`;
- empty mask: `empty-mask.json`, SHA-256
  `cff62ec3f0f28b8125992bdf63f7aefdf054a49f09e4f36495e16410bb239184`;
- baseline report: `baseline/report.json`, SHA-256
  `2ea0dac1a15f76b8093ba83c81ce641f47c62fe5e2412a0194df78d680950cf8`;
- 6x nearest-neighbour native/browser/difference sheet:
  `baseline/camera-icon-native-baseline-diff6x-sheet.png`, SHA-256
  `ef1e498e2c7b21c950d37bddffc9771226fcc9e3d100d0000863d3870601e20a`;
- whole-LCD reports and contact sheets:
  `baseline/whole-lcd/{health-initial,camera-selected,health-reselected,health-repeat}/`;
- production-after regional report: `after/report.json`, SHA-256
  `5f1ce4210603276d26f6eb680f6ccafbd02f215e8497234c50dc5802bcde6e01`;
- 6x native/before/production-after/native-after-difference/direct-difference
  sheet: `after/camera-icon-native-after-diff6x-sheet.png`, SHA-256
  `cdfbcf79565d5e7f600b76c282be76fd592f96f46c397869f2e0c3d8e4694de7`;
- production-after whole-LCD reports and sheets:
  `after/whole-lcd/{health-initial,camera-selected,health-reselected,health-repeat}/`;
- direct browser-before/after whole-LCD reports, in state order above:
  `after/direct-before-after/.../report.json`, SHA-256
  `85a228d854afd62234d218bc0429aa0ef2d0957fbf75badca4880b7624634dc4`,
  `983aa5dd255cdc984892d2abc5c86aca72f56f3e8ec3efeaefa3c6c278e9c923`,
  `7d37393e15df190e3e139313d41fa19c5608dd8d922f765671abef91025fcd19`
  and `20d2343988642615c824994bbd5986a7ca8119fa4ae8e61e01015aff6a021d41`.

The baseline and production-after target sheets and representative after
upper/lower whole-LCD sheets were opened and inspected at original resolution.
Both regional reports and all whole-LCD reports parse as JSON. This worker
changed no runtime, asset, shared project document, matrix, GUI, native,
browser, audio or build state. Documentation-only verification is
`git diff --check`.
