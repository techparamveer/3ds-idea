# D-pad rocking and circle-pad movement

The plus-shaped D-pad now rocks toward the pressed arm instead of translating the complete cap downward. The round circle pad slides in any direction while dragged and returns to its resting centre on release. Nintendo identifies the original XL circle pad as an analogue control on its [original XL controls page](https://www.nintendo.com/en-gb/Hardware/Nintendo-3DS-Family/Nintendo-3DS-XL/Unique-Controls/Unique-Controls-899321.html). The 3.5° rocker angle, 0.08 mm central movement and 1.5 mm slide radius are visual fits, not published Nintendo mechanism measurements.

Both existing cap meshes were already independent. `directional-motion.ts` builds a runtime pivot around each control’s bounds in Base coordinates, preserving mesh vertices, textures, neutral placement and associated print meshes. No Blender mesh change or new GLB is needed. The D-pad rotates on the X/Z axes; the circle pad translates on X/Z while remaining level. This supersedes the uniform D-pad depression in `button-press-motion.md`.

Pointer coordinates are projected onto the control surface in console space. The D-pad chooses the pressed arm; the circle pad measures displacement from where the drag began, avoiding a selection jump on initial contact. Captured pad drags operate the control without rotating the console. Direction changes navigate immediately; held directions repeat after 420 ms and then every 150 ms. Keyboard arrows drive the same D-pad rig, with independent key holds and bounded diagonal poses. Release, pointer cancellation, lost capture, blur and closing the lid release active movement. Reduced motion applies the pose directly. A short minimum duration makes quick taps visible; return damping settles exactly at neutral.

Verification on the current shipped asset:

- All 139 application tests passed. Tests exercise quick taps, independent/opposing key holds, full-circle input vectors, bounded travel and cancellation. Geometry checks load the actual shipped cap vertices, verify each pressed D-pad edge lowers and its opposite rises, confirm print follows the cap, and confirm exact neutral geometry is retained.
- Type checking and the production build passed. An earlier type check overlapped development type generation and failed in generated route validators; the subsequent complete check/build passed.
- Browser clicks on right, left, down and up produced the matching rotation signs and changed selection 0→2→0→1→0. Recorded rotations were approximately −0.06067/+0.06094 rad on Z and +0.05993/−0.05996 rad on X during quick presses. A pressed D-pad screenshot was inspected.
- Circle drags in all four directions produced matching translations with zero rotation. Left reached approximately 1.5 mm; upward/downward samples were approximately 1.50 mm while settling. Initial contact stayed neutral and kept selection unchanged. Projected console controls retained their positions through pad dragging.
- Both live pivots returned to their original positions with zero rotation. The keyboard Down key also drove the downward rocker pose. VGPU was ready in the browser.

The public model remains the verified audio-finish asset. The separate audio-contact candidate and unrelated work remain preserved.
