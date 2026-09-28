# Native folder window frames

The original `LncFolder_00` panel uses four separate frame textures. The layout
renderer now draws this supported arrangement, rather than rejecting the window.
This is a renderer checkpoint, not acceptance of the full open-folder screen.

## Source contract

Evidence uses the supplied EUR HOME title `0004003000009802`, version 24576,
whose `code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

- Original routine `0x2e32c4` draws the content, then frames 0, 1, 3, 2:
  top-left, top-right, bottom-right, bottom-left.
- `0x2e3164` obtains left/right/top/bottom extents from LB texture width,
  RT width, LT height and RB height. These are distinct dimensions; a single
  corner's dimensions cannot stand in for all four.
- UV helpers `0x1cc2e4`, `0x1cc1e4`, `0x1cc0e4` and `0x1cbfe4` retain full
  stretched-strip coordinates, including negative coordinates at the bottom
  and left. The original sampler then applies its clamp/repeat mode.
- Material application `0x1cc998..0x1cc9d4` skips blend, alpha-test and TEV
  writes for TextureOnly frames. Each such frame still binds its own texture
  resources and coordinate transforms. The renderer carries the preceding
  complete material within this window draw without modifying the source pack.

`tests/fixtures/native-four-frame-window.json` contains only numerical outputs
from executing the original ARM geometry and UV routines, plus the source hash.
Its cases cover the actual 304×144 panel with 16×16 frames and deliberately
unequal texture sizes. GPU submission and material uploads were intercepted;
those numerical fixtures therefore prove geometry/UV outputs, not GPU parity.
Material inheritance has a separate regression using distinct full and
TextureOnly materials. Nonzero inflation/frame extents and flipped frames remain
explicitly unsupported. Inheritance across unrelated pane draws is outside this
bounded implementation.

The private reproduction script and results are
`reference/execute-window-frames.py` and
`reference/native-four-frame-window.json` under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
No executable bytes or disassembly are included in the repository or website.

## Browser checkpoint

`reference/browser-folder-chrome-four-frames-bottom.png` shows the original
rounded panel and Back tab in the actual browser. The interior matches the
reference at RGB (223, 219, 215). The comparison image
`reference/folder-chrome-contact.png` places the Azahar screen on the left and
the browser on the right.

At this checkpoint the runtime panel width/position, surrounding backdrop,
empty-folder footer and animation epochs still differ. The native reference is
`reference/home-folder-open-a-bottom.png`; its cursor phase is not synchronized
with the browser capture. Those differences must be resolved through native
runtime layout bindings and matched captures, not inferred offsets or a claim
that the numerical fixture establishes full visual fidelity.

## Game Notes horizontal frame reflection

The supplied `MemoListDown` layouts encode their four thumbnail frames as
`[0,1,0,1]`. The format's value1 is horizontal reflection, also named `FlipH` by
[EveryFileExplorer's CLYT window reader](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/wnd1.cs).
The four-frame compositor now reflects each affected texture U coordinate about
0.5, preserving V, strip geometry, material inheritance and out-of-range tiling.
Source layouts are immutable. This is a format-based implementation; it has no
new ARM or matched-LCD claim. The real Notes-resource regression checks both
right-frame UV direction and preservation of all other strips. Quarter-turn frames
and nonzero flips in the one-frame arrangement remain explicitly unsupported.

## Browser window orientations

The source Browser `StartDialog` window uses frame orientations `[4,2,1,0]`.
The same format reader identifies 2 as vertical reflection and 4 as a 180-degree
rotation. Four-frame rendering now reflects V for 2 and both U/V for 4 without
changing strip geometry or source resources. This lets Browser render its actual
rounded dark panel and pointer in place of the plain substitute. The real-resource
regression checks every UV and unchanged geometry; the 29 presentation tests and
typecheck pass. Sixteen paired native screen renders pass, with the Browser lower
frame visually inspected under SSD `reference/browser-native-window/`. This is
format/source evidence, not a matched hardware timing or LCD acceptance claim.
