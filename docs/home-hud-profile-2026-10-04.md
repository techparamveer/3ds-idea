# HOME Reference-Profile HUD

Runtime `82ab64c7` (integrated in `3ds-home-fidelity-20261001`). This pass
makes the live HOME status bar match the isolated Azahar reference profile
that every HOME comparison is judged against.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still:
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.14.35.203.png`
(SHA-256 `4adc0ef0…`).

## Defect

Native HOME shows Internet, three signal bars, 42 Play Coins and an orange
battery. The browser painted Disabled, no bars, 0 coins and a blue battery.
Those values were explicit presentation constants, not missing artwork. The
[source-pose fit](home-hud-source-pose-fit-2026-09-26.md) already measured
`lau_connect0`, NetMode 0, NetAtn 3 and Bat 4 against that still; the
[profile audit](home-hud-profile-state-audit-2026-09-26.md) found 42 coins in
the isolated `gamecoin.dat`. The live default never used either result.

## Change

Worker `3ds-home-hud-profile-20261004` / `codex/home-hud-profile-20261004`,
`1638b1d3` → `82ab64c7`:

- `HOME_REFERENCE_HUD_STATUS` records the isolated profile pose.
- Live `hud()` uses it when no diagnostic sample is supplied.
- WalkCoin stays `time * 0.06`. The LCD capture URL still requires an
  explicit complete sample and does not invent a default.
- **Labelled adaptation.** This is the isolated Azahar profile, not AC/PTM
  telemetry, and not a claim that the browser is online.

Independent review of `1638b1d3` passed. Codex and Claude review slots were
rate-limited; the commit review found no correctness defect.

## Verification

- Focused HUD and LCD-capture tests 20/20. Full suite 2002 pass / 0 fail /
  23 skip / 1 TODO. Typecheck and production build pass.
- eShop and Zone HUD bindings are unchanged.
- Production preview 3021 at `82ab64c7`. Headless muted Playwright captured
  settled HOME (`R/capture-hud.mjs`) at the still's calendar with live HUD
  (no `lcdHomeHudSample`). Inspected
  `R/diff-empty/upper-contact-sheet.png` (SHA `ef1c7d99…`).
  HUD ROIs versus the 26 September still, compared with the old Disabled
  baseline from the source-pose fit:

  | ROI | Before over 2 / MAE | After over 2 / MAE |
  | --- | ---: | ---: |
  | Network `[0,0,137,20]` | 2,498 / 54.11 | 285 / 0.90 |
  | Counter `[139,0,61,20]` | 1,212 / 21.31 | 667 / 3.15 |
  | Battery `[370,0,30,20]` | 294 / 44.75 | 58 / 0.66 |
  | HUD band `[0,0,400,20]` | 6,196 / 27.58 | 2,184 / 3.06 |

  Whole LCDs remain fail: 54,492 upper / 45,310 lower over 2/255. The
  selected title in this browser boot is Work, not Settings; clock is
  05:14 versus native 04:14 (ISO-Z vs local still). Those are not HUD
  pose defects. Report SHA `29678316…`.

## Remaining differences

- Clock, colon, WalkCoin fade, wallpaper, banner and tile population still
  differ from this Settings still.
- HOME service-to-pane mapping and charging update phase remain untraced.
- Matrix unchanged; every whole scenario still fails.
