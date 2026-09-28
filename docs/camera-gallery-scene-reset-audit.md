# Camera gallery scene reset: browser lifecycle and remaining native evidence

The later [renderer generation audit](camera-scene-generation-source-audit.md)
executes the embedded constructor/destructor and locates readiness reset in later
control setup. Complete SceneBrowse replacement and final pixels remain open.

Continuation of the [root traversal audit](camera-rebind-order-source-audit.md),
based on `966741a`. Question: when a visitor switches away from the read-only
Camera gallery, is the previous thumbnail-ready state cleared before the next
gallery scene displays?

**Browser runtime: yes, tested.** Leaving the foreground owner releases every
thumbnail request and the native renderer before the next pair is drawn. The
first published pair after the switch is source black, and the next gallery
shows the `ThmbPic` placeholder until its own images load. Within one owner,
readiness is keyed by image URL, so a reused cell slot cannot inherit another
photo's readiness.

**Native executable: still unproven.** No committed fixture executes
SceneBrowse replacement, renderer release or replacement construction. The
six-item live adapter stays as it is, and live horizontal paging remains gated.

## Browser lifecycle

The reducer holds no readiness. After navigation, Camera instance state is only
`screen`, `selection` and `folderId`, plus `photoId` once a photo is opened. Thumbnail
readiness exists only in `createStockScreenPresentation`
([stock-screen-presentation.ts](../src/os/stock-screen-presentation.ts)):

- `image()` keys requests by URL in a 64-entry map. A cell is ready only while
  its own request reports `complete` and a non-zero `naturalWidth`.
- The Camera painter hides `ThmbPic` only when `image()` succeeds. Otherwise the
  source load placeholder stays visible
  ([stock-native-camera.ts](../src/os/stock-native-camera.ts)).
- `sync(owner)` runs on every frame in
  [portfolio-screens.ts](../src/os/portfolio-screens.ts). The owner is
  `runtime.active` only in the launch or app phase with no sleep, preferences
  or dialog; otherwise it is `null`. On any owner change, `reset()` clears
  identity, failure, publication and the paint key, and releases the native
  session. `releaseImages()` clears `onload`/`onerror`, empties `src` and drops
  every entry.
- Instance IDs are `camera:<serial>` ([app-host.ts](../src/os/app-host.ts)).
  HOME sets `active` to `null`. Resume reuses the ID, but the presentation has
  already seen `null`. Relaunch changes the ID directly.

[camera-gallery-lifecycle.test.mjs](../tests/camera-gallery-lifecycle.test.mjs)
drives the real Camera reducer, runtime, presentation and native Camera painter
over the real portfolio folders. Only the asset loader, `Image` and canvas are
faked, and nothing is fetched.

| Scenario | Asserted result |
| --- | --- |
| Buildings loaded → HOME → resume | Released requests have empty `src` and no handlers. The old renderer is disposed. The first pair is black, then three placeholders and no photo pixels on either screen |
| Buildings loaded → close → relaunch | The same result under a new owner ID |
| Old request `onload` after switching | The handler is `null`; nothing repaints or binds |
| Buildings slot 0 ready → Renu | Renu slot 0 stays a placeholder. A late Buildings completion repaints without binding |
| Return to Buildings in the same owner | Already-decoded URLs show at once. One native session serves every folder scene |

With `releaseImages()` removed from the owner-change path, both switching
scenarios fail. The within-owner scenario does not depend on it.

## Native evidence and its limit

The [root-owner replay](../scripts/replay_camera_rebind_order.py) fixes the
renderer at synthetic address `0x1001000` and seeds consumer-ready `+0x80` bit 2
with a direct write. Original code clears and republishes that bit, but no
original constructor or destructor touches the object. Its only owner change is
input-manager replacement plus interruption, which does not clear the bit.

This worktree also holds an uncommitted edit to that script. It adds
teardown/replacement hooks but no stage that runs them. It is left
uncommitted and is not evidence.

To answer the native question, a fixture still needs:

1. Original-instruction execution of the SceneBrowse replacement path, from the
   caller that retires the current SceneBrowse child through renderer/control
   release.
2. The initial `+0x60`/`+0x80` value for the replacement renderer, whether from
   its original constructor or proof that the object is reused.
3. A first complete `0x2d425c` pass under the replacement owner, with a control
   rebound to a new logical index, recording `ready` at `0x2d804c`.
4. The pixel gate: `0x25a618` and `0x2d804c` are still recorded leaves. There is
   no texture upload, composited lower-LCD output or matched native sequence.
5. Native timing from re-entry to first thumbnail pixels. Only the coordinator
   can capture this, through the Azahar reference session.

## Visual consequence

Browser thumbnails appear on the first repaint after their image decodes. In
the collision fixture, native `ready=1` first reaches the cell writer on the
second presentation pass after current completion. Re-entry placeholder
duration may therefore differ from native by at least one presentation pass.
That difference is unmeasured and stays open.

## Reproduction and evidence

```sh
node --test tests/camera-gallery-lifecycle.test.mjs
```

Logs share the `scene-reset-` prefix in
`reference/camera-rebind-source/` beneath the firmware SSD artifact root. The
new test and the existing Camera browse, native Camera and stock preparation
tests pass (39/39), as does typecheck. In the full suite, 39 model tests fail
because this worktree holds unhydrated Git LFS pointers for the GLB and Blender
files; none involve the changed files. No runtime, public asset or script is
committed, so no application build was run. No browser inspection, emulator
session, source render, rendered cell or native visual comparison is claimed.
