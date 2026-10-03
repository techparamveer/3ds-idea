# Camera Manual Footer

3 October 2026. Feature H-12/L-07. Footer worker `f554458b` integrates as
`972fc7e1` from clean evidence `aed11de0`. The captured suspended Camera HOME
footer has Close/Manual/Resume, while the previous browser had Close/Resume.
This also affects the visible footer beneath ordinary close confirmation.

Manual worker `5aad0c38` integrates as `e23490e3`. Footer Decide follow-ups
`6c7b0d44` and `7bf3ebff` integrate as `a295d970` and final runtime `0e59c1a0`.
The source Decide frame 5 is retained through ordinary confirmation/closing
and compact footer departure, then removed before post-retirement ChangeUp.
Switch paths are excluded; no controller lifetime or duration changes.
Retaining this source pose is a capture-supported adaptation: native calling
code remains untraced. Its selected animation must exist or fail explicitly.

## Source And Behavior

Selected suspended Camera now uses decoded `LncBtmBtn_02` members
`N_BtnB_L_03`, `N_BtnW_C_03`, `N_BtnW_R_03`. Their labels use source
`lau_3b_quit` index 16/style 185, `lau_2b_manual` index 12/style 185 and
`lau_2b_restart` index 42/style 193. Pressed state selects the corresponding
source group, not a reconstructed button. Native shared-font pictograms
remain part of the message text.

Shared touch rectangles come from the decoded bounding panes: x `[0,105)`,
`[107,213)`, `[215,320)` and y `[212,240)`. Both authored two-pixel gaps are
inert. Down/up must retain the same semantic segment; crossing to Resume,
cancel or an outside release cannot activate Manual. Existing one/two-button
paths remain unchanged. Root Camera is native-observed; the selected-folder
variant follows shared owner semantics but remains an unverified adaptation.
The exact native footer routing predicate/callsite remains untraced.

Manual uses the existing system-applet route with Camera title ID, keeping
Camera as the exact application and HOME-return owner. Back completes only
the Manual applet. On a missing or failed selected Manual resource, recovery
also closes only that applet; it must not replace HOME-return with the failed
applet. No new app state system, native-asset fallback or owner retirement.

Footer element mapping: HOME `0004003000009802` v24576, content index 0 / ID
`00000082`, `home.launcher` -> `packs/home/launcher.json` ->
`RomFS/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt`.

- CIA SHA-256: `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
- Archive: `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
- Layout: `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44`.
- Delivered launcher: `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
- Labels -> `home.messages/menu_msbt_LZ` -> `RomFS/message/EU_English/menu_msbt_LZ.bin`:
  `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.
- Delivered `packs/home/messages-and-loose.json`:
  `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.

Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. Existing glyph/font provenance
is in the [warning source record](home-close-warning-2026-10-03.md#source-mapping).
No footer assets, durations, audio, scene or materials were changed.

Decide -> `home.launcher` -> `launcher_LZ.bin/anim/LncBtmBtn_02_Decide.bclan`,
SHA `65eb55af8110e51cf8efdc9bafb70d681fdbf528a211a0df5d9ca172546de4bc`,
uses the same title/content/archive/converter identity above.

## Camera Manual Source

The real English index is delivered through the existing Manual applet and
`applicationManualIconPixels`, not an invented screen. Camera's 15 page/four
category metadata is decoded, but page content and page navigation are **not
delivered**. Only index display and Close are supported. The existing renderer's
Settings-derived placement/raster fits remain explicit adaptations.

Element -> manifest resource `packs/camera/contents/0001-00000019/manual-EUR_en.json`
-> Camera `0004001000022400` v4097, content index 1 / ID `00000019` ->
`RomFS/Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt`.

- CIA: `cd1ce90f98970f2da13ae77b47b0925b9fe37b19c54d56c62fd8606e1b150e6d`.
- Decrypted content: `07316090b1b50fd8972f53d68b025552afd35d950aceee997513fcff5ba80a2e`.
- BCMA: `8711e6141ba9b42dc489ff40c47684c28c6fe414efd93ef66b90570c6d33bccd`.
- Index: `fb84dd247b046ac4394c989c74156de5d0e6b46c5eb5bec54a48b4ec319bc6ff`.
- Delivered pack: `752269a1572f297ebcdd3d9c93a037a6279d707c98fdf0b31ab9d8da6a52b55d`.
- Converter `application-manual-bcma` version 2, script SHA
  `09b70f8b4d090283c427ac1e40b3c4c6e10350b51d1cc1bc4f9e4ffd06c6026b`.
- Header -> existing `icons/camera.png` -> same title's content 0 / `0000001a`,
  `ExeFS/icon` SHA `53534942eaf5b9c11d94e5f5118b4fe1a624e40d83765893185fd2f30a2956a1`;
  delivered SHA `eef80be1e6961951cb776306165fd141016760327e1c96f865a68ccb88a92f01`.

The converter retains Settings defaults and recognizes a valid BCLIM footer
before treating a leading payload byte `0x11` as LZ compression. Unknown and
missing resources remain explicit failures. Private full source audit is
`R/manual-source/source-delivery.json`.

## Native Replay

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-camera-manual-footer-20261003`.
Fresh own 400x480 PNGs live under R's sibling
`native-folder-switch-20261002/screenshots/camera-manual-footer-20261003`.
`native-input-record.md` records Open -> Camera -> HOME -> Manual -> Close ->
HOME -> Camera Close/Cancel -> Resume. Camera remains suspended on Manual
return and resumes successfully. Normal 100% native rate is not a shared
browser epoch or proof of precise motion/input cadence.

The prior close-modal PNG SHA
`e5ca736d34544d7348437112dad7b4700add6a5df3128ea7de12987ef4200f5d`
remains the immutable primary. Fresh suspended, returned and close captures
provide supplementary controls. Predeclared raw lower footer ROI is
`[0,212,320,240)`; visual segments `[0,212,106,240)`, `[106,212,214,240)` and
`[214,212,320,240)` are comparison regions, not touch bounds. Body and icon
retain the preceding fixed ROIs. Whole LCDs and all ROIs have empty masks,
delta 2, no registration, shift, fit or phase search.

Private Azahar PID 42991 / window 13115 used the pinned executable, static
Camera image, Static input 2 / Null output 1 / volume 0. Its own exit was 0;
exact PID absence and original config restoration were verified. Config SHA
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
System audio, hardware media, default profile and unrelated apps were untouched.

## Supporting Checks

Footer integration: 1,900 tests pass, zero fail, 23 skip, one TODO; production
build and serialized typecheck pass. Independent review passes 159 focused
tests/typecheck with no findings. Worker focused 133 and broader HOME 722
pass; its extra full sparse run/build are not integration verification (missing
fixtures and an external dependency-symlink guard). No shader/material change.

Final runtime `0e59c1a0`: 1,902 tests pass, zero fail, 23 skip, one TODO;
production build, serialized typecheck and nine Python converter tests pass.
Independent Manual review passes nine Python and 12 Node tests/typecheck;
footer follow-up source review finds no actionable issue. Missing Decide has
a direct modal failure test and shared phase-table coverage, but not a separate
post-confirm missing-resource assertion. Worker Manual focused suite passes 94.

Production `after-desktop`, `after-mobile` and `after-reduced` each complete
19 switch pairs, with no page errors, mute retained and exact fixture
restoration. `manual-controls-desktop-v3`, `manual-controls-mobile` and
`manual-controls-reduced` each complete 10 pairs: fresh Manual touch, index,
Close-return, retained Camera Resume, cross-drag no-op and software Close.
Eight supplemental Work/About/Health controls also complete without errors.
Full desktop/mobile viewports and raw Manual/Close LCDs were opened; the
console and LCDs are nonblank and correctly framed without clipping.

Two incomplete Manual harness attempts are preserved and excluded: the first
wrongly required app-screen readiness on idle HOME; the second expected a
26px excursion/re-entry to activate, although existing HOME slop cancels that
stroke. The corrected replay asserts cancellation then uses a fresh tap.
Native footer re-entry was not captured, so this is not a native input pass.

Dedicated muted Chrome PID41753 exits0 and exact PID absence is verified;
native PID42991 is also absent. Preview3021/session46827 intentionally remains
HTTP200 at `0e59c1a0`. No required test/capture process remains, default profile
or system audio changed, private matrix edit or DeveloperStorage artifact write.

## Remaining

Primary prior native close PNG versus named `before-desktop/close-dialog`,
`after-footer-desktop/close-dialog` and `after-desktop/close-dialog`:

| Lower region | Before | Footer only | Final | Final maximum delta |
| --- | ---: | ---: | ---: | ---: |
| Whole lower | 3841 | 2120 | 82 | 86 |
| Complete footer | 3776 | 2055 | 17 | 27 |
| Close | 2038 | 2038 | 0 | 2 |
| Manual | 823 | 0 | 0 | 2 |
| Resume | 915 | 17 | 17 | 27 |
| Warning body | 7 | 7 | 7 | 86 |
| Source icon | 0 | 0 | 0 | 1 |

Counts are pixels above delta2, empty masks. Final upper95,208/96,000 and
whole95,290/172,800 remain fail. Fresh native suspended footer also improves
1,873 ->20; it is a supplementary state with a different population/epoch.
Neither fitting the source pose nor isolated segment agreement proves motion.

Final Close-dialog lower PNGs are byte-identical across desktop/mobile/reduced.
Supplementary Manual index pair against fresh native SHA
`187ad2e67e97fbe12f4d041e0679a8ff2ade2e8282065cc81264a8f80b8bea1f`
retains446upper/1,038lower (1,484whole) pixels above delta2, maximum135/177.
Its lower footer contributes262. Both browser LCDs are byte-identical across
the three modes, not a native match. The source index is delivered; geometry,
glyph/icon raster differences and inert undelivered pages remain unaccepted.

Final artifacts under R:

- `home-camera-manual-footer-comparison-report.json` SHA
  `ee66134fe5bddaebda4f35c2e2156e610a6121eb143c9fe060294027175d813a`.
- Opened `home-camera-manual-footer-comparison-sheet.png` SHA
  `9be2954d1775a6b72bdf5942b10b50a638acd9cc4b7e7149fc55a1ab64debe8e`.
- `home-camera-manual-footer-comparison-manifest.json` SHA
  `f1b936e0224b88b0cc188a055e1270c3865cce834a48f8c94e644d197790ba8b`.
- `generate_camera_manual_footer_comparison.py` SHA
  `3e4b6190bcb24850f1045112c942e44c6bc2dd700afef73c7053c8455233e40d`.
- `verify_camera_manual_footer_manifest.py` SHA
  `2d811bdccca641cb81d9030b5cb19271478e34b0b3dfa8310a6904f66520e1c7`.

Comparator regeneration is byte-stable. Coordinator independently ran the
verifier and rehashed all659 records, including both excluded attempts and
source delivery. Named pair identities, raw dimensions, input histories and
empty-mask metrics are retained in the report/manifest.

Whole scenarios remain **fail**. The seven warning-edge pixels and upper
Camera/HUD/content differences remain separate from this footer change.
Exact native/browser input, transient motion and audio are not accepted.
The existing Manual renderer carries Settings-derived placement/raster fits;
Camera content delivery and a native comparison cannot silently validate those
fits or other manual pages. Folder-native parity and routing-callsite proof
remain open. No private scenario matrix acceptance is implied.
