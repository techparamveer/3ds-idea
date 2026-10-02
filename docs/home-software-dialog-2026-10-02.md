# HOME Software Dialog - 2 October 2026

Runtime `f17a10070c632619555c081b9138a2391fa204ab` replaces the authored
close/switch frame and missing button glyphs with existing firmware resources.
This is source-backed assembly, not a native dialog match or completed
L-06/L-07. Closing remains immediate after confirmation.

## Implementation

`home-software-dialog.ts` composes `DlgMask_U_00`, `DlgMask_D_00` and
`Dlg_A_D_02`, with original FadeIn20 and Select0/1 poses. English
`lau_dlg_quit0`/`lau_dlg_quit1`, `lau_dlg_2b_canc0` and
`lau_dlg_2b_decide` preserve message styles and RGBA spans. Shared-font A/B
glyphs replace unsupported authored characters. No native assets were generated.

Source Bounding_00/01 supply targets `(20,180,139,40)` and `(161,180,139,40)`.
The existing same-button down/up contract is retained. Only the owned pressed
button receives Select1; crossing to another button removes its highlight
without activation. Physical and keyboard actions still use the same reducer.

Dialog readiness has a kind/application-owner/pending-title key, including
when another HOME title is selected. Source or draw failure enters paired-LCD
recovery, never an authored native substitute. Recovery cancels the dialog
and preserves the application. Reducers and source pack lifetime are unchanged.

## Sources

HOME title0004003000009802 v24576, content index0/id00000082;
converter `ctr-native-web1.2.0` / CTRTool1.3.0. The private summary records
every delivered texture's source and hash. Existing legacy gaps remain explicit.

| Element | Manifest mapping | Decrypted source SHA-256 |
| --- | --- | --- |
| Frame, buttons, poses | `home.dialog` -> `packs/home/dialog.json` -> RomFS `dialog_LZ.bin` | `65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704` |
| Upper/lower masks | `home.dialogmask` -> `packs/home/dialogmask.json` -> RomFS `dialogmask_LZ.bin` | `5add87203eb9a8adf05bc748a21fb47ee8bb8b55c6cf854e94c0007741e016d2` |
| Body/button messages/styles | `home.messages` -> `packs/home/messages-and-loose.json`, `menu_msbt_LZ` labels above | Recorded RomFS `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`; internal MSBT member hash absent |
| Native glyphs | `fonts.shared` -> `fonts/shared/font.json`; title0004009b00014002 v0, `cbf_std.bcfnt.lz` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`; legacy content index/id absent |

Dialog pack SHA `8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`;
mask pack `675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`.

## Evidence

- Tested: 19 focused; full1668 pass/0 fail/23 skip/1 TODO; typecheck and
  production build pass. No shader/material change. Source geometry/messages,
  pressed ownership, failure and recovery covered.
- Browser-inspected: eleven raw400x240/320x240 pairs, four inspected sheets
  and console screenshot on verified Sidecar, muted launch/appstate, no page
  errors. Work close/cancel, inert gutter/footer/cross-drag, switch to About,
  About close, Health running/suspended and idle HOME. Projected mouse holds
  are200ms; launch uses DOM accessibility buttons. Entire dialog crop returns
  byte-identically to idle after cross-drag; Cancel-down changes its button crop.
- Native-observed: verified isolated executable SHA `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`,
  private cwd/user tree, no user symlinks, Static2/Null1/volume0, original/EUR.
  File -> Boot Home Menu -> EUR reached visible60 FPS HOME. Own400x480 PNG
  `_02.10.26_05.22.40.574.png`, SHA `85f1d274d8f6735d406803f8959a7076ce30e10ad3971ff9bd4471600520fa77`.
  Foreground Open200ms and selected Health icon350ms held touches left HOME
  unchanged. No successful app/suspend/confirmation route was captured.
- Native-compared: fresh HOME PNG versus browser Health-selected HOME,
  inspected empty-mask sheets: **53,673 upper / 47,561 lower** pixels above2.
  Population, density, input prefix, HUD and animation phase differ. This HOME
  diagnostic does not establish the new dialog's fidelity. Matrix unchanged.

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/software-dialog-native/`.
`summary.json` SHA `59d23b2844881a3562e233c0330829e9ca405dd94e2ab20437eb58c910b6a14f`
tracks11 pairs/metadata, history, source resources, checks, native config/log,
button crop checks, report/mask and sheets. Empty mask SHA
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.

## Residuals

Native caller/variant, default focus and opening/closing motion are not
established. Generic assembly and settled poses are adaptations. MSBT group1
inline size is unsupported: the unsaved-data note uses body metrics, not its
native85-percent run. A renderer diagnostic records this gap. The source
warning does not imply a new portfolio editing/save feature. Health still
gets confirmation despite the earlier native direct-close observation;
per-title policy and closing presentation remain the next work.

Flat suspended backing, missing compact window/tint, footer glyph gaps, power
timing, Settings fits/local persistence and portfolio/offline adaptations
remain. Audio stayed muted; input, motion, audio and all whole-scenario
acceptance remain open. Next: close/switch behavior/presentation, then power-on
and HOME controls in the user's order.

Native Quit/Yes disposed the renderer but left PID33443 alive. Exact-owned
SIGTERM ended session68244 exit143; PID absence verified. Browser closed via
CDP and launcher exited0; test/build/verification sessions ended. Updated
detached preview38564 serves `http://127.0.0.1:3021/`, HTTP200. No push, deploy,
shared merge, sibling checkout edits, new helpers or DeveloperStorage artifacts.
