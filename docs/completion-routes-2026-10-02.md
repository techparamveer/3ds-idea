# Completion Route Captures - 2 October 2026

This checkpoint is **browser-only navigation evidence**, not native acceptance.
The [workstream registry](feature-map/workstreams.md) records all eight initial
worker/integration commits. They add bounded tests and capture tickets. No whole
native scenario passes, no historical matrix was modified, and no Azahar process
was launched for these captures.

## Runtime and Isolation

Coordinator checkout is `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`,
branch `codex/home-fidelity-20261001`. First captures used the production bundle
at runtime `f5ed204c`; subsequent integrated commits through `75cab5e2` changed
only tests/docs. Camera physical-entry correction `b6afb008` integrated as
`38bab8b7`, then was rebuilt before the `camera-postfix-*` and `camera-touch-*`
captures. Touch follow-up `32b8bc60` integrated as `dda25e9e`, which was rebuilt
for all `camera-final-*` captures. Portfolio correction `dc9876b1` integrated
as `54497736`. No new native assets or rendering code changed.

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
All raw capture directories below are under
`R/lifecycle-captures/reference/scenario-matrix/v1/captures/<scenario>/browser/`,
with `capture.json`, `upper.png` (400x240) and `lower.png` (320x240).
`R/completion-integration/capture-index.json` inventories raw hashes and sampled
HOME counters; `index-captures.mjs` regenerates it from absolute input/output
paths. There is no native pair, acceptance mask or native diff for this record.

The dedicated browser profile is
`R/lifecycle-browser-egmu84`, agent-browser session `3ds-lifecycle-20261001`.
Browser launch used `--mute-audio`; app `data-muted` was read back as `true`
before captures and remained true after reload. System and unrelated audio were
not changed. Production verifier bound only to `127.0.0.1:3020`.

Fresh NSScreen metadata identified Sidecar at desktop `(1920,367,1357,935)`;
the test window was independently read back at `(1930,397,1150,780)` on current
Space 61. The initial blank browser briefly opened on the main display before
being moved; no app navigation/input/testing occurred there. All app checks
were performed after Sidecar placement. Neither worker chats nor the reviewer
operated GUI sessions.

## Observed Inputs

Captures use diagnostic presentation time `12000` ms and date
`2026-09-22T19:19:00.000Z`, without a banner-frame override. These parameters do
not establish a native event epoch. The recorded HOME count advances during
live HOME and remains stopped in an application. No precise input-hold or
return-frame cadence was measured in these smoke routes.

- Work: root selection 0, default two-row grid -> keyboard Enter -> application
  -> H -> HOME with Work suspended -> Escape -> close dialog -> Escape ->
  cancellation -> Escape and Enter -> no running application. An initial
  pointer click on the screen-reader-only A control had no observed effect;
  subsequent keyboard input to the focused console performed the route.
- Camera: keyboard activation of the existing Open Camera accessibility
  control -> focus console -> Enter through all five Welcome pages -> combined
  View Photos/Videos folder -> first photo -> Right -> Escape. Gallery before
  photo entry selected row 1; the original build returned to the date-group
  row 0. The `38bab8b7` build instead returned to photo row 1.
- Touch follow-up at `38bab8b7`: from gallery row 1, read the existing projected
  `Touch_160_137` target, then pointer down/up at page `(569,395)`. This opened
  the lower-middle buildings photo, row 4. Escape returned to row 1, revealing
  the direct-touch case missed by the first correction.
- Final `dda25e9e` build: repeat Welcome/folder/photo/Right/B, retaining row 1;
  tap the same `(569,395)` target, open the buildings photo, B returns to row 4;
  Enter reopens that photo, and a pointer tap on projected lower Back
  `(461,433)` returns to row 4 again. These final raw LCDs were inspected.
- Health: after closing Camera, keyboard-activate Open Health -> application
  -> H -> HOME -> H -> application. The lower Health main screen was byte-identical
  before/after resume; the upper differs because live presentation is not
  phase-aligned. This is not exact owner, input-timing or motion proof.

Two misnamed captures are explicitly excluded: `camera-touch-photo-before-20261002`
and `camera-touch-return-before-20261002`. The CLI rejected decimal mouse
coordinates, leaving the gallery visible; Escape then returned to folders.
Those files are retained and classified as failed-input observations, not
photo-entry/back evidence. The successful integer-coordinate replay uses
`camera-touch-photo-repro-20261002` and `camera-touch-return-repro-20261002`.

## Visible Defects and Corrections

H-12 remains open: Work and Health HOME-suspended upper captures still display
the selected banner and omit the decoded suspended-software window. Work's
native lower footer does change to Close/Resume. L-06's close confirmation is
the existing authored dialog, not a source-mapped native composition. No guessed
window/frame/activation predicate was introduced. The [HOME capture ticket](workstream-handoffs/home.md)
still needs native Health launch/HOME and matched browser comparison before a
window renderer assignment.

M-CAM-04 physical entry was visibly corrected at `38bab8b7`. Its four tests
cover Camera and camera-applet, rows 1 and 6, settled page state, Left/Right/B,
footer action and reopening the original photo. A GPT-6.1 Sol/Medium independent
review found the direct-touch gap above and a vacuous Portfolio assertion.
Both were returned to the owning chats under narrow reservations. No native
Camera behavior or full UI fidelity is inferred from this portfolio-data test.

Both findings are now closed: `dda25e9e` resolves the activated action against
existing gallery rows after photo validation, including date/combined offsets.
`54497736` tests actual navigation reduction effects instead of a fabricated
empty result. Independent re-review passed 17 focused tests and 12 additional
Camera touch-return tick/navigation cases; an unsolicited-link mutation now
fails the Portfolio tests. No further finding was reported.

All four sheets in `R/completion-integration/browser-before-after/` were opened.
Left is the buggy browser result, middle the final browser result, right the
heatmap. Empty masks preserve every pixel. Physical return changes only 2,296
lower pixels above 2/255 (selection frame), with zero upper change. Touch
return also moves 2,296 lower selection-frame pixels; the upper correctly
changes from the stale Renu preview to the selected building (75,113 pixels
above 2/255). These are changed-pixel counts, not native mismatch scores.

Report `browser-before-after/report.json` SHA-256:
`563d37818c54efab8d75366311e59d146842fd7c35fafab4d3670ee81e3a5e85`.
Capture index SHA-256:
`792a6bb612205fa770392d9636d931e63dedd77ce5038d3946efb3ed8104a2a6`.
The index contains 33 observations, including the two excluded failed-input
files; it does not represent 33 accepted scenarios.

## Raw Identities

Full hashes are retained in the private index. Selected raw PNG identities:

| Scenario | Upper SHA-256 | Lower SHA-256 |
| --- | --- | --- |
| `work-home-suspended-20261002` | `230a7a961aa8ee277579be348bf9ea00252f1d8429dfaf5d9c16b882032e3df4` | `06bc8f58fd9b7ab07f4c0596009ac2feaf5abcaf4176c974a2b08efbcb84106a` |
| `work-close-dialog-20261002` | `e9d61cecad227a7206129bfc1cbfa6da71d6a0f96d46b6d781c8b80b2fbf098a` | `bd918cab7977ea418eb3335659c92b28328b42d5ea6be629a55b20fd416cddd3` |
| `health-home-suspended-20261002` | `2628192c5545efa1b193beb3a5d5b93d517ce0a670f6095eb4d082d668ada606` | `d07bb2149946d3aee7abecf6e181e946b958d7f13fd472efd9c56c70e88ffbc9` |
| `camera-gallery-before-20261002` | `d6086990d1e1c249573f1daa1e489a1c814516178b5875d339a93956b4743ff3` | `b2194e7eb11e9b09278b7901e1e69c6e42e864b93333871e035a826d9f889fda` |
| `camera-gallery-return-before-20261002` | `d6086990d1e1c249573f1daa1e489a1c814516178b5875d339a93956b4743ff3` | `cd20459bb4c8f69d32a838955c4672ec1ad1ef020ff9ed44fa1965175eb46414` |

## Evidence Boundaries

Source identities remain the existing Camera native pack and HOME launcher
manifest/provenance documented in the lane handoffs. No conversion or resource
was regenerated. Portfolio photos/title/icon/population, offline service flows,
the authored close/switch and HOME Design UI, fitted native composition and
unproved timing remain non-native or explicitly unaccepted. Sound has no supplied
songs. Every session stayed silent; audio acceptance remains open.

Checks at `75cab5e2`: 1,595 pass, zero fail, 23 skip, two TODOs and typecheck.
At `38bab8b7`: 1,599 pass, zero fail, 23 skip, one TODO; typecheck and build pass.
Final `dda25e9e`: 1,605 pass, zero fail, 23 skip, one TODO; typecheck/build pass.
No shader/material edit requires a new shader run. Source identification,
implementation, tests, inspected browser frames and native comparison are
separate evidence tiers. The last tier remains pending here.

Dedicated browser PID 67422 was closed and confirmed absent. Production server
and all coordinator test/build/typecheck sessions finished or were stopped.
Unrelated applications and the separate user's browser were not operated. No
push, shared-branch merge, deployment or new DeveloperStorage artifacts.
