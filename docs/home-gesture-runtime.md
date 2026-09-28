# HOME gestures and folder layout foundation

This pass centralizes HOME input in the deterministic runtime. It does not
establish native timing or visual fidelity for firmware 10.7.0-32E. Browser and
Azahar verification remain with the integration task.

## Behaviour and source limits

Nintendo's [original XL manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf)
describes sliding to scroll, holding an icon before relocating it, opening a
folder while dragging over it, and placing software into a chosen child slot.
Folders have 60 slots, cannot nest, and cannot be deleted while occupied. The
[Nintendo folder support article](https://en-americas-support.nintendo.com/app/answers/detail/a_id/182/~/how-to-move-an-icon-into-a-folder)
excludes System Settings, Nintendo eShop and Game Card icons from folders.
The [original XL English manual](https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/manual-nintendo-3dsxl-operations-english)
describes exchanging the positions of two icons when dropped on one another.
The implementation follows those documented rules. The installed registry has
no Game Card title; its ID is reserved in the folder restriction helper.

The following values are authored defaults, not measurements: lift 450 ms,
movement slop 8 logical pixels, folder hover 500 ms, edge delay 350 ms and edge
interval 180 ms. See `HOME_GESTURE_TIMING` in `home-gestures.ts`. Scrolling follows
the stylus and snaps to a column on release; inertia, snap easing, folder exit
boundary, edge zones and held-icon rendering still require native comparison.
Quick release over an eligible folder selects its first free slot; a sustained
hover opens the folder for explicit placement. Exact hover/drop timing remains
an acceptance gap.

## Shared scene/presentation contract

Only `dispatchSystemEvent` interprets touch phases and `tickSystem` advances
hold/hover/edge deadlines. The scene supplies logical 320×240 points and a stable
pointer ID. It must remove its former long-hold, swipe and directional-repeat
recognizers; do not call `moveApp` or a legacy tap in addition to phase events.
`releaseSystemInputs` cancels contacts on blur or lost capture. Hardware
navigation, application entry, sleep, power and preferences also cancel a HOME
gesture. A stale pointer-up cannot launch the source icon afterward.

The runtime exports these helpers through `system.ts`:

- `homeSlotAppId(state, slot, folder?)` resolves the visible container by default.
  Pass `null` explicitly for HOME or a root folder slot for its contents. Use
  it for both root and folder icon rendering; direct `system.layout` reads do
  not include children. `selectedTitle`/`selectedApp` use this same lookup.
- `getHomeGestureView(state)` returns null when idle, otherwise
  `{mode, pointerId, x, y, pressed, dragged, target, canDrop, scrollColumn}`.
  Modes are `press`, `scroll`, `drag`. `pressed` and `target` are
  `{folder:number|null, slot:number}` or null. `dragged` is
  `{source, item:{kind:'app',id}|{kind:'folder',label}}` or null.
  Paint the ghost at `(x,y)` and use `canDrop` for target feedback. During a drag
  the source remains in its persistent map, so presentation should suppress its
  ordinary icon while painting the ghost. The view owns no DOM or Three.js data.
- `moveHomeItem(state, from, target)` is an atomic layout operation used by the
  runtime. Locations are `{folder:number|null,slot:number}`. It supports root
  and child swaps, folder-icon moves with their children, and folder entry.
  Invalid, full or protected placements return unchanged state. `moveApp`
  remains a legacy root-app wrapper, not a second scene gesture path.

`system.homeNavigation` holds only temporary viewport/gesture data. `pageStart`
and `menuTiles` include its fractional column offset, so hit testing and drawing
share geometry. Pointer cancel restores the original view; no move is saved
before valid release. Theme-list swipes use the same contact path. No changes
were made to screen or scene rendering in this worker.

## Persistence and invariants

The original root map stays in `system.layout`, folder labels in
`state.folders`, and child maps in `system.folderLayouts[folderSlot][childSlot]`.
Moving a folder transfers its label and child map together. Apps can launch
from folders. A folder's delete action refuses to remove occupied contents.
The initial eight portfolio slots are unchanged; user rearrangements may move
those icons while keeping every installed ID present exactly once.

`saveSettings` now writes payload version 4 and includes folder layouts and the
independent default-folder naming counter. See [folder naming](folder-naming-runtime.md)
for native evidence, fullwidth digits and the explicit legacy-counter policy.
Transient contact and scroll data are omitted. Unversioned/version 1 root
preferences and version 2 folder preferences still migrate, preserving custom positions and labels. Restore
rejects ambiguous duplicate IDs across root/children, missing portfolio apps,
invalid slots, unknown titles, orphan children, forbidden child placements and
future payload versions. Rejection keeps the current safe state, rather than
silently dropping software. Missing stock IDs in valid older preferences are
appended into empty HOME slots. IndexedDB preference storage uses the same
validator, without changing its database schema.

## Verification boundary

Tests exercise taps, continuous scroll, timed lift, swaps, hover, exiting a
folder, ownership/cancel paths, protected/full folders, nonempty deletion,
version migration and IndexedDB reload. A deterministic sequence of 180 mixed
moves checks ID preservation and reload validation after each placement.
Reference images, timings and renderer previews still need the orchestrator's
centralized browser/Azahar acceptance. This is a behaviour foundation, not a
claim of a completed native HOME Menu.

Viewport authority now belongs to `home-navigation.ts`. Pointer scroll pixels and
hover context are previews; the gesture retains the original navigation record.
Cancellation restores it, and saving during any preview serializes that original
record. A completed scroll persists its aligned viewport/selection. Lifecycle
input release preserves all inactive folder histories. See
[HOME navigation](home-navigation-runtime.md).
