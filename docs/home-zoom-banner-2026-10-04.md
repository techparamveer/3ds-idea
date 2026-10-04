# HOME zoom-route banner settle — 4 October 2026

HOME-lane diagnostic. Runtime change is a host-view test only; no banner
clock, yaw or density rule changed. No Azahar. Production preview
`http://127.0.0.1:3021` stayed on integrated `0e06867f`; the dedicated muted
Chrome on CDP `127.0.0.1:9320` was reused and not closed. IndexedDB
preferences were restored to the pre-slice 6-row Camera slot (byte-identical
start/restored records).

These are frozen diagnostic stills against native
`_26.09.26_04.14.35.203.png`. They do not establish a live clock, the
unrecorded Azahar prefix, motion or 1:1 acceptance.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-zoom-banner-20261004/`.

## Why this slice

The [1-row viewport walk](home-row-viewport-2026-10-04.md) scored **190**
upper at frozen yaw 304 / COMMON 303 / Loop 338 / cursor 37. The same freeze
after `6-row Camera (slot 10) → zoom to 1-row → Left onto Settings` scored
**11,868**. Frozen presentation should make the upper independent of route,
so the miss had to be either capture-too-early or a stuck banner host
(previous title, generation, scale/alpha).

## Root cause

**Settling / capture readiness, not a persistent Settings banner bug.**

`getHomeBannerHostView` exposes incoming `selection` and a retained
`primary`. During replacement the incoming id is already `system-settings`
while the painted primary is still Camera (or Health on the Right walk).
A wait that accepts `banner.selection.id === 'system-settings'` fires in
that window. `captureScreensAt` can only freeze Settings when the retained
primary is Settings; live yaw/COMMON still walk, and a live Settings still
near COMMON 300 is the same class as the 11,868 pair.

Once the retained primary is Settings, visible, and scale 1, both routes
are **byte-identical** to the published yaw304 / COMMON303 upper
(`2a2d920e…`) at **190** over 2/255. Live yaw at those captures was 5–221;
the freeze overrode it. Repeat captures at the same delay were identical.
There is no leftover Camera resource, stale generation, or density-change
scale/alpha stuck on the Settings primary.

Camera hide is still in progress at **200 ms** after the last Left (primary
Camera, incoming Settings, scale ≈ 0.80–0.85, Camera yaw ≈ 419–428).
Settings becomes the retained primary at **≈400–500 ms**, already at scale 1
and a fresh yaw ≈ 5–12. The previous worker’s 400 ms + incoming-or-primary
wait can land in either bucket. Replaying that wait after Settings had
reached scale 1 scored 190, not 11,868.

The 11,868 still is Settings at the wrong live pose (full-size wrench /
`mt_pict` / title), not a Camera body and not a mid-fade 0.8 Settings.
Versus the yaw300 / COMMON299 pose it differs by **1,016** upper pixels
(MAE 0.088). Versus the frozen 304/303 still it is the published 11,868
(title + all five plates + wrench). That is an unfrozen / too-early Settings
sample, not a second banner identity.

## Time series after last input

Frozen `captureScreensAt(1617, date, 304, undefined, 303,
{homeWallpaperFrame:338, homeCursorLoopFrame:37})`. Empty mask SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Official `scripts/native-compare/compare.mjs`. Delays are from the last
ArrowLeft (zoom) or ArrowRight (walk).

| Route | Delay | Primary | Incoming | Live yaw / COMMON | Scale | Frozen upper | Upper SHA |
| --- | ---: | --- | --- | ---: | ---: | ---: | --- |
| Zoom | 200 ms | Camera | Settings | 419 / 419 | 0.80 | skipped (not Settings primary) | — |
| Zoom | 500 ms | Settings | Settings | 10 / 10 | 1 | **190** | `2a2d920e…` |
| Zoom | 1 s | Settings | Settings | 40 / 40 | 1 | **190** | `2a2d920e…` |
| Zoom | 2 s | Settings | Settings | 100 / 100 | 1 | **190** | `2a2d920e…` |
| Zoom | 4 s | Settings | Settings | 220 / 220 | 1 | **190** | `2a2d920e…` |
| Walk | 200 ms | Health | Settings | 21 / 20 | 0.95 | skipped | — |
| Walk | 500 ms | Settings | Settings | 12 / 12 | 1 | **190** | `2a2d920e…` |
| Walk | 1–4 s | Settings | Settings | 41–221 | 1 | **190** | `2a2d920e…` |

Walk lower stays the right-hand Settings window (`cd0c87d3…`). Zoom lower
stays the left-hand Settings window (`412a2447…`). Banner freeze does not
own the lower LCD.

Live (unfrozen) probe while Camera was still primary scored **22,344**
upper — Camera hide versus the native Settings still. Live Settings at yaw
26 scored **14,330**. Neither is the frozen 190.

## Region breakdown (settled frozen vs prior 11,868)

Upper ROIs from the [body localization](home-settings-body-localization-2026-09-26.md).

| Region | Rectangle | Zoom/walk ≥500 ms | Prior zoom 11,868 | Yaw304/COMMON303 |
| --- | --- | ---: | ---: | ---: |
| Whole upper | `[0,0,400,240]` | **190** | 11,868 | 190 |
| HUD | `[0,0,400,28]` | 0 | 0 | 0 |
| Wrench | `[140,32,110,101]` | 3 | ~1,300 class | 3 |
| Icons | `[60,133,280,43]` | 187 | ~5,200 class | 187 |
| Title | `[80,176,245,36]` | 0 | ~5,200 class | 0 |
| Wallpaper rest | complement | 0 | 0 | 0 |

Inspected sheets:

- `R/diff-zoom-t500/upper-contact-sheet.png` — heatmap almost black; leftover
  is the known outer green/yellow `mt_pict` edges plus three wrench pixels.
- `R/diff-walk-t500/upper-contact-sheet.png` — same sheet (same upper SHA).
- Prior `home-row-viewport-20261004/diff-before-unmasked/upper-contact-sheet.png`
  — full-size Settings at the wrong pose; red wrench, all five plates, title.

## Capture wait

Do not treat incoming `selection.id` as the painted banner. Wait until:

1. `folderBanner.status === 'active'`
2. `folderBanner.primary.selection.id === 'system-settings'`
3. `primary.motion.visible === true` and `primary.motion.scale === 1`

Backstop: **500 ms** after the last directional input is enough on this
preview for both the Camera-zoom Left and the 1-row Right walk. 200 ms is
not. The host test pins the Camera→Settings incoming-versus-primary window
and the first Settings show frame at scale `0.8`.

Updated artifact scripts:

- `R/capture-zoom-banner.mjs`
- `home-row-viewport-20261004/capture-row-viewport.mjs`
- `home-settings-yaw-research-20261004/search-yaw.mjs`

## Artifact paths and SHA-256

| Artifact | SHA-256 |
| --- | --- |
| Native still | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| Settled frozen upper (zoom/walk ≥500 ms) | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| Zoom t500 lower (Settings left) | `412a2447b3c12183f6ed94be4af190c3015bb9afcbb9fd596a8bdabd02b30cc4` |
| Walk t500 lower (Settings right) | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Zoom/walk t500 upper contact sheet | `90719ec9631e42038506e3ad0e09afb122e6dcdf7d7b1235762c888412f88599` |
| Zoom t500 official report | `a4b6a8221f595c16a781e23a5787de9b4acae253394251875693a779498da849` |
| Walk t500 official report | `6e0136f41a74e89a3873218901655cc307bbea2a43035db0cc64fd2bb405d14a` |
| Prior 11,868 upper | `44e99c80057a2833134a9588d741f4ad11983fc4a2c3cea1340192ea1ba50749` |
| Yaw300 / COMMON299 upper | `a32e9565c08685eb2c78070d9c06e3a4711162dbbef3cb8b45d611130af7801f` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |
| Prefs start/restored | `86a5908895212fc08d84b24758ac1ecbbc149afa85b580736e3e8203c35c2f3a` |

Series JSON: `R/report.json`. Transition probe: `R/probe-transition.json`.

## Doubts

- The 11,868 PNG was not reproduced with freeze after Settings was the
  retained primary. Its pose class is live Settings near COMMON 300, which
  this route’s fresh Settings activation (yaw 5–12 at 400–500 ms) does not
  sit on. The earlier still may have been a live paint or a wait that fired
  on incoming Settings.
- `probe-live-200/upper.png` was overwritten by a later live sample in the
  same probe; the Camera-hide **22,344** count lives in
  `probe-transition.json` only.
- Keyboard ArrowLeft/Right share the consumer path with D-pad; this slice
  did not click `DPAD_left`. Exact native hide/activate cadence remains
  untraced. Whole-scenario 1:1 still fails. Matrix unchanged.
