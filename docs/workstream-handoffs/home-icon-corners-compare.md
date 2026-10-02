# HOME Camera icon-corner baseline

Comparison branch: `codex/home-icon-corners-compare-20261002`

Comparison base: `da6dfcedf678f782c369b20d1594dcac7f7abe45`

Browser-before runtime: `1e5fb200` (the accepted Notes runtime)

Status: **the Camera icon fringe is a four-corner, byte-repeatable target;
candidate-after and production-after evidence are pending**.

## Bounded finding

Across fresh Health, Camera-selected, Health-reselected and Health-repeat
captures, native and browser each repeat the complete 50x50 Camera icon
interior byte for byte. The fixed `iconInterior minus artwork` fringe has
**23 / 564 pixels above 2/255, maximum channel delta 246**. Those pixels are
confined to four 3x3 corner boxes: 6 top-left, 6 top-right, 5 bottom-left and
6 bottom-right. The remainder of the fringe has 0 / 541 pixels above 2 and
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
| Bottom-left / bottom-right corner | 5 / 9; 6 / 9 | 246; 246 | Target. |
| Fringe remainder | **0 / 541** | **1** | Preserve. |
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
the bounded fidelity gap. The source worker's candidate is pending and is not
accepted by this document.

## Acceptance gate

Candidate-after is intentionally absent. After the source worker supplies a
bounded candidate, the coordinator must integrate it and recapture the same
four states. Acceptance requires:

- the 23 fringe pixels to improve through the authored native material path;
- the 541-pixel fringe remainder, 42x42 artwork interior and Notes control to
  retain their current static pixel tier;
- the single artwork-edge pixel not to worsen without a source explanation;
- no new ordinary-plate or footer claim; and
- direct production-before versus production-after evidence, plus the
  empty-mask whole-LCD control.

This baseline does not establish exact input, motion, audio, whole-scenario or
strict 1:1 fidelity.

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
  `baseline/whole-lcd/{health-initial,camera-selected,health-reselected,health-repeat}/`.

The target sheet and representative upper/lower whole-LCD sheets were opened
and inspected at original resolution. The report parses as JSON. This worker
changed no runtime, asset, shared project document, matrix, GUI, native,
browser, audio or build state. Documentation-only verification is
`git diff --check`.
