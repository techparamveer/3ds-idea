# Camera cache collision, deferred release and touch ancestry

Continuation of the [owner/lifecycle audit](camera-owner-lifecycle-source-audit.md),
based on integration `5c766e7`. This adds executable evidence for cache validation
and release, plus an isolated touch-ancestry gate. **It does not establish the
complete thumbnail completion writer or owner/frame sequence. Live gallery
paging remains unchanged.**

[replay_camera_rebind.py](../scripts/replay_camera_rebind.py) runs the Camera ARM
instructions from the same SHA256-pinned EUR executable as the previous audit.
No firmware bytes are committed. Worker status and release services are explicit
fixtures, not actual decoder work.

## Logical identity survives the 64-slot wrap

`0x2cc654(cache, logicalIndex, count, outReady)` clamps count to64 and indexes
`cache[+0x14]` by `logicalIndex &63`. Each eight-byte record has a full logical
index at+0, control ID at+2 and retained item metadata at+4. The **full index**
comparison at `0x2cc698–0x2cc6a0` is necessary; the masked cache slot is not
sufficient identity.

The complete routine is replayed for logical69 and old logical5, which share
slot5, mapped to control2:

| Supplied worker status | Record tag | Output pointer | Initial ready | Final ready |
| --- | --- | --- | --- | --- |
| 2 | 69 | present | yes | yes |
| 2 | 5 | present | yes | no |
| 3 | 5 | present | yes | no |
| 2 | 69 | absent | yes | no |
| 2 | 69 | present | no | no |

The query resolves the **requested item's** identity through `0x1fd048` and
`0x210de8`. The fixture deliberately uses requested photo3 and retained photo1;
these identities must not be conflated. Status3 plus a mismatched logical tag
also takes the non-ready path. This verifies the validator's refusal to retain
stale readiness, **not a complete asynchronous completion callback**.

## Old bindings have a deferred-release lifecycle

The complete `0x1fd6a8(cache, start, count, clearReady)` resolves the **retained
binding's** photo identity. For supplied status2 it appends that identity to the
vector at cache+4/+8/+12. Other tested status3 releases through `0x1fd428`
immediately. Both paths invalidate the retained metadata low halfword with
**`0xff7f`**, read from literal `0x1fd8d8`; it is not `0xffff`.

The routine clears readiness only when the old full tag lies inside the
requested interval and `clearReady` is set. A logical5 binding released through
logical69's colliding slot therefore has its metadata invalidated, but this
routine leaves its ready bit unchanged. The later validator clears readiness
for the mismatch. Reproducing only one of these routines would give different
behavior.

Replay uses descriptor kind0 and a preallocated vector; descriptor kind4/5
cleanup and vector growth are outside these cases. It tests immediate/deferred
release, matching/colliding tag and `clearReady=0` separately.

The original deferred-release loop at **`0x2d4a88–0x2d4b70`** is also replayed,
with its entry registers supplied. Status2 entries remain queued. Completed
entries release and are removed by shifting the rest left; the loop checks the
same position again after removal. All-running, all-completed and two mixed
three-entry queues verify that adjacent completions are not skipped and running
entries retain their order. This is a block replay, not a whole scene callback.

## Presentation contains multiple stages before queue cleanup

Static tracing of BrowseThumbnail presentation `0x2d425c` establishes this local
ordering on the relevant path:

1. `0x2d4788`: copy slider output through `0x2caa4c`.
2. `0x2d4808`: submit the distance-ordered rebind requests through `0x2d9450`.
3. `0x2d49b0–0x2d4a60`: iterate buffered candidates, invoking `0x2da338` when
   dirty, then gated `0x2da6fc` and `0x2db460`.
4. `0x2d4a6c`: clear renderer dirty flag; `0x2d4a70` calls `0x2cea0c`.
5. `0x2d4a88`: drain the deferred-release queue.

These calls have additional state gates; this list is not a claim that every
call runs each frame. In particular, the complete resource installation and
ready-bit writer in `0x2da6fc` and related paths remains to be replayed with the
rebind request. Static inspection of `0x1fb8f8` also shows retained resource
swapping across descriptor arrays, so a browser URL assignment alone would not
reproduce the native binding lifecycle.

## Touch ancestry is narrower than equality

Original block **`0x2d5960–0x2d5980`** is replayed separately, stopping before
accept/reject destinations. With the geometry and earlier owner gates assumed:

- No active owner (`manager+0x25c=0`) passes this gate.
- An active control whose parent or higher ancestor is the eligible control
  passes.
- An unrelated parent chain fails.
- An active control equal to the eligible control **does not itself suffice**:
  the loop loads its parent before comparing. The replay uses a null parent
  for this case, which fails.

This clarifies the previous shorthand “walk until the eligible control.” It is
not proof of full touch capture: region containment, global and owner gates,
release/cancellation, drag history and parent-after-child owner mutations still
need to execute in one fixture with image completion and mode changes.

## Verification and precise remaining boundary

Run with `unicorn==2.1.4`, absolute `--code` and `--output` paths. Private output:
`reference/camera-rebind-source/replay.json` beneath the firmware artifact root.
The new replay, Python compilation, relative documentation links and
`git diff --check` pass. No application assets or runtime files changed; no
browser inspection, source render or application build is claimed.

At this checkpoint, the next prerequisite was to combine **request allocation,
full-tag writes, descriptor resource installation and ready-bit publication**,
then execute those stages with owner input/presentation traversal and touch
cancellation. A later
[strip-port replay](camera-browse-strip-port.md) shows the ring router passing
a mapped ready bit without comparing the full logical tag, and the post-draw
bitset rewrite keying bits by mapping control. Those fragments do not install
resources or publish ready bits, and live paging remains unchanged. This audit
narrows stale-readiness and deferred-release behavior without claiming that
remaining sequence, upload ordering or native visual equivalence is solved.

The later [combined ordering replay](camera-rebind-order-source-audit.md)
now executes those bounded request, complete tag/resource, readiness and
two-pass presentation stages in one fixture. It proves that `0x2da6fc`'s
resource-ready bit and the ring consumer's post-draw ready bit are separate,
and that tag 69 first reaches the cell writer ready on the second draw.
Enclosing owner/touch traversal and actual GPU/pixel output remain the live
gate.
