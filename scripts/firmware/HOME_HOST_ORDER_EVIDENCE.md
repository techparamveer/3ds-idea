# HOME host ordering and eligible update boundaries

2026-09-23. The ordinary main-loop route calls the HOME input producer **once
per host pass**, then the task list, global 3D controllers, global 2D layouts,
and application audio. Native nested registration puts upper task5 before
lower HOME task1 in ordinary lower-scene construction. Their relative order
is therefore **input → upper/banner → lower/mode3 → 3D → 2D/Loop → audio**.
Each domain has separate eligibility gates; an inhibited input producer does
not automatically freeze the other domains.

This extends [input events](HOME_INPUT_EVENT_EVIDENCE.md),
[cursor acceleration](CURSOR_ACCELERATION_EVIDENCE.md), and
[cursor Loop ownership](CURSOR_LOOP_CLOCK_EVIDENCE.md). Combined with
[normal presentation pacing](home_audio_FADE_CADENCE_EVIDENCE.md), it supports
an ordered, presentation-paced application pass. It does not establish a
fixed hardware frequency, a separate repeat timer, or missed-frame catch-up.
No runtime, public asset, browser or emulator change is included.

## Source and reproduction

Owner-supplied EUR HOME `0004003000009802`, version24576; executable mapped
at `0x100000`. `code.bin` SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_host_order.py](home_host_order.py) with Unicorn2.1.4 and Capstone5:

```sh
python scripts/firmware/home_host_order.py \
  --code /private/path/exefs/code.bin \
  --output /private/path/native-host-order/verified
```

The script rejects a different executable hash. It executes original ARM
instructions against supplied objects and explicit service/output endpoints.
It writes `checked.json` and38 private source/vtable excerpts, recording
both original-byte and rendered-text hashes. Firmware, results and excerpts
remain outside the repository, under:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-host-order/verified/`.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `47547db8a2cf1c0a3532661a63a70a707e07c14b21d9cdca610a7508dbe728a1` |
| `checked.json` | `44f50ab920d2e78c22bd14c4bc6f014b22eaefd7f5f7b0f314530d2fc81fd733` |

Checks cover ordinary registration, one neutral host pass, one directional
press through that pass,16 domain-gate cases,8 input-edge/gate cases, and78
iterations of the original ordinary main-loop fragment. All pass.

## Host order and the ordinary main backedge

Main `0x101a9c..0x101b44` first calls lifecycle edge helper`0x102520`, then
host wrapper`0x102288` at`0x101aac`. If that wrapper returns zero, main calls
`0x101d54`, calls presentation`0x102108`, then branches back to`0x101a9c`.
The nonzero result takes a cleanup route, outside this ordinary-loop fixture.

Within `0x102288`, the original call order is:

| Call site | Target | Role in this proof |
| --- | --- | --- |
| `0x102294` | `0x102d4c` | Statistics endpoint |
| `0x10229c` | `0x10dcb8` | Input sample-acquisition endpoint |
| `0x1022a8` | `0x104830` | Host service endpoint |
| `0x1022b4` | `0x105860` | Host service endpoint |
| `0x1022c0` | `0x1039d0` | Actual event producer and registered HOME callback |
| `0x1022cc` | `0x1067dc` | Actual forward task traversal and dispatch |
| `0x1022d4` | `0x103808` | Actual global 3D pass |
| `0x1022dc` | `0x103df8` | Actual global 2D pass |
| `0x1022e4` | `0x1046bc` | Actual application-audio wrapper |
| `0x1022f4` | `0x104ee8` | Final host-status endpoint |

Service return values are ANDed into an aggregate status; an earlier zero
return does not branch around later phases. Relevant calls receive freshly
read flags from`0x32e688+4`. The 2D call receives the signed byte at
`0x32e688+1`. The wrapper increments its counter at`0x32e688+0x10` once.
There is no host loop that consumes an elapsed count or repeats the input,
scene, layout or audio phases to make up missed presentations.

The static direct ARM branch references found for`0x1039d0`, `0x1067dc`
and`0x103808` are their host sites above; the direct reference to`0x102288`
is the main site above. This corroborates the executed ordinary route; it
is not exhaustive proof against indirect calls or unrelated entry paths.

**The 2D pass also has a direct call at`0x1b573c` in`0x1b56f4`.** Do not
promote the ordinary host result into a universal assertion that every
layout controller advances exactly once per display presentation. That
additional route is recorded statically, not invoked in the ordinary fixture.

## Why upper task5 precedes lower task1

Registration`0x230780` calls factory`0x27b624` before storing the task lookup
and appending the returned object with`0x230710`. The latter inserts before
the list sentinel: existing items stay ahead of the newly completed object.

Factory ID1 invokes lower constructor`0x2b9b68`. Its native fragment at
`0x2baadc..0x2bab30` registers child IDs6,7,5, then looks them up and stores
ID5 at lower`S+0x3aa0`. Those child objects therefore finish registration
before the outer ID1 object is appended. The bounded constructor fixture
executes the actual factory, recursive registration, ID setter and list
operations, yielding `[6,7,5,1]` and verifying the stored upper pointer.

Other constructor bodies are endpoints in this check; the lower constructor
is entered through its child-registration fragment, with its object register
supplied. `[6,7,5,1]` is the fixture's list, **not an exhaustive full-application
roster**. The proof is the relative upper-before-lower order produced by
this ordinary construction route. Replacements, teardown, re-registration
and asynchronous construction are not covered.

Task walker`0x1067dc` traverses the forward list at`0x344fa0`, obtains each
object from node`object+4`, then runs readiness`0x10e180` and dispatch
`0x10e228`. For lifecycle byte`object+0x5c=6`, dispatch calls vtable`+0x20`:

| Object | Vtable | Active method |
| --- | --- | --- |
| Upper, ID5 | `0x3221a0` | `0x286e74` |
| Lower HOME, ID1 | `0x322364` | `0x2b56e8` |

The host fixture supplies these two mature tasks in the proven relative
order; task6/7 bodies are omitted. Both real active methods execute, with
unrelated callees intercepted as documented below. Lifecycle0 suppresses
that object's active method in executed gate cases. Static dispatch also
shows lifecycle5 calling vtable`+0x1c`, writing6, and falling through to the
active method in that pass. States3/4 and7/8 have setup/teardown routes;
this note does not run their complete lifecycle.

## A directional press affects this same pass

The supplied root view starts with selected slot2, left slot0, density0,
mode0, acceleration counter5, and Loop phase17.25/step1. A new right press
runs actual producer`0x1039d0`, callback`0x2947f8`, selection handler,
state setter and mode3 entry before task traversal.

Native selection becomes3, mode3 duration becomes5, and Loop step becomes3.
Upper/banner update then runs. Lower's actual mode dispatch calls
`0x2a1bbc`, producing elapsed1. The 3D controller advances11→12; the later
2D Loop submits17.25, then advances to20.25. Application audio follows.
This is an executed ordering result, not timing inferred from animation names.

A neutral mode3 pass instead advances elapsed0→1, hidden folder yaw
counter0→1, the independent attached 3D controller11→12, and Loop
17.25→18.25 after submitting17.25. The host and application-audio counters
both become1.

The78-pass main fixture supplies neutral input at index0, right held at
indices1–76, then release at77. Original main control flow invokes all host
phases once per iteration; the fixture inserts no extra scene/layout calls.
New press is followed by repeats at21,26,31,…,76. Mode3 entry indices are
`1,21,30,41,50,61,65,71,75`; acceleration begins at61. A replayed entry at30
ends that pass with elapsed0 and advances to1 on pass31. Release at77 resets
the acceleration counter and step while preserving the active duration5;
that same pass leaves elapsed2. These results match the earlier one-scene-
update-per-poll experiment, now using the native shared host ordering.

## Separate eligibility gates

The following are executed cases unless explicitly labeled static. Gates
hold only their relevant domain in these supplied ordinary states; they are
not a universal suspend policy.

| Gate | Observed boundary |
| --- | --- |
| Input flags`&0x107` | Individual bits1,2,4,0x100 suppress normal callbacks; retained candidate`0x32e78c+4` is unchanged. Task lifecycle0 isolates these flag tests from transition/cleanup behavior |
| Producer pause`0x32e78c+0x14`, or readiness`0x10dc20(-1)=0` / `0x10cd20(2)=0` | Suppresses pending directional edge and clears retained candidate; ordinary tasks, 3D, 2D and audio still run |
| Upper/lower lifecycle0 | Skips that active task body; global controllers and audio remain eligible |
| Lower overlay pointer`S+0x3fe0` present | Actual lower dispatch delegates to overlay endpoint and reaches common footer, skipping mode3 tick; global Loop still advances |
| Upper byte`+0x30f` nonzero | Skips banner wrapper update |
| Manager initialized byte`0x32ebf4+0xe=0` | Upper wrapper does not call manager`0x24c0ac` |
| Manager pause byte`0x32ebf4+0xb`, or`0x235fa8` nonzero | Manager entry occurs but folder update does not |
| Global 3D bytes`0x32e739` or`0x32e73a` nonzero | 3D entry occurs, but attached controller does not advance; banner yaw and 2D Loop still advance |
| Cursor layout`L+0x60=0` with HOME hidden policy2 | 2D list skips the layout, holding Loop phase and submission |
| Cursor layout`L+0x5c=2` | Layout's inner method skips controllers, holding Loop phase and submission |
| Outer audio byte`0x32e854=0` | No call to`0x10c508` |
| Inner audio byte`0x32e864=0` | `0x10c508` returns before queue/manager/archive calls and audio counter increment |

The hidden-layout case supplies matching HOME visibility state and policy2;
policy1 would make a hidden cursor visible again in the lower common footer.
This matters when testing layout visibility across the whole host pass.

The banner check uses actual folder update`0x249164→0x1fa344→0x24e0c0`
with loaded byte`+0x68=1`, while hidden. The independently attached controller
uses`0x24ff10→0x1bbd94`; it is a different supplied owner, not a hidden
folder forcibly inserted in the render list. The original manager also
checks the loaded byte before the virtual update; this condition is static
here. Broader banner load/visibility behavior belongs to its existing evidence.

Audio calls are ordered`0x1152a8`, `0x115ad4`, `0x115a38`, `0x11296c`.
The application counter at`0x32e864+0x24` increments once while enabled.
Their bodies are endpoints in this fixture; the earlier fade-cadence fixture
executes the queue/player/fade paths and distinguishes the separate
160-sample audio worker. This result does not put that worker on the host clock.

## Scheduler interpretation and limits

A runtime following the ordinary native route should process eligible input
before the scene tasks, preserve upper-before-lower ordering for this task
composition, then advance eligible global 3D and 2D controllers and application
audio. A mode3 duration counts eligible lower mode3 updates; the input repeat
counter counts eligible producer calls. Neither count should be silently
substituted for wall-clock milliseconds or tied to an independent timer.

The normal presentation wait is established separately by
[fade-cadence evidence](home_audio_FADE_CADENCE_EVIDENCE.md): the route waits
for both display-event counters to change, and counter jumps9/7 release it
once. Together these findings support one ordinary application pass per
completed main-loop iteration, without synthesizing nine/seven catch-up
updates. They do not establish unconditional60Hz or one pass for every
physical interrupt. Presentation bypass, suspend/system paths, special layout
calls and actual service latency retain their stated limits.

The native ordering alone also does not guarantee that every lower-task
change waits until the next upper update: a lower handler may directly call a
manager. Preserve each traced direct call rather than infer a blanket delay.

## Fixture boundaries

No executable instructions are patched. Hooks return from named endpoints,
redirect the bounded lower-constructor fragment, and stop the main backedge
after78 iterations. Objects, list membership, sample edges and readiness
values are supplied state, not a hardware capture. The file records fixed
endpoints and every additional direct callee intercepted from the lower/upper
active methods. The direct-callee filter verifies the actual BL destination;
it does not classify an arbitrary return address as a call.

Native lower mode3 entry, tick, completion, idle-entry state changes and
pending-input replay remain enabled. Common cursor visibility uses the actual
primary-layout setter. Secondary-layout visibility, visual/grid/widget
services, ordinary idle-update callee`0x2960ec`, upper's input virtual,
selection audio, graphics submission,
locks/context acquisition and audio-manager output remain endpoints. Upper's
`+0x30e=1` takes its real later-UI skip branch;`+0x45e=1` avoids a separate
AppQuit recovery route. Full upper UI and native attachment/load lifecycles
are not reconstructed by the fixture.

Main's lifecycle helper, intervening service and presentation are explicit
endpoints with no simulated latency. Thus the78 iterations prove ordering
and call counts, not elapsed time. The linked presentation research supplies
the separate bounded wait evidence. Hardware scheduling under load, complete
APT/suspend behavior, mixer synchronization and browser scheduling policy
beyond this ordinary route remain outside this task.
