# HOME Open Footer Return - 3 October 2026

## Captured Defect

The fresh native sequence recorded with the [compact footer correction](home-compact-footer-2026-10-02.md)
shows a blank footer at index39, faint Open at40, visible Open and the first
captured returning Health banner at41, then settled footer at42. Upper banner
pixels continue changing through45. Previous runtime `be54ea30` jumped from
blank to fully visible Open and retained the old banner activation.

Worker `c414b12f` integrates as `03500c6c`; coordinator presentation, banner
boundary and regression tests are `65b758af`. No new assets or audio are added.
Publication follow-up `0172842b` fixes a defect found by the reduced-motion
browser replay: retirement resource effects flushed the HOME clock again
before return0 was painted. Mandatory-paint effect drains now use the
originating commit timestamp, restored in `finally`; later callbacks use live
time. The deterministic regression reproduces the old0->1 skip, checks the
fixed0 paint boundary and proves later unpinned effect updates resume.

## State and Presentation

Close retains its exact suspended owner through ChangeDw6. A later eligible
HOME update retires that owner once and enters `footer-returning` at
`footerReturnFrame:0`. ChangeUp advances to8, publishes `return-terminal`, then
clears the controller on a later update. Input remains quarantined through
return; Switch is unchanged. The guarded return selector requires close intent,
unchanged generation, absent old instance and empty runtime/app/HOME-return
ownership. It cannot resume or close a replacement instance.

The painter clears the old closing capture and uses SceneIn15 followed by
direct-member ChangeUp, without the old Close Decide override. Unsupported
selected resources still fail explicitly. Recovery after owner retirement
returns to HOME without resurrecting the app. Sleep and readiness gates remain.

The existing banner host clears the old primary at valid close start and
requests the current selection at return0. Cancellation recovery additionally
requires actual raw transition removal, unchanged generation and empty/same
runtime ownership. Folder-close clearing takes precedence. No new banner pose
or second animation clock is introduced. Requesting at return0 does not imply
the resource is active or visible in that same paint.

## Source Identity

Open return maps to `home.launcher/animations.LncBtmBtn_02_ChangeUp`, from
`RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_ChangeUp.bclan`. HOME title
`0004003000009802` v24576, content index0 / ID `00000082` has decrypted SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Launcher archive SHA-256:
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
ChangeUp SHA-256:
`e968b1154f7f883d189f112673659119d620aa731a0b368835b007047d8f446b`.
Delivered launcher pack SHA-256:
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converters: ctr-native-web1.2.0 / CTRTool1.3.0.

Source range102..110 supplies nine samples0..8, non-looping `G_Scene_00`:
`N_Scene_00` Y-4->0 and alpha0->255. Written alpha bytes are
0,11,40,81,128,174,215,244,255. SceneIn SHA-256 is
`9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e`.
Direct-member binding avoids unrelated descendant static alpha resets but
still includes source direct shadow tracks. Native caller, binding order,
start epoch and one-update-per-frame schedule remain untraced adaptations.

The unchanged Health resources are `healthBannerCommon` / `healthBannerEur`,
Health title `0004001000022300` v3077, `exefs/banner.bin` SHA-256
`bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755`.
Full content/model/texture provenance remains in the
[existing banner audit](stock-home-banner-asset-audit.md) and its linked binding
evidence. The new host reacquisition boundary is a capture fit, not proof of
native banner timing or scale.

## Verification

Private root R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-return-20261002`.
Final full tests:1867pass/0fail/23skip/1TODO (1891 total). Typecheck and production
build pass. Independent review:132 initial and49 publication-focused tests
pass, no remaining actionable findings.
No shader/material implementation changes were made.

Production desktop/mobile actual-input replays at `65b758af` capture30/32 close
pairs plus four endpoints each, including footer0/6 and return0/8. Each keeps
one transition identity, retires the app before return, returns to the same
folder, restores the saved fixture and reports no page errors. Mute stays true.
The coordinator opened desktop/mobile views and raw return LCDs. Two initial
reduced runs failed the return0 assertion; their captures remain under
`R/reduced` and `R/reduced-recheck`. They are failed verification, not passes.

Final production `0172842b` replays under `R/final-desktop`, `R/final-mobile`
and `R/final-reduced` capture38/38/47 pairs plus four endpoints each. All
required0/6 departure and0/8 return assertions pass, along with retired app
ownership, one transition identity, saved-layout restoration, mute true and
zero page errors. Final desktop retains12 post-completion paints; banner first
becomes active at `close-28`, after return8, at visibility counter3 / scale0.9.
The following saved paint reaches scale1. These are observed poses, not a
matched native clock. Coordinator inspected the final mobile viewport.

The native inputs are the previous turn's immutable fresh46 own400x480 PNGs,
not a new native run. Those captures used the same folder13, Health child2,
launch/HOME/Close route at5% speed /3FPS; they establish structural ordering,
not real-time cadence. Initial desktop return0..8 has a pending banner host; the last
saved post-completion paint first shows an active Health banner at visibility
counter3 and scale approximately0.9. Native41 already shows returning banner
content while its footer is still changing. Native/browser epochs and growth
remain unmatched. Whole scenarios remain fail.

Final named pairs, full matrix, provenance and masks are in
`R/open-return-final-comparison-report.json`, with sibling manifest and sheet.
The coordinator opened the sheet and independently verified all130 manifest
records. Native lower crop is `(40,240,320,240)`; whole LCDs are unmasked, with
no registration, color fit or constructed proxy. Diagnostic half-open regions
are footer `[0,212,320,240]`, Open label `[110,212,210,240]`, upper banner
`[40,80,360,180]`, and modal body `[20,20,300,212]`. These regions describe
separate defects; they are not acceptance masks or native epoch alignments.

| Native / final structural pair | Footer pixels above delta2 | Open label pixels above delta2 |
| --- | --- | --- |
| 39 / return0, `close-21` | 1727, max5 | 400, max3 |
| 40 / return3, `close-22` | 742, max6 | 187, max5 |
| 41 / return7, `close-24` | 8325, max105 | 2585, max105 |
| 42..45 / return8, `close-25` | 54, max5 | 0, max2 |

The old `be54ea30` instant Open endpoint differs from native40 by8636 footer
pixels (MAE36.798), versus742 (MAE0.861644) for the captured final return3.
This nearest-structural comparison shows the missing fade has been added;
native41 remains a large intermediate mismatch. No uncaptured normal-motion
source frame is inferred. Final desktop samples0/3/4/7/8; reduced motion saves
every logical return frame0..8 while presenting the configured endpoint.
Initial-to-final departure0/6 and return0/8 footer regions are byte-exact.
Other lower content and upper wallpaper/HUD phases differ and stay unmasked.

Final report SHA-256:
`8220a7b4ef8360f5f238a60de92aadda12822bfcc98eb6c61b7d189e99c68186`.
Manifest: `e7358d1c7f61346216264414dca19557acdefeab652478a18b674c0036be3724`.
Sheet: `4861b397ed4278fe4b5ff0cf34813f852241693e70490ebd9021b364a42b74cb`.
The initial `open-return-production-comparison-*` evidence is retained
separately, including both failed reduced runs; final evidence does not erase it.

Still non-native: return binding/epoch and banner reacquisition boundary;
prior entry donor/clock, compact departure binding/clock, upper opacity/icon
policies, folder anchors/visibility/hover/drop/glyph coverage and portfolio
adaptations. Exact input, motion and audio remain open. No private matrix or
original firmware/default-profile/system-audio changes. Dedicated Chrome95030
exits0 through Browser.close and is absent; `R/cleanup.json` records cleanup.
Browser process stderr includes navigation zero-attachment framebuffer/service
warnings, distinct from the zero page-error result. No Azahar process was
launched this slice. Production preview3021 remains HTTP200.
