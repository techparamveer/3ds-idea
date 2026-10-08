# Compact pause appearance

Runtime `9a72454`, caller `1308786`, fixture imports `c658382`.
AN-04 remains fail. This correction uses existing decoded source poses on the
existing paired-presentation clock. Native activation and phase coupling remain
browser adaptations, not recovered native timing.

## Defect and contract

During a retained HOME pause, selecting another grid tile changes the suspended
window from expanded to compact. The former painter required `expanded` before
binding the G_Wndw appearance clip, so the compact window jumped to its settled
alpha255 even while the pause receipt still described an intermediate pose.
The live painter regression demonstrates frame1/alpha7 after the correction.

`homeSuspendedWindowEntryFrame` is a pure query. The exact retained application,
ready capture owner/generation and pause identity must match. It returns the
existing elapsed update clamped to10 for either window scale mode. Dialogs,
close transitions, hidden/ineligible owners and foreign resources do not select
appearance. Malformed matched generations or frames fail explicitly. It does
not advance a clock or acknowledge a receipt. Existing retry, stall, reduced
endpoint, disposal and paired-LCD guards remain unchanged.

Native bindings keep their order: SceneIn40, global Appear10, G_Wndw Appear0..10,
ScaleUpDown15/0, Sleep and WhiteBlack. The source alpha sequence is
0,7,27,55,90,128,165,200,228,248,255. HUD and lower producers are unaffected.

## Source identity

HOME `0004003000009802`, v24576, content index0/00000082, original EUR10.7.0-32E.
Decrypted content SHA256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Code SHA256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Converter `ctr-native-web1.2.0`; no new extraction, assets or ARM execution.

| Element | Manifest key and internal path | SHA256 |
| --- | --- | --- |
| Suspended window geometry | `home.launcher/layouts.LncBase_U_00`, `romfs/launcher_LZ.bin/blyt/LncBase_U_00.bclyt` | `b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` |
| Window appearance | `home.launcher/animations.LncBase_U_00_Appear`, `romfs/launcher_LZ.bin/anim/LncBase_U_00_Appear.bclan` | `2984f92736035fec7a9475b6840fc2ba27763a8dd5081cd883ab32651d6fb427` |
| Containing archive | `home.launcher`, `romfs/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |

Both mode1 scale branches converge on the +0x290 appearance reset at
0x1ed300..0x1ed31c and request visibility at0x1ed4e0/0x1ed4e8. Expanded
initialization also sets the +0x30d latch. The later start at0x1eda94..0x1edabc
still depends on that latch at0x1eda4c/0x1eda5c/0x1eda64. The static source
fixture proves reset convergence and unconditional visibility request, not a
universal start or shared source epoch.

## Verification boundary

Independent review cleared the helper and caller contract. Worker focused35/35;
combined focused328/328, typecheck/build pass. The clean production build is
`5386572`, equivalent to coordinator runtimec658382. Full-suite pending
Friends/Notifications and historical Camera failures remain explicit.

The reviewed `--pause-compact` capture workflow selects away through ordinary
ArrowRight after HOME and restores the original selection before repeat Resume.
It requires ready, failure-free same-paint paired receipts, rejects held-HOME
combination, and records whether compact entry0..9 was actually sampled.
Terminal-only output is not evidence for the corrected fade. No forced paint,
guessed clock, pixel-nearest selection or automatic retry is permitted.

Caption assembly, scale-mode endpoints, SceneIn/Sleep epochs, close opacity,
portfolio contents and reduced motion remain adaptations or unresolved native
differences. Exact native input, motion cadence/duration, pixels and muted audio
are unaccepted. Current captures and restart belong in STATUS and the
[animation workflow](animation-fidelity-workflow-2026-10-07.md).
