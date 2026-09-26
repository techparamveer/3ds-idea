# Camera guide lower modal composition

The lower Camera guide now composes the source warm render-target base, CGFX
and shoot controls, then the source black modal pass, then the guide. This
replaces the opaque black CGFX clear and the prior capture-fitted 2D-only
`brightness(0.5)` filter. Source button clips remain the unresolved Disable
candidates documented in the [top-control audit](camera-guide-top-controls-audit.md).

## Source and execution evidence

All addresses refer to pinned EUR Camera title `0004001000022400`, content
`0000001a`, executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

- The [clear-pair audit](camera-guide-top-controls-audit.md#follow-up-original-lower-render-target-base-8efe4d4)
  establishes the 320×240/pass8 node, RGBA `(233,224,208,255)`, submission and
  shared parent with the shoot CGFX.
- Initializer `0x31a540–0x31a568` writes `(0,0,0,128)` to global `0x44015a`.
  The earlier on-disk zero interpretation was incomplete: these source writes
  initialize the shared modal colour before it is copied to guide child
  `+0x181` at `0x2736e4–0x2736e8` (and the second child at `0x2737e8`).
- `0x301014–0x30104c` constructs an alpha-zero start and the original endpoint
  colour, passing both to `0x256584` for child `+0x188`. The constructor
  `0x22026c` and interpolation/update path `0x26de78` reach the unchanged
  endpoint; the settled colour is retained at modal object `+0xa4`.
- Dialog draw `0x300e70` draws that modal child before `0x26d67c` draws the
  dialog layout. The modal subtype has vtable `0x41e638`; its callback
  `0x26d2f4` reads `+0xa4`, skips alpha zero and submits nonzero colour to
  `0x10d9cc` with r1=1/r2=0. The warm-base adapter submits with r1=0/r2=1.

`scripts/audit_camera_guide_modal.py` executes the colour initializer, guide
colour copy, actual modal constructor, interpolation setup, 22 update calls
and dialog draw ordering. Its synthetic probe uses a 20-frame interpolation
duration; this does **not** establish native guide timing. The final three
frames retain alpha128. Only GPU submission and dialog-layout service
boundaries are intercepted during the final draw: the recorded sequence is
`modal RGBA(0,0,0,128), r1=1/r2=0` followed by `dialog-layout`.
The source replay passes, with output retained at
`/Users/paramveer/.codex/artifacts/camera-guide-top-controls-20260926/guide-modal-replay.json`.

## Implementation and limits

The scene's existing cached Camera target clears to raw normalized source RGB
`233/255,224/255,208/255`; explicit linear colour inputs avoid interpreting
those LCD bytes as an sRGB hexadecimal colour. Original CGFX alpha blends into
that base, and its opaque readback remains scene-owned.

The OS paints the source 2D shoot controls normally, then composites black with
alpha `128/255` across the lower LCD once. The guide body/buttons follow this
pass. Canvas filter, operation, alpha and fill state are saved/restored around
the modal. No guessed colour, coordinate adjustment or replacement art is
introduced. Source upper-screen ordering remains a separate investigation;
this change is limited to the evidenced lower underlay.

The existing static guide applies the settled endpoint. Opening/closing timing,
P_Shoot_D/P_CamBtn Default versus Disable selection, camera/icon state, model
projection and interactive arrow visibility remain unresolved. This update
supersedes only the clear and 2D attenuation portions of the
[earlier adaptation](camera-shoot-underlay-adaptation.md).

The source replay, 44 focused Camera/background/preparation tests,
`npm run typecheck`, `npm run build` and `git diff --check` pass. Tests verify
raw clear channels, one modal pass after CGFX plus 2D controls and before the
guide, exact alpha128, state restoration and failure handling. No shared browser,
Azahar or server was operated. **Fresh integrated raw LCD comparison remains
required**, especially the side strips, top controls and orange footer on both
pages; neither complete visual equivalence nor a scenario pass is claimed.
