# Native Camera browse comparison gap — 25 September 2026

**Current status (matrix v3):** The isolated native Camera now has two
Camera-created photos and a populated View Photos capture. A browser pair exists,
but it **fails**: native shows a six-cell grid while the browser shows one
Renu folder photo tile. Its upper/lower diff has 95,350/76,220 pixels over
2/255. Inputs and states differ, so this is a diagnostic, not accepted gallery
fidelity. [Matrix v3](/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v3/matrix.json)
records the fixture hashes and capture paths. No Camera scenario passes.

At this note's original checkpoint, the read-only Camera gallery had **no
matched native EUR 10.7.0-32E browse capture**. The then-current 320×240 `camera-gallery-bottom.png` under the private
`reference/health-native-compare-2026-09-25/render/` directory is a site
source render: it shows three portfolio thumbnails, source browse cell art and
cursor, plus the portfolio Back/Open footer. It is not an Azahar LCD image.
The other private `camera-*.png` render directories and the browser Camera
captures have the same provenance distinction. The isolated Azahar Settings
pair in `reference/native-settings-2026-09-24/` is genuine native output, but
it contains no Camera screen. No pixel-error or 1:1 Camera claim follows from
these files.

At the original checkpoint, the isolated `reference/user/` NAND contained EUR Camera title
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

That earlier capture plan has now been exercised. The isolated Azahar image
engine used existing `public/portfolio/renu.jpg`; repaired touch bindings use
unused R/Y/E keys, and pressing native Camera A twice created two recognized
photos. JPG and MPO pairs live only under private
`reference/user/sdmc/DCIM/100NIN03/`; v3 records each SHA-256. The native
View Photos browse shows the six-cell grid. The browser Renu-folder capture
shows one photo tile after A. Keep the default macOS Azahar profile untouched.
Re-run after the browser gallery uses the source-backed grid, with equivalent
selection and input sequence, and then verify paging and motion. Compare the
native lower background, thumbnail frames, cursor and mount with the raw
browser LCD. Only after native chrome aligns, mask portfolio image pixels
and the intentionally adapted footer with named reasons. A chrome correction should name its pane/asset or binding and report
a before/after pixel region or coordinate against the native LCD. The
source's 66×52 cell and 56×42 photo-slot geometry remain bounded
measurements; the populated pair makes the layout defect visible but does not
validate those exact dimensions or establish native visual acceptance.
