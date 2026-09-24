# Camera image lifecycle, mode switch and ring routing

This continues the [preview lifecycle audit](camera-preview-lifecycle-source-audit.md)
in an isolated worktree based on integration `3698dae`. It corrects an important
assumption: **image helper `+0xe0` is an initialization latch, not asynchronous
image completion**. The mode switch and ring presentation are now replayed more
precisely. Live horizontal paging remains unchanged because rebinding and combined
touch ownership are not yet verified end-to-end.

The source is the same EUR Camera executable pinned by
[audit_camera_grid.py](../scripts/audit_camera_grid.py), SHA256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`, base `0x100000`.
No firmware bytes are published.

## Initialization and actual image completion are separate

`SceneBrowse+0x80c` is an embedded helper containing a pointer to an image
state object. Constructor `0x2eea78` clears helper `+0xdc/+0xe0` and creates
the image object. `0x289d8c` checks the latch and, when global gates permit,
invokes **`0x2ee83c`**. That routine allocates backing memory, configures two
image records through `0x2eebe4`, and **synchronously writes `helper+0xe0=1`**.
A later call with this latch set returns without reallocating. There is no
worker-completion query in that routine.

The worker lifecycle lives on **`image = helper[0]`**, not directly on the
embedded helper:

| Field / routine | Source behavior |
| --- | --- |
| `image+0xb4` | state0 on new request; state1 on start; state2 on final readiness; state3 on failure |
| `image+0xb8/+0xbc` | current member callback and adjustment; dispatched by `0x2eea50` |
| `image+0xc4` | outstanding worker request handle, cleared to−1 on release |
| `0x2eede8` | resets old work and state, copies new item identity at `+0xc8` |
| `0x2eebd8` | writes state1; it does not decode synchronously |
| `0x2ef470` | polls the first resource stage; status3 advances, status0/4 select failure |
| `0x2ef070`, `0x2ef5f8` | poll decode requests through `0x20b068`; status3 selects a finalizer; status0/4 release requests and select `0x2eeed4` |
| `0x2ef0d0`, `0x2ef658` | finalize worker output/metadata and schedule later presentation callbacks |
| `0x2ef758` | waits until image record `+0x48` clears, then selects `0x2ef43c` |
| `0x2ef43c` | writes state2 on a subsequent callback dispatch |

`0x2ee96c` handles image records and clears their dirty/upload flag at record
`+0x3c` (first record starts at image `+0x0c`, hence image `+0x48`). The
complete graphics-service and callback ordering is not reproduced here. Do not
interpret an HTML image `onload`, helper initialization, worker status3 and
presentation state2 as the same native event.

The owner starts work through `0x28a4c0`, later signals start at `0x28a678`,
and checks **image state2** at `0x28a794–0x28a7a4`. It has additional current
item, child status and fade gates before installing the image and fading back
in. This is the actual continuation point for a browser image adapter; the old
`helper+0xe0` interpretation would permit an image too early.

## Mode switch: saved render configuration, not a page tween

The complete **`0x210ce4`** and its callees `0x212ed4`, `0x20fea0`, `0x212fbc`
execute without intercepted calls in the new replay:

1. Write mode byte `owner+0x530`.
2. For mode1 clear control `owner[+0x12b8]+0x30` bits `0x1e`; otherwise set
   them. Other flag bits survive. Generic input/presentation traversals inspect
   some of these flags, but the complete control/layer identity is not asserted.
3. Restore any prior saved render configuration from `owner+0xce8`.
4. Save and replace global render manager pairs `+0x2a8/+0x2b0`, using mask
   `0x4100` for nonzero mode or `0x4000` for zero, and RGBA opaque black.
   Save-mask6 selects these two pairs; pair `+0x2b8` remains unchanged.

Repeated mode1→0→1 changes preserve the original saved pairs. Calling the
restore routine reinstates them and clears the save mask. The source does not
set a scroll target, page duration or photo alpha in this routine. Identifying
the complete rendered composition still requires the control and render-manager
consumers, rather than assigning a visual meaning from the numeric masks alone.

## Three-page presentation consumes a separate binding table

The complete **`0x2d92ac`** is replayed up to its downstream control writer
`0x2d804c`, which is intercepted to record arguments. For large density:

- Candidate global index is unsigned16 `(currentPage−1)×6+slot`.
- Only slots0..17 can be valid. Padded-page validity and real-item existence
  are separate checks; seven photos allow padded indices7..11.
- Page translation is selected through the modulo-three page ring.
- **The thumbnail control is not simply `slot`**: the routine reads an
  eight-byte mapping record at `renderer[+0x18]+(globalIndex & 63)×8`, with
  the control ID at record `+2`.
- Control IDs below64 can be drawn. A ready bit from the mapped control's
  bitset controls whether a real image is available. Sentinel64 suppresses
  the final writer. Valid padded cells still receive placement with no real
  image. Coordinates supplied on invalid branches are not drawing evidence.

Replay covers seven-item page1/page2, an80-item page11 that crosses the64-record
mapping wrap, padded validity, mapped ready-bit suppression and sentinel64.
The mapping table is explicitly synthetic (`recordIndex %18`), with source
geometry228×132, mount `[0,13]` and page spacing248. This verifies the consumer;
it **does not claim the native allocator uses modulo18**.

Rebinding is a separate path. **`0x2d9450`** derives up to
`min(3×itemsPerPage,64)` requests, builds candidates from the three-page range,
records distance from selected item in the upper16 bits
(`0x2d9928–0x2d9a18`), orders its queue, and submits through **`0x2dbb50`**.
When the selected item is outside the buffered range, `0x2d9d24–0x2d9d4c`
submits it separately before the queue loop. This explains why drawing18
neighbouring items from current browser URLs does not establish native
rebinding, eviction or stale-completion behavior. The queue/worker completion
writers for the mapping and ready bits remain to be replayed together.

## Input ordering still constrains a live adapter

Existing traversal evidence remains: input runs parent-before, child traversal,
parent-after (`0x270cc4`); presentation runs parent first (`0x27135c`). Owner
`0x28c358` gates its control only after the child input pass. Current touch input
`0x2d5740` has additional gates beyond the already replayed cancellation:

- child control state0/1/2 and flags `0xc2` at `0x2d57d4–0x2d5828`;
- current-context identity, manager flags and blocked browse state at
  `0x2d583c–0x2d5880`;
- hit-region containment, then **active owner ancestry**: starting at manager
  `+0x25c`, walk parent `+0x10` until the eligible control is found, otherwise
  reject capture (`0x2d5960–0x2d5980`);
- retain capture and drag separately; a qualifying drag resets history, then
  supplies negative horizontal delta to the slider (`0x2d5984–0x2d5a5c`);
- release clears both flags and enters browse state2 before returning; it
  does not immediately issue a new key candidate (`0x2d5a64–0x2d5ab0`).

The existing early-cancel replay does not prove these paths together with owner
mode changes, image completion, folder changes and suspension. The browser
adapter must stage them per Camera owner without altering HOME repeats.

## Verification and remaining boundary

New [replay_camera_owner_lifecycle.py](../scripts/replay_camera_owner_lifecycle.py)
requires `unicorn==2.1.4` and absolute `--code`/`--output` paths. Private report:
`reference/camera-paging-owner-source/replay.json` under the firmware artifact
root. Mode switching/restoration runs original instructions without stubs.
Initialization stubs only allocation and two-record configuration. Worker polling
stubs only status/release services. Ring routing intercepts only its downstream
writer. Readiness callback dispatch is original code with an explicitly supplied
upload-flag change; it is not a GPU upload replay.

New replay, existing scroll/input/blank-presentation replays, Python compilation,
relative links and `git diff --check` pass. No application/public assets changed;
no application build, browser inspection or new source render is claimed.

The next bounded implementation prerequisite is **mapping/ready-bit rebinding
and stale completion, followed by combined touch ancestry/cancellation and
owner phase replay**. Initialization is no longer an unknown decoder wait.
Mode-state memory changes are established; full screen-layer composition and
native frame comparison remain open. Live paging implementation awaits that combined verification.
