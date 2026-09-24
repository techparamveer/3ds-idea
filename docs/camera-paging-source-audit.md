# Camera browse paging and selection motion audit

The website still jumps to `floor(selection / 6)` and draws one six-item page.
Native Camera drawing instead combines **a horizontal scrolling offset with
248px page spacing and intermediate column anchors**. The controller's output
smoothing and key-candidate calculation are now replayed from original ARM
instructions, but their wall-clock cadence, physical input mapping and lifecycle
are not established. No timed page transition has been implemented. A generic
easing curve or a density-change clip would be incorrect evidence for native page
motion.

## Source facts

EUR Camera `0004001000022400`, content `0000-0000001a`, base `0x100000`,
executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The [grid audit](camera-grid-source-audit.md) establishes the 3×2 density,
228×132 placement range and 248×146 page range.

| Address | Traced behavior |
| --- | --- |
| `0x1fd910–0x1fdad8` | Configures generic scroll model with page width 248, column pitch `floor(228/3)=76`, and side margin `(248−3×76)/2=10` |
| `0x1fdd90–0x1fde50` | Converts scroll anchor index to position and clamps it; large-mode anchors before end clamping are **0,86,162,248,334,410,496…** |
| `0x1fdc20–0x1fdd88` | Inverse mapping from scroll position to anchor index, using the same width/pitch/margin fields |
| `0x1fbd10–0x1fbdec` | Maps selection to logical column `floor(index/6)×3 + (index%6)%3`; shifts the scroll anchor only when that column lies outside the visible three-column interval, or the caller forces it |
| `0x2d1274–0x2d1334` | Changes selection then calls that visibility/scroll helper |
| `0x21fd40–0x21fdec` | Generic position setter has immediate and pending-target paths; the visibility helper passes flag 1, which writes current/target directly in this model |
| `0x2caa4c–0x2caa74` | Copies the scroll controller's integer output `[controller+0x48]`, negates it into the browse offset and retains the preceding value |
| `0x2d11fc–0x2d124c` | Supplies the current browse offset, page width and selected index to coordinate calculation |
| `0x2db78c–0x2db8c0` | Coordinates = mounted cell centre + horizontal browse offset + `floor(index/6)×page width`; this is runtime geometry, not a page-slide BCLAN |

For example, selected item 6 has logical column 3. With visible anchor 0, the
visibility helper requests anchor 1 (86px), rather than blindly selecting page
1 (248px). This is a helper-level result; exact D-pad event mapping into that
helper and the ensuing displayed frame sequence remain unverified.

## Animation resources are different operations

`P_BrwsCursor_D_CurDefault` is a **188-frame looping texture rotation**, from
0° to −360°. It has one `Cursor / texture.rotation` track; it does not move the
cursor between cells. `PicL2M`, `PicM2L`, `PicM2S` and `PicS2M` are nine-frame
cursor **size/density** transitions. `Push` is a three-frame local press offset.
These clips do not establish a page slide duration, easing or selection-motion
path. The live painter currently binds CurDefault at frame 0; its native phase
ownership/reset behavior is not traced here.

## Evidence still needed before implementation

- Establish who invokes `LytSlider`'s virtual update, how often, and where the
  shared manager's float at `+0x260` originates. `0x26f9b4` passes this float to
  `0x21f180`, but output smoothing runs once per controller invocation. Converting
  the replay's 20 updates into 333ms would assume an unverified 60Hz cadence.
- Trace physical D-pad input into the internal masks consumed at `0x2ce810`,
  including the difference between manager `+4` and `+0x10`, repeat delay/rate,
  and ordering relative to controller update. Trace stylus drag/release into
  `0x21fd40`'s pending path before reproducing inertia or interruption.
- Establish partial-page blank-cell and folder-expansion behavior after the
  candidate reaches `0x1fcb70`. The native helper permits padded-page indices;
  the website's actual-items-only selection clamp cannot simply be retained.
- Trace three-page ring reset/rebinding and cursor lifecycle when changing
  folder, opening a photo, returning or suspending.
- Establish CurDefault animator start/reset/pause ownership and frame cadence.
- Compare a native multi-page sequence to the browser with matched item count,
  selection, inputs and captured frames.

The current six-cell page adapter and static cursor phase remain explicit
fidelity gaps. [Footer limitations](camera-footer-source-audit.md) are unchanged.

## Controller continuation: exact output path

`0x2d2228–0x2d229c` looks up the browse control named `-S-` through `0x440250`,
checks runtime type identity `0x4401c0`, and stores it at scene `+0x94` (browse
wrapper `+0x30`). This is `notes::lyt::LytSlider`: its vtable starts at
`0x41e9f0`, type getter `+8` is `0x3106e0`, and update `+0x34` is `0x26f8d0`.
The neighbouring `LytTimeSlider` implementation is not needed to infer Camera's
controller type.

| Address | Established behavior |
| --- | --- |
| `0x1fdb0c–0x1fdb28` | Camera sets output fraction `+0xb8` to float32 0.3 and snap threshold `+0xbc` to float32 0.1 |
| `0x1fbde0–0x1fbdf0` | Visibility request sets `+0xd9`, calls immediate model setter, then clears timed interpolation field `+0xc0` |
| `0x21fd74–0x21fd94` | Immediate setter updates model positions and clears pending/velocity/history flags |
| `0x21f268–0x21f270`, `0x21f490` | With pending flags clear, model update returns zero; this is relevant to choosing the smoothing path |
| `0x26fb94–0x26fbac` | Nonzero model-update result snaps output; otherwise zero timed-interpolation field selects smoothing |
| `0x26fd18–0x26fd54` | If `abs(target−current)>threshold`, float output becomes `current + (target−current)×fraction`; otherwise it becomes target |
| `0x26fd58–0x26fd6c` | Integer output `+0x48` is float output plus 0.5, converted to unsigned integer |
| `0x21fcf0–0x21fd38` | Bounds helper clamps the float against `+0x64/+0x68`, correcting integer output when clamped |

The bounded ARM replay starts at `0x26fd18` and stops before the bounds helper.
It runs unmodified source instructions with synthetic in-bounds state, not a
JavaScript/Python recreation of the smoothing formula. For target **0→86**, the
first integer outputs are **26,44,57,65,72,76,79,81,83,84,84,85,85,85,86**.
The float settles exactly after update **20**, so integer equality alone would
stop this controller too early. Reversing the target to zero after two updates
produces integer **31** at the next update; the current float is retained.
This proves per-update arithmetic, not update frequency or captured UI frames.

## Internal key handling and neighbouring pages

`0x2ce810–0x2ce9ac` reads manager `+0x10` and computes selection candidates.
The replay executes this original function up to its call to `0x2d1274`.

| Internal mask | Candidate behavior in large density |
| --- | --- |
| `0x100` | Index minus one, unsigned 16-bit; index zero becomes 65535 and is subsequently rejected |
| `0x80` | Index plus one, including crossing a row/page boundary (`5→6`) |
| `0x200` | Previous row in the same page/column, wrapping top to bottom (`0→3`, `3→0`) |
| `0x400` | Next row in the same page/column, wrapping bottom to top (`0→3`, `3→0`) |

`0x2d12a0–0x2d12cc` bounds candidates by
`ceil(max(itemCount,1)/itemsPerPage)×itemsPerPage`, not by the actual item count.
For seven items, index 6 with mask `0x400` produces blank-cell candidate 9,
which is inside the two padded pages. Index 11 with `0x80` produces 12, which
is outside. These masks must not be called physical HID bits without tracing
their producer.

`0x2cf034–0x2cf058` invokes `0x2d92ac` for 64 potential thumbnail slots. That
helper derives global index `(currentPage−1)×itemsPerPage + slot`, uses a
three-page modulo ring, and distinguishes padded-page validity from whether a
real item exists (`0x2d92dc–0x2d9374`). Large density uses at most **18** slots;
the generic bound is three times the density's item count. This supports drawing
the preceding/current/following pages during horizontal movement. It does not
prove when asynchronous thumbnail rebinding or scene reset occurs.

## Reproduction

`scripts/audit_camera_paging.py --code <absolute code.bin> --pack <absolute
private browse pack> --output <absolute report>` reuses the grid audit to check
the executable identity and source pane constants, then checks cursor clip
identity and derives the large-mode anchor lattice. The real-source run passes;
report: SSD `reference/camera-paging-source/audit.json`. The source disassembly
is SSD `reference/camera-grid-source/disasm.txt` under the firmware artifact root.
No application/public asset changes, browser inspection or native acceptance
are claimed. Documentation diff checks pass; no application rebuild is needed.

The continuation adds `scripts/replay_camera_scroll.py --code <absolute
code.bin> --output <absolute report>`. It requires `unicorn==2.1.4` in the
private tooling environment and uses the same executable SHA-256. The real
source run passed four bidirectional/adjacent-anchor traces, near-threshold
snapping, mid-flight reversal, and eight key-candidate cases. Private report:
SSD `reference/camera-paging-source/controller-replay.json`. The replay does
not patch the executable, export firmware, render screens or simulate a full
console. No new source render is claimed for this audit-only continuation;
settled source renders from the grid slice remain the visual evidence.
