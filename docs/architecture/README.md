# Application architecture

The portfolio runs inside the two screens of a sourced original Silver + Black
3DS XL. Next.js serves the page and static delivery assets; the browser owns the
interactive console. There is no application backend or firmware executable in
the runtime. Native resources are converted offline and interpreted by browser
renderers around deterministic software state.

This design map follows UI continuation **`b196bc7` on
25 September 2026**. Parental screens remain inside
the existing `AppModule`, painter and `stock-screen-layout.ts` boundaries.
The Sound entry room adds a scene-owned static model background with an injected
prepare/draw contract; it participates in the same paired LCD readiness gate.

Other documents own the rest:

| Topic | Authority |
| --- | --- |
| Acceptance | [GOAL](../../GOAL.md) |
| Exclusions | [Current scope](../portfolio-ui-scope.md) |
| Long-lived lanes and handoff | [AGENTS.md](../../AGENTS.md), [implementation process](implementation-process.md) |
| What has been verified | [Progress](../progress-2026-09-24.md) |
| Owners and next actions | [Feature map](../feature-map.md) |
| Repository instructions | [AGENTS.md](../../AGENTS.md) only |

This directory explains the design and its tradeoffs.

## System map

```mermaid
flowchart TD
  Page[Next.js page] --> React[Console client lifecycle]
  React --> Scene[Three.js scene and mechanical rig]
  GLB[Compact sourced GLB and PBR maps] --> Scene
  VGPU[Optional VGPU roughness] --> Scene
  Scene --> Input[Shared input gate and adapters]
  Input --> State[System and AppModule reducers]
  Clock[Shared clock] --> State
  State --> Effects[Browser effects and persistence]
  Effects --> State
  State --> Paint[HOME and app screen composition]
  Packs[Native resource packs and fonts] --> Paint
  Paint --> LCD[400x240 upper and 320x240 lower logical LCDs]
  LCD --> Scene
  Banner[Native CGFX banner renderer] --> Paint
  Scene --> Banner
  Room[Source Sound room CGFX] --> Scene
  Scene --> RoomHook[Owned room prepare/draw]
  RoomHook --> Paint
```

The diagram includes folder/default banners. Settings also has a provisional
selected-title banner path; other stock banners remain unsupported. No selected
stock banner has passed the required native/browser LCD comparison. See
[HOME banner ownership](runtime-composition.md#home-banner-ownership-and-activation).

The upper logical surface expands to 800×240 texture storage; the physical
panel remains 5:3. Three.js dependencies stay in `src/scene/`. The OS receives
injected banner drawing callbacks and never navigates scene objects.

## Design documents

| Area | Document | Main implementation |
| --- | --- | --- |
| Startup, ownership, teardown | [Runtime composition](runtime-composition.md) | `Console.tsx`, `console-scene.ts`, `runtime-effects.ts` |
| Hardware, LCDs, native banners | [Scene and rendering](scene-and-rendering.md) | `src/scene/` |
| Input, application lifecycle, views | [OS state and input](os-state-and-input.md) | `src/os/system.ts`, `app-host.ts`, `screens.ts` |
| Offline conversion, delivery, provenance | [Assets and materials](assets-and-materials.md) | `scripts/firmware/`, `public/os/firmware/` |
| Visual/interaction/accessibility contract | [Experience design](experience-design.md) | `Console.tsx`, screen painters |
| Quality, cache, loading, failure | [Performance and resilience](performance-and-resilience.md) | quality tiers, native sessions and renderers |
| Checks and evidence | [Verification](verification.md) | `tests/`, verification scripts, SSD records |
| Worktree delivery and fidelity gates | [Implementation process](implementation-process.md) | Coordinator integration, defect scenarios and evidence handoff |
| Future changes with rationale | [Proposed improvements](proposed-improvements.md) | No runtime changes in this documentation task |

## Boundaries that matter

React starts and stops one imperative scene; it does not mirror frame-by-frame OS
state. The scene translates browser input and mechanics into software events.
Reducers decide state and emit effects; effect owners perform browser operations.
Presentation derives pixels from state and owns resources without putting Canvas,
audio or GPU handles in saves. Source conversion is separate from public delivery:
a decoded resource may remain unsupported, unpublished or unused by a live view.

The progress matrix distinguishes those stages. A source trace establishes only
the code/resource fact it traces; a screenshot establishes only its captured
scenario. Follow [verification](verification.md) for matched native/browser
pixels, motion, input and audio before accepting software fidelity.
