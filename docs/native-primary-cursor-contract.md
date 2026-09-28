# Retained primary cursor footer

The source audit `scripts/firmware/PRIMARY_CURSOR_BOUNDARY_EVIDENCE.md` proves
that ordinary mode3 keeps the primary shown at its previous root position.
Selected-slot culling must not drive its native visibility or Loop eligibility.
Runtime may now implement a separate pure primary-position/visibility unit.

Own a new `src/os/home-primary-cursor.ts`, focused tests/numeric fixture and
validation note only. Do not edit System, scene, screens, navigation geometry,
Loop, retained effects or the presenter. Root owns their live composition.

Retain the source request0/1/2, HOME shown flag, actual layout visibility and
LCD center separately. Construction accepts explicit initial values; do not
claim source-proven native initialization where the audit supplied mature state.
Expose a request setter that changes no position, visibility or clock, and a
pure common-footer update with explicit overlay pointers/mode and position data.

Follow the executed footer: overlays or modes185/186 preserve state. Request0
shows as needed and then positions; request1 shows as needed without positioning;
request2 hides as needed. Preserve the distinction between shown and actual
visibility flags. Match the source conditions if supplied flags differ; do not
silently normalize them. Ordinary toolbar positioning uses its named anchor;
ordinary grid positioning uses the supplied current selected center, except
grid mode3 retains its root. Positioning never advances Loop or Scale.

Apply this footer after lower completion and pending replay. In particular,
idle entry can request0 and resolve slot3, then replay re-enters3/selects4;
the footer must retain the primary root in that final mode3. A supplied overlay
can leave request0 pending with a hidden cursor. The later layout owner uses
actual visibility together with its independent eligibility/status gate.

Tests compare the original four entry-through-completion sequences and eight
overlay/replay/visibility completions, plus request0/1/2 and toolbar positions
from the prior cursor audit. Source record positions are native coordinates;
convert to LCD `(160+x,120-y)`. Geometry supplied to this unit is already the
current native geometry: do not introduce rounding or a second interpolation
implementation. Preserve immutable state and zero hidden-time accumulation.
Run focused tests/typecheck, commit and report scope limits. No browser/Azahar.
