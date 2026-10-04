# HOME Settings banner skeletal search

Coordinator diagnostic after `eee00031` (runtime `27f313d3`). No product change.
Follows the [wallpaper freeze](home-settings-wallpaper-frame-2026-10-04.md).
Native still `_26.09.26_04.14.35.203.png`.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.

## Method

One-row Settings, local `2026-09-26T03:14:35.203Z`, WalkCoin 1617, frozen yaw
310, frozen Loop 338. Independent `lcdBannerSkeletalFrame` 0..590 step 10,
then refine 304..312. Empty mask, threshold 2/255.

## Result

Refine winner is **COMMON 309** (`clockRelationship:independent-diagnostic`).
Icons 1,471 / upper 2,900 MAE 0.334 versus locked 310 (2,249 / 4,182). HUD
stays 0 over 2, max 2. This is the same yaw−1 COMMON relationship as the
older yaw304 / COMMON303 diagnostic. Manager yaw and scene clips remain
separate owners; submitted visible poses are still unobserved.

Pair `R/skeletal-refine/` upper SHA
`f87ccd3476f5312e938bf87d6b1bb1675181a645d01902ca8d217d6182906a65`.
Whole LCDs **2,900 / 13,522**. Inspected
`R/diff-yaw310-common309/upper-contact-sheet.png` (SHA `babc06e0…`): remaining
upper residuals are wrench edges and the outer `mt_pict` icons. That artwork
path is the existing [source gap](home-mtpict-source-gap-2026-10-04.md),
which restates the [26 September edge gap](home-settings-banner-edge-source-gap-2026-09-26.md).
Lower residuals stay the labelled portfolio neighbors.

Do not adopt yaw−1 as a live clock. The independent capture override stays
available.

## Remaining

`mt_pict` icon/wrench coverage, title glyphs, portfolio tiles, motion and
audio remain open. The unlit COMMON2 artwork path is labelled
[source-gap](home-mtpict-source-gap-2026-10-04.md). WalkCoin on this still
is already inside 2/255. Whole-scenario 1:1 still fails. Matrix unchanged.
No Azahar launch.
