# Native banner lifecycle

`src/os/home-banner-lifecycle.ts` is a pure state adapter for the native folder
banner and the upper background's SceneIn, Loop and AppPause controllers. It has
no DOM, Three.js, resource loader or HOME selection dependency. Runtime and scene
integration remain separate: this module does not replace call sites of the old
`banner-motion.ts` time approximation by itself.

## Evidence and supported behavior

The supplied HOME 10.7.0-32E `code.bin` has SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses below use its virtual base `0x100000`. Private source excerpts,
isolated ARM execution scripts and results are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/folder-lifecycle/`.

| Source | Contract |
| --- | --- |
| `0x1ed6ec`, `0x1f90cc` | Deduplicate the requested identity/type/options, then allow same-current special-banner reuse before replacement starts. |
| `0x24b444`, `0x1f9324`, `0x24b850` | Folder activation releases the old folder, constructs a new object and restarts its resource controllers. |
| `0x1f9e64` | A normal visibility request resets yaw counter `+0x70` only if actual visibility `+0x3c` is already false. Either requested boolean can trigger that reset. |
| `0x1f7c60` | Immediate attachment/detachment preserves yaw. |
| `0x1fa344` | Separate requested and actual visibility; native quarter-step scale transition, including the extra update that detaches. |
| `0x24e0c0` | Increment yaw modulo 600 before testing visibility. First update after activation uses counter 1; zero from native integer negation becomes positive floating zero. |
| `0x24c23c` | Retained loaded primary/secondary objects receive manager updates even while hidden. Global inhibition can stop this path. |
| `0x24f300`, `0x24f484`, `0x103850`, `0x10b3d0` | Actual attachment controls membership in the scene's clip-controller update list. Detached clips do not advance through that path. |
| `0x1ed1c4` | Background mode equality preserves Loop. Actual transition to mode 0 restarts it; mode 1 pauses Loop and starts AppPause. |
| `0x24da64`, `0x24dc14`, `0x24da2c` | SceneIn start/seek, Loop restart and Loop resume are distinct operations. |

The folder's two clips both have a **600-source-frame duration**. Its skeletal
Y curve has a 150-frame repeating segment; that segment is not the clip duration.
The decoded BannerFolder resource SHA-256 is
`28f62936179fe1e0787080e62ac7b4d5d3e8e279cb4bbccb9c8fd2a47c799305`.
BannerBG has a 20-frame SceneIn and AppPause, and a 600-frame Loop; decoded resource
SHA-256 is `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.

## Host integration

Create one lifecycle with `createHomeBannerLifecycle()`. Its manager and scene
update counts start at zero; they represent separate native passes. No API accepts
milliseconds, assumes 60 Hz, or derives one clock from another.

1. Call `requestHomeBanner(state, target, options?)` when the selected banner
   request changes. A target has `{kind, key, nativeType}`. Use a stable folder
   identity, not its name or current grid slot; ordinary empty/nonempty folders
   are native types 9/10. Options expose the two deduplication bytes and an
   explicit forced reload. This does not immediately change the active banner.
2. Call `beginHomeBannerReplacement(state)` at the host's manager boundary.
   A same-current identity before hiding reuses the active object. A different
   request asks the active folder to hide. Requests during hiding/loading retarget
   the eventual replacement, without reviving an object already being removed.
3. Feed eligible manager calls through `advanceHomeBannerManager(state, count)`.
   Requested visibility and actual attachment remain distinct. Retained hidden
   folders continue yaw updates. Passing `enabled=false` inhibits this path.
4. When the primary can be released **and the host's load gate permits it**, call
   `releaseHomeBanner(state)`. It refuses to release a still-visible folder.
   When the requested resource is ready, call
   `activateHomeBanner(state, state.requested.epoch)`. A stale epoch is ignored.
   Activation itself performs no implicit manager or graphics update.
5. Feed the separate visible-scene pass through
   `advanceHomeBannerClips(state, count)`. Only actually visible folder clips and
   explicitly attached background clips advance. The host chooses pass ordering;
   the adapter does not fabricate a first-render ordering.

An initial request has no old object to hide, so `beginHomeBannerReplacement`
enters `loading` directly. A ready initial resource can then activate. A request
does not automatically activate after any number of update calls. The native
loader has a wait counter and asynchronous readiness conditions; their full
relationship to the host's update loop is not reproduced here. Do not introduce
a guessed millisecond delay or treat `releaseHomeBanner` as automatic on detach.

`active.activationEpoch` identifies the banner instance. Request epochs are
loader tokens; unchanged requests reuse their token. Active folders expose
`yawCounter`, `yawRadians`, actual/requested visibility, native scale/progress,
and their skeletal/material source frames. Yaw-reset, attachment and clip-start
epochs make independent lifecycle changes observable. Clip epochs are local to
an instance; use the activation epoch as well when retaining renderer caches.

The native counter restarts when a replacement activates, rather than when the
cursor input first arrives. Normal folder opening eventually requests the
selected child or blank; normal closing requests non-folder content and then
the restored parent. The HOME reducer owns that request sequence. Returning to
a folder after completed replacement creates a fresh activation, without a
per-folder phase cache.

## Background lifecycle and frame 19

The host explicitly sets background attachment with
`setHomeBannerBackgroundAttached`. `showHomeBannerBackground(state, animated)`
restarts SceneIn at 0, or starts it and seeks to
`HOME_BANNER_BG_SCENE_IN_SETTLED_FRAME`, **19**, for the native nonanimated setup.
The host can use that constant for its static settled sample.

The seek operation does **not** pause the native controller. Isolated execution
of `0x1bbd94` from frame 19 advances to frame 20 with the end flag set, reports
the one-update completion state on the next call, then becomes idle. The adapter
preserves that behavior; it does not claim that a native settled scene remains
permanently frozen at 19. The resource contains authored keys at both 19 and 20.

`setHomeBannerBackgroundMode(state, 0)` restarts Loop only if the previous mode
differs. Mode 1 pauses Loop and starts AppPause. `startHomeBannerBackgroundLoop`
always restarts it; `resumeHomeBannerBackgroundLoop` preserves frame and epoch.
The explicit restart is also available for the native AppQuit-completion path,
whose predicate is outside this adapter. AppQuit, AppRestart, SceneOut and their
host scheduling have not been ported here.

Folder requests, activation and visibility do not alter the background's clocks.
A background Loop frame of 509 does not establish a folder yaw counter of 509.
Reference fixtures must provide separate states or counts, without fitting the
offset to a screenshot.

## Explicit folder rendering

`createFirmwareBanner(renderer).drawFrame(ctx, frame, label?)` accepts a readonly
`FolderBannerRenderFrame`: `{visible, scale, yawRadians, skeletalFrame,
materialFrame}`. Supply the active folder's sampled lifecycle values. The method
sets the outer group yaw and uniform scale, preserves the authored inner bind
matrix, selects the two `BannerFolder` clips at their separate explicit frames,
then calls `model.update(0, camera)` and the existing coverage-preserving overlay
render. It applies no opacity fade or elapsed-time clock. Painting a frame again
does not advance lifecycle or animation state.

When folder and camera assets are available, an intentionally hidden frame
returns `true` without modifying the canvas or sampled model state. Missing,
failed or disposed resources return `false`, including for hidden frames. The
raw `ready` Promise **catches load failures and resolves**; awaiting it is not
proof of successful loading. Check `status().ready` and `status().failure` before
activation and handle a `false` draw result. A background-only load failure does
not prevent folder rendering. Runtime integration owns request/activation and
the switch from the retained legacy `draw` entry point; background methods are
unchanged.

`tests/firmware-banner.test.mjs` uses the real model, textures, camera and CPU
animation facilities with a recording Canvas/WebGL transport. It covers repeated
immutable frames, independent skeletal/material checkpoints, label-upload reuse,
inner bind preservation, hidden/disposed frames, resolved load failures and
renderer-state restoration after a draw failure. It does not execute GPU shaders
or replace browser verification.

Renderer validation: all 32 banner/model/lifecycle tests and nonincremental
TypeScript checking pass. Production build passes with a temporary
`turbopack.root` common-parent override for this worktree's existing shared
`node_modules` symlink; the default root rejects that symlink. The configuration
was restored afterward. Browser/runtime integration remains with the main task.

## Verification and limits

`tests/home-banner-lifecycle.test.mjs` covers request/activation separation,
same-folder reuse and reversal, new-folder/type/forced refresh, stale loader
completion, opening/closing request sequences, hidden versus attached updates,
600-frame wrapping, background mode/restart/resume and independent epochs.
Golden values for float32 yaw and visibility scaling come from execution of the
original ARM routines in Unicorn 2.1.4, rather than a second JS implementation.
The visibility harness stubs scene attach/detach and the model-transform getter,
then stops before the separately tested common yaw update. It does not emulate
the HOME application or GPU. The SceneIn controller completion samples execute
the original controller without external calls.

Worker validation on 2026-09-23: all 15 lifecycle tests pass, as do all 10
adjacent HOME presentation tests and `npm run typecheck`. The full `npm test`
run reports 148 passes, 9 skips and 41 failures: model tests encounter Git LFS
pointer files instead of GLBs, and two test files cannot load `fake-indexeddb`
through this worktree's existing shared dependency link. These assets/dependencies
were not changed. Full output is private `folder-lifecycle/npm-test.log`.
Production build and browser checks belong to the subsequent runtime/scene
integration; this new module is not yet imported by the application.

This is the folder/banner-clock subset, not a complete native banner manager.
It models one primary slot; native secondary banners, app banner motion, angular
impulses/spring input, special drag paths, asynchronous load ordering, resource
frame versus rendered-frame scheduling and wall-clock cadence remain outside
this module. Pass counts and activation readiness must come from the runtime;
the global HOME update count alone does not prove that every graphics pass ran.
The existing native trigonometric-table interpolation and authored bind transform
remain the renderer's responsibility. No browser equivalence is claimed before
the integration task wires and inspects the actual output.
