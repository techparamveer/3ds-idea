# Suspended HOME scale progression

## Integrated checkpoint

Runtime `fd1561f` moves scale from renderer receipts to logical upper HOME
passes. It includes suspended-banner lifecycle `dff0842`, shortcut alignment
`22bc0a8`, native caption centring `89cc769`, and the earlier Resume fixes.
The clean candidate in `home-scale-clock-20261014/3ds-idea` passes typecheck
and production build, ID `1d53IIkwjAYI_0DIBqwab`. Full tests report 2,855 passes,
one unchanged missing historical Camera PNG failure, 102 skips and one TODO.
Worker focused checks pass 214 with one existing conditional skip. Independent
source and receipt/scene reviews pass 32 and 183 tests with no findings.
The runtime is pushed directly to draft PR 7. The old coordinator's unrelated
human edit prevented a fast-forward there and remains untouched at `9b60905`.

The candidate has not been visually verified. Three consecutive goal-turn
checks find unavailable MacBook window capture/AX; the earlier desktop capture
was black. No input was attempted on the latest failed check and its Cua
session is ended. No candidate LCD captures were collected.
The browser check plan and verification logs are under the private
`animation-20261007/continuation-20261014/` directory. Live first/repeated and
rapid Resume checks remain required before any visual acceptance claim.

## Implementation

The delivered `LncBase_U_00_ScaleUpDown` clip supplies the geometry. Logical
current/target and epoch belong to System state. The initial HOME Appear still
starts at the selected endpoint through the existing lifecycle bridge. Ordinary
passes fold input resolver requests, one upper scale step, then lower requests.
Reversal preserves current. Incomplete handoffs spend no upper step, and raw
pickup selection without a resolver does not retarget. Repeated paints and
receipts cannot advance, initialize or reset scale. Missing paints do not stop
admitted logical updates. Reduced motion settles during a logical pass and
triggers the existing state-driven redraw. Sleep/hidden rebasing retains state
without spending suspended wall time. Capture/resource replacement is not mode entry.

A Resume source records the actual rendered scale frame and target epoch.
Its owner, HOME origin, capture/resource generation, settled-input, readiness
and paired-publication guards remain. Hidden, sleeping, covered, failed,
diagnostic, stale and revoked pairs cannot publish backing. A frame-14 pair
may be accepted after logical current reaches 15 if the epoch is unchanged;
Resume must still use displayed frame 14. Away/back target changes invalidate
old backing, while Resume's own HOME-mode exit preserves the accepted epoch.
An accepted intermediate expansion remains valid backing for rapid Resume.
The footer retains the accepted upper/lower pixels and SceneOut keeps the exact
stored scale frame. SceneOut contains static expanded descendant channels, so
the validated scale binding is reapplied after it. The existing expanded
departure pose is unchanged. Existing Resume input settling remains in force.

The window uses the decoded geometry, opacity, visibility and caption tracks.
All 23 bound channels are checked against the source contract. Caption centring
now follows the recovered `N_TestCenter_00` writer: scale frame / last frame
times half the remaining text-pane width. The actual source width is 252, not
the previously fitted 250; the expanded caption shifts one pixel accordingly.
Native font measurement and exact rendered text pixels remain unverified.
No firmware resource or asset was changed.

## Logical clock source contract

Pinned code `0x286e74` calls the banner wrapper at `0x286f30`, then scale helper
`0x285ab0` at `0x286f3c`. The helper advances upper `+0x308` toward `+0x304`
by one and clamps to 0..15. Banner inhibition does not gate it. Same mode-1
entry does not reseed; a true transition seeds current and target together.
The implementation follows ordinary input -> upper -> lower call order.

Native lower initialization can also call upper directly through `0x1e1988`.
That exception is not proof of duplicate ordinary close/switch updates. The
browser's initial-return bridge, helper admission and nominal 60 Hz scheduler
remain adaptations. Live initial-return flags, normal cadence and exact moving
pixels remain unproved. Source report SHA-256:
`41070f40ddee0c9956eda166547f1a522812dec4d48194ab19c32f743d322b73`.

Current logs are in private `continuation-20261014/scale-clock-design/` and
`scale-clock-native/`, with root `scale-clock-full-tests.log` and
`scale-clock-production-build.log`. No tests outside the two scale files were
changed. The existing reduced-navigation test caught an intermediate regression
and passes unchanged after its zero-update settlement was preserved.

## Source

EUR HOME title `0004003000009802`, v24576, content index 0 / `00000082`,
converter `ctr-native-web 1.2.0`. Decrypted content SHA-256:
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Manifest key `home.launcher/animations.LncBase_U_00_ScaleUpDown` maps to
`romfs/launcher_LZ.bin/anim/LncBase_U_00_ScaleUpDown.bclan`, SHA-256
`e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8`.
The clip contains frames 0 through 15 and binds `G_WndwScale_00` with children.
The unchanged layout and archive identities are in
[the compact Appear record](home-pause-compact-entry-2026-10-08.md#source-identity).

## Verification and limits

The existing private `home-compact-resume-20261012-v1/native-audit-astra-v1/report.md`
records intermediate native shrinking and expanding poses in both cycles.
Its browser baseline records endpoint-only switching. This patch has not yet
been browser-inspected or compared with new matched native captures. The native
outgoing banner persists into expansion and the incoming banner follows compact
arrival. The outgoing lifecycle is now corrected in code. Source does not prove
an incoming scale-zero barrier; no such delay was added. Fresh captures remain required.

The initial 76 focused checks and typecheck passed but missed rapid Resume.
Independent review reproduced both black LCDs after accepted expansion frame 1:
the endpoint-only source barrier left no retained cover while Health reloaded.
The corrected regression first failed on that actual black compositor output.
It now checks touch down/up and HOME Resume at accepted frames 1, 7 and 15,
retained pixels throughout the footer, and unchanged local scale geometry across
all SceneOut frames. Further cases cover unpresented/stale sources, reversal and
reduced motion. Tests run the real HOME compositor and native sessions with
Canvas/GPU boundaries supplied by the fixture. Source checks preserve both prior
endpoints and fail on changed or unsupported bound channels.
The corrected candidate passes 82 focused tests and `npm run typecheck`.

Logs are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261014/scale-worker/`.
The coordinator owns combined tests/build and GUI verification. Exact native
pixels, input epochs, banner ordering, cadence and muted audio remain unproven.

## Native banner and caption trace

Pinned HOME code SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Ordinary idle/scroll-completion calls supply resolver flag zero. Suspended
category 1 requests clear type 6 at `0x1d74b4..0x1d74d4`; it does not detach
the current primary immediately. The retained manager performs its hide.
Browser composition now draws that outgoing nonowner primary while suppressing
the suspended owner's stale title. Close type 13 and snapshot/toolbar precedence
remain distinct. The initial-return flag is not inferred from ordinary selection.

Six original-ARM replays on synthetic mature objects verify the bounded dispatch,
manager hide and scale call order. They are not native raster or elapsed-time
proof. The public-controls regression independently failed on stale Health
while moving away and missing Camera during expansion, then passed for initial
and repeated keyboard/touch selection, quick-away and released footer Close.

Caption lookup `0x2867dc` binds `N_TestCenter_00`; `0x2867ec..0x286800` derives
its extent from `T_TextBtmR_00` width minus measured text. The Pane constructor
copies raw width unchanged to object `+0x48`. Writer `0x285b28..0x285b44`
applies the linear scale fraction, independently of the authored Hermite track.
The regression checks every scale frame plus three text widths and Resume.

Private evidence under `continuation-20261014/banner-native-trace/`:
report SHA `5d3e95eb7d4d5d5ea3eb73e067a5b3f60f8400d8a2c3422608c9b9a69cda4c93`,
replay results SHA `a14500c0daa8f6b3fc0d8ee35aaf7e13d50173cbe791dfeb22f8d80096ef20d3`,
caption note SHA `1794e5940a981d293277d0ceef46e4c667a4ba0e69012b57070a21c7f24d33e8`.
The browser trace and final full-test/build logs are in `banner-browser-trace/`.
