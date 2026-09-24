# Camera browse-strip port — disconnected

EUR Camera `0004001000022400`, content `0000-0000001a`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
This continues the [paging](camera-paging-source-audit.md),
[input](camera-input-source-audit.md),
[owner](camera-owner-lifecycle-source-audit.md) and
[rebind](camera-rebind-source-audit.md) audits with a pure TypeScript port of
the replayed strip arithmetic. **Live Camera still jumps to
`floor(selection / 6)`.** `stock-apps.ts`, `stock-native-camera.ts` and
`stock-screen-layout.ts` do not import this module.

Portfolio scope is unchanged: folders, gallery and photo only, no capture.

## Why live paging stays off

The [feature map](feature-map.md) keeps the live six-item adapter gated. The
later ordering continuation now bounds rebind/stale completion through the
second ring draw, but combined owner/touch ordering remains open:

| Required before live | Status here |
| --- | --- |
| Request allocation, complete tag/resource state, ready publication and two presentation passes (`0x2d9450`, `0x2dbb50`, `0x2da338`, `0x2da6fc`, `0x2cea0c`) | Bounded replayed in the later [ordering audit](camera-rebind-order-source-audit.md). The first ring draw remains unready; its post-draw rewrite permits tag 69 on the second draw. Final property/cell services are recorded leaves, not GPU pixels |
| Combined owner input/presentation traversal with touch cancellation, ancestry, 12px drag and slider history | Open. Only the key-skip-while-stylus-down gate is modelled |
| Native wall-clock cadence | Open. `CAMERA_BROWSE_UPDATE_MS` is the host's nominal 60 Hz conversion for tests, not hardware milliseconds |
| FadeAll blank/folder preview, 3-page ring allocator, CurDefault ownership | Open |

A live adapter that drew every current URL in a ±192px window, hid Finder panes
immediately on a padded blank, or treated HTML `onload` as native ready-bit
publication would skip source stages that are not yet replayed together.

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
after-child key handling. Browser `repeat` events are ignored.

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
second draw receives ready with full tag 69. Enclosing owner/touch traversal and
actual GPU/pixel output remain open. A browser URL assignment is not that
lifecycle.

## Reproduction

Private `unicorn==2.1.4`, absolute `--code`, `--output` and optional
`--fixture`. Hash-pinned executable; no firmware bytes are committed. Report:
`reference/camera-native-paging/strip-replay.json` under the firmware artifact
root. Focused Node tests consume only the derived fixture.

No application rebuild, browser inspection or native screen comparison is
claimed. The six-cell page adapter, generic Back/Open footer and viewfinder
replacement remain labelled adaptations.
