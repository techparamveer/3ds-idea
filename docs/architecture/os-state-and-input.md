# OS, state and input architecture

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
| `animation.ts` | Layout animation sampling utilities |
| `app-types.ts`, `app-registry.ts`, `app-host.ts` | Firmware contracts, installed titles and applet lifecycle |
| `app-input.ts` | Phase-aware input normalization and shared-clock repeats |
| `home-navigation.ts` | Native grid geometry, per-context selection/density/viewport histories and derived view |
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
It does not yet wire the System or renderer. See
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

## Firmware application foundation

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
sources, clamps analog input and permits one stylus contact. `tickSystem`
generates directional repeats (420 ms delay, 150 ms interval, still unverified
against native firmware). Browser repeat events do not activate a second time.
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

Navigation motion advances in integer native updates. The shared provisional
nominal 60 Hz adapter stores `System.homeClock.updateCount` for presentation clip
owners; it freezes/rebases beneath overlays and inactive/sleeping HOME. Rendering
reads `getHomeNavigationView` without advancing state. Source-proven counts are 16
for scroll and 15 for density; the wall-clock cadence remains an explicit
application assumption. See the motion section of the navigation contract.

Native lower folder assembly and its captured-background lifetime are documented in
[native-folder-assembly.md](../native-folder-assembly.md). The renderer consumes
fractional density and immutable unscrolled slot endpoints from navigation;
it does not derive native animation frames from row counts.

The scene now wires ordinary folder banners through the shared update counter
and pre-mutation boundaries; see [live banner integration](../home-banner-integration.md).
`native-home-audio/` owns verified resource decoding and persistent music
synthesis. Browser transport remains owned by `audio.ts`; see
[the audio boundary](../native-home-audio-contract.md).

The scene consumes counted close readiness at its exact shared-update boundary,
then observes the current action for sound routing through menu-action-sound.ts.
Native child layouts inherit decoded parent transforms/primary alpha through
NativeLayoutRenderer.withPaneParent. See [close integration](../native-folder-close-integration.md)
for visual bindings, reduced-motion policy and the measured rendering slowdown.
