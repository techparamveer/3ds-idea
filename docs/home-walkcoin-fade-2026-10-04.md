# HOME WalkCoin fade on the Settings 04:14 still

Worker `3ds-home-walkcoin-fade-20261004` / `codex/home-walkcoin-fade-20261004`
at `a1590273`. No runtime change. Follows the
[skeletal search](home-settings-banner-skeletal-2026-10-04.md) and the
[wallpaper freeze](home-settings-wallpaper-frame-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.14.35.203.png`,
SHA-256 `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`.

## Why this still

One-row Settings HOME, local `2026-09-26T03:14:35.203Z` (BST +1 → 04:14),
capture elapsed 1617 ms. Live HUD is the labelled isolated-Azahar-profile
adaptation (Internet / 42 / orange battery), not telemetry. Frozen diagnostic
pose is yaw 310 / COMMON 309 / `BannerBG_Loop` 338. WalkCoin source is
`time * 0.06`.

Earlier HUD notes still listed a WalkCoin fade residual. This slice asks
whether that leftover is a live-clock capture seam like wallpaper or cursor.

## Source identity

EUR 10.7.0-32E HOME title `0004003000009802` v24576, content index 0 / ID
`00000082`. Delivered `packs/home/hud.json` SHA-256
`76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775`,
converter ctr-native-web 1.2.0.

| Element | Manifest / pack key | CIA-internal path | SHA-256 |
| --- | --- | --- | --- |
| HUD layout | `home.hud` → `HudMenu_00` | `hud_LZ.bin/blyt/HudMenu_00.bclyt` | `c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de` |
| WalkCoin clip | `HudMenu_00_WalkCoin` | `hud_LZ.bin/anim/HudMenu_00_WalkCoin.bclan` | `b7db095d0b521d43c24fcdbcbabf2514fb80628f77a74cd71f549882346043b8` |

The clip is 360 frames, looping, group `G_WalkCoin_00`. `P_Walk_00` fades
out 67→90; `P_Coin_00` fades in 90→112, holds through 247, then fades out
to 270. Frame 97 is that incoming coin fade, which is why an unmatched
wallpaper used to look like a coin-alpha residual. The native epoch and
HOME service-to-frame mapping remain untraced.

Live `hud()` binds `HudMenu_00_WalkCoin` to `sample?.walkCoinFrame ?? time * 0.06`.
`time` is capture/paint `elapsedMs` (0 if reduced). The looping pose wraps
with `frame % 360`. Internet / 42 / orange stay `HOME_REFERENCE_HUD_STATUS`
when no diagnostic sample is supplied.

## Not a live-clock capture seam

Wallpaper ignored capture elapsed: `drawHomeBackground` paints live
`BannerBG_Loop` unless `homeWallpaperFrame` is passed. Cursor ignores
elapsed too: `getHomeCursorLoopFrame` reads the live HOME loop. Those
needed Settings still freezes.

WalkCoin already follows the capture clock. The one-row recapture records
`elapsedMs=1617`, `walkCoinFrame=97.02`, `homeHudSampling=live-default`.
That is `1617 * 0.06`, the production-underlay candidate from the
[source-pose fit](home-hud-source-pose-fit-2026-09-26.md). Changing
elapsed is the WalkCoin search; there is no separate live host loop.

An independent WalkCoin freeze already exists as
`lcdHomeHudSample.walkCoinFrame`, but only as a complete
`verification-source-pose` sample. It is not a live-default still freeze,
and this still does not need it.

## Frozen-pose evidence

Coordinator pair `R/skeletal-refine/` at yaw 310 / COMMON 309 / Loop 338,
elapsed 1617, live-default HUD. Upper SHA
`f87ccd3476f5312e938bf87d6b1bb1675181a645d01902ca8d217d6182906a65`.
Empty-mask HUD `[0,0,400,20]`: **0 over 2**, MAE 0.114, max 2. Diff
`R/diff-yaw310-common309/report.json` has **no** residual region with
`y < 28`. Inspected
`R/diff-yaw310-common309/upper-contact-sheet.png` (SHA `babc06e0…`):
Internet / 42 / 04:14 / no colon match; the heatmap is wrench edges and
outer `mt_pict` icons, not the coin pane.

Do not adopt 97, 310, 309 or 338 as live clocks. Native epoch unmatched.

## No product change

Source does not justify `verification.homeWalkCoinFrame` or
`lcdHomeWalkCoinFrame`. That would duplicate elapsed-driven `time * 0.06`
and invite treating 97 as a runtime clock. Live HOME is unchanged. No
graphics were invented.

## Remaining

Settings banner `mt_pict` / wrench coverage (existing
[source gap](home-settings-banner-edge-source-gap-2026-09-26.md)),
portfolio tiles, motion and audio remain open. Whole-scenario 1:1 still
fails. Matrix unchanged. No Azahar launch. No preview 3021.

Coordinator recapture: none for WalkCoin. Keep live-default HUD, elapsed
1617 (`time * 0.06` → 97.02), frozen yaw 310 / COMMON 309 / Loop 338.
Do not add a WalkCoin query override. Next unexplained upper pixels are
the banner icons and wrench, not the coin fade.
