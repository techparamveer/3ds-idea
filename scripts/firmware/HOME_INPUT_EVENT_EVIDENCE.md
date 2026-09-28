# HOME input events: press, repeat, release and cancellation

2026-09-23. The native producer establishes **event4 as a new-press edge,
event6 as held-input repeat, and event7 as a release edge or cancellation**.
Event7 is not exclusively a physical button-up notification: touch/input
capture can synthesize it while the digital button remains held. The ordinary
repeat interval is expressed in eligible input updates, not milliseconds.

This resolves the numeric event labels left open in the
[selection-cue evidence](home_audio_CHILD_SELECTION_EVIDENCE.md) and
[cursor-clock evidence](CURSOR_LOOP_CLOCK_EVIDENCE.md). It changes no runtime,
public assets, browser or Azahar state and does not expand into app groups.

## Source and reproduction

Source is the owner-supplied EUR HOME `0004003000009802`, version24576.
Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses are ARM virtual addresses with `code.bin` mapped at `0x100000`.

Private original-ARM fixture, result and **17 hashed source excerpts** are at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-input-events/`.
Run `check.py` with that firmware tree's `assets/research-venv/bin/python -B`.
Fixture SHA-256:
`d08bcaf6ac8cf9c1df1c3b34056695e5fb0e0c0371dbcc62f563cf6a7d9b1f99`.
`checked.json` SHA-256:
`e82ba7aa783c3d8d749a36661e58029e2218e8cec725bfa71f1036fbc63346c9`.

## Sample edges and callback chain

The input record pointer is stored at `0x32e9fc`. Its words `+8/+0xc/+0x10`
are current held, newly pressed and newly released digital bits. This is
established by the actual arithmetic, not inferred from consumer behavior:

```text
pressed  = current & ~previous
released = previous & ~current
previous = current
```

Reader `0x119670` has a path through `0x12caac→0x12ebc4`. The final function
reads the latest ring sample and rechecks its index/timestamps after copying.
`0x12cb48..6c` derives the inner edges and clears bit `0x2000` from held;
`0x1197d4..9808` copies held and recomputes the outer record's edges using
reader `+0x54`. The fixture executes this complete path with stable supplied
ring data, including deliberately bogus ring edge fields. Eight transitions
confirm the output follows held-bit changes rather than trusting those fields.
The alternative reader's arithmetic at `0x1195f0..960c` has the same edge
formulas; that alternative service route was inspected, not replayed here.

After normalized primary-axis conversion, `0x117024` applies strict
thresholds `x>0.5`, `x<-0.5`, `y>0.5`, `y<-0.5` to direction bits
`0x10/0x20/0x40/0x80`. It derives corresponding edges at `0x1170cc..dc`.
These are stored at `0x32e9ec` held, `0x32e9f0` pressed and `0x32e9f2`
released. Nine threshold cases execute the original comparisons: equality
at either threshold is neutral. A 28-poll analog sequence produces the same
press/repeat/release classes as digital direction input. Normalized values
are controlled endpoints; this is not an analog calibration measurement.

Registration `0x1df888(callback,context)` stores callback/context at
`0x32e794/0x32e79c`. HOME construction registers `0x2947f8` and its scene
at `0x2b4e40..48`. Central producer `0x1039d0` calls that function with
`(0,event,mask,scene)`. The thunk rearranges the arguments for `0x294810`.
Normal HOME dispatch `0x295040` routes4/6 to `0x2968fc`,5 to `0x29e064`,
and7 to `0x2a5afc`.

The fixture runs the actual producer, registration, thunk and HOME dispatch.
Movement/held handlers are recording endpoints; event7's horizontal cursor
reset runs its complete native consumer. Existing dedicated fixtures already
establish the movement and sound behavior of events4/6.

## Repeat settings and ordering

Let `G=0x32e78c`, the central input-dispatch state. Startup
`0x1023a4..b0` writes **repeat mask `0xc0f0`** into uint16 `G+2`.
It includes direction bits `0xf0` and bits `0xc000`; this note does not assign
additional hardware-button identities to those last two bits.

| Event | Producer condition and effect |
| --- | --- |
| 4 | Nonzero newly pressed digital/primary-axis bits; dispatch, save that mask at `G+4`, clear shared repeat counter `G+0xc` |
| 6 | Held bits filtered by `G+2` equal the previous candidate `G+4`; increment counter, then dispatch when counter is at least20 and divisible by5 |
| 5 | Nonzero current held bits; dispatch each eligible input update, including press and repeat updates |
| 7 | Nonzero newly released digital/primary-axis bits; dispatch after the held notification; additional cancellation paths are described below |

The shared repeat branch is `0x103b5c..be4`; its signed multiply/divide
sequence at `0x103ba8..bc4` implements the modulo5 check. This timing is
hard-coded in the inspected producer. The normal press resets its counter,
and no second press event is needed for repeats.

An additional normalized direction channel is read through getters
`0x235168/0x235154/0x235140`. It can also trigger the corresponding event
classes. When its platform gate passes, the HOME thunk ORs that channel's
pressed/held/released masks into events4,5/6,7 respectively. The table above
describes the digital/primary-axis route executed here; physical identity,
calibration and service behavior of that additional channel are not claimed.

With a neutral sample at poll0 and a new right bit at poll1:

| Eligible poll | Events in call order | Counter after poll |
| --- | --- | --- |
| 1 | 4, then5 | 0 |
| 2–20 | 5 | 1–19 |
| 21 | 6, then5 | 20 |
| 26,31,36 | 6, then5 | 25,30,35 |
| 37, released | 7 | 35 |
| 38, neutral | None | 35 |

Thus the first repeat is **20 subsequent eligible held updates after press**,
then every five. This is not a measured333 ms/83 ms claim. A fresh press
clears the shared counter. Aggregate-mask changes can skip an increment
without clearing it: the producer updates its previous candidate on that
poll, then resumes incrementing if the next candidate matches. The mixed-mask
fixture covers adding and releasing another direction; do not model this as
independent per-button repeat timers.

The host calls this producer at `0x1022c0`, before the global animation
update at `0x1022dc`. Host flags `&0x107`, a nonzero `G+0x14`, and external
readiness gates can skip event processing. The `G+0x14` route clears `G+4`;
the host-flag route does not. Neither route automatically emits event7.
Actual readiness/service scheduling and the duration between eligible calls
are not executed by this fixture.

## Event7 also cancels active input

Three executed cases show why physical button-up alone is insufficient:

1. **Ordinary edge:** clearing a digital direction bit yields event7 with
   that bit, through `0x103c30..78`.
2. **Active touch:** touch flag `0x32e9e1!=0` and saved candidate `G+4!=0`
   cause `0x103a9c..ac4` to dispatch event7 with that candidate, then clear
   it. The touch flag comes from the touch-record branch `0x10dd10..de00`.
   The fixture supplies the flag; it does not emulate the touch service.
3. **Input capture:** when a registered handler makes aggregate capture
   flag `G+0` rise relative to previous flag `G+1`, `0x103ac8..af0`
   dispatches event7 with **`0xcfff`**. The fixture supplies a registered
   handler with its capture byte set and executes the list scan; its update
   virtual is a no-op endpoint.

In cases2/3, the native sample's digital released mask stays0 and the supplied
right button remains held. The repeated captured/touch poll emits no second
cancellation. Independently, digital and analog edge masks are ORed rather
than derived from the combined held state: returning analog right to neutral
while digital right stays held emits event5 right, then event7 right. A
four-poll overlapping-source fixture verifies that case too.

At HOME consumer `0x2a5b5c..ba8`, event7 mask `&0x30` clears scene scroll
counter `S+0x3c98` and sets primary cursor Loop step to1. It retains Loop
phase. The complete producer→callback→consumer fixtures verify ordinary
release, touch cancellation and capture cancellation reset a controlled
step3/current17.25 to **step1/current17.25**. Vertical-only release lacks
`0x30` and does not perform that reset, as previously verified.

The scene scroll counter is distinct from the central input repeat counter
`G+0xc`. The cursor's step3 threshold counts mode3 scene entries; this trace
does not reclassify it as a count of all presses or repeat notifications.
Explicit calls to `0x2a5afc` with `0xcfff`, already recorded in the cursor
note, are further reset paths outside ordinary per-key release.

## Consequences for existing evidence and verification limits

Successful ordinary grid movement requests the existing selection cue on
both **initial press4 and repeat6**. Horizontal range rejection requests its
invalid cue on press4 and suppresses it on repeat6. These interpretations
now connect the established consumer behavior to its actual producer.
Event7 resets horizontal cursor acceleration for release **and cancellation**;
it must not be treated as a new Loop start or a universal physical key-up.

Passed: 39-poll digital timeline, eight repeat-mask cases, 32-poll mixed-mask
timeline, 28-poll analog timeline, nine threshold cases, four overlapping-
source polls, eight reader-edge cases, four touch-cancel polls, four capture-
cancel polls and five gating cases. All17 excerpt hashes were independently
verified. No application tests/build were needed for this evidence-only note.

Original ARM ring-copy consistency checks, digital edge arithmetic, primary
axis threshold/edge logic, repeat arithmetic, callback routing and horizontal
reset execute unchanged. Ring samples, normalized axes, platform/readiness
results and capture/touch flags are controlled fixture data. Analog filters,
movement/held consumers and the capture update virtual are named endpoints.
No physical HID service, debounce, concurrent ring writer, wall-clock cadence,
sleep/APT scheduler, browser or Azahar session was executed. This resolves
event meaning and update-count repeat settings; the clock note's outer
scheduling and scene-lifetime limits remain.
