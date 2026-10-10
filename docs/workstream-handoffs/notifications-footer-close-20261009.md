# Notifications Main-List Footer Close

## Scope

Worker branch `codex/notifications-close-presentation-20261009`, parent
`705119a5a6633a4b2ec7c37730703dd7ad46a291` (includes the reviewed Notes test
corrections). Only a HOME-origin Notifications main-list touchscreen footer
Close acquires this presentation. Physical B/HOME, subscreen Back, non-null
callers, opening and the other four applets retain their existing routes.
Notes retains its public factory, identity, diagnostic and tested choreography;
the existing receipt controller now accepts a separate identity detector.

## Evidence And Adaptation

Private evidence root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/`.
`toprow-four-observation/offline-audit/report.md` SHA-256
`37dfa1cdf99852aac94e3f09f00012699251a57fc0443e582e2d85a9c7564d8e` and
`notifications-close-keyframes-LOSSY-DIAGRAM.png` SHA-256
`00fdf55329bf777db6992a29df0154ac8f6d6f8d348858a003a1a95d2c31ba85`
show white footer feedback, the outgoing list/unread LCDs under HOME Menu cover,
opaque cover, then HOME recovery. The sheet is a lossy diagram, not a pixel pair.
The prior `toprow-exit-audit/source-audit.json` and bounded
`prior-source-candidates.json` identify resources but do not prove dispatch.

**Explicit adaptations:** select Notifications' own Decide frame 5 for footer
feedback and HOME-common forward SceneOut/SceneIn for the cover, with lower
selector frame 6. Retain the actual prepared outgoing pair; never use Notes'
title-owned assets or infer reverse opening. Feedback scheduling, one accepted
pose per fitted 60 Hz interval, separate opaque out20/in0 receipts and their
dwell are fitted, not native timing. The recording's long opaque interval is
not copied as an invented native delay. Reduced motion preserves separately
accepted feedback, opaque outgoing, incoming and HOME handoff stages.
Candidate `NewsTopBtn_D_00_SceneOut` / `NewsUnread_U_00_SceneOut` remain unused.

## Delivered Source Mapping

All resources were already delivered; no graphics were generated or extracted.
Converter baseline: `ctr-native-web1.2.0`, CTRTool `1.3.0`.

| Visible Element | Manifest Key / Pack | Decrypted Source And SHA-256 |
| --- | --- | --- |
| White Close footer | Notifications `packs/notifications/news.json`, `NewsTopBtn_D_00_Decide` | Title `000400300000a002` v4097, content 0 / `00000012`, `news_LZ.bin/anim/NewsTopBtn_D_00_Decide.bclan`; `b67cfe899a6d312277e0335d42577dbf73979bc0d4f328fe64ab82d11f72bd80` |
| Outgoing upper cover | HOME `packs/home/common.json`, `CmnFade_U_00_SceneOut` | `common_LZ.bin/anim/CmnFade_U_00_SceneOut.bclan`; `26090911fde2bd34c172040b9136264be9f6e5b3ed2d7e76a434ab3432371fc9` |
| Outgoing lower cover | Same, `CmnFade_D_00_SceneOut` | `common_LZ.bin/anim/CmnFade_D_00_SceneOut.bclan`; `7cabf3001ad29eef32862806e59e48e9ab31e74c06227a45214b05a7e6ed55c5` |
| Incoming upper cover | Same, `CmnFade_U_00_SceneIn` | `common_LZ.bin/anim/CmnFade_U_00_SceneIn.bclan`; `78435c2e74c129ccf1290dacc6c59dfdea80964f0a95933e570b59640ec1a996` |
| Incoming lower cover | Same, `CmnFade_D_00_SceneIn` | `common_LZ.bin/anim/CmnFade_D_00_SceneIn.bclan`; `696f40776f3908f1cf9fb2a342ab131dd2e941c3b8635ddb52e2119c155bc430` |
| Selected HOME picture | Same, `CmnFade_D_00_Aplt` | `common_LZ.bin/anim/CmnFade_D_00_Aplt.bclan`; `1a63a18209ece9d5bd7dbf86f2ead1f008cce5a665ff6cc408f014168a85a801` |
| HOME Menu label | HOME `packs/home/messages-and-loose.json`, `menu_msbt_LZ/lau_title_menu` | `RomFS/message/EU_English/menu_msbt_LZ.bin`; `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |

HOME pinned title is `0004003000009802` v24576. Its legacy common resource
members omit per-member content identity/version; those fields remain
unsupported at that granularity, not silently invented. Pack SHA-256:
news `9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375`;
common `eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`;
messages `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
The retained list, unread upper, HUD and footer text use their unchanged existing
Notifications mapping, verified by actual painter comparison in the new tests.

## Publication And Recovery

The reducer records only a pure footer request. The outgoing owner persists
until the accepted opaque endpoint of the current paired-LCD paint. Candidate
identity includes owner, runtime sequence/application and generation; outgoing
resources include both title renderer and firmware identities. Replacement
between paint and present rejects the old receipt. A fresh stable close can
restart without replaying opening against a discarded HOME source. HOME
recovery and handoff require fresh matching receipt-backed paints. Hidden,
sleeping, invalid/context-lost, stale or disposed publication cannot complete.
Unsupported/missing selected resources fail explicitly; retry and existing
B/HOME escape paths remain recoverable, including an incoming-cover failure.

Diagnostics append `screenPaint.notificationsClose` independently of Notes:
`{kind,frame,owner,adaptation:true}` where kind is feedback/out/in/handoff and
handoff frame is null. Terminal collection must require HOME state, paint phase
home, kind handoff and the **same** valid `screenPresented.paint` publication.
A subsequent stable ordinary HOME paint has no close diagnostic. HOME state
alone, out20 or an unpresented handoff is not completion evidence.

## Checks And Remaining Work

Focused check: `node --test tests/notifications-*.test.mjs tests/notes-*.test.mjs
tests/applet-*.test.mjs tests/social-completion-routes.test.mjs
tests/native-screen*.test.mjs tests/application-close-scene-policy.test.mjs
tests/boot-publication-scene-policy.test.mjs tests/camera-gallery-lifecycle.test.mjs
tests/eshop-welcome-lifecycle.test.mjs tests/home-entry-banner-scene-policy.test.mjs
tests/home-entry-motion-scene-policy.test.mjs tests/manual-entry-clock-scene-policy.test.mjs
tests/stock-screen-preparation.test.mjs`.

Logs: private `notifications-close-implementation/focused-tests-green.log` and
`typecheck-final.log`; typecheck is `tsc --noEmit --incremental false`.
Final focused result: 353 tests, 341 passed, 12 private-evidence skips, zero
failures. Nonincremental typecheck and `git diff --check` passed.
Tests cover first/repeat close, retained painter output, forward source poses,
missing/prepared/stalled pairs, resource replacement, generation/owner guards,
invalid/sleep/context/dispose, retry, B/HOME/subscreen/caller scope and Notes
regression. Exact prior sampling/guard assertions are extended, not removed.
Initial failed sweeps remain in the same directory for audit.

Source-identified, delivered, implemented and source-tested are separate from
browser-inspected and native-compared. This worker ran no GUI, server, build,
native app or audio. Coordinator integration, production build, matched raw
two-LCD capture/diff, motion/input checks and prior passing scenario recaptures
remain required. Strict 1:1 and whole-scenario acceptance remain unproven.
