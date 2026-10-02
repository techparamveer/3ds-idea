# HOME suspended-panel departure handoff

Coordinator integration note: this handoff is retained as evidence only. Source
API commit `69b2b39e` and follow-up audit `9dfec708` remain on the separate
worker branch; neither the optional API nor its proposed runtime mapping is
integrated into the coordinator checkout. The measured fixed-edge fade rules
out that candidate. The software-closing dialog is delivered separately.

Base: `100f2a94d046efe7b2b7a8d9ee4540e2e4f6fb05`

Branch: `codex/home-panel-departure-20261002`

Delivery: the focused commit containing this handoff

## Outcome and boundary

The captured browser sheet
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-buttons-border/close-after/health-close-sheet.png`
shows the suspended upper panel holding its settled pose until the close
controller removes its owner. This slice makes the actual authored
`LncBase_U_00_SceneOut` clip available to that panel. It does not reverse
`SceneIn`, create CSS/Canvas motion, or infer a native activation epoch.

`drawHomeSuspendedWindow` now accepts a sixth optional argument:

```ts
type SuspendedWindowDeparture = Readonly<{
  clip: 'LncBase_U_00_SceneOut';
  frame: number; // integer 0..40
}>;
```

When present, that binding is appended after the existing settled `SceneIn`,
`Appear`, `ScaleUpDown`, `Sleep`, and `WhiteBlack` bindings, so its root scene
tracks are the final transform/alpha authority. Invalid frames and identities
fail before drawing. When absent, the exact five-binding default remains
unchanged and a pack lacking `SceneOut` remains usable. Existing expanded,
compact, and Sleep callers therefore retain their previous behavior.

This worker did not edit the coordinator-owned `screens.ts`,
`firmware-presentation.ts`, or `system.ts`. No visible runtime behavior changes
until the coordinator explicitly supplies the optional pose.

## Source identity and delivered mapping

The source is the pinned EUR 10.7.0-32E HOME Menu, product `CTR-N-HMMP`, title
`0004003000009802`, version 24576, content index 0 / content ID `00000082`.
The recorded CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
the decrypted content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
The conversion chain is `ctr-native-web` 1.2.0 with CTRTool 1.3.0; exact
converter-script hashes remain in the delivery manifest.

| Element | Manifest/delivered key | CIA-internal source | SHA-256 |
| --- | --- | --- | --- |
| Upper suspended layout | `home.launcher` -> `packs/home/launcher.json` -> `layouts.LncBase_U_00` | `romfs/launcher_LZ.bin/blyt/LncBase_U_00.bclyt` | member `b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` |
| Panel departure | `home.launcher` -> `packs/home/launcher.json` -> `animations.LncBase_U_00_SceneOut` | `romfs/launcher_LZ.bin/anim/LncBase_U_00_SceneOut.bclan` | member `ba54b2de5825ab966a6bfd1e480d84c4479510688b1e36a20336493afdb174e9` |

The enclosing `romfs/launcher_LZ.bin` SHA-256 is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
The delivered launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Those member hashes were independently rechecked in the private extracted
tree for this slice; no source resource was regenerated.

The delivered animation is non-looping, has 41 addressable samples and records
source range 260..300. Its `G_Scene_00` binding selects the upper-base root
scene. The meaningful `N_Root_00` tracks are:

| Property | Interpolation | Frame 0 | Frame 20 | Frames 20..40 |
| --- | --- | ---: | ---: | --- |
| `scale.x` | Hermite, zero endpoint slopes | 1 | 1.100000023841858 | holds endpoint |
| `scale.y` | Hermite, zero endpoint slopes | 1 | 1.100000023841858 | holds endpoint |
| `alpha` | Hermite, zero endpoint slopes | 255 | 0 | holds endpoint |

Representative decoded samples are scale/alpha 1/255 at frame 0, 1.05/128
at frame 10, and approximately 1.1/0 at frames 20 and 40. This is a sourced
zoom-and-fade departure, not a guessed inverse entrance.

## Executable evidence and source gap

The pinned HOME executable is
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/extracted/home/exefs/code.bin`,
SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Existing bounded disassembly identifies the `LncBase_U_00` object constructor
at `0x286608..0x286628`, priority 499 in the post-3D pass, and generic BCLAN
loading through `%s_%s.bclan` around `0x286808..0x286958`. The executable string
table also contains `LncBase_U_00`, `G_WndwScale_00`, `G_Btm_00`,
`G_TextInOut_00`, `G_Wndw_00`, `G_CamLR_01`, `ScaleUpDown`, `Sleep`, and
`TextInOut`.

That constructor/loading evidence establishes the native object and animation
machinery, but it does **not** establish that the observed software-close route
starts this `SceneOut`, which predicate starts it, or its phase relative to
`BannerBG_AppQuit`, the footer, lower screen, HUD, or an audio cue. No native
epoch or scenario pass is claimed.

## Fresh native boundary evidence

After the source/API slice was complete, the coordinator supplied saved PNGs
from a temporary 5% emulator-speed run. This worker only inspected those files;
it did not operate Azahar. In
`native-close-clean-20261002/screenshots/_02.10.26_07.57.13.381.png`
(SHA-256 `557638c71a233e654737beef7cbff12b9949b9e8a801acaf232e5a18f99ef334`)
the upper panel is settled before close. In `07.57.15.524.png` and
`07.57.16.053.png` (SHA-256
`0cfa4811690db4021c133f2fd04674c099891676d748eaa2062ae76d3fb6a894`
and `4d430958db3c302faa4d3c5ab83f57ee1c0ef09111028f329fd79de4c32d3450`),
the lower “Closing software...” text has begun appearing while the upper panel
is still visually settled. By `07.57.29.337.png` (SHA-256
`793d6c601b58a16c1a312f53a228e2dde2fabc99aa86c9ea95b19556a3d89d2d`),
the upper panel is absent and the lower close overlay is fully visible.

This establishes that the upper panel does not simply begin departure at the
first observable lower close-overlay activity. It does not identify the later
upper departure's clip, first frame, cadence, or relationship to AppQuit.
Wall-clock filenames are not source-frame counts. Therefore the candidate
mapping below is **not cleared for integration** by current native evidence.

A second continuous sequence contains 36 own PNGs from `07.59.06.179` through
`07.59.31.222`. Representative identities are:

| Capture | SHA-256 | Observation |
| --- | --- | --- |
| `07.59.11.038` | `eda568363612d41411dec652b16da72b49106c2f3dbeef1ad60971b71cf41460` | Settled panel and suspended HOME |
| `07.59.14.557` | `d9b31610d4ee1e326d31bf1f1294307ee108db20041901f6361a6bad7d68c788` | Panel partially faded; lower close text visible |
| `07.59.15.715` | `6cc96e346f9616ea26339e5ac42d916e1c25a57798f144d0b800f0da98a999f1` | Panel no longer has a measurable dark edge |
| `07.59.19.198` | `a9b85656ba16c7ec01f2fdb797b6a7e3d9e93eb58c7131f75373e125bf04c30b` | Upper content nearly at empty wallpaper; lower close overlay retained |
| `07.59.31.222` | `40c7d890b09144b5d4cfef7eb3238167c2b748c316447ab922714b5902cc2259` | Later empty upper wallpaper; lower close overlay/footer retained |

At upper rows 100 and 150, the strongest panel-left-edge gradient remains at
x=51.5 in every measurable sample from `11.038` through `15.105`. Row-100
inside/outside luminance contrast falls 43.06, 39.54, 30.70, 17.60 and 10.15
across samples `11.038`, `13.487`, `14.151`, `14.557` and `15.105`, but the
edge does not move. The authored `SceneOut` couples its alpha loss to a centered
scale from 1 to 1.1. At a roughly half-contrast sample, that curve would already
be near scale 1.05 and move the 296-pixel-wide panel's left edge about seven to
eight pixels outward. No such motion is present. The same fixed-edge result at
two rows also rules out a rounded-corner-only measurement artifact.

The continuous native departure therefore does **not** match any sampled
`LncBase_U_00_SceneOut` pose progression. Upper application content and the
panel fade together toward the empty wallpaper while the HUD stays present,
which is evidence for a broader composition transition, not proof of another
specific authored clip. No alpha-only or reversed-entrance substitute is
introduced.

Source `SceneOut` reaches alpha 0 at frame 20 and frames 20..40 are visually
the same held endpoint. Even if a later trace proved that clip participates,
these PNGs cannot distinguish “reached frame 20” from “reached frame 40,” nor
show that either aligns with the 20-frame AppQuit host clock. The bounded fit is
therefore: leave the optional helper unwired and trace the native upper
composition owner/start callback before selecting a pose.

## Rejected immediate mapping and future integration interface

The current close controller publishes `BannerBG_AppQuit` frame 0..20 and
preserves frame 20 for one terminal paint. The following mechanical
`screens.ts` hunk documents the interface, but the continuous native sequence
now contradicts this immediate one-to-one mapping. Do **not** apply it unless a
later native trace establishes that a different route starts the authored
panel clip on this clock:

```diff
diff --git a/src/os/screens.ts b/src/os/screens.ts
@@
-import { homeSuspendedApplication, retainedSuspendedApplication, selectedSuspendedApplication, drawHomeSuspendedWindow, type SuspendedWindowMetadata } from './home-suspended-window';
+import { homeSuspendedApplication, retainedSuspendedApplication, selectedSuspendedApplication, drawHomeSuspendedWindow, type SuspendedWindowMetadata, type SuspendedWindowDeparture } from './home-suspended-window';
@@
   const applicationTransitionPresentation=homeApplicationTransitionPresentation(state.system?.sleeping?null:applicationTransition,reduced);
+  const suspendedWindowDeparture:SuspendedWindowDeparture|undefined=applicationTransitionPresentation?{
+   clip:'LncBase_U_00_SceneOut',
+   frame:applicationTransitionPresentation.material[1].frame,
+  }:undefined;
@@
-   drawHomeSuspendedWindow(firmwareAssets.renderer,t,suspendedMetadata.metadata,expanded?'expanded':'compact',suspendedSleepFrame);
+   drawHomeSuspendedWindow(firmwareAssets.renderer,t,suspendedMetadata.metadata,expanded?'expanded':'compact',suspendedSleepFrame,suspendedWindowDeparture);
```

This rejected mapping is intentionally outside the renderer API. It would make
the panel's authored active 0..20 span coincide with the already adapted
AppQuit 0..20 span and select the invisible endpoint for reduced motion. The
slow-motion PNGs show both a non-zero delay relative to the first observable
lower close activity and a fixed-edge fade inconsistent with `SceneOut`'s
scale. The coordinator should leave the optional argument absent. If later
source/runtime evidence identifies a different epoch or cadence, change only
the explicit pose mapping; do not reverse `SceneIn` or add an interpolated
fallback.

## Checks and remaining evidence

Focused `home-suspended-window` tests cover the delivered metadata/tracks,
unchanged default bindings, frames 0/10/20/40, invalid inputs, and the rule that
missing `SceneOut` fails only when selected. The focused suite passes 10/10 and
`npm run typecheck` passes. `git diff --check` is required before commit. This
worker ran no full suite, production build, shader check, GUI, browser, Azahar,
or audio session.

Before any integration, the coordinator still needs a native upper-composition
owner/start trace. Any later integration needs paired native/browser captures
at matched close updates, raw upper/lower LCD hashes, reasoned masks and opened
contact sheets. Capture at least the existing AppQuit checkpoints 0, 1, 5, 10,
19, 20 and the subsequent owner-commit update. Inspect the panel, background,
footer, lower LCD, HUD, input quarantine, and any native cue separately. Until
that comparison, the whole close scenario remains `fail`/source-gap rather than
pass.
