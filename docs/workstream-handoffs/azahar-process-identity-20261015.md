# Azahar recorder process identity

15 October 2026. Worker checkout is
`/Users/paramveer/.codex/worktrees/azahar-process-identity-20261015/3ds-idea`,
branch `codex/azahar-process-identity-20261015`, base
`cd4746486bd2bbfaf0cf37f813a146d1f25f03f7`.
Only the recorder, its focused tests and this handoff change. Root retains the
shared [STATUS](../../STATUS.md), history, frozen runtime and live sessions.

## Captured failure

The existing recorder refused the aligned folder pilot before recording because
`NSRunningApplication.launchDate` was nil. Root observed two direct launches
with a live process and the correct bundle and executable, both lacking that
AppKit value. The preserved evidence is under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/folder-normal-speed-native/`.
`pilot/status.json` has SHA-256
`9c293357e6250dbaba138bc9e46e8e5f7f7f69c0757302a9d8b0693bfe1620ae`.
The companion `capture-ledger.md` records the two exits and restored profile.
This worker did not repeat a launch or change that evidence. Why AppKit omits
the date for these launches remains unexplained; this repair does not establish
an AppKit or launch-profile cause.

## Source and implementation

The installed macOS 27.0 SDK declares `proc_pidinfo` in `usr/include/libproc.h`
and `PROC_PIDTBSDINFO`, `proc_bsdinfo` and its unsigned 64-bit start-time fields
in `usr/include/sys/proc_info.h`. Apple's
[proc_info.h](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/proc_info.h)
provides those definitions. Its
[libproc wrapper](https://github.com/apple-oss-distributions/xnu/blob/main/libsyscall/wrappers/libproc/libproc.c)
returns zero when the underlying process-info syscall fails. The installed
headers and compiler versions are hashed in the private `evidence.json` below.

The recorder now requires the exact returned `proc_bsdinfo` size, the requested
positive PID, positive start seconds and microseconds below 1,000,000. It keeps
PID, seconds and microseconds as integers and compares all three exactly.
No floating-point timestamp conversion identifies the process.

Each snapshot reads kernel identity before AppKit, window, display and executable
observations, then reads it again afterward. The two identities must agree.
The existing checks after ScreenCaptureKit discovery, every 250 ms while
recording, and after finalization also compare against the initial identity.
Unavailable, incomplete or mismatched kernel data refuses capture, even when
AppKit supplies a launch date.

AppKit's launch date is an optional observation. When present it must still be
finite and positive, and two available before/after values must agree. A missing
value is omitted from JSON, never synthesized from the kernel timestamp.
Status schema is now 2: `before` and `after` each contain `window` and
`processGeneration`. The journal explicitly names each source. The CLI arguments
are unchanged. The [original recorder contract](azahar-window-capture-20261010.md)
still governs exact window/executable/hash/bounds checks, built-in display,
silent capture, excluded child windows, no input or permission request,
unused output reservation and final movie validation.

## Delivered and tested

Private artifact root `O` is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/recorder-process-identity-worker`.

`O/azahar-window-record` is the standalone arm64 macOS 15+ binary, compiled
with the installed Swift 6.4 compiler in Swift 5 language mode. The exact
absolute-path command and hashes are in `O/build-record.json`.
Compilation exits 0 with no warnings. Binary SHA-256 is
`922ac24b823f9cde4c1051e458fda8f23b6b43b7706c0f8f84a2b314f82a6190`.
Recorder source SHA-256 is
`0356f07a538a8f7460c8c49cba70b9b2307f0167d0561c52f2365fc1ff12f2f3`.
Focused test SHA-256 is
`dd7192309e590a2142abae66f92cf5cad25a3cd77404f616ffa7708f35813bd3`.

The focused test command, run from the worker checkout, was:

```sh
AZAHAR_WINDOW_RECORDER_TEST_OUTPUT=/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/recorder-process-identity-worker/checks-final node --test tests/azahar-window-record.test.mjs
```

All 94 tests pass with no skips, failures or TODOs. Fixtures now inject raw
`proc_bsdinfo` fields and return counts through the production query validator
and snapshot collector. They check query arguments and read-observe-read order;
prevalidated snapshots cannot replace those reads. Cases cover absent AppKit
dates, invalid or missing kernel values in all four read positions, replacement
within and between snapshots, a one-microsecond change that a Double comparison
would lose, and all prior request/window/executable/display/completion refusals.
The first 86-test run had eight assertion-message mismatches for numeric decoder
errors. Those inputs were rejected correctly; `O/focused-01.log` retains the run.

`O/mutation-check.mjs` mechanically generated seven separate source variants
outside the checkout and ran the same tests against each. Every variant compiled
and failed tests with passing controls retained:

| Mutation | Passing controls | Failing tests |
| --- | ---: | ---: |
| Require AppKit date | 62 | 32 |
| Allow incomplete kernel results | 86 | 8 |
| Ignore kernel PID | 85 | 9 |
| Ignore kernel timestamp validity | 84 | 10 |
| Ignore replacement within a snapshot | 92 | 2 |
| Ignore replacement between snapshots | 91 | 3 |
| Compare a combined Double timestamp | 93 | 1 |

`O/mutation-report.json` has SHA-256
`748261e4279c2e9d63dd22eae06e75a76601e59eacfd6811e1c2d85815086125`.
`O/focused-final.log` has SHA-256
`4463f7d59b715760b2bb5fe23c4faaac4c8dd79229ec3dbc427c2fe577b41ec4`.
`O/evidence.json` records log, header and offline output hashes. `--help` and
`--self-test` both pass, and `git diff --check` passes.

## Unverified work and coordinator handoff

These are offline checks of the real Swift collector with injected OS responses.
They do not exercise a live `proc_pidinfo` syscall, NSRunningApplication lookup,
ScreenCaptureKit enumeration, permission state or recording callbacks. The
bracketing checks detect changed process generations across observations; they
do not make separate system APIs atomic or pin the target process indefinitely.
The coordinator must independently review this commit, then run a fresh silent
exact-window pilot and inspect its decoded pixels before any animation input.

No Azahar, browser, application build, native comparison, screenshot, capture
pair, mask or diff report was produced by this worker. Full application tests,
typecheck and web build had not run at the initial recorder-only source freeze.
The later coordinator-requested checks are recorded below.
Runtime `d4c7276` and build `Tc7ZG3LaSUpILEb72xG1X` remain frozen. No profile,
security setting, native asset or audio changed. The fitted selected-only HOME
reveal and existing footer/banner timing adaptations remain as previously
recorded; the native partial-neighbour loading schedule is still unimplemented.
All four whole flows remain fail/unproven, including exact motion, input and
muted audio acceptance. All worker compile/test processes have exited.

## Supporting checks after source freeze

Source/test/handoff commit `8631dc48b47efdba14e76464b05060f8c7d1e0ca` is the
focused implementation submitted for independent review. The coordinator then
requested the repository test, typecheck and build entry points in this worker
checkout. It has neither `node_modules` nor `.next`. No dependencies were
installed, copied or linked, and no frozen checkout/build was touched.

`O/supporting-checks.mjs` ran all three entry points sequentially, with test
scratch redirected beneath `O/supporting`. All processes exited normally:

| Command | Exit | Result |
| --- | ---: | --- |
| `npm test` | 1 | 1,832 total; 1,610 pass, 184 fail, 37 skip, 1 TODO |
| `npm run typecheck -- --incremental false` | 127 | `tsc` not found |
| `npm run build` | 127 | `next` not found |

The full test log reports missing `sharp`, `fake-indexeddb`, `typescript`,
`pngjs` and `three`. It does not emit the historical Camera PNG or LFS failures;
dependency failures prevent a useful full application regression result.
No unrelated repair or weakened test follows from these results.

`O/supporting/report.json` has SHA-256
`b6a787047796ee50a84a8145ae28ef2b14192d8299d2c9e6dd813c802ab90203`.
The logs `npm-test.log`, `typecheck.log` and `build.log` in that directory have
SHA-256 values `913c6da8062201b03009252856f42c66da0c46cac7a12e3af2fa417b6f4a0690`,
`3232a107c7131ac91d18f8d6daba8ac8b657e21215db5492c8d866e7534bbd8b` and
`9ec24555435b81b1f619963297a3fd0274a0f2c462454725ca685f8f7239993c`.
The source, focused tests and delivered binary still match their hashes above.
The worker tree was clean after the supporting checks, before this handoff-only
update. Weekly usage was 46% used and 54% remaining before this batch.
