# Camera guide underlay: bounded source handoff

The integrated Camera Welcome page 1 diagnostic at `69d570a` reports 1,387 upper
and 7,026 lower pixels over 2/255. The lower guide body is now present, but the
browser clears the surrounding lower surface to black. The preserved native
page 1 has shoot-scene pixels around that body. This note makes no runtime
change: the trace identifies additional source content and its construction,
but does not yet establish its active Welcome pose or guide attenuation.

## Resource identity

Pinned EUR Camera title `0004001000022400`, content index 0 / `0000001a`,
`romfs/res/P_Shoot_D.bcenv.LZ`:

- Compressed SHA-256: `a5519a472c873ed3bca958ab9716e1a08e43df87cc6d17586ea6611292f0481b`
- LZ11 clear CGFX: 78,976 bytes, SHA-256 `728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1`

Despite the `.bcenv` extension, the CGFX root dictionaries contain model meshes,
textures and materials, as well as camera/light data. The resource is not just
a lighting description. Bounded dictionary reading finds:

| Dictionary | Exact names |
| --- | --- |
| Models | P_Shoot_D, X_Arw, Z_Arw, A_stick |
| Textures | grid, Btn, Arrow1, Arrow2 |
| LUTs | P_Shoot_D.MaterialLutset, X_Arw.MaterialLutset, Z_Arw.MaterialLutset, A_stick.MaterialLutset |
| Cameras | camera1 |
| Lights | pointLight1 |

The four CMDL object offsets are `0x208`, `0x2250`, `0x3d70`, `0x5890`.
Material object names in the corresponding model spans are:

| Model | Materials |
| --- | --- |
| P_Shoot_D | Grid1, target |
| X_Arw | X_Arw_M, X_Arw_Sdw_M |
| Z_Arw | X_Arw_Sdw_M, Z_Arw_M |
| A_stick | A_stick_M, A_stick_Sdw_M |

These are original resource names, not evidence that all four objects are
visible under Welcome. The Camera reader in `scripts/firmware-cgfx/camera.py`
currently rejects this source with **Unsupported CCAM revision**: camera1 has
revision `0x07010000`, while its bounded accepted revision is `0x06000000`.
Do not silently change that gate or substitute a guessed camera. Source camera
position is `(0,680,661.1129760742188)`; it is not an established final runtime
projection or browser framing.

## Executable construction evidence

Camera ExeFS code SHA-256 remains
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The following addresses were checked against that binary and existing complete
ARM disassembly. This is static inspection, not executed scene replay.

| Address | Bounded fact |
| --- | --- |
| 0x2a6340–0x2a6354 | Allocates 0x204 bytes and calls constructor 0x28e9e0 |
| 0x2a6338–0x2a6388 | Retains the constructed object in enclosing owner +0xcb4 |
| 0x2a638c–0x2a6398 | Passes that object to 0x25e6d8 with parent r6 and argument 1 |
| 0x28eb8c–0x28ebb8 | Resolves string `res/P_Shoot_D` and initializes owner +0x98 |
| 0x28ebdc | Calls 0x28dd2c |
| 0x28dd34–0x28dd60 | Resolves `res/P_Shoot_D.bcenv` and initializes owner +0x13c |
| 0x28dd64–0x28ddf4 | Looks up Z_Arw, X_Arw, A_stick, P_Shoot_D; stores handles at +0x148/+0x14c/+0x150/+0x154 |
| 0x28ebe8–0x28ec58 | Resolves target1/target2 and retains their transform components |
| 0x2a6410–0x2a6474 | Initializes the guide wrapper at enclosing owner +0xcdc, finally calling 0x27364c |

The same owner construction therefore includes both a shoot CGFX object and
the guide wrapper. It does **not** prove the Welcome-time visibility and final
draw order of each model, nor the framebuffer operation behind the modal guide.
The CGFX object's update path around `0x28e0e4` writes per-object transforms and
visibility; copying only authored model transforms would omit runtime state.

## 2D layer and attenuation gap

The separate source layout P_Shoot_D contains the shoot/header/footer controls,
UserWdw0/1, lever, and tool controls. Its material constant slot 5 is not uniform:
UserWdw0 starts `(255,161,0,255)`, UserWdw1 and text window materials start
`(145,221,210,255)`, while ShootLBase/ShootRBase/Lever1 start `(0,128,255,255)`.
The guide capture cannot justify replacing every slot with orange. The runtime
writes selecting the current user theme and active shoot layout clips remain
untraced for this scene.

C_BkMask is a separate 400×240 resource with a black material and Pict alpha 0.
Its C_BkMask_Out clip interpolates Pict alpha from 0 to 255 over source frames
0–60. This establishes an available mask, **not** its use as the guide dimmer,
its lower-LCD coverage or a settled half-alpha. No black 50% overlay is added.

## Concrete cross-lane work

1. Assets: privately convert P_Shoot_D.bcenv.LZ with all four model objects,
   textures, LUTs and camera/light records preserved. Audit exporter support for
   CCAM revision 0x07010000 before delivering it. Keep raw CGFX private.
2. Experience: trace or replay the owner registration/draw path, lower viewport,
   camera/projection selection, per-model visibility and pose at settled Welcome.
   Follow guide wrapper 0x27364c and its compositor to resolve attenuation.
3. Stock: after those contracts are established, compose the original P_Shoot_D
   layout with its actual clip/theme binding beneath C_DlgChA. Keep capture
   actions inert. Use the existing injected model-background/readiness contract
   if the original 3D layer proves visible; never flatten it to a guessed panel.
4. Coordinator: capture the integrated raw LCDs and compare the named page-1
   pair, then follow the guide page/exit scenarios. No whole scenario passes.

This bounded slice changes no application or public resource. `git diff --check`
passes. No emulator, browser or external-drive writes were performed. The stock
lane remains based on the guide commit `2cf19c1` plus this handoff note.
