# Retained native cursor controller boundary

The navigation consumer now emits Scale seeks and departed-selection effects.
The next runtime unit owns their retained controllers, independently of painting
and independently of `HomeCursorLoop`. Use the executed source/resource evidence
in `scripts/firmware/TOOLBAR_CURSOR_EVIDENCE.md` and its frozen numeric report.

Runtime owns a new pure `src/os/home-cursor-presentation.ts`, its focused tests,
numeric fixtures when required and a validation note. Do not edit System, scene,
screens, the presenter, navigation or the existing Loop controller in this unit.
The integration task will connect these APIs to the ordinary host phases.

Expose immutable state for the primary Scale controller and exactly two effect
instances, plus the next modulo2 effect index. Each effect retains visibility,
its departed target/context, center, independent Scale current/applied frame and
DisAppear current/applied frame/status. Keep native seek/start semantics: changing
current never retroactively changes the applied frame. The caller supplies the
initial primary Scale; document any initial applied-pose adapter policy where the
source audit intentionally used a sentinel rather than proving native contents.

Accept the consumer's `scale-seek` and `cursor-select` observations. A selection
starts the next effect, sets its event-time center, seeks Scale and starts
DisAppear, then alternates the index. Toolbar centers and raw Scale10/11/12 come
from the verified named panes. Grid event centers are the observation's
`anchor.x - anchor.scrollPixels, anchor.y`; preserve the slot and context for
later motion. Other observation kinds must not mutate these controllers.

Provide an explicit counted layout update API with separate primary and effect
eligibility. Scale submits before retaining its current frame. DisAppear submits
0–20; the effect is hidden on the following wrapper update. Match the original
current/applied/status values, including reuse of a still-visible instance.
Inhibited or hidden controller behavior must match the bounded source evidence;
do not infer elapsed wall time. Zero updates and repeated samples emit no work.

Provide an explicit position update for the source-proved mode3 path: visible
grid effects follow their retained slot in the current geometry; toolbar effects
stay fixed. Require matching context for a grid follow. Treat a replaced context
as an integration boundary, not proof of a native cross-context slot mapping.
The host owns primary position, visibility requests and lifecycle/context reset.

Tests must compare the original audit's alternation, update, restart and
mode3-follow values, plus partitioned/batched equivalence, zero/inhibited updates,
target immutability and phase preservation. Run focused tests and typecheck,
commit coherently, and list source limits. Do not add browser or Azahar activity.
