# Firmware 10.7.0-32E implementation

## Working agreement

The owner requests the supplied original European firmware's UI and bundled applications inside the existing 3DS portfolio. AR Games, Face Raiders, Activity Log, Download Play, Mii Maker and StreetPass Mii Plaza are excluded. The four latter exclusions were requested on2026-09-23; older saved layouts omit those titles while retaining all other positions/folders. Mii Selector and other remaining internal applets stay in scope. Portfolio apps occupy the first eight HOME positions. Browser media access is opt-in; Nintendo networking and unavailable peripherals reproduce offline behaviour. Do not claim full fidelity without native-screen comparisons.

The user requested faster delivery, then explicitly retained strict1:1 acceptance
even if it takes longer than the end of the day. Do not replace that standard
with a working-but-incomplete PR. All three separate worker tasks now use
GPT-6 Astra High, superseding the earlier Extra High preference.

The integration branch is `codex/firmware-os-10-7`. The original `uifix` checkout and existing OS worktrees remain preserved. Baseline changes are recorded under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/baseline`.

## Interfaces and ownership

- Asset worker: `scripts/firmware/`, existing DARC/CFNT converters, generated `public/os/firmware/10.7.0-32E/`, converter tests. Native layouts/animations are converted to JSON, texture/font images to PNG. Source packages, executables, keys, certificates and private saves must not enter public output.
- Runtime worker: new application host/registry/storage/capability modules under `src/os/`, changes to `system.ts` and `state.ts`, behavioural tests. Preserve existing reducers and portfolio data interfaces while adding stock titles and nested applets. Do not edit scene or screen-rendering modules.
- Presentation worker: native layout/model presentation modules, `screens.ts`, `portfolio-screens.ts`, bitmap-font integration, CGFX conversion tools and model-specific generated files. Coordinate JSON layouts directly with the asset worker. Do not edit `console-scene.ts`, `system.ts` or `state.ts`.
- Orchestrator: shared contracts, scene integration, audio extraction/playback, artifact paths, Azahar reference, browser verification, integration and PR. All UI automation is centralized.

These are the initial subsystem assignments. A committed slice contract takes
precedence for active work. For live HOME controls, the orchestrator owns
`system.ts`, `home-controls.ts`, browser adaptation and scene journals; runtime
owns the bounded pure controllers and presentation owns the screen painter.
See [the current tile-touch contract](home-tile-touch-contract.md). Reuse the
three separate worker tasks/worktrees, each on Astra High.

The entry manifest lives at `/os/firmware/10.7.0-32E/manifest.json` and has `schema: 1`, `firmware: "10.7.0-32E"`, `region: "EUR"`, `locale: "EU_English"`, source title/version/SHA records, relative `fonts.shared` and `fonts.hud` URLs, relative HOME pack URLs, title metadata, and converted resource size/hash/provenance records. Audio and model records can be appended by separate deterministic compilation commands without changing existing fields. All relative paths resolve against this manifest URL.

OS state and format types must remain independent of Three.js. Presentation receives state, injected calendar/monotonic time and assets. Upper logical pixels are 400×240, lower 320×240; retain the existing 800×240 upper canvas adapter and full-width UVs. No second React copy of OS state.

## Acceptance and evidence

Artifacts, temporary extraction, native and browser captures, recordings, logs and comparisons belong under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`, outside the repository. Each worker uses a separate subdirectory. Commit source, necessary browser delivery assets and concise provenance; do not commit scratch files.

First validate native text, HOME chrome, folder banner animation, selection, an effect and HOME music end-to-end. Then expand to included titles. Compare against Azahar at native display sizes and measure animation/audio timing. Passing parser tests or finding a file does not establish visual accuracy. Record unresolved records or rendering differences explicitly.

Run meaningful converter/behaviour tests, type checking, production build and actual browser interactions. Review failures before broadening. Workers commit only their owned changes, send commit IDs and tests to the orchestrator, and do not merge into integration themselves.

## Current HOME checkpoint

Native fonts/chrome, source folder/default banners, retained cursor/effects,
counted direction input, ordinary tile press/release, normal folder close and
native cues/sequenced HOME music are integrated. The renderer and runtime keep
source resource/controller evidence separate from browser scheduling and
lifecycle policies. See [live controls](home-controls-runtime.md),
[tile touch](home-tile-touch-integration.md) and their linked source reports.

The tile-touch checkpoint passed889 tests with two existing optional skips,
typecheck and production build. Its follow-up passed56 focused checks plus a
fresh build. Actual browser checks cover desktop/mobile pointer input, physical
controls, circle pad, keyboard, ordinary app handoff, reduced motion, fallback
and close. Nine static lower-screen regions preserve their prior comparison
metrics against the saved Azahar capture; this is not whole-screen parity.

Stationary long-press entry is now integrated through completed ordinary pickup
and vacant release; see [pickup entry](home-pickup-entry-integration.md).
The checkpoint passes924 tests with two existing optional skips, typecheck and
production build. Native positioning initialization, content binding and later
drag/drop/scroll behavior, broader opening and overlay lifecycles, missing
banner categories and included stock title packs/workflows remain unfinished.
Most stock application screens are still scaffolds. Azahar screenshots and
accessible menu actions are available, but the latest native keyboard/touch
attempts did not change HOME selection; fresh interactive reference capture
remains unresolved. The full goal and final implementation
PR are not complete; do not publish a finished-fidelity claim from this HOME
checkpoint alone. The next parallel work establishes the native keyboard
input/view contract and correct English Settings resources; see
[title expansion](native-title-expansion-contract.md).

## Native title infrastructure checkpoint

The multi-content converter and isolated lazy title loader are integrated.
[Extraction validation](firmware-multicontent-validation.md) records separate
Settings application/manual identities, unchanged HOME delivery bytes, and the
19 unresolved animation-binding audit errors. The integration's 18 synthetic
CIA/container checks pass; the asset worker also passed the two real-input
checks. No stock title was added to public delivery by this checkpoint.

[Loader validation](native-title-assets-validation.md) covers explicit selected
resources, exact content-specific font lookup, conflicting font identities,
cancellation and disposal. Its 35 focused checks, integration typecheck and
production build pass. The combined suite passes959 tests with two existing
optional skips and no failures. The loader is not connected to a stock app view yet.
Private integration logs use the `reference/native-title-loader-*` prefix;
converter checks use `reference/multicontent-integration-tests.log` under the
artifact root above. Native app composition, behavior and matched reference
pixels remain required before acceptance.

## Keyboard resource and local text checkpoint

Converter 1.3.2 and the renderer now support the QWERTY clips' native animation
sharing; all four original clips agree with the bounded ARM binding replay.
The initial Settings name text component preserves native cell colors, spacing,
UTF-16 indexing and the full-buffer cursor adjustment. Attached child layouts
now consume runtime parent overrides, with separate cache entries that preserve
draw diagnostics. See [animation sharing](native-animation-share-validation.md),
[text component](native-keyboard-text.md), and [local composition evidence](native-keyboard-invocation-contract.md).
The corrected English source replay preserves all earlier frozen local text
outputs; an unimplemented overlay material write remains explicitly recorded.
The coordinator verified all 115 indexed continuation files without mismatch.

The isolated [keyboard audio exporter](firmware-keyboard-audio-validation.md)
converts 15 original waves and records 19 cue bindings. The eight integration
checks pass, including sample-exact comparison with vgmstream and the bounded
native event probes. Gain/pitch/loop transport, host timing and the sequence
resource remain unresolved. Nothing new is published to the website by this
resource checkpoint.

Combined application checks pass 985 tests with six optional skips and no
failures; type checking and production build pass. A separate real-Canvas
regression run passes all 28 checks, covering the four Canvas tests skipped in
the broad run. The attachment-cache follow-up passes all five renderer tests.
Logs use `reference/native-keyboard-*` and `reference/native-parent-cache-*`
under the artifact root. The native keyboard remains unwired: full lower-frame
ordering/capture, interaction, audio transport and actual native/browser
comparison are still required. Other stock applications remain scaffolds.

## Keyboard selection and composition contracts

The [plain edit core](native-keyboard-edit.md) matches256 original ARM insert/
backspace cases. [Cursor and selection presentation](native-keyboard-selection.md)
matches154 original local updates and paints selection children between the
cell backgrounds and glyphs. Seven real-resource selection renders exercise
both directions, moved cursors, equal endpoints and the full ten-unit span.
This component remains separate from live input and applet lifecycle.

The [QWERTY component](native-keyboard-keys-validation.md) uses original labels,
retained per-pane animation submissions and the proven named-message style
boundary. Conversion text alone applies style220; dictionary and individual
character paths retain their authored metrics. The [global first-paint
contract](native-keyboard-invocation-contract.md#global-lower-first-paint-continuation)
now fixes CPU capture/update/draw order and retained frame values for the
immediately-ready resource scenario. All159 new indexed files were verified
without mismatch. Complete lower composition is the next presentation task;
source frame evidence is not native LCD pixel acceptance.

The [wave parameters](firmware-keyboard-audio-parameters.md) establish native
gain/pan/pitch/loop command preparation. The [return/cancel sequence](firmware-keyboard-sequence-validation.md)
now has a source-bound interpreter and original parser/envelope/backend replay
through final release-tail stop; all seven new integration tests pass. A
browser sequence/envelope port and audible hardware-equivalence checks remain.

The application suite now passes992 tests with15 optional-environment skips.
A separate focused keyboard/renderer run passes25 tests with no skips, including
four private keyboard checks skipped by the default run. Type checking and the
production build pass. Logs are in `reference/keyboard-text-selection/` and
`reference/keyboard-sequence-integration-tests.log`. No public keyboard pack or
live stock-app keyboard was introduced. No implementation PR is ready.

## Complete lower keyboard component and native arithmetic checkpoint

The [capture/settled lower composition](native-keyboard-composition.md) is now
integrated: seven roots and fourteen attached decoration instances, exact
retained submissions, three input lengths and both checkpoints. Its three
integration tests pass with all six real-resource renders. The Ada settled
render was inspected. The selector auto-fit/style and blank-text material write
remain explicit local gaps; this is not yet a live applet.

[Shared animation arithmetic](native-animation-curves.md) now matches3665
original HOME/keyboard float32 samples and34 native pane/material submissions.
The shared-sampler checkpoint passes994 application tests with15 optional
skips, plus39 real-Canvas/share checks without skips. Its production build
passes. Browser screenshot/reconnection attempts timed out; no new browser
fidelity claim is made. Azahar remains live but injected button/touch gestures
still do not change HOME selection.

[Ordinary nickname input](native-keyboard-input-contract.md) is integrated with
source-verified down/held/release, repeat, rejection latch, caret selection and
digital routing. The coordinator rehashed51 new evidence files without mismatch;
input plus existing plain edit tests pass37 checks. Physical-coordinate mapping,
confirm/cancel result lifecycle and live scene wiring remain separate.

The [keyboard sequence control port](firmware-keyboard-control-port.md) is also
integrated. Its13 focused checks pass with private original evidence, including
2792 ordered control/status observations and1481 original wave-command records.
It preserves natural and explicit-stop release tails; it does not yet supply
browser audio. Wave-voice conversion and transport integration remain required.
These subsequent isolated modules were checked with focused tests after the
shared-sampler full-suite run; that earlier count is not a new full-suite run
at this later HEAD. No final implementation PR is ready.
