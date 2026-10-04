# HOME Settings cursor loop freeze

Runtime `a1590273` in `3ds-home-fidelity-20261001`. Follows the
[banner skeletal search](home-settings-banner-skeletal-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still `_26.09.26_04.14.35.203.png`.

## Defect

`LncCsr_00_Loop` keeps walking after Playwright settles unless
`homeCursorLoopFrame` is passed. Wallpaper-only Settings stills therefore
froze yaw / COMMON / Loop while the brackets kept moving. Live
`appliedFrame` after the wait was around 25.

## Change

Worker `3ds-home-cursor-loop-frame-20261004` /
`codex/home-cursor-loop-frame-20261004`, `e57623be` → `a1590273`: localhost
white HOME captures may pass `lcdHomeCursorFrame` (or
`captureScreensAt(..., {homeCursorLoopFrame})`) with wallpaper and the
existing elapsed/date clock. Cannot combine with Health frames. Live HOME
is unchanged.

## Verification

- Freeze path: `tests/native-home-controls-paint.test.mjs` test "capture
  paint hands frozen cursor and wallpaper loop frames to the draw; live paint
  keeps walking" runs the real `createScreens` painter and checks that
  `homeCursorLoopFrame` reaches both `cursorAt` and the tile `cursor` path,
  `homeWallpaperFrame` reaches `drawHomeBackground`, and a paint without
  capture parameters still follows the advancing live loop. In
  `tests/lcd-capture.test.mjs`, the Health HOME capture test checks the
  `captureScreensAt` receipt and its rejection rules. The receipt's
  `homeCursor.sampledFrame` is the painted forced frame, with
  `sampledFrameSource: 'verification-forced'` and the live `liveSampledFrame`.
  Health+cursor is rejected before any paint. Typecheck and production build
  passed at `a1590273`. These receipt and test changes came later, in
  `codex/home-freeze-receipt-20261004`.
  `tests/home-cursor-loop.test.mjs` (11) covers only the live loop machine,
  not the freeze.
- Frozen search at yaw 310 / COMMON 309 / Loop 338 scores cursor frames
  0–59 on lower LCD ROI `[200, 118, 80, 88]`, then whole lower. Winner is
  **Loop 37** (36–38 best; 37 cursor ROI 1,677 over 2, max 22). Frame 0
  was 2,479 / 13,488. That ROI is ranking support only, not an acceptance
  mask.
- Pair `R/cursor-search/` upper SHA
  `f87ccd3476f5312e938bf87d6b1bb1675181a645d01902ca8d217d6182906a65`
  (byte-identical to the skeletal-refine upper). Lower SHA
  `0227d5fd6ebf949e8f9a1734816ea433edccbea0f2b2d2d9dc7d0092c821f486`.
  Empty-mask whole LCDs **2,900 / 12,544**. Inspected
  `R/diff-cursor-37/lower-contact-sheet.png` (SHA `7cc5a4f1…`): Settings
  brackets now sit on the wrench. Remaining lower residuals are the
  labelled Sound / Health neighbors versus native Activity Log / Download
  Play. Upper residuals stay wrench edges and outer `mt_pict` icons.

Do not adopt 37 as a runtime clock. Native epoch unmatched.

## Remaining

`mt_pict` icon/wrench coverage, WalkCoin fade, portfolio tiles, motion and
audio remain open. Whole-scenario 1:1 still fails. Matrix unchanged. No
Azahar launch.
