# Application architecture

This directory explains how the portfolio is assembled and where each kind of
change belongs. `GOAL.md` remains the product authority. The research and
validation notes remain the authority for hardware fidelity.

## System map

```text
Next.js page
  └─ Console client boundary
      └─ Three.js console scene
          ├─ compact sourced GLB and mechanical rig
          ├─ physical control and pointer input
          ├─ upper and lower CanvasTexture displays
          │   └─ HOME Menu / portfolio state machine
          └─ baked PBR materials + optional VGPU paint surface
```

The visible page intentionally contains only the console and its background.
The portfolio is not a conventional collection of routes or DOM panels: its
content is rendered into the two in-world screens and operated through the
console.

## Documents

| Area | Read this | Primary code |
| --- | --- | --- |
| Application composition and ownership | [runtime-composition.md](runtime-composition.md) | `src/app/`, `src/components/Console.tsx`, `src/scene/console-scene.ts` |
| Three.js scene, rig and rendering | [scene-and-rendering.md](scene-and-rendering.md) | `src/scene/` |
| HOME Menu, portfolio state and input | [os-state-and-input.md](os-state-and-input.md) | `src/os/` |
| Blender, GLB, textures and VGPU | [assets-and-materials.md](assets-and-materials.md) | `model/`, `public/models/`, `src/shaders/` |
| Visual rules, responsive behavior and accessibility | [experience-design.md](experience-design.md) | `src/app/globals.css`, `src/os/screens.ts` |
| Performance budgets and degradation | [performance-and-resilience.md](performance-and-resilience.md) | `src/scene/render-quality.ts` |
| Tests, builds and browser verification | [verification.md](verification.md) | `tests/`, `scripts/` |

## Architectural boundaries

- `src/app/` owns the Next.js route shell, metadata and global page styling.
- `src/components/Console.tsx` is the React lifecycle boundary. It lazy-loads,
  starts and disposes the imperative scene.
- `src/scene/` owns Three.js objects, model interpretation, rendering quality,
  physical hit testing and hardware motion.
- `src/os/` owns deterministic software state, menu layout, screen painting,
  audio and portfolio data. It must not depend on Three.js scene objects.
- `model/`, `public/models/` and `public/textures/` form the asset pipeline.
  Editable source, browser delivery asset and generated maps are distinct.
- `tests/` protect both behavior and the audited model invariants. A passing
  bounding-box test is never a visual-fidelity sign-off.

Keep dependencies pointed inward through these boundaries. For example, the
scene may ask the OS to reduce an input, but OS reducers must not reach into the
scene graph. This keeps menu behavior testable without WebGL.
