# Folder close: cursor, footer and balloon

2026-09-23. Normal close mode44 requests **cursor hiding** and the footer's
**SceneOut animation**. Disabling button input is a separate operation. The
checked balloon path does **not** establish unconditional hiding on close:
an already-visible eligible balloon can remain visible in mode44.

Source: owner-supplied EUR HOME `0004003000009802`, version24576, executable
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Private fixture, decoded clips and 28 hashed source excerpts are on SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-folder-close-overlays/`.
Run `check.py` with that firmware tree's `assets/research-venv/bin/python -B`.
Fixture SHA-256:
`7ff395f4ee86f467d7e4fba61b40661bcc1bd76b7a5700018f0b14f944148e1a`.
`checked.json` SHA-256:
`e48431d2f9447a6f79efe1219afbd2df3cbe8c89e7bd582e53343c8bc3d58839`.
No runtime, public asset, browser or emulator changes are included.

## Close setup and common update

The state setter `0x1e8f38` enters44 through `0x1e3a70` and dispatch target
`0x1e44a8`, which calls `0x1de370(scene,0)`. The normal zero-argument branch
starts `scene+0xe34/+0xe30` in playback mode1. These are the capture and folder
reverse fades; this pass does not change their established bindings. Main
update dispatch for44 is `0x2b7924→0x29f0a4`, then common update `0x2b8448`.
The fixture checks its still-playing branch, with pane translation and other
scene refresh work recorded as sinks.

Setup calls `0x1de8ec`, then `0x1e0cb4(scene)`, then `0x1e2180(scene,0)`.
The first disables control groups through `0x1eb39c` and virtual `+0x18`.
For checked button vtable `0x3214b0`, that virtual is `0x2501f8`: it writes
input-enable byte `+0x14` and clears byte `+0x0c`. **It is not pane visibility.**
The footer handlers also receive input-disable through `0x2535d0`.

`0x1de3f4..3fc` really hides `scene+0x76c`, but that object is the pickup
variant of **LncIconSleep_00**, bound at `0x2b1790..17b4`. It is not the
balloon, which is `scene+0x81c`.

## Cursor: hide request and guards

Constructor `0x2b1cd8..1ce8` binds `scene+0x820` to **LncCsr_00.bclyt**.
At `0x1de574..58c`, close writes `scene+0x3a88=2` only when
`scene+0x3ca8==0`. A nonzero exceptional value preserves the old request.

Common update consumes request2 at `0x2b8550..8568`: if cursor-visible flag
`scene+0x3a4e` is set, it clears the flag and calls
`0x232234(scene+0x820,0)`, writing actual layout visibility `+0x60`.
The surrounding gate `0x2b8490..84c0` requires `scene+0x3fd0/+0x3fd4` null
and excludes numeric modes185/186. Stack aliases for the two pointers are
established at `0x2b5a6c..5a80`. Mode44 passes with both pointers null.

The fixture executes the real request write, common gate and visibility setter.
Two request-guard cases and six common-update cases cover normal hiding,
already-hidden state, both overlay guards, excluded mode185 and request1.
This concerns the primary cursor, not every independent cursor-effect layout.

## Footer: input removal followed by SceneOut

`scene+0xab0` is the footer controller constructed by `0x258408` at
`0x2b295c`. Loader `0x257d88` builds **LncBtmBtn_02.bclyt** from pointer table
`0x33c6bc`, storing the layout at controller `+8`. The table's `+0x0c` is
`SceneOut`; `0x257f2c..7f58` stores that animation at controller `+0x100`.
The input manager at `scene+0x1084` is constructed at `0x2b4840..4848`;
actual constructor `0x2538c0` stores its controller at manager `+4`.

`0x1e0cb4→0x1df8d4` sets manager `+0x46=1`, clears `+0x47/+0x48`, clears
scene `+0x3a4c`, and writes `+0x3c8e=-1`. Common update `0x2b86ac..86c0`
calls `0x253614(manager,1)` before `0x2580a0(controller)`:

1. `0x25370c→0x1f6814` deletes and clears 15 non-null button handlers.
2. `0x258078` requests exit with controller `+0x12d=1` when enabled
   (`+0x12e!=0`) and active (`+0x5e0!=0`), and clears the enter request.
3. In settled controller state2, `0x2581b8..81e0` consumes exit, starts
   controller `+0x100` through virtual `+0x10`, and enters state3.
4. State3 waits while animation state `+0x14` equals1 or2. When it is neither,
   `0x258258..8264` resets controller `+0x11c` to -1 and state to0.

**LncBtmBtn_02_SceneOut.bclan** has 15 source frames. Its `N_Scene_00`
Hermite keys run from frame0 to14: Y `0→-32`, alpha `255→0`. The source
requests a moving, fading footer, not immediate layout hiding. The fixture
executes manager consumption and controller states with animation start
recorded, then supplies animation states1,2,0 and checks footer states3,3,0.
Resource decoding verifies the keys separately. Display cadence and elapsed
duration are not established here.

## Balloon: conditional disappearance, unresolved close context

Construction `0x2b1c48..1c84` binds `scene+0x81c` to **LncBlln_00.bclyt**,
`+0xcf0` to **Appear** and `+0xcf4` to **DisAppear**. Common update calls
`0x1e66bc(scene,0)` at `0x2b8588`, after the cursor path.

Predicate `0x2eb804` requires a nonnegative selected slot `+0x1178`, null
`+0x3fd0`, zero `+0x3ca8`, zero words `+0x118c/+0x1190`, and metadata bits0/1
through `0x1e89f8` and `0x1e6b44`. A manager condition can reject it too:
non-null manager `+0x14` whose object has `+0x1f1!=0` and `+0x11==2`.
Numeric modes2,4,14 are excluded; **44 is not**. These exclusions must not be
mislabeled as settled-folder state: ordinary folder opening returns to idle0.

When previous eligibility `scene+0x3a44` differs from the new result:

- Result0 stores0 and starts DisAppear at `0x1e6728..6738`.
- Result1 only stores1, shows the layout and starts Appear in mode0.
  Mode44 does not make a newly eligible hidden balloon appear.

With result1 and mode44, the function returns before placement/text updates.
It does not clear an already-visible balloon. With result0, when DisAppear's
state `+0x14` reaches2, `0x1e6b1c..6b40` calls `0x232234(balloon,0)`.
The six-frame DisAppear clip fades `N_Base_00` alpha `255→0` over keys0..5.

Seven isolated ARM cases execute the real predicate, metadata reads and update:
eligible-visible stays visible; lost metadata eligibility, nonzero view fields,
or selected -1 start DisAppear; newly eligible-hidden stays hidden in44; and
completed disappearance clears visibility. The full child-reparent routine
`0x2a6cf4..6f10` contains no balloon reparent operation.

This does not establish universal balloon hiding or attachment to the shrinking
folder. The actual preceding selection, view fields and metadata still need
to be established for the reference close sequence. A controlled fixture is
not an observed HOME session.

## Verification limits

The entry fixture executes state dispatch, close setup, input writes, footer
requests and cursor hiding. Other scene work (`0x1e2180`, `0x2a6cf4`, upper
manager and UI/service refresh) is explicitly stubbed there. Separate balloon
tests run its predicate and metadata reads without stubbing those decisions.
Animation start and handler destruction are recording endpoints; no graphics
drivers, framebuffer draw or browser pixels are tested.

The subsequent [child-selection trace](home_audio_CHILD_SELECTION_EVIDENCE.md)
resolves ordinary directional movement and identifies the balloon's density
fields. No cue mapping changed in this close-overlay pass.
