# HOME pause card alignment handoff - 8 October 2026

## Captured defect and scope

Base commit is `2b3362a73ad38c71d17c84bcc3637ecf3a61a1f8` on
`codex/home-pause-upper-20261008`. This delivery changes only the suspended
window painter and query, its reserved `screens.ts` call, directly related tests,
and this handoff. No asset bytes, scene code, server, browser or native profile
were changed.

The coordinator's Mac production capture at the base showed the suspended card
by browser pause 5 while the source HUD stayed hidden through pause 10. The same
painter also exposed the bottom camera hints at pause 0 because
`LncBase_U_00_SceneIn` was fixed at its settled pose 40.

The chronological native review instead bounds first-cycle HUD visibility to
`(2.536667, 2.586667]` seconds and card visibility to
`(2.586667, 2.636667]`. Extracted native frame 012 has a faint HUD without the
card or camera hints; frame 013 has all three. The repeat movie bounds both to
`(2.590000, 2.640000]`. These are movie sample bounds, not native epochs.

Evidence is retained under:

- `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/home-pause-upper-mac/browser-normal/`
- `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/home-pause-upper-review/newmac/native-review.md`
- `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/home-pause-upper-review/newmac/first-onset-late/`
- `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/home-pause-upper-review/newmac/repeat-onset/`

The native review records movie SHA-256 values
`b3836359b25fb6b18cc5e129c0feab18f69edc824d1c0a64ffa1493b7717df40`
and `b207e69d84af6410b1308369df1a4f6eb447b100c1129bdfbf5aca7da7d3292b`.
Its 36-file inventory SHA-256 is
`d1b39b384decebfdb2a97aaff05ade7a7aca293718d1afeacd505ef4fc8afea9`.

## Delivered behavior

The selected suspended-window painter now samples two existing decoded clips
from the same guarded pause candidate:

- `LncBase_U_00_SceneIn` receives the already selected 0..40 pause/HUD phase.
  Its `G_Scene_00` root stays transparent through normalized pose 20, then
  reveals the complete launcher composition through pose 40.
- The `G_Wndw_00`-only `LncBase_U_00_Appear` binding receives
  `clamp(pause - 10, 0, 10)`. Its source window alpha therefore stays zero
  through pause 10 and advances through its original 11 poses afterward.

| Host pause pose | Launcher SceneIn | Root alpha | Window Appear | Window own alpha |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 0 | 0 |
| 10 | 20 | 0 | 0 | 0 |
| 11 | 22 | 7 | 1 | 7 |
| 15 | 30 | 128 | 5 | 128 |
| 20 | 40 | 255 | 10 | 255 |

The HUD clip has a different authored curve: at pause 11 its parent alpha is
28 while launcher root and window-own alpha are each 7. This lets the HUD become
discernible before the card and camera hints without adding authored pixels or a
new clock. The exact visibility threshold still depends on rendering and needs
coordinator recapture.

Expanded and compact modes use the same delayed appearance sequence while
retaining their distinct `ScaleUpDown` endpoints. Reduced motion uses SceneIn40
and Appear10 through the existing terminal receipt. Dialog, close and ordinary
HOME calls omit the selected entry frames and retain their settled bindings.

Eligibility still requires the retained application, no dialog or application
transition, a ready capture, and exact owner plus capture-generation matches.
Pending and failed pairs do not spend the phase. Retry, stall rebase, revocation,
firmware replacement, disposal and same-owner repeat continue to use the prior
receipt policy. Selected SceneIn resources now validate the 41-pose nonlooping
child-bound clip, exact `G_Scene_00` root group, and decoded root alpha/scale
curves; substitution fails the paired paint explicitly.

## Native source identity

HOME remains EUR title `0004003000009802`, version 24576, product
`CTR-N-HMMP`, content index 0, CIA-internal content `00000082`. Decrypted
content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter is the retained `ctr-native-web` 1.2.0 contract; no extraction or
conversion occurred in this slice.

| Visible element | Manifest key and dump path | SHA-256 |
| --- | --- | --- |
| Suspended composition | `home.launcher/layouts.LncBase_U_00`, `romfs/launcher_LZ.bin/blyt/LncBase_U_00.bclyt` | `b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` |
| Complete launcher entrance | `home.launcher/animations.LncBase_U_00_SceneIn`, `romfs/launcher_LZ.bin/anim/LncBase_U_00_SceneIn.bclan` | `784a355f31faa9a43aea6bc5c8a1c3ecb0b4b54060ebb8f114748caecdb5e47a` |
| Window appearance | `home.launcher/animations.LncBase_U_00_Appear`, `romfs/launcher_LZ.bin/anim/LncBase_U_00_Appear.bclan` | `2984f92736035fec7a9475b6840fc2ba27763a8dd5081cd883ab32651d6fb427` |
| Launcher archive | `home.launcher`, `romfs/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |

The layout, messages, Health SMDH description/icon, source font, textures,
Sleep, ScaleUpDown and WhiteBlack producers retain their identities from the
[original window handoff](../home-suspended-window-2026-10-02.md) and
[Appear source handoff](animation-folder-home-20261007.md#an-04-suspended-window-appear-entry-follow-up-7-october).

## Verification and residuals

Seven focused files pass 54 tests: `home-pause-window-entry-live`,
`home-entry-motion`, `home-pause-lower`, `home-pause-window-entry`,
`home-suspended-window-entry-policy`, `home-entry-presentation`, and
`home-hud-sample`. The tests pose both decoded launcher clips and run the actual
`createScreens` plus `createFirmwareHome` suspension path. Nonincremental
`tsc --noEmit --incremental false` passes. Temporary read-only dependency and
asset links were used only for these checks and removed before delivery.

This worker did not run the full suite, production build, browser, Azahar,
audio, raw-LCD capture, mask or pixel diff. The coordinator must integrate and
recapture first/repeat normal and reduced Health-to-HOME flows, including pause
0..20, compact selection, dialog/close and same-owner resume. The browser/native
motion comparison remains `fail` until that evidence is inspected.

The shared 2:1 SceneIn mapping, delayed Appear host phase and reduced endpoint
are explicit host alignment adaptations. The native caller epoch, per-producer
start order, cadence, exact visible thresholds, input duration, pixels and muted
audio remain untraced or unaccepted. The unrelated outgoing 3D growth defect is
outside this slice. No new non-native graphics were introduced, and whole-flow
1:1 fidelity is not claimed.
