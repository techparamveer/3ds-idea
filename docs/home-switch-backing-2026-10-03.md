# Retained Backing During Switch

Runtime `e231163d`, worker `79603dd9`, 3 October 2026. Feature L-07/H-12.
The [preceding closing-dialog comparison](home-switch-closing-2026-10-03.md)
exposed a separate upper composition defect: confirmed switch applied the
ordinary-close AppQuit material, replacing the dark suspended Health backing
with pale HOME wallpaper while native retained the backing.

## Implementation

`homeApplicationTransitionPresentation` now returns the close material stack
only for ordinary Close. For switch it returns null, which the existing
`suspendedBackgroundPlayback` maps to decoded SceneIn20/AppPause20. The
controller and its terminal20 barrier remain active, as do compositor capture
owner/generation validation, paired readiness/recovery, quarantine and exactly
one owner retirement. Null visual presentation does not cancel the transition.

Only the selector and focused tests changed. Ordinary Close still receives
AppQuit0..20; reduced ordinary Close selects its endpoint. No scene/shader,
asset, audio, duration, lower dialog, footer or compact-icon change. Existing
cache keys distinguish settled and fading backing; sleep/recovery/retirement
continue through the existing resource owner.

## Sources And Limits

Backing -> `models.homeBackground` -> `models/home-background/model.json`:
HOME `0004003000009802` v24576, EUR10.7.0-32E, content index0 / ID`00000082`,
CIA-internal `romfs/3D/BannerBG_LZ.bin`. Curved geometry, colour treatment,
capture mask and SceneIn/AppPause/AppQuit curves are unchanged decoded assets.

- CIA SHA256 `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
- Decrypted content `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
- Compressed BannerBG `27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`.
- Decoded CGFX `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
- Delivered model `45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`.
- Converter `ctr-cgfx-web` 1.1.0.

Mask `BG_CapMask_00`, dynamic `BG_DmyApp_00` capture binding, rotated/padded
LCD transfer and sampler adaptation retain the [source mapping and limits](home-suspended-background-2026-10-02.md).
This intent predicate is a **capture-supported host adaptation**, not a newly
traced firmware caller or native timing proof. Prior lower-entry donor,
font coverage, source caption fits, portfolio population/content, local/offline
policy and capture-slot adaptations remain. No substituted native graphics.

## Verification

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-switch-backing-20261003`.
Fresh browser baseline uses runtime65d75466; after uses e231163d. Replays use
the same projected touch/H harness as the preceding slice, including Cancel,
repeat, confirm, Camera arrival, ordinary Camera close and exact fixture
restoration. Native reference is the immutable own400x480 PNG from the previous
coordinator run, not a new native replay:
`native-folder-switch-20261002/screenshots/switch-sequence-20261003/_03.10.26_02.05.12.123.png`
under R's parent, SHA256
`0517a0e219dbda8d4ab5a38a7770bdb3f51de625f9076c7c93c6ce71e8866a31`.
Exact input/cadence/epochs remain unmatched as documented by the prior route.

Full integration: 1,884 pass, zero fail, 23 skip, one TODO; typecheck, build
and shader validation pass. Independent review:177 focused tests, no findings.
Worker179 focused tests are supporting evidence, not native acceptance.
Native audio remains muted/unverified. No native process or original/default
profile is touched in this slice; no private matrix or DeveloperStorage writes.

Production desktop/mobile/reduced record19/19/18 switch pairs, no page errors,
mute retained and exact fixture restoration. Ordinary Health Close records46
pairs, including exit-terminal, footerExit0/6, footerReturn0/8, one owner and
retirement before Open return. These controls pass implementation checks;
they do not prove native motion. Full desktop/mobile views and raw LCDs were
inspected. Native is not relaunched. Dedicated Chrome82899 exits0 with verified
PID absence; preview3021/session22335 remains HTTP200 at runtimee231163d.

## Measured Comparison

`R/home-switch-backing-comparison-report.json` names terminal20 before/after
and confirmation controls. Native upper400x240, lower crop`(40,240,320,240)`;
no masks, registration, shift, colour fit or phase search. Terminal20 does not
claim a matched native epoch. The desktop pair is `before-desktop/switch-16`
against `after-desktop/switch-16`; matching ordinal numbers are coincidental.

| Pixels above delta2 | Before desktop | After desktop | After mobile | After reduced |
| --- | --- | --- | --- | --- |
| Upper LCD | 83,889 | 16,700 | 15,768 | 19,146 |
| Whole two-LCD pair | 83,980 | 16,791 | 15,859 | 19,237 |
| Lower LCD | 91 | 91 | 91 | 91 |
| Supporting backing strip | 5,376 | 5 | 2 | 64 |

Backing strip`[40,24,376,40)` was selected retrospectively from inspected
artwork bounds to exclude icon/HUD/banner. It is supporting diagnostic evidence,
not acceptance. Maximum delta improves236 ->3 desktop/mobile and10 reduced.
Whole upper MAE improves117.535049 ->12.563451 on desktop. Remaining central
banner, HUD and composition differences still fail, with exact epochs open.

Fixed compact-icon ROI`[8,28,40,60)` retains native differences. Desktop
count above2 increases162 ->857 as the corrected backing changes many low
amplitude pixels, while maximum195 ->11 and MAE9.002930 ->1.960938 improve.
Do not claim that region passes or hide its increased threshold count.
Lower modal ROI`[20,20,300,212)` remains19/max78. Every lower terminal PNG
is byte-identical before/after and across modes, SHA256
`b039f23ae1c5cae3bc3692e7d2b10b023a4cc07c338e41621c5003c008ec87a8`.
Confirmation lower control is byte-identical before/after; its upper direct
comparison has3 pixels above2/max3, not a new native acceptance claim.

Coordinator inspected the sheet and independently verified208 records:

- Report `0e16d6a47fb8d1f292caecca093518653633524df0f1725ebff675bb789aa0a3`.
- Sheet `6b215ff6009e81f21bbe2d5653187bd99b8da2c1355adb556ec221f47692f036`.
- Manifest `573e687f1f44e7b0788347c3920b8fcb3b0103df1b16e23f73bf3a9659f4545a`.
- Generator `dd91ec4bcae7df4d4d6a430f151d2205b78002a9b6c6c6c452058ef6bf3db3f2`.

Run `python3 R/verify_switch_backing_manifest.py` with absolute R above.
Whole scenarios remain fail; input/motion/audio and remaining pixels are open.
Next captured defect: Camera ordinary-close confirmation icon/header.
