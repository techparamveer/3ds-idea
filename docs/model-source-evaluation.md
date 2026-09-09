# Existing-model evaluation, 9 September 2026

The user asked: “ok what if you just get a 3d model from google and rig it and sutff?”
The active approach is now to acquire and inspect an existing original 2012
Nintendo 3DS XL model, then adapt and rig it for the portfolio. Further procedural
shell rebuilding is paused. The current `.blend` and deployed `.glb` are preserved.

## Candidates

| Candidate | Confirmed listing information | Evaluation and access |
| --- | --- | --- |
| [Joshua P. / Pansdaz](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc) | Original XL, 9.4k triangles, 5.5k vertices, free download, CC BY 4.0; PBR-textured game asset | Preferred first trial. Viewer inspected from front and rear; black interior and red exterior with visible screen smudges and wear. Silver repaint and wear adjustment needed. Clicking Download opens Sketchfab's login dialog. Signed-in dialog offers original FBX35MB,4K GLB27MB and1K GLB2MB. The4K transfer stalled after4,636,960bytes; all geometry buffers arrived and were imported into a separate inspection file. Its68 components have since been separated and rigged. Textures remain incomplete. |
| [Keita-sama](https://sketchfab.com/3d-models/nintendo-3ds-xl-7ae615e8687a4030b4a24b30ad1425d7) | Original XL, 7.3k triangles, 3.8k vertices, Maya/Substance Painter, free download, CC BY 4.0 | Alternative candidate. Live listing/API confirm downloadable. Blue exterior visible in a clipped browser view; this was insufficient for full shape comparison. Native archive format and hierarchy unverified. |
| [3DModels.org, Nintendo 3DS XL (2012)](https://3dmodels.org/3d-models/nintendo-3ds-xl-2012/) | Listing states separate main objects, material colours can change, BLEND/GLB/FBX/OBJ available; displayed starting price £45 | Paid alternative only. Listing claims real dimensions but no downloaded geometry or full fidelity validation. No purchase made; final licence option and checkout price would need review. |

Do not substitute a New 3DS XL or standard-size 3DS. Do not use unauthorised
viewer-cache extraction to bypass a source download/login requirement.

[Wesk's actual original XL/LL scans](https://bitbuilt.net/forums/threads/3ds-xl-ll-scan.7046/)
contain five shell parts, averaging about 2.5 million triangles each. The author
provides them as reference only. They are a possible dimensional comparison
resource, not a verified redistributable portfolio asset.

## Import and rigging acceptance

1. Download through the source's offered download mechanism. Keep the original
   archive separate, record its hash, licence, author and texture files. The source download is currently partial; complete geometry buffers have been
   preserved and imported as an explicitly textureless candidate. See
   `model/candidates/joshua-xl/README.md` for exact status and provenance.
2. Import into a separate Blender evaluation file through Blender MCP. Inspect
   the hierarchy and textures without running embedded scripts. Determine actual
   part separation and whether the published model is posed open or closed.
3. Establish the hinge axis from the actual barrel, preserve the upper assembly
   in its rest transform and clamp the motion to 0–155 degrees. Check closure
   against the base, keycaps and both screen surfaces.
4. Compare published156×93×22 mm closed dimensions and106.2×63.72 /84.96×63.72 mm
   active displays without distorting a wrong aspect ratio to make a box fit.
   Inspect front, underside, rear and side against original-XL photographs.
5. Separate moving caps and their legends while retaining UVs. Provide stable
   control pivots/targets for ABXY, D-pad, circle pad, SELECT/HOME/START, POWER and
   shoulder buttons. Screen surfaces must support independent live OS textures.
6. Recolour the correct outer material/UV region to silver while preserving
   black parts and markings. Reassess excessive baked dirt, reflections and
   screen graphics rather than stacking the current textures indiscriminately.
7. Adapt the existing Three.js scene to the inspected hierarchy, export a
   comparison GLB, and validate scale, closure, touch alignment, physical input,
   introduction motion, reduced motion and actual browser appearance. Replace
   the live asset only after this evaluation.
8. Include source credit, licence link and a change notice in the deliverable
   provenance and credits accessible through the console. Keep the page itself
   free of unrelated text and controls.

## Preserved diagnostics

Before the change in direction, a closed overhead comparison exposed triangular
shading patches near the current procedural lid's hinge-side corners. Clearing
sharp flags and disconnecting the normal map did not remove them. The existing
crown uses single straight-side edges up to150.8 mm long and inner corner radii
that collapse to0.1 mm. Simple subdivision and a denser-perimeter trial did not
produce a validated repair. These trials were discarded by reopening the saved
native model; they were never exported. Diagnostic images and a checkpoint remain
locally under `model/checkpoints/`, outside the shipped asset set.

## Current result

The separate `model/candidates/joshua-xl/rigged-geometry.blend` and `.glb` contain
all9,353 source triangles,68 separated components, a fitted X-axis hinge and12
independent controls. The source's150degree pose was converted to closed rest
geometry, with a0–155degree opening rig. UVs and vertex normals were preserved.
Two new source-rig tests pass; the full existing suite now has16passing tests.
Those checks do not verify the missing original textures.

The initial static export inherited the presentation action's frame1 yaw; this
was corrected by temporarily detaching its actions during the static export.
The candidate now exports closed with an identity presentation rotation. Open
and closed renders were inspected. The source envelope, uniformly scaled to
156mm width, measures156×92.397×22.233mm; active display boundaries and exact
fidelity remain pending. The live website and its current model are preserved.

The authenticated download itself remains stalled at4,636,960/28,850,812bytes.
The browser's download-event wait timed out, and no completed FBX/GLB/ZIP was found
in Downloads or bounded temporary artifact locations. Browser policy rejected
opening its downloads manager; no alternate access to that blocked manager was
attempted. User input was requested about a Save dialog or paused/failed download.

## Runtime integration checkpoint

The separate `/source-preview` route now loads the rigged candidate with live
upper/lower displays and the existing plain menu. The main route still loads the
preserved model. Source `console_layout` metadata supplies dedicated display
anchors, while actual control mesh bounds determine directional input centres.
The two baked source screen-artwork meshes are hidden during live rendering and
excluded from pointer hits. Their triangles, UVs and normals remain preserved.

The active LCD rectangles measure 106.2 × 63.72 and 84.96 × 63.72 mm. They are
provisionally centred within the source glass, offset 0.02 mm outward. This does
not establish their position against the missing bitmap boundaries. No source
mesh dimensions were stretched to force the overall target envelope.

Browser checks at 1280 × 720 confirmed the candidate's open/closed rendering,
A/B, HOME, D-pad right, touch selection, power off/on and reopening. The main
homepage retained its live screens, button input and VGPU surface. The candidate
correctly reports VGPU as not applicable because its substitute inspection
materials have no identified silver-paint role. The full suite now has 23 passing
tests, including actual candidate display axes, physical size, glass offset,
control centres and unchanged geometry data. Typecheck and production build pass.

Remaining source work: complete the authenticated texture download, identify and
repaint the outer silver regions while preserving markings, confirm active pixel
boundaries, refine source proportions against Nintendo imagery, then repeat
matched visual comparisons before promoting the candidate to the main route.
