# HOME empty-folder Delete native comparison

Date: 2 October 2026

Branch: `codex/home-folder-delete-compare-20261002`

Base: `e6802cfd2e1f31e6dc0509fc99d0517903f4ea0d`

## Scope

This is a comparison-only lane for the behavior of Delete in Folder Settings
when the selected folder is empty. It owns no runtime, asset, shared progress,
feature-map or private-matrix changes. The coordinator alone captures native
and browser states. Native/browser title population, exact input and animation
epoch remain unmatched.

## Native capture mapping

The fixed private manifest is
`home-folder-delete-20261002/comparison/native-manifest.json`. It records
Azahar's own 400x480 RGB PNGs with upper crop `(0,0,400,240)` and lower crop
`(40,240,320,240)`.

| Role | Native file | SHA-256 | Observed state |
| --- | --- | --- | --- |
| primary pre-Delete | `_02.10.26_17.01.11.853.png` | `16ec7ceb6af052a7663bcb1aca60160b03e4e3aa6fdb3c0eb7f77d73cd8325a9` | Folder Settings for empty Folder 1 |
| primary post-Delete | `_02.10.26_17.01.36.758.png` | `89c9934f782a5fd31b9b86cfc64d62a54ac4ae70cc740fffe3184d4a54762001` | Immediate root HOME, former folder vacancy selected, Create Folder footer visible |
| repeat pre-Delete | `_02.10.26_17.04.03.362.png` | `6e974965cdda3ac418faf2f1494055b1e0b7aabade3a31b11c552a74c063993b` | Folder Settings for empty Folder 2 |
| repeat post-Delete | `_02.10.26_17.04.17.601.png` | `263381a6c39a41358391179335d2d12cf49fd3df51b7227e9e5cc8b3ad26d441` | Repeat immediate root HOME/Create Folder result |

Both independent empty-folder runs went directly from the settled Folder
Settings panel to root HOME after Delete. No confirmation screen appeared.
After Folder 1 was deleted, creating the next folder produced Folder 2; the
repeat therefore also preserves the observed monotonic folder numbering.

Attempts to populate a folder by dragging Health or Camera did not move either
title. Those attempts are excluded. These captures establish empty-folder
deletion only; populated-folder deletion is not established.

## Baseline semantic discrepancy

At this base, the browser does not follow the native route. Activating Delete
from `folder-settings` sets `panel:'delete'`. `screens.ts` then draws a
reconstructed “Delete this folder?” panel with separate Cancel and Delete
buttons. A second activation is required before the reducer removes the empty
folder and returns to HOME.

That confirmation is not present in either native repeat and has no native
frame to pair against. It must be recorded as an unpaired source gap, not
force-fit to either native image. The required after behavior is one Delete
activation from the native Folder Settings row directly to root HOME, with the
same vacancy selected and Create Folder available. Rename remains inert because
software-keyboard input is outside scope.

## Frozen comparison plan

The production browser capture must retain the real action history and record
the state immediately before and after one Delete activation. The comparator
will hash and validate:

- `settings`: `menu=folder-settings`, six rows, selected folder retained;
- `post-delete`: `menu=home`, six rows, folder absent, the former vacancy
  selected, and Create Folder visible;
- no intermediate confirmation state in the after history;
- the baseline browser's reconstructed confirmation as a semantic source gap;
- raw native/baseline/after upper and lower PNGs with empty masks and threshold
  2, without translation, scale, geometry or phase fitting.

Fixed lower regions remain the existing source-backed coordinates: toolbar
`x0/y0/320x34`, root body `x0/y34/320x176`, footer
`x0/y210/320x30`, six-row cursor ROI `x119/y139/54x54`, and Folder Settings
modal `x20/y20/280x200`.

## Browser baseline capture

The coordinator completed browser session 54050 at baseline runtime
`79e77f58`. The browser process was PID 30014, window 10821, at frame
`(20,50,1150,780)`. The script exited zero with no page errors. Its root is
`home-folder-delete-20261002/browser-before`; `result.json` has SHA-256
`1ef42e3c6b3893c8869736ca2fbc2be0879e25a9071be128865d74965544ec33`.

All captures record six rows, selected global slot 34, selected source center
`(146,166)`, `inputMatched:false` and `nativeEpochMatched:false`:

| Browser capture | State after action | Capture JSON SHA-256 | Upper SHA-256 | Lower SHA-256 |
| --- | --- | --- | --- | --- |
| `folder` | `home`, created empty folder selected | `d638c2b650a237c1673bc95962c824f8abf3087fa04838718ef36910ed1d3a58` | `f298ae4ad82020a4fd05490eb5e2a33d737a35e08bbbe526b95ad16c93d293e6` | `e13c5c0a38c7a77589cd3b2a804372841d7e3bbcef8f49de65805c250dc91775` |
| `settings` | `folder-settings` | `6de519527957ffe75599d6711de0b6bcaab0bf329e13be484f0e6d7001c889c9` | `3d2251d7405875b7b6685a7edaa8c5dd8c0389ef06e2e1e506ec2dbcc902399f` | `9859a03ed60111cb9550722112071835b8f6c409a02aff5e45084bdf0c131613` |
| `delete-result` | reconstructed `delete` confirmation after one Delete touch | `bdc83f3c417144e7052773ec8a182ea1d72535afbfc6b3d3d925bbe3e1a79380` | `cbd864dc0e440ea4d1a3a43cc32f5546fb5f4af8a27f1ddc8d460c2d6c286f75` | `d6bf6b45c970035b2f9116e4d382bce1d931aa1fc421f390d924eb0d15f557c2` |

The action history is vacancy touch -> Folder Settings touch -> one Delete-row
touch at browser target `Touch_100_150`, each held for 50 ms. After the third
action the browser remains in `menu=delete`; native is already at root HOME.
The two states are therefore a semantic mismatch and must not be treated as an
equivalent-state pixel pair. The baseline confirmation images are retained and
hashed as evidence of the source gap only.

The isolated native process was PID 23620 in window 10753. Its exec session
2591 exited normally through Quit/Yes with status zero. PID absence was
verified and the muted configuration was retained.

## Production-after behavior

Production-after runtime `2f074d64` removes the reconstructed confirmation.
Its complete `result.json` has SHA-256
`739b35fe4318049d7fa648b214b4970befc32f0c59b58c03c01c9aa1e0d31f49`.
The script exited zero, remained muted and recorded no page errors.

One 50 ms touch on the Delete row now goes directly from `folder-settings` to
`home`. Physical A after moving the panel choice to Delete, a persistence
reload after deletion, and mobile touch deletion all finish in the same
observable state: six rows, selected and visible global slot 34, source center
`(146,166)`. The selected former vacancy exposes Create Folder. The route
identities are:

| Route | Capture JSON SHA-256 | Upper SHA-256 | Lower SHA-256 |
| --- | --- | --- | --- |
| touch Delete | `c17b97ab6fa7ec4d8d4baba42399464675f6923b3826cb6b6486ce7c21f11e9c` | `e2d57d62f442b5d19e6d4728ffac4754f7a4d64bd403a3a41ab7b4002998e008` | `9a66b858c08e53f32ef551c7a0ac078aabf29cbc295da2400a1cbcf1561c3034` |
| physical A Delete | `9b8dd065fdad2f876fca106b12a4e62dd68222e263f9bedfd5108b690be2faa7` | `9e66ca21ab83d31b00c40b02e23ad93a4fd6358f040fb49893f4daa8a29ea97a` | `eb307e8a3ce23fecae7ee41f869c9c1de9176c5175955c0dc68b45c1e0955e35` |
| persistence reload | `e8c442348c38ab579884fbe074a8baa8b1b3b6325761662870ebc172bd8e29a5` | `bcb0072cbc0d72733d9ec569e1c67812ffccf9078982518d63806b4df2c75fa1` | `029dc38ac73deb4e7f2f904e453c661f483a32633f748683a64f40017e9e1dc3` |
| mobile touch Delete | `9a401c60d6bfeda583ae621a4bf47cb37cc1911acfe66c9ed573861009e2781c` | `29e8ebae7b2aeb44e528aaffa35544fd9fa7a351c05f936cb8e4d5f6f03ed341` | `2890dfc8946f0ad51f92dffe3f35de7cf18173fbdc9bff28d4dcbe13dfbd4d93` |

The dedicated Chrome PID 30014 was closed with `Browser.close`; launcher 7807
exited zero.

## Fixed same-state comparison

The private comparator is `home-folder-delete-20261002/comparison/compare.mjs`,
SHA-256
`89ce9e7fd6e6a1661492dbc45b0de477fbb31b088797a4e2cd2ef922f637656e`.
The report is `comparison/final/report.json`, SHA-256
`6e72b9d53af3b58126cfe3d0751dd153f2e37f6fb848237ad2d7ab27ed214ab9`.
It validates every native, baseline and after hash and state. It uses empty
masks, threshold 2 and the frozen regions above with no translation, scale,
geometry or phase fitting.

Only equivalent states are compared: Folder Settings against Folder Settings,
and immediate root HOME after deletion against immediate root HOME after
deletion. The baseline generic confirmation remains explicitly unpaired and
has no pixel metrics against native.

| Same state | Native reference | Upper pixels >2 / max / MAE | Lower pixels >2 / max / MAE |
| --- | --- | --- | --- |
| Folder Settings | Folder 1 primary | 54,555 / 220 / 8.697316 | 12,610 / 115 / 1.221667 |
| Folder Settings | Folder 2 repeat | 52,732 / 255 / 6.410170 | 12,610 / 115 / 1.221667 |
| post-delete HOME | Folder 1 primary | 51,269 / 239 / 7.988594 | 14,968 / 255 / 7.017131 |
| post-delete HOME | Folder 2 repeat | 47,950 / 241 / 8.024361 | 15,108 / 255 / 7.046072 |

The upper differences remain dominated by unmatched title population, HUD,
folder/default-banner pose and animation epoch. The post-delete lower body is
also population-mismatched; the browser and native grids contain different
titles. These values do not establish visual acceptance.

The source-bounded lower regions are more specific:

| State / fixed region | Primary pixels >2 / max / MAE | Repeat pixels >2 / max / MAE |
| --- | --- | --- |
| Settings toolbar | 0 / 2 / 0.070741 | 0 / 2 / 0.070741 |
| Settings modal 280x200 | 107 / 89 / 0.210935 | 107 / 89 / 0.210935 |
| Settings header | 0 / 2 / 0.119048 | 0 / 2 / 0.119048 |
| Settings Rename | 11 / 89 / 0.260351 | 11 / 89 / 0.260351 |
| Settings Delete | 0 / 2 / 0.225734 | 0 / 2 / 0.225734 |
| Settings Cancel | 96 / 8 / 0.135027 | 96 / 8 / 0.135027 |
| post-delete toolbar | 0 / 2 / 0.179810 | 0 / 2 / 0.179810 |
| post-delete root body | 14,169 / 255 / 9.380996 | 14,309 / 255 / 9.420460 |
| post-delete Create Folder footer | 799 / 66 / 0.898090 | 799 / 66 / 0.898090 |
| post-delete selection ROI | 364 / 27 / 0.579332 | 504 / 47 / 1.341564 |

The two native Folder Settings lower frames are byte-identical. The two native
post-delete lower frames differ by 452 pixels, all inside the fixed selection
ROI; toolbar and footer are byte-identical. This establishes native cursor
phase variation in the post-delete repeats without fitting the browser to
either phase.

The baseline and production-after Folder Settings lower PNGs are byte-identical.
Their upper PNGs differ in 7,201 pixels above delta 2, maximum 13 and MAE
0.696899 because the folder/HUD epochs are unmatched. The behavioral change is
therefore isolated from the already-delivered lower panel presentation.

The inspected five-column sheets use rows Folder Settings/post-delete and
columns primary native, production-after, primary heatmap, repeat native and
repeat heatmap:

- `comparison/final/delete-same-state-upper.png`, SHA-256
  `0f839f90899cde1dafba336a52f2a6e2e32b8a5419ffa98828b0519d066caa27`
- `comparison/final/delete-same-state-lower.png`, SHA-256
  `0c1c14c5af12c05087bce384e8e99f02a0d829b56fc6a044996333430af55f5b`

## Supporting regression evidence

The independent stock regression report has SHA-256
`146fac36e390fa06144b1249a24f69d99df8591c562bdb1586b1b6e033a23eb5`.
All five stock lower captures, both Settings upper captures and both Usage
upper captures are byte-exact before/after. Health main upper differs by 689
pixels above delta 2, maximum 14, with input and epoch explicitly unmatched.

The integrated suite reports 1,801 tests passed, zero failed, 23 skipped and
one TODO; typecheck and build pass. Baseline comparison commit `04beba19` was
integrated as coordinator commit `c34c3926` before this final comparison.

## Acceptance boundary

The empty-folder semantic discrepancy is resolved in production: both native
repeats and every tested browser route delete directly with no confirmation.
This does not prove exact input cadence, native epoch, motion, audio, a
populated-folder path or whole-scenario visual fidelity. Because the same-state
raw images retain population/phase residuals, the whole scenario remains
fail/unverified rather than pass.
