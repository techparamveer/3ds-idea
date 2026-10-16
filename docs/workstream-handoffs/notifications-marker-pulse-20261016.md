# Notifications unread-marker pulse handoff

Date: 16 October 2026

Base: `6da2f83b5f8596bbd20a4419c76496aaa5bbe01f`

Source/test commit: `26e523008a5c9e88acc68296013fa3e51df65062`

Reviewed candidate: `dbefd3a37510f70a13174c1354157b07f51001df`.
Integrated through `ab73c3188602cb55f4c6de34fca52e3687f13a7c` in draft PR #7.
Production build: `SlhhiQG_tCeNraLO8aw43` in the separate pulse worktree.

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
paired paint key. It uses the painter's same start calculation and five-row
slice, so an unread row outside the rendered window does not trigger recomposition.
Read-only lists and other apps do not recompose. The
ordinary two-LCD cache, owner/resource guards and fresh outward copies remain
unchanged. Reduced motion retains the previous shipped settled frame 60.
Notifications footer feedback redraws the ordinary stock pair, so it keeps the
same elapsed ReceiveBlue curve rather than forcing frame 60; native feedback
freeze semantics remain untraced. `SceneIn` stays at frame 20. The separate
first-title incoming renderer is unchanged.

## Checks

- `node --test tests/notifications-marker-pulse.test.mjs tests/notifications-source-ownership.test.mjs tests/stock-screen-preparation.test.mjs tests/notifications-footer-close.test.mjs tests/applet-title-entry-presentation.test.mjs`: 66 pass, 0 fail.
- Focused coverage exercises elapsed poses, exact rendered-row cache suppression,
  reduced motion, normal/Close phase continuity, painter bindings, and real
  decoded native rasters (`frame 0 != frame 60`, `frame 120 == frame 0`).
- Both `npm run typecheck` and nonincremental typecheck pass.
- `git diff --check`: pass.
- Final full suite: 3,101 total, 2,996 pass, one known missing historical Camera
  PNG failure, 103 skip and one TODO. The failure is
  `tests/camera-date-group.test.mjs:44`; its assertion was not weakened.
- Production build passes after replacing the candidate's ignored dependency
  symlink with a local copy. The rejected out-of-root symlink build is preserved.
- Independent GPT-6.1 Sol high review `b70fc11c` has no remaining findings.
  Review fix `f68f3fd` removes the Close frame-60 jump and excludes offscreen-only
  unread markers from recomposition. Test fixture fix `dbefd3a` adds the new
  export to two existing stubs without changing their assertions.

The initial focused test invocation failed before loading tests because this
source checkout had no dependency link (`ERR_MODULE_NOT_FOUND: sharp`); the
worker then linked the coordinator's read-only dependency installation and the
same checks passed. The first full run also exposed 40 unhydrated model tests
and two missing stub exports. Local LFS hydration and those fixture corrections
leave only the pre-existing Camera failure. No package installation occurred.

## Production and native idle comparison

Private evidence is under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/notifications-marker-pulse/`.
Root captured 43 native own 400x480 PNGs and 295 paired browser receipts in
separate muted MacBook sessions. The 42-file native batch spans 3.071 seconds
of host filenames. Every sample is compared chronologically to the fixed first
ready browser pair, sequence 42, with empty masks and RGB delta 2. No phase fit
or best-of selection was used.

The 254 ready browser frames contain 57 raw common-marker states. Of those,
224 frames change above delta 2 from the first ready frame. No lower pixel
outside all four marker regions changes above that threshold. Four native
samples locally match common rows 2-4 at delta 2, but none matches exact RGB.
The first-row read fixture, whole-upper differences and unaligned phase remain.
Root inspected all six chronological comparison pages and rehashed all 43
native originals, 885 browser originals and 19 sealed derivatives unchanged.

- Final receipt SHA-256: `91b9fd1ad17a09f4b9e83f32d1d17914e2968f8eece95fdfdae30698eb83a59c`.
- `audit/report.md`: `0b12577988dce995abf0dc7b46c7a548fa04df9afc0f3ffac4a9557695f2c85b`.
- `audit/metrics.json`: `053a8e8e0851b73c742b2a29612ea49d7512e5d1b2233ccf3bb9d46f86b61331`.
- `audit/marker-strip-comparison.png`: `9ee57b631fba2ac9af8bbf15a7d3142e49db29e65f19481e2714a918096b607d`.
- `audit/seal.json`: `2e90176a41dc0ae17774c3a77939ab88da841bb87a71160075d313319cdb1fbc`.
- `audit/marker-pages-seal.json`: `9ecfc15006e7d65fca75802847424846aa4e51f134bad1aa9f0a4fc21358de5c`.

The candidate's 2,425-file source/public/build inventory is unchanged. The
coordinator's older baseline build remains frozen and is not current source.
Both native and browser sessions are closed; isolated config is restored to
`d460f825fc8e490e6e59648f40dd426b8807bcacc71a7872bf671817ce0c8750`.
A separate ordinary Close browser run saved all 511 pairs and reached HOME.
Root inspected its chronological contact sheet and rehashed all 1,533 originals
and seven sealed derivatives. Its trusted pointer hold is 505 ms. Both feedback
frames, all outgoing 0-20 and incoming 0-20 frames, handoff and settled HOME
are present. The outgoing20/incoming0 paired pixels match exactly. Last pre-up
lamp pose 64 progresses to first feedback pose 65, rather than forcing 60.
This is a browser regression, not native feedback or cadence acceptance.
Private `notifications-marker-close/audit/report.md` SHA-256 is
`bafcc8d70ce83cfb163bce8147120e80fe29ec0f84338a5031de1f9374dab597`;
its contact sheet is `ce370f77b0286135db15e81799fabb3a833bbc6ba4164090ffd44b23615f7b3d`
and seal is `1e3e77e6a10c0046f71758f7c3cb35177c03f8e2f6c3b0117d213eab5e88bb71`.

## Remaining acceptance

This is source-identified, delivered, implemented, reviewed, tested,
browser-inspected and native-compared for the bounded idle marker defect.
It restores missing variation, not exact native phase, cadence, title entry
epoch, feedback-freeze behavior, whole-screen fidelity, input or muted audio.
All four whole animation flows remain fail/unproven. No native asset, geometry
or manifest changed. The existing portfolio content, local/inert app behavior,
read-only Camera fixtures and compositor/timing adaptations remain separate.
