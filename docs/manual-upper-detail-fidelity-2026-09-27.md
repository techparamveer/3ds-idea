# Settings Manual upper detail fidelity — 27 September 2026

This pass covers the settled upper LCD of the Settings electronic Manual
Contents capture `_26.09.26_23.19.14.606.png` (SHA-256
`2efb7fa73192641b7448735f407cfaeebf7b79445ee1b92bf256f39c1566799b`).
It uses an empty mask. No capture pixels are delivered as an application asset.

## Source trace

The Manual applet executable is the decrypted EUR 10.7.0-32E
`0004003000009b02` `ExeFS/code.bin` (SHA-256
`cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8`).
Its `SoftTitleHeader` constructor is at `0x162624`. The application-icon path
called at `0x16270c` reaches `0x162314`. The large-icon branch at
`0x1624cc–0x1624fc` passes the icon buffer, width 64 and height 64 to the source
texture constructor; the alternative branch at `0x16237c–0x1623b0` uses buffer
offset `+0x2000` and 32×32. The captured Settings frame matches the large-icon
branch. `P_Icon_00` is looked up at `0x162528–0x162534` and receives that texture.

The delivered `SoftTitleHeader` pack comes from
`romfs/layout/SoftTitleHeader.arc` (archive SHA-256
`e803010a940ece0c49d18c2742f039d4cbdba4299ebcb45a3481f1440795601f`).
Its 32×32 `P_Icon_00` pane samples the 64×64 icon at UV 0..0.75 and the source
32×32 `IconMask.bclim` at UV 0.25..1.75 with mirror wrapping. Both source maps
specify linear minification and magnification. The runtime now supplies the
published Settings SMDH large icon to that native material instead of hiding
the pane and drawing an unmasked browser image. The input is
`icons/settings.png` (SHA-256
`a81dd127191d7613aa9452c90409349070431d1112e114b68c75ef2a6467ffc0`),
decoded from Settings content 0 `ExeFS/icon` (SHA-256
`40a78f71c6560dcdae1e69d6186702379f128df97d95ac34bc080eb5558615f1`).
The 48×48 pixels occupy the sampled part of a 64×64 RGB565 texture; unread
padding stays transparent.

The header uses the renderer's existing source-size LCD glyph path. The title
therefore retains the decoded `TextBoxTxt_00` pane, source font, 15×18 metrics,
RGB 50 ink and the Settings SMDH long description while avoiding a second
Canvas resample. The source `ScrollIndicator` layout and `ScrollIndicator_Wait`
frame 5 are unchanged. Its draw centre is y32, which places its 28 visible
source pixels at native y26..53; the earlier y40 mount was eight pixels low.

## Offline comparison

The prior integrated production/native pair had 1,518 upper pixels over 2/255:
606 in the icon area, 808 in the header title and 104 in the scrollbar area.
The source render after this pass has **467** upper pixels over 2/255, RGB MAE
**0.11025/255**, maximum channel delta **77**. Header and scrollbar regions each
have **zero** pixels over threshold; all 467 remaining pixels are inside
`(4,4)..(35,35)`, the icon slot. The unobscured background remains exact at the
same threshold. Report:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/manual-upper-detail-source-20260927/report.json`.

This is an offline source render, not a fresh production-browser recapture.
The icon residual remains an explicit GPU sampling/combiner gap. The lower LCD
and whole-scenario input, transition, motion and audio acceptance are outside
this pass.
