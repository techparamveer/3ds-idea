# HOME compact H-12 review — 6 October 2026

Independent review of [docs/home-compact-h12-2026-10-06.md](home-compact-h12-2026-10-06.md)
at worker tip `2b384723` on `codex/home-compact-h12-review-20261006`. Pinned
pair commit is `8c612e04`. Reviewer did not drive isolated Azahar or the
production browser and did not add any excluded title.

## Verdict

**APPROVE.** The source-only STOP holds. No unique unused dump writer, pane,
or source size was found for the compact retained-Health upper versus the
selected Camera banner; the predicted empty-mask hold is **30,032 upper /
47,436 lower** pixels over 2/255 at the pinned pair.

## Independent dump and artifact recount

Re-hashed the pinned pair, mask, and compare report under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/home-compact-20261006/` and parsed
the report independently of the worker note.

| Item | Claimed SHA-256 | Reviewer SHA-256 | Match |
| --- | --- | --- | --- |
| Official Azahar `_06.10.26_14.40.41.189.png` (native) | `93058283b0babac73c9d5ffccc8576cd1b5b5687179a11fe92c891d59462e164` | same | yes |
| Browser Camera upper | `b368f61d7c5b63ac4da4f3d0bcb6523e33f5ce4a8caf8a17b5ba3c8cc5bb49e2` | same | yes |
| Browser Camera lower | `ac6485d2bf77d766a4fcf4a8c651d706ee4fbf3175f51596daf9bf6bb9695b86` | same | yes |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` | same | yes |
| Compare report | `f2fceb5507f888cc1d5158f17ed69f2e9c794d26e41a75b7a03e29754e597e7a` | same | yes |

`report.json` is `scenarioId=home-compact-health-camera`, `commit=8c612e04`,
`threshold=2`, `maskedPixels=0`, `result=unexplained-differences`. Independent
sums confirm:

- Upper total **30,032**; regions sum **30,032**; largest **24,563** in
 `[21,26,358,188]` (the Camera primary silhouette rectangle).
- Lower total **47,436**; regions sum **47,436**; largest **45,293** in
 `[0,36,320,178]` (full launcher-row band where native uses two rows and the
 browser uses the single-row Settings-right adaptation).

The predicted hold matches the live report; nothing in the browser-camera or
diff artifacts has shifted since the worker's note.

## Already-bound source writers (independent verification)

Reviewer read the implementations the note cites and confirms each is an
active writer rather than an unused candidate.

- Retained upper capture + paused material.
 [`src/scene/home-suspended-background.ts`](../src/scene/home-suspended-background.ts)
 verifies `sourceSha256 =
 092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`, enforces
 `BannerBG` as the sole model, requires the three textures `BG_DmyApp_00
 (8×8)`, `BG_CapMask_00 (256×512)`, `BG_64_00 (64×64)`, and rebinds
 `Texture1Name` from `BG_64_00` to `BG_CapMask_00` so the retained capture
 fills the dummy slot. `suspendedBackgroundPlayback` already orders
 `BannerBG_SceneIn@20`, `BannerBG_AppPause@20`, and the paused
 `BannerBG_AppQuit` override. `paddedHomeCapture` centres the 240×400 LCD
 inside the 256×512 mask. All of this is an active submission, not a spare
 unused writer.
- Compact pose, pulse, dialog opacity.
 [`src/os/home-suspended-window.ts`](../src/os/home-suspended-window.ts)'s
 `drawHomeSuspendedWindow` already binds `LncBase_U_00_SceneIn@40`,
 `LncBase_U_00_Appear@10`, `LncBase_U_00_ScaleUpDown@0` for compact mode,
 `LncBase_U_00_Sleep@sleepFrame`, and `LncBase_U_00_WhiteBlack`. `T_AppTitle_00`
 is explicitly `visible: mode==='expanded'` (line 72), confirming it is the
 already-bound expanded title pane and is deliberately hidden in compact mode.
 Enabling it would paint the title text over the existing geometry; it
 contains no model geometry that could remove the Camera primary.
- Health icon + sleep clip. `drawHomeSuspendedIcon` already binds
 `LncIconSleep_00_Appear/Scale/Sleep` with validated frames and the resolved
 icon pixels from `firmwareAssets.titleIcons`
 ([`src/os/screens.ts`](../src/os/screens.ts) lines 515-526). This is the
 icon the worker claims is already bound.
- `BG_CapMask_00` is already consumed by the retained capture adapter
 (texture rebind above), so it is not an unused writer either. The dump
 ingested model directory is `home-background/` (sole `model.json` with the
 recorded source SHA); no `BannerBGmask_LZ` model.json exists under
 `public/os/firmware/10.7.0-32E/models/`, consistent with the note's claim
 that it is not an independently identified compact-state submission.

## Composition-gate claim

[`src/os/screens.ts`](../src/os/screens.ts) lines 422-510 confirm the painter
contract the note describes:

- `expanded = !!selectedSuspendedApplication(state)` (line 422) and
 `suspended = retainedSuspendedApplication(state)` are the live gate inputs.
- Lines 436-437 call `options.drawSuspendedBackground(...)` with the pure
 `applicationTransitionPresentation` whether or not the window is suspended;
 when suspended it must succeed.
- Line 446 opens `if(!expanded){ ... }`, which encloses the entire hosted-banner
 primary paint — including the Camera selected-app branch at lines 478-483
 (`drawStockTitleBannerFrame` / `drawSettingsBannerFrame`). Compact mode
 therefore paints the selected primary over the retained `BannerBG` capture
 exactly as the note describes.
- Line 532 draws the compact window with `expanded ? 'expanded' : 'compact'`,
 keeping `T_AppTitle_00` hidden.

Changing `if (!expanded)` or any sub-predicate to suppress the Camera primary
while a suspended application is retained would be a capture-fitted
composition change: the predicate choice (detach vs hide vs inhibit-request vs
suppress-submission) is not uniquely determined by the dump. The worker's
refusal to make that change on the still alone is correct.

## Lower LCD 47,436

Scope check: the single `[0,36,320,178]` region (`45,293` pixels, 95.5% of
the lower delta) spans the full launcher row band. Native uses a two-row
population including excluded Mii Maker and StreetPass Mii Plaza neighbours;
the browser uses the one-row Settings-right adaptation.
[`docs/portfolio-ui-scope.md`](portfolio-ui-scope.md) excludes Mii Maker and
StreetPass Mii Plaza. Painting the native neighbours to shrink this band
would violate scope, and the smaller `[289,142,31,67]` and `[161,0,17,17]`
residuals are a HUD/date sampling difference rather than a sourcing gap.
Correctly left alone.

## STOP evaluation

The STOP holds. The note:

- correctly enumerates the active source writers for the retained upper and
 does not treat them as spare candidates;
- correctly refuses to promote `T_AppTitle_00` to compact mode (hidden by
 explicit override, carries no model geometry);
- correctly refuses to flip `if (!expanded)` as a capture fit without a
 traced suspended-primary caller;
- correctly refuses to paint excluded Mii Maker / StreetPass software to
 absorb the lower 47,436;
- correctly reports the predicted hold as **30,032 / 47,436** against the
 empty mask, matching the committed `report.json`.

Whole-scenario 1:1 for `home-compact-health-camera` remains unproved. Motion,
pulse epoch, audio, input timing, and the untraced suspended-application
caller remain open.

## Nits (non-blocking)

None affecting the verdict. The underlying note is accurate and complete; the
only observation is that `BannerBGmask_LZ.bin` is characterised from the raw
firmware archive and not from an ingested `model.json` — consistent with the
note's claim, but reviewers verifying from the public tree should know the
check is "not present as an ingested model" rather than "ingested but unused".

## Evidence tiers

| Tier | Reviewer result |
| --- | --- |
| Source-identified | Re-read `home-suspended-background.ts`, `home-suspended-window.ts`, and `screens.ts` to confirm the writers, compact gate, and `T_AppTitle_00` visibility override |
| Delivered | Re-hashed the pinned native/browser/mask and parsed `diff/report.json` for totals and top regions |
| Implemented | N/A; review is documentation-only |
| Tested | Documentation-only `git diff --check` on the review note |
| Browser-inspected | N/A; reviewer did not drive the production browser |
| Native-compared | Reused the committed official pair and compare report; no Azahar operation or recapture |

Verdict stands at **APPROVE** on the source-only STOP for the H-12 compact
retained-Health / selected-Camera pair.
