# Verification architecture

Verification is layered because no single test proves the complete experience.

## Automated layers

| Layer | Command or location | Protects |
| --- | --- | --- |
| Unit/invariant tests | `npm test` | Reducers, menu layout, motion, model structure, maps and dimensions |
| Type system | `npm run typecheck` | Module and API contracts |
| Production compilation | `npm run build` | Next.js client/server boundaries and bundling |
| Shader validation | `npm run check:shader` | WGSL parsing and GPU validation |
| Asset scripts | `scripts/` and model-specific tests | Export and compression invariants |

Documentation-only edits do not require rebuilding. Code, shader, asset or
configuration changes require the relevant layers above.

## Browser layer

Inspect the actual homepage after meaningful scene, material, screen or input
changes. Check:

- load, intro, open/close and resize behavior;
- keyboard, physical control hits and touchscreen equivalence;
- suspend/resume, application switching, power and persistence;
- VGPU-ready and forced baked-fallback paths;
- reduced motion and mobile/portrait framing;
- front, back, underside, side and grazing material views;
- console errors, failed resources and WebGL/WebGPU cleanup.

Use matched reference/render views for geometry and material claims. Browser
presence of a texture or `data-vgpu="ready"` proves only that a path executed,
not that the surface looks correct.

## Branch/worktree checks

The main UI work occurs on `uifix`. `codex/home-menu-assets` remains an
independent worktree, and `codex/3ds-os` is the older preserved OS branch. Check
ancestry before merging: never create a redundant merge when the requested
branch is already contained. Do not overwrite dirty worktree changes or assume
that build artifacts are product changes.

## Reporting

Report commands run, pass/fail counts, browser evidence and any unavailable
tooling separately. Keep unresolved visual defects and firmware dependencies
explicit even when every automated check passes.
