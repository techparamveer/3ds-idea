# Camera rebind ordering and split readiness publication

Continuation of the [cache/rebind audit](camera-rebind-source-audit.md) and the
disconnected [browse-strip port](camera-browse-strip-port.md), based on
integration `19db308`. This executes request allocation, the selected rebind,
the full logical-tag store, descriptor installation and resource-ready
publication in one hash-pinned fixture. **It does not close the live paging
gate:** the resource-ready bit published by `0x2da6fc` is not the ready bit
consumed by the ring router.

The source remains EUR Camera `0004001000022400`, content
`0000-0000001a`, executable base `0x100000`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
No executable bytes or firmware resources are committed.

## One fixture, bounded stages

[replay_camera_rebind_order.py](../scripts/replay_camera_rebind_order.py) uses
one Unicorn instance and one synthetic object graph:

1. Complete early-cancel entry `0x2d5740` changes browse state 1 to 2 and
   clears capture and drag before any request work.
2. Complete `0x2d9450` allocates the page-11, large-density request queue for
   80 items with logical 69 selected. It submits the 18-item three-page window
   in distance order:
   `69,68,70,67,71,66,72,65,73,64,74,63,75,62,76,61,77,60`.
3. The selected `0x2dbb50` call executes in place inside that allocator. The
   other 17 calls are recorded and intercepted to keep the collision isolated.
4. Original validator `0x2cc654` rejects stale slot-5 tag 5 for request 69 and
   clears the mapped control-2 consumer-ready bit.
5. Original `0x1fb8f8` swaps the three staged descriptor pointers into the
   active array and updates a retained matching pointer. Downstream
   control-owner notification leaves are explicit stubs.
6. Original `0x2da338–0x2da370` writes the complete tag 69 to slot 5. The
   fixture stops at the following instruction; it does not claim the remainder
   of `0x2da338` built a real decoder resource.
7. Complete `0x2da6fc` first sees old identity 1 at worker status 3 but current
   identity 3 at status 2. It queries only current identity 3 and publishes no
   readiness. After current identity 3 changes to status 3, the same routine
   accepts the staged resource and publishes resource readiness.

Allocation/free, worker status/release, resource query and downstream
owner/control services are synthetic and listed in the report. The selected
submission, validator, descriptor-pointer swap, tag store and ready publisher
are original instructions. Staged descriptor resources are prepopulated
fixtures, not decoded Camera images.

## Collision behavior

Logical 5 and logical 69 both use masked slot 5. The fixture starts with:

| Field | Initial | After selected request | After tag stage |
| --- | --- | --- | --- |
| Full logical tag | 5 | 5 | 69 |
| Control ID | 2 | 2 | 2 |
| Retained metadata | 1 | `0xff7f` invalid | `0xff7f` |
| Consumer-ready, renderer `+0x80`, bit 2 | set | clear | clear |

The request does not overwrite the full tag. Presentation's dirty-binding stage
does that later at `0x2da370`. Descriptor installation occurs before the tag
store in this isolated selected path. Treating URL assignment as both operations
would collapse source-visible stages.

The stale-completion case is identity-based rather than a callback carrying the
old logical index. With old identity status 3 and current identity status 2,
`0x2da6fc(69)` asks `0x1fd598` only about current identity 3. The old completion
therefore cannot publish readiness for the rebound control in this fixture.
When current identity reaches status 3, publication proceeds.

## There are two readiness bitsets

The combined replay corrects the remaining ambiguous shorthand:

- `0x2cc654`, called with cache `renderer+4`, validates and clears the
  **consumer-ready** bit at cache `+0x7c`, renderer `+0x80`.
- `0x2da6fc` tests and sets a separate **resource-ready** bit at renderer
  `+0x60`. Its successful current completion also writes control state 5.
- After that completion, renderer `+0x60` bit 2 is set while renderer `+0x80`
  bit 2 remains clear.

The earlier strip replay showed `0x2cf0dc–0x2cf1bc` rebuilding the consumer
bitset after drawing, keyed by mapped control without a full-tag comparison.
That fragment was not connected to this completion fixture. Therefore
`0x2da6fc` success alone does not make a thumbnail consumable by `0x2d92ac`.

## Owner/input ordering and live decision

The fixture orders complete early cancellation before allocation and
presentation milestones:

`0x2d5740 → 0x2d9450 → 0x2dbb50 → 0x2cc654 → 0x1fb8f8 → 0x2da370 → 0x2da6fc → 0x2dab00`

This is a supplied sequence consistent with the already traced after-child
input and later presentation phases. It is **not** one execution of generic
parent/child traversal. Current touch capture, ancestry, 12px drag, release,
parent-after-child owner mutation and interrupted-touch cancellation are not
executed together here.

Live horizontal paging remains unsafe. The precise next gate is one original
presentation sequence that connects full `0x2da338`, gated `0x2da6fc`,
upload/resource observation, `0x2cea0c`/the `0x2cf0dc` consumer rewrite and
`0x2d92ac`, while a current touch capture/release/cancel path runs through its
enclosing owner traversal. Until then, the disconnected pure strip controller
must not replace the six-item live adapter.

## Reproduction and evidence limit

Run with `unicorn==2.1.4` and absolute paths:

```sh
python scripts/replay_camera_rebind_order.py \
  --code /absolute/private/camera/exefs/code.bin \
  --output /absolute/private/combined-order-replay.json
```

Private report:
`reference/camera-rebind-source/combined-order-replay.json` beneath the
firmware SSD artifact root. Python compilation, the new replay, the prior
rebind/strip replays, 13 focused Camera strip tests, typecheck, production build,
relative documentation links and `git diff --check` pass. The full repository
suite records 1,150 passes, 21 skips and 39 failures; all 39 failures are
hardware/source-model tests reading unhydrated Git LFS pointer text
(`lfs.github.com/spec/v1` / `version https`) from this worktree, outside this
Camera audit.

No runtime or public asset changed. No source render, browser inspection,
emulator session, Camera capture, user-media access or native visual comparison
is claimed.
