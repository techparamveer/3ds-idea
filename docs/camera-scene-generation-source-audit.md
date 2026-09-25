# Camera renderer generation boundary

The later [complete cell-writer replay](camera-cell-publication-source-audit.md)
executes retained node/pane output through return. Layout binding and photo
pixels remain separate gates; it does not wire live strip paging.

The 25 September continuation executes the **original control setup prefix**
from `0x2d6ce0` through its 64-record loop and readiness reset in the same
synthetic reuse sequence. The setup tail, SceneBrowse replacement caller and
pixels remain open.

This continues the [gallery reset audit](camera-gallery-scene-reset-audit.md)
and [root/rebind ordering replay](camera-rebind-order-source-audit.md), based on
`2e9ca4d`. **Live horizontal scrolling remains disconnected.** The source now
locates readiness reset and executes embedded renderer cleanup, but the complete
SceneBrowse replacement caller and final pixels remain unproved.

Source: EUR Camera `0004001000022400`, content `0000-0000001a`, ARM base
`0x100000`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
No firmware bytes, media or public assets are added.

## New executed evidence

[replay_camera_scene_generation.py](../scripts/replay_camera_scene_generation.py)
runs these bounded stages against the original executable. Only allocation
`0x262340` and free `0x262338` are intercepted; allocated buffers are filled
with `0xcc`, not assumed to start at zero. The stages use synthetic objects.
They are deliberately not presented as one native scene replacement sequence.

| Stage | Original instructions executed | Result |
| --- | --- | --- |
| Embedded renderer constructor | Complete `0x2de648`, including `0x2cde50`, `0x2d659c`, `0x2d89e8` and deque construction | Both `0xa5` and `0x5a` object-poison trials preserve all four words at renderer `+0x60/+0x64` and `+0x80/+0x84`. The constructor writes neither readiness bitset. Its 64 pose records are explicitly zeroed |
| Later control setup reset | `0x2d73bc` through `0x2d73f0`, stopping before `0x2d73f4` | Clears both 64-bit readiness bitsets. This is an isolated reset fragment, not execution of the preceding control setup |
| Cell writer's retained-history prefix | `0x2d804c` through `0x2d8108`, stopping before `0x2d810c` | Both owner flags at `+0x2237` must be nonzero before the old/current pose and ready state advance. Six combinations cover incoming ready 0/1 and either owner disabled |
| Embedded renderer destructor | Complete `0x2de714 → 0x2cded4 → 0x2d8b94 → 0x2d6b00`, then mapping/vector cleanup | Under a supplied 64-control/descriptor graph, active control 2 is detached, its parent dirty flag clears, active control bitsets clear, retained pointers clear, and the descriptor/pose buffers reach free |
| Synthetic same-address reuse | Complete embedded destructor, fresh `0x2de648` constructor, then original `0x2d6ce0` through its 64-record loop and reset stores, stopping before `0x2d73f4`, in one Unicorn instance | An explicitly seeded stale control-2 resource/consumer bit survives construction (`0x4`/`0x4`) and clears after setup reaches the reset (`0x0`/`0x0`). Child attachment `0x25e6d8` is a recorded leaf. This is an ordering probe, not the native SceneBrowse replacement caller or complete setup tail |

Destructor controls and descriptors are synthetic. Their direct-detachment route
is selected explicitly. No image worker, native SceneBrowse, texture upload or
GPU service is fabricated by those tests. Allocator/free calls are recorded;
free does not poison or unmap memory. The first constructor trial's allocations
are not interpreted as a live previous generation. The destructor uses the
second construction's containers with the explicitly supplied control graph.
The same-address probe deliberately seeds the stale bit after destruction to
test a worst-case reused address. It proves the reset's position relative to
construction and the executed 64-record setup loop for that address. It does
not show stale bits surviving native destruction, nor that a new SceneBrowse
reaches setup before presentation.

## Where the stages belong

The replay also checks these direct branch targets and vtable entries against
the pinned executable. This table is **static call evidence**, separate from the
executed stages above:

- SceneBrowse vtable `0x41f8b8` names destructor `0x28d7f4`;
  BrowseThumbnail vtable `0x42044c` names destructor `0x2d6420`.
- SceneBrowse initialization allocates the thumbnail child and calls
  `0x2d5cac` at `0x28b69c`, stores it at SceneBrowse `+0x48`, and attaches it
  beneath the control at SceneBrowse `+0x44`.
- BrowseThumbnail construction calls `0x2de648` at `0x2d5d14` for its embedded
  renderer at child `+0x120`.
- BrowseThumbnail control setup calls `0x2d6ce0` at `0x2d23b4`, passing child
  `+0x164`, which is renderer `+0x44`. After that routine's 64-control loop,
  the reset stores at `0x2d73c0/0x2d73c4` clear renderer `+0x60/+0x64`, and
  `0x2d73e0/0x2d73e4` clear renderer `+0x80/+0x84`.
- BrowseThumbnail destruction calls `0x2de714` at `0x2d6570`. That destructor
  calls `0x2cded4` at `0x2de7e8`, which calls `0x2d8b94` at `0x2cdee0`;
  its `0x2d8ba8` call reaches control retirement `0x2d6b00`.
- Ring router `0x2d92ac` calls the final cell writer at `0x2d9430`, passing
  renderer `+0x44`. That writer's pose records live at its `+0x108`, each
  `0x2c` bytes. Before the rest of its draw logic, it copies current
  `+0x14..+0x27` into previous `+0x00..+0x13`, accepts incoming readiness at
  record `+0x21`, transfers the pending marker `+0x28` to `+0x22`, and clears
  `+0x28`. If either owner flag is zero, this prefix preserves the record.

Thus “the replacement constructor clears readiness” is false for this source.
The reset belongs to a later setup phase. Likewise, “ready=1 reached the cell
writer” does not prove that new photo pixels were drawn: retained owner/pose
state and the remaining material, visibility and raster path still matter.

## Exact integration gate

Keep the live six-item page adapter until one linked scenario establishes:

1. The original caller retires/replaces SceneBrowse, including child/reference
   ownership and pending work. Executing the embedded destructor alone does not
   prove that caller runs on gallery re-entry, or that the whole scene is rebuilt.
2. The replacement reaches complete native control setup, including the reset
   block above, before any request or presentation can consume those bitsets.
   Then replay a new logical binding and its current completion into the existing
   two-pass publication fixture under that replacement owner.
3. The remainder of `0x2d804c`, property writer `0x25a618`, pane/material selection
   and uploaded photo resource produce the lower display. The prefix replay is
   a retained-state check, not pixel evidence. Never replace it with immediate
   `HTMLImageElement.onload` readiness.
4. A coordinator-owned native/browser sequence measures re-entry placeholders,
   first thumbnail pixels and scroll checkpoints. The nominal 60 Hz adapter is
   not measured native cadence.

Browser URL/owner isolation remains covered by the existing
[camera gallery lifecycle tests](../tests/camera-gallery-lifecycle.test.mjs).
No independent browser defect was found that licenses a runtime change here.
The six-cell page jump, generic footer and upper preview adaptations remain.

## Reproduction and checks

```sh
python scripts/replay_camera_scene_generation.py \
  --code /absolute/private/camera/exefs/code.bin \
  --output /absolute/artifacts/scene-generation-replay.json
```

Use `unicorn==2.1.4`. All constructor, reset, six cell-prefix and complete
embedded-destructor assertions passed. The script rejects a source hash mismatch
before execution. `git diff --check` passed. No application code, delivery asset
or shader changed, so no production rebuild was run. No browser inspection,
Azahar capture, photo pixel output or visual parity is claimed.

The SSD was full; the orchestrator explicitly assigned a home-disk clone and
artifacts for this bounded pass. Report and private disassembly scratch:
`/Users/paramveer/CodexArtifacts/firmware-10.7.0-32E/camera-live-gate/`.

The 24 September continuation added the synthetic same-address probe above to
`scripts/replay_camera_scene_generation.py` and a focused test. With the pinned
Camera executable, the probe passes and writes
`synthetic-reuse-replay.json` in the same private artifact directory. It
narrows a future verifier requirement: prove the real replacement caller runs
complete control setup, including the reset, before any new-generation request
or presentation. It does not close the independent photo-pixel gate or license
live strip wiring. No browser or native LCD comparison was made in this worker.

The 25 September continuation replaces that probe's isolated reset fragment
with original `0x2d6ce0` execution from entry through 64 record iterations
and the reset, stopping before `0x2d73f4`. The pinned-source test passes and
the updated private report is `linked-scene-setup.json` in the home artifact
directory. This narrows the setup sequence; it still does not show the real
SceneBrowse replacement caller, full setup return, or a new-owner request and
presentation under that setup.
