# Keyboard animation hierarchy binding

The fixed-width keyboard component pass demonstrates a delivery blocker: all
four native `Keytop_qwerty` clips contain `pah1`, which the converter currently
retains as unsupported. The strict title loader correctly rejects them. Preserve
that rejection until the section's meaning and its renderer binding are verified.

Presentation owns this bounded slice: establish the binary section schema and
native binding behavior from primary format implementations and the supplied
keyboard executable/resources; implement an isolated decoder helper under
`scripts/firmware/animation_hierarchy.py` plus the matching native animation types,
binding support and focused tests where proven. Coordinate the small
`decode_animation` call site with the asset worker, which currently owns Settings
locale conversion in `build.py` and `native.py`. Do not edit its in-progress
changes. The coordinator integrates the decoder call site after both commits.

Record exact original clip hashes and source offsets. Validate section bounds,
record references and hierarchy targets. Use the actual QWERTY layouts and all
four clips for binding fixtures; check the named key base/text groups rather than
merely making the loader accept the file. Do not discard the section or clear its
unsupported marker based on an assumption that it is editor-only metadata.
Unproved records must remain explicit errors. Preserve existing HOME behavior
for clips without this section.

Keep scratch, source excerpts, replay outputs and component renders under the
private SSD artifact root. No broad title conversion, public delivery rewrite,
native timing guesses, live keyboard wiring or UI automation belongs in this
slice. This removes a concrete conversion/binding gap; native initial composition,
input and matched-reference acceptance remain separate required work.
