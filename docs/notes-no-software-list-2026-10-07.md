# Notes no-software list

The 7 October native endpoint is an empty Notes list with "There is no
suspended software." The browser instead drew the welcome tutorial after its
boot cover cleared. This correction uses the existing `ImageScreenUp` layout,
not a new or reconstructed no-game screen.

## Source and selection

Pinned EUR 10.7.0-32E Notes title `0004003000009c02`, version 4096,
content index 0 / ID `00000007`. CIA SHA-256:
`56612d00563671a255056ba50cf25bf36c1bf3164f9721cc9abb0051444ac07c`.
NCCH SHA-256:
`329911cd7402f01aaff57bca71f6f5b67c57b4cae885c695cc93cd8f3b542292`.
Verified ExeFS code SHA-256:
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.

Scene 3 initializer `0x167ca4` tests suspended-software predicate `0x1603a8`.
With no software it hides seven capture/shadow panes and `W_TextPanel`, and
exposes the `T_TextList` child. `T_TextWrite` stays hidden. The independent
`P_Mask` initializer at `0x167b10..0x167b3c` selects its pane-bound SceneOut
frame 20. Applying the entire SceneOut group would also hide the list message,
so this correction samples only the original mask track.

The browser selects this branch only for its owner-bound `boot-cover` paint
and `suspendedCapture.status === 'none'`. The existing portfolio owner guard
creates that paint only when `runtime.application` is absent. Metadata or
capture failure with an application is not interpreted as no software.
The retained nonzero-history startup choice remains an adaptation; tutorial
history and suspended-software availability are independent native inputs.

| Element | Manifest / pack key | CIA-internal source | SHA-256 |
| --- | --- | --- | --- |
| Original list text geometry | `resources["packs/game-notes/memo-ImageScreenUp-arc-l.json"]`, `layouts.ImageScreenUp/T_TextList` | `RomFS/memo/ImageScreenUp.arc.l/blyt/ImageScreenUp.bclyt` | `b042e28a08e66c3fc545688ac79e835503819e82ac08261c20cf082efb9b74f3` |
| Pane-bound mask alpha | Same pack, `animations.ImageScreenUp_SceneOut`, `P_Mask` track | `RomFS/memo/ImageScreenUp.arc.l/anim/ImageScreenUp_SceneOut.bclan` | `e7316d8069d79db6357cac004ae04d075031553fc645673fe5f496983106dd39` |
| No-software list message | `resources["packs/game-notes/messages-and-loose.json"]`, `message/9900NoBreakGameMesList` | `RomFS/lang/EU_English/message.msbt` | `e42a7a19bfa8a55abbff70357c8cbd02a0d8f1073d97b9801fcfe1a607b61955` |

The image pack's delivered SHA is
`23ca3b80e5af842bef9fce38f3b30204ef1d44a0380f7190c108f8495309ee55`;
its source archive SHA is
`8001ff24296fc5c1a627c238c1bf8e4682102cb66882411cae32362e2c442d7a`.
The messages pack's delivered SHA is
`54d9a567e7f511c34801b24549c7c5c8734c28117f1c02525642ffceb3df824e`.
Manifest conversion is `ctr-native-web` 1.2.0, CTRTool 1.3.0; the additive
title selection records converter 1.3.2. This pass publishes no assets.
The read-only audit re-extracted the verified NCCH with CTRTool 1.2.0 and
matched the original member hashes. Scratch is outside the repository at
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notes-no-software-audit/`.

## Evidence and gaps

Native endpoint `_07.10.26_14.24.06.171.png`, SHA-256
`71dcd9a6655def46fd639781d79f8cdd4f7315eec12073565f3e4799402904bf`,
is a Notes endpoint from the failed folder-selection run, not folder evidence.
The previous runtime `8a3238c` visibly retained the tutorial. Its complete
Notes cover diagnostic is an unmasked static 0/0 pixel-tier match, not motion
acceptance. The no-software correction still needs production recapture.

Native scene 8 uses Notes' own `HudMenuAplt_00`, currently unpublished.
Archive SHA `30877490883c7bec16087efe4d02de7986fe355bfe490b24518da21289a10961`,
layout SHA `e1d77863cf0a5f0892649fc4dd94e416295625e3abe78b7fa285e333ed3c4dd8`,
English `hud.msbt` SHA
`3f9f2ae497bcf9c79de2584c1d4dc99a8727211834ab6728086761217aa44451`,
`lang/Hud.bcfnt` SHA
`172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8`.
Do not substitute or hand-draw that HUD. Outgoing HOME/loading cover and exact
clock/input timing remain open. Audio is muted and unverified. AN-01 is fail.
