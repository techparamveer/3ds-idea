# Camera root traversal through rebind consumer publication

The later [linked property continuation](camera-linked-property-publication-audit.md)
runs `0x25a618` through return inside this two-pass fixture with a synthetic
material lookup. The final cell writer, SceneBrowse replacement and pixels
remain open. Statements below describe this audit's earlier checkpoint.

Continuation of the [cache/rebind audit](camera-rebind-source-audit.md) and the
disconnected [browse-strip port](camera-browse-strip-port.md), based on
`c746b5b`. The hash-pinned fixture now carries one logical-5/logical-69
collision through complete `0x2da338`, current completion, original root
sampling and parent/child traversal, two complete `0x2d425c` calls, the
original post-draw consumer rewrite and the original ring router. It establishes
exactly when the final cell writer first receives `ready=1`.

**It does not close the live paging gate.** Input-owner replacement does not
cancel an existing capture, interruption does not clear pass-1 consumer
readiness, final property/cell writers remain recorded leaves, and no pixel or
GPU upload is replayed. The six-item live adapter therefore remains unchanged.
The browser-side scene reset and the exact remaining native evidence are in the
[gallery scene reset audit](camera-gallery-scene-reset-audit.md).

The source remains EUR Camera `0004001000022400`, content
`0000-0000001a`, executable base `0x100000`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
No executable bytes or firmware resources are committed.

## One fixture, bounded stages

[replay_camera_rebind_order.py](../scripts/replay_camera_rebind_order.py) uses
one Unicorn instance and one synthetic object graph:

1. Complete `0x2d9450` allocates the page-11, large-density request queue for
   80 items with logical 69 selected. It submits the 18-item three-page window
   in distance order:
   `69,68,70,67,71,66,72,65,73,64,74,63,75,62,76,61,77,60`.
2. The selected `0x2dbb50` call executes in place inside that allocator. The
   other 17 calls are recorded and intercepted to keep the collision isolated.
3. Original validator `0x2cc654` rejects stale slot-5 tag 5 for request 69 and
   clears the mapped control-2 consumer-ready bit.
4. Original `0x1fb8f8` swaps the three staged descriptor pointers into the
   active array and updates a retained matching pointer. Downstream
   control-owner notification leaves are explicit stubs.
5. Complete original `0x2da338` writes tag 69 and marks control 2 in both
   presentation dirty bitsets later consumed by `0x2d6898` and `0x2d69d0`.
6. Complete `0x2da6fc` first sees old identity 1 at worker status 3 but current
   identity 3 at status 2. It queries only current identity 3 and publishes no
   readiness. After current identity 3 changes to status 3, the same routine
   accepts the staged resource and publishes resource readiness.
7. Original root `0x271ff0` runs manager sampling `0x2752c8`, then generic
   `0x270cc4` for SceneBrowse before-child `0x28455c`, BrowseThumbnail child
   input `0x2d5740`, and SceneBrowse after-child `0x28c358`. It executes
   capture, a cumulative 12px drag, release, recapture and another 12px drag.
8. The first complete `0x2d425c` reaches `0x2cea0c`, consumes the dirty bits,
   reaches final
   property setter `0x25a618`, and runs all 64 original `0x2d92ac` calls.
   For global 69, the intercepted final cell writer receives full tag 69,
   control 2 and `ready=0`. Only after those draw calls does original
   `0x2cf0dc–0x2cf1bc` set consumer-ready bit 2.
9. An input-owner replacement plus manager interruption then run through the
   same root. The first interrupted update skips the disabled child and
   SceneBrowse's parent-after phase re-enables it; the next update enters
   `0x2d5740`, clears capture/drag and writes browse state 2. Neither update
   clears consumer-ready bit 2.
10. The second complete `0x2d425c` reaches the global-69 cell writer with full
    tag 69, control 2 and `ready=1`.

Allocation/free, worker status/release, resource query and downstream
owner/control services are synthetic and listed in the report. Root clock and
analog sampling, unrelated SceneBrowse services, sound/slider leaves, final
property setter `0x25a618`, final cell writer `0x2d804c`,
item-context/render services and post-ring layout are recorded intercepts.
Root touch sampling, generic traversal, current input body, selected submission,
validator, descriptor-pointer swap, complete tag builder, ready publisher,
complete `0x2d425c` bodies, ring router and consumer rewrite are original
instructions. Staged descriptor resources are prepopulated fixtures, not
decoded Camera images.

## Collision behavior

Logical 5 and logical 69 both use masked slot 5. The fixture starts with:

| Field | Initial | After request | After full `0x2da338` | Current complete | First post-draw | Second draw |
| --- | --- | --- | --- | --- | --- | --- |
| Full logical tag | 5 | 5 | 69 | 69 | 69 | 69 |
| Control ID | 2 | 2 | 2 | 2 | 2 | 2 |
| Retained metadata | 1 | `0xff7f` | `0xff7f` | `0xff7f` | `0xff7f` | `0xff7f` |
| Resource-ready `+0x60`, bit 2 | clear | clear | clear | set | set | set |
| Consumer-ready `+0x80`, bit 2 | set | clear | clear | clear | set | set |
| Cell-writer `ready` | — | — | — | — | 0 before rewrite | 1 |

The request does not overwrite the full tag. Complete `0x2da338` does that at
`0x2da370`, then runs its remaining resource-state body. Descriptor installation
still occurs before the tag store in this selected path. Treating URL assignment
as all three operations would collapse source-visible stages.

The stale-completion case is identity-based rather than a callback carrying the
old logical index. With old identity status 3 and current identity status 2,
`0x2da6fc(69)` asks `0x1fd598` only about current identity 3. The old completion
therefore cannot publish readiness for the rebound control in this fixture.
When current identity reaches status 3, publication proceeds.

## Exact consumer publication order

There are still two readiness bitsets:

- `0x2cc654`, called with cache `renderer+4`, validates and clears the
  **consumer-ready** bit at cache `+0x7c`, renderer `+0x80`.
- `0x2da6fc` tests and sets a separate **resource-ready** bit at renderer
  `+0x60`. Its successful current completion also writes control state 5.
- After current completion, renderer `+0x60` bit 2 is set while renderer
  `+0x80` bit 2 remains clear.

The connected passes resolve the handoff. In pass 1, `0x2cea0c` dispatches
dirty control-2 properties to the recorded setter before drawing, but
`0x2d92ac` still supplies `ready=0` because it reads the old consumer bit. The
post-draw `0x2cf0dc–0x2cf1bc` rewrite then sets consumer bit 2. Pass 2 is the
first time `0x2d92ac` supplies `ready=1`.

For this collision sequence, the strip may therefore show logical **69** only
at the final cell writer in the **second presentation pass**, after current
completion and one complete post-draw rewrite. The mapping record's full tag is
69 at both pass-1 and pass-2 cell writes. This “may show” result means the final
writer received `ready=1`; it is not a pixel or GPU-upload claim.

`0x2d92ac` and the rewrite still do not compare the full tag. Safety in this
specific sequence comes from the earlier `0x2cc654` mismatch clearing consumer
bit 2 while the tag is still 5, followed by the complete tag-69 store before
current completion and publication. The replay does not license reordering
those stages or generalize to an untested concurrent owner mutation.

## Owner/input ordering and live decision

The fixture now executes that traversal rather than supplying its order:

`0x271ff0 → 0x2752c8 → 0x270cc4(root) →`
`0x270cc4(SceneBrowse) [0x28455c →`
`0x270cc4(BrowseThumbnail) [0x2d5740] → 0x28c358]`.

The accepted press has active owner ancestry through the eligible control.
Replacing that active input owner before the next update does **not** cancel
the existing capture or re-run ancestry. The 12px sample reaches the drag
writer with flag 0 and changes target 248→236. Release clears capture/drag and
writes state 2. Recapture and another 12px drag reach target 224 before pass 1.

After pass 1 publishes consumer bit 2, the fixture replaces the active input
owner and sets manager `+0x254=0`. The first interrupted root update does not
call `0x2d5740` because the BrowseThumbnail child is disabled; SceneBrowse's
parent-after `0x28c358` clears that child gate. The next root update reaches
`0x2d5740`, clears capture and drag, and writes state 2. Consumer bit 2 remains
set across both updates. The same SceneBrowse/BrowseThumbnail/model pointers
then reach pass 2 and the tag-69 cell writer receives `ready=1`.

This is a negative result for the live gate, not proof of a native stale-image
bug. The replay replaces the input manager's active owner; it does not execute
complete SceneBrowse destruction/replacement, and the executable path has no
browser generation token. It proves that input-owner replacement and current
capture cancellation alone do not retire pass-1 consumer readiness. If a
browser generation reuses that renderer/control bit, stale readiness can cross
the boundary unless the still-unreplayed outer teardown clears it.

Live horizontal paging remains unsafe. The precise remaining source gap is the
outer SceneBrowse replacement/teardown path through renderer/control release,
followed by a new-generation presentation proving that `+0x80` cannot be
consumed under the replacement owner. The pixel gate is independent and also
open: `0x25a618` and `0x2d804c` are recorded leaves, with no texture upload,
composited lower-LCD pixels or matched native sequence. Until both gates close,
the disconnected pure strip controller must not replace the six-item live
adapter.

## Reproduction and evidence limit

Run with `unicorn==2.1.4` and absolute paths:

```sh
python scripts/replay_camera_rebind_order.py \
  --code /absolute/private/camera/exefs/code.bin \
  --output /absolute/private/root-owner-replay.json
```

Private report:
`reference/camera-rebind-source/root-owner-replay.json` beneath the firmware
SSD artifact root. At this worker checkpoint, Python compilation, the connected
replay, prior cache/rebind replay, prior strip replay, 13 focused Camera browse
tests, typecheck, changed-document relative links and `git diff --check` pass.
Logs share the `root-owner-` prefix beside the report. No application build was
run because no runtime, public asset or application source changed.

No runtime or public asset changed. No source render, browser inspection,
emulator session, Camera capture, user-media access, GPU upload, rendered cell
or native visual comparison is claimed.
