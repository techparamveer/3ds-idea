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
