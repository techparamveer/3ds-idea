# Stock banner absent-color binding

The production eShop HOME capture at
`reference/scenario-matrix/v1/captures/home-eshop-banner-first-live/browser/`
has an active, visible eShop primary at skeletal frame 372, but no banner pixels.
The delivered eShop common model has zero RGBA in all four mesh color arrays.
Its material alpha combiners multiply vertex alpha by texture alpha, so zero
vertex alpha produces zero overlay coverage at every pose. Camera's photo
meshes have the same condition; its title logo uses texture alpha directly.

The source shape audit distinguishes **absent Color input** from an authored
zero. eShop's four shapes and Camera's three photo shapes have neither a Color
stream nor a fixed Color attribute. The converter's expanded zero arrays were
decoder initialization, not color values stored by those shapes. The exporter
now supplies `mesh.hasVertexColor` from source attribute presence.

The renderer binds the source material's `DiffuseColor` only when this field
is explicitly `false`. It preserves authored streamed/fixed colors, including
transparent black, and preserves the old behavior for packs without metadata.
It does not change source arrays, source textures, geometry or transforms.
eShop bags/logo use their source diffuse alpha 255; the shade uses alpha 51.

**Provisional source-material adaptation:** this absent-input rule follows the
pinned SPICA reference `DefaultVertexShader.txt` `proc_calc_color`: alpha starts
from `MatDiff.w`, vertex alpha multiplication is conditional on `IsVertA`, and
absent vertex color without vertex lighting uses `MatDiff.xyzw`. That reference
implementation corroborates the binding but is not proof of the Nintendo
shader executed for the same native frame. Exact native shader, first-visible
phase, color and lighting parity remain open. The coordinator must recapture
and compare eShop and Camera in Azahar and the integrated production browser.
No matrix status changes to pass from this implementation.

The regression test inspects generated GPU vertex color buffers for explicit
absence, explicit presence and legacy missing metadata. It checks the source
shade alpha is retained, authored zeros stay zero, and source arrays are never
mutated. The original diagnostic is saved privately as
`delegation/stock-banner-zero-alpha-diagnostic.json` with model and CGFX hashes.

The renderer change depends on L3 metadata commit `2f53716` (locally tested as
`ab13f57`). Focused model/banner/resource checks: **77 pass, 0 fail, 1 existing
skip**. Typecheck, production build and shader validation pass. Browser/native
acceptance is owned by the coordinator; this worker did not operate either UI.
Logs are private `delegation/astra-absent-color-*.log`.

## Coordinator browser follow-up

Production `8f0eb39` was inspected on the site and in raw upper LCD exports:
`home-eshop-absent-color-fixed` shows bags/logo/shadow; the corresponding
`home-camera-absent-color-fixed` shows photo cards behind the logo. Both are
browser-only records in [matrix v25](/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v25/matrix.json), with no target native capture or diff.
The metadata dependency is integrated as `4e1abfa`. Full integration verification
passes 1,403 tests (0 fail, 23 skip, 1 TODO; 1,427 total), production build and
shader checks. The provisional source-material limitation above remains; visible
browser pixels do not establish the native shader or matching phase.
