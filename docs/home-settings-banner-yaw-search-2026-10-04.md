# HOME Settings banner yaw search

Coordinator diagnostic on `80716e49` (runtime `b51f135b`). No product change.
Follows the [Settings one-row recapture](home-hud-settings-recapture-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still `_26.09.26_04.14.35.203.png`.

## Method

One-row Settings HOME, local `2026-09-26T03:14:35.203Z`, WalkCoin elapsed 1617.
`captureScreensAt(elapsed, date, bannerFrame)` with locked yaw/skeletal clocks.
Coarse frames 0..590 step 10, then refine 300..320. Empty-mask threshold 2/255.
Wrench ROI `[140,21,116,142]`.

## Result

Coarse and refine both pick **frame 310** (`yawRadians` −3.2463126182556152,
skeletal 310, `synthetic-source-pose`). Wrench 1,473 over 2 versus 11,052 at
the live walk pose (yawCounter 190). Inspected `R/banner-yaw-search/upper.png`
and `R/diff-banner-yaw310/upper-contact-sheet.png` (SHA
`e67c0312e98b5a4cbe4c6da4ba5fff070aae640967029650304127a183fd7ead`): the
wrench angle now matches the still. HUD content stays Internet / 42 / 04:14 /
no colon.

The written refine pair is `R/banner-yaw-refine/` (upper SHA
`f7494a583667632eead81f8b1b5055f88cef5496569b9c1d36edbb5134369c82`). Whole
LCDs 51,304 / 13,386, MAE 3.607 / 7.259. Pixel count is not better than the
live-yaw recapture (48,275 / 12,779); MAE is. Lower residuals remain the
labelled Sound / Health neighbors.

## Capture-seam gap

`drawHomeBackground` ignores elapsed and paints live `BannerBG_Loop` from the
banner host unless `homeWallpaperFrame` is passed. That Health-only seam
still requires Health selected. Settings `lcdBannerFrame` therefore freezes
the wrench while wallpaper keeps walking. Adjacent refine scores jump from
1,795 (306) to 7,741 (307) to 1,473 (310) for that reason. Frame 310 is the
next capture candidate, not a proven native epoch and not a live default.

Do not adopt 310 as `INITIAL_YAW`. Re-search yaw only after Settings HOME
can freeze `BannerBG_Loop` without selecting Health.

## Remaining

Frozen wallpaper/BannerBG sampling on Settings HOME, WalkCoin fade, portfolio
tiles, motion and audio remain open. Whole-scenario 1:1 still fails. Matrix
unchanged. No Azahar launch.
