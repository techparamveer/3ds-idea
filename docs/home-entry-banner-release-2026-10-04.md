# HOME Entry Banner Release

Runtime `458606cb` (integrated in `3ds-home-fidelity-20261001`). This pass
follows the [entry footer and HUD delay](home-entry-delay-2026-10-04.md) and
times the post-boot title banner on the same native HOME initialization
capture and footer-aligned grid.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-entry-banner-release-20261004/`.

## Captured Defect

Banner box (upper x40..360, y80..170) against the settled native banner.
`home-entry-delay-20261004/entry-banner-sheet.png` (SHA `e5446679...`) shows
the crops. Native N056 (footer pose about 11, browser update ≈14) has no
banner. N057 (≈17, footer settled) shows it at about 0.8 scale, and N058 (≈20)
is nearly full. Native activation therefore coincides with the footer's
terminal frame. Browser `5973bcd6` first showed it at update 21 and full at 27.
The banner service's worker gate opened only on the footer terminal receipt,
and its remaining stages took four more updates.

## Change

Worker `3ds-home-entry-banner-release-20261004` /
`codex/home-entry-banner-release-20261004`:

- `c46cc080` -> `6611626c`: the entry owner records a footer *release*
  receipt when a live, visibly presented paint shows footer frame ≥ 10
  (`HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME`), using the same candidate,
  diagnostic and revocation rules as the terminal receipt. The scene's banner
  worker gate opens on it, so activation lands with the terminal frame. Frame
  14 still owns the terminal receipt; the banner presentation receipt still
  requires it. **Fitted adaptation.**
- `b0ff3adb` -> `458606cb`: present the terminal before the release receipt.
  When one paint draws frame 14 first (a skipped interval, or every
  reduced-motion entry), the terminal acknowledgement records both. Releasing
  first had rejected the same-frame terminal candidate. The independent review
  reproduced that defect against `c46cc080` and confirmed the follow-up fixes it.

## Verification

Integrated `458606cb`: full suite 1997 pass, 0 fail; typecheck and production
build pass (`R/tests.log`, `R/build.log`). New tests cover the frame-9
rejection, diagnostic paints, release at frame 10, a terminal that keeps an
earlier release, and same-paint terminal plus release.

Warm power-off/on recaptures (`R/capture-entry.mjs`), errors `[]`:

| Run | Pairs | `result.json` SHA-256 |
| --- | --- | --- |
| `R/after-desktop` | 27 | `e8aa155f25237ee89c0dcc9493ecc7b8004ddf5dc7c9881a069f3bd80a201000` |
| `R/after-mobile` | 29 | `86cbf1f271e887502349a754c9de141bd0de3876c7dae08521aecdbdb14aa797` |
| `R/after-reduced` | 3 | `773f1b3390df34d04499db841fa58bac1d42698995f3ae6c2e200e559cd26cdf` |

The banner box first shows a small banner at update 18 on both desktop and
mobile, and is full by 23 on desktop and 21 on mobile (was 21 and 27). Native
is small at ≈17 and nearly full at ≈20.

## Remaining

The capture spacing (three frames) limits the fit to about one update. The
browser's 0.8 → 1 ramp may be one update slower than native. Banner pixels,
HUD content, audio and whole-scenario acceptance remain open.
Whole-scenario status remains fail.
