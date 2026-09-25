# Native Camera browse comparison gap — 25 September 2026

The read-only Camera gallery has **no matched native EUR 10.7.0-32E browse
capture**. The current 320×240 `camera-gallery-bottom.png` under the private
`reference/health-native-compare-2026-09-25/render/` directory is a site
source render: it shows three portfolio thumbnails, source browse cell art and
cursor, plus the portfolio Back/Open footer. It is not an Azahar LCD image.
The other private `camera-*.png` render directories and the browser Camera
captures have the same provenance distinction. The isolated Azahar Settings
pair in `reference/native-settings-2026-09-24/` is genuine native output, but
it contains no Camera screen. No pixel-error or 1:1 Camera claim follows from
these files.

The isolated `reference/user/` NAND contains EUR Camera title
`0004001000022400` (`content/0000001a.app`, `00000019.app` and TMD). A title
installation is not evidence that its browse scene starts or settles. The
[profile isolation note](native-reference-profile-isolation.md) establishes
the copied Azahar executable, OpenGL renderer and one validated key-to-touch
route to **Other Settings**. That mapping does not establish a Camera `View
Photos` coordinate, a folder/photo touch target, or a Camera LCD capture.
Direct executable launch also warns that camera emulation may be absent; a
blank viewfinder alone must not be read as the intended browse backdrop.

Nintendo's [View Photos support route](https://en-americas-support.nintendo.com/app/answers/detail/a_id/114/~/how-to-view-a-photo%252Fimage)
confirms the sequence **Camera main menu → View Photos → tap a photo**, but
does not provide a firmware-versioned browse screenshot. The current
[source comparison](camera-gallery-source-validation.md) identifies
`P_FinderVS_U` on the upper LCD and `P_Brws_D` cells on the lower LCD. Its
footer analysis also identifies native Shoot/Settings/Slideshow controls,
which the read-only portfolio deliberately replaces with Back/Open. That
known adaptation is not a reason to add capture controls.

The next native comparison needs the coordinator to launch Camera from the
isolated profile, verify each visible transition into View Photos, and save
the settled **upper 400×240 and lower 320×240 LCDs** with title/version,
renderer and input route recorded. Capture an empty browse state if the
isolated profile has no photos. A populated grid requires known test photos
in that *isolated* profile; do not infer cells from a transient loading or
capture view. Keep the default macOS Azahar profile untouched. Compare the
native lower background, thumbnail frames, cursor and mount with a matching
source-render state; mask portfolio image pixels and the intentionally adapted
footer. A chrome correction should name its pane/asset or binding and report
a before/after pixel region or coordinate against the native LCD. Until that
pair exists, the source's 66×52 cell and 56×42 photo-slot geometry is the
available measurement, not native visual acceptance.
