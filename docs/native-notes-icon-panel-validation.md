# Game Notes icon expansion and title-panel specimens

The Notes-specific icon conversion is now published for the eight applications
whose original SMDH files were validated in the
[metadata follow-up](native-notes-title-controller-followup.md). Seven usable
original descriptions and icons render in the native title panel. System
Transfer's original `???` description is excluded from panel specimens.
This validates source components; it does not enable the live title/HUD flow.

## Exact source mapping

`scripts/firmware/notes_icon.py` statically ports the large-icon portion of
Notes `0x106258–0x1066a0`. The original executable hash remains
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
The publisher checks that identity and all six used slices of the constant
table at `0x1aa000`. No ARM code is executed.

The SMDH's large image at `0x24c0` is 48×48 RGB565, arranged in 8×8 Morton
tiles. Six source tile rows, each 0x300 bytes, are copied to 0x400-byte output
rows. The remaining 0x100 bytes in each row are filled with 0xff. Table-driven
16-bit copies duplicate source row 47 into output row 48, and source column 47
into output column 48. The visible 48×48 image is **not resized**.

The upper layout's `P_Icon_00` remains 48×48 and samples the first texture
with UVs `(0,0)` to `(0.75,0.75)`. Its second texture is the original
`IconMask.bclim`, using the pane's second UV set and unchanged source material.
The 64×64 storage therefore preserves the original image size and filtering
border. The published HOME icons remain unchanged.

The native routine initializes 3,120 of the large output's 4,096 texels. It
does not initialize the remaining scratch, including `(48,48)`. The converter
marks those texels transparent instead of copying unpredictable process memory.
The verifier poisons all such texels magenta/opaque and rasterizes the original
icon material at 48×48 and 96×96. Composited results are identical: at doubled
resolution the corner's raw RGB can differ, but the original icon mask makes
its alpha zero. This is a bounded proof for the original pane/material at the
tested densities, not permission to expose arbitrary padded texture regions.

Public files live at `icons/notes/<title-id>.png`. Each has the matching ExeFS
icon hash/content provenance; the title record adds `notesIcon` and a
hash-identified `notesIconConversion` with the executable identity and explicit
undefined-texel policy. The full builder and narrow publisher use one function.
The delivery audit checks the linked resource, provenance and 64×64 dimensions.

```sh
python3 -B scripts/firmware/notes_icon.py \
  --manifest /absolute/delivery/manifest.json \
  --source-code /absolute/game-notes/exefs/code.bin \
  --icon TITLE_ID=/absolute/application/exefs/icon.bin
```

Repeat `--icon` for the explicitly selected application inputs. Files and
metadata are prepared only after all selected source identities pass validation.

## Text fit and independent panel poses

`scripts/verify-notes-title-panel.mjs` renders the original title component
using the published long description and Notes icon, original shared font,
source text sizes and source animations. It does not construct a replacement
panel, force font sizes or draw generic icons. It verifies:

- All seven usable supplied descriptions occupy a single line inside the
  original `T_TextTitle` rectangle, **246×36**, using native glyph quads.
  Their advance widths are 118.8–219.6 pixels. No supplied description needs
  the source overflow/truncation branch; general wrapping remains unvalidated.
- `TextPanelInOut` and `TextPanelStay` bind only `G_Panel_01`. Capture panes
  remain byte-identical when those clips are posed.
- Health's Double/Up/Down indicators are sampled at forward frames 0/10/20,
  Stay frame 80, and reverse frames 30/20/10/0. Equal authored poses have equal
  pixels; the intermediate and endpoint pixels differ. Frame 30 retains the
  last authored pose (20). This tests poses, not a wall-clock lifecycle.
- Source packs remain immutable and renderer diagnostics are empty.

There are **31 upper-LCD component specimens**: seven descriptions at Stay
frame 10, plus eight checkpoints in each of the three indicator modes. Health
Stay-10 and Up In-10 images were visually inspected. They show the native
rounded panel, original icon mask, source title and the source indicator art.
The rest of the upper LCD is the original Notes background; these are isolated
component specimens, not a full suspended-application screen or native capture.

```sh
node scripts/verify-notes-title-panel.mjs \
  --artifact-dir /absolute/ssd/notes-panel-render \
  --asset-root /absolute/hydrated/delivery \
  --canvas-module /absolute/node_modules/@napi-rs/canvas/index.js
```

## Verification and live blocker

Four icon tests pass, including all 2,304 coordinate-labelled source pixels,
right/bottom duplicate edges, source padding/unknown coverage, dimensions,
source identity rejection, retained HOME resources and both publisher paths.
The six metadata tests, 11 Notes capture/switch tests and existing 42 firmware
tests pass; 13 firmware fixtures remain unavailable and skipped. The delivery
audit passes for **1,613 resources**, with existing warning categories only.

Private artifacts are under the firmware SSD root's
`reference/notes-icon-panel/`: source table verification, test/audit logs, and
`render/verification.json` with fit bounds, pixel hashes and 31 PNGs. Original
source ranges/listings remain in `reference/notes-title-controller/`.

Live wiring remains deliberately blocked on exact scene lifecycle ordering:
source initialization can start the independent title controller before a note
is selected, and opening a note dispatches HUD event 9 plus another scene's
event 2. Treating "note opened" as the title timer's start would invent timing.
The source state/controller order must be integrated with owner/generation-safe
metadata before that route becomes live. Reopening/resuming and overlapping
screen-switch/title poses also need validation. General native text overflow
handling remains separate; the supplied fitting strings do not prove it.

No browser or native LCD comparison was performed, and no live UI, audio,
editable Notes or keyboard behavior changed. Strict 1:1 remains unproven.
