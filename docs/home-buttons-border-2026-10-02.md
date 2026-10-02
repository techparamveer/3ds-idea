# HOME Buttons and Close Border

Runtime `46254ee7`, reviewed target-identity fix `25d4f367`. Two independent
worktree/chat deliveries integrated as `eb97635f` and `a3c67599`.
This fixes observable button transfer and close-start backing defects. It does
not establish whole-scenario native fidelity.

## Delivered

- HOME footer Select and release now use one pure contact-ownership predicate
  and shared lower-LCD geometry. A <=8px move across x100 or from y210 into
  the footer no longer acquires the destination action. Same-button movement
  still works. Selection revision, folder context and toolbar focus changes
  invalidate ownership even when both targets say Open. Native control queue,
  cancellation, rendering and pure-helper regressions are covered.
- The suspended background alone opts into authored ClampToBorder sampling.
  Strict per-axis outside-[0,1] checks return the decoded RGBA border; exact
  edges retain the texture sample. Existing filters, mip opt-in, texture
  replacement/disposal and unopted rendering are preserved. This restores the
  captured backdrop at AppQuit frame0 instead of immediately losing it.

Source evidence and element-to-manifest/member SHA identities:
[footer handoff](workstream-handoffs/home-footer-contact.md),
[sampler handoff](workstream-handoffs/home-native-border.md), and
[BannerBG mapping](home-suspended-background-2026-10-02.md#source-mapping).
HOME title `0004003000009802` v24576, content index0/ID `00000082`;
`LncBtmBtn_02` / Select use `ctr-native-web` 1.2.0, BannerBG uses
`ctr-cgfx-web` 1.1.0. No asset/font/audio was synthesized or regenerated.

## Evidence

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-buttons-border/`.
`summary.json` SHA-256
`8a1a78cc1c7169d40a61b53f5a779b5cc6300617a8f7dae0bfd388580dd05e26`
tracks scripts, logs, raw pairs, source PNGs, masks, reports and inspected sheets.

- Tested: final 1738 pass, 0 fail, 23 skip, 1 TODO; typecheck/build pass.
  Shader validation passes. Read-only review found the same-label target
  transfer gap; `25d4f367` fixes it and adds native-controls-enabled coverage.
- Browser-inspected: the two invalid footer routes reproduced before the fix
  and stayed on HOME afterward, through real CDP pointer events projected onto
  the lower LCD. Final replay also confirms same-button Resume. The original
  before/after grid densities differ; only the shared footer region and action
  outcome are comparable, not their entire lower screens.
- Seven close/switch regressions retain 88 raw pairs: Health, Work, switch,
  reduced motion, lid pause, constrained rendering and mobile. Actual WebGL
  presentation includes terminal pose20 for every route. No page errors.
  Seven motion sheets, two footer sheets, desktop1150x693 and mobile390x740
  images inspected; viewport RGB standard deviations exceed56.
- Native-compared: isolated primary executable SHA
  `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`,
  private real config/NAND/log tree, original hardware/EUR, Static input2,
  Null output1 and volume0. Only coordinator operated it, on Sidecar. Mac
  unlocked, native launch recovered; own400x480 PNGs07:33:56.364 HOME idle and
  07:42:44.667 Health initial saved. A500ms held Open succeeded; short input
  and subsequent HOME return failed. No new native close epoch was captured.

| Named diagnostic pair | Upper pixels >2 | Lower pixels >2 |
| --- | ---: | ---: |
| home-idle | 11615 | 27871 |
| health-initial | 21872 | 0 |
| close-start-before | 74145 | 33769 |
| close-start-after | 10769 | 33917 |

All four reports are **fail**, with empty masks and inspected three-column
sheets. HOME populations, slots, HUD and phases differ. Health lower has zero
pixels above2 but its moving upper and input cadence are unmatched. Close pairs
reuse native settled suspended PNG06:38:22.082 versus browser first AppQuit
pose, not a matched native close frame. The upper backdrop strip22,24,356,24
improves8442 ->0 pixels above2, supporting the visible sampler correction only.
No historical/private matrix was changed.

Native Quit/Yes was followed by verified PID53386 absence; LaunchServices
provided no child exit code. After exit, temporary touchscreen settings and
dialog-normalized motion/controller fields were restored. Only saved window
geometry differs; audio and HOME B binding are unchanged. Workers are idle;
all worktrees and both isolated native profiles remain preserved. The second
native profile was not launched during this slice.

## Remaining Work

Suspended panel/footer departure remains stationary until terminal, and exact
close timing/input/audio are unverified. Capture binding, padding, copied mask
sampler and pose selection remain fitted adaptations despite the source-backed
border rule. Portfolio content/HUD, caption fits, local settings/persistence,
offline content, boot timing and existing source gaps remain adaptations or
limitations. HOME population/geometry/HUD residuals are not excused by them.
Next visible slice is native panel/footer departure with a working held HOME
reference route, not another source-only sampler audit. Strict1:1 remains open.
