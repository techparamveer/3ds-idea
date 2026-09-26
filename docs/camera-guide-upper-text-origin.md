# Camera Welcome upper text origin

The Welcome photo-capacity run now uses the existing NintendoWare single-line
middle-left writer arithmetic for the source layout's explicit left line
alignment. This preserves the source font's separate FINF ascent and TGLP
baseline. The prior generic LA path ignored that difference and put the run one
pixel too low. No replacement glyph, pixel crop, color or fitted translation is
introduced.

Source: pinned EUR Camera `0004001000022400`, content `0000-0000001a`.
The manifest-backed `P_Finder_U/ShootCapa_Pho` text pane has alignment 3,
lineAlignment 1, size 172×16 and the `HudNOTES.bcfnt` binding. Message
`P/Finder_Pho_00_00` selects RI.mstl style 110, with unit font scale and zero
character spacing. The delivered font source SHA-256 is
`7b115deda29adce0faccb352d412a3ef9e10247850be6ded7856ba2714d32932`.
Its width/height/lineFeed are 23, ascent is 19, and baseline is 20. The resulting
local glyph Y is `16/2 - ceil(23/2) + 19 - 20 = -5`; the previous generic
formula produced −4. Source message and layout hashes remain recorded in
[resource delivery](camera-first-run-character-panel-delivery.md) and
[message colors](camera-browse-message-colors.md).

The arithmetic is reused from the [traced NW writer](native-font-raster.md),
which already covers middle-left alpha and centered LA text. Explicit left
line alignment is equivalent to automatic left for this single line. This is
an extension of that common writer contract, not a new Camera executable
replay. LA source-sheet batching and image sampling remain unchanged.
Only one-line, zero-spacing, middle-left LA text with explicit left line
alignment enters the added branch. An inventory of the published HUD-font
panes finds six matching candidates, all in Camera `P_Finder_U`: SModeName,
ShootCapa_Pho, ShootCapa_Mov, ShootCapa_Mov1, ShootCapa_Mov2 and ShootCapa_Mov4.
Only photo capacity is populated and visible on Welcome.

The preserved native/browser diagnostic was inspected before this change.
The camera-symbol bright footprint starts at (6,5) natively versus (8,6) in the
browser; all four digits also sit one pixel lower in the browser. The change
addresses the common vertical origin. The horizontal symbol residual and grey
3D indicator remain open. `Finder_Pho_00_00` contains two group-2/type-0 controls
with argument 2 around its capacity substitution; their writer effect is still
untraced. A bounded executable inspection found the 3D/2D visibility selector
at `0x2fdc6c`, looking up the two pane names through table `0x4404cc` offsets
0x158/0x15c, but did not establish a grey color or alpha binding. No indicator
dimming is guessed.

Validation: 37 bitmap-font and Camera presentation tests pass. The new test
uses the delivered layout, message style and font, checks all five glyph draw
origins, and retains the original glyph cell size and advances. Typecheck
and the normal production build pass. The build required replacing this lane's
external node_modules symlink with a local APFS clone of the same dependencies.
Integrated native/browser
LCD capture, remaining upper differences and whole-scenario acceptance belong
to the coordinator and remain unverified by this change.
