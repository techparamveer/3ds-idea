# Native upper folder label

The upper folder label now uses the original `BannerFolder/mt_Text` geometry and
material with the native `BnrDsTitle_00` offscreen layout. It replaces the authored
Canvas pill when both native rendering and the label texture are available.
This is a bounded source/runtime implementation, pending browser comparison of
the new text plane and its billboard orientation.

## Verified native path

The runtime task's private report and annotated source evidence are in
`runtime/reference/folder-text/` under the firmware artifact root. They establish:

- Native folder activation at `0x24b444` replaces `T_Title_00`, renders the layout
  through `0x2453b8`, and binds the result to material `mt_Text`, sampler 0.
- `BnrDsTitle_00` is from `banner_LZ.bin`; its offscreen surface is **256×64 RGBA8**.
  The original `DmyText_00` L4 asset is a placeholder, not the replacement format.
- The source shared-font pane is center-middle, dimensions **15.5×18.60000038**,
  with zero extra character/line spacing. It paints black text on the source
  white background. The shader reads texture RGB/red, so a transparent glyph-only
  mask would be incorrect.
- The empty-name branch resolves `lau_2b_folder_noname`. The pane's `0x21` user
  data invokes horizontal fitting. Original metrics are restored for each label;
  when measured width is at least 256, the integral percentage is
  `max(80, trunc(100 * 256 / width - 1))`. Only font X changes; there is no folder
  wrapping or ellipsis on this path. Float32 arithmetic is used for fit decisions
  and multiplication. Glyph advances come from the existing decoded font writer;
  full native writer accumulation parity is not independently established.

The source plane has 16 vertices and authored rounded corners. No new pill mesh,
corner radius, panel dimensions or font size is invented. The renderer caches
one generated label surface and uploads a replacement only when that surface
changes. The temporary Canvas is released immediately after RGBA readback.

## Billboard preservation and implementation

Raw Text bone 11 begins at decoded CGFX offset `0x74e8`. Its `BillboardMode` at
`+0xd4` / `0x75bc` is **5, ScreenViewpoint**. Root and FolderRoot are Off.
SPICA's `Gfx.ToH3D()` copies transforms but omits BillboardMode; the exporter now
preserves this field directly by native bone name. The regenerated folder differs
only in Text's mode and converter provenance. Meshes, materials, curves, all
other bone fields and all nine PNGs are unchanged.

`cgfx-billboard.ts` ports the pinned SPICA renderer's ScreenViewpoint rule into
Three's matrix convention, including the transpose required by SPICA's matrix
column upload and shader dot products. The full parent/world yaw is present
before computing the billboard. With the native camera, identity Text resolves
to approximately +1.27911° X tilt and cancels external Y yaw. The original plane
therefore stays readable while the rest of the folder follows whole-model yaw.

**Limit:** this is SPICA renderer evidence, not an independently traced native
billboard implementation. SPICA's separate model/view upload convention is not
treated as an authoritative native pipeline. Browser/native comparison must
check the small tilt, panel placement and camera-facing behavior.

## Transparent overlay transport

Native `mt_Text` RGB blending is SourceAlpha / OneMinusSourceAlpha, while its
framebuffer alpha equation also uses SourceAlpha, producing squared alpha on a
transparent target. Reading that target directly as straight Canvas ImageData
would apply coverage a second time and darken the label.

The folder offscreen target therefore tracks source-over **coverage** in alpha
while retaining original numeric PICA RGB blending. Transfer reverses rows and
unpremultiplies RGB exactly once. This is an explicit display transport rule, not
native framebuffer-alpha emulation. Opaque folder pixels retain their bytes.
The separately rendered background remains on its existing path. Hidden prize
effects and destination-alpha-dependent future compositions are not validated
by this bounded overlay treatment.

## Revision-5 root reader repair

The four HOME CGFX resources Folder, BG, Camera and Textures have 15 root
dictionaries ending at offset `0x94`, where the first `DICT` starts. SPICA's root
includes a later sixteenth Emitters field and interprets that dictionary header
as a bogus count/pointer. This caused Camera and Textures conversion to fail.

`LegacyGfxReader` recognizes only revision `0x05000000` with this observed root
shape, validates the header and dictionary bounds/counts, and reads the 15 typed
dictionaries using SPICA's deserializer. Other shapes retain the pinned reader.
No pinned SPICA files are modified and no emitter data is fabricated. The
converter version is now 1.2.0; folder resource hashes in the main manifest are
refreshed. The shared Textures resource contains body, FrdCtrCol, FrdCtrEnv and
shadow; no hypothetical background texture override is added.

## Checks

- **63/63 focused JavaScript tests pass**, including source label metrics,
  float32 fit thresholds, width reset after rename, original 16-vertex geometry,
  parent-yaw cancellation, raw RGBA replacement reuse and overlay transfer.
- **3/3 opt-in Python regression tests pass** against the owner's real CGFX
  files: all four resources convert; corrupt length/count fixtures are rejected.
- Exporter builds with .NET 8; nonincremental TypeScript and diff checks pass.
- Software source-mask captures are `presentation/banner-label-mask-0.png`
  through `-3.png`, covering the native sample name, a long label, no name and a
  later short rename. They retain opaque white backing with grayscale font ink.
- Actual browser/CGFX visual comparison remains with integration. Existing full
  build limitations in this isolated checkout are not reported as resolved by
  these checks.
