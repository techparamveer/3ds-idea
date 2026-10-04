# HOME Settings yaw re-search after wallpaper/cursor freeze — 4 October 2026

HOME-lane diagnostic only. No runtime change. No Azahar. Production preview
`http://127.0.0.1:3021` stayed on integrated `0e06867f`; the dedicated muted
Chrome on CDP `127.0.0.1:9320` was reused and not closed. IndexedDB
preferences were restored to the pre-search 6-row Camera slot.

These are frozen diagnostic stills against native
`_26.09.26_04.14.35.203.png`. They do not establish a live clock, input
prefix, motion or 1:1 acceptance.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-settings-yaw-research-20261004/`.

## Why this search

Two reviews noted that Cursor's yaw310 / COMMON309 / Loop338 / cursor37 fit
(upper 2,900: wrench 792, `mt_pict` 1,298, title 810; lower 12,544) labelled
the remainder a source gap
([`mt_pict`](home-mtpict-source-gap-2026-10-04.md),
[skeletal](home-settings-banner-skeletal-2026-10-04.md),
[wrench](home-settings-wrench-residual-2026-10-04.md);
title-glyph notes live on unintegrated `codex/home-title-glyph-20261004`).
The yaw search that picked 310 ran while wallpaper was still walking
([yaw search](home-settings-banner-yaw-search-2026-10-04.md)). Yaw was never
re-searched after Loop and cursor were frozen.

The same native still already had an independent yaw304 / COMMON303
diagnostic at **222 upper** (32 colon, 3 wrench, 187 icons, 0 title)
([icon residual audit](home-settings-icon-residual-audit-2026-09-26.md#visible-yaw304--common303-result-222-upper-pixels)).

## Method

- Native still SHA-256 `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`.
- One-row Settings HOME, `lcdDate=2026-09-26T03:14:35.203Z` (04:14 local),
  WalkCoin elapsed 1617 ms. HUD sampling is live-default; colon now matches.
- Frozen `captureScreensAt(1617, date, yaw, undefined, COMMON, {homeWallpaperFrame:338, homeCursorLoopFrame:37})`.
  Every pose recorded `forcedFrames.homeWallpaperMaterialFrame=338` and
  `homeCursorLoopFrame=37`.
- Grid: yaw 300..314 × COMMON `{yaw−1, yaw, yaw+1}`, plus extra COMMON 302 at
  the winning yaw because the winner sat on the −1 edge.
- Empty mask, threshold any RGB channel >2/255, MAE = mean absolute channel
  error. Official `scripts/native-compare/compare.mjs` +
  `scripts/native-compare/empty-mask.json` (SHA-256 `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`).
- Upper regions from the [body localization](home-settings-body-localization-2026-09-26.md):
  HUD `[0,0,400,28]`, wrench `[140,32,110,101]`, icons `[60,133,280,43]`,
  title `[80,176,245,36]`, footer `[0,212,400,28]`, rest = complement.
- Every pose PNG is SHA-tracked under `R/poses/`.

Wallpaper remainder stayed 0 over 2 (max 2) at every pose, so Loop 338 was
not re-fit.

## Best pose

**yaw 304 / COMMON 303 / Loop 338 / cursor 37.**
`yawRadians` −3.183480739593506, `clockRelationship:independent-diagnostic`.
Official empty-mask compare: **190 / 22,775** pixels over 2, upper MAE
0.10459, upper max 54.

This **reproduces and beats 222**. The banner leftover is the same 3 wrench +
187 icon pixels as the 26 September pair. The missing 32 are the colon, now
inside threshold (HUD 0 over 2, max 2). 222 − 32 = 190.

| Region | Rectangle | Over 2 | MAE | Max |
| --- | --- | ---: | ---: | ---: |
| Whole upper | `[0,0,400,240]` | **190** | 0.105 | 54 |
| HUD | `[0,0,400,28]` | 0 | 0.102 | 2 |
| Wrench | `[140,32,110,101]` | **3** | 0.090 | 54 |
| Icons | `[60,133,280,43]` | **187** | 0.196 | 8 |
| Green cards | `[60,133,40,43]` | 105 | 0.410 | 8 |
| Blue globe | `[120,133,40,43]` | 1 | 0.223 | 3 |
| Orange NNID | `[180,133,40,43]` | 0 | 0.119 | 2 |
| Pink figure | `[240,133,40,43]` | 0 | 0.119 | 2 |
| Yellow notes | `[300,133,40,43]` | 81 | 0.302 | 7 |
| Title | `[80,176,245,36]` | **0** | 0.112 | 2 |
| Upper footer | `[0,212,400,28]` | 0 | 0.125 | 2 |
| Wallpaper rest | complement | **0** | 0.076 | 2 |
| Whole lower | 320×240 | 22,775 | 12.561 | 255 |

Inspected `R/diff-yaw304-common303/upper-contact-sheet.png`: HUD, wrench
angle, title and wallpaper match the still. The heatmap is almost black;
remaining ink is the outer green/yellow plate edges plus three wrench
contour pixels. That is the 26 September edge leftover, not a wrong yaw.

The published yaw310 / COMMON309 still recaptures at **2,870** upper on this
runtime (wrench 778, icons 1,197, title 895). Same class as the 2,900
source-gap pair; it is the wrong pose once wallpaper and cursor are frozen.

Do not adopt yaw−1 or COMMON−1 as a live clock. Submitted visible poses
remain unobserved.

## Frozen yaw × COMMON table

Lower is **22,775 at every pose**. Banner yaw does not own the lower LCD.

| yaw | COMMON | off | upper | MAE | HUD | wrench | icons | title | rest | lower |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 300 | 299 | −1 | 11869 | 6.488 | 0 | 1313 | 5242 | 5282 | 0 | 22775 |
| 300 | 300 | 0 | 2545 | 0.489 | 0 | 691 | 1851 | 3 | 0 | 22775 |
| 300 | 301 | +1 | 3106 | 0.760 | 0 | 691 | 2415 | 0 | 0 | 22775 |
| 301 | 300 | −1 | 607 | 0.180 | 0 | 404 | 200 | 3 | 0 | 22775 |
| 301 | 301 | 0 | 2242 | 0.472 | 0 | 398 | 1844 | 0 | 0 | 22775 |
| 301 | 302 | +1 | 2810 | 0.747 | 0 | 397 | 2413 | 0 | 0 | 22775 |
| 302 | 301 | −1 | 343 | 0.155 | 0 | 174 | 169 | 0 | 0 | 22775 |
| 302 | 302 | 0 | 2015 | 0.454 | 0 | 174 | 1841 | 0 | 0 | 22775 |
| 302 | 303 | +1 | 2587 | 0.728 | 0 | 174 | 2413 | 0 | 0 | 22775 |
| 303 | 302 | −1 | 244 | 0.121 | 0 | 54 | 190 | 0 | 0 | 22775 |
| 303 | 303 | 0 | 1891 | 0.417 | 0 | 54 | 1837 | 0 | 0 | 22775 |
| 303 | 304 | +1 | 2477 | 0.696 | 0 | 57 | 2420 | 0 | 0 | 22775 |
| 304 | 302 | −2 | 1941 | 0.415 | 0 | 4 | 1937 | 0 | 0 | 22775 |
| **304** | **303** | **−1** | **190** | **0.105** | **0** | **3** | **187** | **0** | **0** | 22775 |
| 304 | 304 | 0 | 1852 | 0.407 | 0 | 4 | 1848 | 0 | 0 | 22775 |
| 304 | 305 | +1 | 2468 | 0.691 | 0 | 10 | 2405 | 53 | 0 | 22775 |
| 305 | 304 | −1 | 230 | 0.128 | 0 | 59 | 171 | 0 | 0 | 22775 |
| 305 | 305 | 0 | 1959 | 0.433 | 0 | 61 | 1845 | 53 | 0 | 22775 |
| 305 | 306 | +1 | 2835 | 0.725 | 0 | 67 | 2418 | 350 | 0 | 22775 |
| 306 | 305 | −1 | 567 | 0.160 | 0 | 173 | 341 | 53 | 0 | 22775 |
| 306 | 306 | 0 | 2393 | 0.474 | 0 | 172 | 1871 | 350 | 0 | 22775 |
| 306 | 307 | +1 | 3158 | 0.770 | 0 | 174 | 2417 | 567 | 0 | 22775 |
| 307 | 306 | −1 | 1298 | 0.202 | 0 | 370 | 578 | 350 | 0 | 22775 |
| 307 | 307 | 0 | 2800 | 0.507 | 0 | 364 | 1869 | 567 | 0 | 22775 |
| 307 | 308 | +1 | 3524 | 0.806 | 0 | 363 | 2442 | 719 | 0 | 22775 |
| 308 | 307 | −1 | 2035 | 0.243 | 0 | 604 | 864 | 567 | 0 | 22775 |
| 308 | 308 | 0 | 3192 | 0.542 | 0 | 592 | 1881 | 719 | 0 | 22775 |
| 308 | 309 | +1 | 3904 | 0.847 | 0 | 591 | 2418 | 895 | 0 | 22775 |
| 309 | 308 | −1 | 2493 | 0.293 | 0 | 723 | 1051 | 719 | 0 | 22775 |
| 309 | 309 | 0 | 3530 | 0.591 | 0 | 709 | 1926 | 895 | 0 | 22775 |
| 309 | 310 | +1 | 4327 | 0.894 | 0 | 709 | 2491 | 1127 | 0 | 22775 |
| 310 | 309 | −1 | 2870 | 0.355 | 0 | 778 | 1197 | 895 | 0 | 22775 |
| 310 | 310 | 0 | 3941 | 0.646 | 0 | 758 | 2056 | 1127 | 0 | 22775 |
| 310 | 311 | +1 | 4668 | 0.956 | 0 | 757 | 2566 | 1345 | 0 | 22775 |
| 311 | 310 | −1 | 3321 | 0.418 | 0 | 800 | 1394 | 1127 | 0 | 22775 |
| 311 | 311 | 0 | 4290 | 0.709 | 0 | 793 | 2152 | 1345 | 0 | 22775 |
| 311 | 312 | +1 | 4994 | 1.026 | 0 | 795 | 2673 | 1526 | 0 | 22775 |
| 312 | 311 | −1 | 3674 | 0.497 | 0 | 832 | 1497 | 1345 | 0 | 22775 |
| 312 | 312 | 0 | 4510 | 0.780 | 0 | 819 | 2165 | 1526 | 0 | 22775 |
| 312 | 313 | +1 | 5187 | 1.099 | 0 | 832 | 2707 | 1648 | 0 | 22775 |
| 313 | 312 | −1 | 3969 | 0.588 | 0 | 859 | 1584 | 1526 | 0 | 22775 |
| 313 | 313 | 0 | 4780 | 0.864 | 0 | 854 | 2278 | 1648 | 0 | 22775 |
| 313 | 314 | +1 | 5391 | 1.181 | 0 | 861 | 2764 | 1766 | 0 | 22775 |
| 314 | 313 | −1 | 4222 | 0.685 | 0 | 891 | 1683 | 1648 | 0 | 22775 |
| 314 | 314 | 0 | 5002 | 0.956 | 0 | 881 | 2355 | 1766 | 0 | 22775 |
| 314 | 315 | +1 | 5634 | 1.272 | 0 | 893 | 2851 | 1890 | 0 | 22775 |

COMMON = yaw−1 wins every yaw in 301..314. Coupled COMMON = yaw is 1,600–2,000
worse. Title is 0 from COMMON 301 through 304; the 810/895 title counts at
COMMON 309 are `p_title` bob, not a missing glyph atlas.

## Lower residual

Yaw does not move the lower LCD. Two stills must be kept separate.

### Published 12,544 (HUD-profile cursor-37 pair)

`home-hud-profile-20261004/cursor-search/lower.png` SHA-256
`0227d5fd6ebf949e8f9a1734816ea433edccbea0f2b2d2d9dc7d0092c821f486`.
Empty-mask **12,544**, MAE 6.966. Inspected
`home-hud-profile-20261004/diff-cursor-37/lower-contact-sheet.png`.

Native 1-row row is Health | StreetPass | Settings. That browser still is
Sound | Health | Settings (Settings stays the right tile). Ownership:

| Region | Rectangle | Over 2 | MAE | Max | Owner |
| --- | --- | ---: | ---: | ---: | --- |
| Left tile | `[32,118,80,82]` | 3,179 | 29.062 | 255 | Health vs Sound identity |
| Mid tile | `[120,118,80,82]` | 3,185 | 31.213 | 247 | StreetPass vs Health identity |
| Right tile | `[208,118,80,82]` | 1,562 | 1.165 | 22 | Settings face + cursor |
| Cursor ring | `[200,110,96,96]` | 2,593 | 1.835 | 36 | cursor-37 halo (overlaps right tile) |
| Left arrow | `[0,126,24,76]` | 841 | 23.379 | 245 | page arrow / neighbour peek |
| Right arrow | `[296,140,24,44]` | 1,020 | 45.789 | 215 | page arrow |
| Balloon | `[40,40,240,72]` | 441 | 0.413 | 11 | string / shadow |
| Toolbar | `[0,0,320,33]` | 164 | 0.725 | 248 | applet strip |
| Footer | `[0,204,320,36]` | 31 | 0.158 | 4 | Manual / Open edges |

Largest 4-neighbour components: 4,064 Settings+cursor+right, 2,300 left-tile
face, 2,294 mid-tile face, two 909 chrome rings, 561+391 left-arrow. The
12,544 is **portfolio neighbour identity plus cursor/arrow chrome**, not
banner yaw, not `mt_pict`, not title glyphs.

### This Chrome still: 22,775

The dedicated profile's 1-row window starts at Settings, so the visible row
is Settings | Camera | Contact. Inspected
`R/diff-yaw304-common303/lower-contact-sheet.png`. That is a viewport +
layout mismatch on top of the neighbour-identity gap, so the count is higher
(left 4,479, mid 3,110, right 4,440, balloon 2,037, toolbar 164, footer
164). It is not a worse banner pose.

## Corrections

Withdraw the yaw310 / COMMON309 **source-gap / residual-ownership** claims
that treated wrench 792, `mt_pict` 1,298 and title 810 as the remaining
unexplained native path. Those counts are **pose error** from searching yaw
while wallpaper walked, then locking yaw 310 before freezing Loop/cursor.

| Claim | Status after this search |
| --- | --- |
| Title 810 is a glyph / sampler source gap | **Withdrawn.** Title is 0 over 2 (max 2) at COMMON 303. |
| Wrench 792 is contour / `mt_spanner` source gap | **Qualified.** 792 is the wrong yaw. Three wrench pixels remain at the correct pose. |
| `mt_pict` 1,298 (all five tiles) is an unlit COMMON2 source gap | **Qualified.** Inner orange/pink are 0; globe is 1. Only the outer green 105 + yellow 81 remain, matching the 26 September edge leftover. |
| Lower 12,544 is "portfolio neighbors" | **Kept, and made specific.** Sound/Health vs Health/StreetPass, plus cursor/arrows. Not banner yaw. |
| yaw310 / COMMON309 is the still fit to reuse | **Withdrawn** for this native still. Reuse yaw304 / COMMON303 / Loop338 / cursor37. |

The unintegrated `codex/home-title-glyph-20261004` slice is not justified by
this still. The 26 September outer-icon edge gap remains the only upper
source question at the correct pose.

## Artifact paths and SHA-256

| Artifact | SHA-256 |
| --- | --- |
| Native still | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| Best upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| Best lower | `7e64a1243ab09fe69cf719c66a25b96bbc94154505ae1f9f45508b1a556acb45` |
| Best upper contact sheet | `90719ec9631e42038506e3ad0e09afb122e6dcdf7d7b1235762c888412f88599` |
| Best lower contact sheet | `fc4bb6cf0a77af55c02194f380b5628cc5b6a2ea087fa852aa4a05ab27a16f39` |
| Best upper heatmap | `783722caae66deba79adad03a9096a00d831ec2aa2e7a28841963e8b997b61ff` |
| Best official report | `c015cf58115dbbe4fc2dd311bc78f85f731f4de8ffc3c4c50112f37c7a8e52f2` |
| This-run yaw310/COMMON309 upper | `e974a4b2ead7d18e9c10911a5d76afb9e4e10d9aab584654fb26e31c1c4840c5` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Pose scores: `R/poses/yawNNN-commonNNN/{upper,lower}.png` and `score.json`.
Grid: `R/table.json`, `R/report.json`. Lower analysis: `R/lower-breakdown.json`.

## Recommended next runtime slice

One HOME-lane diagnostic default for this named still: capture at **yaw 304 /
COMMON 303 / Loop 338 / cursor 37**, empty mask. Do not change live
`INITIAL_YAW` or COMMON clocks.

Next visible upper work is the remaining **190**: outer green/yellow
`mt_pict`/`mt_btn` edges (105+81) and three `mt_spanner` pixels. That is the
[26 September edge gap](home-settings-banner-edge-source-gap-2026-09-26.md)
at the correct pose, not a new texture key.

Next lower work is 1-row viewport centering and neighbour identities
(Health/StreetPass vs portfolio Sound/Health or Settings/Camera/Contact),
not another yaw search.

Whole-scenario 1:1 still fails. Matrix unchanged.
