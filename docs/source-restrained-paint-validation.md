# Silver grain and hairline finish

Active checkpoint: `model/candidates/joshua-xl/silver-restrained-paint.blend` and `.glb`, following `silver-abxy-openings`. The public model is an exact copy of the new GLB, SHA-256 `696c1a352065e352fab52c9dad9ef600e2e72e3881c9430b09e6cb97004d3810`.

The user's image 4 shows fine silver grain, sparse hairlines and stronger wear at the edges. The earlier narrow-light diagnostic showed excessively dominant added grain, obscuring the scratch trial. `build_restrained_paint.py` subtracts 65% of the recorded added-grain delta from the trial maps, through the EUR paint mask. It retains the original source wear and later map corrections, then normalizes the resulting normals. It changes no colour or lettering. The retained 35% is an appearance estimate, not a measured Nintendo coating property.

Nintendo's original product page was checked again on 2026-09-10. It confirms the Silver × Black original model and the 156 × 93 × 22 mm closed size, but does not supply microscopic paint measurements. [Nintendo original 3DS LL specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html)

The sparse scratch layer is the authored treatment described in `paint-scratch-trials.md`. Its physical scale and groove approximation remain estimates. The new reflection close-ups, `paint-reflection-restrained-{lid,cover}.png`, show discernible hairlines against restrained grain on both panels. They are more consistent with the reference's surface hierarchy than the previous strong grain, but the reference does not provide matched macro lighting for an exact numerical comparison.

All six standard views are recorded as `restrained-paint-{front,open,top,side,rear,underside}.png` and were visually inspected. Broad highlights continue across the curved panels; the shell outline and internal controls are unchanged. At whole-device scale the hairlines are subtle. The underside lettering remains limited by the source image resolution, and side-port geometry and hardware lettering fidelity remain incomplete. This finish pass does not establish exact overall identity.

`install_restrained_paint.py` copies only the outer-lid and chassis materials, packs the four maps, saves a separate Blender checkpoint and exports with the carried source tangent frames. The chassis still contains black parts, but the generated maps preserve every unpainted pixel. The roughness maps preserve their red and blue channels. Source colour, print, specular maps, material metadata and unrelated materials remain intact.

Verification: the two new export tests compare every mesh attribute, index, node transform and hierarchy to the previous checkpoint, then compare resolved material values and embedded image hashes. Only the two panels' normal/roughness images and material names differ. All 117 JavaScript tests pass; Python script compilation passes. No application source or shader changed, so no application rebuild was needed.

Browser inspection at 1280 × 720 covered the open console, closed lid and rotated underside. VGPU reported ready, physical A opened a folder, B returned and Space closed the hinge. Browser warning/error logs were empty. The development-only baked fallback was also checked; this is a forced-path check, not certification of all hardware.
