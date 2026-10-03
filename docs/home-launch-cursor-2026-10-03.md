# HOME Launch Cursor Retention

Runtime `4cefc716` (worker `b74240ec`), test follow-up `eabdc91e` (worker
`aa57262d`), base `f0fc9bd8`. This pass corrects the launch-onset residual
where the browser dropped the selected icon's green brackets on the first
launch paint. It reuses the frozen native capture from the
[launch onset pass](home-launch-onset-2026-10-03.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-cursor-20261003/`.

## Visible Defect

Native lower LCDs keep the brackets on the selected Health icon from the Open
press (N065) while HOME fades (N070..N082) until black (N085). The browser's
native cursor group in `grid()` was gated on phase `home`, so it vanished at
launch B000.

## Change

`grid()` takes `launchRetained`, passed from the existing retained-launch
eligibility (`launchPresentation`: exact selected/runtime owner plus a
settled, matching banner host). With it, phase `launch` keeps the native
cursor and its effects beneath the source fade. Pending, stale, helper,
applet, expanded-suspended and capture paths keep the prior cursorless flow.
HOME controls do not tick during launch, so the cursor holds its hand-off
loop/scale pose; native bracket pulse motion during launch is not traced and
remains an adaptation. No asset changed; the cursor uses the existing
`home.launcher` mapping.

## Verification

Worker: new painter test fails without the change and passes with it; full
suite has only the 36 known sparse model failures; typecheck passes.
Independent review: no blocking finding. It noted the frozen cursor motion
(recorded above) and suggested asserting cursor position instead of the
untraced effect; applied in `aa57262d`.

Integrated `4cefc716`: full suite 1992 pass, 0 fail, 23 skip, 1 TODO;
typecheck and production build pass (`R/build-integrated.log`).

## Native/Browser Comparison

Same production preview (127.0.0.1:3021), dedicated muted CDP 9320 browser
and collector as the [logo order pass](home-launch-logo-order-2026-10-03.md)
(`R/browser-launch-cursor.mjs`, identical SHA `fd983a52...`). Run
`R/after-desktop`: actual Enter/A, 70 pairs, terminal C14 before app, mute,
errors `[]`, complete cleanup. `result.json` SHA
`622e1e25a94d98e74dc817a16062f22c962afd9e3e8db692d0ce64d73f33a488`.

The coordinator inspected `R/cursor-sheet.png` (native N065..N085 lower above
browser PRE and B000..B008), SHA
`de265ad3028be922bfe70dfac82d91ee96554182005d1ffadfb239a4015c838b`:
brackets now stay on the Health icon through the browser fade, as native.

The frozen onset comparator `compare-onset.mjs` (direct coordinates, zero
shift, empty masks, no phase search; unsynchronized epochs) was rerun on this
run and on the logo-order run. Like-for-like N065 versus first launch paint
B000 (under 1ms browser elapsed):

| Region MAE | `b4077380` | `01cc3224` | `4cefc716` |
| --- | --- | --- | --- |
| selected icon | 1.7971 | 1.7971 | 0.7135 |
| lower whole | 8.0264 | 8.0264 | 7.3050 |
| upper whole | 22.8709 | 3.8597 | 3.9224 |
| footer | 45.8364 | 45.8364 | 45.8364 |

Reports: `R/semantic-anchor/report.json`, SHA
`b1db1dc3c3ccd975718b2068d6e397e4bdd7156b7fd2d5f4185bea4fb42dfcee`;
logo-order rerun SHA
`86a768b3600c3f094a80e61c5c4c66ca24a167d14c9f6a7eaf486e0df9e64e46`.
"First presented" anchors fall at different browser elapsed times per run and
are not compared.

## Remaining

Native shows a green glow growing on the selected icon during the fade
(N078, N082); the browser has none. Native Open shows dark pressed feedback
(N065) then white (N070); browser Open keeps its idle tone (footer MAE
unchanged). Native black dwell, epoch, cadence, input, audio and HUD pixels
remain open. Mobile/reduced not rerun. Whole-scenario status remains fail.
