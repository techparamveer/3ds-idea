# Camera blank selection: final cursor and preview ownership

This continues the [input audit](camera-input-source-audit.md). Original ARM
replay now verifies the **final lower cursor writer** for padded blank cells.
It also rules out an incorrect shortcut: the upper `BrwsNoData` pane is not
shown by its normal routine while the gallery contains real items. A blank
cell at the end of a populated gallery and a wholly empty gallery are distinct.
No application adapter, capture functionality or public assets are changed.

The source remains EUR Camera `0004001000022400`, content `0000-0000001a`,
ARM base `0x100000`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

## Corrected scene identities and order

RTTI distinguishes two classes that the earlier audits collectively called
SceneBrowse. Vtable **`0x42044c`** is
`notes::pnote::thmb::BrowseThumbnail`; vtable **`0x41f8b8`** is its enclosing
`notes::pnote::SceneBrowse`. The earlier arithmetic/addresses remain valid;
use these precise names when implementing an adapter.

| Phase | SceneBrowse owner | BrowseThumbnail child |
| --- | --- | --- |
| Traversal `+0x34` | `0x270cc4` | `0x270cc4` |
| Before children `+0x38` | `0x28455c` | no-op `0x270f10` |
| After children `+0x3c` | `0x28c358` | input `0x2d5740` |
| Presentation traversal `+0x40` | `0x27135c` | `0x27135c` |
| Presentation `+0x44` | `0x28ba1c` | `0x2d425c` |
| Event `+0x58` | `0x28bcf4` | `0x2d4f9c` |

`0x270cc4` runs before-child work, children, then after-child work. In contrast,
**`0x27135c` runs the current object's `+0x44` before its children's `+0x40`**.
The owner also gates the browse control in its after-child phase
(`0x28c374–0x28c3b8`). An adapter must preserve these distinct phases; a single
immediate button reducer followed by a scroll interpolation is insufficient.
The root input sampling order established in the input audit still applies.

Owner presentation updates its pane/controller collection first
(`0x28ba84–0x28bac8`), runs the state callback selected by `+0x7b9/+0x7ba`,
then calls the preview callback stored at `+0x8f0/+0x8f4`
(`0x28bc14–0x28bc38`). This identifies callback ordering, but does not yet
replay the complete ready/modal/active-touch-owner hierarchy and cancellation.

## Final lower cursor writer

BrowseThumbnail presentation calls `0x2cea0c`; after updating the thumbnail
buffer it calls **`0x2db8d4`** at `0x2cf06c`. This is the final cursor visibility
and position writer, not merely the coordinate getter in the earlier audit.
It reads selection `+0x2232` and the renderer's owner `+0x16c`.

For the large grid, it checks both the three-page buffer window and the
**padded count** `ceil(max(actualCount,1)/6)*6`. It does not reject a selected
index merely because it exceeds actual photo count. It obtains the page's
mod-three translation, computes the cell position through `0x2de524`, and
writes the control at owner `+0x2228`: position `+0x9c/+0xa0`, dirty flag
`+0xa5`, and child pane `+0x68` visibility bit 0 at `+0xb7`. It preserves the
other visibility flag bits. The final horizontal clip is centered **±192px**.
A separate early branch hides the cursor when `owner[+0x34]−owner[+0x38]` is
zero. Transition/interpolation flags have additional branches and are not
covered by this steady-state replay.

The replay executes the whole writer and its native coordinate helper, without
intercepting calls or patching instructions. Three page translations are supplied
as synthetic, 248px-spaced buffer data.

| Actual items | Selected index | Scroll x | Final result |
| --- | --- | --- | --- |
| 7 | 9, padded blank | −86 | visible at lower-screen `(246,140)` |
| 7 | 11, padded blank | −86 | hidden: x=398 lies outside centered ±192 |
| 7 | 12 | −86 | hidden: outside padded count 12 |
| 0 | 0 | 0 | hidden: empty browse |
| 7 | 9 | −400 | hidden: screen x=−68 lies outside clip |
| 7 | 6, real item | −86 | visible at `(246,74)` |

Hidden-case coordinates are not an instruction to draw a hidden cursor. These
checks establish the source writer's behavior for these states, not a matched
native screen sequence or all transition states.

## Padded blank is not the whole-gallery no-data screen

The selection commit and blank handler remain as previously traced:
`0x1fccf4` retains a padded index, sets selection type 1, clears selected-item
metadata, and `0x2d1808` emits changed blank **`0x22`** or repeat blank
**`0x23`** when the notification argument is enabled. Viewport movement and
other gates can return before the repeat notification.

The child event handler `0x2d4f9c` forwards events to its parent before local
handling. The owner handler `0x28bcf4` calls **`0x283b14`** before its
state-specific event callback. The latter has an explicit changed-blank `0x22`
branch shared with folder-change `0x1f`. The blank branch requests hides for
Finder entries 0,6,7,2,10,11,9, then 8; clears `+0xd38`; updates the control at
owner `+0x12b8`; sets preview state **`+0xce0=2`** and **`+0x8fa=1`**.
These hides use `0x21908c` with flag 0, which changes a shown/showing entry to
state 3 (fade-out), rather than immediately removing it. `0x23` has no branch
in this common handler; its remaining state-specific callback is unresolved.

The explicit whole-gallery empty routine **`0x283ff8`** first reads the browse
photo container through owner `+0x48`, then child `+0x58`. Native count getter
`0x211190` returns `(end−begin)/8`. **If that count is positive, the routine
returns before touching any Finder pane.** This early return is replayed with
seven items and unchanged no-data pane state. A direct call to this routine
therefore cannot implement the padded-blank upper screen.

For an empty container the source path hides Finder indices 6,7,2,8,10,11 and
shows index **9**, then resets owner `+0x7b8`. The static initializer
`0x3205a8` copies the native name **`BrwsNoData`** into browse name array
`0x47ed08[9]` and callback **`0x2fb564`** into `0x47ed68[9]`. The browse Finder
loader `0x2fb5a8` selects `P_FinderVS_U`. Callback `0x2fb564` runs the shared
entry-state update `0x21188c`, then writes the pane alpha by interpolating the
widget's `+0x33c/+0x340` endpoints with entry progress `+0x130`.

The script replays that initializer and the no-data pane's instant show and
writer, with explicitly **synthetic alpha endpoints 0 and 255**. This validates
the writer, not native material defaults or fade duration. Later owner preview
callbacks also gate behavior on the preview control `+0xce4`, its `+0x80` state,
owner `+0x530`, and image/transition state. In particular `0x289d8c` handles
preview state 2, while state 3 can install callback `0x28ae08` via table
`0x34aea0`. That callback reaches `0x283ff8` only after its own gates. These
paths must not be collapsed into “all blanks show BrwsNoData.”

## Reproduction and precise remaining blocker

Run `scripts/replay_camera_blank_presentation.py --code <absolute code.bin>
--output <absolute report>` in the private `unicorn==2.1.4` environment. The
report is stored at firmware artifact root
`reference/camera-paging-source/blank-presentation-replay.json`. The original
input and scroll replays still pass. No native/browser screenshot or new screen
render is included: this change establishes code behavior, not visual parity.

The lower steady-state blank cursor is now source-backed. A live staged Camera
adapter remains blocked on the **complete owner preview/image fade lifecycle,
state-specific `0x23` handling, and ordered touch/control cancellation**. Replay
must include owner callbacks, thumbnail child, slider and pane-state updates in
the native order, then test the browser adaptation without changing HOME's
repeat behavior. Clearing the previous photo immediately, showing `BrwsNoData`
for a padded cell, or inventing a millisecond page tween would each skip source
behavior that is not yet resolved. Strict 1:1 and native wall-clock acceptance
remain open.
