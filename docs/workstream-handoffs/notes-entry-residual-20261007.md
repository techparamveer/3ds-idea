# Notes own-HUD residual, 7 October 2026

Worker A uses `codex/notes-entry-residual-20261007` in
`/Users/paramveer/.codex/worktrees/3ds-notes-entry-residual-20261007/3ds-idea`,
based on `a779d16480ad46baaf2c9f7fdc06fcddcb3a7764`. The former worker checkout
and its partial edits remain untouched. Local STATUS HEAD reconciliation is
unstaged and excluded from this delivery.

## Captured defect

AN-01 no-suspended-software Notes now selects the original main/list endpoint
after coordinator correction `2169497`. The retained native endpoint is
`native-notes-slow/screenshots/_07.10.26_12.33.38.755.png`, SHA-256
`2bd4e1baf914daf4c2aec7b6fa06d13d2ce6f8b7ac35ec21cac76839e0a4e999`.
The coordinator's comparison directory is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/comparisons/notes-list-2169497/`.
Both comparison sheets were inspected by the worker. With an empty mask and
threshold greater than 2, upper has 9,198 changed pixels in the missing own-HUD
band, x=0, y=0, width=400, height=23; upper outside that band is zero. Lower has
46,427 changed pixels, maximum delta 31, concentrated in the sixteen note faces.
These are failures, not intentional adaptations.

The browser upper SHA-256 is
`50cb7097f15f25b27e505632925de9d03ec06b8e8b39e66686c6e9ad3d00d4d4`;
lower is `2ea6c8ec63de1a85035e22af2ee21be72da514317e8777d85b6569267e7876a8`.
Empty-mask SHA-256 is
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.

## Bounded delivery

The change publishes and renders Notes' own `HudMenuAplt_00`, original English
`hud.msbt`, and own `Hud.bcfnt`. It does not borrow a HOME HUD, change native
graphics, add guessed colors, or invent a NoGame pack. The existing converter
reuses only already-delivered texture bytes that exactly match the original
Notes HUD dependencies. Their existing manifest records remain unchanged;
the new pack retains Notes-specific texture source mappings.

`personalNotesPacks` requires the HUD layout, four source clips and message
pack. Existing title asset preparation loads the title-owned font before paired
readiness. Missing selected messages, unsupported calendar formats or failed
HUD paint fail explicitly through existing native preparation/publication guards.

Upper ordering is existing background, ImageScreenUp/tutorial, own HUD, then
independent scene-10 cover. The pending capture path retains its cover-only
behavior. Metadata-ready ImageScreenUp, suspended capture selection, owner and
generation guards, scene-9 lower cover, source updates and render receipts are
unchanged. Drawing screens are unchanged. The only reserved
`stock-screen-presentation.ts` changes are the `notesHudClock` import and
Notes-only paired-cache key, so date, colon and charging poses can repaint.

The settled HUD selects original SceneIn frame 20. This fixes the captured
missing endpoint without claiming to reproduce the independent HUD entry clock.
No additional screens/scene integration hook is required for this commit.

## Source and provenance

Source title is EUR 10.7.0-32E Notes `0004003000009c02`, version 4096,
content index 0, ID `00000007`, English locale. CIA SHA-256 is
`56612d00563671a255056ba50cf25bf36c1bf3164f9721cc9abb0051444ac07c`;
NCCH is `329911cd7402f01aaff57bca71f6f5b67c57b4cae885c695cc93cd8f3b542292`;
ExeFS code is `8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
The publisher validates all of these and the three selected original inputs
before conversion. Original firmware and the existing private symlink are untouched.

All manifest keys below are relative to `public/os/firmware/10.7.0-32E/`.
Every added resource records this title/version/content and its source hash.

| Visible Element | Manifest Key / CIA-Internal RomFS Path | Source SHA-256 / Delivery SHA-256 |
| --- | --- | --- |
| Network strip, battery and clock geometry; source SceneIn/Bat/NetMode/NetAtn clips | `packs/game-notes/contents/0000-00000007/memo-HudMenuAplt_00-arc-l.json`; `memo/HudMenuAplt_00.arc.l` | `30877490883c7bec16087efe4d02de7986fe355bfe490b24518da21289a10961` / `ed6b125eb8a9fbb4c381e9c97ae56654a977f233156b2ad7adfd498a7413053d` |
| Original network/calendar message labels | `packs/game-notes/contents/0000-00000007/hud-messages.json`; `lang/EU_English/hud.msbt` | `3f9f2ae497bcf9c79de2584c1d4dc99a8727211834ab6728086761217aa44451` / `93a36234813931d76c31e0669fdafd01b37200de1775b6ef7931d79e72dd5ebd` |
| Original Notes clock font and glyph sheet | `fonts/game-notes/contents/0000-00000007/Hud/font.json` and `Hud/sheet-0.png`; `lang/Hud.bcfnt` | `172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8` / JSON `295bd5b072eec425d1862b220a3623497fec56398e9ff3176d1aff0625cf66a2`, PNG `c41bb1a929dd5755dbc6724afad2d3552474bfad9312019529029eb31b4fec28` |

HUD layout member `blyt/HudMenuAplt_00.bclyt` SHA-256 is
`e1d77863cf0a5f0892649fc4dd94e416295625e3abe78b7fa285e333ed3c4dd8`;
SceneIn member SHA-256 is
`6d3aa8c1ba80080d766eafeaf5d13964c80b235f5682c7c4bd914996a6a238de`.
Selected animation group bindings are preserved: SceneIn `G_Scene_00`, battery
`G_Bat_00`, network mode `G_NetMode_00`, antenna `G_NetAtn_00`.
Font names remain original `cbf_std.bcfnt` and `Hud.bcfnt`; the former uses the
existing shared standard-font delivery and the latter is title-owned.

New records use `ctr-native-web` 1.5.4 with script hashes, verified CTRTool 1.2.0
SHA-256 `1b91c6339bab12453fdf06f28d4a40d39a81e785e7eda92e555a9bcabb1d1991`,
and publisher SHA-256
`2df5f485f13ec205a237c250fec5ac06fc6177212e7fe415c2897009cacd6bc9`.
The existing manifest's global/older converter claims are not rewritten.
Result manifest SHA-256 is
`78dff639e36223bdd4dc2b2053289392c6de1bd88548e1bbb955fa1d2a4ad06e`.
Structured manifest comparison confirms only the Notes title's two pack
bindings/two font aliases and four new records change; all existing resource
records, other titles and remaining metadata are unchanged.

Private validated input root is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notes-no-software-audit/`.
Publication report is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notes-hud-residual/notes-hud-publication.json`.
No firmware package, executable or private extraction is published.

### Original controller trace

The existing bounded disassembly listing is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/cursor-notes-switch/disassembly/code-text-0x100000-0x1aa000.txt`.
Its code identity matches the verified code above. HUD initializer
`0x197440..0x197630` selects `HudMenuAplt_00.bclyt`, SceneIn/SceneOut, four clock
panes and the battery/network groups. Its pointer table at `0x1aa5b0` maps Bat,
NetMode, NetAtn and NetAtnCnt to separate group-bound controllers.
Event handler `0x19683c` initializes timestamp/colon visibility, calendar and
SceneIn. `0x196f8c..0x196fac` toggles `T_TimeC_00` after a 1000 ms SysTick
interval; `0x197364..0x19737c` selects charging battery frame 4 plus that visibility.
`0x196d74..0x196dcc` selects `lau_connect%d` and the NetMode frame.
`0x196fec..0x197240` composes original day/month/weekday message parts;
`0x196ccc..0x196d40` supplies zero-padded `%I` or unpadded `%H` hours and `%m`
minutes. Source text styles, fonts, colors and pane geometry remain unchanged.

## Lower Brightness Boundary

No brightness edit is made. The current `MemoListDown.bclyt` source member
SHA-256 is `14839f763c8f88a9cfd588cf18ee00a24352bdbccc3bba214fa4b3a484b5ddc7`.
Its `P_BtnMemoThum%02d` panes are 68 by 42 with alpha 255, white vertex and
material colors, and original white 8 by 8 `imgMemoThum_8x8_%02d.bclim`
placeholders. Shared placeholder source SHA-256 is
`5b6cf0fe4c26926317b1f329361312a4075b0076fc9fd59280e04497282bfc1d`;
PNG key is `textures/f0e1c8ef3bdc28093427b22e79dbc84a53ff22d74eb0756bfccfb50d12282cda.png`.
Selected Base/SceneIn clips do not supply a thumbnail gray-color track.

Original code `0x13d4e8..0x13d654` instead iterates the 16 slots, retrieves
runtime note data through `0x161348` and `0x14ef50`, and calls `0x14ead0` to
bind the slot's thumbnail buffer (42 by 68) at `0x13d580`. It then finds
`P_BtnMemo%02d` and binds the full runtime note buffer (216 by 320) at
`0x13d654`. This establishes a missing runtime-content binding, not the exact
empty/persisted gray buffer contents. The bounded probe did not establish a
source-supported gray fill. Applying the observed delta as a tint would be
guessing. The unexplained lower mismatch therefore remains **fail**, with a
source/delivery gap for the exact runtime empty-note thumbnail contents.

## Verification and Remaining Work

Source-identified, asset-delivered and painter-implemented are established.
Focused tests pass: 106 Node tests across Notes HUD/boot cover/lower intro,
no-software list, preparation, asset loading, suspended capture and capture switch;
four Python publication/provenance tests; nonincremental TypeScript typecheck;
and `git diff --check`. The first HUD readiness regression failed before the
HUD descriptor was added, then passed. The unittest module-form runner could
not import this repository's non-package tests directory; direct script form
below passes without a code change.

```sh
node --test --test-reporter=spec --test-skip-pattern='source-render specimens' tests/notes-hud.test.mjs tests/notes-boot-cover.test.mjs tests/notes-lower-intro.test.mjs tests/notes-no-software-list.test.mjs tests/stock-screen-preparation.test.mjs tests/native-title-assets.test.mjs tests/notes-suspended-capture.test.mjs tests/notes-capture-switch.test.mjs
python3 -B tests/test_notes_hud.py
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

No full suite, build, GUI, server, browser inspection of this delivery, or native
acceptance run was performed by the worker. Dependencies are the existing
read-only linked installation. The coordinator must integrate, capture both
LCDs with identical inputs and status/time, diff the named endpoint with an
empty mask, inspect the sheets, and rerun suspended/pending/error paths.

Remaining declared adaptations are the existing reference network/charging
status profile, host calendar-parity phase instead of measured native SysTick
phase, and existing nonzero-history/runtime-capture scope. This change selects
the original settled HUD SceneIn endpoint; its independent entry timing remains
open. Common outgoing-HOME/loading cover ordering and timing remain the other
worker's scope. Lower note-face brightness remains an unexplained failure.
Strict 1:1 AN-01 acceptance is not claimed.
