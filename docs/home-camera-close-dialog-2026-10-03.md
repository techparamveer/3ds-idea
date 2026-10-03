# Camera Close Dialog Header

Runtime `10be5b69`, worker `30cf9a77`, 3 October 2026. Feature L-07/H-12.
The [switch backing comparison](home-switch-backing-2026-10-03.md) exposed
Camera's ordinary-close dialog missing its title icon and separator, with the
body painted too high. This slice addresses that captured composition only.

## Implementation

HOME now requests decoded `LncDlgIcon_D_00`. Ordinary Close draws that
single-title header with the retained application's 48x48 icon and existing
localized body, leaving `Dlg_A_D_02` responsible for the window and buttons.
The header uses its authored pane positions, not new fitted coordinates.
Switch keeps `LncDlgIcon_D_01`, two icons and the lower-only mask. Existing
prompt policy, native messages, input geometry, phases and deadlines are
unchanged; Health's direct-close route still bypasses confirmation.

`homeSoftwareDialogTitles` validates the suspended application owner, not the
selected HOME tile. The bounded icon cache is keyed by dialog kind, owner and
pending title, and clears on asset replacement, no-dialog paint and disposal.
Missing header/icon or failed draw enters paired-screen recovery while
preserving the suspended owner. Actual `createScreens` tests cover recovery
and subsequent cancellation, in addition to helper-level assertions.

## Source Mapping

HOME title `0004003000009802`, v24576, EUR 10.7.0-32E, content index 0 / ID
`00000082`. CIA SHA-256
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

- Icon/header/separator/body panes -> `home.sequence` ->
  `packs/home/sequence.json`, SHA-256
  `c38ca7d80b27ffa88875c1d9090d11e7cad7e9f23f9398de69032dc807b9b1a0`.
  CIA-internal `RomFS/sequence_LZ.bin` SHA-256
  `a8a1d36fe833cc91d8bf284b5c81c5f8492dfb669ec470a1b2612a41afa97668`;
  member `blyt/LncDlgIcon_D_00.bclyt` SHA-256
  `3700755a002b7773bf8776fd4b17edcb11786e3d0aff540c552a99ceb174c020`.
  Authored `P_Icon_00` is 48x48 at `[0,93,0]`, `P_Line_00` at `[0,38,0]`,
  and `TextBoxDialog` at `[0,-56,0]`.
- Camera icon -> `titles.0004001000022400.icon` ->
  `icons/camera.png`, SHA-256
  `eef80be1e6961951cb776306165fd141016760327e1c96f865a68ccb88a92f01`.
  Camera v4097, content index 0 / ID `0000001a`, CIA-internal `ExeFS/icon`,
  source SHA-256
  `53534942eaf5b9c11d94e5f5118b4fe1a624e40d83765893185fd2f30a2956a1`.
- Body -> `home.messages/menu_msbt_LZ/lau_dlg_quit0`, unchanged English
  `RomFS/message/EU_English/menu_msbt_LZ.bin`, SHA-256
  `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.
  Dialog/buttons/masks/shared font retain the
  [existing provenance](home-switch-footer-2026-10-02.md#sources-and-evidence).
  Unavailable decompressed message-member and font-content fields remain
  explicit in that private provenance record.

Converter `ctr-native-web` 1.2.0, extractor CTRTool 1.3.0. No new extraction,
asset files, graphics reconstruction, audio or shared text-renderer change.

## Evidence Boundary

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-camera-close-dialog-20261003`.
Native reference is the preceding coordinator run's immutable own 400x480 PNG,
not a new native replay:
`native-folder-switch-20261002/screenshots/switch-sequence-20261003/_03.10.26_02.09.27.325.png`
under R's parent. SHA-256
`e5ca736d34544d7348437112dad7b4700add6a5df3128ea7de12987ef4200f5d`.
Native lower crops `(40,240,320,240)`; browser exports raw 400x240 upper and
320x240 lower. Whole LCDs are unmasked, with predeclared lower modal ROI
`[20,20,300,212)` and icon ROI `[136,28,184,76)`. No registration, colour fit,
phase search or proxy capture. Exact native/browser epochs and input cadence
are not matched. Native Camera used static-image input, not hardware capture.

## Measured Comparison

`R/home-camera-close-comparison-report.json` names the `close-dialog` pair.
Before runtime is `e231163d`; after is `10be5b69`. The coordinator opened
the side-by-side sheet, raw lower dialog and full desktop/mobile views.

| Pixels above delta 2 | Before desktop | After desktop/mobile/reduced |
| --- | --- | --- |
| Source icon, 2,304 pixels | 2,278 | 0, maximum delta 1 |
| Modal, 53,760 pixels | 9,584 | 5,168 |
| Full lower, 76,800 pixels | 13,418 | 9,002 |
| Full upper, 96,000 pixels | 95,208 | 95,208 |
| Whole pair, 172,800 pixels | 108,626 | 104,210 |

Corrected lower dialog SHA-256
`e947d00ffc00f2f3324c44c201acb16b824b597ea629ffbeb8d4b21b1693bfa5`
is identical across modes, repeated confirmation and Cancel-to-OK cross-drag.
Cancel returns to suspended Camera without retiring its owner. Desktop upper
is byte-identical before/after; reduced upper has different pixels but the
same above-threshold count. Remaining lower maximum delta is 213, not a pass.
Switch terminal lower remains SHA-256
`b039f23ae1c5cae3bc3692e7d2b10b023a4cc07c338e41621c5003c008ec87a8`,
with its prior 91 above-threshold pixels.

## Supporting Checks

Full integration: 1,888 pass, zero fail, 23 skip, one TODO. Production build
and post-build typecheck pass. Initial concurrent typecheck failed when build
removed generated `.next/types`; both the original log and successful
serialized rerun are preserved. No shader/material change. Independent
review: 123 focused passes, no findings; worker 193 passes and typecheck.

Production desktop/mobile/reduced record 19/19/18 switch pairs with no page
errors, mute retained and exact layout fixture restoration. The Camera flow
uses real projected touches and H, including Close, Cancel, repeat, cross-drag
and confirm. These checks establish implementation behavior, not matched native
input or timing. Native was not relaunched; no default profile, system audio,
Spotify, hardware microphone, private matrix or DeveloperStorage write.

`R/close-controls-verified` completes eight additional raw pairs: Work close,
Cancel, repeat and confirm; Work-to-About switch; reduced About close; and
Health direct folder Close through projected footer touch. No page errors;
final owner is retired. The Work dialog was visually inspected. Accessible
portfolio commands are behavioral checks, not native-matched input evidence.

Partial harness attempts remain preserved and excluded from completion:
legacy `close-regression` assumed Health returns to root, not its folder;
`close-controls` acted during boot; `close-controls-retry` incorrectly required
native readiness after owner retirement; `close-controls-final` used root-only
legacy X close inside the folder. `system.ts` still limits that shortcut to
root; the verified run uses the established folder Close touch. No runtime
change was made to accommodate these test assumptions.

Dedicated muted Chrome 93951 closes with exit 0 and verified PID absence.
Production preview `http://127.0.0.1:3021/`, session 68135, remains HTTP 200
at runtime `10be5b69`. No push, merge or deployment.

Final evidence identities, independently rehashed by the coordinator:

- `R/home-camera-close-comparison-report.json` SHA-256
  `849e97aeff348f4e2caed8be856d485000ad7c39f30b4081d17c51a80d58877a`.
- `R/home-camera-close-comparison-sheet.png` SHA-256
  `c41732d6498c1abfa15f3b64f6a4f39549e34267b2b801642e0136d7fce4480e`.
- `R/home-camera-close-comparison-manifest.json` SHA-256
  `cedf02887a03bbedb19d6f0c1680253d94225a37584d51eb7e80c7d11da03405`.

`python3 R/verify_camera_close_manifest.py` verifies all 147 recorded file
identities. Replace R with the absolute private root above. The final sheet
was reopened after freezing. No matrix pass or altered acceptance threshold.

## Remaining

The native warning uses smaller inline text. MSBT size controls are still
unsupported, so the warning is visibly too large. The native suspended Camera
footer also has Manual between Close and Resume; that separate captured defect
remains. Upper media/HUD/composition and native input/motion/audio remain open.
Only Camera's ordinary-close header has native comparison evidence. Other
stock-title headers and portfolio artwork are unverified adaptations; the
generic prompt predicate/callsite is untraced. Existing settled-pose, glyph
coverage, capture-slot, offline and portfolio adaptations remain. Whole
scenarios remain **fail**, and strict 1:1 is not established.
