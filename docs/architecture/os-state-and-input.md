# OS, state and input architecture

## Current portfolio scope

[The current scope](../portfolio-ui-scope.md) supersedes the earlier full-firmware
workflow descriptions below. Stock apps now expose their UI and basic navigation;
software keyboard and device capture/import paths are not registered or reachable.
Camera reuses portfolio photo folders. Sound is a real player for the user-provided
track manifest, currently empty. Legacy converters, keyboard modules and capability
utilities remain preserved research; their presence is not a delivery requirement.

`stock-screen-presentation.ts` owns stock screen image caches and asynchronous
per-instance native assets; `screens.ts` synchronizes its owner even when the
console is off. Settings consumes native layout/texture/message packs. Gallery
and music presentation use the shared `stock-screen-layout.ts` hit geometry.
`portfolio-music.ts` owns the single foreground audio element, while
`runtime-effects.ts` checks owner/revision and routes progress into reducers.
See [stock UI runtime](../stock-ui-runtime.md) and
[screen presentation](../stock-screen-presentation.md) for current verification.

## Modules

| Module | Responsibility |
| --- | --- |
| `apps.ts` | Portfolio application and entry data |
| `state.ts` | HOME Menu layout, folders, themes and low-level menu types |
| `system.ts` | Boot, HOME, launch, suspend, app, dialog, power and persistence transitions |
| `layout.ts` | Native screen geometry and hit regions |
| `screens.ts` | HOME Menu and system-panel canvas painting |
| `portfolio-screens.ts` | App icons, banners and application interiors |
| `bitmap-font.ts` | Parsed HOME font metrics and glyph drawing |
| `resources.ts` | Validated optional firmware-derived resource loading |
| `native-chrome.ts` | Authored/cropped native chrome asset loading |
| `audio.ts` | Gesture-unlocked sound decoding and playback |
| `system-transitions.ts`, `native-system-presentation.ts` | Browser boot/launch/shutdown timing and source HOME power/fade rendering |
| `native-keyboard-audio/sequence.ts` | Isolated `common_back` sequence controls, counted native updates and release-tail ownership; transport integration pending |
| `animation.ts` | Layout animation sampling utilities |
| `app-types.ts`, `app-registry.ts`, `app-host.ts` | Firmware contracts, installed titles and applet lifecycle |
| `app-input.ts` | Phase-aware input normalization and shared-clock repeats |
| `home-input-producer.ts` | Native poll/event arithmetic used by the live HOME host |
| `home-input-sample.ts`, `home-input-adapter.ts` | Native independent digital/axis edges and explicit browser pulse adaptation |
| `home-scroll-consumer.ts` | Native direction/focus/mode3 arithmetic and ordered cue, cursor and banner observations |
| `home-navigation-pass.ts` | Pure ordinary input/lower/Loop composition with ordered observations and explicit eligibility; live integration pending |
| `home-cursor-presentation.ts`, `home-primary-cursor.ts` | Retained Scale/effects and independent primary visibility/position |
| `home-controls.ts` | Live native HOME sampling, lower tasks, cursor footer/controllers and counted observation journals |
| `home-tile-widget.ts`, `home-tile-pose.ts` | Pure native ordinary tile input/2D controllers and last applied pose writer |
| `home-tile-touch.ts` | Browser touch edges, widget capture scan and per-container pose storage |
| `home-tile-pickup.ts` | Retained ordinary pickup/blank Scale submissions and explicitly supplied positioning anchor |
| `home-navigation.ts` | Native grid geometry, per-context selection/density/viewport histories and derived view |
| `home-cursor-loop.ts`, `home-cursor-visibility.ts` | Retained primary cursor Loop and shared visibility predicate |
| `home-gestures.ts`, `home-layout.ts` | HOME stylus previews, atomic folder placement and validated layout saves |
| `home-folder-identity.ts` | Session-local opaque folder keys, immutable allocation and movement; never persisted |
| `home-folder-close.ts` | Pure normal-close task/layout phases and per-operation observations |
| `home-folder-close-system.ts` | Counted System close, root/viewport commit and bounded shared-update timestamps |
| `home-banner-lifecycle.ts` | Pure folder/default request/activation, explicit clear, shared visibility/yaw and independent source clip clocks |
| `home-banner-service.ts` | Pure native banner gate and ordered manager/scene passes from a shared update counter |
| `app-persistence.ts` | Versioned IndexedDB saves, preferences and media |
| `app-capabilities.ts` | Opt-in browser devices, local capture and resource cleanup |

## Reducer flow

The menu is an explicit state machine. Inputs pass through `reduceSystem`, touch
coordinates through `touchSystem`, and time-dependent phases through
`tickSystem`. Reducers return new state and do not manipulate DOM, canvas,
Three.js or audio directly. External links are emitted as a state effect and
consumed by the scene after the transition.

```text
keyboard / model control / touchscreen / accessible control
                         ↓
                 normalized Input
                         ↓
          reduceSystem or touchSystem
                         ↓
       new state → sound + persistence + paint
```

This single path keeps touch and hardware behavior equivalent and makes the OS
testable in Node without a browser renderer.

## Application lifecycle

The current [portfolio UI scope](../portfolio-ui-scope.md) supersedes the earlier
full stock-app behaviour plan. Stock screens need basic navigation; Camera is
a read-only portfolio gallery and Sound is a functional favourite-song player.
The software keyboard is removed. See [power and opening UI](../portfolio-power-transitions.md)
for the native screen assets and explicit browser timing policy.

The system models cold boot, HOME, launch splash, running software, suspension,
resume, close confirmation, power menu, off and sleep. HOME suspends the current
application rather than discarding its selected item, page or photograph.
Launching a different application while one is suspended requires confirmation.

Persist only user preferences and safe layout data. Restore functions must
validate stored values so corrupt storage cannot hide portfolio content or put
selection outside valid bounds.

## Screen painting

Screens are derived views of state. Paint at native logical sizes, avoid CSS or
DOM UI inside the console, and reuse cached images/icon canvases. Animated
banners may use the small secondary renderer, but every feature requires a flat
fallback for context-constrained browsers.

Firmware resources are optional and provenance-controlled. Do not describe a
procedural or photograph-constrained reconstruction as firmware-rendered.

The isolated keyboard sequence controller owns eight logical note slots and
seventeen wave-slot identities for cues 6/7. It emits ordered prepare, parameter,
stop and wave-service observations without importing WebAudio, scene or app-host
code. Sequence completion and final silence are separate states. Its host must
supply counted native player updates and retain release tails after `stop()`;
it must not treat each render frame as an established native update. See
[the control port contract](../firmware-keyboard-control-port.md) for verified
native comparisons and the still-unimplemented transport connection.

## Native firmware presentation

`firmware-presentation.ts` loads the versioned manifest and assembles the selected
HOME layouts. `native-layout.ts` owns pure format types, binding/curve sampling,
material evaluation and window geometry; `native-renderer.ts` owns disposable
Canvas targets and bounded caches. `native-png.ts` preserves independent RGBA
texture channels through bounded PNG decoding, avoiding Canvas premultiplication
before native material evaluation. The OS layer receives injected folder banner
and white-theme background callbacks; Three.js model/material interpretation stays in
`scene/firmware-model.ts`. See
[`../firmware-presentation-validation.md`](../firmware-presentation-validation.md)
for the loader/disposal contract, coverage and unresolved visual differences.

Native `pah1` animation shares are decoded as source-pane/target-group records.
The pure binder expands pane channels and material slots after named-group
selection, without changing pane hierarchy. Unverified shared controller conflicts
and pane kinds fail explicitly. See
[animation-share validation](../native-animation-share-validation.md).

The CPU picture raster prepares selectors and texture transforms per call and
reuses scratch inside its pixel loop; scalar helpers remain differential test
oracles. The upper-base caller alone opts into guarded opaque darkening without
full LCD readback. Other blends and unverified transforms retain the generic
path. See [browser preservation and timing](../native-raster-browser-validation.md).

`native-banner-label.ts` derives the source folder text layout's horizontal fit.
`firmware-presentation.ts` renders and caches its 256×64 RGBA surface and passes
it to the injected folder callback. The scene owns dynamic texture upload, bone
billboarding and the transparent-target coverage transfer back to Canvas. This
keeps fonts/layouts out of the Three.js model renderer.

Lower folder first-character surfaces use the source 32×32 font target and the
pure native outline pass in `native-layout.ts`. Presentation caches at most 64
immutable glyph cells; `native-renderer.ts` binds them per draw and keys its
bounded raster cache by texture identity. Sampler overrides isolate each pane's
material. See [`../native-folder-glyph.md`](../native-folder-glyph.md).

`home-banner-lifecycle.ts` separates requested selection from active banner
identity and separates native manager updates from attached-scene clip updates.
The host supplies activation readiness and pass counts; the module does not
derive them from milliseconds. Background clips have scene-level epochs, while
new folder/default activation resets its own yaw and clips. Clear completes
without a primary instance; see [default banner runtime](../native-default-banner-runtime.md). See
[`../native-banner-lifecycle.md`](../native-banner-lifecycle.md) for the pure API,
source evidence and the remaining runtime/scene integration work.

`home-banner-service.ts` supplies the normal primary-folder gate and interleaves
manager/scene steps from the host's integer update count. Readiness and inhibition
are explicit inputs; generation-scoped tickets reject stale async completions.
The pure host composes it with scene-provided selection/readiness. See
[the service contract](../home-banner-service.md) for counter reset behavior,
stable folder identity requirements and the external app/blank loader boundaries.

`home-folder-close.ts` owns the isolated normal-close controller and its immutable
observations. It preserves lower-task-before-layout ordering, explicit eligibility
and batch event offsets; it does not mutate menu history or call the banner host.
The System adapter commits root/viewport changes at their shared-update boundaries
and retains exact start/restore/ready counts for scene consumers. It preserves
close progress through clock inhibition and rejects replaced contexts. See
[the pure controller](../home-folder-close-runtime.md) and
[System close integration](../home-folder-close-system.md).

`System.homeFolderIdentities` owns live folder keys independently from slots,
labels and the saved naming counter. Creation/delete/move/swap reducers maintain
them; layout reset retains allocation history. Successful restore mints a fresh
identity set and requires a new banner-service generation. See
[live folder identity](../home-folder-identity.md) for isolated-menu fallback,
persistence boundaries and tests.

The native lower consumer reports banner resolver snapshots before pending
movement can change selection again. `resolveHomeBannerHostObservation` resolves
those recorded slots/contexts and keeps unsupported toolbar categories explicit;
the service deduplicates accepted targets. The live scene consumes each counted journal after its upper manager pass. See
[observed banner selection](../home-banner-observation-resolution.md).

Ordinary settled grid touch runs its widget input before key production and
task updates, then submits tile Select/Decide in the later2D phase. Release
starts Decide; input accepts only after the controller becomes idle. The host
reads live selection/content at acceptance and keeps the primary cursor shown.
Application/folder opening exits that bounded host pass; System rebases unused
HOME time, while the scene accounts for the count without inventing banner
manager or3D work. Browser cancellation and authored scroll/drag takeover reset
widget ownership explicitly. See [the integration boundary](../home-tile-touch-integration.md).

Stationary native pickup begins at callback3 after held count21. The host retains
its candidate, copies selection, requests primary hiding and emits grab during
input. The lower/footer then hides primary and the source tile before2D; their
controllers freeze while separate Pickup/Blank mode5 controllers submit their
held density frames. Painters consume applied frames and host centers. The
browser still supplies zero anchor and authored movement/drop/lifecycle exits;
see [pickup entry and remaining boundaries](../home-pickup-entry-integration.md).

## Firmware application foundation

`native-keyboard-text.ts` supplies the source-derived initial local cell and
cursor overrides for the bounded Settings name keyboard request. It consumes
normalized text and original cell colors; it does not own filtering, editing,
controller time or composition. See [the component evidence and remaining
integration work](../native-keyboard-text.md).

`native-keyboard-edit.ts` owns the bounded non-composing Settings name buffer's
insertion/backspace/selection replacement in UTF-16 units. It reports ordered
paragraph invalidations without invoking presentation; the native event adapter
and input eligibility remain separate, unwired work. See [edit model evidence](../native-keyboard-edit.md).

`app-types.ts` defines renderer-independent application state, effects and views.
`app-registry.ts` retains the eight portfolio entries before stock title slots;
AR Games and Face Raiders are absent. `app-host.ts` owns the application, system
applet and nested library applet instances. Each applet stores its caller and
request ID. Completion returns its result to that caller, while HOME retains
the innermost suspended instance. Close recursively disposes descendants and
saves state. Modules must discard pressed/gesture state on suspend, sleep and
close. `stock-apps.ts` is a behavioural scaffold, with authored rows, text and
timings; it is not a verified reproduction of those applications.

`dispatchSystemEvent` accepts button down/up, touch down/move/up/cancel and
analog samples. Sources identify individual controls, such as
`keyboard:ArrowRight`. `app-input.ts` suppresses duplicate activation across
sources, clamps analog input and permits one stylus contact. The native HOME host generates source20/5 poll repeats. `tickSystem`
retains420ms/150ms repeats for applications, overlays and missing-asset fallback;
those timings are still unverified against their native owners. Browser repeat events do not activate a second time.
Foreground modules receive raw button phases with `activate: false` for
non-activating events, and receive analog samples plus direction commands.
Legacy `reduceSystem` and `touchSystem` calls remain available. An owner change
clears held controls; the scene calls `releaseSystemInputs(state, now)` on blur,
pointer loss and teardown. `setSystemSleeping` releases inputs and capabilities.
Power and preferences overlays suspend the foreground owner and resume it when
cancelled. HOME drag/folder behaviour is centralized in `home-gestures.ts`;
see [the gesture contract](../home-gesture-runtime.md) for renderer helpers,
folder restrictions, persistence and explicitly unmeasured timings.

`state.ts` owns the saved default-folder naming sequence (1…99, wrapping to 1),
independent of folder count and labels. Preferences payload version 4 preserves
that counter and independent HOME context histories; legacy payloads preserve all labels and start a new sequence at 1
because their creation history is absent. See [folder naming](../folder-naming-runtime.md)
for source addresses, Unicode formatting and migration limits.

`state.ts` also exports the source-derived settled folder Back hit rectangle and
`hasEmptyHomeFolderSelection`. System routing tests Back before the grid; gesture
routing treats it as chrome. Presentation must omit the footer when that
empty-selected-child predicate is true. See [folder input](../home-folder-input.md)
for source addresses, bounds and the occupied-footer verification limit.

Runtime effects have a monotonic `id` and instance `owner`. A capability's
`requestId` maps to that effect ID until completion or invalidation. Results
must include `requestToken` equal to the originating effect ID. Closing,
suspending, sleeping or superseding the request invalidates that token, even
if the same instance resumes. `resolveSystemCapability` ignores invalid
callbacks without changing system panels. The effect consumer checks
`isRuntimeEffectCurrent` against the latest state and acknowledges only the
IDs it consumed; it must not replace newer state with a captured snapshot.

`app-persistence.ts` provides IndexedDB version 2, with `saves`, `meta` and
`media` stores. Application records carry their own schema versions and use
the module migration function. Preferences migrate once from the legacy
`paramveer-3ds-v1` value without deleting it. Validation rejects invalid JSON,
future/unknown saves and unsafe layout data; `load().issues` reports skipped
records. Blobs remain in IndexedDB, with metadata in deterministic app state.
Writes enforce per-item and total media limits in the same transaction, so
quota failure retains previous data. Blocked, unavailable, closed and quota
failures are explicit errors. Restore data before accepting input;
`restoreRuntimeData` will not replace a runtime that already launched software.

Camera/Sound removal emits `remove-media` for the selected collection and ID.
The host removes that metadata and emits one ordered storage effect containing
the resulting shared save and removed media IDs. `saveSharedAndDeleteMedia`
commits the shared record and Blob deletions in one IndexedDB transaction;
an abort preserves both previous records. It rejects deletion of a Blob still
referenced by either media collection. The runtime consumes this durable write
even if the app subsequently suspends or closes. Failures use the existing
storage error reporting; the optimistic in-memory gallery is not automatically
rolled back. This corrects local file cleanup, not native deletion-dialog
fidelity or the unfinished Camera/Sound presentation.

`app-capabilities.ts` owns browser devices outside the reducers. Its
`execute(effect, { userGesture })` starts permission work only from an explicit
gesture. It exposes preview video and the latest motion sample without putting
DOM objects into app state. Captures/imports store local Blobs, microphone data
is bounded, and Nintendo/peripheral requests return offline without networking.
`release(owner)` aborts pending imports and cancels recordings, streams and
motion listeners; late permission grants stop their tracks immediately.
`dispose()` releases all owners. A capture whose storage write finishes after
invalidation is deleted instead of being delivered. A storage failure during
that cleanup can leave an unreferenced local Blob; no remote upload occurs.
Browser device behaviour and the presentation of these views require the
centralized scene integration and browser verification.

## HOME navigation histories

`home-navigation.ts` is the single owner of root/folder selection, density and
left-slot records. Legacy `MenuState` fields are projections; system-less menu
callers retain the same record under optional `MenuState.homeNavigation`.
`state.ts` derives painted tiles and geometry helpers from this view, and stylus
hit tests consume those exact tiles. Do not write projection fields to navigate.
Folder labels, children, histories and active context references move atomically.
App launch/HOME return preserve the retained HOME context; this bounded behavior
does not claim the full native APT reconciliation graph. See
[HOME navigation](../home-navigation-runtime.md) for source tables, migration,
transient preview policy and remaining work.

`home-input-producer.ts` implements the source-proven ordinary digital/primary
axis press, held, repeat and release/cancel producer. Its explicit normalized
masks and gate inputs make each poll independent from scene updates and time.
The native HOME session uses it through `home-controls.ts`; applications and
fallback retain the generic latch described above. See [producer evidence and limits](../home-input-producer-runtime.md).
`home-input-sample.ts` supplies separate digital and primary-axis edges before
their masks are combined. Its source snapshots and explicit sample calls are
consumed by the explicit browser adapter; see [source sampling](../home-input-sample-runtime.md).

Navigation motion advances in integer native updates. The shared provisional
nominal 60 Hz adapter stores `System.homeClock.updateCount` for presentation clip
owners; it freezes/rebases beneath overlays and inactive/sleeping HOME. Rendering
reads `getHomeNavigationView` without advancing state. Source-proven counts are16
for page-arrow mode2 and15 for density. Ordinary directional edge movement
instead uses mode3 with10 then5 updates; the native live host now uses that route. The fallback retains its earlier
directional behavior. The wall-clock cadence remains an explicit
application assumption. See the motion section of the navigation contract.

The primary cursor retains its submitted/current Loop frames independently of
paint elapsed time. Its ordinary update submits the current frame, then advances
by one and wraps before60; hidden cursor updates preserve phase. System and
presentation share the same visibility predicate. Native counted close resumes it at root restoration, including an offscreen
mode3 viewport correction. The legacy compatibility path still uses its earlier
selection-ready policy. The native footer precedes the later layout submission. Reduced motion samples frame0 without resetting
the retained controller. See [cursor runtime](../home-cursor-loop-runtime.md),
[presentation](../native-cursor-loop-presentation.md) and
[browser checks](../native-cursor-browser-validation.md). Native acceleration is integrated; the complete gesture schedule and hardware
cadence remain separate gaps.

Native lower folder assembly and its captured-background lifetime are documented in
[native-folder-assembly.md](../native-folder-assembly.md). The renderer consumes
fractional density and immutable unscrolled slot endpoints from navigation;
it does not derive native animation frames from row counts.

The scene now wires ordinary folder banners through the shared update counter
and pre-mutation boundaries; see [live banner integration](../home-banner-integration.md).
The new pure single-pass host API can place lower-task observations between
the manager and attached-scene phases. The live scene now consumes that API; see
[ordered banner passes](../home-banner-ordered-pass.md) and
[live controls and remaining adapter boundaries](../home-controls-runtime.md).
`native-home-audio/` owns verified resource decoding and persistent music
synthesis. Browser transport remains owned by `audio.ts`; see
[the audio boundary](../native-home-audio-contract.md).

The scene consumes counted close readiness at its exact shared-update boundary,
then observes the current action for sound routing through menu-action-sound.ts.
Native child layouts inherit decoded parent transforms/primary alpha through
NativeLayoutRenderer.withPaneParent. Callers that write runtime parent overrides
pass the same overrides to both parent drawing and child attachment; attachment
cache identity includes those values. See [close integration](../native-folder-close-integration.md)
for visual bindings, reduced-motion policy and the measured rendering slowdown.

Native nickname text presentation accepts explicit model cursor/selection state.
Selection and cursor child layouts can be submitted inline through renderer
`attachments` at their native hierarchy positions, preserving glyph ordering
and inherited transforms/alpha. See [selection verification](../native-keyboard-selection.md).

Shared decoded animations use the byte-identical HOME/keyboard float32 Hermite
sampler and native CLVC byte writes. Runtime overrides remain explicit caller
values. See [curve and color arithmetic](../native-animation-curves.md) for the
original-code fixture, key-boundary behavior and remaining rendering boundaries.

### Bundled local service bitmaps

Native title requests can explicitly select texture names for source HTML images
that have no CLYT layout. The existing validated loader still checks manifest
membership, format and dimensions, and session identity includes the selection.
`NativeLayoutRenderer.drawBitmap` uses the existing bounded disposable canvas
cache and draws at source dimensions. No texture fetch bypass or new image
lifecycle is introduced. Zone uses this path for its original offline HTML assets.
