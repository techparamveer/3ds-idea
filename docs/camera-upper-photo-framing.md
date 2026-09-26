# Camera upper photo framing — 26 September 2026

This is a provisional portfolio framing correction, **not native Camera visual
acceptance**. The preserved populated native/browser pair reports 95,350 upper
pixels over 2/255 before this change. Coordinator recapture is still required.

## Source and observed defect

The EUR 10.7.0-32E Camera pack
`packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json` maps
`P_FinderVS_U` to title `0004001000022400`, content index 0 / `0000001a`,
`lyt/P_Finder_U.arc.LZ/blyt/P_FinderVS_U.bclyt`, SHA-256
`4e8555e4e65b45de6965ed6c8e44f95d793d2ecc4ee09d759759cf7a8e9ac16f`.
Its `RootPane` and `FndEdge` are 400×240, centered at `[0,0]`. The published
pack has no animation clips and no photo framebuffer image pane. Its `Fit`
subtree supplies fit-control graphics; those pane sizes do not establish the
executable's image-sampling mode. The existing native layout renderer and
pack provenance remain the sole source of the upper native graphics.

The inspected private references are:

- `reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
- `reference/scenario-matrix/v1/captures/camera-browse-source-slider/browser/upper.png`

Both paths are under the firmware SSD artifact root. Native fills its upper
LCD with the selected Renu photo. Browser instead places the original 2000×1500
portfolio JPEG into 320×240, centered with 40-pixel black side bars. The caller
already requested 400×240; the shared media loader unconditionally used contain.

## Bounded correction

Camera gallery/photo upper now explicitly requests centered **cover**. The
media renderer crops the source image with the nine-argument `drawImage` call,
so the destination is exactly 400×240 and aspect ratio is preserved. For Renu,
the source rectangle is `[0,150,2000,1200]`. Lower thumbnails and photo mounts,
and other stock-media callers, retain their existing default contained fit.

Cover is a **capture-derived, provisional portfolio adaptation**. It is not a
claimed port of native Camera fit/zoom logic. No native graphics were drawn,
replaced, or retouched; no capture/import/edit capability was added.

## Remaining mismatch and next slice

The native fixture is not the original JPEG: Camera-created 640×480
`reference/user/sdmc/DCIM/100NIN03/HNI_0001.JPG` and `HNI_0002.JPG` already
show a tighter composition than `public/portfolio/renu.jpg`, owing to the
reference image-engine/capture path. In addition, the native upper capture
shows greater magnification than this cover correction alone predicts. The
phone occupies roughly 240 pixels of native screen height versus about 144
before this change and about 180 after centered cover. Matching that final
magnification by an arbitrary additional zoom would bake an unmatched fixture
into portfolio rendering.

Next compare identical decoded input pixels and native fit state; trace the
executable's fit selection and image-engine preprocessing before replacing
this provisional mapping. Native capture also shows its top-right 3D indicator,
while the current read-only renderer hides `ViewInfo`, and native/browser
edge appearance differs. Those chrome residuals remain open. The coordinator
must inspect the new paired LCDs and keep §5.5 acceptance open until all relevant
residuals and fixture/state differences are resolved.

## Checks

98 focused Camera painter, preparation, shared target and stock reducer tests
pass. They check explicit upper cover requests, source crop bounds for 4:3 and
portrait content, and preserved default lower placement. `npm run typecheck`
and `npm run build` pass. No Azahar/browser automation was run from this lane;
these checks do not establish a native pixel match.
