# Selected Settings HOME banner: boot-phase audit

## Evidence at the captured frame

The isolated Azahar screenshot
`reference/screenshots/_26.09.26_02.18.19.836.png` (SHA-256
`e7f04e64fd43af04450254d90c3ad3aac43bac2ea791182c839de406fb7d33fa`)
is pixel-identical to the 400×480 native image in the private
`scenario-matrix/v1/captures/home-settings-selected-boot/` pair. Its PNG bytes
differ because the files were encoded separately. The screenshot shows a
narrow, nearly edge-on Settings wrench. The browser upper LCD in that pair
(SHA-256 `607eca3e28359f08fbf902949d8bb62b4ca847d6a1b827464ca88c0b89606411`)
shows a broader wrench. The old unmasked report at `49391b3` has **19,793
upper** and **44,041 lower** pixels over 2/255; its largest upper connected
region is `(65,17,178,200)` with 7,616 differing pixels. That region also
contains background and other content, so it is not a banner-only score.

The browser `capture.json` records selected `system-settings`, active primary,
yaw counter **106**, yaw **−1.1100294589996338** radians and skeletal frame
**106** at shared HOME update **2513**. The capture hook's `elapsedMs: 12000`
and ISO date change only presentation sampling; they do not advance or set the
HOME update counter. The source Settings `COMMON` clip and HOME yaw both have
600-count loops. The source projection fixture places the wrench broad at
frame 14 and narrow at frames 150 and 450, but that fixture cannot identify
which native frame the screenshot contains. Native clip/yaw counters and the
first-visible update were not captured.

The matrix calls this pair unmatched: Azahar booted with a preserved Settings
selection, while the browser closed Sound, selected Settings, reloaded and
settled. The 12-second paint sample and the Azahar screenshot filename are not
a common animation clock. The previous selected HOME pair also has different
entry histories. A constant offset, initial frame seek or alternate loop
speed inferred from either still image would be unsupported.

## Implementation consequence and next comparison

No live banner-phase change follows from this evidence. The source-derived
manager/scene pass separation, visibility-gated attached clip and 600-count
yaw remain in `home-banner-lifecycle.ts`. The default-layout correction in
`825b4c5` moves Sound and Settings to the native lower-row coordinates for a
fresh layout; it does not establish animation timing or change existing saved
layouts. The old diff scores cannot be reused as after-change results.

After integration, drive **identical** selected-Settings boot inputs and
record native frame checkpoints relative to a visible selection/activation
event. Capture raw browser LCDs at corresponding shared updates and record
its lifecycle activation, visibility, yaw and skeletal counters. Compare the
banner crop separately from HUD, wallpaper, lower native tiles and portfolio
substitutions; inspect the unmasked full-screen sheets as well. The existing
`lcdBannerFrame=0..599` source-pose samples can bracket geometry but are
explicitly synthetic and cannot substitute for a native timing match.

The upper HUD still differs in Internet status and battery presentation; the
lower viewport and selected-tile location in the old pair predate `825b4c5`.
These are distinct pixel gaps. Motion, cue onset and the remaining full-LCD
differences remain open until a new same-input native/browser pair is captured.

## Fresh-origin layout and saved-default follow-up

The coordinator's fresh-origin production browser capture at
`reference/scenario-matrix/v1/captures/home-settings-selected-default-browser-20260926/`
shows selected Settings at lower LCD **x=244**, aligned with the native selected
tile. It records HOME update **519**, yaw counter and skeletal frame **276**;
the native screenshot still has no source counter. Its unmasked diagnostic diff
is **54,709 upper / 41,778 lower** pixels over 2/255. The upper wrench is
face-on relative to the native thin pose. The lower neighbors also differ:
portfolio NVIDIA and the source-correct blue Sound icon occupy positions where
the native capture shows Activity Log and orange Download Play. The input prefixes differ, so
these counts cannot be read as a before/after improvement or a banner-phase
measurement.

An existing browser origin retained the pre-`825b4c5` slot map in localStorage,
which overrides `initialAppLayout()` on restore. The HOME persistence change
after this audit recognizes only the exact old 14-title default with no folder
or folder-number history. It adopts the new default positions and remaps the
selected title; saved Settings at old slot 8 moves to slot 9 with the two-row
viewport starting at slot 4. A rearranged layout and folder history remain
unchanged. This fixes the stale-default route only; it does not modify the
banner clock or resolve the distinct visual differences above.

The orange glyph has wireless waves beside a small console. The isolated
profile's HOME `CacheD.dat` has an SMDH entry labeled **Download Play** at
offset 140160 (SHA-256
`bc09a57e02d8432bb858eefefd3fc392416a42d79290cea527af08f3b72cd25a`),
whose decoded 48×48 icon matches that glyph. Its Activity Log entry sits at
offset 126144. Both titles are excluded from the portfolio. The Sound title
`0004001000022500` instead supplies a blue music-note SMDH: pinned
`ExeFS/icon` SHA-256
`100f6180ecdd7716d4928676381d729ebad50b94500350f17d52daa16d5ff494`,
delivered as `icons/sound.png` SHA-256
`963b10e9162a174d625f8bf2fe8b0cbfc17b3e2a1b6f4a6ca106a5a1cd5b1118`.
The profile's cached Sound SMDH also decodes to a blue note. No Sound icon
mapping or asset change is justified by the orange native neighbor.


## Bounded wrench-only follow-up at `4b75c4a`

The two raw LCD images were inspected again. The icon row and title occupy
similar positions; the wrench is narrow in native and broad in browser. A
rectangle `(140,32,110,101)` isolates the wrench area above the icon row and
excludes HUD, title and lower LCD. It contains **8,201 of 11,110 pixels** with
any channel delta over 2, mean RGB error **51.44095**, maximum **172**. It still
includes wallpaper, so it is a diagnostic rectangle, not a geometry-only score
or an acceptance mask. The inputs are native combined SHA-256
`e7f04e64fd43af04450254d90c3ad3aac43bac2ea791182c839de406fb7d33fa` and browser
upper SHA-256 `3ed8501ca2564b1027b94e001591305c8ed66820e0ea6ee5d7467f0e6cedab94`.

**No runtime change:** the current pair cannot distinguish a phase offset from
a speed, activation-delay or pose-binding defect. Browser capture records
skeletal frame/yaw counter 276 at HOME update 519; native has no recorded
counter or matching activation boundary. Seeking an arbitrary narrow pose would
fit one still while introducing unsupported motion. The source `COMMON` loop
and generic primary's 600-count yaw remain unchanged. This is an explicit
native-timing evidence gap, not a passing banner or a missing source model.

The next useful capture needs a shared observable boundary: select another
native title, return to Settings, and sample the first visible pose plus
explicit relative frame counts in both environments. Record browser activation,
yaw and skeletal counters. A second native still without those counts will not
resolve this gap. Existing `lcdBannerFrame` sampling can bracket geometry only.

Asset mapping remains `models.settingsBanner` → Settings
`0004001000022000` `exefs/banner.bin`, with the shared HOME `homeCamera` and
`bannerFrame` resources described above. No native asset or adaptation changed.
Focused host/lifecycle/Settings checks: **30 pass, 0 fail, 1 existing TODO**;
typecheck and diff check pass. No UI session was operated by this worker.
The private numeric record is
`/Users/paramveer/.codex/3ds-artifact-overflow/settings-wrench-region-20260926.json`.
The normal private artifact volume returned ENOSPC; no existing evidence was
removed or overwritten to make room.

## Fresh native view and source-pose probes

[Matrix v35](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v35/matrix.json) adds native `_26.09.26_03.57.26.519.png` against a live browser Settings HOME capture and synthetic source frames 150,450,136. Upper/lower over-threshold counts are 65,074/36,196 live; 64,094/36,480 at 150; 64,076/36,429 at 450; 64,064/36,194 at 136. Native shows a compressed icon row while the browser keeps it evenly spread, even at a narrow wrench pose. This cannot be resolved by choosing a wrench frame alone.

Native HOME boot/CUA selection and browser shortcut/Left prefixes are only broadly recorded; exact input parity and native animation phase remain unknown. The `lcdBannerFrame` probes explicitly remain synthetic diagnostics, not evidence of native frame identity or a justification for a fixed runtime phase offset. No native asset or runtime change follows. Whole-LCD masks remain empty, all entries fail, motion/audio open.

## Later settled native burst and fit revert

The genuine twelve-image burst at 04:14:30.13–04:14:41.277 on 26 September shows a broad icon row around x=65–335 while the wrench rotates. The earlier compressed snapshot therefore does not establish a constant settled projection. The constant fit `cfefa16` regressed live HOME and was removed in `ba0b8d5`. Its restored live diagnostic retains 56,631 upper / 36,088 lower pixels above 2/255, with unmatched input and unknown native frame phase. Profile status and excluded native neighboring titles also differ. See [v36 evidence](progress-2026-09-24.md#settings-hud-and-restored-home-projection--26-september-2026); neither a fixed projection nor a timing offset is accepted.


## Synthetic frame 309 after the revert

The [v37 diagnostic](progress-2026-09-24.md#home-settings-synthetic-frame-309--26-september-2026) compares production `ba0b8d5` with `lcdBannerFrame=309` against native 04:14:35.203. It retains 56,409 upper / 36,358 lower pixels above 2/255 and remains fail. Offline silhouette estimates across the native burst are consistent with the existing approximately 600-frame/10-second turn; they supply no observed native counter or shared activation boundary. `captureScreensAt(elapsedMs,date)` does not advance live banner clocks. A closer synthetic wrench pose does not establish native timing, shading or whole-screen acceptance.
