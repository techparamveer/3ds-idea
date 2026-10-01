# Sound workstream handoff

Checkpoint: base `f5ed204c7955880d59b097a632d48deaa7d80252` on
`codex/complete-sound-20261001`, 1 October 2026. This bounded slice owns
M-SND-01 through M-SND-06 but changes only route coverage and this handoff. It
does not add songs, playback, UI, assets, persistence, browser evidence or a
native acceptance result.

The coordinator's updated policy received during this slice requires GPT-6
Astra/high for workstream chats and GPT-6.1 Sol/medium for any future bounded
helper, with no Fast-mode claim without settings evidence. No helper was used
for this task, and this acknowledgement does not claim the already-running chat
changed models.

## Delivered route coverage

[`tests/sound-completion-routes.test.mjs`](../../tests/sound-completion-routes.test.mjs)
uses the registered Sound module and real application host. Its supplied-song
case temporarily replaces only that module with three frozen metadata records.
The fake effect sink records and acknowledges owner-scoped effects; it never
creates an `Audio` object, opens a URL, fetches a song, reads a song file or
produces audio.

| Feature | Covered contract |
| --- | --- |
| M-SND-01 | Production-empty fresh instance starts on guide page 1; A/Next reaches page 2, B returns to page 1, pages 2 and 3 expose Back, and page 3 OK enters the empty main screen. A newly created instance repeats page 1. |
| M-SND-02 | Production `portfolioMedia.tracks` remains exactly empty. Main has no song rows, reports `No songs available.`, exposes no invented footer action, and root B is inert while HOME remains the host exit. |
| M-SND-03 | Selecting synthetic metadata from the real main route emits one revision's ordered `load`, then `play`; no effect is executed. |
| M-SND-04 | Playing previous/next wraps through the host route; seek clamps to zero and the selected duration; the one visible mode control cycles `no-loop` -> `folder` -> `single` -> `random` -> `no-loop`. |
| M-SND-05 | A current-revision failure emits pause and blocks transport. Physical A/OK and B each dismiss the dialog without changing the selected track; only a later user Play action resumes. |
| M-SND-06 | HOME suspension, sleep and close each emit pause. HOME return and wake remain paused; explicit Play resumes at the retained position. Close removes the owner, and a fresh instance resets track, position, duration, mode, revision and playing state. |

The existing reducer, host and transport tests remain the lower-level authority
for stale revision rejection, fake-audio callbacks and released-element
disposal. This new file adds the missing cross-route assertions instead of
copying those unit harnesses.

## Current production navigation

The production manifest still has no tracks. The reachable route is therefore:

1. Fresh Sound application instance -> `sound/guide`, page 1 of 3.
2. Next -> page 2; Back -> page 1.
3. Next -> page 2 -> Next -> page 3; Back -> page 2.
4. Page 3 OK -> `sound/main` with the source-backed settled empty room and
   `Record & Edit Sounds` presentation.
5. No song row can open `sound/playback`. Root B is disabled; HOME suspends or
   exits through the shared host lifecycle.
6. Close and reopen creates a new instance and repeats the guide because no
   firmware-backed seen-state is persisted.

The visible empty-entry Record, StreetPass, Add, Open, Settings and Back
controls are presentation-only or disabled. Recording, import, remote service,
settings mutation and device storage flows are outside scope and are not hidden
behind those controls.

## Source and native evidence boundary

The delivered Sound resources map to EUR title `0004001000022500`, content
index 0 / content ID `0000000b`. The live request set in
`stock-native-sound.ts` names `lyt-S_BG-arc-LZ.json`,
`lyt-S_Play_D-arc-LZ.json`, `lyt-C-Sld.json`, `lyt-C-Dlg.json`,
`lyt-S_Guid_U-arc-LZ.json`, `lyt-S_Common-arc-LZ.json`,
`lyt-S_Inf_U-arc-LZ.json`, `lyt-Parakeet-arc-LZ.json`, `lyt-C-Hud.json` and
`msg-EU_English.json` under `packs/sound/contents/0000-0000000b/`. Detailed
element paths, hashes and converter provenance remain in
[Sound source composition validation](../sound-source-validation.md),
[settled entry comparison](../sound-native-entry-2026-09-24.md), and
[Sound room source](../sound-room-source.md); this test-only slice did not
re-extract or republish them.

The latest recorded guide diagnostic is still a failure at 6,627 upper / 6,267
lower pixels over 2/255, and the settled empty entry remains a failure at 15,793
upper / 16,021 lower. Existing source/capture notes identify title/room/bird/
footer residuals and capture-derived title/Span fits. They do not establish a
whole route, animation timing or native audio match.

Exact evidence still missing:

- A firmware-backed first-run seen-state owner, storage field, reset rule and
  returning-user route. Until found, repeating Welcome is an explicit
  adaptation rather than native persistence.
- Matched guide entry/exit frames, transition cadence, Parakeet scheduling and
  native cues. All verification remains muted by user instruction, so cue
  acceptance is open.
- Native input/enable behavior for the empty entry's Record, StreetPass, Add,
  Open, Settings and Back controls. Current inert/disabled behavior is scoped;
  the visible source layouts do not by themselves prove navigation.
- A same-content supplied-song native/browser library pair, including exact
  list paging, cursor motion, selected-row Open transition and track metadata
  treatment. There is no production song with which to capture it.
- The executable's actual loop-mode cycle and the transition that first brings
  `S_Play_D-CtrPanel3`/Effect into playback. The visible four-mode order is a
  documented source-icon adaptation; OneTime and ABLoop are not exposed.
- A source-proven silent/audio-driven upper visualiser pose. The converted
  visualiser models contain no animation clips; runtime-written bar poses,
  pull cord, speed/pitch, filters and percussion remain absent or inert by
  scope rather than guessed.
- Matched failure onset, modal timing, recovery and music position across
  HOME, sleep and close. The new synthetic tests establish reducer/host
  ordering only, not HTML audio success or native behavior.

## Coordinator capture ticket: `sound-empty-first-run-transport`

Status: verification needed for the current empty leg; supplied-song transport
is blocked on user media.

Preconditions:

- Use a fresh isolated EUR 10.7.0-32E original-hardware profile clone with no
  songs and a separately fresh production application instance whose production
  track array is empty. Record whether native Welcome is actually pending; if a
  safe cloned state cannot reproduce it, mark the first-run leg blocked rather
  than substituting a returning-user capture.
- Recheck iPad Sidecar geometry before placing each visible window. Keep Azahar
  volume at zero and the dedicated browser muted. Do not change system-wide or
  unrelated application audio.
- Select Sound on HOME in both environments and use the same A/B/HOME input
  sequence, with measured presses/releases and explicit settled-frame counts.

Route and captures:

1. A from selected HOME -> guide page 1; capture both environments after the
   same settled count.
2. A -> page 2, B -> page 1, A -> page 2, A -> page 3; capture pages 2 and 3
   plus the Back result. Record transition and bird frames rather than choosing
   visually convenient phases.
3. A/OK -> empty main; capture the settled room/Record state. Press B and prove
   it remains at main, then press HOME and record the suspended/paused owner.
4. Save Azahar's own 400x480 PNGs and raw production 400x240 upper / 320x240
   lower targets, hashes, exact inputs, clock policy, frame counts, empty masks
   unless a reasoned mask is approved, diff reports and inspected side-by-side
   sheets. Rerun affected HOME return frames.

The ticket name includes transport because it is the Sound completion scenario,
but transport is intentionally unreachable in the current production-empty
leg. Do not inject the synthetic test records into a production capture. After
the user supplies an authorized song and its provenance-backed manifest record,
open a separate `sound-supplied-song-playback` leg for select -> ordered
load/play -> seek bounds -> mode -> previous/next -> HOME pause -> explicit
resume -> sleep/wake -> error dismissal -> close/fresh-instance reset. Keep it
muted until the user separately authorizes audio comparison.

## Verification performed in this worktree

- Focused command: `node --test tests/sound-completion-routes.test.mjs`
- Result: 4 tests passed, 0 failed, 0 skipped.
- Focused regression command: `node --test tests/sound-completion-routes.test.mjs
  tests/stock-apps.test.mjs tests/portfolio-music.test.mjs`
- Result: 53 tests passed, 0 failed, 0 skipped.
- No full suite, typecheck or build was run in this worker; the coordinator owns
  integrated checks to avoid concurrent full builds.
- No GUI, browser, Azahar, screenshot, server, audio output, network access,
  asset publication or private matrix edit occurred.

Remaining product dependency: the user must supply songs before production can
demonstrate M-SND-03 through M-SND-06. Synthetic metadata is test evidence only
and must never be promoted into `portfolioMedia.tracks`.
