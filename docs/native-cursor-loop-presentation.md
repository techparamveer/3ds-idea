# Retained primary cursor frame in presentation

2026-09-23. The primary HOME cursor reads the frame retained by System instead
of converting paint elapsed milliseconds into a Loop frame. This implements
the presentation boundary of the
[cursor clock contract](native-cursor-clock-contract.md).

`screens.ts` passes `getHomeCursorLoopFrame(state, reduced)` to the native
cursor call. `firmware-presentation.ts` names that argument `loopFrame` and
binds it directly to `LncCsr_00_Loop`. There is no multiplication, rounding,
or controller advancement in either presentation call. The separate Scale
binding still uses `nativeHomeDensityFrame(density)`, preserving fractional
density during transitions. Select, placement, clipping and the generic CLAN
sampler are unchanged.

The runtime-owned getter returns the applied frame, frame0 for reduced motion,
and frame0 for legacy callers without System cursor state. Turning reduced
motion off resumes sampling the retained frame. Existing opening captures
continue to omit the primary cursor. The authored fallback cursor continues
to receive elapsed time and its existing reduced-motion flag.

## Verification

`tests/native-cursor-presentation.test.mjs` executes the actual presenter and
screen painter at their injected drawing boundaries:

- Native Loop frames0,1,59 and19.375 reach the draw call unchanged. A synthetic
  CLAN track samples the same fractional phase; Scale2.5 also remains
  fractional and samples its expected intermediate scale.
- Repeated paints with elapsed times1000,1999 and550000 all submit retained
  frame12. A real navigation density transition supplies a fractional density
  unchanged to each cursor call. State remains byte-for-byte equal under JSON
  serialization after painting.
- Reduced motion samples0 and disabling it samples12 again. A System-less
  menu samples0. Opening-folder capture submits no extra primary cursor, and
  repeated folder paints preserve the retained state.
- When the native draw returns false, fallback curve geometry changes with
  elapsed time. Reduced motion holds that fallback geometry fixed.

The focused run passed **45/45**, with no skips:

```sh
node --test tests/native-cursor-presentation.test.mjs \
  tests/home-presentation.test.mjs tests/native-presentation.test.mjs \
  tests/native-renderer.test.mjs
npm run typecheck
```

Typecheck passed. Logs remain on SSD under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/retained-cursor-binding/`.
The tests use recording Canvas/presenter endpoints and stub unrelated graphics
and asset loading; they do not establish browser pixel equality. Runtime owns
advancement, visibility, lifecycle and close-completion ordering. Root owns
combined integration and browser/native comparison. The checks used runtime
API commit `8604099`; final System advancement is a separate dependency. No
wall-clock parity, mode3 acceleration, or complete native lifecycle is claimed.
