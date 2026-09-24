# Notes intro publication

This continues the [composed title/HUD contract](native-notes-composed-publication.md).
Both original EUR 10.7.0-32E `ApltBoot` archives are now published with the same
provenance rules as ImageScreenUp. A disconnected composer replays their SceneIn
clocks in draw order with scene 3, using the explicit `nonzero-history` startup.
The first **user-visible** ImageScreenUp title frame and one Open→Back owner
cycle that also waits the list MemoDecide/MemoReturn/SceneIn gates are
reproducible. An owner-bound browser remainder clock now steps that composer
for the live Notes **main** upper painter when the 21-pass cover and Open/Back
ownership are preserved. Drawing still hides `W_TextPanel`.

## Published originals

`stock_ui.py --additive` added the converted archives without rewriting existing
Game Notes packs. A full republish would replace `messages-and-loose.json`
because the current converted source now records additional omitted-unsupported
bookkeeping. Additive publish keeps those delivered bytes and records
`preservedDivergent`. HOME and shared records are unchanged.

| Pack | Archive | Source SHA-256 | Delivery SHA-256 |
| --- | --- | --- | --- |
| `packs/game-notes/memo-ApltBoot_U_00-arc-l.json` | `romfs/memo/ApltBoot_U_00.arc.l` | `b5ce29b07a28ae27bd813c860bae25a5825a06d26aafdc727ee31c4129469e18` | `d9b2d8b88c2b1c907e22fac31d5079710012bda0a68c2ad7f6bcc36797ba0bc3` |
| `packs/game-notes/memo-ApltBoot_D_00-arc-l.json` | `romfs/memo/ApltBoot_D_00.arc.l` | `284c4d476528edbf732599f2066a8af8f573854042b469f1e112d3e19459d4e6` | `e8721549694aec66c51afe72e27fd0f08b408d1f7c10e7ba10134454f370a167` |

Both packs report `unsupported: []`. SceneIn/SceneOut are 21 frames, last=20,
nonloop. Upper SceneIn fades `P_Bg_U_00` alpha 255→0 on `Group_00`. Lower
SceneIn binds `G_Scene_00` (`P_Bg_D_00`, belt, applet/home panes). New belt
textures come from the original `ApltBoot_D` archive; `BgLgt`/`BgLine` and the
HOME/common applet pictures reuse already-published identities. No intro pixels
were reconstructed.

`memo-ImageScreenUp-arc-l.json` (`23ca3b80…5309ee55`) and
`messages-and-loose.json` (`54d9a567…ceb3df824e`) keep their previously
delivered hashes.

## Scene 9/10 clocks over scene 3

Scene factory index 10 (`0x13aae4`) constructs `0x166158` and installs vtable
`0x1b6b04`. Initialization dispatches scene 10 event 0 (`0x162fd4–0x162fe0`).
That event writes draw `+0x69`, pending `+0x312`=1 and current state 0
(`0x165f40`). Update `0x16601c` starts SceneIn (`0x151cd0`) then always
advances (`0x152508`) and applies (`0x14f7cc`). State 1 waits busy
(`0x150bb4`) before clearing draw at `0x1660f4`. Scene 9 uses the same
start-then-advance / busy-then-clear pattern for `ApltBoot_D`.

Draw walks priorities 8→0, so priority-0 scene 10 draws after priority-4
scene 3. The first scene-3 apply is therefore a covered pose: InOut frame 1
writes `W_TextPanel` visible, but `ApltBoot_U` still occupies the first
user-visible frames.

`createNotesIntroComposer` arms both intros on the owner ticket (event 0) and
steps them on every successful scheduler update:

| Manager pass | SceneIn frame after advance | Draw `+0x69` | User-visible title |
| --- | --- | --- | --- |
| 1 | 1 | set | no; fade, not a substitute pixel |
| 2–20 | 2–20 | set | no |
| 21 | 20, not busy | cleared | yes; Stay frame 1 on the same pass |

`titleUserVisible` is scene-10 draw off plus an applied visible `W_TextPanel`.
That is the first user-visible title. It is not InOut frame 1.

## Open→Back list gates

Open is still late event 9 after scene 3. The same pass starts list `+0xf80`
SceneOut and `+0xfa0` MemoDecide (last=24) and advances them to frame 1. The
composer waits until both open clocks are not busy before Back.

Back/event 8 still applies reverse HUD in that scene-3 pass and does not
restart the title. List return starts selected-note MemoReturn and cursor
MemoReturn; when MemoReturn is at frame 5 **before** advance, `+0xf80`
SceneIn starts. Return is complete only after SceneIn, note MemoReturn and
cursor MemoReturn are all not busy (`0x13db50`, `0x13db70`, `0x13db88`).

A changed command ticket discards retained title/HUD and reseeds both intro
draw flags from event 0.

## Owner-bound live clock

`stepNotesIntroClock` is the same provisional 60 Hz remainder policy as HOME
`stepHomeUpdateClock`. It is **not** a measured native wall-clock. Host `now`
is the Notes tick accumulator (`notesHostMs`), already capped at 1000 ms per
`tickRuntime` dispatch. Paint, overlay `lastTick`, and metadata/asset
completion are not step sources.

The first ready sample arms `lastNow` with zero updates, so a late metadata
or pack download cannot consume queued host time. Sleep, owner loss, or
temporary pack unavailability drop `lastNow`. Each produced update is one
manager pass: the session applies Open/Back at most once per pass, waits
MemoDecide/SceneOut idle before Back, and calls `compose()` after every
caught-up step so skipped paints cannot drop intermediate title/HUD applies.

Browser entry with ready capture and metadata uses the explicit
`nonzero-history` startup. The zero-history tutorial route is still unported.
`MemoTutorialUp` remains the no-metadata fallback. Pending ready-but-unstepped
frames draw resource-default `ApltBoot_U` without inventing a pass.

The painter does not import the composer. It receives a precomposed pose and
draws that layout (capture/icon/description overrides; `W_TextPanel` is not
force-hidden). Selected-note drawing is unchanged and still hides the title.
Software Keyboard, note text entry/editing, and unproven sounds stay absent.

## Precise next gate

Wave cues and matched native comparison remain outside this slice.
Window-leaf / render-helper raster is still a later fidelity question. The
21-pass cover is proven for the upper painter only; lower list SceneIn stays
on the existing `MemoListDown` adapter.

## Verification

`scripts/verify-notes-panel-publication.py` now requires both published
ApltBoot packs, pins scene-10 event 0 / init / start / busy / advance / apply,
and records the first-user-visible contract as the draw-clear pass. This run
passed **137 original byte/resource checks** and wrote **40 hashed source
ranges** under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-intro-publication/`.
Focused tests in `tests/notes-intro-publication.test.mjs`,
`tests/notes-intro-clock.test.mjs` and `tests/notes-intro-session.test.mjs`
replay pack identity, the remainder clock, late-ready isolation, the 21st-pass
reveal, Open→Back list gates, ticket reseed and the painter sampling a
precomposed pose. Combined with the composed, retained-property, scheduler
and stock-apps suites this run was **84** focused tests. `npm run typecheck`
passed. `npm run build` could not run in this worktree because Turbopack
rejects the `node_modules` symlink. The live path makes no browser or
native-raster claim here; the coordinator owns those inspections.
