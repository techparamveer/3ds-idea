# HOME Settings one-row recapture

Coordinator recapture on `c33f1c4e` (runtime `b51f135b`). No product change.
Follows the [colon blink](home-hud-colon-2026-10-04.md) and
[reference-profile HUD](home-hud-profile-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still `_26.09.26_04.14.35.203.png`, SHA-256
`4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`.

## Why this pair

Earlier HUD/colon recaptures used Work selected and
`2026-09-26T04:14:35.203Z`, so the browser painted 05:14 in BST. The still is
one-row HOME with Settings selected, balloon visible, and local 04:14 with
the colon hidden. Those route and timezone mismatches were not product
defects.

Capture uses `lcdDate=2026-09-26T03:14:35.203Z` (04:14 local), WalkCoin
elapsed 1617 ms (frame 97, the production-underlay candidate, not a live
clock), one-row density, ArrowRight until `banner.selection.id` is
`system-settings`. Preview 3021 at `b51f135b`. Empty mask, threshold 2/255.

## Pair

| Artifact | SHA-256 |
| --- | --- |
| `R/browser-settings-0414-1row/upper.png` | `d63cc7189c873495f089617e914d0cee44e311bb5ed36e8512c713b9be2fdd37` |
| `R/browser-settings-0414-1row/lower.png` | `b8699bb55d3a11fff9c37cf831631edb3c7d751408872961daeb02da0c383cea` |
| `R/diff-settings-0414-1row/upper-contact-sheet.png` | `fd022643cb2b5ba48bf3219c8dbfa4234f709479da8dc4665438ef5fd61810cc` |
| `R/diff-settings-0414-1row/lower-contact-sheet.png` | `bb8251e9a61a55a8b3379537bf6b15426b605a0dd6729d2c4ce4d6a6214d84e6` |
| `R/diff-settings-0414-1row/report.json` | `e15899e6da875dd249089675559e013edd9a734d64daf01f3aafcaf0c684e6d0` |

`homeHudSampling` is `live-default`. Native epoch unmatched. Input prefix is
the one-row Settings walk, not Azahar's unknown prefix.

## Scores

Whole LCDs: **48,275 / 12,779** pixels over 2 (MAE 9.213 / 6.979). Previous
Work two-row pair was 54,492 / 45,310. A two-row Settings recapture at the
same clock (`R/browser-settings-0414-wc97/`) was 57,290 / 42,992 and is the
wrong density for this still.

| ROI | Pixels over 2 | MAE | Max |
| --- | ---: | ---: | ---: |
| Network `[0,0,137,20]` | 229 | 0.733 | 12 |
| Counter `[139,0,61,20]` | 582 | 2.609 | 13 |
| Battery `[370,0,30,20]` | 66 | 0.848 | 12 |
| HUD band `[0,0,400,20]` | 1,970 | 1.551 | 13 |
| Clock `[225,0,145,28]` | 1,331 | 2.251 | 13 |
| Banner box `[40,80,320,90]` | 15,624 | 12.787 | 210 |
| Wallpaper mid `[0,30,400,50]` | 11,764 | 17.717 | 158 |
| Lower toolbar | 164 | 0.950 | 248 |
| Lower balloon | 441 | 0.378 | 11 |
| Lower Settings tile | 995 | 0.916 | 16 |
| Lower footer | 385 | 0.284 | 13 |
| Lower tiles | 8,329 | 21.045 | 255 |

HUD content now matches the still: Internet, 42, orange battery, 04:14, no
colon. Remaining HUD counts have max delta 13 and are wallpaper shine-through,
not a wrong string or icon. The balloon, footer, toolbar and Settings cursor
are close. Lower tile residuals are the labelled portfolio neighbors (Sound /
Health versus excluded Activity Log / Download Play).

Inspected contact sheets show the next unexplained upper residual is the
Settings banner pose (wrench yaw / COMMON skeletal) plus wallpaper phase.
This recapture used live banner motion after the Settings walk (`yawCounter`
190), not `lcdBannerFrame`. That is capture-time phase, not a new live
default.

## Remaining

Wallpaper phase, Settings banner yaw/skeletal, WalkCoin fade, portfolio tile
population, motion and audio remain open. Whole-scenario 1:1 still fails.
Matrix unchanged. No Azahar launch.
