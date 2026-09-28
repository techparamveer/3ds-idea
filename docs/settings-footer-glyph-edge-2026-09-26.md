# Settings footer glyph edge ownership

The supplied Other Settings page-1 comparison at base `4b75c4a` has 45 lower
pixels over 2/255, with an empty mask. Recomputing the raw 320×240 comparison
finds **42 Back-label pixels and three Touch Screen-label pixels**. The
source glyph quads identify the Back residual as horizontal boundary ownership.
`bitmap-font.ts` now excludes a sample exactly on the left edge and includes
one exactly on the right edge. This is a general rule for the existing upright
alpha-font raster path; the source glyph position, dimensions, atlas filtering,
text style and vertical coverage are unchanged.

## Source mapping and diagnosis

All native resources remain the supplied EUR 10.7.0-32E manifest resources.
Settings title `0004001000022000`, content index 0 / ID `0000003d` supplies:

| Delivered resource | Original member | SHA-256 |
| --- | --- | --- |
| `packs/settings/contents/0000-0000003d/base.json`, `Base_D_00` | `base_LZ.bin/blyt/Base_D_00.bclyt` | `1c6af5258ebf089e74a8ce8fb0ae77115a78d5c58290f2b8e169b5dd8922b3b0` |
| Same pack, `TopBase_D_00` | `base_LZ.bin/blyt/TopBase_D_00.bclyt` | `21a2935b586913c21017f79967fbed9b1a825ec2a05d9f9069e2e0ce7852b399` |
| `message_EU.json`, `mset` | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |
| `fonts/shared/font.json` and its sheets | Shared `cbf_std.bcfnt`, A4 | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

`base_2b_back` is “Back”, with source font scale 0.75/0.75 and zero character
spacing. The layout's `TextBox_00` and `TextBoxShdw_00` are centered 100×30
panes. The original shared glyph metrics and the existing traced writer yield
local left edges 28.5, 40.5, 51 and 61.5 for B/a/c/k, and widths 10.5, 9.75,
9 and 9. Screen placement adds 5 to X. Thus B, a and k start exactly on
pixel centers x33, x45 and x66. The k right edge is exactly the center of x75.

| Residual pixels | Source boundary | Native observation |
| --- | --- | --- |
| x33, y216..231 (16) | B left | Footer background, no glyph/shadow coverage |
| x66, y216..231 (16) | k left | Footer background, no glyph/shadow coverage |
| x45, y221..223 and y226..230 (8) | a left | Footer background, no glyph/shadow coverage |
| x75, y230..231 (2) | k right | Glyph/shadow coverage absent from old browser raster |
| x129, y168..170 (3) | Touch Screen text | Unresolved; not changed by this correction |

For example, at (66,231) native RGB is (112,112,112), browser (171,171,171).
At (75,231) native is (128,128,128), browser (112,112,112). The opposite
coverage on the two sides excludes a uniform color or position correction.
The old loop used `ceil(left−0.5)` through `ceil(right−0.5)` exclusively.
The new interval is `floor(left−0.5)+1` through `floor(right−0.5)+1`
exclusively. The two definitions differ **only at exact half-pixel ties**.

The [existing writer and sampler trace](native-font-raster.md) supplies the
source quad endpoints and linear atlas samples. Azahar's pinned
[triangle rasterizer](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/renderer_software/sw_rasterizer.cpp)
uses edge bias and pixel centers, while its
[display path](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/renderer_opengl/renderer_opengl.cpp)
rotates the native LCD framebuffer. These establish why framebuffer-edge names
cannot simply be reused as upright LCD-edge names. The concrete upright X
ownership here is established by the original glyph boundaries and both
preserved Settings captures, not by claiming the software rasterizer is a
complete hardware oracle. This pass does not alter vertical ties, emulate
PICA fixed-point snapping, or establish every transformed glyph case.

## Offline comparison

Native Other image:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/settings-other-1-text-raster-browser-20260926/native/combined.png`
(SHA-256 `09c625dd1a8a2080865ff24f672a0fd0975827cbf81dcd7f8310dd993d4a9d51`).
The supplied browser is in
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/settings-other-1-row-edges-browser-20260926/browser/lower.png`.

Independent main image:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/screenshots/System Settings_25.09.26_13.03.55.629.png`.
Both native lower crops are `(40,240,320,240)`.

`verify-stock-settings.mjs` produced before/after renders in this lane's
`.artifacts/footer-edge-{before,after}/`. The before Other render is byte-for-byte
identical in decoded RGBA to the supplied production-browser lower capture.
Both after lower renders were visually inspected.

| Preserved native / offline render | Before over 2/255 | After over 2/255 | Before / after RGB MAE |
| --- | ---: | ---: | --- |
| Other lower | 45 | 3 | 0.172700 / 0.155395 |
| Other footer, y208..239 | 42 | 0 | — |
| Settings main cold lower | 412 | 395 | 0.242843 / 0.239067 |
| Settings main footer, y208..239 | 17 | 0 | — |

The after Other lower PNG SHA-256 is
`3debc1db78e8176347598d732d546870e03d9d8170bf6eb17e2d37ad3c26b805`;
after main cold is
`d1ffacfbafaeb64625ec15e3a5f697995041b1c49011869873fbf84301db7cbd`.
The expected next production-browser lower result is **3**, pending recapture.
The supplied **1,520 upper** result remains the previous production baseline;
this shared font change can affect upper half-pixel ties too, and the offline
verifier uses a different HUD clock. No new upper acceptance count is claimed.

## Validation and limits

- 19 focused bitmap-font, native-renderer and Other Settings page-tab tests pass.
  The added regression tests exact left/right ties, neighboring quads, clipping,
  and nearby non-tied boundaries; existing filtering and fractional coverage
  tests continue to pass.
- Both source-verifier runs pass five main and 44 subpage paired renders,
  including immutable packs, scene variants and original English styles.
- `npm run typecheck`, `npm run build` and `git diff --check` pass in this lane.
- No Azahar or production browser session was driven. Other stock text may
  change at the same exact boundary ties; broader visual acceptance remains
  with the coordinator's paired captures. Existing tests do not prove every
  native screen's fidelity.
