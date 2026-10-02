# HOME Upper Close - 2 October 2026

## Delivery

Coordinator branch `codex/home-fidelity-20261001`, base `4f44e500`.
Two dedicated worktrees/chats delivered source audit `beff2738` (integrated
`ed7bf6f3`) and corrected capture fit `3138dbaa` (integrated `28b1d8ef`).
Runtime `1fbfd6be` fades the native suspended panel at fixed bounds during
explicit Close and selects native light camera hints. Switch is unchanged.
This is a **capture-fit adaptation**, not a traced native panel-alpha writer.

## Source and Implementation

The [bounded source audit](workstream-handoffs/home-upper-close-owner.md)
identifies callback `0x1e6bbc`, upper mode 0, and the BannerBG AppQuit start
path. It does not identify a downstream panel-alpha writer. Do not bind the
scale-coupled upper SceneOut or an upper dialog mask.

Visible panel -> launcher `LncBase_U_00` / `N_Wndw_00`; camera hints ->
`LncBase_U_00_WhiteBlack` frame 0; retained app -> home-background
`BannerBG_AppQuit` Constant4 A. The audit records title `0004003000009802`,
version 24576, content index 0 / ID `00000082`, CIA-internal RomFS members,
source/delivered SHA-256 and `ctr-native-web` 1.2.0 / `ctr-cgfx-web` 1.1.0
converter identities. Existing native fonts/textures/geometry are unchanged.
No native graphic or cue was redrawn or invented.

The [corrected fit](workstream-handoffs/home-close-composition-fit.md) measures
fixed edges at x51.5/347.5, panel top52, header52..71. It replaces the rejected
top82 analysis. Endpoint color projection is not literal panel alpha: the app
behind it also fades. Runtime instead interpolates normalized edge contrast
against the existing source AppQuit Hermite scalar. The unresolvable tail is
clamped to zero at scalar0.423517. This association, tail and existing host
clock are adaptations. No filename is treated as a native frame number.
Upper/lower onset occurs in the same sampled interval; strict ordering is
unresolved, superseding earlier unqualified lower-first descriptions.

The renderer changes only window-group alpha and close-owned WhiteBlack;
no translation/scale, alternate state machine or timer is introduced. Existing
owner/generation/phase/obscuring guards, paired publication, sleep pause,
failure recovery and terminal GPU acknowledgment remain authoritative.

## Evidence

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-upper-close`.
No new artifacts were written to DeveloperStorage. The private matrix is unchanged.

- Source-identified: `R/audit.json`, `audit.asm`; worker script asserts calls
  and source hashes. Panel writer remains a source gap.
- Delivered/implemented: commits above; no new native asset conversion.
- Tested: full `npm test` 1755 pass, 0 fail, 23 skipped, 1 TODO; typecheck and
  production build pass. Logs `R/test.log`, `typecheck.log`, `build.log`.
  Focused fit/renderer/painter tests cover source scalar equivalence, immutable
  assets, fixed geometry, invalid inputs, close-only/reduced endpoints.
  Independent read-only Sol/high review found no actionable issues.
- Browser-inspected: production `1fbfd6be`, seven routes, 93 motion pairs plus
  two endpoint pairs (95 total). Health close, Work close/switch, reduced motion,
  sleep, constrained30fps and mobile all present terminal20 and remain muted;
  zero page errors. Opened all seven motion sheets and desktop1150x693/mobile
  390x740 screenshots. Console is nonblank, framed and responsive; screenshot
  RGB standard deviations exceed56. Actual LCD motion/publication is recorded.
- Native-compared: seven fresh Azahar own400x480 PNGs at normal100% speed,
  including Health suspension and closing. Opened sequence and before/after
  diff sheets. These establish composition states, not matched input epochs.

`R/summary.json` SHA-256
`b256cda5e70595574732ec628ff22a2eb420a7fc2dd60a2b6b398e52ba092678`
tracks every final raw400x240/320x240 PNG, capture metadata, sheet, check log,
native sequence and restored config. Corrected fit report SHA-256
`7a5780ebe1aa055589076b11c435cdcbe4aaff5e7ba5ee6709178b69262b4e87`.

## Comparison and Residuals

Named composition pair: native `_02.10.26_08.20.50.671.png`, SHA-256
`a33cdb74b96f8456ba430be27e840977d8c6de71707bd5d3cdc47506eeb74afa`,
versus browser `after/captures/health-close-11` at terminal AppQuit20.
Reports and sheets: `R/comparisons/{before,after}/report.json` and `sheet.png`.
Mask is empty: population, HUD and phase residuals are intentionally retained.

| Diagnostic | Before | After |
| --- | ---: | ---: |
| Upper pixels above delta2 | 67471 | 45432 |
| Upper mean RGB delta | 51.596 | 4.978 |
| Panel region52,52,296x132 pixels above2 | 39015 | 20933 |
| Lower pixels above2 | 7837 | 6017 |

Upper source panel now disappears while the lower closing dialog remains,
matching the observed state. Remaining upper errors include live wallpaper
phase/HUD; lower population and HUD differ. The lower variation is not claimed
as this upper-only change's improvement. Both whole pairs remain **fail**.
Native input cadence, intermediate frame synchronization and cue timing are
unmatched. Muting precludes audible acceptance.

Still non-native/unproven: fitted panel alpha and cutoff, host transition epochs,
lower dialog parent fade-out, retained-app composition bindings, portfolio
content/banners, supplied HOME population and status adaptations. Other HOME
residuals and all previously open scenario gaps remain. H-10/H-12/L-04 are
partial; next target is native closing-dialog parent fade-out, then ordinary
input/motion/audio matching and baseline regressions. No whole scenario passes.

## Isolation

Only the coordinator drove native/browser on Sidecar. Native executable SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
isolated `native-close-clean-20261002/Azahar.app` under the parent of R.
Static input, Null output and volume0 were retained; no Spotify/system/mic
changes. Temporary HOME Shift and disabled touch mapping were restored after
native quit and PID absence. Speed remained100%. LaunchServices gives no exit
code; only absence is asserted. Secondary profile was not launched. Both
profiles/worktrees are preserved; worker chats are idle. No push or deployment.
