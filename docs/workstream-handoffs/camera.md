# Camera workstream handoff

Checkpoint: 2 October 2026. Initial route slice `ad4b403a` (base `f5ed204c`)
was integrated as `bf4e8350`; physical-return fix `b6afb008` was integrated as
`38bab8b7`. This M-CAM-04 touch follow-up starts from
`b6afb0087970b3cdc9c500865c987517bc13f081` under the coordinator's exclusive
Camera photo-entry reservation. M-CAM-01 through M-CAM-06 remain the lane scope.
Native visual, input-timing, motion and audio acceptance remain open.

## Touch and direct-action return correction

The physical-return fix retained keyboard focus. A touch can activate a
different photo, so retaining that focus still restored the wrong row. The
validated Camera photo-entry action now derives its selection with
`rows(state, context).findIndex(item => item.id === action)`. This uses the
existing row list, including its optional date-group offset. The existing
photo-ID validation remains in front of this lookup; no gallery-touch or
shared input handler change was needed.

Six new regression tests exercise 36 routes across Camera/camera-applet and
combined, dated single-folder and undated single-folder fixtures. Each checks
an unfocused row on the initial page and on a settled scrolled page: touch then
physical B, touch then photo-footer Back, and direct action then physical B.
They assert the activated photo's return highlight, matching footer action,
unchanged folder and settled browse state, and successful A reopening. Missing
photo actions remain inert. The four prior physical Left/Right-return cases
continue to pass.

All six new tests reproduced stale row 1 instead of tapped row 4 before the
fix. Afterward,
`node --test --test-reporter=spec tests/camera-completion-routes.test.mjs tests/stock-apps.test.mjs tests/camera-browse.test.mjs`
passed **72 tests, 0 failures, 0 skips, 0 TODOs**. No image loading or GUI is
part of these reducer tests.

Coordinator evidence uses the capture root recorded below. From production
combined-gallery row 1, tapping lower LCD `(160,137)` (page `(569,395)` at the
recorded window geometry) opens `buildings-3` at row 4; physical B previously
returned to row 1. Valid pre-fix `browser/capture.json` identities are:

| Scenario | SHA-256 |
| --- | --- |
| `camera-touch-photo-repro-20261002` | `bde374240b16e7872ae368c9e44042e5cf1b2f244c3f4fea349aa572e0f246bd` |
| `camera-touch-return-repro-20261002` | `81449fe5090a8b5ce683c38f6434b66026acd8bd34033f03eabb753af3041fe8` |

Worker metadata/hash checks confirm these identities and 400×240/320×240
targets; visible observation was supplied by the coordinator. Exclude
`camera-touch-photo-before` and `camera-touch-return-before`: the failed
decimal-coordinate CLI attempt recorded gallery/folders, not photo/Back.
The coordinator reports the previous physical fix passed integrated checks
(1,599 pass, 0 fail, 23 skip, 1 TODO; typecheck/build) and visibly restored the
first photo on keyboard return. This touch correction still requires its own
integration, full checks and production recapture. No native behavior
acceptance is established by either portfolio route.

## Delivered route contract

`tests/camera-completion-routes.test.mjs` adds one compact physical-button
journey across all five Welcome pages, final OK, the generated combined
`View Photos/Videos` folder, a six-cell page boundary, and physical photo
Left/Right. Two smaller cases cover the post-Welcome empty destination and the
internal `camera-applet` starting directly at the shared folder route. The
former photo-B TODO is now four passing regressions: Camera and camera-applet,
each at row 1 and row 6, retain the original selection, settled strip state,
page position and footer action after physical Left/Right then B. A subsequently
reopens the originally selected photo even when B left a different photo visible.

The existing tests remain authoritative for detailed strip arithmetic, held-key
cancellation, touch geometry, production-image uniqueness, direct cell touch,
source rendering and publication. This test adds the joined route invariant and
does not restate those lower-level cases.

Capture, Shoot, Settings and zoom actions stay inert. That is the explicit
read-only portfolio policy, not evidence of the native controls' input, motion
or visual fidelity. A new Camera application instance still repeats Welcome:
no firmware-backed seen-state or invented persisted flag was added.

## Previous physical selection-loss correction (`b6afb008`)

Minimal reducer repro, with any gallery whose selected row is nonzero:

1. Enter `camera/gallery` and select row 6.
2. Open that row's `photo:*` action.
3. Observe `camera/photo` has `selection: 0` even though the selected photo ID
   is correct.
4. Press B; the gallery returns at row 0 rather than row 6.

Cause at the previous checkpoint: `stock-apps.ts` opened the photo through
`withScreen(state, 'photo', { photoId })`; `withScreen` resets selection to 0.
That delivery preserved the keyboard opening row explicitly (superseded by
the activated-row lookup above):

```ts
withScreen(state, 'photo', {
  photoId: action.slice(6),
  selection: num(state.selection),
})
```

All four new regressions failed at the returned row (actual 0 versus expected
1 or 6) before the one-line correction. The focused command
`node --test tests/camera-completion-routes.test.mjs tests/stock-apps.test.mjs tests/camera-browse.test.mjs`
then passed **66 tests, 0 failures, 0 skips, 0 TODOs**. The tests use a synthetic
eight-photo, two-folder fixture; they load no image pixels. Row 6 settles at
strip offset 86 before opening, and the full browse state survives the return.

The coordinator visibly reproduced the original defect with production
portfolio data on muted Sidecar: keyboard-activate Open Camera, focus console,
A through five Welcome pages, A into the combined folder, A into the first
photo, Right, B. It reported the red selection frame moving from photo row 1
before entry to the date-group row 0 after B. Raw upper/lower PNGs and
`browser/capture.json` are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/lifecycle-captures/reference/scenario-matrix/v1/captures/`,
with these scenario directories:

- `camera-gallery-before-20261002`
- `camera-photo-first-20261002`
- `camera-photo-next-20261002`
- `camera-gallery-return-before-20261002`

Their `browser/capture.json` SHA-256 values, in the same order, are:

```text
320e85cb0c1b5e461fe0d953de71bd1cd34a7f14d53522d5c86f8adbfa6fa422
edb6a93d673de763bb2586daf070947997808e38f2f43165ef8b13346c38360b
2b9c0e7d24a324ac9dcc0f08df8bd6f9448d115bf71341b9f25ee6b1ad8cfdb4
6d9f5cc2f6e9495b74af9577fee4f29dbc726e8bcfefee58d8c7f846288abe80
```

This worker read the capture metadata (400×240 upper, 320×240 lower) and ran
reducer tests. The subsequent coordinator integration/keyboard observation is
recorded above. Native comparison remains pending. No new native resources,
masks, diff reports or acceptance claims are supplied.

## Exact production state

Default `portfolioMedia` is derived from the first unique image URLs already in
the eight portfolio apps, in this order:

1. `renu/renu-1` — `/portfolio/renu.jpg`
2. `buildings/buildings-1` — `/portfolio/building1.jpg`
3. `buildings/buildings-2` — `/portfolio/building2.jpg`
4. `buildings/buildings-3` — `/portfolio/building3.jpg`
5. `mission/mission-1` — `/portfolio/hackuk-event.webp`

Because three folders and five photos exist, the application main route creates
`folder:portfolio-camera-all`, labelled `View Photos/Videos`, before the three
source-content folders. Opening it creates gallery rows
`camera-date-group`, `photo:renu-1`, `photo:buildings-1`,
`photo:buildings-2`, `photo:buildings-3`, `photo:mission-1`; the undated group is
display-only and selection starts at row 1. This is a portfolio-content
adaptation. It is not a native SD-card fixture.

For a content-identical native/browser comparison, use only the existing
loopback `?cameraFixture=hni` fixture. It serves the two private, Camera-created
HNI files without publishing them: `HNI_0001` and `HNI_0002`, both dated
2026-09-25. That fixture presents one folder already labelled
`View Photos/Videos`; it therefore verifies the folder/gallery/photo route but
does not itself exercise construction of the default five-photo combined
folder. Do not merge the two claims or use the portfolio JPEGs as native MPO
equivalents.

## Coordinator replay: `camera-readonly-view-photos-page1`

Start native and production from equivalent fresh Camera Welcome page 1 state,
with the explicit HNI fixture selected in production and the matching two-photo
isolated SDMC state in Azahar. Keep both muted and on the verified Sidecar
desktop. Record each down/up pair and inspect after every input.

1. A down/up four times: Welcome pages 1 -> 2 -> 3 -> 4 -> 5.
2. A down/up once on page 5 OK: enter the folder grid.
3. A down/up on `View Photos/Videos`: enter gallery page 1. Expected browser
   rows are the 2026-09-25 date group, `HNI_0001`, `HNI_0002`, with selection 1.
4. Capture both raw LCDs before opening a photo.
5. A down/up: open `HNI_0001`.
6. Right down/up: show `HNI_0002`.
7. B down/up: return to gallery selection 1, the selection that opened photo
   view. The corrected reducer passes this contract; capture both raw LCDs
   after integration to confirm the visible result.
8. Separately touch the visible Shoot/Settings/zoom chrome at coordinates
   derived from the current source panes, confirm no route/state change, and
   record that as the read-only adaptation. Do not guess hit rectangles from
   this handoff; the current browser intentionally publishes no targets for
   those panes.

Use empty masks for structural/native chrome comparisons first. If photo pixels
must be excluded, add only a reasoned content-region mask with exact bounds and
retain an unmasked report. The current populated comparisons have unmatched
input/clock history and whole-screen residuals; no existing pair accepts this
scenario.

## Remaining evidence gaps

- Welcome seen-state persistence, repeated-guide native policy and later-page
  guide timing/audio are untraced.
- Browse paging timing, slider Rate fit, Parakeet phase and dynamic scene
  replacement are unaccepted adaptations or gaps.
- Read-only Shoot, Settings and zoom chrome has no implemented action and no
  source-derived browser hit geometry.
- Portfolio JPEGs have no native MPO equivalence. The HNI fixture is private
  verification data and is not product content.
- Paired-LCD native readiness, owner/generation guards and publication remain
  unchanged by this photo-entry correction.

## Workstream policy acknowledgement

The 1 October coordinator update supersedes the older model preference in this
checkout: workstream chats use GPT-6 Astra with high reasoning; a bounded helper,
if one is later authorized and genuinely needed, uses GPT-6.1 Sol with medium
reasoning. No helper was created for this task. This already-running turn does
not claim its model changed, and no claim is made that Fast mode was disabled
because the available messaging surface provides no such settings evidence.
