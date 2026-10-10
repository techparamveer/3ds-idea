# Health retained Resume departure, 10 October 2026

## Scope and captured defect

Worker base `c058ec9d1bbab91b9dfb44c5edbec016eaf07c71`, assigned branch
`codex/health-resume-retained-20261010`, worktree
`/Users/paramveer/.codex/worktrees/health-resume-retained-20261010/3ds-idea`.
Initial source/tests `969b3676691c82c1b197882b212c8e074a7b2eb4` remain
immutable. The corrected source range ends at follow-up
`cf52bd57f0f922a50e473a660b7ef22819b49978`, independently approved by
a separate GPT-6.1 Sol high reviewer. Full checks/build and freeze follow
that source approval; browser/native recapture remains pending.
This is one Health-scoped retained-owner correction, not general Resume or
whole-flow completion. Every other application Resume route is unchanged
and unaccepted. Reducers, `system.ts`, `app-host.ts`, the scene input adapter,
public assets and the previous served tree/build are unchanged.

Private artifact roots used below:

- `N`: `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-home-order-20261010`.
- `R`: `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-resume-retained-20261010`.

The closed `N/browser-v1/offline-audit/report.md`, SHA-256
`2a7c4044ce4eff8dbfbf79d72cc53c791456d8e4117035b0b110f38cbbf410e7`,
seals chronological selection
`e623453b02816a7216507a13f47d19939a6a595f12b0dce1f02a8d1af8600e43`.
Ordinary Health touch launch, HOME, then actual footer Resume produces two
fully black paired LCD records, 311 and 312, then ready Health at 313.
Repeat Resume falls outside that export. The closed
`N/native-v1/offline-audit/report.md`, SHA-256
`112531b92b8212121eafdad55053e85f0e1b20731d4f5d4a595ad2a422354701`,
records sampled movie departure with lower Health visible through HOME while
the upper dialog remains, followed by retained dim Health expanding and
brightening. The movie is qualitative, lossy evidence. Sparse own PNGs do not
prove absence of native black frames between samples or native timing.

The later coordinator-only raw run closes in
`R/native-raw-v1/offline-audit/report.md`, SHA-256
`57ae4729a9592c07ecaf24f243e2987d50f8f7ceabbf534378286a153a06494a`.
Its 12 surviving own PNGs establish Resume feedback and a separate early
footer departure: `.17.48.52.354/.458` show a partly withdrawn footer;
`.511` has no footer while upper HUD/dialog and lower HOME tiles remain.
The post-HOME retained-dim pair and later expansion are missing from this
raw run. The coordinator's uncaptured observation remains an attestation.
No worker comparison, mask, pixel diff or capture was made. All four whole
flows remain fail/unaccepted; muted audio acceptance remains unverified.

## Red loop and diagnosis

`R/red-04.log` is the first behavior red. The actual compositor drives
ordinary touch Health launch, actual native Health acquisition/draw, HOME
through its receipt-backed lower terminal/footer lifecycle, and footer
Resume. The runtime correctly restores the same `health-safety:1` owner.
The actual native session reacquires after HOME inactivity, but its pending
black pair replaces both retained LCDs. The retained upper assertion fails.

The fixture runs `createScreens`, `createPortfolioGraphics`, native title
session/preparation, the Health source draw, firmware HOME composition,
decoded layout poses, original lower fade player, original BannerBG model
player, retained capture store and real input reducers. Only unavailable
Canvas/GPU transport, asynchronous asset transport and unrelated banner/chrome
services are substituted. Recording surfaces prove source dispatch, poses
and owner/receipt behavior; their marks are not GPU pixel evidence.

The three ranked hypotheses, sent to the coordinator before source probes,
were immediate loss of suspended presentation eligibility, pending native
reacquisition overwriting the retained pair, and a missing authored
SceneOut/AppRestart route. Inspection confirms the first two in the host
composition. Pinned caller inspection supports selecting the departure
resources for the third; it does not recover their live native epochs.

## Original caller and selected resources

Read-only inspection used the existing HOME `exefs/code.bin`, virtual base
`0x100000`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`,
at `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/home-pause-source/exefs/code.bin`.
The existing disassembly has SHA-256
`656187735b0ac3f3352e060308bf65ff54d0c460c581d6ee6c851cbaadd770b5`
at `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/folder-navigation/native-code.asm`.
No original ARM execution, new extraction or closed lower-release inventory
was performed.

The lower state branch at `0x2b7348` calls `0x2a2228`. That route waits for
the upper expanded predicate `0x2856a8`, the footer ready predicate
`0x25381c`, and controller `+0x3aa8` byte `+0x91` nonzero with byte
`+0x90 == 4`. The input writer for that numeric predicate was not recovered;
the Resume category assignment also uses the captured flow.

At `0x2a22ec` the lower pause layout is shown. `0x2a22f8..0x2a2304`
starts controller `+0xe2c`, whose constructor at `0x2b2afc..0x2b2b0c`
binds `LncPauseFade_D_00_SceneOut.bclan`, named at `0x2b2e20`.
The following lower state 9 at `0x2b735c..0x2b736c` rejects controller
statuses 1 and 2 before proceeding. This supports a departure terminal
barrier, not the browser's precise receipt mechanism.

`0x2a2320` calls upper departure `0x285458`. That function starts launcher
SceneOut at `0x28546c..0x285478`, BannerBG SceneOut through `0x24dab0`
at `0x28547c..0x285480`, AppRestart through `0x24da44` at
`0x285484..0x285488`, and HUD departure through `0x27c0b4` at
`0x28548c..0x285498`. BannerBG constructor bindings are `+0x54` for
SceneOut at `0x24db34..0x24db40` and `+0x64` for AppRestart at
`0x24db74..0x24db80`; resource names are at `0x24dbb4` and `0x24dc00`.
The HUD outgoing controller is `+0x94`. No arbitrary reverse of an opening
clip is used.

All new selected resources are HOME EUR `0004003000009802`, version 24576,
`CTR-N-HMMP`, content index 0, CIA-internal content `00000082`.

| Element and manifest key | CIA-internal source | SHA-256 |
| --- | --- | --- |
| Lower retained composition, `home.launcher/layouts.LncPauseFade_D_00` | `romfs/launcher_LZ.bin/blyt/LncPauseFade_D_00.bclyt` | `87acf2364346072552cc48761184e8b98f61b3f9231e57703af48808cf509f2e` |
| Lower departure, `home.launcher/animations.LncPauseFade_D_00_SceneOut` | `romfs/launcher_LZ.bin/anim/LncPauseFade_D_00_SceneOut.bclan` | `9880faca7e0caa8d3fa401cc8bfa59e823e1c33a36e1e2ce35d7d29fe0c834fd` |
| Upper dialog departure, `home.launcher/animations.LncBase_U_00_SceneOut` | `romfs/launcher_LZ.bin/anim/LncBase_U_00_SceneOut.bclan` | `ba54b2de5825ab966a6bfd1e480d84c4479510688b1e36a20336493afdb174e9` |
| Status departure, `home.hud/animations.HudMenu_00_SceneOut` | `romfs/hud_LZ.bin/anim/HudMenu_00_SceneOut.bclan` | `8aac97fa97651d5c021e2937e2fbeebb69aee6e8d884beb75314c6453cdff1e5` |
| Upper capture geometry/material, `models.homeBackground` | `romfs/3D/BannerBG_LZ.bin`, containing `BannerBG_SceneOut` and `BannerBG_AppRestart` | `27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711` |
| Decoded BannerBG container | Decoded CGFX with those named tracks | `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595` |

Layout converter is `ctr-native-web` 1.2.0; extractor is CTRTool 1.3.0.
Upper converter is `ctr-cgfx-web` 1.1.0, SPICA
`bd29a7828595d7839cda2ac61c76bb63f9071250`, wrapper
`6377be3d3670b6ed7c9bf6a947d0f3bd7c02a5970788d4f5f27446b8fa14fe1f`,
exporter `946ff91fae009fd667a66cf528e40e6b52ba2a76e04d7d1fe73da9c383ef258e`.
Rehashed unchanged delivered launcher, HUD and model files are respectively
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`,
`76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775`,
and `45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`.
Existing fonts, metadata, mask, textures and retained Health source pixels
keep their mappings in the [dimming](health-suspend-dimming-20261010.md),
[upper window](home-pause-card-alignment-20261008.md), and
[lower source](home-pause-lower-transition-20261008.md) handoffs.

## Implementation and explicit adaptations

The existing application capture store now exposes an owner-checked retained
read after the same application has resumed. Its suspended-only reader keeps
its original eligibility. `screens.ts` retains one accepted expanded Health
HOME source, keyed by application owner, capture generation, firmware
resource generation and its existing HOME origin. It is promoted only by the existing visible paired-LCD
receipt, never a diagnostic, hidden, failed or stale paint.

The origin includes existing navigation selection revision, container and
selected viewport, toolbar focus, runtime applet sequence and applet slots.
Source promotion and Resume receipts both revalidate it. Moving selection
away and back cannot revive an old source, even without an intervening paint;
the matching expanded Health source must receive a fresh pair receipt.
Toolbar and applet open/back context changes also invalidate it. A changed
origin retires the source on the next ordinary paint. HOME lid sleep preserves
an otherwise unchanged accepted origin. This correction covers only departure
from a completed, selected, expanded Health HOME composition. Physical HOME
can still resume Health from other HOME selections/toolbar/applet contexts,
but those routes retain their previous behavior and remain unaccepted; they
cannot replay a stale expanded-Health snapshot. No compact animation is added.

Resume keeps native acquisition and real Health composition active underneath
the departure. While covered, it suppresses application capture recording so
a prepared offscreen native pair cannot replace the retained source. Native
load/draw failure still publishes existing paired recovery and explicit retry;
the cover cannot hide it indefinitely. Replacement, power-off, firmware reset
and disposal retire the presentation and its source. No second application
state system or reducer side effect is introduced.

The original lower SceneOut frame 0..20 fades/scales HOME over retained dim
Health; frame 20..40 expands and brightens the retained lower capture, with
the original RGB and both UV scale channels. Upper launcher SceneOut and HUD
SceneOut use their original outgoing alpha/scale tracks. BannerBG uses its
original SceneOut geometry and full AppRestart RGB/UV tracks over settled
AppPause. Source track identities, bounds, slopes and all selected channels
are validated; decoded resources are never modified.

This host uses a **capture-supported source-phase adaptation**. The shared
departure phase advances one source frame per successful visible paired
receipt, not wall-clock duration. The upper/lower shared epoch and browser
cadence are not recovered native timing. HUD clamps at its original endpoint
20; the other departure sources end at 40. The decoded AppRestart curves
declare StartFrame 20 but contain local keys 0..20. Its material sample is
therefore `max(0, departureFrame - 20)`, preserving the authored delay and
local key domain. This is explicit source-phase normalization in this
presentation, not a change to the generic CGFX player or a claimed native
live clock offset. Reduced motion samples the authored endpoint.

A terminal cover releases only after frame 40 and the exact current complete
native pair share a visible receipt. Pending, hidden, diagnostic, revoked,
stale owner/resource and replaced native-pair receipts cannot release it.
Invalid pending destination receipts are discarded without spending an
accepted source frame. `stockStatus` remains loading until this barrier,
so the existing scene native-input gate blocks app-phase physical, keyboard
and touch dispatch. Existing HOME/B escape, recovery and retry remain active.

The source lower HOME texture is the last accepted full lower composition,
including its footer. **Separate Resume feedback/ChangeDw footer departure
is not implemented here.** The new raw `.511` evidence establishes that the
native footer can already be gone while both other HOME compositions remain.
This candidate therefore retains a known footer-stage mismatch and must not
be described as complete native Resume motion. The existing pause footer
lifecycle, two terminal holds, lower release and upper-first dimming map
remain unchanged. Other non-native elements are the existing capture padding
and slot assembly, status/calendar profile, reduced motion, source-phase and
paired-publication scheduling, and portfolio content. No non-native artwork
or sound is added.

## Historical checks before the transient correction

All logs are preserved in `R`. `red-01..03.log` are fixture setup failures;
`red-04.log` is the real black-pair behavior red. `green-01.log` passes the
first corrected compositor regression. `green-02.log` preserves 4 pass / 2
fixture assertion failures: native ready output uses a cached prepared pair,
and the fixture did not record bitmap recovery text. Correcting the recording
assertions does not weaken source or behavior checks.

`red-05-destination.log` preserves two real stale-pending presenter failures
when destination readiness changes between sampling and receipt. The fix
discards the mismatched pending candidate, preserving the last accepted frame.
`green-03.log` passes 8/8. `focused-01.log` passes 168/168. Final
`focused-02.log` passes 170/170, 0 skipped, across 16 files. It covers actual
ordinary launch/HOME/footer Resume, frames 0..40, capture identity, real
pending/ready/failure/retry, repeat ownership and fresh captures, actual input
dispatch through the existing gate, reduced/stalled/hidden/diagnostic/stale
receipts, native-pair revocation/reacquisition, all HUD channels, all lower
departure channels, and BannerBG geometry/tint/both UV validation. Existing
pause, lower release, window, close, input and native preparation checks pass.

Exact independent review then found a blocking stale-source lifecycle gap:
the initial implementation retained its old expanded Health source when
HOME selection or applet context changed. `red-06-origin.log` reproduces
actual touch selection-away followed by physical HOME with no intervening
paint, incorrectly replaying Resume frame 0. The source follow-up changes
only `screens.ts` and the live regression, retaining all earlier commits.
`green-04-origin.log` passes 13/13; `focused-03-origin.log` passes 173/173.
Final `focused-04-origin.log` passes 174/174 with no skips across the same
16 files. Added actual routes cover selection-away with and without a paint,
selection-away/back with and without a fresh accepted source, toolbar focus,
Friends open/back followed by physical HOME, and unchanged HOME lid sleep
then wake/Resume. Changed-origin routes explicitly assert no stale source
draw or acknowledgment. The original receipt/readiness/failure tests remain.

Focused command:
`node --test tests/home-resume-presentation.test.mjs tests/health-resume-retained-live.test.mjs tests/home-pause-window-entry-live.test.mjs tests/home-pause-window-entry.test.mjs tests/home-entry-motion.test.mjs tests/home-entry-motion-scene-policy.test.mjs tests/home-suspended-background.test.mjs tests/home-suspended-window.test.mjs tests/home-suspended-window-entry-policy.test.mjs tests/home-suspended-presentation.test.mjs tests/notes-suspended-capture.test.mjs tests/stock-screen-preparation.test.mjs tests/home-application-transition.test.mjs tests/system-home-application-transition.test.mjs tests/native-screen-input.test.mjs tests/home-hud-sample.test.mjs`.

`typecheck-01.log` preserves two initial local narrowing errors.
`npm run typecheck -- --incremental false` then passes in `typecheck-02.log`
and initial `typecheck-03.log`. Nonincremental typecheck also passes in
`typecheck-04-origin.log` and final `typecheck-05-origin.log` for the follow-up.
`git diff --check` and explicit staged-path
checks pass. Dependencies are a local APFS clone from the frozen prior
worker's node_modules, not a symlink. Only own source/tests were committed;
local STATUS reconciliation is unstaged. Every finite command is reaped.

Source-identified, delivered, implemented and focused-tested evidence is
reported separately from browser/native comparison. At this historical
checkpoint, exact independent review of `c058ec9..a03504e` was pending. Full tests, production build and any new shader supporting check
have not run for this candidate. No browser, server, Azahar, system volume or
other worktree was operated or modified. The previous source/public/tests and
served `.next` stay frozen. Normal service speed cannot be verified by tools.

After exact independent source approval, the coordinator may authorize full
checks/build and freeze. Coordinator-only muted MacBook first/repeat ordinary
Health HOME/Resume recordings then determine visible progress. Native
footer-only departure, exact retained bounds/softness, RGB/pixels, live epochs,
cadence, input equivalence, shortcuts, all other apps and audio remain open.
Passing source checks does not accept any whole scenario.

## Transient-source correction, 10 October

Replacement worker GPT-6.1 Sol high commits source/tests as `cf52bd5`,
following immutable origin correction `a03504e` and handoff `31b1687`.
Only `src/os/screens.ts` and `tests/health-resume-retained-live.test.mjs`
change in this correction. No native resource, reducer, scene, asset or audio
change is introduced. Local STATUS reconciliation remains unstaged.

The compositor now samples and promotes a Resume source only when existing
HOME gesture, navigation motion, input contact and tile control activity have
settled. The receipt rechecks that eligibility. Transient input cannot replace
the preceding accepted source. Its stable origin and existing owner/capture/
resource generation checks remain unchanged, so an ordinary footer down paint
keeps the accepted source until release instead of retiring it on pointer down.
Existing tile widgets must be idle with retired controllers and no pressed
pose before a new source can be accepted. Moving/pickup/drop behavior is not
implemented or accepted by this slice.

`R/red-07-transient.log` preserves three actual compositor failures on the
preceding source: a pressed/canceled lower texture marker 201, a pending
source promoted under footer contact marker 202, and an actual footer
down/up texture marker 203 each replaced the previously accepted marker 127.
These tests use real system touch/physical HOME dispatch and inspect the
texture passed to the lower departure compositor. No HOME repaint intervenes
between cancel or footer release and physical HOME/Resume.

`green-05-transient.log` passes 14/15 with one fixture limitation in a legacy
grid up-out route. That route exposed a missing ordinary title icon when it
continued through legacy tap behavior. The final up-out case uses actual
footer down/up-out; grid press/cancel remains covered. `green-06-transient.log`
passes 15/15. `green-07-controls.log` also passes 15/15 after adding the enabled
controls path from ordinary queued tile launch through real native update
polls, HOME, footer down paint and up. The fixture supplies complete registered
title-icon metadata, retaining the existing stand-in raster and renderer.

`focused-05-transient.log` preserves a motion-fixture setup failure: its
density change moved the viewport origin, which correctly retired the source.
`focused-06-transient.log` preserves the next fixture setup failure, an
uppercase title ID key where the real ordinary-icon reader expects lowercase.
The final fixture uses the native reader's lowercase keys and existing
`setHomeDensity`/`settleHomeNavigation` operations at density 3 to 4 and back,
with the same stable viewport. It verifies that neither a motion paint nor a
pending stable source receipt under motion can replace the accepted texture.
No motion state is fabricated and no native cadence is inferred.

Final `R/focused-07-transient.log` passes 178/178, no skips, across the same
16 files listed above. `R/typecheck-06-transient.log` passes nonincremental
typecheck. Whitespace and explicit staged path checks pass. All finite
command handles are reaped. A separate GPT-6.1 Sol high reviewer approves
exact source range `c058ec9..cf52bd5`, independently passing 178 focused and
124 supplementary checks with one unavailable-private-fixture skip, plus
nonincremental typecheck. Full tests, shader supporting check, production
build, GLB preflight and freeze are now authorized and in progress.
The worker has not operated a server, browser or Azahar. The old production
build remains frozen. Separate native footer departure, retained bounds and
pixels, native clock/cadence, input equivalence and muted audio remain open;
this source correction establishes no native scenario pass.
