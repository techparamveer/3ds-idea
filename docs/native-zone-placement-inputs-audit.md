# Nintendo Zone document placement and command-writer follow-up

24 September 2026, integration base `e4c054e`. **Audit only; no visible renderer
change.** This narrows the [raster-state audit](native-zone-raster-state-audit.md)
and corrects its classification of queued work. Final HTML input values,
draw-time register closure and shader interpolation remain unproven.

## Document dimensions now bound and executed

The application constructor at `0x107528` installs primary vtable `0x2d5f30`
and secondary browser-interface vtable `0x2d5fa4` at object `+0x38`. The secondary
vtable's `+0x34` entry (`0x2d5fd8`) is the viewport callback `0x277c74`.

During document creation, `0x225ac0`–`0x225ae4` calls that virtual method with
four output addresses. `0x225b28`–`0x225b4c` subtracts left/top from right/bottom
and passes width/height to document constructor `0x2625ac`. That constructor
stores those dimensions at `+0x2e4/+0x2e8` (`0x26283c`/`0x262840`), the exact
fields read by HTML layout-root placement. These are not inferred from CLYT.

The original viewport callback executes without any replacement instructions:

| Screen | Bounds left, top, right, bottom | Document width × height |
| --- | --- | --- |
| Upper (0) | 0, 20, 400, 240 | 400 × 220 |
| Lower (1) | 0, 0, 320, 212 | 320 × 212 |

This closes the document-size input. It does not replace the separate page
camera canvas, which remains 320 × 240 as previously proven.

## Conditional root-position fixture

`scripts/replay_zone_placement.py` verifies the pinned executable hash, then
executes viewport callback `0x277c74` and HTML callback `0x23c990` in Unicorn
2.1.4. Only mutex lock/unlock (`0x205a40`/`0x2059f8`) are intercepted. Original
resource accessors, viewport-buffer getter, zoom flag getter, arithmetic and
root-pane writes all execute. No device or renderer runs.

The fixture deliberately exposes its synthetic DOM, paint-origin, viewport-buffer
and zoom inputs. With the proven 400 × 220 document dimensions it produces:

| Synthetic element/paint/view inputs | Executed root translation |
| --- | --- |
| Element (0,0,400,220), paint origin (0,0), viewport (0,20), no zoom | (0,0,0) |
| Element (12,8,400,220), paint origin (12,8), viewport (0,20), no zoom | (0,0,0) |
| Element (12,8,400,220), paint origin (0,0), viewport (0,20), no zoom | (12,−8,0) |
| Element (0,0,400,220), paint origin (0,0), viewport (0,30), no zoom | (0,−10,0) |
| First case with zoom 1.5 | (100,−55,0) |

These results verify the source formula and show why the target picture's
`y = −10` cannot be copied into the HTML root unconditionally. **The first row is
not an observed native layout.** The viewport callback's bounds also must not be
silently substituted for the later view-buffer fields consumed by `0x1330b4`.

Remaining input owners are now explicit:

- Element rectangle: component `+0x38/+0x3c/+0x40/+0x44`. Archive-load completion
  initializes width/height at `0x23c5ec`–`0x23c638`; final DOM layout can still
  position the element. Body margin zero alone is insufficient proof.
- Paint origin: callback r1 `+0x10/+0x14`. `0x23c678` registers callback
  `0x23c990` with command type 4 via `0x268fe4`; its eventual paint-context inputs
  must be captured or traced through the HTML drawing-command dispatcher.
- View-buffer viewport: `0x1330b4` dereferences selected buffer from application
  secondary interface `+0x4c`, then reads buffer fields `+0x80/+0x84`.
- Zoom enable: document `+0x25c & 1`, through `0x1f9620` → `0x1f297c` →
  `0x1eab18`; zoom value is document `+0x250`.

The report keeps `actualResolvedHtmlInputsProven: false`.

## Queued work corrected: framebuffer readback

The previous audit called work executed through `0x1fd82c` a generic queued
command. Its body now establishes a narrower role: **framebuffer capture/readback**.
It selects upper or lower storage according to request byte `+0x10`, synchronizes
through `0x1356e4`, `0x204338` and `0x11cb40`, allocates output for the selected
width/height, and obtains framebuffer bytes via `0x1356d0`. The loops at
`0x1fd914`–`0x1fd9a8` transpose the source RGB bytes into RGB565. It stores output
dimensions, sets completion byte `+0x11`, then calls `0x11cb80`.

This is not an arbitrary callback dispatcher or an unconstrained draw-command
list. The earlier generic-command blocker is withdrawn. Its synchronization
helpers and intervening service draws still require bounded state closure before
claiming final banner registers, but the readback conversion itself is not a
reason to assume arbitrary depth/scissor changes.

## Depth/scissor writers narrowed

The GL enable entry is `0x145fbc` (sets r1=1 and falls through into `0x145fc4`);
the disable wrapper is `0x1f95d4` (r1=0). Searching only direct calls to
`0x145fc4` misses enable calls and is not a valid absence proof.

The direct enable callers found are `0x186748`, `0x186758`, `0x186774`,
`0x186788`, inside state restoration `0x186734`. Its first saved capability is
depth test; the companion save routine `0x1857c8` reads and conditionally disables
it. No direct scissor-enable caller was found. That static result is narrower
than proving that no indirect or generated packet can alter draw-time state.

Known register writers include:

- Depth/color register `0x107`: full initialization header at `0x1243e0`;
  color/depth-write masked headers at `0x136260`/`0x1362fc`; depth-test masked
  header at `0x1463b0`; cached-state replay at `0x147014`–`0x147038`, header
  `0x00030107` from `0x147108`.
- Scissor enable/disable changes cached context byte `+0x578` and dirty bit
  `0x200` at `0x1462f0`–`0x146308`. It is not necessarily emitted immediately.
  Scissor register headers `0x65/0x66/0x67` occur at literal pools `0x1243f0`,
  `0x13fb4c`, and `0x143584`; each triplet's last entries are +4/+8.
- NW4C Begin at `0x217bfc` emits texture-related setup and continues through
  `0x286ef8`; it does not itself establish a depth/scissor reset in the examined
  packet. Material and batch command composition still need closure.

The pass-entry depth-off/write-on result remains valid. This follow-up does not
promote it to final U_top draw state.

## Shader and acceptance boundary

Original `romfs/shaders/nwlyt_PaneShader.shbin` is 1,060 bytes, SHA-256
`fae814a1d0d7c9daac192b5b2a1f811fa56ec996954bc108b670357d2b1e24be`.
Its presence and identity do not prove selected entrypoint, output mapping,
perspective interpolation or clipping. No usable existing PICA shader decoder
was found in the repository. Those semantics remain explicitly open; the shader
is private and has not been published.

Thirteen focused Zone source tests pass, including three new checks for the
source pin, bound viewport/constructor path, and conditional root arithmetic.
Private replay evidence is `reference/zone-final-placement/placement-replay.json`.
No runtime/public assets changed, so prior LCD source renders remain unchanged;
no new image is presented as a before/after improvement. No build, native launch
or browser operation was performed. A visible correction still requires resolved
inputs/state/shader behavior and matched native/source output.
