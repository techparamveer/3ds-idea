# Camera workstream handoff

Checkpoint: `f5ed204c`, 1 October 2026. Feature IDs: M-CAM-01 through
M-CAM-06. This bounded slice records route readiness only; it does not add a
native visual, input-timing, motion or audio acceptance claim.

## Delivered route contract

`tests/camera-completion-routes.test.mjs` adds one compact physical-button
journey across all five Welcome pages, final OK, the generated combined
`View Photos/Videos` folder, a six-cell page boundary, and physical photo
Left/Right. Two smaller cases cover the post-Welcome empty destination and the
internal `camera-applet` starting directly at the shared folder route. The
intended photo-B selection invariant is a TODO because the audit found the
deterministic reserved-file defect below; no intentionally failing test is
committed.

The existing tests remain authoritative for detailed strip arithmetic, held-key
cancellation, touch geometry, production-image uniqueness, direct cell touch,
source rendering and publication. This test adds the joined route invariant and
does not restate those lower-level cases.

Capture, Shoot, Settings and zoom actions stay inert. That is the explicit
read-only portfolio policy, not evidence of the native controls' input, motion
or visual fidelity. A new Camera application instance still repeats Welcome:
no firmware-backed seen-state or invented persisted flag was added.

## Deterministic route defect and patch proposal

Minimal reducer repro, with any gallery whose selected row is nonzero:

1. Enter `camera/gallery` and select row 6.
2. Open that row's `photo:*` action.
3. Observe `camera/photo` has `selection: 0` even though the selected photo ID
   is correct.
4. Press B; the gallery returns at row 0 rather than row 6.

Cause: `stock-apps.ts` opens the photo through
`withScreen(state, 'photo', { photoId })`; `withScreen` resets selection to 0.
That file is coordinator-reserved. The narrow proposed hunk is to preserve the
opening row explicitly:

```ts
withScreen(state, 'photo', {
  photoId: action.slice(6),
  selection: num(state.selection),
})
```

After integration, replace the TODO with the route assertion: physical
Left/Right may change `photoId`, and physical B must restore the original
nonzero gallery selection and its matching `footer.right.action`. This is a
semantic navigation fix only; it makes no native visual claim.

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
7. B down/up: the intended contract is return to gallery selection 1, the
   selection that opened photo view. The current source deterministically
   returns selection 0; do not mark this scenario route-complete until the
   reserved-file patch above is integrated and the TODO becomes a passing test.
   Capture the actual result if replayed before that fix.
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
  unchanged by this tests-only slice.

## Workstream policy acknowledgement

The 1 October coordinator update supersedes the older model preference in this
checkout: workstream chats use GPT-6 Astra with high reasoning; a bounded helper,
if one is later authorized and genuinely needed, uses GPT-6.1 Sol with medium
reasoning. No helper was created for this task. This already-running turn does
not claim its model changed, and no claim is made that Fast mode was disabled
because the available messaging surface provides no such settings evidence.
