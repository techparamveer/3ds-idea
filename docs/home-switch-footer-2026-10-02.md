# HOME Switch and Footer - 2 October 2026

Runtime commits: `0330d13c` source switch header, `e3503cc7` modal banner
clock, and `645ae96d` selected-title footer. Assigned coordinator branch only;
no shared merge, push, deployment or new worker. Strict 1:1 remains **fail**.

## Delivered

- Health-to-Camera uses source `sequence/LncDlgIcon_D_01`, its two 48px icons,
  separator/arrow and `menu_msbt_LZ/lau_dlg_quit8`, without the unsaved warning.
  Other pairs retain the existing warning as an unverified assembly adaptation.
- Switch retains the unmasked upper LCD. The shared presentation clock and
  pending Camera banner advance while HOME controls/cursor remain blocked.
  Owner-keyed icon readiness, failure and disposal stay paired across LCDs.
- `launcher/LncBtmBtn_02` uses dark `N_BtnB_L_03` / `G_BtnB_L_03` and source
  X Close for selected suspended software. Health without an owner uses centered
  Open. Camera selected while Health is retained uses Manual/Open, not Close/Open.
- Footer input consumes the same action projection. Camera Manual invokes its
  own title through the existing applet; absent Camera content-1 enters explicit
  missing-pack recovery. It does not close Health or substitute Settings content.
  Folder behavior and unselected-owner compatibility Back remain unchanged.

## Sources and Evidence

Private root: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/switch-header-native/`.
`summary.json` SHA-256 `27da57acda04ca9cc0f3aa7a96b5aac17a759716d75769a54bda53ff8b846fc0`
tracks initial/final switch work; `footer-summary.json` SHA-256
`5768f54099040a77e60235e2b8f20693d29fa3c33481473cfb72421fe33cfa99`
tracks final footer work. Both contain named captures, file hashes, reports,
empty masks, histories, source manifest mappings and check logs.

Source-identified/delivered: HOME sequence/dialog/masks/launcher/messages,
shared font and original Health/Camera SMDH icons. Summary `provenance` maps each
element's manifest key to title/version, content index, archive/member paths,
SHA-256 and converter. Existing unavailable MSBT-member/font-content fields
remain explicit; no extraction, new assets or invented native graphics.

Native PID66642 used the verified private executable SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`, original
EUR mode, Static input2/Null output1/volume0. Own PNGs in sibling
`native-close-clean-20261002/screenshots/`: 05:47:06.856 HOME;
05:49:11.81 Camera-selected/Health retained; 05:49:26.658 and 05:49:31.508 switch.
The latter two show 13,508 changed upper pixels and byte-identical lower LCDs,
establishing continued animation, not shared cadence. Retained Health references
05:32:00.16 and 05:32:21.538 are from the earlier same-day run, not fresh repeats.

Two held Open attempts and a tile hold were blocked until the hidden startup
warning was explicitly dismissed. The same 200ms Open then worked without a
config change. List all Azahar windows, not just on-screen windows, during
preflight. Quit/Yes ended with exit139, not clean exit; PID absence verified.
Temporary HOME/touch mapping was restored while stopped. Configs/log preserved.

Browser-inspected: nine switch and ten final footer raw pairs, seven browser
sheets; all corresponding native comparison sheets opened. Chrome67839/window4006
was verified at1810,397,1150,780 inside Sidecar1800,367,1357,935. All audio muted.
Cancel, cross-drag, selected footer Open, Health X close, portfolio switch/close
and Camera manual recovery were exercised; browser page errors empty.

Native-compared: switch dialog rectangle (20,20,280,200) improves from12,007
to109 pixels above2/255. Final footer strip (0,214,320,26) improves suspended
Health2803->75, closed Health917->54, Camera839->54. These are diagnostic
regions, not whole-LCD passes. Final empty-mask whole upper/lower differences:
Health suspended95278/48468; Health closed34421/46482; Camera85660/48579;
switch85506/12536. Input prefix, density2 vs1, population, HUD and phases differ.
Closed Health was captured during banner re-entry; first switch caught scale0.85,
later switch scale1. Do not relabel either as phase-matched.

Tested: full1683 pass/0 fail/23 skip/1 TODO; typecheck/build pass. Earlier full
footer run exposed two outdated route expectations; corrected and reran all.
No shader/material changes. Historical scenario matrix unchanged.

## Remaining

Suspended backdrop tint/warp, compact retained icon, lower suspended tile tint,
banner phase and footer hiding behind switch remain unexplained native gaps.
The modal footer strip still differs by6720 pixels. Header109 and footer54/75
pixel residuals are not masked away. Other-title policy, inline warning size,
closing/power timing, exact input and muted audio remain open. Settled source
poses, flat suspended backing/caption fits, portfolio single-button policy,
Settings fits/local persistence/previews and offline/portfolio differences
remain explicit adaptations. Next work follows the newest HOME fidelity request:
backdrop/compact retained presentation, modal footer and matched phase replay.
