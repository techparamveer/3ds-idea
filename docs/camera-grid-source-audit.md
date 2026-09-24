# Camera large browse-grid source audit

The lower gallery used six large thumbnail textures at invented centres
(58, 160, 262) × (65, 145), with 92×72 touch targets. Source Camera instead
places those thumbnails at **(84, 160, 236) × (74, 140)** with **62×48**
`BB-Thmb` targets. The painter and shared touch layout now use those settled
positions. Camera and the Camera helper retain the read-only portfolio flow.

## Executable and layout evidence

EUR Camera title `0004001000022400`, content `0000-0000001a`, executable base
`0x100000`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The private converted `camera-native14` browse pack includes data-only layouts
that are deliberately absent from the public rendering selection.

| Record | Source fact |
| --- | --- |
| `0x347fc8` | Density triples: `{3,2,6}`, `{4,3,12}`, `{5,4,20}` (columns, rows, page count) |
| `0x440268` / `0x440274` | Pointer arrays for `PicPosRengeL/M/S` and `PageRengeL/M/S` |
| `P_BrwsPhoMntBase/-PhoMntPos` | Translation `(0,+13)` |
| `P_BrwsPhoMntData/PicPosRengeL` | Centre `(0,0)`, size `228×132` |
| `P_BrwsPhoMntData/PageRengeL` | Size `248×146` |
| `0x2d2134–0x2d2224` | Loads the three range sizes and adds their translations to the photo mount; stores size at owner `+0x2268`, centre at `+0x2244` |
| `0x2de524–0x2de638` | Computes cell centre from the density, mounted range and item index modulo page count |
| `0x2db78c–0x2db8c0` | Same centre calculation plus page-index × page-stride and the current scrolling offset |
| `0x1fc5b0–0x1fc5dc` | Page count = max(1, ceil(item count / density page count)) |
| `P_BrwsPic/BB-Thmb`, `P_BrwsFld/BB-Thmb` | Both centred at `(0,0)`, size `62×48` |

The centre calculation truncates range width to an integer multiple of columns.
For large mode that leaves 228 unchanged. With column `c`, row `r`, and the
settled page origin, source layout coordinates are:

```
x = 0 + (c + 0.5) × 228 / 3 − 228 / 2
y = 13 + 132 / 2 − (r + 0.5) × 132 / 2
```

Lower canvas coordinates are `(160+x,120−y)`. The native hit box around each
centre produces rectangles `(53+76c, 50+66r, 62, 48)`. The shared target remains
the only location definition; the painter now uses its vertical centre rather
than the previous arbitrary `+27` offset.

## Reproduction and verification

Run `scripts/audit_camera_grid.py` with absolute `--code`, `--pack`, `--output`
paths. It checks the executable hash, density/pointer/constant records and pane
geometry before deriving the centres. It does not execute native firmware.

Artifacts are beneath
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/camera-grid-source/`:
`audit.json`, private `disasm.txt`, and `render/` with the ordinary gallery,
six-cell specimen and second-page specimen. Synthetic grid records exist only
in the verifier, not the website's portfolio content.

Focused tests pass **34/34**, covering all six centres, cursor alignment, the
next page's item identity, native hit-box dimensions, touch gaps and the existing
photo-mask composition. Typecheck passes. Real-resource rendering passes with no
diagnostics; the six-cell lower image was inspected. The local production build
stops because Turbopack rejects this worktree's external `node_modules` symlink,
before compiling application code. The coordinator must run the production build
with integration's physical dependencies and owns live browser QA.

## Limits

Only **settled large-mode placement and target bounds** are corrected here.
The existing six-item page adapter remains: it jumps to the selection's page
instead of recreating native scrolling/drag physics and adjacent-page buffers.
Native source has 248px page stride; that does not prove the current page
transition. Medium/small modes, density switching and folder expansion motion
are not implemented. Source texture filenames mentioning `4x5`/`5x7` do not
supersede the executable's density triples.

Generic Back/Open footer, empty-copy resize, neutral-background override,
portfolio viewfinder replacement, photo previous/next hit rectangles and the
other gaps in [gallery validation](camera-gallery-source-validation.md) remain.
No native LCD comparison or strict 1:1 acceptance is claimed.
