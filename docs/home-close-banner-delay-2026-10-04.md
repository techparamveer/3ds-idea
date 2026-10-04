# HOME Close Banner Return Timing

Runtime `bbe557cd` (integrated in `3ds-home-fidelity-20261001`). This pass
times the returning title banner after a software close against the frozen
native Health close capture from the [banner return pass](home-banner-return-2026-10-03.md).
That pass moved the request to footer departure frame 0, using only structural
evidence.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-close-return-20261004/`.
Native PNGs: `native-home-launch-onset-20261003/screenshots/banner-return-20261003/`
(5% playback, about 1.1s per capture).

## Native Timing

`R/region-fit.mjs` fits each native capture's lower body, footer band and
upper body, separately and in direct coordinates, to the actual browser close
pairs from `home-banner-return-20261003/desktop-recheck`, labelled by HOME
update and controller phase. The dialog exit (N029..N033) and footer departure
and return (N033..N040) follow the browser timeline at about three updates per
capture, within one or two updates. No timing correction is needed there.

The banner box (`R/banner-fit.mjs`, upper x40..360, y80..170) shows the defect.
Native N038 (Open return about 4) has no banner. N039 (return about 7) shows
it at about 0.84 scale (text width 388 against 463 at full size). N040 is full
size. Native activation is therefore near return 6, but browser `c01e1219`
activated at return 2 (scale 0.8, full by return 6). `R/upper-return-sheet.png`
and `R/banner-crop-sheet.png` (SHA `5c514262...`, `1763961d...`) show this.
The slow convergence of the upper LCD over N040..N061 is wallpaper drift, not
banner motion.

## Change

Worker `3ds-home-close-banner-delay-20261004` /
`codex/home-close-banner-delay-20261004`, `838b1bc9` -> `bbe557cd`: the close
banner request now happens once, on the update that reaches compact footer
departure frame 4 (`HOME_CLOSE_BANNER_REQUEST_EXIT_FRAME`) or any return
frame, so a batched step crossing it still requests once. The no-controls
resolver keeps the selection clear until then. The unchanged service gates
(hiding, gate, wait1..5, loading) then activate at return 6. This is a
**fitted adaptation**, not a recovered native request call.

## Verification

Independent review found no defect. It confirmed that the request fires once,
that frames never regress, that switches and replacement generations do not
fire, and that callers make no frame-0 assumption. It noted that the existing
`motionChanged` clock path has no boundary check, a pre-existing gap.
Integrated `bbe557cd`: full suite 1994 pass, 0 fail; typecheck and production
build pass (`R/tests.log`, `R/build.log`).

Folder Health close recaptures (`R/browser-folder-close.mjs`, SHA
`93a80fd3...`) through the muted CDP 9320 browser and preview 3021, errors
`[]`, layout restored:

| Run | Close pairs | `result.json` SHA-256 |
| --- | --- | --- |
| `R/after-desktop` | 47 | `c4abd481f50b5914c5f769bbc487ce9b80223bde4df8d82eb6063fc36247a3e8` |
| `R/after-mobile` | 47 | `f812ea0ce590d8cba2e2755bb40911f6306119b500afe0614264adce808fb943` |
| `R/after-reduced` | 55 | `e09199f1967131b9136b118ef5eaa4ff3206c5fb6134ea2d3e2265391f788131` |

On the new desktop run the banner first shows at return 6. Native N038 fits a
no-banner frame (3.34), N039 fits browser return 7 (3.18, the wallpaper floor)
and N040 fits the first full-size frame (3.37).

## Remaining

The capture spacing (about three frames) limits the fit to about one update.
HUD content, wallpaper phase, audio, the exact native epoch and whole-scenario
acceptance remain open. Whole-scenario status remains fail.
