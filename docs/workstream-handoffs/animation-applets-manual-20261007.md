# Notes boot cover, 7 October 2026

Worker A uses `codex/animation-applets-manual-20261007` in the assigned
`/Users/paramveer/.codex/worktrees/3ds-animation-applets-manual-20261007/3ds-idea`
checkout, based on `81f09bfa88c11a2065a22ce5e532846229616c0a`.
The coordinator's uncommitted STATUS reconciliation is not part of this delivery.

## Captured defect and bounded change

AN-01, HOME to Game Notes with no suspended software, skips both native boot
covers. `syncNotesIntro` requires ready suspended-application metadata before
its existing title composer can initialize. The no-software path instead draws
the settled tutorial and list immediately.

The new `notes-boot-cover.ts` session owns only the original scene-9 lower and
scene-10 upper covers for that no-software path. It takes the existing Notes
host accumulator, applet-instance owner and native resource readiness. Resource
or sleep pauses discard elapsed inactive time. Owner replacement resets the
cover; temporary pauses retain it; disposal rejects later samples. SceneIn
starts before its first advance, draws through frame 20, then clears the draw
flags on update 21. Repeated samples do not step time. Reduced motion selects
the terminal source pose with the covers removed.

The coordinator granted these exact wiring reservations:

- `portfolio-screens.ts`: no-software Notes entry selection and cover disposal.
- `stock-native-personal-tools.ts`: draw the precomposed upper/lower covers
  after their existing Notes backgrounds and interiors.
- `stock-screen-presentation.ts`: the `boot-cover` paint variant and its
  existing paired-screen cache key.

The metadata-ready `posed` and `pending` title paths retain their existing
selection. The change adds no assets, sounds, independent reducer state or
renderer-owned clock. The delivered title session still controls readiness and
failure before the paired LCD draw.

## Source identity

The source is EUR 10.7.0-32E Game Notes `0004003000009c02`, version 4096,
content index 0, content ID `00000007`, CIA product `CTR-N-HGMP`.
CIA SHA-256 is
`56612d00563671a255056ba50cf25bf36c1bf3164f9721cc9abb0051444ac07c`.
NCCH SHA-256 is
`329911cd7402f01aaff57bca71f6f5b67c57b4cae885c695cc93cd8f3b542292`.
The unchanged public manifest reports `ctr-native-web` 1.2.0 and CTRTool 1.3.0.

| Visible element | Manifest key and internal source | SHA-256 |
| --- | --- | --- |
| Upper source cover `ApltBoot_U_00`, `P_Bg_U_00` | `resources["packs/game-notes/memo-ApltBoot_U_00-arc-l.json"]`; `romfs/memo/ApltBoot_U_00.arc.l` | Archive `b5ce29b07a28ae27bd813c860bae25a5825a06d26aafdc727ee31c4129469e18`; delivery `d9b2d8b88c2b1c907e22fac31d5079710012bda0a68c2ad7f6bcc36797ba0bc3` |
| Upper SceneIn, group `Group_00`, 21 frames | The upper pack's `resourceSources.animations.ApltBoot_U_00_SceneIn`; `romfs/memo/ApltBoot_U_00.arc.l/anim/ApltBoot_U_00_SceneIn.bclan` | `d5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805` |
| Lower source cover `ApltBoot_D_00`, background, belt and applet label | `resources["packs/game-notes/memo-ApltBoot_D_00-arc-l.json"]`; `romfs/memo/ApltBoot_D_00.arc.l` | Archive `284c4d476528edbf732599f2066a8af8f573854042b469f1e112d3e19459d4e6`; delivery `e8721549694aec66c51afe72e27fd0f08b408d1f7c10e7ba10134454f370a167` |
| Lower SceneIn, group `G_Scene_00`, 21 frames | The lower pack's `resourceSources.animations.ApltBoot_D_00_SceneIn`; `romfs/memo/ApltBoot_D_00.arc.l/anim/ApltBoot_D_00_SceneIn.bclan` | `f6fb9ecc5f19a6865edc4a49c5d6fe35ce2436ec4d3f901367abb8f2e7c3ef44` |

Cover layout SHA-256 values are
`727986552371a72c62a0a24f11e2ef778d90156b210b9d009f9e1c301aa9620b`
for `ApltBoot_U_00.bclyt` and
`34c893004933dd8f78c64bb08dcdb90beca6642ff9c43e673f82522579c8fa7b`
for `ApltBoot_D_00.bclyt`. Each pack retains its original texture mappings,
including `BgLgt`, `BgLine`, `ApltBelt`, `ApltBeltLine`, `ApltBeltMask` and
`ApltPictMemo`. The lower title uses the existing dump message
`notes-messages/message/lau_title_memo`; the source SceneIn hides `P_Home_00`.
No native graphic is drawn by hand or reconstructed in CSS.

The existing [intro source trace](../native-notes-intro-publication.md) and
[ordered initialization trace](../native-notes-ordered-startup-audit.md)
establish the original caller order. Code SHA-256 is
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
Initialization `0x162f84..0x163010` sends event 0 to scenes 9/10 independently
of scene-3 metadata. Scene 10 starts at `0x166088`, tests completion at
`0x1660c0`, advances at `0x166134` and applies at `0x166140`. The already
recorded scene-9 controller has the same start/advance/completion order.
Private source ranges remain under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-intro-publication/`.
This run read those records and wrote no artifacts there.

## Evidence and verification

The coordinator captured the current browser on production `81f09bf`, runtime
base `5ee6fd7`, using touch `(70,16)` then Enter without a suspended owner.
The muted chronological baseline has 70 raw LCD pairs and no page errors:

`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/baseline/notes/capture.json`

Capture-record SHA-256 is
`27abeb175667d375db0c3ed53c5772db70766563fc10fe0ee99a26178f63aa06`.
Frame 004 at 245.6 ms has no cover, upper SHA-256
`a78a5ba27349d1f726e29148f225ff1b8fc50c6d3dd34e3911d6aaa8af2cf8a1`
and lower SHA-256
`2ea6c8ec63de1a85035e22af2ee21be72da514317e8777d85b6569267e7876a8`.
The worker inspected that upper image. It is the settled tutorial.

The coordinator's own native PNGs in
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/native-notes-slow/screenshots/`
show the original cover independently of suspended software. The worker
inspected `_07.10.26_12.33.36.734.png`, SHA-256
`ab4014e9538f68efefdc87d0e604810b56e8261fcb456c7262cad0af371be2f1`.
The next `_07.10.26_12.33.37.229.png`, SHA-256
`23e372296b020939c5dcaa30854c13d6f5ba849a6c1ed19f7b60605ecd32ce78`,
shows clearing. The 25% speed capture has a large compilation/capture gap,
so it supports ordering and layering only.

Focused command:

```sh
node --test --test-skip-pattern='source-render specimens' tests/notes-boot-cover.test.mjs tests/notes-lower-intro.test.mjs tests/notes-intro-session.test.mjs tests/notes-intro-publication.test.mjs tests/notes-intro-clock.test.mjs
```

The pre-existing specimen test writes to the full DeveloperStorage artifact
directory and was excluded. Its attempted write failed with EPERM in the
initial run; no new artifact was delivered there. All 27 selected tests passed.
Nonincremental typecheck, relative-link validation and `git diff --check` also
passed. The coordinator owns the full suite/build and actual recapture.
Dependencies are a read-only symlink to the existing project installation.

## Remaining failures

AN-01 remains fail. There is no new matched native/browser pair, mask or diff
report for this change yet. Source identification, implementation and focused
tests are separate from native acceptance.

- The native cover appears over outgoing HOME and during applet loading.
  This bounded correction starts once Notes packs are ready. Shared transition
  orchestration still owes that earlier stage and its input epoch.
- The no-software native upper interior says "There is no suspended software."
  The existing browser tutorial is a mismatch, not an intentional adaptation
  and not a justified mask.
- The lower list and tutorial SceneIn remain settled by their existing painters.
  Their independent source ordering, input quarantine and complete opening
  sequence remain open.
- The first ready frame-0 publication and nominal 60 Hz host cadence are
  scheduling adaptations. Real-time cadence and complete paired motion are
  unverified. Audio stays muted and unverified.
- Friends and Notifications bind settled SceneIn frames; Manual binds settled
  footer SceneIn frames. Browser's latest native route is update-gated, and
  Miiverse local content is an adaptation. These paths were inspected but
  have no implementation change in this Notes delivery.

After integration, recapture no-software Notes from both touch and physical A,
close/reopen it, test interrupted opening and reduced motion, then rerun the
metadata-ready suspended-software Notes path. Compare named chronological
native/browser frames with an empty mask first. The source-covered frame,
first visible Notes pair and cover-clearing frame are required boundaries.
