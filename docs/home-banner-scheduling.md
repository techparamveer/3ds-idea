# Native banner gate and update ordering

This investigation supplies the missing host scheduling contract for the pure
banner lifecycle adapter. It changes no runtime or rendering code. Source is
HOME Menu10.7.0-32E `code.bin`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`, virtual base0x100000.
Private `runtime/reference/banner-scheduling/execute-gate.py` and
`gate-and-order.json` under the firmware artifact directory reproduce nine
isolated ARM cases and check29 instruction anchors plus the upper-scene vtable.

## Load gate

Let `M=0x32ebf4`: manager state is `M+0xc0`, the wait counter is `M+0xc8`,
requested banner type is `M+6`, primary is `M+0x50`, and pending request is `M+4`.
A changed request resets the counter at `0x1ed870`. **The counter is advanced
only by the state1 gate, not on every update after the selection request.**

The manager dispatch table at `0x24c0f8` routes state2 to visibility wait,
state1 to `0x249e84`, state3 to loader completion `0x24a7b8`, and state6 to
steady/pending-request handling. In state2, a visible primary stays there and
receives its normal update. If primary is null or already hidden at the start
of that pass, the state changes to1; it does not run the state1 gate in the same
pass. Common retained-object updating still follows this state dispatch.

The state1 gate executes these checks in order:

1. Requested type0 returns immediately. Types6 and13 skip the next two checks;
   normal folder types9/10 do not skip them.
2. If byte `0x32f50d` is nonzero, set deferred flag `M+0xd=1` and return. The wait
   counter stays unchanged. This is a separate native inhibition input, not a
   resource-ready boolean inferred from elapsed time.
3. If the counter is below5, increment it and return. Starting at0, calls1…5
   produce1…5 and all return. **Call6 is the first that can proceed.** If the
   deferred flag was set and the count has reached5, clear `M+5`, `M+4`, and
   `M+0xd` before proceeding.
4. If the worker handle at `0x32ecfc` exists, `0x1f9174` must report completion.
   A still-running worker delays release even when the counter is5.
5. Join/clean up that worker, release or clear the old primary/secondary,
   launch worker `0x249448` through `0x2357ac`, and enter state3. The isolated
   fixture stops at `0x249f58`, before any release or thread creation.

State3 checks worker completion again at `0x24a7d4`. Once ready, requested
types9/10 dispatch through `0x24ab60–0x24ab68` to `0x24b444`. Folder activation
constructs/restarts the object, requests visibility, stores it as primary, and
sets manager state6. It returns to the common manager update in that same pass.
Readiness, request identity and pending changes remain separate from the wait
counter; no fixed millisecond activation deadline follows from this source.

The earlier lifecycle report's phrase “five manager calls counted from the
request” is imprecise. Executed cases establish the following sequences:

| Starting condition | Counter after successive calls | Release permitted |
| --- | --- | --- |
| State1, folder, counter0, no inhibition/prior worker | 1,2,3,4,5,5 | Sixth state1 call |
| State2, already-hidden loaded primary, counter0 | 0,1,2,3,4,5,5 | Seventh manager call |
| State1, counter2, inhibition set for three calls | 2,2,2 | Never while inhibited |
| Then clear that inhibition | 3,4,5,5 | Fourth subsequent gate call |
| State1, counter5, prior worker still running | 5 | Wait for worker |

The retained hidden primary receives its virtual update during all non-releasing
manager calls in the fixture. Its visibility does not control manager update
eligibility; the native loaded flag at object+0x68 does.

## One native outer update

The checked source chain establishes **manager before attached clip controllers**:

| Call site / data | Operation |
| --- | --- |
| `0x1022cc` in outer update `0x102288` | Calls task update `0x1067dc` |
| `0x10683c` | Task loop calls state dispatcher `0x10e228` |
| `0x10e2c0–0x10e2d0` | Running task invokes virtual+0x20 |
| Upper-scene vtable `0x3221a0+0x20` | Method `0x286e74` |
| `0x286f30`, `0x2857e0` | Upper scene calls wrapper `0x28574c`, then banner manager `0x24c0ac` |
| `0x24c114–0x24c23c` | Dispatches the manager state, including load completion/activation |
| `0x24c23c–0x24c288` | Updates retained loaded primary and secondary through virtual+0x14 |
| `0x1022d4` | After task updates, calls the scene/controller pass `0x103808` |
| `0x103850–0x103894`, `0x10b3d0` | Traverses attached scene objects and their controller lists, invoking controller virtual+0xc |

Attachment/detachment updates the list used by that later pass: `0x24f30c`
inserts and `0x24f48c` removes. Consequently a newly activated normal folder can
attach during its manager update, advance yaw to1, and then advance its started
skeletal/material clips to frame1 in the later controller pass of the same
outer update. When fading out, the object receives clip updates while attached;
the update that detaches it removes it before the later controller pass. A
retained hidden object can continue yaw updates without clip advancement.

That first-sample consequence assumes both passes run and the folder follows
the traced normal activation path. It does not establish the timestamp of a
reference screenshot, physical display presentation, or every transition mode.

## Host contract and limits

`homeClock.updateCount` can supply a count of provisional application updates;
it must not replace native pass eligibility or asynchronous readiness. For a
delta ofN, runN ordered steps: handle the manager state/gate and possible
activation, update the loaded object, then run eligible attached clip updates.
Do not call `advanceHomeBannerManager(N)` followed by
`advanceHomeBannerClips(N)`: a detach inside the batch would incorrectly remove
earlier attached clip updates. The wait counter needs its own state1 call count,
not another wall-clock accumulator or `updateCount-requestUpdate` calculation.

The native manager has independent inhibition: wrapper byte upper-scene+0x30f,
initialization byte `M+0xe`, global flag returned by `0x235fa8`, and manager byte
`M+0xb`. The visible-controller pass separately returns early for bytes
`0x32e738+1/+2`. These gates can make manager and clip counts diverge; rendering
must sample retained values without advancing either pass.

The pure lifecycle module exposes release/activation explicitly and leaves
this gate to its host. Its broad `hiding`/`loading` phases do not represent the
native state1/state3 distinction; integration needs that distinction if claiming
these native delays. Browser resource availability is an explicit additional
host condition. Native loader threads, special types, retargeting across every
loader stage, inhibition ownership, suspended-app scheduling, and graphics
presentation are not reproduced by this bounded source investigation.

Unicorn2.1.4 executes original gate and manager-dispatch instructions. Fixtures
stub interrupt-mask save/restore, prior-thread readiness, and a retained object's
virtual update; they stop before destructive release/thread operations. Outer
ordering is statically verified through instructions and the vtable, not a
whole-application or GPU emulation. No Azahar/browser session was opened, and
there is no new claim about firmware wall-clock cadence or visual equivalence.
