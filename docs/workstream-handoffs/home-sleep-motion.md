# HOME Suspended Sleep Motion Handoff — 2 October 2026

Base `7b2437938cfc48c621576835200cd559a50e9f52` on
`codex/home-sleep-motion-20261002`. This bounded slice makes the source Sleep
loops callable with one shared frame and adds an owner-scoped logical-clock
sampler. It does not edit the coordinator-reserved `screens.ts`,
`firmware-presentation.ts` or `system.ts`, so the pulse becomes visible only
after the integration hunk below lands.

## Delivered contract

`home-suspended-presentation.ts` owns a small presentation record:
`{owner, observedUpdate, sleepFrame}`. It reads, but never advances, the
existing `system.homeClock.updateCount`. The first eligible sample for an exact
suspended application owner binds frame 0. Later logical HOME update deltas
advance that owner's frame modulo 120. Repaints at the same update are stable.
Selection changes, expanded/compact changes, toolbar focus and modal dialogs
retain the same owner phase. Foregrounding, closing, replacing or otherwise
making the suspended owner ineligible clears it. A clock rollback rebinds the
same owner at frame 0. Reduced motion consumes the observed count while holding
frame 0, so disabling reduced motion does not replay hidden time.

Starting each eligible owner at frame 0 and treating one provisional HOME
logical update as one animation frame are host adaptations. Native clip cadence,
submission order and activation epoch remain untraced. The implementation does
not use global `updateCount % 120` and therefore does not inherit another
owner's phase.

`drawHomeSuspendedWindow` and `drawHomeSuspendedIcon` now accept the same
integer `sleepFrame` in `0..119`. They bind it to
`LncBase_U_00_Sleep` and `LncIconSleep_00_Sleep`; invalid values fail before a
draw. The optional frame-0 default keeps the reserved current call sites valid
until integration.

## Source identity

The delivered launcher pack is
`public/os/firmware/10.7.0-32E/packs/home/launcher.json`, SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Its `resourceSources.animations` records:

| Clip | Decrypted member | SHA-256 | Decoded source facts |
| --- | --- | --- | --- |
| Upper | `launcher_LZ.bin/anim/LncBase_U_00_Sleep.bclan` | `2def63b54f9f1f7c938620aeda619dcf8077e266f2a354940533f5bb1b9d2719` | 120 frames, loop, source range 0..120, child-bound `G_Sleep_00`; effective `P_Sleep_00` Hermite alpha 140 at 0, 240 at 60, 140 at 120 |
| Lower | `launcher_LZ.bin/anim/LncIconSleep_00_Sleep.bclan` | `97766a9870ec736b90751deea67121f18eb714f1387202a99ec911b36c214b0d` | 120 frames, loop, source range 80..200, child-bound `G_Icon_00`; `N_Sleep_00` Hermite alpha 140 at 0, 255 at 60, 140 at 120; child picture alpha 255 |

The transitive archive mapping is HOME Menu `0004003000009802` v24576,
content index 0 / ID `00000082`, `romfs/launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`,
decrypted content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`,
CIA SHA-256
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
The private pack-level record is
`compact-home-native/summary.json`, SHA-256
`003ad5ed1216554f432d72482b728de80862d60180cac4228445ca648279a531`.

The public member records contain path, SHA and title ID, while the private
record supplies version/content/archive identity only at pack level. This is a
transitive mapping, not a self-contained per-BCLAN provenance record. The
public HOME source omits content ID `00000082`. Recorded hashes for three
converter scripts are known stale, so this handoff does not claim a refreshed
converter-source identity.

## Baseline inspection

The retained `suspended-background-native/diff-fresh-expanded` sheets show
12,137 upper and 48,794 lower pixels over delta 2. Its central upper connected
region at `(152,67,83,79)` includes the suspended panel/icon/tint but is
confounded by other composition differences. The Camera sheets show 17,544
upper and 48,602 lower pixels over delta 2; compact icon differences appear in
smaller components near x6..44/y27..57, while banner phase dominates the upper
frame. These remain whole-frame failures.

The later static browser overlays under `suspended-highlight-native` are
visible for both default and density-1 layouts at base `7b243793...`.
Their expanded captures report logical HOME counts 3095 and 9215 respectively,
but both still draw source frame 0, so those counts are not pulse samples.

Fresh native own 400x480 PNGs are:

- `_02.10.26_06.38.22.082.png`, expanded Health, SHA-256
  `92c1f881bbe68a8287c251aa8562eb09c3fece8c3c2045ed10481e3a2892043d`.
- `_02.10.26_06.38.35.647.png`, Camera selected, SHA-256
  `17b33eb633665d8624d2bb2bcbdbaec2bd0d6ca9247dcb5749c0c2dcaa4a4a50`.
- `_02.10.26_06.38.39.694.png`, switch dialog, SHA-256
  `3150bd2d9cf4f4ea0346cca8df4373bffc4634255a064d9efc230368f43c8828`.

Both native profiles were verified muted in Sidecar. Azahar exposed
Tools -> Advance Frame, but it remained disabled after Pause. There is no
frame-counted native pulse series, and no native phase/epoch fit follows from
these static captures.

## Coordinator integration hunk

Apply these mechanical changes in the reserved files after cherry-picking this
commit. No reducer or renderer-state change is required.

```diff
diff --git a/src/os/firmware-presentation.ts b/src/os/firmware-presentation.ts
@@
- function suspendedIcon(ctx:Context,x:number,y:number,size:number,density:number){
-  drawHomeSuspendedIcon(renderer,ctx,[x+size/2,y+size/2],nativeHomeDensityFrame(density));
+ function suspendedIcon(ctx:Context,x:number,y:number,size:number,density:number,sleepFrame:number){
+  drawHomeSuspendedIcon(renderer,ctx,[x+size/2,y+size/2],nativeHomeDensityFrame(density),sleepFrame);
  }
diff --git a/src/os/screens.ts b/src/os/screens.ts
@@
 import { homeSuspendedApplication, retainedSuspendedApplication, selectedSuspendedApplication, drawHomeSuspendedWindow, type SuspendedWindowMetadata } from './home-suspended-window';
+import {createHomeSuspendedPresentation,getHomeSuspendedSleepFrame,syncHomeSuspendedPresentation} from './home-suspended-presentation';
@@
-function grid(c:Context,state:MenuState,time:number,reduced:boolean,graphics:ReturnType<typeof createPortfolioGraphics>,chrome:ReturnType<typeof createNativeChrome>,view:HomePresentation,nativeHome?:NativeHome,capture=false,assets?:FirmwarePresentationAssets){
+function grid(c:Context,state:MenuState,time:number,reduced:boolean,graphics:ReturnType<typeof createPortfolioGraphics>,chrome:ReturnType<typeof createNativeChrome>,view:HomePresentation,nativeHome?:NativeHome,capture=false,assets?:FirmwarePresentationAssets,suspendedSleepFrame=0){
@@
-   if(appId&&appId===suspendedApp)artwork(()=>nativeHome?.suspendedIcon(c,x,y,size,view.density));
+   if(appId&&appId===suspendedApp)artwork(()=>nativeHome?.suspendedIcon(c,x,y,size,view.density,suspendedSleepFrame));
@@
  let suspendedMetadata:{owner:string;metadata:SuspendedWindowMetadata}|undefined;
+ let suspendedPresentation=createHomeSuspendedPresentation();
@@
   const suspended=retainedSuspendedApplication(state),expanded=!!selectedSuspendedApplication(state);
+  suspendedPresentation=syncHomeSuspendedPresentation(suspendedPresentation,state,reduced);
+  const suspendedSleepFrame=getHomeSuspendedSleepFrame(suspendedPresentation);
@@
-   drawHomeSuspendedWindow(firmwareAssets.renderer,t,suspendedMetadata.metadata,expanded?'expanded':'compact');
+   drawHomeSuspendedWindow(firmwareAssets.renderer,t,suspendedMetadata.metadata,expanded?'expanded':'compact',suspendedSleepFrame);
@@
-  grid(b,state,time,reduced,graphics,chrome,view,nativeHome,false,firmwareAssets);
+  grid(b,state,time,reduced,graphics,chrome,view,nativeHome,false,firmwareAssets,suspendedSleepFrame);
```

Keep any formatting around the existing combined lower-paint line; the semantic
requirement is that one sampled frame reaches both calls in the same paired LCD
paint. Asset-ready retries and diagnostic paints must only resample the logical
count, never increment presentation time.

## Requested post-integration evidence

First capture a deterministic browser series for expanded Health and compact
Health while Camera is selected. Record raw LCD pairs and capture metadata at
one owner-relative phase 0 and after +30, +60, +90 and +120 logical HOME
updates. Confirm upper and lower alpha move together, +120 equals phase 0, a
selection/reselection preserves phase, closing or replacing the owner resets
it, and reduced motion remains frame 0. Use focused masks for the upper
`P_Sleep_00` region and lower suspended tile overlay, alongside empty-mask
reports so other residuals stay visible.

For native comparison, repeat the same Health suspend/Camera route and capture
a time-stamped burst or video only when the coordinator can preserve exact
input and display-update timing. Do not label wall-clock-separated stills as
frame 0/30/60/90/120. Until a native phase series exists, classify cadence and
epoch as an adaptation and keep the scenario `fail` for the remaining
unexplained differences.

## Verification boundary

Focused Node tests cover owner binding, selection/modal continuity, owner loss
and replacement, clock rollback, reduced motion, invalid counts, 120-frame
wrapping, shared upper/lower frame binding and authored peak alphas. No GUI,
Azahar, production browser, full suite, typecheck or build was run in this
worker. Static sheets and supplied captures were inspected; they do not prove
native timing or whole-scenario acceptance.
