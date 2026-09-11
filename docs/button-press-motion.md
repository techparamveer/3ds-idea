# Physical button depression

The source asset already provides independent caps and grouped print primitives, so this change animates their existing transforms without changing the model geometry or textures. ABXY travel is now 0.6 mm, D-pad 0.45 mm, lower strip 0.3 mm, power 0.35 mm and shoulders 0.5 mm. These values are visual interaction fits, not measured Nintendo switch strokes. The circle pad is not animated as a clickable switch.

Pointer-down and keyboard-down begin depression immediately. A 130 ms minimum duration makes short taps visible; held inputs keep the cap down. Return uses slower damping than depression and snaps exactly to the saved rest transform. Cap children and the existing associated print-mesh handling move with the cap. Blur and canceled pointer gestures release the controls. Releasing a click over another button no longer activates that other button.

`src/scene/button-motion.ts` isolates timing and travel. Tests cover brief taps, overlapping pointer/keyboard holds, cancellation and repeated use without rest-position drift. All 135 application tests passed, along with TypeScript and a production build. Browser verification on localhost:3001 measured actual A-cap translation of 0.599695 mm and HOME-cap translation of 0.299947 mm. A opened the folder and a physical HOME click returned to the menu. VGPU reported ready. DOM-only `lastButtonPress` and `buttonDepths` diagnostics expose actual peak displacement and return state without adding visible page content.

This pass does not establish factory switch travel, directional D-pad rocking, or full hardware fidelity. The separate audio-contact candidate remains saved for subsequent delivery verification; this button change uses the current audio-finish public model.
