# HOME Settings wallpaper freeze

Runtime `27f313d3` / type `c2fdc587` in `3ds-home-fidelity-20261001`. Follows
the [banner yaw search](home-settings-banner-yaw-search-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still `_26.09.26_04.14.35.203.png`.

## Defect

`drawHomeBackground` ignores capture elapsed and paints live `BannerBG_Loop`
unless `homeWallpaperFrame` is passed. That seam required Health selected, so
Settings `lcdBannerFrame` froze the wrench while wallpaper kept walking. Yaw
rankings jumped between adjacent frames for that reason.

## Change

Worker `3ds-home-settings-wallpaper-frame-20261004` /
`codex/home-settings-wallpaper-frame-20261004`, `02aede67` + `0cd0751e` →
`27f313d3` + `c2fdc587`: localhost Settings/HOME captures may pass
`lcdHomeWallpaperFrame` (or `captureScreensAt(..., {homeWallpaperFrame})`)
with the existing elapsed/date clock. Health still requires the paired
banner+wallpaper live clock. Live HOME is unchanged.

## Verification

- `tests/lcd-capture.test.mjs` 17 pass, including wallpaper-only request and
  Settings paint metadata. Typecheck and production build pass.
- Frozen search at yaw 310 picks **Loop 337/338** (336-338 HUD 0 over 2,
  max 2). Refine winner 338, upper 4,182 MAE 0.681. That matches the earlier
  Loop337 diagnostic name; it is not a live default.
- Pair `R/wallpaper-refine/` upper SHA
  `a2da68d4770acc2216029a16c15e44b63ff4a1c74d5418b9fbbeae7311924aa6`.
  Empty-mask whole LCDs **4,182 / 12,893**. Inspected
  `R/diff-wallpaper-338/upper-contact-sheet.png` (SHA `cc2703b8…`): HUD
  content matches; remaining upper residuals are banner icons/wrench edges.
  Lower residuals stay the labelled Sound / Health neighbors.

Do not adopt 310 or 338 as runtime clocks. Native epoch unmatched.

## Remaining

Settings banner icon/skeletal residuals, WalkCoin fade, portfolio tiles,
motion and audio remain open. Whole-scenario 1:1 still fails. Matrix
unchanged. No Azahar launch.
