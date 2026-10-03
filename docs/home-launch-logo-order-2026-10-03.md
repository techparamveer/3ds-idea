# HOME Launch Logo Order

Runtime `01cc3224`, from worker `f794c953` on base `5e4a32bd`. This pass
corrects the launch-onset residual where the browser drew the Nintendo logo
over a still-visible HOME. It reuses the frozen native capture from the
[launch onset pass](home-launch-onset-2026-10-03.md); no native run was repeated.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-logo-order-20261003/`.

## Visible Defect

Native own PNGs show HOME fading from N074, exact black N086..N092, and the
first faint logo at N093. The `b4077380` browser run drew logo pixels over the
retained Health banner, selected icon and Open footer by B002. The baseline
report is `R/report.md`; the sequence sheet `R/logo-order-sequence.png`.

## Source Schedule

Decoded HOME common `CmnFadeNinLogo_U/D_00` has a 21-pose `SceneOut`
(source 180..200, `P_00` alpha 0 to 255 over frames 0..20). Its `SceneOutA`
repeats that fade at frames 0..20 and holds 255; B and C hold 255.
`NintendoLogo_U_00_SceneOutA` raises `P_Nin_00`/`P_Ds_00` alpha from frame 0
and `NintendoLogo_D_00_SceneOutA` raises `P_NinLogo_00` from frame 0. Playing
both A clips together therefore overlaps logo and HOME for the whole fade.

`appLaunchPose` now plays `SceneOut` frames 0..20 alone over the first 350ms
(21 poses at nominal 60Hz), then the complete logo A/B/C (60/30/15) over
`SceneOut` frame 20. Normal launch is 2100ms; logo C14 starts at
350 + 1733.3ms. Reduced motion keeps 120ms with `SceneOut` frame 20 under the
existing B15 logo pose, pixel-equivalent to the former opaque `SceneOutB` 15.
The missing-launch-pack fallback keeps the 20-frame `SceneOut`, now held for
the 2100ms phase. The captures establish order only; the browser clock and
the absent native black dwell are adaptations.

Assets are unchanged: manifest `home.common` -> `packs/home/common.json` and
`home.launch` -> `packs/launch/logo.json`, HOME title `0004003000009802`
v24576. Their member/content provenance is unchanged from the
[power transition notes](portfolio-power-transitions.md).

## Verification

Worker: focused tests 56/56, typecheck, diff-check and the source renderer
`scripts/verify-native-system-ui.mjs` (30 renders; launch 0 keeps HOME, 349
and 2099 are opaque black on both LCDs). The verifier now compiles its full
`src/os` import closure, supplies the Power input latch and checks the
terminal shutdown pose at 1199ms; these were existing harness defects.
`R/source-render-v1/launch-sheet.png`,
SHA `1dd6b0583fa6a62c318f51bb7d96fe161037a0678b9dfe3a42b49133efcdea0c`.

Independent review of `f794c953`: no correctness finding; it confirmed the
C14/deadline ordering, the 333/350ms boundary, reduced endpoints, footer
SceneOut coverage and fixture edits, and flagged these stale design notes.

Integrated `01cc3224`: full suite 1991 pass, 0 fail, 23 skip, 1 TODO;
typecheck and production build pass (`R/build-integrated.log`).

## Native/Browser Comparison

Browser: production `next start` on 127.0.0.1:3021 from `01cc3224`, dedicated
muted Playwright Chromium on CDP 9320 (window 50,50 1150x780). Collector
`R/browser-logo-order.mjs`, SHA
`fd983a5208547bab49c6802348dc12ebc913b007b5450e336dd6427e7ceb6d3f`, is the
onset collector with only the C14 threshold moved to 2083.3ms. Run
`R/after-desktop`: actual Enter/A input, 71 paired captures, terminal C14
presentation 707 at 2102.8ms before the first app presentation, mute, page
errors `[]`, complete cleanup with restored preferences. `result.json` SHA
`fab09f05a409734d7ba96e24e2cad7b7c77e739190970de5dcaa6f072357daef`.

The coordinator inspected `R/after-desktop-analysis/logo-order-after.png`
(native N073..N100 above browser stages), SHA
`63aa5d1a799a022d30b89316db28a99742bccb6212b1e1d582e9ebb58a8bca00`, and
`onset-frames.png`, SHA
`332078bf525a155a8b5f0917484f0feff1b40be6e6968d868431f07209d500d1`.
Report `R/after-desktop-analysis/report.json`, SHA
`4b8f04f9222985bb7d068bbfc67cff26cb6784c4b61ea3440e86ae15c4991a85`.

| Stage | Native | Browser |
| --- | --- | --- |
| HOME retained, then fading, no logo | N073..N085 | B000..B008 (0..328ms) |
| Exact black | N086..N092 | not sampled (one ~16ms pose) |
| First faint logo | N093 | B009 (370ms) |
| Logo visible | N100 | B012 (520ms) |

Supporting counts: lower-LCD non-black pixels outside the logo badge ROI are
68000 through B007, 67923 at B008 and 0 from B009; upper non-black falls from
93722 at B008 to 2548 logo pixels at B009. Direct coordinates, zero shift,
empty masks, no phase search. Epochs are unsynchronized; no duration claim.

## Remaining

Native holds exact black across seven captures before the logo; browser black
lasts one pose and was not sampled. Whole-scenario status remains fail:
missing cursor/selection brackets during departure, Open pressed/release tone
and timing, native dispatch epoch, cadence, input, audio and existing HOME HUD
pixels. Mobile and reduced runs were not repeated; reduced output is
pixel-equivalent by source and tests only. All 3DS audio stayed muted.
