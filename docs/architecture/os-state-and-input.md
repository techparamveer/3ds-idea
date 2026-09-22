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
| `home-gestures.ts`, `home-layout.ts` | HOME stylus gestures, viewport, folder placement and validated layout saves |
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
independent of folder count and labels. Preferences payload version 3 preserves
that counter; legacy payloads preserve all labels and start a new sequence at 1
because their creation history is absent. See [folder naming](../folder-naming-runtime.md)
for source addresses, Unicode formatting and migration limits.

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
