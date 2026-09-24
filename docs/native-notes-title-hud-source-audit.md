# Game Notes title panel, HUD and switch sounds

This is a bounded source audit at integration `85137b9`, not a visual fix.
The hidden title panel needs suspended-title metadata and independent animation
state; the published sound pack does not contain the two switch cues. No
placeholder title, generic icon or substitute sound has been enabled.

## Evidence

The EUR Game Notes executable, title `0004003000009c02`, version 4096,
uses the same `code.bin` SHA-256 as the [display-switch audit](native-notes-switch-source-audit.md):
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`,
base `0x100000`. This pass reads the existing static ARM listing and the
converted `memo-ImageScreenUp-arc-l.json`. It does not execute firmware.

Reproducible pointer-table, animation/group and archive-name probes are in
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-title-source/`:
`probe.py` and `source-audit.json`. The probe checks the executable hash and
uses the pinned local DualRip CSAR reader only to inspect archive metadata.
The underlying listing is the sibling
`cursor-notes-switch/disassembly/code-text-0x100000-0x1aa000.txt`.

## Event-number correction

The scene-3 event jump table starts at `0x166fa0`. HUD events are **8 and 9**,
not 7 and 8 as the earlier audit stated:

| Event | Handler | Bounded observation |
| --- | --- | --- |
| 5 | `0x1671c8` | Starts `PanelGameIn` or `PanelNoGameIn`, depending on suspended software. |
| 7 | `0x167224` | Starts `PanelGameOut` or `PanelNoGameOut`. |
| 8 | `0x1672ec` | With suspended software, starts animator `+0x388`, slot from `+0x430` (3/4/5 = HUD Double/Up/Down), with final argument 1. |
| 9 | `0x167368` | Same HUD slot selection, with final argument 0. |

The no-software event-8/event-9 branches use controllers `+0x3ec`/`+0x3cc`
instead. They cannot be replaced by always applying a HUD clip.
`0x13c960–0x13c968` dispatches event 9 to scene 3 after the earlier scene-2
selection event. This proves one upstream dispatch; it does not yet establish
all HUD-opening/closing inputs or the full manager scheduling order.

## Title-panel composition and timing

- `0x1678d0–0x167954` registers controller `scene+0x310` against
  **G_Panel_01**. Pointer table `0x1aa98c` supplies slot 0
  `ImageScreenUp_TextPanelInOut` and slot 1 `ImageScreenUp_TextPanelStay`.
  The group contains `W_TextPanel`, `P_ObjIcnUp00` and `P_ObjIcnDown00`.
- The source clips have 21 and 121 frames respectively. They share a large
  resource track list with the screen clips, but this controller is group-bound;
  applying every raw track globally would incorrectly alter the captured LCDs.
- `0x167d34–0x167d78` binds **T_TextTitle** from the applet context at `+0x2c`.
  The following text-layout branch measures the rendered bounds, compares the
  height with 36, and has an additional overflow path. Copying the placeholder
  percent characters from the layout is not a native title.
- `0x167f4c–0x167fd0` binds **P_Icon_00** to a dynamic **64 × 64** image from
  context `+0x12c`. This is separate from the two framebuffer captures.
- `0x167424–0x167514` updates the top/bottom indicator visibility when a display
  mode changes and restarts the independent text-panel controller. In Double
  both indicators are visible; in Up or Down only the matching one is visible.
- `0x168698–0x168774` processes a separate byte state `+0x3c2`: it waits for
  slot 0, starts slot 1, waits for slot 1, sets a float controller value to 30,
  restarts slot 0 with different arguments, then resets that value to 0 and
  state to −1. This establishes an independent timed lifecycle. The float's
  complete animator semantics and exact browser scheduling are not proven here.

The current `SuspendedCapture` contract carries owner, generation and LCD pixels,
but no title or icon. The current Notes state tracks only the screen-switch
clip. Enabling `W_TextPanel` today would expose unbound native placeholders;
using `AppView.heading` would incorrectly use the current screen heading in
place of the suspended software's source metadata. The title/icon binding,
text overflow behavior and independent controller must be implemented together
before this pane is a safe live selection.

## Switch sound identities and delivery gap

`0x1632bc` loads `0x01000011` and `0x1632cc` subtracts ten, establishing
`r8 = 0x01000007` on the switch branch. The switch handler makes two ordered
calls to `0x156f94` before advancing the display mode:

| Call | Sound ID | CSAR name | Source representation |
| --- | --- | --- | --- |
| `0x163768` | `0x0100000a` | `SE_CTR_CHERRY_CHANGE_SCREEN` | Sequence, file 1, bank 1, volume 127, player `0x04000001` |
| `0x163780` | `0x01000007` | `SE_CTR_COMMON_TOGGLE` | Wave, file 4, volume 64, player `0x04000002` |

Archive: `romfs/sound/cherry.bcsar`, SHA-256
`545434bf549fc1ab7328123d29a6fccce52510a8ecf6a0485bed474a4dc756a7`.
The ordered calls do not mean the browser should wait for the first sound to
finish before starting the second; they use different native players.

The published `audio/audio.json` identifies HOME's `menu.bcsar` and contains
neither cue. `audio.ts`'s `Sound` keys cover HOME sounds only.
`runtime-effects.ts` currently forwards app sound names to global `onSound`
without an owner/revision check. A Notes sound implementation therefore needs
narrowly converted/provenanced cues plus a foreground-owner lifetime contract;
renaming a HOME cue or adding two unguarded effects would not reproduce this
source behavior. No audio backend reconstruction is part of this audit.

## Verification and remaining work

The hash-gated probe successfully resolves the event and clip tables, the
published pack's group/clip records and the two archive entries. Relative links
and `git diff --check` pass. This documentation-only change needs no application
rebuild and adds no new source-render or browser evidence. The coordinator's
existing switch-motion evidence remains applicable to that earlier feature.

Next bounded implementation: extend the in-memory suspended capture with stable
software title/icon metadata, trace the controller argument semantics, and
render the group-bound title-panel lifecycle with real metadata. HUD input routes
and owner-scoped sound delivery remain separate open work. Strict 1:1 remains
unproven; these findings are not a native screen/audio comparison.

The [switch audio delivery follow-up](native-notes-switch-audio-delivery.md)
resolves the CSEQ/CWSD sample dependencies and produces repeatable private
candidate PCM. It also confirms that the validated HOME exporter rejects this
archive and does not cover Toggle's wave-sound path. Delivery and owner-scoped
playback remain unimplemented; diagnostic WAVs are not native-accepted cues.

The [metadata/controller follow-up](native-notes-title-controller-followup.md)
now supplies the original English SMDH long descriptions and resolves animator
frame/direction semantics and the HUD's `G_Panel_00` binding. Source-specific
icon expansion, text measurement and live scene scheduling still prevent
showing the complete title/HUD panel faithfully.
