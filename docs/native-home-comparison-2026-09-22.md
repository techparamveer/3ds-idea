# Native HOME comparison checkpoint

This checkpoint verifies parts of the representative HOME slice. It does not
accept the complete HOME experience or any stock application. All private
captures, owner-source scratch and comparison reports are under:

`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`

## Background and native camera

The original `BannerBG` geometry, textures, material operations and selected
`SceneIn`/`Loop` clips now use the original `BannerCamera` Aim/Perspective camera.
The runtime source trace in `runtime/reference/banner-background/report.md`
confirms that the default theme restores the authored BG texture and constants;
there is no evidence for a replacement neutral texture or UV rescale.

A browser phase search compared the original 600-frame background loop with
`reference/home-folder-two-rows-lower.png`. The regions exclude the HUD, hints,
folder and label: x=0..82 and x=317..399, y=26..213. At source frame **509**:

- 93,624 RGB channels were compared, without shifting, resizing or recoloring
  the native framebuffer. The browser's 800-wide texture adapter was reduced
  to its logical 400-wide framebuffer with nearest sampling and `fit: fill`.
- 89,299 channels are exact; the other 4,325 differ by **one** 8-bit level.
- Mean absolute difference is **0.046195 / 255**; RMSE is **0.214931 / 255**.
- No compared channel differs by more than one level. The remaining one-level
  rounding difference is measured, but its exact GPU rounding cause is not yet
  independently established.

This is a **fitted animation-phase comparison**, not proof that the native and
browser animation epochs or clocks are synchronized. The source phase search
explains the earlier large-cell versus fine-cell appearance without changing
geometry, texture scale or colors. Reports: `background-phase-fit.json`,
`background-phase-refinement.json`, and `browser-background-phase-refine.json`.

## Folder label and hints

The label now uses the native 256×64 `BnrDsTitle_00` surface, original font
metrics, original 16-vertex `mt_Text` plane, source material and native horizontal
fit rule. It remains readable through four parent-yaw checkpoints, and the
transparent-target bridge preserves native RGB without applying coverage twice.

The SPICA-derived ScreenViewpoint orientation is **not accepted as native** yet.
The browser panel/text is about one pixel below the stable native reference. A
temporary no-tilt diagnostic reduced label-region MAE from 4.693 to 1.851, but
still left a font-raster difference; it was reverted. No fitted offset or camera
change was committed. Native billboard behavior is being traced separately.
Artifacts: `browser-folder-label-contact.png`, `folder-label-pixel-rows.json`,
`folder-label-tilt-probe-contact.png`, `folder-label-tilt-probe-report.json`.
The latter contact sheet contains native, SPICA and temporary no-tilt views in
that order. Their folder-yaw phases are intentionally unmatched.

Alpha-only PICA textures sample RGB zero. Projecting the delivery PNG preview
masks back to that source meaning restores the native camera/capture hint
color (73,77,80), while keeping alpha, LA font/button channels and delivery bytes.
The native material colors are unchanged. Folder-icon initial glyph composition
and directional selection scroll placement remain under verification.

## Audio and reference limitations

`reference/home-sfx-native.wav` is a lossless 32728 Hz stereo native capture;
its scenario, hashes, profile restoration, intended inputs and observation
limits are recorded in `reference/home-sfx-native-metadata.json`. The native
video dumper still emits zero video packets; the recording is audio evidence
only. Native-resolution screenshots are separate artifacts.

Converter v5 preserves the generated sample origin and the native sequence
scheduler. Main and resume periods are 3,515,200 samples. Startup accounting,
loop-carried voice state and native archive gain are separate issues; v5 and
late-loop candidates are private pending cue and continuity verification. Public
HOME audio has not been replaced merely because converter tests pass.

An attempted native F10 step shortcut conflicted with Azahar's existing screen
layout shortcut. Top-only captures and a later capture failure are not accepted
as dual-screen references. The isolated profile and original user profile remain
separate. Reference hotkeys must be checked for conflicts before another run.

## Reproducible browser presentation checkpoints

In development, `.console-stage.captureScreensAt(elapsedMs, isoDate?)` returns
native screen data URLs at a selected presentation time. It validates its inputs,
leaves software state/input/effects unchanged, and restores the current render
in a `finally` block. It is removed on disposal and absent in production. Real
browser controls must establish the scenario before calling it. A phase sample
is not a replay of input timing or proof of native synchronization.

Example browser evaluation after real navigation to a folder:

```js
const host = document.querySelector('.console-stage');
const frame = host.captureScreensAt(509 * 1000 / 60, '2026-09-22T19:20:00Z');
```

The clock value, connection/battery indicators and first eight portfolio titles
are not matched by this background-only comparison. Clock values and portfolio
content are intentional differences; indicator behavior still needs separate
native verification.

## Checks at this checkpoint

- 282 combined JavaScript tests pass after the native label integration.
- Nonincremental TypeScript check passes.
- 3 real-resource revision-5 CGFX regression tests pass, covering Folder, BG,
  Camera and Textures plus bounded malformed inputs.
- 20 converter v5 audio tests pass against the owner source.
- The actual browser label capture reports no runtime errors.
- The preceding native camera integration passed production build and shader
  checks; those results do not substitute for rerunning them after final fixes.
