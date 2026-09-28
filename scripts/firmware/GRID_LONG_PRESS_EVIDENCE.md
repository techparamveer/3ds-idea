# Stationary grid hold: threshold entry

2026-09-23. The tile widget reverses Select at held count **20**, then
emits callback **3** on the next held update, count **21**. Releasing after
count 20 still follows ordinary Decide acceptance. An eligible occupied
candidate reaches a pickup-resource handoff during input; a vacant target
has no candidate and continues without a pickup. Its later release emits
callback **4**, without Decide or ordinary selection.

This bounded audit extends the frozen [ordinary stylus evidence](GRID_STYLUS_EVIDENCE.md).
It changes no runtime, presentation, public asset or earlier evidence.
It stops at the first occupied pickup-resource handoff. Mode 14, occupied
release after that handoff, drag movement/drop, folder hover, scrolling
and the broader pickup lifecycle remain outside this result.

## Reproduction and boundaries

Owner-supplied EUR HOME `0004003000009802`, version 24576, mapped at
`0x100000`. Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_grid_long_press.py](home_grid_long_press.py) with Unicorn 2.1.4
and Capstone 5:

```sh
python scripts/firmware/home_grid_long_press.py \
  --code /private/path/exefs/code.bin \
  --resources /private/path/launcher_LZ \
  --output /private/path/native-grid-long-press/verified-final
```

Private numeric report and 18 hashed source excerpts:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-grid-long-press/verified-final/`.

| Artifact | SHA-256 |
| --- | --- |
| New fixture | `47c32cb2d07a1bd368a7f1d16565707838d389dad390a27b842359ca089d4be4` |
| New `checked.json` | `6e3c97e8524829e2173df5b4cca2f2fabe78eef1f6b3ff8a230ec48c52ff863a` |
| Frozen ordinary fixture | `12ba8151881fdff12f0edf8bc14bfe14dd031bb4cc7642ee3bad6e9cc6b76c78` |
| Frozen underlying setup | `c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c` |

All **16 sequences pass**: eight holds through H21 across root −1 / child 2,
same / different target and eligible ordinary / vacant record; plus eight
eligible releases after H19 / H20 across both contexts and target relations.
The four vacant holds also run release and capture cleanup. These use
settled density 2, initial selected slot 3, target 3 or 4, and a continuously
true supplied hit result. Child context means an ordinary tile inside a
folder, not picking up the folder icon itself.

The hash-pinned ordinary fixture supplies its original registered-widget
setup, actual host traversal, native Select/Decide bindings and pane writes,
metadata predicates, lower footer and primary Loop. Touch current/previous
bytes, hit testing, mature metadata, task readiness and unrelated service
endpoints retain the frozen fixture's limits. No input coordinates, GPU
raster, browser or emulator application are exercised.

The new fixture supplies a preloaded pickup layout identity and the raw
pickup Scale controller with an inert binding group. It executes native
layout registration, priority reorder, visibility setter, controller start
and density seek. Its derived setup permits the pickup visibility setter
instead of the frozen setup's secondary-layout endpoint; the frozen file
is unchanged. No pickup pane is applied or rendered before the stop.

## Count and callback boundary

Let `S` be HOME and `W` the tile widget. `W+0x74` is the held count;
`W+0x7d` is the long-press flag. The source word at `0x33c634` is **20**.
`P` is the initial press host pass, which leaves count 0. `Hn=P+n` is the
nth subsequent uninterrupted held update. These are source update counts,
not elapsed milliseconds or browser event counts.

State 1 at `0x25314c` checks release before incrementing the count. While
the long-press flag is 0 and the hit succeeds:

| Input case | Native result |
| --- | --- |
| Physical release (`previous & ~current`) | Reset count; start Decide; enter state 2 |
| Held count becomes 19 | No callback or controller restart |
| Held count becomes 20 | Equality branch `0x253214..0x253224` calls reverse helper `0x1f7078` on Select |
| Held count becomes 21 | Greater-than branch `0x253230..0x25324c` sets flag 1, resets count 0 and sends event 1 / callback 3 |

The widget stays in state 1 and retains capture at H20 and H21. Equality
does not emit callback 3. H21 does not start Decide. Callback dispatch is
the actual registered path through `0x233a4c`, HOME callback `0x2947f8`
and tile handler `0x2a4994`.

For both target relations and both contexts, release after H19 or H20
produces `[0,1]`, never `[0,3]`. It enters ordinary Decide waiting and
accepts at R+3. After H20, the release pass applies reverse Select frame 0
first (Y=0), then Decide frame 0 (Y=−2). Thus the final pane pose is still
−2 on that release pass. A different slot is selected; an already selected
eligible slot reaches the ordinary open boundary `0x1d3e80`. These eight
sequences stop at that existing boundary where applicable.

## Tile pose, primary cursor and pass order

The following values are after completed global 2D, except the explicitly
stopped occupied H21 row. The measured pose is the native local Y of
`P_IconBtnDmy_00` in `LncIconDist_01`, not a claimed screen-pixel result.

| Boundary | Held count / flag | Select current / submitted / status | Pane Y | Callback |
| --- | --- | --- | --- | --- |
| H19 completed | 19 / 0 | 1 / 1 / 0, forward | −2 | None |
| H20 completed | 20 / 0 | 0 / 1 / 1, reverse | −2 | None |
| H21 occupied handoff, input only | 0 / 1 | Retains H20 values | −2 | 3 |
| H21 vacant, completed | 0 / 1 | 0 / 0 / 2, reverse | 0 | 3 |
| H22 vacant release, completed | 0 / 0 | 0 / 0 / 0, binding disabled | Retains 0 | 4 |

Status 2 remains active until the next controller update disables its
binding. Decide remains idle and never submits a frame throughout the
hold-through-H21 cases. Its untouched submitted sentinel is −999 in this
fixture. The Select binding is active after H20; the Decide binding stays
disabled. No retained disabled Decide frame is reapplied.

At all measured hold boundaries the primary remains request 0 / shown 1 /
layout-visible 1. Its Scale stays at density frame 2, its Select/Decide
controllers are unchanged, and there is no primary Scale seek. Loop
advances on every **completed** host pass. The fixture begins at Loop
current 18.25: after H19 it is 38.25, after H20 it is 39.25. Vacant H21
advances to 40.25. Occupied H21 is stopped during input and therefore still
has current 39.25 and the prior submitted value 38.25.

Occupied H21 records only `host → input-producer → input-callback` before
the resource stop. It does not reach task traversal, upper/banner, lower
HOME/footer or global 2D. Therefore its unchanged tile pose, old primary
position and Loop phase at this boundary do **not** prove that those
values persist through a completed native pickup pass.

## Eligible occupied callback 3

Callback 0 at the initial press recorded candidate folder/slot at
`S+0x117e/0x1180` for eligible ordinary records. Those fields remain intact
through H21. Callback 3 begins at `0x2a52a4` and checks mode 0, a non−1
candidate slot and current candidate eligibility through `0x2eb710`.
The source also checks the currently selected record's special flag at
`0x1e89b4`; the supplied ordinary records have that flag clear. Cartridge,
folder-icon, special-title and overlay variants are not tested here.

The executed ordinary path performs these actions in order:

1. At `0x2a5348..0x2a5358`, copy candidate slot to selected slot and set
   the relative selection to candidate minus target-left. A different
   target therefore becomes selected immediately; the candidate is not
   cleared. The old primary position remains until later work outside
   this stopped input phase.
2. Copy the ordinary pickup layout `S+0xaf4` into `S+0xaec`, and Scale
   controller `S+0xe60` into `S+0xe5c`. Native metadata reads retain these
   defaults for the tested ordinary records.
3. Call `0x1f5a9c` from `0x2a553c` with priority `0x177` (375); native
   removal/reinsertion into the layout list executes.
4. Call `0x232234` from `0x2a554c` to set pickup visibility 1.
5. Call the chosen controller's start virtual at `0x2a555c`, then its
   seek virtual at `0x2a5578` with float density 2. The native controller
   has mode 5, status 1 and current 2, with no submitted pickup frame yet.
6. Reach `0x1e801c` from `0x2a55b0` with HOME, the pickup layout and the
   packed candidate. **Stop before this content/resource installation.**

Static construction at `0x2b302c..0x2b3078` ties these default fields to
`LncIconPickUp_00.bclyt` and `LncIconPickUp_00_Scale.bclan`, and sets the
controller mode to 5. The Scale asset has six frames, source range 0–5,
group `G_Scale_00`, and child binding enabled. Its pane/material tracks
are preserved as private structural data; this audit does not evaluate
their pickup pixels or title content.

| Pickup resource | SHA-256 |
| --- | --- |
| Layout | `6ec30917cd9ed047ce5e9937a4e776456696a265490fc5267cda5960f6341ca2` |
| Scale | `c4138973ce034f02f6e5049f945f3a69446f40a9b95d60ef3d0c4481d0343cce` |

The static ordinary continuation after the resource call disables other
controls and calls mode setter `0x1e8f38` with **14** at `0x2a5698`.
That continuation and mode entry are not executed. The report consequently
still shows mode 0 at the resource boundary and establishes no mode-14
primary visibility policy or post-handoff sound behavior.

## Vacant callback 3 and release callback 4

Vacant records never produced a valid candidate at callback 0. Their
candidate remains folder −1 / slot −1. At H21, the widget still emits
callback 3, but the handler returns at the candidate-slot gate
`0x2a52b4..0x2a52bc`. There is no selection, pickup, or mode change.
The host completes normally and submits reverse Select frame 0.

With `W+0x7d=1`, state 1 no longer performs a hit test or increments the
count. On physical release, `0x25318c..0x2531a4` clears widget state and
the flag, then emits callback 4. It does not start Decide. The vacant
callback-4 handler returns on null `S+0xaec` at `0x2a570c..0x2a5714`.
Selection and candidate remain unchanged. Capture remains 1 on release,
clears on the next widget-idle pass, and global capture clears one pass
later because its scan precedes that widget update.

For an existing pickup, static callback-4 code would check overlays and
mode; absent overlays and modes 2/43/44, it calls `0x1d4cc4(S,1)` at
`0x2a57b8`. No occupied post-handoff release is executed, and this audit
does not inspect drop behavior or claim that the stopped occupied state
can safely resume without its omitted resource/mode setup.

## Direct sound observations and runtime implication

All eight hold-through-H21 sequences record only the initial direct call
to sound endpoint `0x233a6c`: caller `0x1f71b4`, ID `0x0100002b`
(`SE_CTR_HOME_ICON_TOUCH`), before callback 0. There is no additional
direct sound call in the executed H20 reverse, H21 callback-3 path through
the stop, or vacant release callback 4. The H19/H20 ordinary-release
checks additionally record ID `0x0100001e` (`SE_CTR_HOME_START`) only
for same-slot opening, as in the frozen ordinary audit.

The sound endpoint, default sound table and omitted services are not
reconstructed. These are direct-call observations within the stated
boundaries, not evidence of global silence or a completed pickup sound
sequence. The widget config's `0x0100002c` is not reached here.

The later runtime contract can replace the threshold-entry mismatch with
the exact count/equality/greater-than behavior above. A wall-clock 450 ms
recognizer is not established by this source result. The occupied H21
handoff must be represented as an explicit unresolved boundary until its
resource and mode lifecycle is separately authorized and traced; this
audit does not supply a complete drag implementation.
