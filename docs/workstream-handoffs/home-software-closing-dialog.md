# HOME software-closing dialog handoff

Coordinator correction `cf38daf8`: production comparison rejected the worker's
upper-mask fit. Only `DlgMask_D_00` and `Dlg_A_D_00` are delivered. The upper
mask's white vertex colors do not describe its composited appearance: its
source material darkens the upper LCD, unlike the native closing sequence.
The source table retains that rejected candidate's identity for audit only.
`homeSoftwareClosingDialogKey` now validates owner/generation and separates
readiness/recovery; Back/HOME cancels a failed visual close, preserving the
suspended owner. Lower mask timing still uses the adapted AppQuit clock.

Base: `100f2a94d046efe7b2b7a8d9ee4540e2e4f6fb05`

Branch: `codex/home-footer-departure-20261002`

Feature IDs: H-10, L-04

## Captured native target

At temporary 5% emulator speed, a held Close contact produced the native
software-closing phase. Native own-PNG
`native-close-clean-20261002/screenshots/_02.10.26_07.57.33.617.png` under the
private internal-overflow root has SHA-256
`b43f35f50cd1534592f637117eeba4c374b82659725ea1ae7efb748ad683fd8b`.
It shows:

- an empty, pale upper HOME wallpaper after the suspended panel has cleared;
- a full lower-LCD translucent scrim while Close / Resume remains visible beneath it;
- the buttonless 280x200 striped HOME dialog with source shadow; and
- the centered text `Closing software...`.

Earlier own-PNG `_02.10.26_07.57.15.524.png` (SHA-256
`0cfa4811690db4021c133f2fd04674c099891676d748eaa2062ae76d3fb6a894`)
separately shows the closing text/window beginning while the upper suspended
panel and lower footer remain visible. The later `_07.57.33.617` sample must not be described as retaining
that upper panel. Together, the frames supersede the earlier proposal to start
the footer/highlight departure clips immediately with browser AppQuit. The
upper worker's independent source result preserves fixed panel bounds while
the full application capture/panel fades, ruling out a scale-based SceneOut
interpretation for that panel.

Later own-PNGs `_02.10.26_07.59.19.743.png` (SHA-256
`b69fc2ffebdc16b78f08090c068ff532a04e61fb416b673e7c7bb0280aa10d09`)
and `_02.10.26_07.59.31.222.png` (SHA-256
`40c7d890b09144b5d4cfef7eb3238167c2b748c316447ab922714b5902cc2259`)
show ordinary bright upper wallpaper rather than a dark cover. The worker
initially inferred a white mask from vertex colors, but the production draw
darkened it and increased upper residuals. That binding is removed. The lower
mask is retained; its source material produces the captured subdued backing.

## Delivered renderer helper

`home-software-closing-dialog.ts` draws only the observed settled assembly:

1. `DlgMask_D_00` at caller-selected `DlgMask_D_00_FadeIn` frame 0..20; and
2. buttonless `Dlg_A_D_00`, overriding only `TextBoxDialog` with the exact
   `menu_msbt_LZ/lau_dlg_quit4` message and its converted style metadata.

The helper defaults the mask frame to the captured settled endpoint 20. It
verifies an explicitly supplied frame is an integer in the authored 0..20
range, verifies every required source resource before its first draw, uses LCD
text sampling, treats a failed paired draw as an explicit failure and does not
mutate a pack. It deliberately accepts no `MenuState`. The coordinator owns
the already validated close predicate and the mapping from its existing clock
to the mask pose; this source helper does not infer a native epoch, delay,
completion rule or replacement controller.

The source layout contains the geometry visible in the capture: a 320x240
root, 312x232 shadow, two adjoining 140x200 window halves, and a 264x184 text
pane. Its two textures are the delivered `DlgWndw_00.bclim` and
`DlgWndwLine_8.bclim`; no CSS or hand-drawn substitute is introduced.
`Dlg_A_D_00` has no delivered animation, so the helper does not invent window
motion. Both mask FadeIn clips author `P_Bg_00` alpha from 0 at frame 0 to 130
at frame 20.

## Coordinator integration hunks

The shared runtime files remain coordinator-owned. After cherry-picking this
branch, add `Dlg_A_D_00` to the already loaded dialog layouts in
`firmware-presentation.ts`:

```ts
const requestedLayouts={
 // existing entries unchanged
 dialog:['Dlg_A_D_00','Dlg_A_D_02'],
 // existing entries unchanged
};
```

This loads the buttonless window's two source textures through the existing
bounded pack loader. No new pack, state or cache is required.

In `screens.ts`, import `drawHomeSoftwareClosingDialog`. After the ordinary
HOME pair and `graphics.overlay` are painted, and before generic system
overlays, select the close-only retained transition that the existing
controller has already validated:

```ts
const closingDialog=applicationTransition?.intent.kind==='close'
 && applicationTransition.phase!=='complete'
 && state.powered&&state.system?.phase==='home'
 && !state.system.sleeping&&!state.system.preferences&&!state.system.dialog
 && !state.panel;
if(closingDialog){
 if(!firmwareAssets)throw Error('Native software-closing resources unavailable');
 drawHomeSoftwareClosingDialog(
  firmwareAssets.renderer,t,b,applicationTransition.appQuitFrame,
 );
}
```

Keep the existing confirmation-dialog branch separate: confirmation exists
before `HomeApplicationTransition`; this closing presentation exists after the
accepted close begins. Do not route software switch through `lau_dlg_quit4`,
and do not start footer/highlight departure clips from this predicate.

The predicate and frame mapping above map the already validated browser close
lifetime to the observed native assembly. Reusing `appQuitFrame` for mask
FadeIn is a labelled host adaptation: the native appearance/removal ticks and
mask epoch remain unproven. If the coordinator's slowed native sequence
establishes a narrower boundary before integration, use that evidence rather
than adding a new timer or changing the transition controller.

Add a native-paint integration regression that checks draw ordering and both
LCD publications for close frames 0, an intermediate frame, terminal frame 20,
and the following retirement paint. Retain separate regressions that software
switch never draws this message and that the confirmation dialog still uses
`Dlg_A_D_02`.

## Native source and provenance

| Visible element | Manifest / pack key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| Buttonless striped window | `manifest.home.dialog` -> `dialog.json` -> `layouts.Dlg_A_D_00` | `romfs/dialog_LZ.bin/blyt/Dlg_A_D_00.bclyt` | `ccee73ad198e6dba3df6498108ceec64dfd38ab8994cea5422db60fdee72534b` |
| Upper mask | `manifest.home.dialogmask` -> `dialogmask.json` -> `layouts.DlgMask_U_00` | `romfs/dialogmask_LZ.bin/blyt/DlgMask_U_00.bclyt` | `e51db3f8fb8f5d4c8860607cd43aac0d36d8992daa55e4fd8a8b7d4e998236db` |
| Lower mask | `layouts.DlgMask_D_00` | `romfs/dialogmask_LZ.bin/blyt/DlgMask_D_00.bclyt` | `45ffaa6a0379423844784ffd3e450b5f3e2bf46e1724484a234b40ca73afbc86` |
| Paired mask FadeIn | `animations.DlgMask_U_00_FadeIn` / `DlgMask_D_00_FadeIn` | `romfs/dialogmask_LZ.bin/anim/DlgMask_{U,D}_00_FadeIn.bclan` | identical converted-member SHA `400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4` |
| Closing label | `manifest.home.messages` -> `messages-and-loose.json` -> `menu_msbt_LZ/lau_dlg_quit4`, style index 25 | `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |

Transitive identity: pinned EUR 10.7.0-32E HOME Menu title
`0004003000009802` v24576, content index 0 / ID `00000082`; selected decrypted
content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Archive/source hashes recorded in the packs are `dialog_LZ.bin`
`65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704`
and `dialogmask_LZ.bin`
`5add87203eb9a8adf05bc748a21fb47ee8bb8b55c6cf854e94c0007741e016d2`.
Delivered pack SHA-256 values are dialog
`8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`,
dialogmask
`675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`
and messages
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`;
converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

## Verification boundary and remaining gaps

Coordinator tests now verify the exact two-draw lower assembly, untouched
upper LCD, every valid authored lower mask pose, invalid-frame rejection,
source message/style, window geometry, textures, member hashes, pack
immutability and explicit source/draw failures. Focused transition tests,
typecheck and `git diff --check` remain required before handoff.

This worker only inspected the supplied local native PNG; it operated no GUI,
browser, Azahar, audio session or production build. No runtime integration or
scenario matrix change is included. Exact native dialog entry/exit frames,
upper-mask caller, opening/closing motion, later footer/highlight/panel
departure, input cadence, audio and matched browser/native acceptance remain
coordinator work. The 5% speed captures establish the visible sequence and
source fit, not strict 1:1 timing.
