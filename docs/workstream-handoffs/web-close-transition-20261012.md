# Browser and Miiverse Close candidate

12 October 2026. Worker base `c7a1922861f64f260ce50ce645ef7eca16e869fb`,
branch `codex/web-close-transition-20261012`. This is a fitted portfolio
transition candidate, not a native footer-dispatch or fidelity claim.

## Captured defect and route

The closed ordinary-input browser baseline jumps directly from Browser main
Close sequence 14 / receipt 1591 to HOME 15 / 1592, and from Miiverse main
Close 13 / 3358 to HOME 14 / 3359. Transition fields are null. The coordinator
inspected the raw boundary sheets in `web-close-20261012-v1/baseline-audit-astra-v1`
(report prefix `adf43d92`). Native update/error gate returns show a HOME cover
and reveal, but their inputs and bodies differ from these local main screens.
The native ordinary footer trigger remains untraced.

HOME-owned main Close now retains its applet at the existing close-effect
boundary for touch and semantic/keyboard/physical Back. Browser local Back,
Miiverse detail Back and caller-owned completion retain their previous routes.
Repeated input is quarantined; HOME suspension clears the request. Existing
unready escape, power and resource failure/retry paths remain available.

The existing paired-receipt controller runs each title's delivered six-frame
`DecidedOn` feedback, HOME common outgoing 0..20 over the retained title body
and HUD, then retires the owner only on accepted paired outgoing20. HOME reveal
0..20 and a separate accepted handoff gate the selected banner. Reduced motion
still publishes distinct feedback, outgoing, incoming and handoff receipts.
The independent web generation survives firmware replacement during accepted
HOME recovery; stale pairs/resources cannot complete it. Production
`screenPaint.webClose` carries the same-paint owner, stage, frame and
`adaptation: true`, without extra pixel reads.

## Existing Source Resources

No firmware bytes, manifests, converters, source layouts, geometry, sampling,
materials, fonts or audio were changed. The added requests select resources
already delivered by `ctr-native-web` 1.2.0 / CTRTool 1.3.0; later additive
selection metadata is 1.3.1. Original identities and converter details remain
in the closed private source audit.

| Visible element / manifest key | Pinned source | SHA-256 |
| --- | --- | --- |
| Browser feedback: `packs/browser/contents/0000-0000001f/layout-toolbar-ExitButton.json` / `ExitButton_DecidedOn` | Title `0004003000009d02`, v9232, content 0 / `0000001f`, `RomFS/layout/toolbar/ExitButton.arc/anim/ExitButton_DecidedOn.bclan` | `6367ce2d665a0a1e3c4022f2845adcfcda07183c3116e7376ed8cbeb4e2f1db1` |
| Miiverse feedback: `packs/miiverse/layout-toolbar-OliveBack.json` / `OliveBack_DecidedOn` | Title `000400300000be02`, v4096, content 0 / `00000006`, `RomFS/layout/toolbar/OliveBack.arc/anim/OliveBack_DecidedOn.bclan` | `5c5a076c7ef0f9ba9f7bc319c294936a2bca8f9be34034bf3c2a0faad1c521a6` |
| HOME paired cover: `packs/home/common.json` / `CmnFade_U_00_SceneOut`, `CmnFade_D_00_SceneOut`, existing `SceneIn`, `Aplt` selector 6 | HOME title `0004003000009802`, v24576, content 0 / `00000082`, `RomFS/common_LZ.bin` | `543fbf31b7ca5c44580075c0632f2d99d6e88843cd85f801fb9ada1da5ec2af8` |

Both feedback clips have authored range [40,45], six supported frames.
Miiverse's distinct `DecidedOnOff` is not selected. Its animation-only
`Toolbar_Btn_Exit_DecidedOn.bclim` is loaded under the original `web-back`
alias. HOME outgoing/incoming retain their original 21-frame tracks and the
existing `menu_msbt_LZ/lau_title_menu` message binding. Browser's existing
`spider/StartMenu_End` footer label is unchanged. Source metadata omissions
in the Miiverse pack are not filled with inferred values.

Private evidence root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/web-close-20261012-v1`.
The closed `source-audit/report.md` hashes to
`f12f341ee10d02148e1f749ccca7a641f869536e767cf0e34a58a8edb98491af`;
`identities.json` hashes to
`2961a01346dd524a40b653ef6c27a4222ae17e4910f173f45feecad1ba86bcde`.
Those records identify the original CIAs, decrypted content, archive members,
delivered packs and prior native own-PNG/movie evidence. Originals remain
immutable.

## Verification and Limits

Focused tests exercise actual input routes, paired compositor publication,
first/repeat Close, reduced motion, incoming/outgoing resource replacement,
stale owners, failed copies, hidden/suspended/disposed publication, recovery,
cache identity and banner gating. Real title loading, PNG/font decoding and
native renderer calls exercise both feedback clips and the actual shared
firmware cover drawing functions. These canvas transport tests are not pixel
acceptance or a browser-backend probe. Same-paint recorder tests cover cadence,
state-driven and capture-restoration receipts without extra pixel reads.

Final focused/full test, standard/nonincremental typecheck and postcommit build
results, source/build hashes and dependency/LFS checks are recorded under
`verification` after this commit. Initial failed runs remain preserved. The
known missing historical Camera `browser/lower.png` remains an explicit
full-suite failure; its assertion is unchanged. No shader/material edits need
a shader check. This worker ran no GUI or server.

Still fitted/unverified: ordinary Close-to-cover dispatch, six-frame feedback
clock, 60 Hz publication, cover hold/lifecycle handoff and shared HOME return.
Browser local content without its native update gate and Miiverse's local empty
sections without native account/network/error state remain adaptations.
Native ordinary-footer equivalence, full motion/input timing and muted audio
are not established. Review and coordinator production recapture are required.
