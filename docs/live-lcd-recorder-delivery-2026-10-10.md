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

## Repeat capture checkpoint

Repeated Notes opening and footer Close produce session
`d4a49ff8-1966-4944-bace-eb05da348c5b`, sequences 1-600. The recorder stops
at its frame limit, not on the later Stop request; all 600 pairs save.
Combined Notes audit report SHA-256 is
`27bda0fc4190fc245c4126bbd59f50cf930fcffc04cf5535ed28b4413baa33f7`.
It verifies 838 triples, 2514 unchanged originals and 1676 decoded PNGs,
with no structural errors or warnings. The 48 chronological sheets include
opening cover, ready empty grid, closing cover and HOME before its formed
banner. Coordinator inspected repeat sheets 1, 3, 24, 26, 27 and 34.
Full banner growth remains unresolved. Repeat encode mean is 6.912ms,
maximum 13.3ms; the maximum retained receipt interval is 76.8ms.

The combined audit is `offline-audit/notes-first-repeat-complete/` beneath
the verification root. Earlier serialization failure and size-bound incomplete
attempts remain preserved. Exact snapshot interning and an explicit 2GiB
read bound permit the completed audit without changing the captures.
Own Start/Cancel also visibly discards two buffered pairs without export
or an application-state change.

Ordinary first and repeated Notifications opening and footer Close each
visibly reach the real list and return to selected HOME on the MacBook.
Sessions `215e99d9-e484-45a5-a602-aadd20517c87` and
`3e0c8925-840f-45b8-b702-908fd62d1442` each stop at the 600-frame limit
and visibly save all 600 pairs. Their separate offline audit is pending.
These bounded recordings do not establish full animation or native cadence.

The isolated native-folder-slow Azahar session launches the selected private
HOME file with volume zero and produces one valid own 400x480 HOME PNG,
SHA-256 `14bf2749e6bb60cbc80893a51d2e0b404b1b9e1612357c8f36d2ace3c625c201`.
The screenshot request reports a closed native pipe; the surviving PNG decodes
and shows selected Miiverse, but its exact input delivery remains qualified.
No Manual, folder or suspension motion is captured in this baseline-only run.
The process exits after Quit/Yes. Its temporary screenshot path is restored
only after verified process absence; GUI-normalized geometry, layout and ROM
path changes are retained. Restored config SHA-256 is
`a0a3b837b59d66e083dc5887ff4d5c91a07b4dcbef3503fa686673a8181ed129`.
Policy, original config and own PNG remain under the private root's
`matched-regressions-20261010/`. No native comparison is claimed.

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
Notifications offline closure, Manual/folder/HOME native matched motion and
production save-error checks remain open. All four whole flows stay
fail/unproven. Audio acceptance is unverified while muted.
