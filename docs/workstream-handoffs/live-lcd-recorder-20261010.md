# Local Receipt-Time LCD Recorder

Worker: `applet_return_banner`, GPT-6.1 Sol high. Assigned checkout
`/Users/paramveer/.codex/worktrees/live-lcd-recorder-20261010/3ds-idea`, branch
`codex/live-lcd-recorder-20261010`, base `159142d893daea61865535bf76b1f05c2cb02758`.
The candidate commit containing this handoff is authoritative. STATUS is not
part of the candidate. No other checkout was edited.

## Captured Defect And Boundary

The coordinator's native GUI route could not access the current raw LCD/paint
receipt stream. Existing Download LCD capture invokes `captureScreensAt`, which
repaints an explicit fixed pose. CDP permission was refused; this candidate does
not change debugging, permissions, endpoints or security guards.

`console-scene.ts` now calls the recorder immediately after the existing
`screenPresented` JSON receipt is created after successful `renderer.render`.
This is before `presentNotesFooterClose` / `completeNotesFooterClose` and the
Notifications equivalent can paint a new HOME pair. The recorder checks the
receipt's exact paint identity and validPublication flag, then synchronously
encodes `screens.nativeTop` and `screens.bottom` using existing
`encodeNativeLcdPair`. The copied PNG strings and receipt/paint JSON cannot be
changed by a later paint. No screenshot repaint, seek, tick, clock advance,
forced draw, publication acknowledgement or compositor assertion is added.
All existing application/publication gates remain unchanged.

## Local Operation

Only a loopback URL with `?lcdCapture=1` mounts the visible Live LCD recorder
section. This uses `lcdCaptureEnabled(location, false)`, including development.
Remote URLs and local URLs without explicit opt-in mount no controls, listeners,
timers or recorder engine. The ordinary fixed-pose exporter is unchanged.

The section has Start, Stop, Save and Cancel buttons, an accessible live status
and saved-directory/error feedback. Ctrl+Shift+7 starts, Ctrl+Shift+8 stops and
Ctrl+Shift+9 saves. These shortcuts do not act in editable fields. Diagnostic
control events do not reach console handlers. Trusted console-key and pointer
down/up/cancel events within the host are observed without dispatching inputs;
editable-field events, untrusted events and diagnostic control events are not
recorded. Event timestamps are observation times, not recovered native inputs.

Start buffers only subsequent successful render observations. Stop retains
them. Save only operates after Stop and sequentially posts through the unchanged
same-origin `/api/verification/lcd-capture?lcdCapture=1` API. Each attempt gets a
fresh `live-lcd-<UUID>-<sequence>` scenario, including retries, so it cannot
overwrite fixed scenario captures or a previous attempt. Each capture.json
contains paired PNGs, copied receipt/paint, its sequence number, complete ordered
session inventory, observed input events, limits, stop reason and uncertainty.
The endpoint's configured root and fixed scenario directory layout remain the
only destinations. The final directory is shown in the UI; all returned paths,
failed attempts and uncertain in-flight cancellation identities are in the local
`data-live-lcd-recorder` status.

Already successful pairs are never resent on retry. A failed request may have
written files before its response failed; that uncertainty is explicit, and
retry uses a fresh path. Cancel discards buffered pairs and aborts a save without
claiming that the server rolled back. Disposal removes controls/listeners,
clears the duration timer, drops buffered pairs and aborts outstanding requests.
Starting cannot silently replace unsaved data; Save or Cancel is required.

## Bounds And Evidence Limits

Defaults: 30 seconds, 600 distinct paints, 96 MiB of serialized buffered data
and 2048 observed inputs. Timer expiry also stops an otherwise idle/hidden loop.
Same-paint renders are counted, not re-encoded; stale render receipts and
reappearing older paints fail explicitly. Hidden/context-lost/render-error or
invalid-publication observations stop with a partial recording. Encoding errors,
pair/export size limits, total byte/frame/input limits and save errors are
explicit. Both native LCD sizes are enforced by the existing encoder, and the
existing API enforces PNG signatures/dimensions and 8 MiB per exported pair.
Export metadata can independently exceed that API limit; this is an explicit
save failure, not a partial or silently truncated request.

Measured pair-encode overhead and largest observed render-receipt interval are
reported. Pair-encode overhead excludes receipt validation, deduplication, DOM
status updates and export. Synchronous PNG recording can change scheduling.
Neither render-return receipts nor recorded intervals prove browser compositor
acceptance, absence of dropped renders, recovered native cadence or native
input timing. Diagnostic controls and this instrumentation are local verification
adaptations, not native UI elements. Native visuals, audio, shader assets and
provenance are unchanged. Native1:1 remains unproven and audio unverified.

## Checks And Coordinator Handoff

Focused command: `node --test tests/live-lcd-recorder.test.mjs
tests/lcd-capture.test.mjs tests/lcd-capture-server.test.mjs
tests/notes-footer-close.test.mjs tests/notifications-footer-close.test.mjs
tests/applet-incoming-publication.test.mjs tests/system-transitions.test.mjs
tests/system-home-application-transition.test.mjs tests/home-banner-host.test.mjs`.
Result: 109 tests passed, zero failed/skipped. Includes current-vs-later-repaint,
paired receipt identity before footer mutation, first/repeat/stale observations,
hidden/context/invalid/error cases, all buffer bounds, trusted input filtering,
cancel/dispose and late responses, unique retry identities, partial/failed
outputs, local controls/shortcuts and zero remote/default mount work. Existing
capture/API and app transition/footer/banner tests remain passing.
`./node_modules/.bin/tsc --noEmit --incremental false` and `git diff --check`
passed. Installed dependencies are a read-only-use symlink to the existing
applet-return verification node_modules; no install or dependency edits.

Private logs and exact candidate diff:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/live-lcd-recorder-20261010/`.
Files: `focused-tests.log`, `typecheck.log`, `candidate.diff`.

Worker did not run GUI, servers or builds and did not touch frozen production
`c85b9b6` / port3028, API/security code, OS/state/effects/input modules, user
`system.ts`, native resources or audio. Coordinator must independently review,
run clean supporting checks, and test on the muted MacBook browser. Before
integration, visibly Start/Stop/Save a current raw pair using native controls,
verify both output PNG dimensions/hashes and the same receipt identity before
footer completion, inspect status/error feedback and test a regular app path.
Then record first/repeat Notes and Notifications closes. No scenario or native
comparison is accepted by these source tests; all whole-scenario claims stay
open. Browser inspection and real successful endpoint capture are pending.

## Review Corrections After 4d44e0f

The original candidate `4d44e0f1cedfd5635a3cbcef813200bd340669e5` and all its
logs remain unchanged. Coordinator full verification found 13 new scene-test
fixture failures and one unchanged historical Camera PNG failure. Independent
review also found lost failed-attempt history on retry and omitted trusted
X/Y/Q/E console key observations. This follow-up addresses those findings only.

The extracted `renderFrame` fixture now binds an inert recorder and host. Five
exact scene-policy source checks now include the added recorder calls while
retaining every prior context, visibility, sleep, lid, candidate-revocation and
publication assertion. No assertions were removed and no tests were skipped.
Console runtime wiring is unchanged from the original candidate.

Save retries no longer clear failure history. Failed and cancelled in-flight
attempts retain their unique scenario identity with `writeStatus: unknown`;
requests rejected before sending are labelled `not-sent`. Unknown response
validation stays within the in-flight attempt. Later successful retries keep
the history in the summary and copy it into subsequent exported metadata.
The direct fail-then-retry-success regression checks the failed path, fresh
retry path, unchanged successful path, complete scenario identity coverage and
history retention even after an additional fully-saved Save call.

Mounted observation now covers all existing console keyboard controls,
including KeyX/KeyY/KeyQ/KeyE, KeyM, plus/minus and numpad equivalents. The mounted
test dispatches trusted keydown and keyup observations for the complete list,
verifies exported event order, and checks that an untrusted event is excluded.
No app input bindings or dispatch behavior changed.

Corrected supporting results:

- Focused tests: 142 passed, zero failed/skipped. This is the earlier nine-file
  focused command plus the six affected scene-policy test files.
- Full `npm test`: 2746 tests, 2643 passed, one failed, 101 skipped, one TODO.
  All 13 new scene failures are cleared. The only failure is
  `tests/camera-date-group.test.mjs:44`, frozen HNI pair hash coverage, because
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`
  is absent. The same ENOENT is in the coordinator's original full log. That
  unrelated fixture was not altered or skipped; the full suite is not green.
- `./node_modules/.bin/tsc --noEmit --incremental false` and diff-check passed.

Separate private files under the worker evidence directory above are
`correction-focused-tests.log`, `correction-full-tests.log`,
`correction-typecheck.log` and `correction.diff`. Original `candidate.diff`,
`focused-tests.log` and `typecheck.log` are preserved. Coordinator's original
full log is under the sibling `live-lcd-verification-20261010` directory as
`full-tests-4d44e0f.log`.

No GUI, server, build, API/security, OS behavior, native asset or audio changes
were made during this correction. Exact independent re-review and real muted
MacBook raw-pair capture remain required before integration. No native1:1 or
whole-scenario acceptance claim is made.
