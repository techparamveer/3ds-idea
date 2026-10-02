# HOME Suspended Window - 2 October 2026

Runtime `81d0b3d878f3728685101cbbfa55a272508e7e4a` restores the selected
suspended application's expanded upper panel. H-12 is partially delivered,
not complete and not accepted 1:1. Close/switch remains the first priority.

## Delivered

`home-suspended-window.ts` draws `home.launcher/LncBase_U_00`, its original
window frames, icon mask, sleep overlay, HOME glyph, English MSBT captions and
shared bitmap font. It follows the selected retained application instance,
not just an app ID. Live applications, applets, another selection, panels,
sleep and retired owners do not show the expanded panel. Close clears it;
resume keeps the same owner. Compact presentation for another selection is
still missing.

The existing presentation-owned application snapshot supplies the frozen upper
frame without another readback or retained copy. HOME owns its HUD/footer;
the flat capture excludes those bands to prevent a stale/doubled clock.
SMDH long descriptions use the existing validated metadata selector. Native
48px icons are copied into a transparent64px texture for the source0..0.75 UVs;
the original second mask sampler is preserved. Portfolio titles use their
existing art/name as an explicit content adaptation.

The renderer's existing paired recovery/readiness gate now covers this window.
Missing frame, metadata, message, layout, animation or draw fails explicitly.
Recovery can resume the retained app or cancel an overlaid dialog; it does not
close the owner. One metadata raster is cached per selected owner, invalidated
on selection/assets change and released at teardown. No reducer owns pixels.

## Source Identity

No source resources were regenerated. Converter: `ctr-native-web1.2.0`,
CTRTool1.3.0, plus existing SMDH description converter1. Complete resource,
texture, source archive and converter records are in the private summary below.

| Element | Manifest mapping and decrypted source |
| --- | --- |
| Frame, icon mask, sleep tint, HOME glyph, camera hints and poses | `home.launcher` -> `packs/home/launcher.json` -> HOME0004003000009802 v24576, content0/00000082, RomFS `launcher_LZ.bin`; source SHA `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Suspended/resume captions | `home.messages` -> `packs/home/messages-and-loose.json`, `menu_msbt_LZ/lau_pose_title_u` and `lau_rest_comm_u`; same HOME content, recorded RomFS SHA `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d` |
| Health name/icon | `titles.0004001000022300.longDescription` and `.icon` -> `icons/health-and-safety.png`; Health v3077, content0/00000008, `ExeFS/icon`, SHA `ab6cfc9da9089bb7209bee980ff79b365638e84eacb663e1a792fed58e7a9055` |
| Caption font | `fonts.shared` -> `fonts/shared/font.json`;0004009b00014002 v0, `cbf_std.bcfnt.lz`, SHA `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`; legacy font record does not identify content index/id |

Pack hashes: launcher `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`,
messages `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
Legacy HOME resource records omit internal MSBT/container member hashes;
do not imply the source mapping is more granular than it is.

## Verification

- Tested: full1663 pass/0 fail/23 skip/1 TODO; typecheck/build pass. Fifteen
  focused ownership/source/capture tests pass. No shader/material change.
- Browser-inspected: muted Sidecar Health running/suspended/resumed, close
  dialog/cancel/confirmed close; Work suspension, another selection and
  reselection. Nine final raw LCD pairs; browser error list empty. Existing
  accessibility buttons drove this replay, not native-matched held input.
- Native-compared: retained Azahar400x480 `_02.10.26_04.57.45.252.png`, SHA
  `929a8623f8f5061ad5dfc7c4d0b8772eb4ee04503bf04101e0979d97a1945d75`,
  against final Health suspended400x240/320x240 pair. Empty mask, inspected
  upper/lower sheets. **95,286 upper / 51,107 lower** pixels exceed2/255.
  Different population/density, input prefix, HUD and frozen-frame phase make
  this a diagnostic, not a matched-scenario result. Historical matrix unchanged.
- A fresh replay attempt used the verified isolated executable and silent
  Static2/Null1/volume0 profile, but remained at its game list with no new
  native frame. Quit hid the window without ending the process; exact owned
  PID21145 was stopped with SIGTERM, exit143 verified. Temporary HOME/log
  bindings restored after exit. No system/Spotify setting changed.

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/suspended-window/`.
`final/summary.json` SHA `d645d09591dd6930542d28869ea788e587f2b0c82c3937f8f00bccf23ed97f0f`
tracks all final pairs, history, mask, report, sheets and source identities.
Upper PNG SHA `cbb5d4ccfd487d526d8d9d6adb2e305aa383c402b75de51d27ee8d40e323e552`;
lower `727db751408fa118c5e50b6af7b5698813c13b67e015d1588f4a700f165b4f7d`.
Earlier root-level captures are dirty intermediate diagnostics, not final.

## Remaining Differences

Flat frozen capture and cropped bands are presentation adaptations: native
warp/blur/tint and dark HUD/background remain missing. The settled source
ScaleUpDown15/Appear10/Sleep0 pose does not reproduce native motion. Caption
centering uses measured glyph advance fitted to the reference; the original
host writer is not traced. Padded icon binding is assembly, not proof of native
texture allocation. Lower suspension tint, compact window, first-use notice,
close/switch native artwork/policy/motion, power timing and audio remain open.
Health still receives the authored confirmation even though the native capture
closed directly. Existing Settings fits, local saved layouts/previews and
offline/portfolio adaptations remain. No whole scenario passes.
