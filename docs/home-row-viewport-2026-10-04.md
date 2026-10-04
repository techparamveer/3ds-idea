# HOME Settings 1-row viewport — 4 October 2026

HOME-lane diagnostic. No runtime change. No Azahar. Production preview
`http://127.0.0.1:3021` stayed on integrated `0e06867f`; the dedicated muted
Chrome on CDP `127.0.0.1:9320` was reused and not closed. IndexedDB
preferences were restored to the pre-slice 6-row Camera slot (byte-identical
start/restored records).

These are frozen diagnostic stills against native
`_26.09.26_04.14.35.203.png`. They do not establish a live clock, the unrecorded
Azahar prefix, motion or 1:1 acceptance.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-row-viewport-20261004/`.

## Why this slice

The [yaw 304 / COMMON 303 freeze](home-settings-yaw-research-2026-10-04.md)
reproduced **190** upper pixels, but the dedicated Chrome still painted
Settings on the **left** (Settings | Camera | Contact) and scored **22,775**
lower. An earlier HUD-profile still had Settings on the **right**
(Sound | Health | Settings) at **12,544**. Native shows Settings on the
right with two neighbours to its left and partial tiles in both page
arrows.

That is a route / viewport question, not another banner yaw search.

## Native still and input route

Native SHA-256
`4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`.

Searched `docs/` for `04.14.35` and
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926` for
capture plans, CTM files and notes. No CTM or button log exists for this
PNG. Matrix v78 `home-settings-live-restored-ba0b8d5-20260926` records
the host burst and says the **exact selection prefix is unrecorded**.

The still itself is enough to reconstruct the settled 1-row geometry:

- Density 0: one row, three visible columns, centres 76 / 160 / 244, pitch 84.
- Settings is the selected right-hand column (cursor around x244).
- Both page arrows are visible, so the window is not at origin or endpoint.
- Left / mid faces are **Activity Log** (bar graph) and **Download Play**
  (two handhelds), not Health / StreetPass. The 26 September matrix note
  already named those excluded titles. The yaw-research Health | StreetPass
  labels are a misread of the same icons.

Standard EUR HOME order places Activity Log, Download Play and System
Settings as consecutive late-stock slots. With Settings at slot 9 the
visible window is slots 7 | 8 | 9. That is the same slot the browser
`initialAppLayout()` already reserves for Settings so this still can sit
on the right.

Reconstructable native route, not an observed Azahar log:

1. One-row HOME.
2. From a slot to the left of Settings, press Right until Settings is
   selected.
3. Each right-edge crossing scrolls the window by exactly one column, so
   the new selection stays on the right visible column.

A 6-row Camera selection that is then zoomed to one row and stepped Left
onto Settings is a **different** route: Camera sits on the left of the
new window, one Left parks Settings on the left. That is the yaw-search
Chrome still.

## 1-row scroll rule

Source-proved in `home-scroll-consumer.ts` /
[scroll consumer](home-scroll-consumer-runtime.md) /
[navigation](home-navigation-runtime.md). Density 0 metrics come from
`homeGridMetrics`: 1 row, 3 columns, `baseX` 76, `pitchX` 84, box 72.

Horizontal event 4/6 (`mask 0x10` / `0x20`) moves by one row-count
column. Interior moves do not enter mode3. A viewport crossing writes the
new selection and then `enterHomeMode3(..., currentLeftSlot ± rows)`.
There is no extra edge margin and no centering on a directional step.
Touch off-screen uses the same edge-align rule (`column` or
`column - columns + 1`). Page arrows jump a full page (`rows * columns`)
on mode2/16. Density change keeps the selected slot and chooses the
nearest-X left slot; it does not walk Right from origin.

Settled 1-row Right walk from slot 0 / left 0 therefore ends at
selected 9 / left 7 / centres 76, 160, 244. A Left from selected 10 /
left 10 ends at selected 9 / left 9. Both cases are now pinned in
`tests/home-scroll-consumer.test.mjs`. The 1,980-direction oracle already
covered the crossing arithmetic; these two tests name the Settings still.

## Browser capture

Exclusive muted CDP `127.0.0.1:9320`, preview `0e06867f`,
`lcdDate=2026-09-26T03:14:35.203Z`, WalkCoin 1617 ms, frozen
`captureScreensAt(..., 304, undefined, 303, {homeWallpaperFrame:338,
homeCursorLoopFrame:37})`. Empty mask SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Official `scripts/native-compare/compare.mjs`. Threshold any RGB channel
>2/255.

| Route | Input | Cursor | Visible row |
| --- | --- | --- | --- |
| Before (yaw-search class) | 6-row Camera slot 10, zoom to 1-row, Left/Right to Settings | x76, slot 9 | Settings \| Camera \| Contact |
| After (reconstructed native walk) | 1-row origin slot 0 / left 0, ArrowRight to Settings | x244, slot 9 | Sound \| Health \| Settings |

After matches the native window: Settings on the right, partial tiles in
both arrows. No scroll-rule fix. `initialAppLayout()` already swaps
Sound / Health / Settings into slots 7 / 8 / 9 so the walk can land on
this still; those neighbours remain labelled adaptations.

After upper PNG SHA-256
`2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c`
is byte-identical to the yaw304 / COMMON303 still. Lower changes with
the window, not the banner.

The before-route first frozen capture scored **11,868** upper (title and
`mt_pict` plates). Same freeze arguments were passed; that miss is a
settling diagnostic of the Camera-zoom arrival, not a second yaw. The
matching walk is the pair to reuse.

## Pixel tables

Official empty-mask whole LCDs:

| Pair | Upper | Lower | Upper MAE | Lower MAE |
| --- | ---: | ---: | ---: | ---: |
| Before, Settings left | 11,868 | 21,740 | 6.502 | 12.293 |
| After, Settings right | **190** | **12,000** | 0.105 | 6.930 |
| After, neighbour faces masked | **190** | **5,426** | 0.105 | 2.154 |
| Published HUD cursor-37 (right, older freeze) | 2,900 | 12,544 | — | 6.966 |
| Yaw-search Chrome still (left) | 190 | 22,775 | 0.105 | 12.561 |

After lower ROIs, empty mask:

| Region | Rectangle | Before | After | After MAE | Owner |
| --- | --- | ---: | ---: | ---: | --- |
| Left tile | `[32,118,80,82]` | 4,513 | 3,180 | 29.035 | Activity Log vs Sound |
| Mid tile | `[120,118,80,82]` | 3,110 | 3,186 | 31.185 | Download Play vs Health |
| Right tile | `[208,118,80,82]` | 4,440 | 1,481 | 1.119 | Settings face + cursor 37 |
| Cursor ring | `[200,110,96,96]` | 5,927 | 2,485 | 1.799 | overlaps right tile |
| Left peek / arrow | `[0,118,32,82]` / `[0,126,24,76]` | 1,086 / 839 | 1,090 / 843 | 16.674 / 23.329 | About peek vs native pre-Activity-Log |
| Right peek / arrow | `[288,118,32,82]` / `[296,140,24,44]` | 2,015 / 957 | 2,081 / 1,020 | 25.495 / 45.830 | Camera peek vs native post-Settings |
| Balloon | `[40,40,240,72]` | 2,037 | **0** | 0.292 | max 2 after the matching walk |
| Toolbar | `[0,0,320,33]` | 164 | 164 | 0.725 | applet strip |
| Footer | `[0,204,320,36]` | 164 | 30 | 0.156 | Manual / Open edges |

The neighbour-face mask (`R/adaptation-neighbor-mask.json`, SHA-256
`6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d`)
covers only `[32,118,80,82]` and `[112,118,88,82]`
(`portfolio-content`). Settings, cursor, arrows, balloon, toolbar and
footer stay compared. Masked lower **5,426** (13,776 pixels excluded).
Largest remaining 4-neighbour components: 2,220 right peek, 1,656
Settings+cursor, 561+391+145 left peek/arrow, 162 toolbar HOME icon.

Inspected `R/diff-after-unmasked/lower-contact-sheet.png` and
`R/diff-after-masked/lower-contact-sheet.png`. After the matching walk
the heatmap is the two excluded-title faces plus arrow peeks; Settings
and the balloon sit on the native still. The masked sheet leaves those
peeks and a faint cursor halo. That is neighbour identity and already
known cursor-37 chrome, not a wrong left slot.

StreetPass / Activity Log / Download Play are out of product scope.
Portfolio Sound and in-scope Health occupy those two slots by
`initialAppLayout()`. Do not treat the 3,180 / 3,186 tile-face counts as
unexplained HOME chrome.

## Artifact paths and SHA-256

| Artifact | SHA-256 |
| --- | --- |
| Native still | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| Before upper | `44e99c80057a2833134a9588d741f4ad11983fc4a2c3cea1340192ea1ba50749` |
| Before lower | `412a2447b3c12183f6ed94be4af190c3015bb9afcbb9fd596a8bdabd02b30cc4` |
| After upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| After upper contact sheet | `90719ec9631e42038506e3ad0e09afb122e6dcdf7d7b1235762c888412f88599` |
| After unmasked lower contact sheet | `42f50491add85a26023d5279742cb5e7fd49e2661e2c7c814b8ee2f86fade479` |
| After masked lower contact sheet | `937546fbb85903de9277102c5e5ae7bba26b62ebbf1e90e6e4d7e20612bcde1e` |
| After unmasked report | `9c6f9971740ef56dbf72a97ee1c19fcdd2ea252a0ea50f0c225957967290d6df` |
| After masked report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Script: `R/capture-row-viewport.mjs`. Pair report: `R/report.json`.
Preferences start/restored SHA-256
`86a5908895212fc08d84b24758ac1ecbbc149afa85b580736e3e8203c35c2f3a`.

## Recommended next work

Reuse the matching walk for this still: 1-row origin, Right to Settings,
frozen yaw 304 / COMMON 303 / Loop 338 / cursor 37. Do not change live
`INITIAL_YAW`, COMMON clocks or the directional scroll rule.

Remaining lower work is neighbour identity (excluded titles vs Sound /
Health / Camera peeks) and the 1,481 Settings+cursor pixels, not
viewport math. Remaining upper work is still the 190 outer green/yellow
`mt_pict` edges and three wrench pixels.

Whole-scenario 1:1 still fails. Matrix unchanged.

## Doubts

- The Azahar burst prefix is still unrecorded. Slot 9 is inferred from
  the still plus EUR title order, not from a CTM.
- Keyboard ArrowRight shares the consumer path with D-pad Right; this
  slice did not click `DPAD_right`.
- Native titles after Settings (the right peek) were not re-identified
  from firmware; the browser peek is Camera.
- The before-route 11,868 upper is unexplained capture settling. Do not
  treat it as a second banner pose.
- Cursor-37 halo, toolbar HOME icon and footer edges remain unpaired.
  Exact input cadence, motion and audio remain open.
