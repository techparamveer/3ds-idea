# Native Software-Closing Dialog - 2 October 2026

Runtime checkpoint `cf38daf8ca150047c0cd77b32b583f7bc8510362` on
`codex/home-fidelity-20261001`. This delivers a visible lower-LCD correction,
not a whole-scenario pass or a strict 1:1 claim. H-10/H-12/L-04 remain partial.

## Delivery and Source

`9c109091` adds validated close display identity and failure recovery;
`3c06173e` integrates worker renderer `b32a06dc`; `794539b4` requests the
source layout and wires paired painting; `cf38daf8` removes the rejected
upper-mask binding and covers combined paint failure/recovery/sleep-wake.

The explicit close phase now shows the native buttonless `Dlg_A_D_00`, lower
`DlgMask_D_00` and exact `menu_msbt_LZ/lau_dlg_quit4` text. Switch and pre-close
confirmation remain separate. Missing selected resources fail explicitly;
Back/HOME cancels the failed visual close without losing the suspended owner.
Owner/generation guards, terminal publication and existing clock remain intact.

[Element-to-source mapping](workstream-handoffs/home-software-closing-dialog.md)
records manifest keys, CIA-internal members and SHA-256 identities: HOME title
`0004003000009802` v24576, content index0/ID00000082, converter
`ctr-native-web`1.2.0 / CTRTool1.3.0. Existing source textures/fonts/messages
are reused; no new firmware, sound, reconstructed graphic or pack is delivered.

## Native Observation

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-close-departure/`.
The isolated native executable SHA remains
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Coordinator alone operated native and browser on verified iPad Sidecar
desktop1920,367,1357x935. All audio stayed muted; host/Spotify/microphone
settings were untouched. The second isolated profile was preserved, not run.

Held Open touch500ms launched Health. With temporary HOME QtShift16777248,
a held Shift-modified drag500ms returned reliably to suspended HOME. Held
Close1000ms at temporary5% emulation speed exposed the missing dialog.
`native/sequence.json` tracks37 own-PNGs from07:59:06.179 through07:59:31.222.
Five sequence sheets were opened. Capture ordering is known; exact native
frames and normal-speed input/motion timing are not established.

The native lower closing window appears before the upper suspended panel
clears. The upper edge remains fixed as contrast falls. Consequently the
worker's scale-coupled SceneOut candidate remains unintegrated, as do premature
footer/highlight departure clips. The first integrated upper-mask assumption
darkened the upper LCD, contrary to capture; it was removed at `cf38daf8`.
Rejected captures/reports remain under `rejected-upper-mask/` and
`rejected-comparisons/` for audit.

Native returned to ordinary HOME after restoring100% speed, then exited.
PID85452 absence was verified. `config-before.ini` and `config-restored.ini`
record HOME B66/defaulttrue, touch mappingtrue/defaultfalse, frame limit100/
defaulttrue restored. Static input2, Null output1 and volume0 retain explicit
non-default mute values. Auto-normalized window geometry alone differs.

## Checks and Comparison

- Tested: full1747 pass,0fail,23skip,1TODO; typecheck and production build pass.
  No shader/material change; no shader check required for this slice.
- Reviewed: independent read-only Sol/high review found no actionable issue;
  its combined failure/recovery/sleep-wake painter regression was added.
- Browser-inspected: seven production routes,96 motion pairs plus two Health
  endpoint pairs. Health close, Work confirmed close, Work-to-About switch,
  reduced motion, mid-close lid pause/resume, constrained30fps and mobile all
  publish terminal frame20 through the actual WebGL renderer, stay muted and
  report no page errors. Seven motion sheets and desktop1150x693/mobile390x740
  screenshots were opened; canvas pixel variance is nonblank.
- Native-compared: named `comparisons/before-closing/` and
  `comparisons/final-closing/` reports retain all pixels with empty masks.
  Both whole pairs **fail**. Native5%-speed settled phase and browser terminal
  AppQuit20 do not match input cadence, epoch, population or HUD.

Reference own-PNG `_02.10.26_07.59.19.743.png` SHA-256
`b69fc2ffebdc16b78f08090c068ff532a04e61fb416b673e7c7bb0280aa10d09`
is compared with final `captures/health-close-12/{upper,lower}.png`.
Pixels differing by more than2/255: lower75731 ->6017; upper62329 ->62804.
Lower dialog interior x24,y24,272x192 improves51234 ->0. This is a local
source-composition correction, not matched-motion acceptance. Both comparison
sheets were inspected. Upper suspended panel remains visible too long.

`summary.json` SHA-256
`ebe57078e8f93ccaa64c594fb9a081b68a699f81b14e022b85de3e997bf954c0`
indexes all98 raw pairs, reports, source configuration records, browser
screenshots and check logs with hashes. Private scenario matrix unchanged.

## Remaining Work

Trace the fixed-bounds upper composition owner/start callback before wiring
departure motion. Native dialog parent fade is unresolved: `Dlg_A_D_00` has
no delivered animation and currently appears statically. Lower-mask FadeIn
uses the existing AppQuit clock as an explicit host adaptation, not a proved
native epoch. Exact close/switch/power timing, audio cues, HUD/population,
banner fits and other previously recorded HOME residuals remain open.
Portfolio content and reduced-motion behavior remain intentional adaptations.

Both user-owned chats used separate worktrees and GPT-5.6 Sol/high; no
service-tier claim. [Registry](feature-map/workstreams.md) records preserved
worker candidates and integrated delivery. Workers are idle; coordinator owns
integration and GUI. No push/deploy or whole-scenario acceptance is implied.
