# Verification and evidence architecture

The **isolated Azahar profile running the user's EUR 10.7.0-32E firmware** is ground truth for in-scope software screens. A scenario is accepted only after the coordinator operates Azahar and the integrated production browser with identical inputs, captures both raw LCD outputs, diffs them, inspects the side-by-side sheet and resolves every unexplained difference. Tests, source traces, source renders and browser operation are supporting evidence. Hardware appearance has a separate matched-photograph/browser-model gate.

| Tier | Establishes | Does not establish |
| --- | --- | --- |
| Implemented | The integrated path exists | Visual correctness |
| Tested | Bounded code, resource or shader contracts | Integrated pixels or timing |
| Browser-inspected | A named production-browser route was operated and seen | Native equivalence |
| Source-identified/rendered | A resource or bounded original-code behavior | A live native/browser match |
| Native-compared | Azahar's own capture or audio directly paired with raw production-browser output at a named state | Other states or whole-title fidelity |

## Isolated reference

The [1 October HOME CTM diagnostic](../home-ctm-live-replay-2026-10-01.md)
adds a coordinator-only replay path: short `-p` on the pinned macOS executable,
independent stopped seed clones, explicit eight-sample holds/releases, verified
Sidecar placement and volume0. The [measured follow-up](../home-input-comparison-2026-10-01.md)
repeats the final native launch outcome and exercises trusted browser down/up
events, but exact timing, native initial-title rendering and pixel/phase parity
remain open. Long `--movie-play` is rejected by this binary's outer parser.
Native EOF opens a blocking completion modal. Resolve it before further menu
work, or capture/quit before EOF; a status label is not proof it was dismissed.
Quitting inside it left one owned clone waiting in `ShutdownGame`.
The [subsequent reselection run](../home-friend-motion-comparison-2026-10-01.md)
captured before EOF and exited0. Initial Notifications again rendered only `N`,
but Left/Right restored its full label. Use that named reselected capture for
normal label comparisons; do not silently replace the startup anomaly or infer
its cause. Friend live hosted counters now appear in raw capture metadata;
matching one browser counter across builds does not establish the native epoch.
Treat older repeated-host-key methods below as historical diagnostics, not
evidence that event cadence matches the browser.

The [Notifications follow-up](../home-news-motion-comparison-2026-10-01.md)
adds News hosted counters and a byte-identical Friend counter250 regression;
native phase remains unaligned. Its footer memory diagnostic could not save
state with LLE enabled. Pinned RPC/GDB servers bind wildcard addresses and
expose unauthenticated writes: leave disabled, not an implicit fallback.
Delayed menu tracking can outlive a Quit request; verify process exit and inspect
the exact owned process before recovery. Native modal placement can differ from
the main window: independently verify/move each dialog to Sidecar before input.

Browser replay can reuse the repository CDP client on an already verified
Sidecar tab. Real key/pointer down/up events and a read-only observer establish
delivered event timestamps/trust. Schedule releases from dispatch deadlines,
not after acknowledgements, and report measured durations. Neither DOM
timestamps nor the presentation-only `captureScreensAt` elapsed/date parameters
establish native HID sampling or a shared animation clock. Keep the app muted;
audio acceptance remains open.

The [2 October live check](../home-live-verification-2026-10-02.md) confirms the
integrated background host's browser clock/paint behavior, with a bounded
retained-native margin match but failing full LCDs. Its Health CTM reached main;
manual HOME attempts did not reach HOME. Pinned Azahar polls APT HOME at 16666us,
separate from 234Hz HID/CTM polling. Requested host key counts are not native
notification counts or measured holds. The native EOF modal was resolved on
Sidecar and normal shutdown exited 0; neither remains a live wait. Use native
Capture Screenshot/Qt macOS Command+P; F12 is not verified for that profile.

The [HOME Settings capture](../home-design-native-comparison-2026-10-02.md)
uses a verified seed clone and CTM toolbar touch to open Design. It establishes
the missing lower Save/Load Layout section and supports the source upper-caption
correction, not matched browser input or animation epochs. Caption121 pixels/max4
still fail. The separate Health APT-debug run has no logged inquiry/jump and no
visible HOME return; absent log calls alone do not prove host input was absent.
Its process is closed. Browser-only Settings regression sheets are explicitly
not native acceptance evidence, even when the comparison reports zero error.

Use the current isolated copy under `/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/` on the Sandisk APFS sparsebundle. The prior DeveloperStorage copy and the user's original reference remain preserved. Never launch `/Applications/Azahar.app` or touch the default profile. Before each launch, verify copied executable SHA-256 `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`; no symlinks under isolated `user/`; and `user/config/qt-config.ini` values `use_custom_storage=false`, `graphics_api=2` (Vulkan for this Apple build), both resolution factors 1, `layout_option=0`, `swap_screen=false`, and screenshot path inside the isolated reference. Back up config before edits and version the working config with date/hash. Launch the copied app with its adjacent `user/` profile. After boot, verify the actual backend in `user/log/azahar_log.txt`; the 2126.1.2 macOS build rejects `graphics_api=1` and falls back to Vulkan, so a config value alone does not prove the renderer. Record original-3DS mode, EUR/English, white HOME theme, clock policy and photo/song population in the scenario matrix. See [profile isolation](../native-reference-profile-isolation.md).

Click Azahar before keyboard input. The isolated map uses A=`A`, B=`S`, HOME=`B`, START=`M`, SELECT=`N`, L=`Q`, R=`W`, D-pad up/down/left/right=`T`/`G`/`F`/`H`; read X/Y/Circle Pad from config. Prefer configured `touch_from_button` keys at 320×240 lower-LCD coordinates. Both `profiles\\1\\use_touch_from_button=true` and `profiles\\1\\use_touch_from_button\\default=false` retain those keys. Edit config only while Azahar is closed. Calibrate any mouse touch from a window screenshot and confirm it landed. The coordinator recovered native key input with CUA `typeText` using repeated characters; a single press was too brief for the controller poll. Record repetition and resulting state rather than treating one character as one frame. Look after **every** input; fix lost focus, dialogs or black frames before continuing. Frame-advance motion at explicit counts. Record audio capture method or leave audio open.

## Native capture, browser capture and diff

1. Use Azahar's own Capture Screenshot command for a **400×480 PNG**. Crop upper `(0,0,400,240)` and lower `(40,240,320,240)`, verifying offsets against a known screen. Window grabs and computer-use screenshots guide navigation only.
2. Run `npm run build`, then start the integrated build with `LCD_CAPTURE_OUTPUT_ROOT=/absolute/private/artifact/root npm run start:verify` for normal production verification. This binds the local capture endpoint to `127.0.0.1`. A Next development server bound to `0.0.0.0` may normalize its internal request URL to the wildcard address; the capture endpoint accepts that form only when the explicit Host and Origin headers both match a loopback origin. Capture raw upper **400×240** and lower **320×240** render targets. A scaled page/console screenshot is not a comparison input. The Experience lane owns a verification-only raw LCD capture hook if needed.
3. The Assets lane owns `scripts/native-compare/` with a parameterized output root. Each pair/mask yields per-LCD mean/max RGB error, count of pixels with any channel delta greater than 2/255, connected difference regions and bounding boxes, heatmap, side-by-side sheet and JSON with both SHA-256s, commit and scenario ID.
4. **Open the side-by-side sheet.** Fix unexplained regions and repeat both captures after integration. Masks require named reasons and may cover only intentional clock/battery, portfolio content, read-only Camera footer, inert OK and other [feature-map](../feature-map.md) adaptations. A mask created merely to pass a diff is a defect.

Store a versioned scenario matrix under the private artifact root (currently on the home disk at `/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v63/matrix.json`); bump the version when entries change. Each entry records ID, title/version, entry state, exact keys/touches/frame counts, clock sampling, native and browser capture paths/hashes, mask, latest diff report and status `pass`, `fail`, `adaptation`, `source-gap` or `blocked`.

The historical `sound-first-run-span-mounted` browser capture JSON was
overwritten. Matrix v17 marked it unavailable; v25 preserves that repair and links an upper PNG recovered
pixel-for-pixel from the preserved contact sheet, an unchanged lower PNG and a
reproduced failing diff. This repair cannot replace a complete fresh capture
pair for acceptance.

The first whole-scenario acceptance targets remain **matched HOME idle** and
**Settings → Other Settings page 1**. [Matrix v58](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v58/matrix.json)
has 117 failing entries, **all
whole scenarios remain unaccepted**. Through integration `8c0a6d7`, production Health Usage
initial, Health Usage scrolled 8px and Settings Other page 1 have unmasked static
two-LCD pixel-tier matches, maximum delta 2. HOME Settings's independent yaw304 / COMMON303
diagnostic still has **222 upper / 36,258 lower** pixels above 2/255; the coupled
304 control has 1,883 / 36,358. This static sample does not establish a live
one-frame clock offset. See the [current report and capture links](../progress-2026-09-24.md#matrix-v45-independent-home-pose-diagnostics--26-september-2026).
Static matches and explicit phase/calendar samples do not prove identical input,
a recovered native event clock, ±1-frame motion or audio onset. HOME idle still
lacks a matched-input acceptance score. The old scaled Settings JPEG/source
render remains non-acceptance evidence.

Sandisk1 has space again. A byte-verified copy of the isolated app/profile now
runs inside a growable APFS sparsebundle on Sandisk1, and Azahar's screenshot
command writes there. Preserve the original and default profiles. The latest
Settings page 1 and page 2 pairs use fresh native PNGs from that mounted copy;
their distinct title-entry and input routes still prevent a whole-scenario
pass.

The isolated native Camera fixture contains two Camera-created photos sourced from the existing Renu image. The browser now renders a six-cell View Photos browse with native `P_BrwsMenu_D` Slideshow/Shoot/Settings and `P_BrwsBase_D` zoom chrome, but the latest populated pair still differs by **95,350 upper / 23,052 lower pixels over 2/255**. It compares two native stereo MPO fixture photos with five mono portfolio JPEGs, different date folder/selection/chrome and unmatched input. `cc4e383` now follows executable mono contain/no-upscale; the preserved stereo fixture has a different native fit branch, so this diagnostic cannot judge mono photo fidelity. Earlier Camera first-run/empty/populated pairs are preserved diagnostics, not gallery acceptance. The exact source `C_SldH_S` slider now renders at the source parent anchor; its browser paging → Rate mapping and static Parakeet phase are adaptations. Shoot and zoom remain inert under the read-only gallery scope. See the [Camera evidence update](../progress-2026-09-24.md#camera-mono-source-diagnostic-and-sound-strip-finding--26-september-2026). The fixture is private verification data and does not add product capture/editing. Nintendo says only photos created with 3DS Camera can be used on the system ([support](https://en-americas-support.nintendo.com/app/answers/detail/a_id/674/p/605)).

The later [Camera v46 checkpoint](../progress-2026-09-24.md#camera-source-colours-and-five-page-welcome--26-september-2026) applies original message-style colours to browse labels and renders the five-page Welcome route from published Camera resources. Its populated-browse diagnostic is **95,350/22,856**; page-1 Welcome versus preserved native is **1,387/7,026** raw upper/lower pixels above 2/255 with empty masks. Both still fail whole-scenario acceptance. The guide's underlying shoot scene, upper HUD icon treatment, native input route and later page timing/audio remain unresolved.

Matrix v47 adds browser-only Welcome pages 3 and 4 after the original MSBT red
text spans were rendered. Their raw 400×240 and 320×240 canvases were inspected;
no native page-3/4 captures or pixel reports exist. The published source CGFX
shoot environment is not yet composed under the guide.

Matrix v48 adds the page-1 regression and source-CGFX-underlay diagnostics.
The regression is pixel-identical to the previous browser page 1. The CGFX
slice lowers RGB MAE from 8.2033 to 7.2603 on the lower LCD, but the count
above 2/255 stays **7,026**. Source 2D shoot controls and their attenuation
remain unresolved, so the whole scenario still fails.

Matrix v49 adds the source `P_Shoot_D` 2D layout with a documented held clip,
named theme slots and capture-fitted half-brightness. The page-1 lower
diagnostic improves from 7,026 to **2,690** pixels over 2/255 (RGB MAE 7.2603
to **2.6580**); upper remains **1,387**. A missing BtnIOcam top child and
border/grid residuals are visible in the inspected contact sheet. Native
input route, motion and audio remain unmatched.

The eight v25 browser-only records cover selected HOME banners, Zone entry and eShop close. Their target native capture, mask and diff fields are null. The latest two at `8f0eb39` show eShop bags/logo/shadow and Camera photo cards after explicit source Color-presence metadata and provisional source-diffuse binding. Earlier blank/missing mesh records remain unchanged. All eight remain `fail`: visible browser correction is not native shader/pixel acceptance. The earlier relaunch stopped at a notification; that input block was subsequently cleared for Settings. See the [browser correction checkpoint](../progress-2026-09-24.md#browser-absent-color-correction-and-native-input-gap--26-september-2026) and [native Settings recovery](../progress-2026-09-24.md#native-settings-input-recovery--26-september-2026).

Matrix v26 preserves the 40 v25 records and adds browser-only Notes grid and
Miiverse initial captures. Both have null native, mask and diff fields and remain
`fail`. The coordinator inspected both raw LCDs: Miiverse at `255fd30` now has
source title/BG/toolbar and an unpopulated interior after invented text removal.
Its empty interior is a documented source gap and local adaptation, not an
accepted native empty screen. The earlier Raise/repeated-E attempt left Azahar’s
HOME notification visible; later repeated-E input activated the lower touch
target and opened native Settings. That recovery has no Miiverse counterpart.
No notification screenshot is a Miiverse comparison target. See
the [Miiverse checkpoint](../progress-2026-09-24.md#miiverse-empty-interior-browser-checkpoint--26-september-2026)
for capture hashes, provenance and remaining adaptations, and the
[Settings recovery](../progress-2026-09-24.md#native-settings-input-recovery--26-september-2026).
Those historical Settings main and Other Settings page 1 pairs lacked matched
input and had residual pixels. The later page-1 pixel-tier match above supersedes
that pixel result; full input and motion/audio acceptance remain open.
See the [recovered Settings comparison](../progress-2026-09-24.md#recovered-settings-browser-comparisons--26-september-2026).

The browser now renders Sound's three-page first-run guide using delivered source resources. An earlier page-1 pair uses selected HOME Sound + A in both environments and differs by **15,639 upper / 6,579 lower pixels over 2/255**. Source counter messages and shared pane anchors reduced the lower diagnostic to 6,267. After the source Span mount and Base adaptations, `139df79` fits only three title material registers to captured blue `(41,113,238,255)`, removing 8,910 upper over-threshold pixels and yielding the latest **6,627 upper / 6,267 lower** pixels over 2; that pair has different HOME navigation prefixes. The body text is within the pixel threshold; title band, waveform sampling, birds, footer and other residuals remain. The title blue, Base blue, opaque alpha and edge fit are capture-derived visual adaptations, not a native-material claim. The source character frame/bird mount is evidence-best at zero offset. The settled `Record & Edit Sounds` pair still fails at **15,793 / 16,021**. Browser first-run persistence is not firmware-backed. The earlier matched-A pair establishes only that entry input reaches the same page; these counts do not establish complete input, animation or audio parity. The old 1229×768 JPEG Settings grab against a source render is not acceptance evidence.

`captureScreensAt` forces an explicit presentation sample without advancing
host state. It is available in development and in a production build served on
loopback with `?lcdCapture=1`; see [browser LCD capture](../browser-lcd-capture.md).
It exports the 400×240 upper source canvas and 320×240 lower canvas as PNGs,
before the upper source is stretched to the 800×240 display texture.
The opt-in local production verification route has been exercised through a CUA click and saves the exact JSON payload and both PNGs
under the private artifact root when `LCD_CAPTURE_OUTPUT_ROOT` is set. It is gated to loopback with `?lcdCapture=1`; keep it invisible to visitors.
`captureNativeBanner` remains development-only. Source phase samples for the
HOME Settings balloon show a dynamic pose, but no frame-aligned native motion
pass. A sampled pose does not prove that live input reached it with native timing.

## Coverage and pass rule

Cover HOME idle, cursor/rapid retarget, each in-scope selected stock banner, folder open/close, pickup/drop, stock and portfolio launch/return, Settings main/subpages/Language scroll/helpers, Health entry/key/drag, Camera empty and populated gallery/paging, Sound empty/first-run/transport, eShop wait/exit, Zone, Notes, Friends, Notifications, local Browser/Miiverse, amiibo opening, HOME suspend/return and power off/on. Add frame checkpoints for each motion. Excluded keyboard, other stock titles, network/accounts and Camera capture/editing are not matrix work.

A settled or motion frame passes when, after valid masks, **zero pixels** have a channel delta over 2/255, or every remaining connected region has a verified cause and explicit user acceptance. Transition boundaries match within ±1 frame at 60 Hz; identical inputs reach identical screen/selection state; each native cue has the correct identity and onset within ±1 frame. The coordinator inspects the contact sheet. Low mean error with unexplained regions fails. Missing audio capture leaves audio open; the empty song manifest cannot prove playback.

For each failure, give the owning lane the capture pair, diff regions, likely native resource/binding and required pass condition. Review and integrate its commit, rebuild/restart the production server, recapture/re-diff, and rerun previously passing scenarios sharing changed code. Continue until every in-scope matrix entry is `pass` or a reasoned `adaptation`, `source-gap` or `blocked` with evidence. Storage EIO or browser admin-policy blocks must be reported; they do not lower the evidence standard.

## Integration record

Record implemented, tested, browser-inspected and native-compared separately, plus build commit, inputs, capture hashes/paths, mask, diff report, cue evidence and residuals in [progress](../progress-2026-09-24.md) and [feature map](../feature-map.md). Source fixtures identify synthetic owners/callbacks. The user's dump is the only native visual/audio source. Each visible or audible native element needs an element → manifest key → decrypted dump-source mapping, with title/version, content index, CIA-internal path, SHA-256 and converter version. Audit this mapping and list every still non-native element at each handoff. Portfolio tile art/text/photos, the read-only Camera footer, inert actions and local Browser/Miiverse content are user-scoped adaptations; keep their reasons explicit. They do not authorize masking unrelated native pixels or replacing native fonts/sounds. Keep raw CIAs, executables, tickets and Azahar captures private. Documentation edits need link validation and `git diff --check`; runtime/asset edits need relevant tests, typecheck, build, shader and provenance checks. Those checks never change native comparison status.

Current Settings residuals at `94463cd`: Other page 1 **1,477 upper / 3 lower**, main **59 / 20**, empty masks, all fail. Source row widths first reduced Other lower 702→45; horizontal glyph half-pixel boundary ownership reduced 45→3. The three lower pixels are at `(129,168,1,3)`. Native/browser HOME prefixes differ; motion/audio remain open. See the [production checkpoint](../progress-2026-09-24.md#settings-row-width-and-font-boundary-production-checks--26-september-2026) for all four pairs, hashes, overflow storage and integrated checks.

Latest `600bf6f` static Other Settings lower LCD has zero pixels above 2/255 (maximum delta 2, mean 0.15514323), with no mask; it is not byte-identical. Other upper remains 1,477 and main 59/20, so all scenarios remain fail. Source float32 glyph endpoints resolve the prior three lower pixels; motion/audio and full-session input parity remain open. See [v32 production evidence](../progress-2026-09-24.md#settings-float32-endpoint-production-check--26-september-2026).

Production `7221619` preserves Other Settings **1,477/0** and main **59/20** after independent Opus review moved float32 endpoint rounding into writer coordinates before pane translation. Matrix v44 retains the history, empty masks and failing whole-scenario status. The odd-second main probe has identical PNG hashes and is not an improvement. Full suite: **1,414 pass / 0 fail / 23 skip / 1 TODO (1,438 total)**; typecheck/build/shader pass. See the [review and production checkpoint](../progress-2026-09-24.md#writer-local-glyph-endpoints-independent-review-and-production-regression--26-september-2026).

Health entry live frame 198 now has **0/0 pixels above 2/255** after the capture gate and one-pass rotated-picture raster, versus 258/0 before. This single static checkpoint is not byte-identical (maximum delta 2) and does not establish matching launch inputs, motion/audio, articles or CUA key-hold/frame parity. Offline mean 4.137→4.872ms, after p95 6.140ms; browser FPS unvalidated. See the [production checkpoint](../progress-2026-09-24.md#health-live-frame-198-and-rotated-picture-raster--26-september-2026).

Fresh HOME Settings diagnostics at `692c444` retain unmatched/unrecorded input prefixes and unknown native phase. The live pair is 65,074/36,196; synthetic source frames 150/450/136 yield 64,094/36,480, 64,076/36,429, 64,064/36,194 respectively. The later native burst shows a broad settled icon row; the earlier compressed snapshot does not justify a constant projection fit. These source-pose probes do not establish runtime timing or acceptance; see the [v35 evidence](../progress-2026-09-24.md#fresh-home-settings-and-synthetic-source-poses--26-september-2026).

Settings owner-scoped HUD production `f083291` leaves **21 upper / 20 lower** pixels above 2/255. HOME constant projection fit `cfefa16` regressed the settled view and was reverted in `ba0b8d5`; the restored live HOME pair is **56,631 / 36,088**. The genuine twelve-frame native burst retains a broad icon row while the wrench rotates. These empty-mask diagnostics remain `fail`, with unmatched input, unknown phase and open motion/audio. See [v36 evidence](../progress-2026-09-24.md#settings-hud-and-restored-home-projection--26-september-2026).

Production `ba0b8d5` with synthetic `lcdBannerFrame=309` gives **56,409 upper / 36,358 lower** pixels above 2/255. Offline native silhouette fits suggest the existing approximately 600-frame/10-second turn, but no native frame counter or matched activation boundary is established. `captureScreensAt(elapsedMs,date)` repaints without advancing live banner clocks. The pose improves orientation only; runtime timing, shading, profile/input and audio acceptance remain open. See [v37 diagnostic](../progress-2026-09-24.md#home-settings-synthetic-frame-309--26-september-2026).

Production Settings glyph ink correction `87dc835` leaves **2 upper / 20 lower** pixels above 2/255 when the displayed minute matches. HOME frame309 with view-normal sphere mapping at `03b2d31` leaves **53,454 / 36,360**. Both use empty masks and remain fail; the HOME pose is synthetic and Settings inputs are semantically HOME→A but unsynchronized. See [v38 evidence](../progress-2026-09-24.md#settings-sphere-mapping-production-diagnostic--26-september-2026).

Other Settings page 1 at `20ec43e` now has the same semantic **HOME selected Settings → A → Other Settings touch** route in native and browser, with **1,312 upper / 0 lower** pixels above 2/255 and no mask. The lower frame has maximum delta 2, not byte equality. Upper title/icon residuals and two HUD pixels remain; held A timing, ±1-frame motion and audio are unverified. Input tier and whole scenario remain fail. See [v39 route evidence](../progress-2026-09-24.md#other-settings-page-1-shared-home-route--26-september-2026).

Health HOME→A launch at live browser frame156 now has **0/0** pixels above 2/255 (maximum 2, empty masks); the semantic launch route matches, but literal selection/hold history and native elapsed/frame alignment do not. Pixel tier passes for this frame only; whole scenario fails. Independent HOME wallpaper 337/wrench 309 sampling gives **6,194/36,419**; Settings source-centering recapture gives **1,312/0** but paints retained 04:41 despite 04:31 metadata, so no centering production outcome is established. See [v40 evidence](../progress-2026-09-24.md#health-home-launch-and-independent-phase-diagnostics--26-september-2026).

The [Health burst](../health-home-launch-motion-2026-09-26.md), recorded by Experience in `1fcde650`, fits four native screenshots at 04:44:03.531–04:44:06.567 to phases modulo 360 of **144, 204, 265, 326**, each with zero upper pixels above 2/255. Increments **60/61/61** across **1.001/1.016/1.019 seconds** are consistent with the existing approximately 59.826 Hz rate. A production browser follow-up at `9539e1c` captured each observed phase: all four raw upper/lower pairs have **0/0** pixels above 2/255 with empty masks and maximum delta 2. The saved native PNGs have valid lower pixels; the earlier transient black-buffer observation did not apply to these saved files. Each browser launch deliberately waited for the chosen phase. Filename timing is not a shared emulated event clock; visible half-cycle, capture latency and launch origin remain ambiguous. This supplemental set does not establish free-running browser motion, exact input or ±1-frame/audio acceptance and does not change the whole-scenario matrix status.

The `0ad8efd` production calendar replay now paints the requested Other Settings date and gives **17 upper / 0 lower** pixels above 2/255. Health Usage at live frame327 gives **0/146**, with all lower residuals in Back footer; Settings main calendar regression gives **171/20**, including 169 upper HUD phase pixels and two date pixels. All remain whole-scenario fail. Footer patch `734468d` is integrated but has no production recapture in this evidence set. See [v41 diagnostics](../progress-2026-09-24.md#calendar-replay-and-health-usage-production-comparisons--26-september-2026).

Latest diagnostics give Health Usage footer **0/22**, Other Settings bottom edge **9/0**, and HOME with an explicit HUD source pose **3,744/36,318** pixels above 2/255. Health scroll input mismatch gives **16,595/13,837** after one browser Down; two Downs align the article at 8px but retain **24,828/73**, with upper animation unphased. All whole scenarios fail. Capture-fitted text adaptation `b5543c4` awaits production recapture. See [v42 evidence](../progress-2026-09-24.md#footer-hud-and-scroll-production-diagnostics--26-september-2026).

Health Usage initial and 8px-scrolled frames each now have unmasked **0/0** pixels above 2/255, maximum delta 2; only their pixel tiers pass. Other Settings coverage-fit gives **2/0** and diagnostic HOME coin97 gives **3,563/36,071**. Native held/repeated Down versus two discrete browser clicks remains unmatched, and live frame8 does not resolve the source8/368 ambiguity or absolute timing. All whole scenarios fail. Capture endpoint requires a loopback-bound production start. See [v43 evidence](../progress-2026-09-24.md#scrolled-health-two-lcd-threshold-checkpoint--26-september-2026).

Fresh Sandisk-backed System Settings main capture and production browser pair at `ec2c14c` reproduce **0 upper / 20 lower** pixels above 2/255 with an empty mask. The browser was visibly on Settings before capture; an earlier accidental HOME capture was discarded. Azahar used Recent Files while the browser used HOME Settings → A, so input/motion/audio remain unmatched. The 20 lower coordinates reproduce the existing source gap; no unproven edge rounding was shipped. See [matrix v59 evidence](../progress-2026-09-24.md#sandisk-system-settings-main-production-pair--26-september-2026).

A fresh Sandisk Other Settings page 1 pair from the same production build has **0/0** pixels above 2/255, maximum delta 2, with an empty mask and inspected contact sheets. Native Azahar entered Settings from its game list while the browser entered from HOME, so this is static pixel-tier evidence only; the whole scenario remains fail. See [matrix v60 evidence](../progress-2026-09-24.md#sandisk-other-settings-page-1-production-pair--26-september-2026).

The next fresh Sandisk Other Settings page 2 pair has **0 upper / 3,558 lower**
pixels above 2/255 with an empty mask. The lower residual is concentrated in
the left page arrow (3,543 pixels); both contact sheets were inspected. This
pixel tier fails pending a source-supported arrow correction. Native mapped
touch I selected page 2; the browser used physical Right, so input, motion and
audio remain open. See [matrix v61 evidence](../progress-2026-09-24.md#sandisk-other-settings-page-2-production-pair--26-september-2026).

Fresh page 3 and 4 pairs extend that finding. Page 3 has **169 upper / 3,247
lower** pixels above 2/255; page 4 has **169 / 6,702**. Both upper residuals
are battery/clock phase. The left page arrow dominates both lower residuals,
and page 4 has a browser-only right page arrow. No mask was used. Both pairs
remain pixel-tier and whole-scenario failures. See [matrix v62 evidence](../progress-2026-09-24.md#sandisk-other-settings-pages-3-and-4-production-pairs--26-september-2026).

After integrating the source-backed adjacent-page and ScrollBg correction,
production-browser recaptures with numbered page-tab touches give page 2
**0/960**, page 3 **169/8**, and page 4 **169/35** upper/lower pixels above
2/255. All contact sheets were inspected without masks. The page-2 lower
left-edge overlap remains unresolved; page-3/4 upper differences are battery
and colon phase, and their lower rows retain small edge differences. All
pixel and whole-scenario statuses remain `fail` in [matrix v63](../progress-2026-09-24.md#integrated-other-settings-page-edge-recapture--26-september-2026).

Other Settings page1 now has an unmasked **0/0** pixel-threshold checkpoint at `1f7a854`, maximum delta 2, after source-sheet identity/order preservation. Diagnostic date 03:31:10Z at elapsed 12000 aligns the native sampled HUD state; literal screenshot time 03:31:13.302Z instead exposed 169 battery/colon phase pixels. This is pixel-tier acceptance only; navigation/input, motion and audio remain unresolved, so the whole scenario fails. See [v44 evidence](../progress-2026-09-24.md#other-settings-source-sheet-order-two-lcd-checkpoint--26-september-2026).
