# Native density button availability

Implement the source-proven toolbar availability path after committing its
original-ARM/resource evidence. Presentation owns a new pure
`src/os/home-density-controls.ts`, the toolbar bindings in
`firmware-presentation.ts`, the narrow density-button hit branch in
`state.ts::touchMenu`, focused tests and a validation note. No System scheduler,
navigation motion, saved history, scene or public resource edits in this pass.

The helper reads the active navigation context and target density. The native
minimum is0 at root and1 in any folder; the maximum is5. Decrease is enabled
only above the minimum; increase only below5. During a density transition use
its target, never its current or interpolated density. Both presenter and
toolbar hit handling consume this one predicate.

Bind genuine `LncBase_D_01_Invalid` to disabled `G_Dw_00`/`G_Up_00` groups,
using the resource's constant alpha120 and no invented fade duration. Omit
the Select binding for a disabled density button. Keep other toolbar groups,
palette/Miiverse bindings and clipping unchanged. Verify group membership and
actual posed resources, not only a mocked call list.

The source widget gate suppresses its press handler; the lower-level native
density setter still permits0..5. Therefore prevent disabled toolbar taps in
`touchMenu` without globally rejecting or rewriting folder density0. Preserve
restored histories, generic `setHomeDensity`, and compatibility zoom commands;
those commands are not yet a claim of native toolbar/physical-key behavior.
Do not add a fabricated sound for a disabled control.

Test root0/1/5 and folder0/1/2/5, both pending-density directions, disabled
pressed visuals, enabled group isolation and touch down/up through System.
Assert disabled taps retain selection, history and motion while enabled taps
retain existing native density motion. Check that valid restored folder0
still paints its existing geometry. Use real converted resources and focused
tests/typecheck. Root owns matched browser/native recapture and integration.
