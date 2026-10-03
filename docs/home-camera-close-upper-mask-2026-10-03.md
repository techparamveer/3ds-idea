# Camera Close Upper Mask

3 October 2026. Runtime `f0143f1f`, worker `3a8e5859`.
The [capture-boundary diagnostic](home-camera-capture-boundary-2026-10-03.md)
isolated an extra upper-LCD mask when Camera's ordinary Close confirmation
opens. Native suspended and confirmation captures retain identical pixels
in the declared unoccluded application region; the prior browser mask changes
all 36,128 pixels there. This is separate from the Camera input-content gap.

## Implementation

`homeSoftwareDialogUsesUpperMask` suppresses `DlgMask_U_00` for a validated
single Camera owner and preserves the existing switch exclusion. Other
ordinary-close titles retain their prior, unverified upper-mask behavior.
Camera no longer requires unused upper-mask resources. Selected lower mask,
dialog, header, messages and owner icons still fail explicitly before drawing
if unavailable. Post-OK closing, owner guards, input and timing are unchanged.

This per-title layer selection is a capture-supported adaptation: the native
caller remains untraced. No asset, colour, geometry, audio or shader changes.
The source is HOME `0004003000009802`, v24576, EUR 10.7.0-32E,
content index 0 / ID `00000082`, manifest `home.dialogmask`,
`packs/home/dialogmask.json`, CIA-internal `RomFS/dialogmask_LZ.bin`:

- Decoded pack SHA-256
  `675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`;
  source archive SHA-256
  `5add87203eb9a8adf05bc748a21fb47ee8bb8b55c6cf854e94c0007741e016d2`.
- `blyt/DlgMask_U_00.bclyt`, SHA-256
  `e51db3f8fb8f5d4c8860607cd43aac0d36d8992daa55e4fd8a8b7d4e998236db`.
- `anim/DlgMask_U_00_FadeIn.bclan`, SHA-256
  `400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4`.

Converter `ctr-native-web` 1.2.0, extractor CTRTool 1.3.0. Unchanged package,
lower-mask, header, messages and font identities retain their
[source mapping](home-camera-close-dialog-2026-10-03.md#source-mapping).

## Evidence

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-camera-close-upper-mask-20261003`.
Baseline runtime `0e59c1a0` is frozen in sibling
`home-camera-suspended-backing-20261003/before-desktop`.
Native own 400x480 PNGs are retained, not newly captured in this slice:

- Suspended `_03.10.26_03.15.15.463.png`, SHA-256
  `488313340525867f397843fd79254acdf430c38f0cc424bdaf24094efcecd988`.
- Close `_03.10.26_03.16.02.452.png`, SHA-256
  `c30c406ddbdd9d6eee4e002040e6f9542915b8749770d4af2304b4cd3d6c5629`.

Both live under sibling
`native-folder-switch-20261002/screenshots/camera-manual-footer-20261003`.
Raw browser upper is 400x240, lower 320x240; native lower crops at (40,240).
Whole comparisons use empty masks, delta 2, no registration or phase search.
Fixed diagnostic regions separate retained content from title and chrome;
they are not acceptance masks. Exact native input and epochs remain unmatched.

Full runtime checks: 1,903 tests pass, zero fail, 23 skip, one TODO;
production build and serialized typecheck pass. Focused worker suite passes
86 tests; independent code review has no actionable findings. These do not
establish native fidelity. Production comparison and cleanup are recorded below.

Production `after-desktop`, `after-mobile` and `after-reduced` runs produce
19, 19 and 18 observed switch pairs respectively, all without page errors and
with exact fixture restoration. Camera Close/Cancel/repeat/cross-drag/confirm
and Health-to-Camera switching complete. Eight additional Work/About/Health
controls complete with no errors; final owner/dialog empty, close transition
null and mute retained. Their accessibility commands are browser regression
checks, not matched native input. Observer counts do not establish cadence.

Coordinator inspected the corrected raw upper plus full desktop/mobile WebGL
views. Dedicated muted Chrome85602 exits0; exact PID absence verified and CUA
session ended. Native was not launched or modified. Preview3021 remains
HTTP200. No private matrix, system audio, microphone, default profile or
DeveloperStorage artifact changes.

## Measured Result

Suspended-to-Close changes in the fixed 36,128-pixel unoccluded upper region
fall from 36,128 above delta 2 to **zero, byte-exact**, in all three browser
modes. The retained native region is also byte-exact. Desktop HUD, application
title, Resume caption and bottom chrome now remain byte-exact. The icon pulse
still changes 3,982 upper pixels in desktop and 3,970 in mobile; reduced motion
preserves the entire upper image. Native also has icon/caption and HUD changes,
so this does not establish a shared animation epoch or motion acceptance.

Against the fresh retained native Close sample, upper mismatch falls from
95,197 to 72,482 desktop/mobile, or 72,500 reduced. Lower stays at 108 above
delta 2 in all modes and is byte-identical to baseline. Whole pairs remain
95,305 before and 72,590 desktop/mobile or 72,608 reduced: **fail**.
These lower counts use the fresh native sample, not the prior primary sample
whose recorded residual is 82. Camera content, HUD and other residuals remain
visible and unmasked; no strict scenario is accepted.

Coordinator opened the final side-by-side sheet and independently rehashed
all 68 manifest records. Two draft sheet-selector mistakes (Health instead
of Camera, then native Close instead of suspended) were corrected before
accepting the evidence; numerical comparisons always used the correct pair.
The generator now explicitly maps native/browser rows and checks Camera
ownership plus the pinned native suspended SHA. Final files under R:

- `home-camera-close-upper-mask-comparison-report.json`, SHA-256
  `9b0648a783801af3170d8dc66a5febf6b32767e0ac20e245e8985d59ae046ac0`.
- `home-camera-close-upper-mask-comparison-sheet.png`, SHA-256
  `1acf28dd88885b4987c8d3de2bd7a91fae60fc4e767a3e5ae823ee8249805d59`.
- `home-camera-close-upper-mask-comparison-manifest.json`, SHA-256
  `d77a71c22d140db1242cda1b35253e7f08cc03067dc7fb1ff284903a3c754c1d`.

The report preserves missing content-index fields in its published-provenance
input as null; the index/ID above follows the earlier linked source record.
Source identification, runtime tests, browser inspection and retained-native
comparison remain distinct evidence tiers.

## Remaining Work

Whole scenarios remain fail. The black browser Camera finder versus native's
portfolio-image input, HUD/content, retained-capture sampling adaptations,
native timing/input/audio and other titles' confirmation policies remain open.
Use matched read-only content or deterministic Health for further backing
work; preserve existing designs and continue reveal/power-on and button input.
