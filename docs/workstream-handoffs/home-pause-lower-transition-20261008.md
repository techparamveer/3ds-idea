# HOME lower pause transition handoff - 8 October 2026

## Captured defect

The silent Sidecar captures in `home-suspension-sidecar` show the retained Health lower LCD shrinking and darkening before HOME replaces it. The outgoing lower has cleared before the Close/Resume footer starts entering. Browser pause frame 0 instead published the complete HOME grid and footer.

Native observations used only for ordering: the first footer begins between 11.845 s and 11.893 s and settles by 11.990 s; the repeat begins at 12.247 s and settles by 12.390 s. Native caller epochs were not traced, so these timestamps are not used as an exact-duration fit.

## Delivered composition

The lower compositor now retains the generation-owned 240x320 application capture, snapshots the matching 320x240 HOME lower before its footer, and presents the decoded launcher pause layout. The decoded layout's opaque `P_BG_00` supplies its black-to-navy surround; no background graphic is reconstructed. The retained application and HOME textures are bound to `P_App_00` and `P_Lnc_00`. Once the application/HOME clip completes, the decoded footer `SceneIn` begins. The existing pause receipt remains the sole publication clock and now reports `entryMotion.pauseLower` source frames for capture diagnostics.

The mapping of the two decoded clips onto the existing 0..20 host receipt clock is an adaptation because the firmware caller epochs remain untraced. It preserves the observed application -> HOME -> footer order and does not change the global pause duration or the upper HUD/window schedule.

## Native resource identity

- Title `0004003000009802`, version 24576, product `CTR-N-HMMP`, content index 0 / content ID `00000082`.
- Launcher archive source SHA-256 `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
- `launcher_LZ.bin/blyt/LncPauseFade_D_00.bclyt`, SHA-256 `87acf2364346072552cc48761184e8b98f61b3f9231e57703af48808cf509f2e`.
- `launcher_LZ.bin/anim/LncPauseFade_D_00_SceneIn.bclan`, SHA-256 `11a82f19bb21c3da0ccb67039ddf86b5feb90d8c7aafe4f3d57a77f49fd3b25f`, decoded frames 0..40.
- `launcher_LZ.bin/timg/LncPauseMask_00.bclim`, SHA-256 `ddb2afbac83aad87d97239fbadd88b11bd9f37da71a432f17a265282e40fabc6`.
- Footer `launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan`, SHA-256 `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e`, decoded frames 0..14.
- Conversion contract: `ctr-native-web` 1.2.0; extraction contract: CTRTool 1.3.0. The parent archive and CIA identities remain recorded in `animation-folder-home-20261007.md`.

## Verification

- Focused tests cover exact source rejection, source-frame sequencing, retained texture padding/cache identity, unpublished-paint stalls, revoke/retry, capture generation replacement, a resumed-owner repeat, reduced-motion endpoint, dialog/close interruption, stale capture and disposal.
- `node --test tests/home-pause-lower.test.mjs tests/home-pause-window-entry-live.test.mjs`: 9 passed.
- `tsc --noEmit --incremental false`: passed using the coordinator dependency checkout without modifying it.
- No browser or Azahar session was run in this worker. Integration still requires matched native/browser recapture. The broader upper HUD timing mismatch and exact native duration remain open.
