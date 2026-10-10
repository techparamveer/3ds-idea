# Exact-window native recorder handoff

10 October 2026. Implementation by GPT-6.1 Sol high in
`/Users/paramveer/.codex/worktrees/azahar-window-capture-20261010/3ds-idea`,
branch `codex/azahar-window-capture-20261010`, base
`11c10b47b86165f3425beac97234e6d6cc48e395`. Only three owned paths change:
`scripts/reference/azahar-window-record.swift`,
`tests/azahar-window-record.test.mjs` and this handoff. No application source,
public asset, dependency, profile, shared build or original capture changes.

## Captured defect and scope

The preserved red signal is private `toprow-current-20261010/native-audit-sol-high-v1/report.md`,
SHA-256 `994de9f43125f08f3d7c11f5cab0a4fe06a42fc95edbac6cae5b4cfc9ddb8dda`.
All twelve previous display movies have Codex, not Azahar, in all sixty fixed
scope samples and every exact final frame. They remain excluded from native
motion evidence. The thirteen valid native own PNGs are endpoints only.

This tool captures one explicitly supplied window through
`SCContentFilter(desktopIndependentWindow:)` and `SCRecordingOutput` on macOS15+.
There is no display filter, desktop crop, picker, app activation, input injection,
permission request, microphone or audio capture. Local SDK declarations in
`ScreenCaptureKit.framework/Headers/SCStream.h` and `SCRecordingOutput.h`
define the APIs used; no codec installation or repair is involved.

## Contract

All recording arguments are required: positive PID/window/display IDs, bundle
ID, canonical absolute executable path, exact lowercase executable SHA-256,
current display and window bounds, duration2..90 seconds and an unused absolute
output directory whose real parent already exists without symlink aliases.
The tool claims that directory atomically with mode0700. It never overwrites
an existing output. Failed/partial output stays in the claimed directory.

The tool refuses absent `CGPreflightScreenCaptureAccess` permission without
calling a grant-request API. The live path checks NSRunningApplication and
the exact CG window's owner, layer, on-screen state, bounds, executable and
launch identity. The supplied display must be active, built-in and match
the supplied bounds, with the window wholly contained. The SCWindow must
independently match PID, bundle, ID and frame before constructing the filter.
Identity is checked again after discovery, every250ms during the bounded
interval, and after successful recording finalization. The executable bytes
are hashed before and after; intermediate identity checks reuse the initial
hash while checking process launch/path/window identity. A process replacement,
window change or identity mismatch fails the run without fallback.

Full-window pixel dimensions come from filter contentRect times pointPixelScale.
Unsupported/nonfinite/oversized/odd dimensions fail rather than resize to fit
H264. The tool excludes window shadows, child windows and cursor explicitly.
It requests a host maximum frame interval of1/60s, which is not a native
cadence measurement. `capturesAudio` and `captureMicrophone` are both false.

The output delegate must report started and finished without failure. A
`recording-started` stdout line follows the delegate start and metadata update;
it is not a native input epoch. Start/finalization waits have ten-second limits.
A process watchdog bounds even nonreturning SDK calls at requested duration
plus30 seconds and writes failed status before exit124. Normal failures exit1;
only validated finalized output exits0. The tool does not activate or close the
target app or edit its profile. External force-kill or a full/unwritable disk can
prevent final status updates; incomplete status/output is never success.

Final validation requires one video track, zero audio tracks, the requested
pixel dimensions, positive finite duration and a decodable first movie frame.
Outputs are `recording.mp4`, `first-video-frame.png` and `status.json`. The PNG
is decoded from finalized H264, not a lossless native screen sample. Status
records request, before/after identity, content scale, delegate/completion
state, hashes and this limitation. A complete tool run still leaves native
content scope unverified until coordinator inspection. No400x480 raw-LCD,
native timing, input epoch, pixel fidelity or whole-flow claim follows.

## Build and offline checks

Private artifact root `O` is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/window-recorder-tool-v1`.

From the assigned worktree, the exact build command was:

```sh
xcrun swiftc -parse-as-library -swift-version 5 -target arm64-apple-macos15.0 scripts/reference/azahar-window-record.swift -o /Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/window-recorder-tool-v1/azahar-window-record
```

It exited0 without warnings. Binary SHA-256 is
`38de24f07f2149be4b7df524ad3811d35a311d4a347942ea3b666375dfaaed54`.
Source SHA-256 is `f1a472620812c0b542cc37af1af467c70c27d31bb4b3172171eeab229d0741f1`;
focused test SHA is `e80814b3821870ddde17c597cd07a3dde84f5917c8c21d9fd9eaa15f72f03ae3`.

```sh
AZAHAR_WINDOW_RECORDER_TEST_OUTPUT=/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/window-recorder-tool-v1/checks node --test tests/azahar-window-record.test.mjs
```

All30 tests pass, zero skips/failures, exit0. The test recompiles the real Swift
source against the installed SDK and calls its actual offline request,
identity and completion validators through fixture JSON. It checks positive
identity, missing grant, output collision, stale/wrong PID/window, bundle,
executable/hash, display/bounds/layer/visibility, process replacement,
incomplete/error finalization, audio, dimension mismatch and empty movie.
`--help` and `--self-test` both exit0 without querying applications or capture.
Fixtures do not exercise live enumeration, capture callbacks or OS permission
behavior; only a reviewed coordinator pilot can check those paths.

| Private check | Exit/result | SHA-256 |
| --- | --- | --- |
| `checks/compile-final.log` |0, empty/no warnings|`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`|
| `checks/focused-final.log` |0,30 passes|`49035284b7bd28402b68ae1b6d17a0a0149a13403f9030c39f57acfcdc9e334f`|
| `checks/self-test.log` |0, offline passed|`1b3ca5c9fe0ad1520eb146562d54d7416ad438ed9aba52048e325e5da189e86a`|
| `checks/help.log` |0|`7486f53291a1b3620c8072415aa52b4862a60d7d87052a9b765df761797576a2`|

`git diff --check` passes. No application test/build/typecheck was run because
this Swift-only capture-tool slice changes no application contract and must
leave the served source/dependencies/build frozen. No live capture, GUI,
grant query or permission prompt was performed by this worker. All finite
compile/test handles are closed.

## Coordinator pilot, after independent review

Use the compiled binary with fresh observed identities, not copied stale IDs:

```sh
"$RECORDER" --pid "$PID" --window-id "$WINDOW_ID" --display-id "$DISPLAY_ID" \
  --bundle-id "$BUNDLE_ID" --executable "$ABSOLUTE_EXECUTABLE" \
  --executable-sha256 "$EXECUTABLE_SHA256" \
  --display-bounds "$CURRENT_MACBOOK_BOUNDS" --window-bounds "$CURRENT_WINDOW_BOUNDS" \
  --seconds 2 --output "$UNUSED_ABSOLUTE_PILOT_DIRECTORY"
```

First pilot the currently idle main window. Wait for exit0 and inspect actual
movie pixels plus `first-video-frame.png`; metadata alone did not establish
scope for the prior failed display recordings. Only after that scope check,
load pinned HOME through ordinary coordinator GUI, obtain the separate render
window's new ID/bounds and run a second unused-directory pilot before animation
inputs. No window ID or loaded-title assumption is hardcoded. Keep all failed
pilots and do not fall back to display recording if this path is unavailable.

The tool captures ordering/motion observation only. Azahar's own PNGs retain
the raw endpoint role. Native9/browser8 remains an explicit content mismatch.
No UI, assets, native cue, font or native graphic changed. Prior footer and
banner timing/boundary adaptations remain labelled; all whole flows still
fail/unproven and audio acceptance remains unverified while muted.
