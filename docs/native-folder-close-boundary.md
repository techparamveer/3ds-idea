# Native folder-close request boundary

This source-only investigation establishes the normal folder-close boundary for
European HOME Menu 10.7.0-32E. Closing starts an explicit type13 clear request;
restored root selection is requested later, after the lower folder animation
becomes idle. The proposed runtime contract below is **not implemented** by this
change. The current immediate Back reducer still needs integration work.

## Start and completion

The Back control requests mode44 at `0x2a451c–0x2a4530`. State setter
`0x1e8f38` saves the previous mode at scene+0x3a81, writes current mode at
scene+0x3a80, then immediately dispatches setup through `0x1e3a70`.
Mode44's setup entry `0x1e44a8` tail-calls `0x1de370(scene,0)`.

| Native source | Normal-close operation |
| --- | --- |
| `0x1de434–0x1de474` | Set capture controller scene+0xe34 and folder controller scene+0xe30 to playback mode1 (reverse), then start each |
| `0x1de544–0x1de54c` | Request banner category3 through `0x1d71c0`; the mapped native type is13 and key is `(-1,-1,medium0)` |
| `0x1de558` | Prepare the lower folder/icon layout through `0x2a6cf4` |
| `0x1de570` | Emit close sound ID0x01000035 |
| `0x2b7924–0x2b7928` | Mode44 update calls `0x29f0a4` |
| `0x29f110–0x29f120` | Reject completion while scene+0xe30 status is1 (playing) **or2 (stopped)** |
| `0x29f12c` | Once the predicate permits it, call root restoration `0x2b021c(scene,0)` |

There is no banner-worker, banner-visibility or capture-controller check in that
completion predicate. These systems must not be joined into an artificial
"wait until clear finishes" barrier. The predicate accepts status values other
than1/2; the normal started nonlooping controller reaches0 (idle).

The nonzero second argument to `0x1de370` is a separate immediate path: it seeks
the animation endpoints, skips the normal clear/sound block, and calls root
restoration directly. It is outside the normal Back contract.

## Animation clock and eligible passes

Construction at `0x2b2b7c–0x2b2b80` binds `LncFolder_00_FadeIn.bclan` to
`G_Scene_00` and stores its controller at scene+0xe30. The resource contains
17 frames and does not loop. Its authoring metadata range `[-16,0]` is **not**
the runtime controller interval: `0x132fe8–0x1330a4` reads the `pai1` frame count,
subtracts1 for a nonlooping resource and initializes start0, end16, step1.
The companion `LncFolderCapture_00_Fade.bclan` has9 frames, giving interval0…8.

The original reverse start sets frame=end, status1 and endReached=false.
`0x269430` applies the current frame to the animation transform **before**
`0x1bbd94` advances its clock. Reaching frame0 sets endReached while remaining
playing; a later advance sets stopped; another advance sets idle.

| Completed eligible layout-controller advances | Folder frame | Applied frame at that advance | Status after advance | Next close predicate permits root commit |
| --- | --- | --- | --- | --- |
| 0, immediately after reverse start | 16 | Not applied by this start | 1 | No |
| 1 | 15 | 16 | 1 | No |
| 15 | 1 | 2 | 1 | No |
| 16 | 0 | 1 | 1, endReached=true | No |
| 17 | 0 | 0 | 2 | No |
| 18 | 0 | 0 | 0 | Yes |

The capture controller is idle after10 advances; that does not release the
folder close. Looking only at a sampled frame0 or subtracting a17-frame duration
would release the root too early.

The native outer ordering is statically traced through these calls and vtables:

1. Outer `0x102288` calls task walker `0x1067dc` at `0x1022cc`.
2. Walker calls task dispatcher `0x10e228`, whose running state invokes
   virtual+0x20. Lower HOME vtable `0x322364+0x20` selects `0x2b56e8`; its mode44
   branch calls the close update above.
3. After the task walker, `0x1022d4` runs the 3D scene/controller pass.
4. `0x1022dc` then calls the 2D layout walker `0x103df8`.
5. A live layout's virtual+8 selects `0x1f58e4` through vtable `0x3217f0`;
   this walks its controllers and calls virtual+0xc.
6. The folder CLAN controller's vtable `0x321828+0xc` selects `0x269430`.

Consequently, with one eligible layout advance and one eligible lower-state
update per normal outer update, close setup in updateN is followed by layout
advance1 in that update. Advance18 occurs in updateN+17; the close predicate
observes idle and restores root in updateN+18. This counts19 updates including
the setup update. It is not19 additional advances, and it is not a millisecond
claim. The fixture proves the18 controller advances; full outer ordering is a
static call-chain result, not whole-application emulation.

Eligibility is separate: the global walker skips a layout when layout+0x60 is
zero; the layout method skips its controllers when layout+0x5c is2. The fixture
executes both gates and confirms attempted blocked passes do not advance the
clock. Task eligibility can separately defer the next completion observation.
The source also has another layout-walker call in capture code `0x1b573c`;
the conditional normal-outer timeline must not be generalized to every capture
or suspended state. Rendering samples must not advance these clocks.

## Root restoration and the next request

Root commit `0x2b021c` saves folder history at `0x2b0278`, restores root history
through `0x1d9ea0` at `0x2b0288`, writes active folder=-1 at `0x2b0294`, and
updates the native context map at `0x2b02c0`. The remainder hides the folder and
capture layouts and rebuilds the root presentation. It does not itself call
banner refresh.

For the ordinary path (no external object at scene+0x3fd0, no special selection
at scene+0x3c2a, and no pending scene+0x1180/scene+0xaec handoff), close update
then compares restored selection with the restored viewport:

- A visible selection enters mode0 at `0x29f258–0x29f260`.
- A selection before the visible interval enters mode3 at `0x29f2ac–0x29f2b4`.
- A selection at or beyond its exclusive end enters mode3 at
  `0x29f30c–0x29f314`.

Mode0 setup tail-calls `0x29a184`, which calls `0x1e0f44` banner refresh at
`0x29a4dc` in the **same state-setter invocation**. The root request therefore
occurs on the completion update for an in-view selection. It must be resolved
from the restored selected slot; it is not necessarily the folder that closed.
The existing default/folder/app classification still applies.

Mode3 first adjusts the viewport. Setup `0x2a3600` resets scene+0x11a4 to0 and
chooses scene+0x11a8 as10 eligible task updates when source counter
scene+0x3c98 is below5 (incrementing that source counter), otherwise5.
Update `0x2a1bbc` increments the elapsed counter and returns true when it reaches
that threshold. Mode3 dispatch at `0x2b70b0–0x2b70b8` then enters mode0 and
refreshes the banner synchronously. The fixture executes both10/5 boundaries.
How the application should maintain that source acceleration counter across all
other navigation paths is outside this close-only proposal. It must not silently
substitute a guessed millisecond delay or assert every close needs10 more ticks.

External/special cases branch to modes14/16 or another direct refresh path;
the ordinary contract must preserve an explicit unsupported/deferred boundary
for those cases until their caller state is modeled.

## Proposed minimal deterministic contract

This is a proposal for the integration owner, not an implemented API:

- `beginNormalFolderClose` creates one generation-scoped transition, retains the
  active folder and its history, initializes reverse folder/capture controller
  state, and emits one `closeStarted` observation carrying type13 clear. Normal
  folder grid actions no longer route through settled mode0 while closing.
- An eligible lower-state pass first checks the retained folder-controller
  status. While it is1/2 it emits no restored selection. The later eligible
  layout pass advances each controller with apply-before-advance semantics.
  Host batches must interleave these phases for each step.
- The first eligible lower-state pass observing idle commits root history and
  context once. Its outcome is either settled root or explicit viewport
  adjustment. Settled root immediately emits `rootSelectionReady` with the
  resolved current root target. Viewport adjustment retains clear until its
  separately counted native mode3 completion emits that observation.
- The banner host sees clear as the selected request throughout the transition.
  It receives the restored target only at `rootSelectionReady`, even though
  mode3 has already restored the root menu context. No banner activation ACK is
  needed to advance the lower transition.
- Generation/transition IDs discard stale completion after System replacement
  or cancellation. Independent task/layout eligibility is explicit. None of
  these events are emitted from paint calls or guessed wall-clock thresholds.

This separates the two source request boundaries without inventing a queue in
the banner service. If the native manager is inhibited for the entire interval,
its latest-request latch can still coalesce clear and the later target; the
transition must not force an intermediate clear activation. Relative ordering
of the lower task and upper banner task within their shared task list has not
been established here, so the contract does not claim which manager invocation
first consumes either observation.

## Evidence and verification boundary

Numeric results are committed as
[native-folder-close-boundary.json](evidence/native-folder-close-boundary.json).
Private reproducer:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/folder-close/execute-close-boundary.py`.
Run it with the same artifact root's `assets/research-venv/bin/python`.
The report pins its script hash, CLAN hashes, Unicorn version and executable
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Original controller construction, reverse start subsection, global/layout
walkers, frame clock, close predicate, root history copy and viewport counters
execute in Unicorn. The close-predicate fixture stops on entry to root commit.
A separate post-commit branch fixture preloads restored history and stubs the
whole root commit; it stops at the state setter. Ancillary theme updates and
viewport geometry interpolation are explicit stubs. Pane groups are empty,
and layout geometry/GPU rendering is not evaluated.

The remaining uncertainty is task eligibility, cross-task scheduling, special
caller paths, actual wall-clock/display cadence and complete visual integration.
The normal CLAN completion predicate and18-advance boundary are now established.
No application files, public assets, audio, scene/screens, browser or Azahar were
changed or run. Documentation and numeric source evidence do not require an
application build.
