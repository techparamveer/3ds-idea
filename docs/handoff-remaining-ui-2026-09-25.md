# Remaining 3DS portfolio UI: handoff and deliverables

This is the restart brief requested on 25 September 2026. It supersedes no
acceptance criterion in [GOAL.md](../GOAL.md) or the
[current portfolio scope](portfolio-ui-scope.md). Start from integration commit
`b96a46e` (branch `codex/health-ui-scratch`) and keep its full history. The
original checkout at `/Volumes/DeveloperStorage/GitHub/3ds-idea` was not used
for these UI edits. This task is paused; the new task should continue in its own
worktree after reading [AGENTS.md](../AGENTS.md), the
[architecture index](architecture/README.md), the
[feature map](feature-map.md) and the [evidence record](progress-2026-09-24.md).

## Goal to carry into the new task

Complete a personal portfolio presented entirely through a realistic original
Silver + Black 2012 Nintendo 3DS XL. The page contains only the console and
background. Its physical controls and lower touchscreen navigate a EUR
10.7.0-32E-inspired HOME Menu, eight portfolio apps and retained stock screens.
Power-on, power-off and app-opening sequences must work. Use the user's photos,
Nintendo hardware references and the available decompiled firmware/resources;
do not represent source approximations as measured native output. The user
requires strict 1:1 UI acceptance even if delivery takes longer. Preserve
plain portfolio content.

Scope: HOME, Settings, Health and Safety, Camera, Sound, eShop, Nintendo Zone,
Game Notes, Friends, Notifications, local Browser/Miiverse and relevant helper
screens. Camera is a read-only gallery of existing portfolio folders/photos;
Sound should play favourite songs when the user supplies them, with 3DS-style
controls. No Software Keyboard, Activity Log, Download Play, Mii Maker,
StreetPass Mii Plaza, AR Games or Face Raiders. Do not build capture,
recording, account/network actions, PIN entry or extra content to fill gaps.

Use separate worktrees and narrowly owned agent tasks where they help. The
coordinator alone drives the actual browser and isolated Azahar UI. An agent's
source replay or source render is not a matched native comparison. Follow the
[implementation process](architecture/implementation-process.md) and keep
progress, feature map and architecture current as work integrates.

## Delivered at this checkpoint

- The sourced Joshua P. silver/black XL rig, compact textured GLB, Three.js
  scene, physical controls and VGPU paint path are integrated. Hardware
  fidelity remains unaccepted; preserve all older `.blend`/`.glb` assets.
- HOME has native resource-backed lower chrome, fonts, tile art, folder/default
  banners, grid density, pickup, input and audio. The stock-title upper banners
  remain visibly blank because the live host reports them unsupported.
  Settings and four common title model packs are delivered; the real Settings
  title-worker replay reaches its graphics bind service but not a visible pose.
- Eight portfolio apps, startup/shutdown, app opening, suspend/return,
  readiness/recovery and basic stock routes are integrated. A real stale HOME
  toolbar focus bug across power-cycle was fixed. The hidden accessibility
  Open Sound shortcut now selects Sound's tile before launch, so HOME returns
  to the correct tile after suspension (`00bb52d`, browser checked).
- A native settled Settings main lower capture compares at **1.177/255** mean
  RGB error after cold white focus, source Close footer and font raster fixes;
  its upper source render compares at **0.404/255** with matched clock. Health
  settled main lower compares at **0.0249/255**. These are bounded single-frame
  comparisons, not whole-app acceptance.
- Sound's settled empty-entry lower source render compares at **3.024/255**
  mean RGB error. The row label glyph mask is 775/775 and the red cursor arrow
  is 92/92 exact native RGB. Blue icon fill, footer, motion and playback of
  real songs remain open. No user song manifest has been supplied.
- The read-only Camera folder/photo path works in the browser, but live paging
  still jumps six cells. Existing gallery captures are source/site renders;
  there is no matched native Camera browse capture. The source replay reaches
  SceneBrowse factory allocation, not replacement/consumer publication.

At `b96a46e`, the full JavaScript suite reports **1,370 passed, 23 skipped,
one explicit TODO and zero failed**. Typecheck, production build and the
57-pair stock source-screen verifier pass with zero diagnostics. The production
browser at `http://localhost:3000/` was checked after the HOME shortcut fix;
the Sound → HOME return announces Sound and reports no warnings/errors.
These checks prove the stated paths, not 1:1 completion.

## Remaining work and acceptance gates

1. **HOME visible fidelity first:** bind the real title worker candidate and
   COMMON model through the native graphics service, render the first visible
   Settings banner pose and then other required app banners. Compare matched
   native/browser upper LCD frames, motion and input timing. Audit remaining
   lower-screen cursor/icon/toolbar differences. Do not publish an unverified
   banner just to fill the blank area.
2. **Stock UI:** continue Settings child navigation/motion and matched screens;
   Health article scroll and native article pixels; Sound blue icon fill/footer,
   first-run and playback UI; Camera native browse capture and smooth paging;
   eShop/Zone/Notes and helper paths. Each visible correction needs its source
   or matched capture and an integrated browser check. See the feature map for
   exact per-screen defects and source dependencies.
3. **Hardware and experience:** matched front/back/side/underside console
   photos against the exported browser model, lettering, headphone contacts,
   responsive framing, physical input and startup/power/launch timing. Source
   flag traces do not establish physical backlight order.
4. **Song handoff:** wire user-provided favourites into the existing manifest
   and verify actual playback/transport when supplied; do not invent tracks.
5. **Final deliverables:** editable sourced `.blend`, compact textured `.glb`
   and source/licence, Next.js/Three.js/VGPU project, original-resource UI
   delivery packs with provenance, eight portfolio apps, read-only Camera,
   supplied-song Sound, working power/app transitions, source/native/browser
   comparison evidence, updated architecture/process/feature map, passing
   tests/typecheck/build and an inspected browser result. Strict 1:1 requires
   pixel, motion, audio and input evidence for the reported scenarios; tests
   alone cannot close it.

## Repository and evidence handling

The integration worktree is
`/Users/paramveer/.codex/worktrees/3ds-ui-continuation`, currently
`codex/health-ui-scratch`. It is a sparse checkout: `model/` and parts of
`public/` appear deleted locally even though they remain in Git. **Never use
`git add -A` there**; stage explicit files only. The full Git commit tree is
the source for a fresh worktree. A verified portable bundle is kept at
`/Users/paramveer/.codex/attachments/firmware-ui-continuation.bundle` and must
be refreshed after the final handoff commit. Private firmware, executable
traces and comparison artifacts stay under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`
or the explicitly cited private Azahar screenshot path. Do not publish raw
firmware. The original repository has a different Git object store from the
integration worktrees; import a verified bundle/branch rather than assuming
the branch already exists there.

The former HOME banner and lower-residual workers were interrupted for this
handoff. Their isolated worktrees are preserved; uncommitted work from them is
not part of this checkpoint. Do not infer a complete fix from their status.
