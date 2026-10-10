# Live LCD recorder delivery

The localhost-only QA recorder observes successful scene renders and copies
both current LCD canvases before Notes/Notifications footer completion can
repaint them. It does not seek, repaint, advance clocks or change native assets.
The default page creates no recorder. Explicit loopback `?lcdCapture=1` adds
Start, Stop, Save and Cancel outside the console screens.

## Implementation and review

Worker `4d44e0f` plus correction `fda21db` integrate as `2ad758b` and `bcceb54`.
Exact correction review approves source/tests, report SHA-256
`ea068edec037c752404ba96f42d677c91beed5ac8c0443ef77998a408f74ff60`.
Independent 142 checks pass. Six scene fixtures retain all prior assertions.
Retries retain uncertain-write history and use fresh paths. Keyboard observation
covers existing bindings without changing console input. Initial rejected
candidate and failed test logs remain preserved.

Clean verification `ba2455e4fa8b5d6d5895f5a84cd1391e94224ba2` matches committed
source/public/tests. Nonincremental typecheck and production build exit 0.
Full suite exits 1: 2643 pass, one unchanged missing historical Camera PNG,
101 skipped and one TODO. No fixture is skipped or replaced to hide that error.
The unrelated user `system.ts` edit is untouched and excluded.

## Production observation

Frozen build `_SwbJfk4BZ6hHVXO20d-4` serves loopback3029, listener43643.
Build-ID file SHA-256 is
`f4c011f467709bb51c0c0f29577ae9f8d8ae51d502fd23767b20534451425843`.
Dedicated Chrome20594/window136 has `--mute-audio`; bounds650,150,1102x700
lie on the authorized MacBook display. Existing Helium3028 stays unchanged.
Default URL has no recorder; explicit opt-in exposes actual controls.

Ordinary Notes toolbar selection and Open reach the empty grid. Own Start,
actual footer Close, HOME observation, own Stop and Save yield session
`801306ab-2bc1-420d-b55b-9635463e257c`, sequences1-238. User stop is explicit;
all238 pairs are saved. The exported input ledger contains pointerdown/up.

Private audit closes714 unchanged original files and476 decoded PNGs at
upper400x240/lower320x240. Receipt/paint identity, publication validity,
chronology and inventory have no structural errors, warnings, gaps or duplicates.
Audit report SHA-256 is
`14b87be320c436362442e4de59a5caea8ce9b16a54280e184300180be6d782f4`.
Coordinator inspected chronological sheets1-4 and14: retained Notes, outgoing
HOME cover, HOME exposure without banner, then returning Notes banner.
No native comparison pair or diff mask is produced by this recorder check.

## Evidence and limits

Private root is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/`.
Source review is `live-lcd-recorder-review-20261010/correction/report.md`.
Supporting logs and frozen policy-v2 are under `live-lcd-verification-20261010/`.
Raw triples are under its `reference/scenario-matrix/v1/captures/`; manifest,
report and sheets are under `offline-audit/first-notes-close/`.

Encode overhead totals1432.5ms across238 pairs, maximum13.5ms. Maximum retained
receipt interval is57.7ms. Encoding can perturb scheduling; measured encode
overhead excludes validation, deduplication and export. Render return is not
compositor acceptance or native cadence. Input ledger is not dispatch proof.
Recording metadata is a pre-save snapshot; closure uses actual output files.

The QA panel is an instrumentation adaptation, not firmware UI. No native
visual/audio asset, source mapping, title version, shader or sound changes.
Existing capture-fitted applet scheduling and portfolio adaptations remain.
Repeated Notes, Notifications, Manual/folder/HOME native matched motion and
error/cancel production checks remain open. All four whole flows stay
fail/unproven. Audio acceptance is unverified while muted.
