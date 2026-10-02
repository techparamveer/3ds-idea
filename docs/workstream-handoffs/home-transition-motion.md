# HOME application close transition handoff

Base: `7b2437938cfc48c621576835200cd559a50e9f52`

Branch: `codex/home-transition-motion-20261002`

Delivery: the focused commit containing this handoff

Feature IDs: L-05, L-06, L-07, H-12

## Delivered controller

`src/os/home-application-transition.ts` is a pure, owner/generation-keyed close
controller. It begins at `BannerBG_AppQuit` frame 0, advances one source frame
per explicitly eligible HOME update, stops at source frame 20, and preserves
that terminal presentation until a later host call emits `commitOwnerClose`.
The retained application therefore remains available to the suspended capture,
window, metadata, and renderer for the entire visual close.

The intent is retained as either `{kind:'close'}` or
`{kind:'switch',appId}` so integration can use one close motion for selected
Health direct close, a confirmed close dialog, and a confirmed software switch.
The controller does not choose which titles need confirmation. Existing policy
remains in `system.ts`: selected Health closes directly; unselected Health and
other titles open the close dialog; selecting a replacement opens the switch
dialog.

Large update batches stop at the terminal barrier instead of removing the owner
before frame 20 can be painted. Ineligible updates are consumed without catch-up.
Stale owner/generation identities cannot advance or cancel a replacement.
Reduced motion selects the same source endpoint for presentation while the host
retains ownership of logical scheduling.

## Bounded source audit

Manifest key `models.homeBackground` maps to HOME title
`0004003000009802` v24576, content index 0 / `00000082`, internal path
`romfs/3D/BannerBG_LZ.bin`. Compressed SHA-256 is
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`;
decoded CGFX SHA-256 is
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
The delivered model JSON SHA-256 is
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`,
converted by `ctr-cgfx-web` 1.1.0.

The source clips establish:

| Clip | Source duration | Bounded finding | Live mapping |
| --- | ---: | --- | --- |
| `BannerBG_AppQuit` | 20 | Constant4 alpha 0 -> 1 and capture scale 0.87 -> 1 | Used for close |
| `BannerBG_AppRestart` | 40 | Animated channels start at source frame 20 and restore paused material values | Unmapped |
| `BannerBG_SceneOut` | 40 | Upper transform is stationary through frame 20, then leaves | Unmapped |

The close presentation layers AppQuit over the already delivered settled
`BannerBG_SceneIn` frame 20 plus `BannerBG_AppPause` frame 20. AppRestart and
SceneOut are deliberately excluded: the available executable/source evidence
does not identify either live close predicate. No opacity fade, interpolated
CSS/Canvas effect, or new artwork is introduced.

One eligible source frame per nominal 60 Hz HOME update is a host scheduling
adaptation. The native AppQuit start epoch, completion callback, inhibited
passes, and relationship to AppRestart/SceneOut remain untraced.

## Coordinator integration contract

The shared files remain coordinator-owned. Integrate the controller with these
exact boundaries after cherry-picking this commit:

1. In `system.ts`, add one `HomeApplicationTransition | null` and a monotonically
   allocated transition ID to `System`. `requestApplicationClose` must begin a
   `close` transition for its existing selected-Health direct predicate instead
   of calling `closeApplication` immediately. The dialog-confirm branch begins
   `close` or `switch` using the existing pending title; the Cancel branch remains
   unchanged because no transition exists before confirmation.
2. While a transition is active, quarantine ordinary HOME/app input and preserve
   the suspended runtime owner, `homeReturn`, capture generation, selected tile,
   and pending switch intent. Reconcile owner/generation mismatch by cancelling
   the transition without closing the replacement.
3. Advance through the existing counted HOME update pass only when HOME is
   powered, visible, awake, and the retained owner still matches. On
   `commitOwnerClose`, revalidate that owner, call `closeApplication` once, clear
   dialog/pending/input state, and only then call `launch` for a `switch` intent.
   Do not close from `terminalPresented`; its frame must survive one outer host
   boundary.
4. In `screens.ts`, sample `homeApplicationTransitionPresentation` and pass it
   beside the retained capture. The existing suspended owner/window stays
   published until the commit observation. Hide or animate the window/footer
   only after native evidence establishes their own close epochs.
5. In `firmware-banner.ts`, include the presentation frame in the suspended
   raster cache key and set material playback in this order:
   `BannerBG_AppPause@20`, then `BannerBG_AppQuit@frame`. Keep
   `BannerBG_SceneIn@20` skeletal playback. A missing clip/draw remains explicit
   recovery; do not substitute a fade. Normal `BannerBG_Loop` ownership is
   unchanged.

Required integration regressions: update `health-home-close.test.mjs` so the
owner survives before terminal and is removed once after commit; preserve its
unselected/other-title dialog assertions; update the L-06/L-07 lifecycle route
tests so confirmation begins motion and switch launch occurs only after commit;
add a stale-owner/capture-generation case and a reduced-motion endpoint case.

## Verification and native capture ticket

Focused controller tests validate source identity/durations, the delivered
AppQuit alpha endpoints, AppRestart frame-20 start, SceneOut's stationary first
half, idempotent begin, explicit identity replacement, inhibited updates, stale
guards, close/switch intent retention, source-frame presentation, terminal
barrier, reduced motion, cancellation, and invalid inputs.

Worker checks: 7/7 dedicated controller tests pass; the focused controller,
Health-close, source dialog, suspended-background, and lifecycle-route set passes
28/28; `npm run typecheck` passes; `git diff --check` passes. No full suite,
production build, shader check, or visible verification was run in this worker.

Coordinator native capture request, using the two private muted Sidecar Azahar
instances:

1. Settled selected Health suspended -> press/release Close -> own 400x480 PNGs
   at relative updates 0, 1, 5, 10, 19, 20, and 21.
2. Settled Work suspended -> open close dialog -> confirm -> capture the same
   relative updates.
3. If either sequence shows a second phase, repeat through its terminal update
   and compare it against AppRestart and SceneOut source samples before changing
   the integration.

Record exact input holds/releases, frame-advance counts, raw LCD hashes, empty
or reasoned masks, diff reports, and opened contact sheets. Existing own native
captures establish only settled-before and closed-after states; they do not
establish these motion epochs. This worker operated no GUI, browser, Azahar, or
audio session.

The coordinator attempted to prepare this capture while the controller was in
progress. Two isolated muted references were running on Sidecar, but Azahar's
Tools -> Advance Frame action remained disabled after Pause, so the requested
0/1/5/10/19/20/21 samples could not be obtained. Fresh primary-profile own PNGs
`_02.10.26_06.38.22.082.png` (expanded Health),
`_02.10.26_06.38.35.647.png` (Camera selected), and
`_02.10.26_06.38.39.694.png` (switch dialog) are settled-state references only.
They do not change the explicit host-timing adaptation or justify scheduling
AppRestart/SceneOut.

## Remaining gaps

- Native AppQuit start/finish timing and participation of AppRestart/SceneOut.
- Suspended title window, icon, footer, HUD, and lower-LCD close epochs.
- Exact input, paired-LCD motion, transition cue, and muted audio comparison.
- Portfolio/offline content and existing suspended-capture binding adaptations.

No shared runtime or renderer file changed in this slice, so visible behavior
still disappears immediately until the coordinator integrates the contract.
