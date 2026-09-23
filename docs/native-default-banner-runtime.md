# Default and clear primary lifecycle

The pure lifecycle/service/host now distinguish native default type7 BannerDef
from explicit type13 clear. A vacant selected root or opened-folder slot resolves
to `{kind:'default'}`. Clear is an explicit integration observation, never the
resolver's fallback. A present application with unavailable rendering remains
an unsupported app; no type1 loader stages are guessed.

`HOME_BANNER_EMPTY_KEY` represents native title words `(-1,-1,medium0)` for both
targets. Kind and native type remain identity fields, so default/clear cannot
deduplicate into each other. Adjacent vacancies retain one request and activation,
including root/child context changes. Folder/default/clear share one service
scope; app handoff and new System generations invalidate it.

## Public interface

`HomeBannerMotion` is the shared immutable motion record; the previous
`HomeFolderBannerMotion` name remains a type alias. `HomeBannerInstance.motion`
is canonical. Host active views expose `primary`, whose `selection` is folder
or default and can differ from the incoming `view.selection`. Only folder
presentations have labels. Folder refresh checks require both kinds to be folder
as well as matching generation, identity, native type and activation.

Pending views expose `primary:null`. Completed clear exposes `status:'cleared'`,
`primary:null`, `resourceTicket:null`; lifecycle/service are active with no model
instance and no activation-epoch increment. Requesting clear does not complete it.
The previous presentation survives its actual-hide and retained-hidden stages.

Folder/default readiness remains an exact generation/request ticket. Default
requires parsed model, actual textures, explicit EUR clips, native camera and
usable Frame/compositing dependencies. A resolved Promise is insufficient.
Clear has no resource ticket, but still waits for native worker readiness and
the hide/gate/worker sequence. Revoking readiness never silently destroys the
retained outgoing presentation; after its scheduled release, pending rendering
does not invent a new model.

The latest request wins. Clear/default observations before a manager pass can
coalesce; the host does not queue fictional intermediate activations. Integration
must preserve actual event/update boundaries for the folder-close sequence and
omit observations while native initialization eligibility is absent.

## Motion and ordering

Folder and default share original quarter-step visibility/scale and 600-update
manager yaw. Default's skeletal controller loops at300; its material controller
is nonlooping60. At material update60 the endpoint is reached while playing,
update61 reports stop, then update62 is idle. Folder clips retain600/600. Hidden
retained objects still get eligible manager yaw updates, while detached clip
controllers freeze. Background clocks remain independent.

The usual manager-before-scene order remains. With both passes eligible, a newly
activated default attaches and reaches yaw1 and both clip frames1 during its
activation tick. These are logical samples, not measured display timestamps.

The original-ARM fixture output is committed as
[native-default-banner-order.json](evidence/native-default-banner-order.json).
It executes HOME code with SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The private reproducer and report are in the firmware artifact directory's
`runtime/reference/execute-default-null-primary.py` and
`runtime/reference/default-null-primary.json`; the report records the script hash.
Use the existing `assets/research-venv/bin/python` interpreter to rerun it.

| All-ready fixture | Manager states after each eligible call |
| --- | --- |
| Initial default | 1,1,1,1,1,3,6 |
| Initial clear | 3,6, with no primary |
| Completed clear → default | 2,1,1,1,1,1,1,3,6 |

For the last row, wait counters are `0,0,1,2,3,4,5,5,5`; primary remains null
until pass9 installs the default. The first pass executes the changed-request
state6 branch and `0x1f9068`, which writes state2 even for null primary. The next
pass observes null at `0x24c128` and sets state1 without running its gate. Five
gate increments, a later release/worker-start and a later load completion follow.
This fixes the former service stall after a clear with no active instance.
The fixture also executes the unchanged default request setter's deduplication.

Native manager dispatch, current/request comparison, hide, gate, loader dispatch,
type13 completion, type7 installation and key copies execute original ARM.
Eligibility, interrupt helpers, worker creation/completion/join/cleanup, ancillary
hide notifications and cached resource construction/reset/update are explicit
stubs. No native OS, attached clip pass or GPU is emulated. The nine-pass result
therefore proves this all-ready primary-only fixture, not real loader timing.

## Verification and remaining ownership

The focused lifecycle/service/host/default tests check source motion values,
300/600 wraps and60-frame completion, executed gate sequences, actual visibility,
worker/inhibition gates, resource failure/stale tickets, immutable outgoing
labels, adjacency/context deduplication, clear completion, reversal, force reload,
latest-request coalescing, app handoff and batch-versus-stepped equivalence.
Sampling is read-only. Existing folder tests remain part of this verification.

This pass ran all67 tests in `home-banner-lifecycle`, `home-banner-service`,
`home-banner-host` and `home-banner-default`, with no failures or skips.
`npm run typecheck` passes in the runtime worktree. That checkout does not contain
the integration task's later scene/screens host consumers, so its clean typecheck
does not validate their `folder`-to-`primary` migration. The broad model suite was
not needed for these pure modules and was not run against absent local LFS assets.

Root owns scene/screens migration to `primary`/`motion`, rendering readiness,
explicit clear event wiring and browser verification. The elapsed native passes
between close-start and restored selection, native worker retarget races,
application loader states4/5, wall-clock cadence and GPU/mipmap equivalence remain
unproved. This change modifies no renderer, audio module or public assets.
