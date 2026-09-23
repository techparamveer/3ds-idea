# Runtime composition

## Next.js boundary

`src/app/page.tsx` renders one `Console`. The page has no external navigation,
headings, cards or explanatory chrome because the physical console is the full
interface. `src/app/source-preview/page.tsx` is a diagnostic route, not part of
the intended homepage experience.

`Console.tsx` is a client component because WebGL, pointer input, audio,
`localStorage` and canvas APIs are browser-only. It dynamically imports
`createConsoleScene`; this keeps the large Three.js/VGPU path out of the server
component and allows a static image plus retry control if initialization fails.

## Scene lifecycle

`createConsoleScene(host, modelUrl)` owns the complete imperative runtime:

1. Select a render-quality tier and create the renderer, camera and lighting.
2. Load and decode the compact GLB with Meshopt.
3. Resolve semantic rig nodes, controls and display anchors.
4. Create the OS canvases and attach them as screen textures.
5. Restore persisted menu preferences and start input/audio adapters.
6. Compile the initial scene before starting the intro clock.
7. Run animation, state ticks, screen uploads and rendering.
8. Return one teardown function that removes listeners and disposes every GPU,
   canvas, audio and DOM resource it owns.

React owns only start, retry and teardown. It does not mirror the complete OS or
scene state. This avoids React reconciliation on animation frames.

## State ownership

| State | Owner | Persistence |
| --- | --- | --- |
| Scene transforms, pointers, held controls | `console-scene.ts` | Runtime only |
| HOME Menu and application lifecycle | `src/os/system.ts`, `state.ts`, `app-host.ts` | Versioned saves/preferences via `app-persistence.ts`; legacy localStorage migration |
| Browser device resources | `app-capabilities.ts`, created/disposed by scene | Captured media Blobs in IndexedDB |
| Screen pixels | `screens.ts` and `portfolio-screens.ts` | Regenerated from state |
| Model geometry/material metadata | GLB and `model-layout.ts` | Authored/exported asset |
| Render capability tier | `render-quality.ts` | Recomputed on load |

Do not introduce a second copy of the same state in React. New UI behavior
should normally be a pure OS transition followed by one screen repaint.

The isolated `native-title-session.ts` prepares foreground native view resource
ownership by AppInstance/view identity; see [its lifecycle contract](../native-title-session.md).
It cancels and discards stale loads, releases owned renderers and preserves
borrowed fonts. Scene wiring is pending the native keyboard view; it is not yet
an active source of screen pixels. Its teardown must precede shared-font disposal.

## Failure behavior

- A GLB or scene-start failure rejects to `Console.tsx`, which shows the static
  fallback and a retry button.
- Unsupported or failed WebGPU keeps the baked Blender material surface.
- A failed optional banner renderer falls back to flat canvas artwork.
- Missing portfolio media shows an explicit in-screen placeholder.
- Teardown remains valid even if asynchronous material initialization finishes
  after the component unmounts.
