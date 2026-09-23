# Native read-only helper presentation

`stock-native-helpers.ts` exports `nativeHelperView`, `nativeHelperTargets`, and
`drawNativeHelperFrame`. The shared coordinator owns integrating those exports.
All selected layouts are loaded with the helper's own title identity. Native
messages retain source English text and styles. The runtime supplies only local
read-only state; no system operation is performed.

## System Transfer

Title `0004001000022a00` uses `CARDBOARD-layout-layout-lz77.json` and its own
English `cardboard_ctr` bank. The main lower screen attaches `button_D_01` at
`position_D_00/N_button_20` and `N_button_21`; the settled parent is y5 and the
button centres are (160,50) and (160,142). Runtime actions remain `3ds` and `dsi`.
The source `Title_Name`, `CM_00_Header`, transfer choices and `Button_Return`
labels are used. Details reuse the source title panel for the runtime's local
availability message, without asserting connected hardware or a transfer.

The parent and button Select clips carry archive-level animation shares. A
bounded derived copy drops only the three observed absent-endpoint pairs and
rejects any applicable or unknown share. Original resources remain immutable.
The alternate return-text pair is hidden so two labels do not overlap.

Touch regions: choices (27,18,266,64) and (27,110,266,64); Back (0,208,120,32).

## Circle Pad Pro

Runtime ID `extrapad`, title `000400300000cd02`, uses `extrapad.json` plus the
`extrapad_msbt_LZ` bank. The initial lower screen shows the source readiness
message `cepd_dlg_ready` in `Dialog_D_00`. Its source Cancel/Next footer maps
only to runtime Back and the read-only `information` detail. The detail displays
the supplied availability text and a full-width Cancel control returning Back.
No calibration animation, connected-accessory state or success is simulated.

Upper `TextBG_U_00` uses `top_comm_u`. Its three signed-size panel quadrants are
normalized to absolute sizes and reflected scales in derived pane overrides,
retaining their source origins, as in the existing Settings adapter.

Touch regions: initial Cancel (0,212,160,28), Next (160,212,160,28); detail Cancel
(0,212,320,28). Next opens information and does not start calibration.

## Verification

Run `scripts/verify-stock-helpers.mjs` with absolute `--artifact-dir`,
`--asset-root`, `--canvas-module`, and `--font-manifest` paths. It renders each
LCD, checks native load/render diagnostics and source resource immutability,
and validates visible action targets. It also retains NNID and updater coverage.
The paired outputs require visual inspection; successful asset loading does not
establish a matched native LCD reproduction. Browser verification remains the
integration coordinator's responsibility. Details and notice panel placement are
bounded web compositions using source components, not operation reenactments.
