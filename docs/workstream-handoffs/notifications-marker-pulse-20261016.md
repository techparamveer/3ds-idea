# Notifications unread-marker pulse handoff

Date: 16 October 2026

Base: `6da2f83b5f8596bbd20a4419c76496aaa5bbe01f`

Source/test commit: `26e523008a5c9e88acc68296013fa3e51df65062`

## Captured defect

The sealed idle audit proves the production browser freezes the unread marker.
Ten chronological native own-PNGs contain five distinct raw hashes across the
declared row 2-4 marker strips over 775 ms. All 263 ready browser receipts over
13,039.4 ms contain one raw marker-strip hash. The inspected sheets show the
variation on the same marker/glow geometry, without a demonstrated anchor
translation. This justifies activating the delivered source animation only.

Audit root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/notifications-marker-idle/audit/`

- `report.md`: SHA-256 `dc5b612ad13388ff67066d60ff189dcbd2a3165a57ac101f323483a4e641af17`
- `metrics.json`: SHA-256 `bca093ff2772ecd9e277584f1db7fe659a143421bebb232cc4f9048ee901415c`
- `marker-strip-comparison.png`: SHA-256 `d127dca751c0078afa1ee1012693343e29ad178c7c992c84c4748f8805051d3d`
- `full-lcd-comparison.png`: SHA-256 `df095c8385b3f5e064a90d0a3bc06c12c119622af8e8371765ce96d0ffaf223c`
- `seal.json`: SHA-256 `5b71d6d0d01145de9e7e00a05bdb924eb05687d17e5875bd89dec1d4b1ad8a87`

The audit preserves empty masks and RGB delta 2. It does not establish native
cycle length, cadence, start phase, or browser-to-native frame mapping.

## Source evidence

Pinned title `000400300000a002`, version 4097, content index 0, ExeFS
`code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`.
The prior source trace maps `0x139520` through table `0x1a6c10` to
`receivelamp_LZ.bin` and records the following `0x139434` call with state 1.
This establishes construction, attachment and the passed state, but the bounded
trace does not establish that state's semantics, the per-frame update caller or
the start epoch.

Delivered `receivelamp.json` SHA-256 is
`d6f24c638ba4cbbe65724513aa8c8ddb705d3404659d2be63a34fdcd4dc74bc8`.
`RcvLamp_00_ReceiveBlue` is `loop: true`, 120 frames. Its decoded source keys
drive material RGB and glow alpha at frames 0, 60 and 120. `SceneIn` remains the
separate non-looping alpha track settled at frame 20. Existing provenance for
the archive, layout and textures remains unchanged.

## Implementation

`stock-native-personal-tools.ts` samples `ReceiveBlue` from the already supplied
presentation `elapsedMs`. It uses the existing measured LCD VBlank ratio
`268111856 / 4481136`, matching other source-frame host adaptations. This rate
and the global host elapsed origin are explicitly adaptations: a Notifications-
specific native dispatch rate and animation epoch were not recovered.

`stock-screen-presentation.ts` adds only the selected lamp pose to the existing
paired paint key. It does so only for Notifications main with at least one
visible unread row, so read-only lists and other apps do not recompose. The
ordinary two-LCD cache, owner/resource guards and fresh outward copies remain
unchanged. Reduced motion and Notifications footer-close feedback retain the
previous shipped settled frame 60. `SceneIn` stays at frame 20. The separate
first-title incoming renderer is unchanged.

## Checks

- `node --test tests/notifications-marker-pulse.test.mjs tests/notifications-source-ownership.test.mjs tests/stock-screen-preparation.test.mjs tests/notifications-footer-close.test.mjs tests/applet-title-entry-presentation.test.mjs`: 66 pass, 0 fail.
- Focused coverage exercises elapsed poses, no-unread cache suppression,
  reduced-motion and Close snapshot endpoints, painter bindings, and real
  decoded native rasters (`frame 0 != frame 60`, `frame 120 == frame 0`).
- `./node_modules/.bin/tsc --noEmit --incremental false`: pass, using the
  coordinator dependency installation through the ignored worker symlink.
- `git diff --check`: pass.
- Build: intentionally not run before independent review.

The initial focused test invocation failed before loading tests because this
source checkout had no dependency link (`ERR_MODULE_NOT_FOUND: sharp`); the
worker then linked the coordinator's read-only dependency installation and the
same checks passed. No package installation occurred.

## Remaining acceptance

This is source-implemented and source-tested, not browser-inspected or
native-compared after the change. Root must review, integrate, run the held
build/full checks, and recapture matched native/browser idle sequences. Exact
phase, cadence, title entry epoch, whole-screen fidelity, input and muted audio
remain unproved. No native asset, geometry, manifest or shared document changed.
