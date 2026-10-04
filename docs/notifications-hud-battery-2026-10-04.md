# Notifications HUD charging battery blink — 4 October 2026

Stock/social worker on `codex/notifications-battery-20261004` from HOME fidelity
`a05ff90c` (HudMenu_00 bind `ba78c156`). Sparse worktree; `node_modules` linked
from HOME fidelity. No `model/`. No Azahar. No preview 3021. No CDP 9320. No
recapture.

This slice binds title-local `HudMenu_00_Bat` to the shared HOME/Settings
seconds 4/5 charging helper. It does not claim 1:1. Tests and this note do not
close pixels, input, motion or audio. Coordinator recapture remains the
acceptance gate.

## Pair (matched-clock recapture, not re-run here)

Private comparison
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-hud-recapture-matched-clock-20261004/`.
Native 400×480 PNG is the unread-dot still
`_27.09.26_13.16.53.105.png`. Browser upper is the post-`HudMenu_00` bind
with `lcdDate=2026-09-27T12:16:53.105Z` (local 13:16:53, seconds **53**, odd).
Empty mask. Threshold any RGB channel >2/255.

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser upper (post-bind, matched clock) | `e08ad93a64d49d2acf783dd8a89c816452c4abc996206a85398a691e357812bc` |
| `report.json` | `ea356921332a8229fe80176569fe800a1215f11116669af875325432762b8f81` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the upper contact sheet. Internet / date / `13:16` colon match.
HUD leftover is only the battery. Native shows a black charging plug on orange;
the browser freeze at Bat 4 is plain full orange (`HudBat_01` + `HudBatLgt_00`).

| Region | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole upper | `[0,0,400,240]` | **3074** | 255 | `(381,7)` native `(0,0,0)` / browser `(255,222,115)` |
| HUD strip | `[0,0,400,28]` | **182** | 255 | same |
| Battery | `[370,0,400,28]` | **182** | 255 | same (all 182) |
| Official bat box | `report.screens.upper.regions[0]` `{x:376,y:5,width:19,height:10}` | **182** | — | plug vs fill |
| Body complement | `[0,28,400,240]` | **2892** | 211 | SpotPass / StreetPass AA; not this slice |
| Whole lower | `[0,0,320,240]` | **3876** | 140 | scrollbar / Close / list; not this slice |

Before the HudMenu_00 bind the unread-dot pair was HUD **3347**. After the bind
and matched clock it is **182**, all in the battery.

## Title-local owner (not a screenshot frame)

EUR Notifications applet `000400300000a002`, version 4097, content index 0 /
ID `00000012`. Pinned `exefs/code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`, image
base `0x100000`. Capstone via
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/camera-grid-venv/bin/python`.

HUD constructor `0x180c1c..0x180f5c` looks up `%s_%s.bclan` names from the
table at `0x1a6740`. `r5[0x14]` is `"Bat"`; the animator is stored at object
`+0x8c` (HOME stores `G_Bat_00` at `+0x88`). Clock helper `0x180478` writes
the 12-byte calendar at `+0xcc`; seconds are byte 9 (`+0xd5`), matching HOME
`+0xdd` as `+0xd4+9`.

Idle update `0x181018`:

1. Clock `0x180478 r1=0`, then PTM battery `0x180b00 r1=0` (charging sets
   `+0xba` from `0x15d30c==1` and does not write Bat while charging).
2. WhiteBlack animator `+0x78` state 1 or 2 skips to `0x181120`.
3. `ldrb +0xd5` / `tst #1`. Pane `T_TimeC_00` (`+0xa4`) visibility bit 0:
   odd hide, even show.
4. `+0xbb` low-battery blinks `P_Bat_00` (`+0xa0`) visibility.
5. `+0xba` charging: animator `+0x8c` vtable `+0x2c` to float **4.0** at
   `0x181128` on odd seconds, **5.0** at `0x18112c` on even seconds.

That is the same numeric 4/5 map as HOME `0x27c6a8` and Settings `0x238f10`.
The painter now calls `deviceStatusBatteryFrame` / `chargingBatteryFrame`
(odd → 4, even → 5). It does not duplicate the map and does not invert to
Sound `0x17adfc` (odd → 5 `HudBatPlg`, even → 4).

This title's `HudMenu_00_Bat` atlas is the eShop/Sound family, not HOME
`HudBat_04`/`05`. Posed `P_BatF_00`:

| Seconds | `chargingBatteryFrame` | `P_BatF_00` maps |
| --- | ---: | --- |
| odd | 4 | `HudBat_01` + `HudBatMask_00` + `HudBatLgt_00` (full orange) |
| even | 5 | `HudBat_01` + `HudBatMask_00` + `HudBatPlg` (black plug) |

Native at screenshot `:53` shows the **plug** (even clip pose) and a **visible
colon** (even `T_TimeC_00` path). Injected `lcdDate` seconds 53 is odd, so the
shared helper still selects frame 4 on that recapture. Do not screenshot-fit
`HudBatPlg` onto odd seconds. `T_TimeC_00` stays `{visible:true}` in this
slice so the matched colon is not reopened; 0x181018 also odd-hides the colon.

## eShop / Settings (not changed)

Settings already samples `chargingBatteryFrame` on cached seconds
(`stock-settings-hud.ts`). eShop welcome still freezes `HudMenu_00_Bat` at
ctor frame 4 with a static colon (`0x36a7fc` 4/5 tick has no HUD elapsed
owner). Sharing `chargingBatteryFrame` does not by itself unfreeze eShop; this
slice only changes Notifications. Zone still uses `Hud_00_Charge_anim`.

## Reduced motion

HOME reduced-motion keeps the 1 Hz colon/battery blink with
`homeHudReducedMotionParityPaintDue` while WalkCoin/cursor stay frozen.
Notifications runs in `phase==='app'`, which already paints at LCD cadence
when reduced (`!reduced||phase==='app'`). The pair key now includes
`notificationsHudClock(date).batteryFrame`, so the 1 Hz Bat change republishes
without a HOME-only extra paint. Do not freeze Bat under reduced motion.

## Element → manifest key → dump source

| Element | Manifest / pack | Dump source | Title / version / content | SHA-256 | Converter |
| --- | --- | --- | --- | --- | --- |
| `HudMenu_00` | `packs/notifications/hud.json` | `RomFS/hud_LZ.bin` / `hud_LZ.bin/blyt/HudMenu_00.bclyt` | `000400300000a002` v4097 content 0 / `00000012` | layout `5a95579d59c8a92ddce79b95900e061835c84626543b403667be7239c77d30f7`; published pack `84d76eb05eae7f0d471b671bbf4aef8d4805bcdb57ea23f0d9f2489f5181cf6f` | ctr-native-web **1.3.1** |
| `HudMenu_00_Bat` | same | `hud_LZ.bin/anim/HudMenu_00_Bat.bclan` | same | `1c58e6ea560703e92fdf40ff8e34a1a78fabcef776284a6f2eb1b7e6c6d2006e` | 1.3.1 |
| `HudBat_01.bclim` | same | `hud_LZ.bin/timg/HudBat_01.bclim` | same | dump `1be98fca4be7666d19e50c87617f2eda1d20c6de36c92883a4efc6f82cb581af` | 1.3.1 |
| `HudBatLgt_00.bclim` | same | `hud_LZ.bin/timg/HudBatLgt_00.bclim` | same | dump `7b3108b54e1b0dfc119b28cc278606c4c7dd07ba5cb0e2050bdd6b97be980657` | 1.3.1 |
| `HudBatPlg.bclim` | same | `hud_LZ.bin/timg/HudBatPlg.bclim` | same | dump `f8f77ecd9959e7830d30eaeee9abf5caea951e895f92f38bcc41d7afb2c8764c` | 1.3.1 |
| Charging 4/5 map | `src/os/device-status-profile.ts` `chargingBatteryFrame` | Notifications `exefs/code.bin` `0x181018` (HOME `0x27c6a8`, Settings `0x238f10`) | same title `code.bin` `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228` | n/a (executable, not a converted graphic) | Capstone 5 |

No new pack delivery. Converter 1.3.1 already published `HudMenu_00_Bat`.

## Runtime

- `notificationsHudBatteryFrame` is `deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, date.getSeconds())`.
- `drawNativePersonalToolFrame` binds `HudMenu_00_Bat` to that frame.
- `notificationsHudClock` keys year/month/day/hour/minute plus `batteryFrame` so
  the paired LCD republishes when seconds parity changes. eShop `eshopHudClock`
  is no longer reused for this title.
- Generation/owner guards, paired-LCD readiness and disposal are unchanged.

## Offline measure

This lane has no `@napi-rs/canvas` compositor for a post-bind upper LCD, so it
cannot re-raster the browser target. Pose-level: injected seconds 53 still
selects frame 4, the same clip the frozen painter used, so HUD battery **182**
is expected to remain on a same-`lcdDate` recapture. Even seconds select
`HudBatPlg`. Live app Bat now blinks at 1 Hz. Whole-LCD after counts await
coordinator recapture.

## Remaining residual

C-NTF-01 HUD battery `[370,0,400,28]` **182** on the matched-clock still.
Whole upper **3074** / lower **3876**. Body **2892**, scrollbar **2479**,
Close **577**, list **820** stay separate leftovers. Colon remains a frozen
visible even-path adaptation. Input, motion and audio remain open. Not 1:1.

## Coordinator recapture

Run the existing script (needs the browser grant; this lane did not run it):

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-hud-recapture-matched-clock-20261004/capture-notifications-hud.mjs`

Same `lcdDate=2026-09-27T12:16:53.105Z` / `lcdElapsedMs=12000` /
`lcdScenario=notifications-list-unread-dot`. Optional follow-up: even
`2026-09-27T12:16:52.105Z` to exercise frame 5 `HudBatPlg` against this
native plug still.

## Checks

Focused `tests/notifications-hud-battery.test.mjs` plus
`tests/notifications-hud-3347.test.mjs` **8/8**; presentation/HUD set
**50/50**. `npm test` 2006 pass / 36 fail / 23 skip / 1 TODO (2066); the 36
fails are sparse-checkout `model/` / GLB ENOENT, unchanged from this worktree.
`npm run typecheck` passes. `npm run build` fails here because Turbopack
rejects the external `node_modules` symlink (same sparse restriction as prior
stock workers). `git diff --check` clean. This lane did not drive Azahar or
preview 3021 and did not recapture.
