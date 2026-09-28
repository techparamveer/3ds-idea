# Sound settled icon fill: source check

The pinned EUR Sound empty-entry capture and source render compared in
[the icon/footer audit](sound-entry-icon-footer-validation.md) leave the
left icon fill `(0,38,7,19)` at 53.772 mean absolute RGB error. At `(1,47)`,
native RGB is `(72,131,234)` and the render is `(164,186,222)`. The red
arrow at source cursor frame 18 already matches all 92 mask pixels exactly.

The delivered `S_Common-BrwCursor` layout separates `IconCurBarO_R` from the
cursor bar group. Its bar body `CurBarB0_P0` has pane alpha 88, while the two
edge panes and icon pane have alpha 255. The bar materials use source theme
register 5, and the existing entry binding replaces that register on the
posed layout. These records identify the drawn components but do not establish
the native overlap/blend operation at the left edge. A global theme or alpha
change would alter already aligned arrow or strip pixels, so this check makes
no runtime change.

The same pinned comparison reports footer mean absolute RGB error 6.058;
StreetPass and Settings account for the largest bounded button errors. Their
remaining text blend is likewise untraced. No new production browser or native
capture was made. Both residuals remain open for a component-specific
compositor trace and matched recapture; no scenario status changes.
