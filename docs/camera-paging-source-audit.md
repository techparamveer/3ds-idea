# Camera browse paging and selection motion audit

The website still jumps to `floor(selection / 6)` and draws one six-item page.
Native Camera drawing instead combines **a horizontal scrolling offset with
248px page spacing and intermediate column anchors**. No timed page transition
has been implemented: the controller update cadence and input ordering are not
established. A generic easing curve or a density-change clip would be incorrect
evidence for native page motion.

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

- Trace the full generic scroll controller update producing `+0x48`, including
  time units, smoothing/inertia, clamping, drag release and interruption.
  An immediate write in `0x21fd40` does not prove the final screen snaps.
- Establish D-pad/stylus event mapping, update order and repeat policy through
  the selection and viewport helpers. Verify partial-page and folder-expansion
  indices, which share the native item list.
- Trace adjacent-page buffer ownership/visibility and the selected cursor's
  lifecycle when changing folder, opening a photo, returning or suspending.
- Establish CurDefault animator start/reset/pause ownership and frame cadence.
- Compare a native multi-page sequence to the browser with matched item count,
  selection, inputs and captured frames.

The current six-cell page adapter and static cursor phase remain explicit
fidelity gaps. [Footer limitations](camera-footer-source-audit.md) are unchanged.

## Reproduction

`scripts/audit_camera_paging.py --code <absolute code.bin> --pack <absolute
private browse pack> --output <absolute report>` reuses the grid audit to check
the executable identity and source pane constants, then checks cursor clip
identity and derives the large-mode anchor lattice. The real-source run passes;
report: SSD `reference/camera-paging-source/audit.json`. The source disassembly
is SSD `reference/camera-grid-source/disasm.txt` under the firmware artifact root.
No application/public asset changes, browser inspection or native acceptance
are claimed. Documentation diff checks pass; no application rebuild is needed.
