# Native Settings user-name keyboard invocation

This is the existing-profile `user_name_input` path, called nickname by the
portfolio scaffold. It replaces the earlier synthetic research proposal for
this target. It is source/fixture evidence, not a complete rendered initial
frame or visual acceptance. No app implementation changes accompany it.

## Sources and reproduction

Settings title `0004001000022000` v9220, content index0/id`0000003d`:

- CIA SHA256 `876c57b6fe77c57fbcc113f357b6fc31fe1d3a7e31e424e0d34fe41b17d1f37f`
- NCCH SHA256 `79087e9f7f62c616f27167e2623119ffc8350a1fa1a949f28280df9c789cbac0`
- Decompressed code SHA256 `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`

Keyboard title `000400300000d002` v4096, code SHA256
`a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`.
Both page-padded executable images map contiguously from VA0x100000. Original
executables, extracted resources and configuration bytes remain private.

Evidence root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/keyboard-native/settings-nickname/`.
Run its `invocation-fixture.py`, `normalize-fixture.py`, and
`initial-pose-fixture.py`, in that order, using the sibling artifact root's
`assets/research-venv/bin/python` (Unicorn2.1.4). Its README and JSON record
execution boundaries; `evidence-index.json` hashes the scripts/results/resources.

## Native caller configuration

Settings0x22d358 selects `user_name_input`;0x22d538 clears its text buffer and
copies22 bytes from profile buffer0x2ac6ac.0x19b61c initializes defaults;
0x22d564–0x22d664 applies name-specific fields and launches through0x19b4d4.
The first-boot `start_name` branch uses a different button count and is excluded.

| Request offset | Existing-profile value |
| --- | --- |
| +0x00 | Type0 for the ordinary region branch;4/5/6 selector values choose type3 |
| +0x04 | 1: two-button layout |
| +0x08 | Validity2 |
| +0x0c/+0x10/+0x14 | Password0, parental0, upper darkening0 |
| +0x18/+0x1c | Filter flags0x0f, save flags0 |
| +0x20/+0x22/+0x24 | Maximum10, dictionary count0, maximum digits5 |
| +0x26/+0x48/+0x6a | `Cancel` / empty / `OK` |
| +0x90 | Empty guide text |
| +0x112/+0x113/+0x114 | Prediction0, multiline0, fixed-width1 |
| +0x115/+0x116 | HOME0, reset0 |
| +0x117 | Caller-dependent power flag; see below |
| +0x118/+0x119 | 0/0 |
| +0x11a..+0x11d | 0/0/1/0: right button submits |
| +0x120 | Initial text at shared-memory offset0 |
| +0x124/+0x128/+0x12c | -1: no dictionary/status/learning offsets |
| +0x130 | Shared-memory size0x1000, calculated by original0x1748c4 |

Wrapper0x19b4d4 forces multiline/HOME/reset off and clears restored status and
learning. At0x19b50c–0x19b52c, power remains enabled only when byte0x2975f9 is0
and bit0 of word0x2978fc is1. Both outcomes are fixtures; the reference's actual
caller state remains unobserved. Region selector2 and an English environment
are explicit fixture inputs, not an execution of platform initialization.

The scene's table names `keyboard_cancel` and `keyboard_decide`. Exact English
MSBT member `message_mset/EU_English/mset.msbt` has SHA256
`fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae`;
labels are indices20/19, both style93. Caller code copies their UTF-16 text into
the request; this does not transfer the Settings message style to the keyboard.
The fixture provides parsed resource/message lookup endpoints and executes the
original default initializer, caller, wrapper and string/memory routines.

## Normalization and initial composition

Keyboard0x1015d8 copies/normalizes the0x400-byte request. Fixed-width disables
multiline and caps maximum at32; the name maximum10 survives. Three original-ARM
fixtures through0x101b70 leave configuration bytes unchanged and construct
English default status `[1,0,0,0,2,0,...]` at0x1bd814. There is no restored page,
Caps or Shift state. Platform and shared-memory endpoints are explicit.

- **Text area:** +0x114=1 selects constructor0x187670 at0x1918fc–0x191938;
  its vtable0x1ad470 selects `TextArea_02` through0x197c54. Maximum10 means
  one row and ten cells. Original geometry segment0x186f14–0x187244 sets
  `N_textAreaMSC` scale to1.5882350206375122 on both axes. First picture local
  position is[-85.00001525878906,11.96296501159668,0], first text is
  [-85.00001525878906,8.96296501159668,0]; subsequent cells step17 in X.
  Picture/text cells11–32 become invisible. Preserve authored parent transforms.
- **Initial text/cursor:**0x18751c–0x187590 reads shared text, bounded by maximum
  and multiline rules, calls0x156830, then0x13f190 with cursor=length and
  clear-selection=1. Empty, `Ada`, and ten-letter fixtures prove cursor and
  selection anchor at0/3/10 respectively, with selection inactive.
- **Page:** default status+4=0 reaches QWERTY page0 through0x1937d4–0x193860
  and0x192be4. Initial submode0 uses `qwerty_keytop` for the45 indexed character
  groups. No-prediction initialization at0x17e6d0–0x17e704 sets the QWERTY root
  translation[0,8,0]. At0x1933d8–0x193420 the selector root becomes[0,4,0]
  and arrow root[0,8,0]. These root writes do not resolve every child state.
- **Buttons:** +4=1 indexes `Btm2Btn` at0x1916a8–0x191754. Groups0/2 receive
  caller text through0x191880–0x1918ec.0x191b74 and0x191b8c bind shared clips
  `Btm3Btn_n0s1.bclan` and `Btm3Btn_i0.bclan` to those groups. Initial selected
  frame/material state has not been established by these fixtures.

The original cell arithmetic is unchanged under two different font-query
sentinel pairs: its font-derived size override runs only for maximum<=9.
That check validates this segment's independence, not glyph rendering.
The available shared `cbf_std.bcfnt` decoded source identity is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`
from title`0004009b00014002`; keyboard style/pixel acceptance is still pending.

## Presentation boundary and unresolved branches

Consume the private `initial-pose-fixture.json` for proven cell pane geometry,
visibility and cursor indices; `invocation-fixture.json` for caller fields;
`normalize-fixture.json` for normalized request/default page state. The earlier
`TextArea_01` proposed dependency is incorrect for this native Settings path.

Do not call this a complete initial-pose fixture. Remaining initialization from
0x187244 includes decorations, material/color state and world transforms; the
first text/cursor paint and complete QWERTY/group visibility/animation sampling
remain untraced. Upper-screen caller composition is also unresolved: darkenTop0
alone does not define the retained Settings image. Native timing, touch/physical
input, validation/filter effects and submit/cancel behavior are outside this
initialization slice. These require additional source fixtures and coordinator
reference capture before a complete composition is accepted.
