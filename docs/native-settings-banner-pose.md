# Settings HOME banner: bounded pose, camera and show contract

This audit extends the [type-1 lifecycle](native-settings-type1-lifecycle.md) for
ordinary available System Settings `0004001000022000`. It uses the supplied EUR
HOME 10.7.0-32E `code.bin` (SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`)
and selected Settings `banner.bin` (SHA-256
`5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac`).
Addresses are virtual, with base `0x100000`. The parameterized
[`audit-settings-banner-pose.py`](../scripts/audit-settings-banner-pose.py)
checks the private source and public converted pack; its committed
[anchor result](evidence/settings-banner-pose-anchors.json) exposes only hashes,
metadata, instructions and bounded predicate results. The source branch audit
is static; only `0x1f90cc` is executed with synthetic key/manager memory. No
worker, operating-system service or GPU runs.

## Pose and camera

The type-1 resource worker calls `0x1fa0fc` for its primary at `0x24ca24`.
That constructor installs vtable `0x3210f0`. The manager's virtual `+0x14`
call at `0x24c264` therefore reaches `0x1fa344`: visibility/scale update,
then a branch at `0x1fa490` into common pose update `0x24e0c0`. This is source
support for reusing the **generic primary's** 600-count yaw and scale path for
Settings, with the same manager/scene eligibility boundaries. It does not make
the Settings skeletal clip a folder clip. The `COMMON` clip is 600 frames and
looping; the title has no material clip. State 4 looks up `COMMON` and starts
its skeletal controller at `0x249c8c -> 0x24def0 -> 0x1f8028`.

The common pose takes manager `+0x98` as outer X and `+0x90 + +0x94` as outer
Y (`0x24e418..42c`). Generic construction zeros these three fields; idle zero
displacement is supported by the existing [Frame source contract](native-banner-stencil.md).
The authored model's identity bind matrix remains inside that outer transform.
The `p_title` bone's raw billboard mode 1 remains the independent
[converted-model requirement](stock-home-banner-source.md). Do not derive Frame
Y from a moving `COMMON` bone: Frame follows only manager `+0x90` while the
primary is actually visible.

The title is a scene-1 generic primary, so its group-2 stencil consumption uses
the same authored BannerFrame sibling and `BannerCamera` as other generic
primaries. The published camera is Aim/Perspective, at `(0,1,44.7859992980957)`
toward `(0,1,0)`, with FOV `0.5235987901687622`, aspect
`1.6666666269302368`, near `26.5`, far `1000`. The published Settings model has
12 meshes and five textures. These identities constrain a host; they do not
prove the browser's pixels, stereo eye behavior or native display cadence.

## Activation boundary and failure paths

State 4 waits for its resource worker, prepares `COMMON` and starts the
presentation worker. Only a successful presentation-worker launch stores state
5 (`0x249d18..44`). The `0x34c008 == 0` branch at `0x249c4c..60` instead
reaches `0x249da0`: depending on a separate global state, it can clear manager
request fields and move toward type 13. This is a real failure/alternative path,
not evidence of a ready Settings model.

State 5 waits for the presentation worker at `0x24a5f8`. It then calls
`0x1f90cc`, which compares requested and current title words and medium byte,
requested/current native type, primary-pointer eligibility via `0x1f8fd0`,
and manager flag `+5`. A true result requests visibility **1** on primary and
secondary at `0x24a664..67c`; a false result requests visibility **0** at
`0x24a68c..6a8`. Both paths store state 6 at `0x24a6b0`. Thus state 6 alone
is not a show acknowledgement. The earlier type-1 note's reference to
`0x24a68c..694` as the ordinary show branch was incorrect.

Original ARM execution of `0x1f90cc` with synthetic Settings title words and
an eligible primary returned 1. Changing the current title low word, changing
the current type, removing that pointer from the manager's eligible slots, or
setting manager flag `+5` each returned 0. This bounds a retargeted state-5
case: it requests hide rather than showing a stale title. It does not resolve
how every asynchronous worker handles such a retarget before state 5.

The title worker can clear its completion byte or candidate objects on resource
failure. The initial pose audit did not execute that worker, the presentation
worker, their global dependencies, or `0x1f90cc` under all retarget cases. A live host
must retain the outgoing primary's title identity while hiding and must not
activate a Settings ticket until the source state-5 predicate requests show,
resource/model/Frame/camera readiness is current, and actual visibility is
sampled separately. Failed or stale workers need explicit cancellation/recovery
semantics. The current host deliberately returns `unsupported` for Settings;
the focused test protects that handoff from reusing a folder ticket. No live
Settings banner is enabled by this audit.

## Follow-up worker branch replay

The parameterized [`replay-settings-banner-workers.py`](../scripts/replay-settings-banner-workers.py)
executes bounded original ARM paths from the same hash-pinned HOME binary. Its
committed [result](evidence/settings-banner-worker-replay.json) and focused
test cover these synthetic conditions:

| Stage | Replayed result |
| --- | --- |
| Title worker `0x24c930` | Forced archive-open failure at `0x161e14`, or archive-read failure at `0x22bd38`, each reaches `0x24c984` and clears the argument's completion byte. Candidate construction is not reached. |
| State 4 `0x249bf4` | An unfinished worker leaves state 4. With resource flag `0x34c008=1`, the source prepares the primary and a successful presentation-worker launch enters state 5. A failed launch leaves state 4, even after preparation. |
| State 4 resource flag clear | `0x34c008=0` skips preparation and launch. A separate global value 0 reaches state 6 with the requested type retained; value 1 clears request fields, sets type 13, then reaches state 6. State 6 is therefore no proof of title readiness. |
| Retarget at state 4/5 | A synthetic retarget before state 4 does not stop presentation-worker launch. With pending-request byte `M+4=1`, state 5 subsequently asks both candidate objects to hide when the title key, native type or eligible primary disagrees. An unfinished presentation worker stays in state 5 without a visibility request. |

State 5 has a separate `M+4=0` arm that asks both objects to show without
calling the identity predicate. The replay's deliberately inconsistent
`M+4=0` plus mismatched key demonstrates why a host must preserve the native
request-generation invariant; it does **not** establish that such a mismatch is
reachable through normal input. Resource operations, worker scheduling and
visibility calls are explicit stubs. This state-5 branch replay stops before
its tail. The supplied-resource branch and acknowledgement helper are covered
separately below; none proves recovery, cancellation, eventual visibility,
animation timing or pixels. These remain gates for live type-1 activation.

## Supplied-resource completion and post-state-5 acknowledgement

The same hash-pinned replay now follows original title-worker instructions
`0x24c930..24cc24` with **supplied** successful archive, allocation, CBMD-read
and decode results. It observes both calls to `0x220070`: the common offset
`0x20` is decoded into `M+0xcc`, then the selected offset `0x40` into
`M+0xd0`. The original worker stores both candidate objects at `M+0x50/+0x54`
and writes completion byte `1` at `0x24cba8`. These addresses and synthetic
offsets establish the successful **control-flow branch** only. The replay does
not decode the four real CBMDs or establish that their models construct and
prepare successfully in native HOME.

After state 5, the native tail `0x24a730` reaches `0x1f91c0`. A separate
execution of that original helper with a supplied scene-service return shows
the acknowledgement predicate: matching current/requested title words,
medium byte and native type clears pending `M+4` and requests visibility `1`
on existing primary/secondary objects. A changed title key or type leaves
`M+4=1` and makes no visibility request in this helper. If the primary pointer
is null but the secondary is present, it still clears pending and requests
visibility on the secondary. This is **request acknowledgement**, not an
actual-visible or drawn-pixel observation. The state-5 branch itself still
checks current identity before asking the objects to show or hide.

Reproduce with `replay-settings-banner-workers.py --code /absolute/private/home/exefs/code.bin`
using Unicorn 2.1.4. The script rejects an unexpected executable SHA-256.
The committed [JSON fixture](evidence/settings-banner-worker-replay.json) has
SHA-256 `656498c0beec14119920f9a305679feeed56e0d4ce352d2e6fa62cc0e92dd129`;
an identical run and the full test log are retained under the private SSD
`presentation/type1-worker-completion/` artifact directory.

The follow-up replay executes the early no-active-effect branch of presentation
worker `0x2492d8`: with supplied matching current/requested Camera words and a
nonzero service status, it passes `0x34c020` to `0x1f9e8c`; a changed title
word passes zero. That worker branch returns, but `0x1f9e8c` is stubbed and
the native scene/render side of this worker remains unexecuted. A separate
retarget fragment executes pending state 6 through the native identity
predicate and hide function: it clears the consumed pending byte, asks both
candidate objects to hide and moves to state 2. The state-2 fragment waits
while the old primary's actual-visible byte is set and enters state 1 when it
clears. These fragments do not form a continuous state-6/2/1/3 recovery run;
the existing gate fixture establishes the subsequent six eligible state-1
calls under its separate supplied conditions.

The replay does not execute native thread scheduling, the presentation
worker's render branch, a continuous retarget replacement cycle, or the
`COMMON` controller's submitted-frame sequence. The converted
common clips prove their source durations and loop flags, while the manager
and scene-pass order proves only an update opportunity. The four title assets
remain dormant until worker completion and recovery are demonstrated with real
resources, clip sampling is bounded against native updates, and matched
native/browser pixels are inspected.
