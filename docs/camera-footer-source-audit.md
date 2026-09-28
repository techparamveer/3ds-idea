# Camera browse footer source audit

The current Back/Open footer is a portfolio adaptation. **The native Camera
browse footer is Shoot and Settings, with Slideshow at the top.** Neither
`P_Tape` nor `C_HudBut_B` provides a native Back/Open replacement. This audit
adds no renderer or public resources, and does not enable capture controls.

## Evidence

EUR Camera `0004001000022400`, content `0000-0000001a`, executable base
`0x100000`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The private `camera-native14` converted packs are the same source as the
[gallery validation](camera-gallery-source-validation.md) and
[grid audit](camera-grid-source-audit.md).

`P_BrwsMenu_D` in `lyt-P_Brws_D-arc-LZ.json` contains:

| Control | Native label/MSG | Parent centre, source coordinates | Logical LCD hit rectangle |
| --- | --- | --- | --- |
| `BB-SShow` | Slideshow, `P/Brws_02` | `BtnMov0 (0,+105)` | `[0,0,320,30]` |
| `BB-Shoot` | Shoot, `P/Brws_03` | `BtnMov1 (-47,-105)` | `[0,210,226,30]` |
| `BB-Set` | Settings, `P/setting` | `-B-Set (+115,-105)` | `[230,210,90,30]` |

The source textures are `P_BtnUW_320x30.bclim`, `P_BtnDW_226x30.bclim`,
`P_BtnDW_90x30.bclim` and `P_IconNrl_MoveShoot.bclim`. None of these controls
is labelled Back or Open. The message bank separately contains `P/back`, which
does not establish that a browse control uses it. Replacing Shoot with Back
would change the native label, icon, action and navigation meaning.

`C_HudBut_B` in `lyt-C-Hud.json` is **battery status**. It contains the
`HudBat_00`, `HudBatBase_00`, `HudBatLgt_00`, `HudBatMask_00` textures, and its
Pattern animation adds `HudBat_01` and `HudBatPlg`. The `_B` suffix does not
mean the physical B button. It has no MSG or button bounds.

`P_Tape` is a decorative bottom strip with only `RootPane`, `UserWdw1` and
`UserWdw0` panes. It has no text, MSG or interactive bounds. Source trace:

| Address | Fact |
| --- | --- |
| `0x2d2318–0x2d234c` | SceneBrowse resolves `-L-Tape` and initializes its tape controller |
| `0x2d2354–0x2d2360` | Calls `0x218fb4` with state 0 and immediate flag 1 |
| `0x218fd8–0x21902c` | Maps states 0/1/2 to a clip pointer at table `0x440840` and binds it |
| `0x440840/44/48` | Strings `Pop`, `Flat`, `Wide` |

The settled browse state therefore binds `P_Tape_Pop`. An isolated source render
succeeds with **zero renderer diagnostics**, but its unbound default appearance
is a black/turquoise strip. Per-user colour/material binding was not established
by this trace. Successful TEV evaluation does not prove its native screen colour.

## Result and remaining work

No live UI change is justified by this bounded audit. Enabling Shoot would
violate the no-capture scope. Slideshow is also excluded from the current
read-only gallery. Relabelling these resources as Back/Open would be another
adaptation, not a native recreation. Removing Back/Open without an agreed
replacement would remove the current touchscreen return path.

Before a source-backed strip can be added, trace the native `UserWdw0/1`
material writes and compare its settled pixels. A native-looking portfolio
Back control must be explicitly documented as adapted navigation, rather than
claimed as native Camera browse UI. The current footer remains visibly generic
and strict 1:1 acceptance remains open.

## Reproduction and checks

`scripts/audit_camera_footer.py` accepts absolute `--source` (private converted
Camera pack directory), `--code` and `--output` paths. It verifies the executable
hash, MSG labels, control bounds, tape node kinds, battery texture identities,
clip pointer table and `-L-Tape` literal. The real-source run passes.

Evidence is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/camera-footer-source/`:
`audit.json`, `tape-probe.mjs`, `tape-pop.png`, and `tape-result.json`.
The Tape render was inspected; it is a private source specimen, not a browser
capture or matched native LCD. No application code or public asset changed, so
an application rebuild was not needed. `git diff --check` passes.
