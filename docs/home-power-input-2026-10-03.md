# Power Input - 3 October 2026

Runtime `b0814dd438414d5e68c2fc603d051269910b6b60`, source worker
`6a18125043326f84646629dc520839a8e83259f9`. This corrects a captured input
defect and missing held feedback; whole scenarios remain fail.

## Implemented

Previously an outside-origin drag released over Power Off shut down, unlike
Azahar, and owned held feedback remained white. Power now requires the
accepted pointer's down and up inside the source target. Outside release,
outside-origin release, unmatched up and wrong pointers are inert. Leaving
an owned target clears feedback; re-entry restores it. That continuous
re-entry behavior was initially test-only; the subsequent
[continuous native replay](home-power-reentry-2026-10-03.md) confirms its
held-state and release behavior without changing this implementation.

The presenter selects delivered `Slp_D_00_Select` pose 0, then pose 1 only
while the owned contact is inside, scoped to `G_Btn_01`. Missing Select fails
before either LCD draws. Shutdown retains opening, Decide, SceneOut order.
One-shot touch, keyboard, boot, launch, audio and all existing assets remain
unchanged. No reconstructed graphic or new parallel input state was added.

## Source Identity

Held Power Off -> `manifest.home.sleep` -> `packs/home/sleep.json`, SHA-256
`bfe9219930b99d475b0ceb0895c086e5854442a1e91fae2f5120feab313f59ef`.
HOME title `0004003000009802`, version 24576, content index 0 / ID `00000082`.
CIA SHA `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content SHA
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
CIA-internal `RomFS/sleep_LZ.bin` SHA
`9af919d002228a156d98be1001c10504a343d7da235f387b46dce643fc6d6a71`.
Archive member `anim/Slp_D_00_Select.bclan` SHA
`9e7d123bac1723ee407f1df776e2d7290dc62e9fc298a70a9f7bf6555202f28b`:
two non-looping poses 0..1, no unsupported fields. Delivered converter
`ctr-native-web` 1.2.0 / CTRTool 1.3.0. The [source chain](home-shutdown-fade-2026-10-03.md#source-mapping)
records shared layout/texture identities and transitive public provenance,
private content ID and stale converter-script-hash limitations; this is not a
fresh converter audit.

## Native Evidence

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-input-20261003/`.
Azahar's isolated `native-folder-switch-20261002` copy uses executable SHA
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Native baseline and two 1200 ms continuous cross-boundary strokes at 100%
speed produce byte-identical own 400x480 PNGs: inside-to-outside and
outside-to-inside releases both stay in Power. Their SHA is
`a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e`.

At 5%, a held-inside capture plus 17 post-release own PNGs retain the gray
button, Decide and paired fade through a black final PNG. Held index 0 is
`_03.10.26_00.56.35.478.png`, SHA
`c87de9954bd8d55815f04838099bad9b96384338d4103ecc94ba423de406a7f7`;
black index 17 is `_03.10.26_00.56.59.536.png`. The coordinator opened the
native contact sheet and black capture. Release is bracketed between indices
0 and 1 because the drag process completed before later screenshot requests;
filename timestamps are not a native duration or exact release epoch.

## Supporting Checks

Full suite: 1874 passed, 0 failed, 23 skipped, 1 TODO (1898 total).
Typecheck and production build pass. Independent read-only review passes
93 focused tests with no actionable findings. Shader/material code unchanged.
Browser baseline is `browser-before-complete`; the earlier `browser-before`
run reproduces the bug but has a capture-harness frame-cap failure and is not
the completed baseline. Production captures exercise actual projected LCD
mouse paths, cancel, off and restart. Mobile means a 390x844 browser viewport,
not native touch-device testing. Health-origin entry uses an accessibility
handler and is not matched native entry.

Desktop/mobile/app each retain 26 shutdown/off raw LCD pairs; reduced retains
2. Every corrected mode finishes muted and ready, with empty page errors and
passing ownership/cancel/off/restart assertions. Coordinator opened the held
LCD, mobile viewport and native/before/after comparison sheet. Agent-browser
finds the console and expected controls, with no framework error overlay.

## Native Comparison

Unmasked upper400x240/lower320x240 pairs use delta2 tolerance, no registration,
color adjustment or fitted mask. Lower button ROI `[65,166,255,203)` is a
diagnostic, not an exclusion from whole-pair metrics. Baseline held differs
in 6708/7030 ROI pixels, max196; corrected held differs in zero, max1.
Corrected whole held pair is zero pixels above2, max2. The five desktop
targets are settled Power, inside-to-outside release, outside-to-inside
release, owned held and black shutdown. All corrected targets have maximum2
or less. Baseline fails outside-origin release and held feedback.

Native black index17 versus desktop `frame-024` is byte-exact on both LCDs.
Its presented metadata refers to shutdown at1197.7ms, not the later authored
charcoal physical-off fill. These are endpoint pixels, not a shared native
clock or native-duration match. A separate observer of presentation changes
records reduced shutdown publication even without a second same-pose paint;
this does not add a cross-stall publication guarantee.

Mobile and reduced settled/release/held targets also meet delta2. App-origin
settled and release comparisons use the preserved app-origin native control,
not HOME's absent Software closed label. They meet delta2; app-held feedback
meets tolerance only in the button ROI because no app-origin held native whole
frame was captured. The wrong-origin whole comparison retains1562 differing
lower pixels and is explicitly diagnostic, not a renderer regression.
Desktop/mobile/app final sampled shutdown pairs are byte-black; mobile's
1162.9ms sample is source59, not proof that source60 was presented.

The coordinator opened the final sheet and independently rehashed190 records
across the comparison and native inventory manifests. Final artifacts under
the private root above:

| Artifact | SHA-256 |
| --- | --- |
| `power-input-comparison-report.json` | `88772a91fe5b3616b6518c17bfad28eb4cdbe8bd65d685590aeaad7008f012f4` |
| `power-input-comparison-manifest.json` | `cdb35dbabe2e0f85389ae2ee11a7ba2bf588cecd5de5fef77f5019fe9dc9811c` |
| `power-input-comparison-sheet.png` | `1ba44922d455ec373aef2519bba420a9b2c723ff5d8e91247a576ed80b3f9951` |
| `generate_power_input_comparison.py` | `dd0e797dc36890f2b3b1bb495b69df41b4d34dd9e19b8ec6b9894b37ed938c32` |
| `native-power-input-inventory.json` | `7f2c0c00c33a87f43086018bbb35b74d477f54475d98b52050ef8ebb5ab6cc81` |
| `native-power-input-manifest.json` | `f7ba356d8542e8258b83d3035641c8d0dd7f099ec4f643f28278ad90ba9f5274` |

## Limits

Whole native scenarios still fail. The later [re-entry comparison](home-power-reentry-2026-10-03.md)
and [publication correction](home-shutdown-publication-2026-10-03.md) supersede
those two checkpoint gaps. Exact input and motion epochs, physical backlight order,
restart timing and audio under mute remain unverified. Host 1200/120 ms timing,
reduced-motion policy, authored charcoal physical-off fill and portfolio
content remain adaptations. A native black screenshot is not proof of the
physical backlight sequence. The private scenario matrix is unchanged.

Native PID 73256 exited normally; exact original config was restored to SHA
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Static input 2, Null output 1 and volume 0 were explicit. System audio and
Spotify were untouched. Native process warnings are not a warning-free claim.
Dedicated Chrome PID79351 closed through CDP `Browser.close`, its process
session exited0 and the owned browser/native process search is empty. Chrome
stderr retains deprecated service-endpoint warnings, separate from page
errors. Production preview remains HTTP200 at `http://127.0.0.1:3021/`.
