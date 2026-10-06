# HOME compact H-12 retained Health upper — 6 October 2026

## Decision

**STOP: no unique unused dump writer, pane, or source-size was found for the
compact retained-Health upper versus the selected Camera banner.** No painter,
banner gate, resource binding, or mask changed. The predicted empty-mask result
therefore holds at **30,032 upper / 47,436 lower pixels over 2/255**.

The retained Health capture, source `BannerBG` paused presentation, compact
`LncBase_U_00` pose, Health icon, and advancing Sleep clip are already bound.
The browser then paints the active Camera primary over that retained
background. Removing that primary would be a composition-predicate change, but
the bounded dump records do not identify the suspended-application caller that
hides or detaches it. Applying that change from this still alone would be a
capture fit, not a recovered source bind.

This source-only leftover does not justify enabling a guessed title pane,
changing antialiasing, inventing a banner gate, or adding excluded Mii Maker or
StreetPass software to reproduce the native neighbours. Whole-scenario 1:1
remains unproved.

## Pinned pair

The scenario is `home-compact-health-camera` at `8c612e04`: Health is the
suspended application, Camera is selected, and the native lower LCD uses two
rows with Mii Maker / StreetPass neighbours.

| Item | SHA-256 |
| --- | --- |
| Official Azahar `_06.10.26_14.40.41.189.png` (400×480) | `93058283b0babac73c9d5ffccc8576cd1b5b5687179a11fe92c891d59462e164` |
| Browser Camera upper | `b368f61d7c5b63ac4da4f3d0bcb6523e33f5ce4a8caf8a17b5ba3c8cc5bb49e2` |
| Browser Camera lower | `ac6485d2bf77d766a4fcf4a8c651d706ee4fbf3175f51596daf9bf6bb9695b86` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |
| Compare report | `f2fceb5507f888cc1d5158f17ed69f2e9c794d26e41a75b7a03e29754e597e7a` |

Artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/home-compact-20261006/`.
The supplied contact sheets show the retained Health upper natively and the
Camera primary in the browser. The report's largest upper component is
**24,563** pixels in `[21,26,358,188]`; the lower is dominated by **45,293**
pixels in `[0,36,320,178]`.

## Already-bound retained upper

HOME title `0004003000009802`, version 24576, content index 0 / ID
`00000082` supplies both source owners:

| Element | Live owner / source | SHA-256 |
| --- | --- | --- |
| Retained upper geometry and paused material | `models.homeBackground` → `romfs/3D/BannerBG_LZ.bin`; `BannerBG`, `BG_DmyApp_00`, `BannerBG_SceneIn@20`, `BannerBG_AppPause@20` | compressed `27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`; decoded CGFX `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595` |
| Compact window layout | `home.launcher` → `romfs/launcher_LZ.bin/blyt/LncBase_U_00.bclyt` | member `b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` |
| Compact/expanded pose | `animations.LncBase_U_00_ScaleUpDown`; frame 0 / frame 15 | `e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8` |
| Live upper pulse | `animations.LncBase_U_00_Sleep` | `2def63b54f9f1f7c938620aeda619dcf8077e266f2a354940533f5bb1b9d2719` |
| Launcher archive | `packs/home/launcher.json` → `romfs/launcher_LZ.bin` | pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`; source `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |

`drawSuspendedBackground` already replaces `BG_DmyApp_00` with the retained
owner/generation capture and submits the source `SceneIn` / `AppPause` stack.
`drawHomeSuspendedWindow` already submits `LncBase_U_00_ScaleUpDown@0` for
compact mode and the owner-scoped `LncBase_U_00_Sleep` frame. These are active
writers, not unused candidates.

`T_AppTitle_00` is the existing 272×38 suspended-window title pane. It is
already populated for expanded mode and deliberately hidden by the compact
host override. No bounded caller proves that compact mode should enable it, and
enabling it would not remove the Camera model already painted over the retained
capture. It is therefore not a unique unused writer for this mismatch.

The separate `BannerBGmask_LZ.bin` model is also not such a writer: it names
the same four textures and is not a title pane or an independently identified
compact-state submission. `BG_CapMask_00` is already used by the retained
capture adapter.

## Missing source predicate

Native ordering records place `BannerBG` first, `BannerFrame` second, and the
selected primary third. The generic primary's visibility, attachment, scale,
and yaw producer is source-identified, but the compact suspended-application
request/visibility caller is not. The existing host consequently draws:

1. the retained Health `BannerBG` capture;
2. the selected Camera primary because the suspended window is compact; and
3. the compact `LncBase_U_00` icon/pulse.

The official still establishes that this browser composition is wrong for the
captured state, but it does not uniquely choose whether native detached the
Camera primary, inhibited its update, changed its request, or suppressed its
submission. Source notes also leave the mode-1 application predicate unmapped.
Changing `if (!expanded)` to suppress all compact primaries would guess among
those owners and could regress switch/close states.

## Lower LCD boundary

The **47,436** lower pixels are not addressed. Native uses a two-row population
with excluded Mii Maker / StreetPass neighbours; the browser uses one row with
the Settings-right adaptation and different HUD/date samples. No excluded title
was added, moved, or painted.

## Evidence tiers

| Tier | Result |
| --- | --- |
| Source-identified | Existing `BannerBG` capture path, compact `LncBase_U_00` / `ScaleUpDown@0`, live Sleep clip, native 3D ordering, and the missing suspended-primary caller are recorded above |
| Delivered | Existing HOME background and launcher packs only; no new asset |
| Implemented | N/A; no unique unused source writer exists, so runtime and mask stay unchanged |
| Tested | Documentation-only `git diff --check` |
| Browser-inspected | N/A; this worker did not drive the production browser |
| Native-compared | Reused and inspected the supplied official pair, report, and contact sheets; no Azahar operation or recapture |

Predicted recapture at the same inputs and frozen samples remains **30,032
upper / 47,436 lower**. Input, motion, pulse epoch, audio, population, and the
whole scenario remain open.
