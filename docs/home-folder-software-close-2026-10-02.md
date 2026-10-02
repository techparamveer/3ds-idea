# Suspended Folder Software Close

Later [native39-frame recapture and icon-exit correction](home-close-icon-exit-2026-10-02.md)
supersedes the failed-exit-capture limitation below. The `a40d597e` action fix
is preserved; `7d0b4a9f` separately clears the sleep overlay during dialog exit.

Runtime `a40d597e`, 2 October 2026. This corrects a captured action and native
resource-selection defect, not whole-scenario 1:1 fidelity.

## Visible Defect and Delivery

With suspended Health selected inside a folder, production `7727fa35` displayed
a white Close/Resume footer. Touching the left action returned to root HOME
without retiring Health. Fresh isolated Azahar showed a black X Close action;
the same touch closed Health and returned to ordinary folder HOME with Open.

`getHomeFooter` now resolves the selected suspended app to `close-software`
before the generic occupied-folder `close-folder` case. The existing shared
input dispatcher then invokes application close, and the existing native
presenter selects the black footer resource and software-quit message.
No renderer, animation, asset, geometry, colour or sound was invented or edited.
Health keeps its previously captured direct-close policy. Other applications
retain confirmation; an unrelated suspended title with another selected child
keeps its existing, still unverified folder route. Empty children, idle Open,
top Back, Resume, gesture cancellation and cross-button release stay distinct.

## Native Source Identity

Pinned EUR HOME title `0004003000009802`, version 24576, content index 0 /
content ID `00000082`; CIA SHA-256
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
Converter `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

| Element | Manifest key / decrypted CIA-internal member | SHA-256 |
| --- | --- | --- |
| Black Close pane `N_BtnB_L_03`, white Resume `N_BtnW_R_02` | `home.launcher/layouts.LncBtmBtn_02`, `RomFS/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Footer archive | `home.launcher`, `RomFS/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Software Close / Resume / Open text | `home.messages/menu_msbt_LZ/{lau_3b_quit,lau_2b_restart,lau_2b_folder_open}`, `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Settled footer pose | `animations.LncBtmBtn_02_SceneIn`, `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| Held button feedback | `animations.LncBtmBtn_02_Select`, `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_Select.bclan` | `b039ae54719725321c32b904f142d684d3980122e11a164191b2740d86542b20` |

Font/style provenance remains in the [Open-footer source table](home-open-folder-footer-2026-10-02.md#source-and-delivery-binding).
Closing dialog/mask resources and unchanged adapted host timing remain in the
[closing-exit source record](home-closing-fade-2026-10-02.md).

## Captures and Limits

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-close-exit-recapture-20261002/`.
Native sibling `native-close-exit-20261002/screenshots/` contains the genuine
normal-speed own 400x480 PNGs:

| State | Own PNG | SHA-256 |
| --- | --- | --- |
| Folder Health idle | `_02.10.26_22.41.34.867.png` | `5d6697b0438f077e02c4910bbd8cf41de01985abb82d905c8c5a1ed0271b7e7d` |
| Folder Health suspended | `_02.10.26_22.42.07.478.png` | `1df634ceffeedde1b59da5fdd7a5f91dab24627cfa60ccf01ece56e1edb37d02` |

The coordinator alone operated the whole Mac as newly authorized. The isolated
copy uses Static input 2, Null output 1 and volume 0. The normal run launched
Health from folder 13/child 2, returned through HOME and clicked Close; the
visible final folder had Open restored. That final endpoint was not saved as
an own PNG. No native exit intermediate was obtained: 120 screenshot requests
in the first slow attempt and 25 in the normal recovery attempt yielded no
new exit files. Dispatch success is not capture evidence. Each run saved two
endpoint PNGs only. Nested native menu tracking prevented clean termination;
both exact isolated PIDs were terminated, then temporary HOME/touch mappings
and speed were restored. Final config SHA-256
`133fe298b3b644a2097b74a38fc9ec699c35267f56a77f2c6441b16281de8206`.
No default profile, system audio, Spotify, microphone or original ROM changed.

Baseline `R/browser-desktop` fails the close assertion because it runs folder
Back. Its saved idle/suspended LCDs are valid diagnostic inputs. The first
after run `R/after-desktop` successfully exercises close but was passed an
incorrect commit label; it is excluded from final evidence. The correctly
labelled rerun is `R/after-desktop-v2` at `a40d597e`.

Production desktop/mobile/reduced runs each capture four endpoint pairs and
26/25/39 close-phase pairs respectively,
including AppQuit terminal, exit terminal and retirement. The same folder and
child remain selected, no page errors occur, mute remains true, and the fixture
is restored through actual pointer input with byte-identical saved layout maps.
These observed browser paints do not establish native epoch, exact cadence,
LCD departure order or audio timing. No synthetic state injection is used.

Baseline empty-mask, unshifted comparison: idle 15,524 upper / 6,648 lower
pixels above delta 2; suspended 11,157 upper / 14,215 lower. Suspended footer
2,895/max187, of which 2,854 are in the left action. The dark native action is
explained by the delivered black software-Close resource, not evidence for
a guessed pressed palette. Selection pulse, cursor, HUD and wallpaper epochs
remain unmatched. Both complete pairs fail.

Baseline report `R/comparison/endpoint-report.json` SHA-256
`e5e7323440d293d2c9b5681a9a06d437bb8a426e7793da19bbdbffbe87b13b03`;
manifest `b6e5312b63b97a26d22e47a62e506685abca2dc7bbc0fe9c5a1f4ca816ffab0f`;
sheet `7673ab779cc961ceca9dc2635ae5fbe1f1a620a272f305ec88e3e46f3efd2192`.
The coordinator opened the sheet; all 11 manifest entries were verified by
the comparison worker.

Final `R/comparison-after/after-endpoint-report.json` SHA-256
`a55f1d268f6bb5f3f929689e0209bcc21be6b57a1eeb7c621b18f98b460eec58`;
manifest `849f122102a9916bc7afc8c6ee3e7681be0d29c381d0512b1aadd731e8f45a32`;
before/native/after sheet
`f345e68f6cf93e795133c00e83a0d6e372a05d3c8cea261b214253c10e851483`.
The coordinator opened the final sheet and independently verified all 99
manifest records. Suspended lower improves 14,215 -> 11,405 pixels above
delta 2; footer 2,895 -> 73, left Close region 2,854/max187 -> 32/max5.
Resume remains 41; the neutral footer remains 54. Selected suspended child
still differs at all 3,136 ROI pixels, maximum 34 (before 30), with pulse
epochs unmatched. Do not infer an action-fix tint regression from those poses.
Whole states remain fail, with no masks, shifts or palette fits.

## Verification and Remaining Work

Full tests: 1,853 pass, 0 fail, 23 skip, 1 TODO (1,877 total).
Typecheck and production build pass. Independent read-only review checked the
semantic route and lifecycle guards. No shader/material change. Logs are
`R/tests-final.log`, `R/typecheck.log`, `R/build.log`.

Whole scenarios remain fail. Still non-native or unproved: portfolio content,
existing fitted anchors/visibility/hover/drop deadlines and coverage policies,
host close timing and retirement policy, native input/motion/audio, pixel
sampling/backing residuals and unrelated suspended-folder selections. No private
scenario matrix update or reduction in acceptance criteria. Continue captured
close/switch motion, then power-on and remaining button interactions; do not
repeat a guessed fade or redesign the already corrected footer.
