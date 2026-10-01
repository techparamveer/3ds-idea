# HOME input comparison - 1 October 2026

Coordinator continuation from `c76d9ad3`, production runtime `e59cc4b9`.
No product code, public assets or audio changed in this slice. All whole HOME
scenarios remain **fail**. This adds a repeated native launch outcome and
measured browser input, not exact native input/motion equivalence.

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
All new artifacts are internal. Original/default profiles and sibling worktrees
were untouched. All native/browser audio stayed muted; system audio was not
changed. Fresh NSScreen metadata confirmed Sidecar `(1800,367,1357,935)`.
Native bounds were `(1810,397,1153,781)`. The dedicated browser was moved while
still blank, then independently verified at `(1810,397,1150,780)` before page
navigation. The user's separate muted 3011 browser was not driven.

## Native repeat

`R/native-ctm-repeat` is a separate clone of the stopped seed from the
[first CTM run](home-ctm-live-replay-2026-10-01.md). Both the frozen seed and
repeat clone passed all 467 NAND/SD hashes immediately before launch; logs are
`ctm-replay/seed-storage-recheck.log` and `repeat-storage-check.log`.
The repeat config differs from the first Left run only in the three rebased
NAND, SDMC and screenshot paths. Config SHA-256:
`fa2f7bf88c9a0ce1811b1642c1358547514243cf85df8f4dd85150dabf8ee2dd`.
`repeat-profile-audit.json` reports no issues and volume 0. The executable,
HOME content, seed inventory and `left-open.ctm` identities are unchanged
from the linked record. HOME pipeline cache was preserved outside the active
cache, not deleted. Original hardware/EUR/English/Vulkan/native resolution
settings were retained.

The exact same CTM ran to `Movie Finished`. A prefix window observation at
counter 316 showed Notifications selected during startup; its title was not yet
visible, so it neither reproduces nor resolves the earlier single-`N` anomaly.
The later window showed the same Friend List error 002-0121 as the first run.
No live pad/touch navigation or online-dialog input was sent. This supports the
repeated final launch outcome, not an independently observed second settled
Friend-selection frame or pixel-identical full replay.

Window evidence in `R/ctm-replay/`:

| File | SHA-256 |
| --- | --- |
| `repeat-prefix.png` | `02bf8cb924b963d5133d7ade1134f263462a2adea76fe728d44bdb8ec0f527f7` |
| `repeat-resumed-window.png` | `cb4b727a779edc348cb974816fb87401b97ead8affc75838bd813db5795ad790` |
| `repeat-shutdown.sample.txt` | `72700430923ec681936592a79dc243522fd895a2643149676f0f94da85f87b76` |

**No new native LCD PNG was produced by the repeat.** The post-EOF screenshot
request did not write a file. Pause/Continue did not release the stalled render.
Normal Quit/Yes closed visible windows but left the process alive. A live sample
identified `OnMoviePlaybackCompleted -> QDialog::exec -> ShutdownGame ->
QThread::wait`. The pinned Qt source invokes completion using
`Qt::BlockingQueuedConnection` (line 439) and opens a modal information box after
`OnPauseGame` (lines 4298-4300). Quitting inside that unresolved completion modal
is unsafe: dismiss it before further menu work, or capture/quit before EOF.
Do not treat the status label alone as proof the modal has been dismissed.
Normal termination did not exit; the coordinator stopped only this owned clone
with SIGKILL, exit 137. Logs/sample and clone remain preserved. No restart was
performed merely because an observation timed out.

## Browser actions

The built production app ran on loopback port 3020 with `?lcdCapture=1`. Browser
output was muted at launch and application mute was verified before inputs.
Preparation from the default two-row HOME was M, X three times, Up, Y four
times, X twice, Y, then Right three times. X cycles density; Y changes console
brightness, not density. The five Y presses restore the initial brightness.
This exploratory preparation is not native replay evidence. The measured
baseline was one-row HOME, toolbar focus 3 (Notifications), focused host, muted.

The first agent-browser batch saved its baseline but did not deliver any
observed navigation before the wrapper's 100s timeout. Its console held only
the observation epoch, and live state still showed focus 3. The same browser
and daemon were inspected, not restarted. Its artifact prefix
`ctm-browser-notifications-before` is excluded from the pairs below. Cause of
the batch wait is not established.

For the measured runs, the coordinator reused the repository's existing
`scripts/perf/cdp.mjs` client against the exact already-open verification tab.
No new browser was launched. Real `Input.dispatchKeyEvent` down/up and
`Input.dispatchMouseEvent` pressed/released events used the ordinary handlers.
A temporary capture-phase observer logged timestamps, trust, focus and HOME
updates without dispatching events, editing datasets or invoking reducers.
Pointer coordinates came from the current projected `Touch_160_226` target,
plus the host bounding rectangle: approximately `(554.0681,445.5799)` viewport
pixels. There was no movement between down and up.

Both runs selected Friend exactly once and opened the local Friend List UI.
The second run was prepared by B to close Friends, then Right to Notifications.
Each measured sequence requested Left at 30s and footer touch at 60s from a new
observer epoch. All four observed events per run had `isTrusted=true`.

| Driver | Key onset / hold ms | Pointer onset / hold ms |
| --- | --- | --- |
| Wait after down acknowledgement | 30001.1 / 47.2 | 60032.3 / 64.5 |
| Release deadline from dispatch | 30002.9 / 36.2 | 60041.5 / 34.6 |

The intended hold is eight native 234Hz samples, `8000/234 = 34.188034...ms`.
The deadline run avoids adding down-acknowledgement latency to the hold.
These are DOM event timestamps, not proof of identical sampled HID timing.
Handler-observation deltas also differ: first run 46.2/134ms, deadline
36.4/27.9ms for key/pointer. The browser's provisional 60Hz HOME clock and the
native CTM clock remain independent. No motion or audio acceptance follows.

Private input logs:

| File under `ctm-replay/` | SHA-256 |
| --- | --- |
| `browser-cdp-replay.json` | `27e54e8fe24551ff3276cf8455cfe50900d9717729141b6d86b3d09c13ea997a` |
| `browser-cdp-replay-deadline.json` | `7b0901583f5dbd0fa5815eeb8120490286fceaed499d32ef2b2ef91791f6b62b` |

Runtime.enable replays old console entries; filter records by the run's
`epoch.epoch`, rather than counting the cached epoch from the aborted batch.
The legacy `data-app` remains empty for this applet; `data-menu=app`, paired
`data-native-screen=ready` and the inspected LCDs establish which view opened.

## Raw comparisons

Each browser capture uses the real 400x240 upper and 320x240 lower targets.
The existing presentation-only capture hook sampled elapsed 12000ms and
`2026-09-22T19:19:00.000Z`; this does not set input state or establish a native
event-clock match. Notifications native shows 20:18, Friend shows 20:19. Upper
pose, lower cursor and state phase remain unmatched. Both runs used the
retained native PNGs from the first CTM run, not the repeat's window images.

Browser directories are under
`R/captures/reference/scenario-matrix/v1/captures/<scenario>/browser/`.
Reports are under `R/ctm-replay/<report>/report.json`.
Every report uses the empty mask SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
All twelve upper/lower contact sheets were opened and inspected.

| Scenario suffix after `ctm-browser-cdp-` | Report prefix `compare-` | Upper / lower pixels >2 |
| --- | --- | --- |
| `notifications-before` | `notifications-cdp-before` | 42370 / 19365 |
| `friends-selected` | `friends-cdp-selected` | 50877 / 19195 |
| `friends-after-touch` | `friends-cdp-after-touch` | 95997 / 40951 |
| `notifications-before-deadline` | `notifications-cdp-before-deadline` | 42370 / 19205 |
| `friends-selected-deadline` | `friends-cdp-selected-deadline` | 50877 / 19396 |
| `friends-after-touch-deadline` | `friends-cdp-after-touch-deadline` | 95997 / 40951 |

Exact native/browser PNG hashes, capture JSON hashes, report hashes, input
measurements and paths are in `R/ctm-replay/summary.json`, SHA-256
`1ea7004153f9a02bcec5dbbf1ec283f326c82d0c5d42b20916e8be99da9a5159`.
Native source/title identities are unchanged from the linked CTM record and
the [Friend source record](home-friend-banner-source-2026-09-28.md).

The after-touch comparison deliberately records different app states: native
online-service error versus the portfolio's local/offline Friend profile.
It proves neither that the two app screens should match nor that the local
profile is pixel-faithful. Network/account operations remain excluded. No
stock-app error-dialog emulation or mask was invented to obtain a pass.

The HOME selected pair exposes still-unexplained banner yaw, plate placement,
wallpaper/HUD/cursor phase and footer material residuals. Portfolio tile
content/population and offline behavior are intentional adaptations; none
excuses those native residuals. The earlier truncated native Notifications
title is still unsuitable as a normal visual baseline.

Independent worker image analysis confirms the fresh native footer crop is
byte-identical to the prior native footer. Footer `(0,212,320,28)` remains
694 pixels >2, max 21, MAE 0.6191964, concentrated at y212..220. Text
`(130,220,60,20)` has 0 pixels >2, max 2. There is no new material improvement or
proof of a theme cause. `footer-reference-analysis.json` SHA-256:
`f82656542ca8652ab7693b9b4ed65c3cb7d50c222739ad0c5a94b10e841395b8`.

## Checks and next work

The input worker's bounded source audit establishes a next visible correction,
not an implemented result. Pinned HOME `code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`:
category4 at `0x1d75bc..0x1d75dc` requests type14 with canonical empty key;
dispatcher `0x1f9324` selects `0x1f98d0`, whose resource table entry
`0x32ed3c -> 0x322c4b` names `BannerAppletFriend`. It calls generic primary
constructor `0x1fa0fc` at `0x1f994c`, installs vtable `0x3210f0`, and binds
controllers at object `+0x50/+0x54`. Ready-gated manager `0x24c23c..0x24c264`
calls vtable `+0x14 = 0x1fa344`, which tail-calls yaw producer `0x24e0c0`.
This is the quarter-step scale/visibility and 600-update yaw path already
modeled in `home-banner-lifecycle.ts`. Current Friend rendering instead forces
yaw0/scale1 and uses global elapsed time. Only Friend focus2/category4 should
be admitted in the next slice, with its source looping clips600/300 and the
existing asynchronous resource ticket. Activation epoch, controller attachment,
first submitted clip frames and displacement/offset remain unproved; this
trace does not establish a plate-Y correction or exact phase.

Documentation-only repository change: relative links and `git diff --check`.
No new product tests/build were required; current code's prior checks remain
1536 pass/0 fail/23 skip/1 TODO, typecheck/build pass. Browser page errors were
empty. Both measured replay scripts exited 0. Dedicated browser and verification
server were closed; the repeat native process exit 137 is recorded above.
No push, merge, deployment or shared historical matrix change occurred.

Next: establish a complete native HOME baseline without the initial-title
anomaly, capture before the completion modal, recover the Friend applet's
source-owned yaw/activation clock, and measure matched phases. The footer's
live active/default material bytes remain unobserved. Continue silent testing;
audio acceptance stays open until the user explicitly permits it.
