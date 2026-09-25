# Camera browse-strip port and live paging adapter

EUR Camera `0004001000022400`, content `0000-0000001a`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
This continues the [paging](camera-paging-source-audit.md),
[input](camera-input-source-audit.md),
[owner](camera-owner-lifecycle-source-audit.md) and
[rebind](camera-rebind-source-audit.md) audits with a pure TypeScript port of
the replayed strip arithmetic. The live read-only gallery now uses that port:
`stock-apps.ts` advances selection and smoothing through its existing app
clock, while `stock-screen-layout.ts` and `stock-native-camera.ts` use the
rounded output for matching touch targets and clipped cell positions
(`8c85a90`). Folder selection still uses its existing six-item page adapter.

Portfolio scope is unchanged: folders, gallery and photo only, no capture.

## Scope of the live adapter

The strip moves visibly across page boundaries. It uses the source 248 px
page stride, intermediate column anchors, float32 0.3 smoothing, and padded
selection candidates. A selected padded blank has no Open action. A Camera
owner's suspension cancels held keys; rendering and touch geometry read the
same strip output. Focused Camera and neighboring tests passed, as did
typecheck and a production build in the lane worktree. The coordinator owns
browser and native inspection; neither is claimed here.

This is a bounded presentation adapter, not the complete native SceneBrowse
consumer. The later ordering continuation bounds rebind/stale completion
through the second ring draw and executes current owner/touch traversal. These
parts remain outside the live path:

| Native behavior outside the adapter | Status here |
| --- | --- |
| Request allocation, complete tag/resource state, ready publication and two presentation passes (`0x2d9450`, `0x2dbb50`, `0x2da338`, `0x2da6fc`, `0x2cea0c`) | Bounded replayed in the later [ordering audit](camera-rebind-order-source-audit.md). The first ring draw remains unready; its post-draw rewrite permits tag 69 on the second draw. Final property/cell services are recorded leaves, not GPU pixels |
| Combined owner input/presentation traversal with touch cancellation, ancestry, 12px drag and slider history | Bounded original root/traversal replayed. Input-owner replacement does not cancel an existing capture; manager interruption cancels on the next eligible child update and does not clear pass-1 consumer readiness |
| Scene-owner generation replacement/teardown and stale consumer retirement | Open. The later [generation audit](camera-scene-generation-source-audit.md) executes embedded renderer cleanup and locates a later setup reset; it does not execute the full SceneBrowse replacement caller |
| Published lower-LCD pixel behavior | Open. A separate [complete cell-writer replay](camera-cell-publication-source-audit.md) now executes retained pane output, with child attachment/layout binding recorded. It is not joined to this request fixture and has no photo upload or pixel comparison |
| Native wall-clock cadence | Open. `CAMERA_BROWSE_UPDATE_MS` converts the live host clock at nominal 60 Hz, not measured hardware milliseconds |
| FadeAll blank/folder preview, 3-page ring allocator, CurDefault ownership | Open |

The live painter clips visible portfolio cells to `PicPosRengeL`; image URL
readiness remains owned by the existing native-title session and browser image
cache. This does not claim the source three-page ring, ready-bit publication,
FadeAll blank transition or native photo upload behavior. The Finder overlay
is still the declared read-only portfolio adaptation.

## Ported, replayed arithmetic

[replay_camera_strip.py](../scripts/replay_camera_strip.py) executes original
ARM with synthetic objects. Intercepts are only the sound request `0x220898`,
item lookup `0x1fd048`, owner event dispatch, and cell writer `0x2d804c`.
`src/os/camera-browse.ts` matches that oracle in
`tests/fixtures/camera-browse-strip.json`.

| Source | Port |
| --- | --- |
| `0x1fd910` configurator | page width 248, pitch 76, margin 10, fraction 0.3, threshold 0.1, max anchor `(pages−1)×3` |
| `0x1fdd90` / `0x1fbd10` | anchor lattice 0,86,162,248… and visibility shift only far enough to show the selected column |
| `0x26fd18` | float32 0.3-step smoothing; integer output is float+0.5 toward zero; 0→86 settles in 20 updates |
| `0x2ce810` / `0x2d1274` / `0x2d12a0` | left/right/up/down priority, padded-page candidates, pending `+0x448`, notify on release (`0x1d` photo / `0x22` blank) |
| `0x128508` / `0x275230` | delay 20, interval 4; held Right emits on updates 1,21,25,29… |
| `0x2d5740` early path | stylus down skips keys; not ancestry, drag or capture |

Each `cameraBrowseUpdate` is one native update: child slider step, then
after-child key handling. The live adapter advances these updates from the
host clock at nominal 60 Hz. Browser `repeat` events are ignored.

## Additional ring/bitset facts (not a live writer)

The same replay runs two presentation fragments that the TypeScript module does
**not** implement. They narrow stale-readiness without replacing `0x2da6fc`:

1. Ring router `0x2d92ac` for global index 6 with mapping tag **69** (slot
   collision with logical 5) and control 2, with the control's ready bit set:
   the writer still receives **ready=1**. The router does not compare the full
   logical tag. The [cache validator](camera-rebind-source-audit.md) `0x2cc654`
   does; these are different stages.
2. After drawing, `0x2cf0dc–0x2cf1bc` clears and rewrites the mapped-control
   bitset for real items in the three-page window. Seven photos on page 1 with
   deliberately stale tags `100+index` yield bits **`0x7f`**. Rewrite is keyed
   by mapping control ID, not tag match.

Allocator identity, descriptor resource installation, ready publication and the
two-pass consumer handoff are replayed in the later
[ordering audit](camera-rebind-order-source-audit.md). Resource completion alone
leaves the ring consumer bit clear; the first complete presentation dispatches
dirty properties, draws unready and only then rewrites the consumer bit. The
second draw receives ready with full tag 69. The connected root replay shows
that input-owner replacement and interrupted capture cancellation do not clear
that pass-1 consumer bit. Complete SceneBrowse replacement/teardown and actual
GPU/pixel output remain open. A browser URL assignment is not that lifecycle.

## Reproduction

Private `unicorn==2.1.4`, absolute `--code`, `--output` and optional
`--fixture`. Hash-pinned executable; no firmware bytes are committed. Report:
`reference/camera-native-paging/strip-replay.json` under the firmware artifact
root. Focused Node tests consume only the derived fixture.

The integrated adapter passed focused tests, typecheck and a production build.
No browser inspection or native screen comparison is claimed. The folder
six-cell page adapter, generic Back/Open footer and viewfinder replacement
remain labelled adaptations; smooth gallery paging has not been matched to
native wall-clock timing or pixels.
