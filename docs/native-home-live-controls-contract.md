# Live HOME controls integration

Root owns `home-controls.ts`, System and scene integration. Native assets enable
the new session-local `System.homeControls: HomeControls | null`; the fallback
keeps its existing input path. Application input remains with `app-input.ts`.

`HomeControls` retains `input: HomeInputAdapter`, `producer: HomeInputProducer`,
`primary: HomePrimaryCursor` and `presentation: HomeCursorPresentation`.
Root initializes these from restored HOME geometry as an explicit browser
initialization policy. They are not persisted. Each active shared count samples
input, consumes ordered events, advances lower state, runs the primary footer,
then submits the later cursor controllers. Counted observation journals let the
scene place banner requests after its upper manager pass and before 3D work.
The clock's nominal60Hz conversion remains a browser policy. Reduced motion
changes drawing, without replacing native counted navigation.

Presentation owns only `screens.ts` and a focused painter integration test/note.
Read `state.system?.homeControls` after root's type lands. When present with
native assets, draw the retained primary using `cursorAt` and the two visible
effects using `cursorEffectAt`; use applied Scale/DisAppear and the retained
Loop sample. Primary precedes effect0/effect1. Draw this group outside grid
tile culling and its clip, so toolbar anchors are possible. Preserve the existing
surrounding draw order; the wider native layout order remains unverified.
Suppress the group for capture, overlays/inactive HOME and active grid gestures,
without mutating it. Root owns close request2/show behavior: do not hide it solely
because `isSystemHomeFolderClosing` is true. With reduced motion, primary uses
Loop0 and effects are omitted as an explicit accessibility policy. Fallback and
legacy callers keep the old tile-cursor path. Avoid duplicate primary drawing.

Root owns pointer/keyboard/analog routing, input cancellation, native cues,
close integration, toolbar activation handoff, and browser/Azahar verification.
No worker controls those sessions. Tests alone do not establish visual parity.

Chrome gestures retain the cursor group. In particular, a disabled density
button must not hide the existing cursor; its verified fixed-pose lower LCD
remains unchanged. Grid gesture visibility remains an explicit temporary adapter
policy pending the full native stylus lifecycle.
