# Native cursor painter primitives

2026-09-23. `firmware-presentation.ts` now exposes two center-based helpers
under the [integration contract](native-toolbar-cursor-painter-contract.md):

```ts
cursorAt(ctx, centerX, centerY, scaleFrame, loopFrame, pressed = false)
cursorEffectAt(ctx, centerX, centerY, scaleFrame, disappearFrame)
```

`cursorAt` draws `LncCsr_00`, binding Select at0 or5 and forwarding the supplied
applied Scale and Loop frames. Toolbar Scale10/11/12 and fractional density
frames reach the native sampler unchanged. `cursorEffectAt` draws
`LncCsrEfct_00`, binding the supplied applied Scale and DisAppear frames.
Both use the resources' original binding groups, return the renderer result,
and impose no additional clip.

The existing `cursor(ctx,x,y,size,density,loopFrame,pressed)` delegates to
`cursorAt` with center `(x+size/2,y+size/2)` and the existing density clamp.
Existing grid callers retain their behavior.

The loader's selected-layout list now includes `LncCsrEfct_00`. The existing
launcher pack already contains its layout and two animations; its only texture,
`LncCsrShdw_44.bclim`, is shared with the primary cursor. Loading still fetches
that texture once. No conversion or public asset change is needed.

The caller owns current versus applied controller frames, visibility, the two
effect instances, modulo2 replacement, departed slot/focus and scrolling.
Painting does not advance controllers or apply a pending seek/restart. System,
navigation, scene and `screens.ts` are unchanged. Live placement, visibility,
layer ordering and browser/native pixel comparison remain integration work.

## Validation

`tests/native-cursor-presentation.test.mjs` reuses the real presenter, existing
caller fixture and actual converted resources verified in the
[source/resource audit](../scripts/firmware/TOOLBAR_CURSOR_EVIDENCE.md).

- Exact centers and frames across all eight toolbar anchors, including the
  authored duplicate-key geometry at Scale10/11/12 and incoming geometry just
  before10. Select moves only its bound parent; unrelated tracks stay excluded.
- Effect geometry at Scale10/11/12 and alpha at DisAppear0/10/20:
  `120`, `20.99600076675415`, `0`. Supplied fractional frames are retained.
- Repeated draws leave the deeply frozen resource pack and retained-frame
  records unchanged. An applied DisAppear9 is still painted when the caller's
  current frame has restarted at0.
- Both renderer results propagate; fractional and clamped grid-wrapper
  calls produce the same bindings/poses as their corresponding center calls.
- Asset loading uses real local JSON/PNG files with injected fonts/renderer,
  resolves the effect and shared texture, and rejects a missing effect layout.

The cursor, native presentation, native renderer and HOME presentation suites
passed **49/49 tests, no skips**. `npm run typecheck` and `git diff --check`
passed. No browser or Azahar session was used.

Logs remain on SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/native-toolbar-cursor/implementation/`:
`focused.tap` and `typecheck.log`.
