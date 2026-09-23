# Ordinary empty-slot final opacity

The paired native/browser lower LCDs show excessive vacancy contrast. The new
original-ARM trace identifies category5's final `P_IconBtnDmy_00` alpha128,
distinct from the fully opaque SetSrc artwork and settled `N_BlankAnime_00`.
Implement the ordinary supported configuration's128/255 final opacity without
editing source colors, texture pixels, ancestor alpha or decoded resource data.
The trace's special configurable32 path remains explicitly unsupported until
its corresponding runtime configuration is modeled.

Presentation owns only the `empty()` path in `firmware-presentation.ts`, focused
tests and a dedicated validation note. Keep occupied software/folder artwork,
cursor, pickup source, generic raster math and public assets unchanged. Root
owns integration and matched browser/native measurements. Evidence must be
committed before the application patch.

The current empty path directly paints the selected SetSrc vacancy subtree.
If final Canvas opacity is used as an equivalent projection of the native final
pane, verify that the active subtree contributes a single picture with the
supported blend for every density endpoint and representative fractional Scale
values. Compare that projection with rendering the source to an intermediate
surface followed by final128/255 compositing. Do not silently apply per-picture
alpha where overlapping source layers would require whole-target opacity.
Keep existing inherited close alpha independent and restore Canvas state on
success/failure. Preserve subpixel placement, texture filtering and generic
CLAN inputs; no raster cache phase rounding.

Use actual resource tests and the optional SSD Canvas runtime. Cover ordinary
and closing inherited alpha, all density endpoints and intermediate density,
state restoration and occupied-path preservation. Run focused tests/typecheck,
commit, and report exact equivalence boundaries. Root compares the same paired
vacancy regions and retains all remaining pixel differences explicitly.
