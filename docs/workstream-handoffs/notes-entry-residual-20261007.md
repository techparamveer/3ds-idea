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
`0x196fec..0x197240` composes original day/month/weekday message parts.
Notes' hour tokens are **custom, not strftime**: `0x196cdc..0x196d28` maps `%H`
to UTF-16 `%d` at `0x1aa60c`, and `%I` to UTF-16 `%02d` at `0x1aa614`.
Both branches pass the same unchanged mod-24 hour through r8 at `0x196d00`
and `0x196d24`. The hour getter `0x197b4c` returns 0..23, stored in r7 at
`0x196bf0` and loaded through the clock-value table at `0x196c88`.
There is no 12-hour conversion in the `%I` branch. Native `20:18` corroborates
this path. Boundary tests retain `%I` outputs `00`, `09`, `12`, `13`, `20`,
`23`, and unpadded `%H` outputs for the same hour values. `%m` minutes are
zero-padded. Source text styles, fonts, colors and pane geometry remain unchanged.

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
Focused tests pass: 107 Node tests across Notes HUD/boot cover/lower intro,
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

## Empty Thumbnail Follow-Up

This is the single bounded source-to-visible slice authorized after the HUD
chain was integrated as `0281758` and `21d4329`. Worker base is `1a3816a`;
the HUD-only source gap above records the earlier audit, not this follow-up's
result. The original firmware input hash remains unchanged.

Coordinator production runtime `61f8b4ee9318b929f9b944eac59592e7c05e328a`
captured two ordinary Notes opens (92/95 pairs) and inspected the console.
First-ready pair 035 uses the same immutable native endpoint above. The
empty-mask static comparison is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/comparisons/notes-list-61f8b4e/report.json`,
SHA-256 `1bdfe323dd97209cec70a6451d4813fda34d00e9a68748c3c8e8bcba368aa794`.
Coordinator inspected both sheets. Upper fell from 9,198 to 1,263 changed
pixels, all remaining live calendar/network/battery state; its body is unchanged.
Lower remains 46,427 above threshold 2, maximum delta 31, byte-identical
browser SHA-256 `2ea6c8ec63de1a85035e22af2ee21be72da514317e8777d85b6569267e7876a8`.
This retained lower defect is the follow-up target, not a color input.

### Established Original Bytes

The same verified Notes code establishes the initialized empty buffer:

| Source Address | Binding / Byte Rule |
| --- | --- |
| `0x13a008..0x13a044`, item constructor `0x189980` | Context owns 16 eight-byte items at `+0x48 + slot*8`; each starts with null full/thumbnail pointers. |
| `0x1037ec..0x103824` | Iterates all 16 items, obtains allocation size from `0x109728`, and invokes initializer `0x109584` at `0x103808`. |
| `0x109584..0x109718` | Assigns full-note pointer at item +0, thumbnail pointer at +4, then halfword-fills both complete padded allocations with `0xe73c`. Full loop is `0x109650..0x1096a0`; thumbnail loop is `0x1096c8..0x109714`. |
| `0x10971c`, `0x109720`, `0x109724` | Original literals are pixel type `0x8363`, format `0x6754`, fill `0xe73c`; ExeFS code offsets are `0x971c`, `0x9720`, `0x9724`. |
| `0x15881c..0x1588ec` | Format `0x6754` and type `0x8363` use the packed RGB565 two-byte path. |
| `0x158900..0x158948`, table `0x1aac20` | Rounds dimensions upward through 8,16,32,64,128,256,512,1024. Thumbnail logical size 68 by 42 becomes storage 128 by 64; full note 320 by 216 becomes 512 by 256. Table ExeFS offset is `0xaac20`. |
| `0x14ef50..0x14ef58` | Getter returns context +0x48 +slot*8, without synthesizing colors. |
| `0x13d4e8..0x13d654`, binder `0x14ead0..0x14ec10` | Fetches item +4 and binds its original thumbnail to `P_BtnMemoThum%02d`; full note binding follows. The binder retains logical and padded dimensions and uploads the runtime bytes. |
| `0x103880..0x103968` | Later `memo%02d` persisted-note reads may replace initialized buffers through `0x116800`. This delivery never reads or publishes those private saved bytes. |

`publish_notes_empty_thumbnail.py` hash-gates the complete original code before
reading its literal/table bytes. It reproduces the initializer's uniform little-
endian halfwords `3c e7`, not ARM execution or captured memory. Initialized
thumbnail bytes SHA-256 is
`bc25313ab62de0cf272c48ed57aeb681e156e08ca596cd3ec589677a9317ba76`.
Existing `texture.py` RGB565 decoding replicates channel bits: red/blue 28 map
to `(28 << 3) | (28 >> 2)` = 231, green 57 maps to `(57 << 2) | (57 >> 4)` =
231, alpha 255. Every delivered texel is therefore `(231,231,231,255)`.
No native PNG color or measured delta participates in this algorithm.

### Delivery and Painter

| Visible Element | Manifest Key and Source | Delivery SHA-256 |
| --- | --- | --- |
| Original list layout/clips plus one initialized runtime texture descriptor | `packs/game-notes/contents/0000-00000007/memo-MemoListDown-empty-thumbnail.json`; original `memo/MemoListDown.arc.l` and `ExeFS/code.bin` | `34da4da5a90b2bb632529dcbd49c4e783c0babdb6f5286eda022ad26f877ec48` |
| All 16 initial `P_BtnMemoThum00..15` faces | `textures/game-notes/contents/0000-00000007/empty-note-thumbnail.png`; `ExeFS/code.bin` initializer/literal/table above | `a8524f50ce85f1024d992f01c0fc425639b8904d41a7e247ef3c84c5a8fb05a6` |

Source archive SHA-256 is
`8a52b8cec00b99c4d68fe0ec6dc6d99908ed825bcec9c29aab5a1fa5a428edfe`.
Original delivery SHA-256 is
`6718e7beb40be0079a49fae9e5c2552b35a741028a5cab15f720ce995b3d118d`.
The derived pack copies its layout, all clips, messages and existing texture
mappings unchanged. Existing public resources and their manifest records are
untouched. Only a new Notes pack binding and two new records are added; other
title metadata and global manifest fields are unchanged. Both records identify
the original title/version/content, code hash and conversion routine, including
source address and file-offset fields. No executable is public.

The converter is `ctr-native-web` 1.5.4 with the existing texture decoder script
hash `399be43d43fc6d92363386c0a5347135e875ec35edca8d1a1e36145366aed38f`.
Runtime binding converter is `notes-initial-empty-thumbnail-rgb565` version 1,
publisher SHA-256 `cd23016f1ddd743f77564bbb212329a1bfe87deff282b480e5c11236fc891274`.
Result manifest SHA-256 is
`4036c07ede0996fe97875b318a0bd1cf005a2be9a63c591fab1681e878e2ec71`.
Private publication report is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notes-empty-thumbnail-residual/notes-empty-thumbnail-publication.json`,
SHA-256 `ed85e97aad6385a18996bcd4cc029806067582e8dcdfda4a0aa199683a33163d`.

The Notes readiness descriptor explicitly requests `runtime-empty-note-thumbnail`
from the derived list pack. Missing texture metadata or PNG transport fails
before a usable renderer/pair; wrong storage dimensions or format also fail
in the painter helper. The list draw clones only sampler 0 for the 16 original
thumbnail panes. Original geometry, vertex colors, alpha, cursor, source clips,
upper content and scene-9/scene-10 ordering remain unchanged. Drawing and
suspended capture behavior remain unchanged. No shared scene/screen/controller
file or publication receipt API changes, and no further integration hook is needed.

### Verification and Boundary

113 focused Node tests pass, including real title preparation, selected texture
loss/HTTP404 failure, exact source-buffer PNG bytes, all 16 posed samplers,
unmodified source geometry/colors, failed list pair and cover ordering. Six
Python tests pass with the private code path supplied: hash rejection, exact
full/thumbnail initialized bytes, original layout/clip preservation, provenance,
no writes on wrong code, and idempotent additive publication. The four HUD
publication tests, nonincremental typecheck and diff checks also pass.
Two related Camera/eShop lifecycle test transports failed before execution
because their personal-tools stubs omitted the earlier HUD delivery's
`notesHudClock` export. Coordinator already fixed these in `59fb1d5`; that
reviewed commit is the fixture dependency on this worker branch. Duplicate
worker edits were removed. The thumbnail commit does not author fixture or
Camera/eShop runtime changes; their focused rerun passes 12 additional tests.

```sh
node --test --test-reporter=spec --test-skip-pattern='source-render specimens' tests/notes-empty-thumbnail.test.mjs tests/notes-hud.test.mjs tests/notes-boot-cover.test.mjs tests/notes-lower-intro.test.mjs tests/notes-no-software-list.test.mjs tests/stock-screen-preparation.test.mjs tests/native-title-assets.test.mjs tests/notes-suspended-capture.test.mjs tests/notes-capture-switch.test.mjs
NOTES_SOURCE_CODE=/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notes-no-software-audit/exefs/code.bin python3 -B tests/test_notes_empty_thumbnail.py
python3 -B tests/test_notes_hud.py
node --test --test-reporter=spec tests/camera-gallery-lifecycle.test.mjs tests/eshop-welcome-lifecycle.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

Source-identified, delivered, implemented and focused-tested are established.
This delivery is not browser-inspected or native-compared by the worker. No GUI,
server, full suite or build was run. Coordinator must recapture first-ready
against the immutable native endpoint with the empty mask and inspect the
result. Exact residual counts and native sampling parity remain unproven.
The source gap for initial empty bytes is closed; persisted/nonempty thumbnails
and legacy stroke-to-thumbnail conversion remain unsupported adaptations, not
claimed native functionality. Existing history, profile/clock and capture
adaptations remain. Strict whole-scenario AN-01 acceptance is still open.
