# HOME Open pressed duration and A-down vs release

Worker `3ds-home-open-press-20261004` / `codex/home-open-press-20261004` at
`1d432c1c`. No runtime change. This pass source-identifies the leftover from
the [launch Decide and dwell fit](home-launch-decide-dwell-2026-10-04.md):
whether native Open stays pressed one to four frames longer than the
browser's five, and whether Decide starts on A-down, A-release or
touch-release. It does not retune the fitted fade or logo clocks
(`LAUNCH_FADE_START_MS` stays ten frames). Azahar launches used so far were
muted; this is not an audio comparison.

EUR HOME `0004003000009802` v24576, executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`
(read as data; nothing added to Git). Layout and clips from
`packs/home/launcher.json` → `launcher_LZ.bin`.

## Trigger

The Open control is the shared footer listener (`0x253448`, vtable
`0x3214b0`). Group 0 is `G_BtnW_C_01` (centre Open). Its key mask at
`0x314504` is **`0x0001`** (digital A). The Decide clip and
`SE_CTR_HOME_START` (`0x0100001e`) wiring are the
[open-route](../scripts/firmware/home_audio_OPEN_ROUTE_EVIDENCE.md) and
[START_EFFECT](home-launch-start-effect-2026-10-04.md) traces.

Widget update `0x2558ac` dispatches state 0 to `0x255568`. That handler
splits touch and keys:

| Path | Source | Native behavior |
| --- | --- | --- |
| Touch-down | `0x32e9e1` current and `~0x32e9e2` previous, hit `0x224814` | Start **Select** (`+0x38` / `0x1f723c`), select cue `+0x50`, enter state 1. |
| Physical A | Input record `0x32e9fc` word **`+0xc` (newly pressed)** masked with `+0x68`; analog press edges at `0x32e9f0` only if that word is zero | Start **Decide** (`+0x40`), decide cue `+0x5c`, enter state 2. |
| Touch-release inside | State 1 at `0x255774`: `0x32e9e2` previous `& ~0x32e9e1` current, still in-hit | Start the same Decide and decide cue; enter state 2. |
| Decide complete | State 2 at `0x255670` | `0x1f70b0` on the Decide controller; on success emit action 1 through `0x233a4c` and return to state 0. |

The input record's `+8 / +0xc / +0x10` words are held / newly pressed /
newly released
([input-event evidence](../scripts/firmware/HOME_INPUT_EVENT_EVIDENCE.md)).
Open never reads `+0x10`. A-release does not start Decide. Open's mask
`0x0001` also does not match the analog press bits at `0x32e9f0`
(`0x10/0x20/0x40/0x80`), so the analog fallback is inert for centre Open.

`0x1f70b0` returns true when the controller pointer is null **or**
controller `+0x14` equals **2** (terminal status), not idle 0. Tile widgets
wait for idle; this footer does not. Action 1 is the launch-preparation
update that plays `SE_CTR_HOME_START_EFFECT` and requests music stop30, not
the visual fade.

## Pressed duration

`LncBtmBtn_02_Decide.bclan` is non-looping, `frames` 6, source range
`[36, 41]`, SHA-256
`65eb55af8110e51cf8efdc9bafb70d681fdbf528a211a0df5d9ca172546de4bc`.
`LncBtmBtn_02_Select.bclan` is the two-frame touch-hold clip (`[0, 1]`),
SHA-256
`b039ae54719725321c32b904f142d684d3980122e11a164191b2740d86542b20`.

A non-looping layout controller is mode 0, start 0, end `frameCount-1`,
step 1
([cursor-loop clock](../scripts/firmware/CURSOR_LOOP_CLOCK_EVIDENCE.md)).
Decide's end is therefore **5**. Start helper `0x1f723c` / `0x2693fc`
resets current to 0 and does not submit. `0x269430` copies current into the
AnimTransform, then `0x1bbd94` adds step. Mode 0 clamps at end and sets
status 2 on the **next** advance.

Same-pass order is input, then 2D
([grid stylus](../scripts/firmware/GRID_STYLUS_EVIDENCE.md)). After A-down
or an in-hit touch-release:

| 2D pass | Submitted Decide frame | Status after advance | Open look |
| --- | ---: | ---: | --- |
| 1 | 0 | 1 | pressed |
| 2 | 1 | 1 | pressed |
| 3 | 2 | 1 | pressed |
| 4 | 3 | 1 | pressed |
| 5 | 4 | 1 (at end, flag `+0x1c`) | pressed |
| 6 | 5 | 2 | white |
| next input | (retained 5) | action 1 | white |

Pressed is authored through integer frame 4. On `P_BtnW_C_01` and the other
Open groups, the `_S` press overlay stays visible at 4 and hides at 5;
`T_BtnPW_*` hides at 5; `T_BtnFW_*` appears at 5; `texture.pattern` stays 1
until 5. Those keys are split at frame 5, not ramped across 0..4, so unit
steps never show an in-between tone. Select is only the touch-hold overlay
(frame 1 while down). Physical A never starts it.

That is **five** 2D submits of pressed Decide, then Decide5. The five
native screenshots N065..N069 matching Decide 0..4, and N070 matching
Decide5, agree. The earlier CTM bound of six to nine frames mixed HID
A-hold (~two video frames from movie 1200) with screenshot-counter lag; it
is not a `lastFrame` and does not justify holding Decide4 or delaying
Decide until A-up.

## Browser

`latchInput` emits `open` once on button-down and not on up, so A is a press
edge. Footer touch paints `LncBtmBtn_02_Select` frame 1 while
`ownedHomeFooterContact` holds, and `dispatchSystemEvent` launches on
release-inside. Launch presentation already binds Decide 0..5 at 60 Hz and
holds Decide5 until the fitted fade at ten frames. Pressed duration and
both triggers already match this source. The four-frame Decide5 hold and
the fade/logo clocks stay the dwell-pass adaptations; this slice does not
move them.

## No product change

No duration or trigger edit is source-justified. Do not guess Open-tone
alignment from muted captures. Native fade epoch relative to action 1,
START_EFFECT vs fade pose 0, music stop30, HUD pixels and whole-scenario
acceptance remain open.

No Azahar or production preview (`127.0.0.1:3021`) was operated.
Status: source-identified; matrix unchanged.
