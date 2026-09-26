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

Use only the copy under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/`. Never launch `/Applications/Azahar.app` or touch the default profile. Before each launch, verify copied executable SHA-256 `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`; no symlinks under isolated `user/`; and `user/config/qt-config.ini` values `use_custom_storage=false`, `graphics_api=1` (OpenGL), both resolution factors 1, `layout_option=0`, `swap_screen=false`, and screenshot path inside the isolated reference. Back up config before edits and version the working config with date/hash. Launch the copied executable directly with `reference/` as working directory. Record original-3DS mode, EUR/English, white HOME theme, clock policy and photo/song population in the scenario matrix. See [profile isolation](../native-reference-profile-isolation.md).

Click Azahar before keyboard input. The isolated map uses A=`A`, B=`S`, HOME=`B`, START=`M`, SELECT=`N`, L=`Q`, R=`W`, D-pad up/down/left/right=`T`/`G`/`F`/`H`; read X/Y/Circle Pad from config. Prefer configured `touch_from_button` keys at 320×240 lower-LCD coordinates. Both `profiles\\1\\use_touch_from_button=true` and `profiles\\1\\use_touch_from_button\\default=false` retain those keys. Edit config only while Azahar is closed. Calibrate any mouse touch from a window screenshot and confirm it landed. The coordinator recovered native key input with CUA `typeText` using repeated characters; a single press was too brief for the controller poll. Record repetition and resulting state rather than treating one character as one frame. Look after **every** input; fix lost focus, dialogs or black frames before continuing. Frame-advance motion at explicit counts. Record audio capture method or leave audio open.

## Native capture, browser capture and diff

1. Use Azahar's own Capture Screenshot command for a **400×480 PNG**. Crop upper `(0,0,400,240)` and lower `(40,240,320,240)`, verifying offsets against a known screen. Window grabs and computer-use screenshots guide navigation only.
2. Run `npm run build`, restart `next start`, and operate that integrated build with the same inputs. Capture raw upper **400×240** and lower **320×240** render targets. A scaled page/console screenshot is not a comparison input. The Experience lane owns a verification-only raw LCD capture hook if needed.
3. The Assets lane owns `scripts/native-compare/` with a parameterized output root. Each pair/mask yields per-LCD mean/max RGB error, count of pixels with any channel delta greater than 2/255, connected difference regions and bounding boxes, heatmap, side-by-side sheet and JSON with both SHA-256s, commit and scenario ID.
4. **Open the side-by-side sheet.** Fix unexplained regions and repeat both captures after integration. Masks require named reasons and may cover only intentional clock/battery, portfolio content, read-only Camera footer, inert OK and other [feature-map](../feature-map.md) adaptations. A mask created merely to pass a diff is a defect.

Store a versioned scenario matrix under the private artifact root (currently `reference/scenario-matrix/v29/matrix.json`); bump the version when entries change. Each entry records ID, title/version, entry state, exact keys/touches/frame counts, clock sampling, native and browser capture paths/hashes, mask, latest diff report and status `pass`, `fail`, `adaptation`, `source-gap` or `blocked`.

The historical `sound-first-run-span-mounted` browser capture JSON was
overwritten. Matrix v17 marked it unavailable; v25 preserves that repair and links an upper PNG recovered
pixel-for-pixel from the preserved contact sheet, an unchanged lower PNG and a
reproduced failing diff. This repair cannot replace a complete fresh capture
pair for acceptance.

The first acceptance targets remain **matched HOME idle** and **Settings → Other Settings page 1**, with raw captures under `reference/scenario-matrix/v1/captures/`. [Matrix v29](/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v29/matrix.json) contains 49 diagnostic entries (39 native/browser comparisons and ten browser-only records); **all are `fail`**. `settings-main-matched` and `sound-first-run-native-panel-matched-a` have identical entry input. Motion and audio tiers remain open. The recovered native Settings main versus production browser is **102 upper / 37 lower pixels over 2/255** after a source battery-frame correction. Source-selected tab and adjacent-page mounts reduce the new Other Settings page 1 diagnostic from **1,517 / 1,682** to **1,517 / 702**. A new pair uses the same sustained touch on Other Settings from the already-open Settings main in both environments and has the same residual pixels. Its prior HOME-to-Settings prefixes differ, so full-session input parity is still open. The fresh-origin selected Settings HOME diagnostic has **54,709 / 41,778** residual pixels: default selection position aligns, but surrounding portfolio tiles and wrench pose differ, and native/browser entry histories differ. Untouched legacy defaults now migrate to those positions; an existing-origin reload retained its previous saved placement, whose customization status is unknown. HOME idle still lacks a matched-input score. A zero-pixel lower Health entry is not a whole-scenario pass. The earlier Azahar EUR boot versus browser selected Settings boot remains at **19,793 / 44,041** under its old layout. The [HOME phase audit](../native-settings-banner-selected-boot-audit-2026-09-26.md) does not support a timing change without native frame counters. No accepted pair follows yet.

The isolated native Camera fixture contains two Camera-created photos sourced from the existing Renu image. The browser now renders a six-cell View Photos browse with native `P_BrwsMenu_D` Slideshow/Shoot/Settings and `P_BrwsBase_D` zoom chrome, but the latest populated pair still differs by **95,350 upper / 23,052 lower pixels over 2/255**. It compares two native stereo MPO fixture photos with five mono portfolio JPEGs, different date folder/selection/chrome and unmatched input. `cc4e383` now follows executable mono contain/no-upscale; the preserved stereo fixture has a different native fit branch, so this diagnostic cannot judge mono photo fidelity. Earlier Camera first-run/empty/populated pairs are preserved diagnostics, not gallery acceptance. The exact source `C_SldH_S` slider now renders at the source parent anchor; its browser paging → Rate mapping and static Parakeet phase are adaptations. Shoot and zoom remain inert under the read-only gallery scope. See the [Camera evidence update](../progress-2026-09-24.md#camera-mono-source-diagnostic-and-sound-strip-finding--26-september-2026). The fixture is private verification data and does not add product capture/editing. Nintendo says only photos created with 3DS Camera can be used on the system ([support](https://en-americas-support.nintendo.com/app/answers/detail/a_id/674/p/605)).

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
Native Settings main and Other Settings page 1 now have fresh diagnostic pairs,
but neither has matched input, zero residual pixels, or motion/audio acceptance.
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
