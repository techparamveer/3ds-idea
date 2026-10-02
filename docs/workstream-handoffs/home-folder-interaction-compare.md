# HOME folder interaction native comparison

Date: 2 October 2026

Branch: `codex/home-folder-interaction-compare-20261002`

Base: `5fd6a99c9a3feb551cfae8d88bb019a3a69b74eb`

## Scope and method

This is a bounded comparison-only slice for HOME folder creation, opening,
closing, Folder Settings and cancellation. It does not change product source,
the private scenario matrix or shared progress documents. The coordinator alone
captured native and browser states. The comparison uses the supplied raw images
without translation, scale, geometry fitting, phase fitting or masks. A channel
delta threshold of 2 is reported as a static diagnostic tier, not scenario
acceptance.

The native capture is Azahar's own 400x480 RGB PNG. The upper LCD is cropped at
`(0,0,400,240)` and the lower LCD at `(40,240,320,240)`. Browser captures are
the raw 400x240 upper and 320x240 lower targets. The native and browser title
populations differ. Native's folder is inferred to be global slot 28; the
browser's definitive state is global slot 34 because its scroll and population
differ. Both selected source centers are exactly `(146,166)`. This difference
is retained explicitly and is not treated as an acceptance fit.

Exact input and animation epoch are not matched. Browser cancellation used
Escape; native cancellation used a touch near `(160,205)`. Every supplied
browser capture records `inputMatched:false` and `nativeEpochMatched:false`.
Native quit ended with status 139 after capture, both native PIDs were absent,
and the private profile's silent configuration was unchanged. A separate
accidental launch of the default Azahar application changed its configuration
mtime; it supplied no comparison capture and is not claimed untouched.

## Inputs

Native source directory:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-close-clean-20261002/screenshots`

Browser baseline directory:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-interaction-20261002/browser-aligned`

Browser runtime was `b8773a90`; `result.json` has SHA-256
`eccc48c4fa4f598056441c1bdf15ca22756ddb2209f49c1f25ba936517629aa5`.
The definitive states are:

| Pair | Browser state | Rows | Selected slot | Visible slot | Selected center |
| --- | --- | ---: | ---: | ---: | --- |
| empty | `home` | 6 | 34 | 34 | `(146,166)` |
| created | `home` | 6 | 34 | 34 | `(146,166)` |
| opened | `folder` | 1 | 0 | 0 | `(76,137)` |
| closed | `home` | 6 | 34 | 34 | `(146,166)` |
| settings | `folder-settings` | 6 | 34 | n/a | `(146,166)` retained |
| cancelled | `home` | 6 | 34 | 34 | `(146,166)` |

The private native manifest is
`comparison/native-manifest.json`, SHA-256
`b4c0c70dc324bea0416763a567f4a1f0f6b4931054aaa99efdcef28307acb6e2`.
It records these native files:

| Pair | Native filename | SHA-256 |
| --- | --- | --- |
| empty | `_02.10.26_16.33.36.263.png` | `742d5c991197182408612bce2722859cb33986ed507a1763bb5ac8636badb6de` |
| created | `_02.10.26_16.34.01.899.png` | `ceae5871401a4276d820d9088c4713dd0496b1dbac9a985942e2637a1f54fde2` |
| opened | `_02.10.26_16.34.39.632.png` | `74243f872bf302b63f580c2c899a4d747a1687d3489d35d9901a1296a84be241` |
| closed | `_02.10.26_16.35.18.515.png` | `7082dc11d5aee3f415b3c1b8fbf67418d62da092b592d6b8d07ead793a4afd6f` |
| settings | `_02.10.26_16.35.34.415.png` | `055e408e5a079095db664963549ef218b3f77e9002ab2ce76433c250d03f2725` |
| cancelled | `_02.10.26_16.36.14.872.png` | `a284fa2933a5e537c9ad89d52d8461b73c9dcae2681432b11aa832a71b404a15` |

`_02.10.26_16.33.47.71.png`
(`7750615a5402e3f6b0cf8c66a167a4ab93854f98d583b734dc58f0775852c372`)
is a created transition before the upper banner settled and is deliberately
unpaired. `_02.10.26_16.34.18.098.png`
(`479e7f8e6c9a5b714b04ec4f8bd1f0189e9f991b1a8b9b6eeb25f083a568810a`)
is an extra selected-folder still with a different visible cursor/HUD and is
also unpaired.

## Baseline raw results

The private comparator is `comparison/compare.mjs`, SHA-256
`44711e6ce445cd897f3425c2c7408d322c685ea960e6c92422d52e7e0daf1784`.
The baseline report is `comparison/baseline/report.json`, SHA-256
`5843ad4199b992a869b7f345cc796c8df1ea3373c488a6c9c459df12421705fa`.
Its masks are empty.

| Pair | Upper pixels >2 | Upper max | Upper MAE | Lower pixels >2 | Lower max | Lower MAE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| empty | 57,551 | 255 | 8.036729 | 15,208 | 255 | 7.179779 |
| created | 50,380 | 255 | 9.305403 | 15,307 | 255 | 7.150430 |
| opened | 45,528 | 255 | 8.157003 | 8,618 | 189 | 1.472487 |
| closed | 43,083 | 215 | 8.494729 | 15,285 | 255 | 7.117747 |
| settings | 63,787 | 255 | 14.350997 | 76,727 | 246 | 42.255334 |
| cancelled | 45,447 | 255 | 9.229576 | 15,274 | 255 | 7.070694 |

The baseline sheets were opened at original resolution:

- `comparison/baseline/folder-workflow-upper-sheet.png`, SHA-256
  `1473f35b806c66791bb3e1dce021ba04b373b5cef6fffaa3a6dc9e0564a0f1fe`
- `comparison/baseline/folder-workflow-lower-sheet.png`, SHA-256
  `e6916971fd507f5fb251cfd8816b065c68fb47077ec0c76e0f20d4dfd3dafb3c`

The non-modal lower toolbar has zero pixels above the threshold and maximum
delta 2 for empty, created, opened, closed and cancelled. This is static pixel
tier evidence for that bounded region only. It is not scenario acceptance.

The root body is not a valid geometry-acceptance comparison because the title
population and scroll contents differ. It has 14,409 to 14,512 pixels above the
threshold in the six-row baseline pairs. The root footer retains 795 to 799
pixels above the threshold. The root selection region also remains different:
604 pixels above threshold for empty, 707 for created, 685 for closed and 674
for cancelled.

The opened empty-folder lower screen is comparatively close but does not pass:
8,618 pixels exceed the threshold over the full lower LCD. The source-derived
opened-body region has 4,712 pixels above threshold, the Back hit region has
143 (maximum 188), and the selected empty plate/cursor region has 2,300. Native
and browser both omit the footer in this state; the nominal footer strip still
contains 2,135 residual pixels from background and shadow differences.

## Folder Settings source gap

The baseline Folder Settings lower screen differs across nearly the entire
frame: 76,727 pixels exceed the threshold, maximum delta is 246 and MAE is
42.255334. The diagnostic native-modal region has 55,945 of 56,000 pixels above
threshold (MAE 41.191685); the current browser-panel region has 46,411 of
46,464 pixels above threshold (MAE 33.023201).

Measured raw native boundaries are approximately `x=20..299`, `y=20..219`,
with horizontal boundaries at `y=48`, `y=120`, `y=193` and `y=220`. These
correspond to the title, Rename, Delete and Cancel sections. The baseline
browser contract instead draws an outer panel at `x=28`, `y=35`, width 264,
height 176; inset rounded Rename and Delete buttons at `x=34`, widths 252 and
vertical spans `y=68..124` and `y=129..185`; and a Cancel text baseline near
`y=200`.

Native uses full-width source sections and a dedicated Cancel band. It also
suppresses the underlying Settings/Open footer. The baseline browser shows a
reconstructed panel and leaves that footer visible beneath its scrim. The
browser scrim also changes the global toolbar/background. On the upper LCD,
native retains the selected-folder banner and name while Folder Settings is
open, but the baseline browser drops that folder context and shows the generic
HOME upper presentation. This modal is an active source gap, not an adaptation
or acceptance pass.

## Status

The source worker replaced only the Folder Settings modal with decoded native
resources, including suppression of the lower footer and preservation of the
upper selected-folder context. The production-after runtime is `79e77f58`,
integrated as `238319b6`. Full integration checks report 1,800 tests passed,
zero failed, 23 skipped and one TODO; typecheck and build pass.

The complete production-after `result.json` has SHA-256
`e6766b5981145e87e582e7339ce618f1fde256ec9aa07e685f1e359e4dedb5e0`.
The settings upper and lower PNGs have SHA-256
`a23c7b926f8473b98a316e49aa7ca778cfa52c340643108317771adb0c040564`
and `9859a03ed60111cb9550722112071835b8f6c409a02aff5e45084bdf0c131613`.
The browser script exited zero with no page errors. Desktop and mobile Folder
Settings were inspected, and browser touch Cancel, Escape and physical B all
returned to HOME. Those browser routes are tested but are not matched native
input or native-epoch evidence.

## Production-after raw results

The fixed-coordinate after comparator is `comparison/compare-after.mjs`,
SHA-256
`9c0addd8efb4a1db0f5a92fe7dfdf108f8253972072cd75db074d5b20d4ac12f`.
The report is `comparison/after/report.json`, SHA-256
`ed993a37d7b13f3e261788a3c405a21229c0b679f05ff39505cf305109e12076`.
It rehashes the same native manifest and baseline inputs, asserts the exact
browser states and evidence flags, and uses the frozen baseline geometry with
empty masks. No shift, scale or fit was introduced.

| Pair | After upper pixels >2 | Max | MAE | After lower pixels >2 | Max | MAE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| created | 52,806 | 255 | 9.435319 | 15,213 | 255 | 7.056259 |
| opened | 36,260 | 255 | 7.605059 | 8,206 | 189 | 1.477539 |
| closed | 48,336 | 215 | 8.875656 | 15,219 | 255 | 7.054961 |
| settings | 51,800 | 255 | 7.748719 | 12,610 | 115 | 1.221667 |
| cancelled | 17,962 | 255 | 5.001715 | 15,191 | 255 | 7.043034 |

The settings five-column sheets were opened at original resolution. Their
columns are native, baseline, native-baseline heatmap, production-after and
native-after heatmap:

- `comparison/after/settings-native-before-after-upper.png`, SHA-256
  `7379bdefc58b924f3c204f8a1fb8e666e4fd71eff52bde81768d7882463ca8e5`
- `comparison/after/settings-native-before-after-lower.png`, SHA-256
  `9dc3ee8dd13e14ff89ec88e4e58a5f3833961223d626d8e90c21391161c1d2c6`

### Folder Settings improvement and residuals

The fixed 280x200 modal region improves from 55,945 to 107 pixels above delta
2; MAE falls from 41.191685 to 0.210935 and maximum delta from 246 to 89.
The residual is fully isolated:

| Fixed native region | Baseline pixels >2 | After pixels >2 | After max | After MAE | After difference bounds |
| --- | ---: | ---: | ---: | ---: | --- |
| header, `x20..299/y20..48` | 8,120 | 0 | 2 | 0.119048 | none |
| Rename, `x20..299/y49..120` | 20,126 | 11 | 89 | 0.260351 | `x157/y82..92` |
| Delete, `x20..299/y121..193` | 20,421 | 0 | 2 | 0.225734 | none |
| Cancel, `x20..299/y194..219` | 7,278 | 96 | 8 | 0.135027 | `x20..299/y212..219` |

The Rename residual is one pixel wide: exactly x157 for y82 through y92. The
Cancel residual is 96 low-amplitude pixels confined to the two symmetric
rounded bottom corners: 6, 6, 8, 10, 12, 14, 18 and 22 pixels on rows y212
through y219. Header and Delete are within the static pixel tier. These are
frozen raw coordinates, not a fitted interpretation.

Across the full settings lower LCD, 12,503 of the 12,610 residual pixels lie
outside the modal. The lower toolbar and the former root-selection region each
have zero pixels above delta 2, maximum delta 2. The remaining outside-modal
difference includes the unmatched root title population/background. The old
underlying Settings/Open footer is no longer visible; the fixed footer strip
still overlaps the native Cancel frame and population-dependent background, so
its 6,892 residual pixels are not evidence of footer leakage.

The upper settings comparison improves from 63,787 to 51,800 pixels above
delta 2 and now retains the folder banner/name rather than falling back to the
generic HOME presentation. Its title population, folder-banner pose/epoch and
HUD remain unmatched, so this is source-backed context restoration rather than
an upper-screen pass.

### Unchanged workflow control

The production-after created, opened, closed and Escape-cancelled lower images
differ from their baseline captures only inside the already-authored cursor
ROIs. Direct baseline-to-after counts are 604, 2,140, 598 and 415 pixels above
delta 2 respectively; the corresponding raw difference bounds are
`x128/y148/36x36`, `x32/y94/88x88`, `x128/y148/36x36` and
`x129/y149/34x34`. Every pixel outside the fixed full cursor ROI is byte-exact
in all four controls: zero differing pixels, maximum delta zero and MAE zero.
These are unmatched cursor phases, not a non-modal renderer change.

The independent stock regression report
`home-folder-interaction-20261002/regression-results-after.json`, SHA-256
`631fe2cd7922f7195d586f03f0876b17831b83c38e4ce504a1ad52145f37ad84`,
shows all five stock lower captures and both Settings upper captures byte-exact
before/after. The three Health upper captures are motion-epoch unmatched and
are not regression conclusions.

The source worker is triaging only the 107 fixed modal residual pixels. No
conclusion about exact input, motion, audio or whole-scenario acceptance may be
drawn from this checkpoint; status remains unmatched whole-scenario fail.
