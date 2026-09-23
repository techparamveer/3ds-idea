# Native HOME music entry and queue parameters

The streaming transport remains policy-neutral. A bounded original-ARM check
now identifies what the ordinary white-theme music entry selector and its
queue arguments mean. It does not identify every OS caller or establish the
wall-clock duration of native fade updates.

Source: EUR HOME `0004003000009802` version24576, code SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
All executable bytes, excerpts and fixtures remain outside public delivery at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-entry-policy/`.

At `0x1e0af4`, with the ordinary archive mode byte `+0x1c` set, a nonzero
argument1 chooses sound `0x0100001a` (`BGM_CTR_HOME`, our `music` entry).
Zero chooses `0x01000019` (`BGM_CTR_HOME_NO_INTRO`, `music-resume`). Before
queuing either entry, the function queues a stop with argument30 through
`0x1f3540`; an existing alternative sound handle is also stopped through
`0x2349d0`. The themed branch when `+0x1c` is zero is outside this fixture.

Negative argument2 normalizes both remaining parameters to zero. Otherwise
negative argument3 normalizes to zero. The wrapper `0x1f3500` and queue builder
`0x224a3c` store a command containing type0, countdown=argument3,
ramp=argument2 and the integer sound ID. The dispatcher `0x13336c` forwards the
sound ID and ramp to `0x1330b0`; it does not treat argument2 as a seek offset.
A new sound with a positive ramp reaches `0x220240`, whose normal initial-state
branch stores gain0→1, duration=ramp, counter0.

Several callers use `(intro=0, ramp=180, countdown=3)`. The queue loop at
`0x115364..3dc` executes due commands before decrementing remaining countdowns:
starting at3, three passes produce2,1,0 and the fourth executes the command.
This counts queue invocations, not a measured browser delay. Fade duration180
counts a separate native ramp clock whose scheduling is still unverified;
it must not be translated to three seconds without that evidence.

The general entry caller `0x1d9328` chooses the intro only when its external
predicate `0x231b78(0,0)`, main-state byte `+0x3a89` and predicate `0x2ea0ac`
are all false. Otherwise it chooses the no-intro entry with ramp180. Naming
those predicates as every app return, sleep or mute event is not yet justified.
Browser volume/mute and hidden-tab adaptations also need an explicit policy.

`check.py` executes eight entry cases, the original wrapper/queue builder and
dispatcher, the queue countdown loop and fade setter. Intrusive list mutations
and the actual sound-start call are stubbed; no APT, operating system, DSP or
GPU execution is claimed. `checked.json` records all arguments and results.
This prevents conflating the no-intro entry with resuming a paused synth state
or treating native ramp/delay arguments as elapsed seek time.
