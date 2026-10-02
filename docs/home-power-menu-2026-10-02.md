# Power Menu Comparison - 2 October 2026

Runtime `82d26a8b` integrates source worker `25440bec`; coordinator input fix
`9db08e24` removes the extra footer touch action. Baseline runtime was
`5de1f381`, coordinator base `ff6ffe24`. Two existing worker chats used separate
internal worktrees and GPT-5.6 Sol/high; only the coordinator operated GUI.

## Delivered

- Source-identified: English HOME `lau_press_pow_u1` contains two 20-percent
  spacer spans. The source parser and opt-in newline advances restore their
  compact vertical spacing without altering other messages or glyph widths.
  Unsupported scaled glyphs, malformed controls and mismatched arrays fail
  explicitly. [Full source identities and parser contract](home-power-message-spacing-2026-10-02.md).
- Implemented: Power uses only `Slp_D_00/B_Btn_01`, rectangle `(66,166)` with
  size `188x36`, through `stock-screen-layout.ts`. `T_Btm_00` remains visible
  as a HOME-key hint but is not touch-interactive. Physical HOME/B routing is
  unchanged. Source and actual native held-touch positive control support this
  correction; exact physical-key cadence is not established.
- No extracted asset, native font, native audio or source archive was changed.
  Existing pack provenance, source content index and manifest limitations are
  recorded in the [comparison handoff](workstream-handoffs/home-power-menu-compare.md).

## Tested And Inspected

Full `npm test`: 1776 pass, 0 fail, 23 skipped, 1 TODO. `npm run build` and
subsequent `npm run typecheck` pass. Shader/material code was unchanged.
Focused tests cover touch boundaries from HOME/app, HOME/B recovery, parser
validation, total text height, unmodified defaults and renderer propagation.

Production runtime `82d26a8b` ran muted on Sidecar. From HOME and Health, Power
showed the sourced panels; footer pointer touch stayed in Power. HOME returned,
central Power Off touch shut down, and Power restarted to HOME. Physical
3D Power/HOME pointer targets also passed at 1150x690 and 390x700; both scenes
were inspected, nonblank and framed, with no page errors. These are browser
checks, not matched native motion acceptance.

Five before/after regression pairs cover Health main, Usage, scrolled Usage,
Settings main and Other Settings page 1. All five lower LCDs and both Settings
upper LCDs are byte-identical. Health upper has 244/275/308 pixels above2,
maximum7, in its animated background band; the live local Health clock was not
matched. Do not treat those three upper captures as exact regression matches.

## Native Comparison

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-native-20261002/`.

Native own-PNGs are in the sibling private
`native-close-clean-20261002/screenshots/`:
HOME-origin `_02.10.26_11.05.45.816.png` and app-origin
`_02.10.26_11.11.07.761.png`. Browser pairs are
`browser-before/{home-power,app-power}` and
`browser-after/{home-power,app-power}`. Named SHA-256 inputs, empty mask,
per-region metrics, reports and inspected contact-sheet identities are in the
[comparison handoff](workstream-handoffs/home-power-menu-compare.md).
`artifact-sha256.json` tracks91 private capture/report files across this slice.

HOME upper pixels above2 improve from7848 to4334, mean RGB8.954611 to1.748302.
Both after origins have the same upper result. The list blocks now align at
zero translation; 4331 list pixels still differ in text raster/coverage.
Lower remains668 above2, all in Power Off label coverage. App-origin
`Software closed.` is byte-exact in its 12000-pixel pane region. No layout
offset is justified for the remaining text residuals. Both whole scenarios
remain **fail**, with no private matrix change or1:1 claim.

Native Power used a500ms Shift-held input in the isolated clone; browser used
200ms `p` or physical pointer input. Health entry also differed. Browser raw
captures sample presentation at12000ms, not a shared native epoch. The native
footer no-op and central Power Off positive control used the same200ms touch
method. These establish bounded behavior, not matched input or motion timing.

## Safety And Remaining Work

The private Azahar executable retained its pinned SHA-256 and isolated profile.
Main PID87139 exited through Quit/Yes; absence was verified, but no exit code
was supplied by the GUI launch. After stopping, temporary Power Shift binding
was restored to V/default and mapped touch to true/nondefault. Static input2,
Null output1 and volume0 remain. No system, Spotify or microphone change.
Display geometry changed to Sidecar `(1920,367,1357,935)`; both existing windows
were verified at x1930,y397 before further interaction. New artifacts stay on
internal storage, not DeveloperStorage. User preview3033 was untouched.
Test Chrome84191/launcher24328 and temporary3022 were stopped. Intentional
preview3021 now runs runtime `82d26a8b`, PID34814; HTTP200, ready HOME, muted
true and no page errors were verified before closing the test browser.

Still non-native/unproven: Power list and button text raster, host phase clocks,
shutdown common-fade assembly, LCD/backlight/indicator ordering and exact
input/motion/audio. Audio remains muted by user request. Existing portfolio
population/content, HOME banner/HUD/backdrop and close-timing adaptations remain
as previously documented. Next: source-bounded text sampling at these captured
residuals, followed by native/browser recapture; not another guessed offset.
