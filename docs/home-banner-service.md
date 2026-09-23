# Pure HOME banner service

`src/os/home-banner-service.ts` bridges a shared integer update counter to the
existing pure banner lifecycle. It owns the normal primary-banner gate and
per-tick ordering; it has no renderer, DOM, loader, persistence or millisecond
clock. `system.ts` and scene integration remain the host's responsibility.
The lifecycle module is unchanged. Source gate/order evidence and isolated ARM
fixtures are documented in [banner scheduling](home-banner-scheduling.md).

## API and explicit inputs

Create a service with `createHomeBannerService({generation,updateCount})`. Use a
nonempty host-session identity for `generation`, and the current
`System.homeClock.updateCount` as the baseline. Creating at counter900 does not
replay900 ticks. Queue selection using
`requestHomeBannerService(service,{target,options?})`. The unchanged lifecycle
deduplicates requests and decides same-current folder reuse; changed requests
reset the gate wait count. `getHomeBannerResourceTicket(service)` returns
`{generation,requestEpoch}` for that request, suitable for an async completion.

`advanceHomeBannerService(service,count,inputs)` processes native update counts.
`syncHomeBannerService(service,{generation,updateCount},inputs)` consumes the
shared counter's delta. Both use the same ordered per-tick implementation.
All inhibition/readiness fields are required so callers state their policy:

| Input | Meaning |
| --- | --- |
| `request?` | Optional selection/options, applied once before the batch; may also be applied with count0 |
| `managerInhibited` | Combined native wrapper/manager inhibition; stops state dispatch, gate counting and folder yaw/visibility updates |
| `sceneInhibited` | Independent attached-controller pass inhibition; stops folder/background clip updates |
| `loadInhibited` | Native byte0x32f50d; freezes the state1 wait counter and sets the deferred flag, but leaves object/scene updates eligible |
| `nativeWorkerReady` | Completion of the worker checked before release in state1 and before activation in state3; the host supplies the relevant stage's result |
| `resourceReady` | Null or the exact ready `{generation,requestEpoch}` ticket; a stale completion never activates a different request |
| `nonFolderPrimary?` | `{generation,activationEpoch,visible}` for an active app/blank primary, whose visibility is not simulated by the folder lifecycle; missing/stale evidence keeps the old primary in hiding |

Inputs cover the entire requested batch. Split batches at request, readiness,
visibility and inhibition changes. Consume elapsed updates under the previous
inputs before applying an event known to have occurred afterward; the adapter
cannot reconstruct event times from a current snapshot. Repeating a request with
`forceReload:true` intentionally creates another request epoch, so submit it as
an event rather than a persistent per-frame preference.

## Native stage and pass ordering

Service stages correspond to native gate/state1, hiding/state2, loading/state3
and active/state6. A new service starts at the gate without a selected target.
Type0 returns without progressing the gate or loading stage. Types6/13 preserve
the source's wait/inhibition bypass, without implementing their special visuals.

For ordinary folders9/10, the gate increments and returns on calls1…5, then may
release on call6 when the worker is ready. Even preloaded resources activate in
the loading branch of a later pass. When replacing a visible folder, the old
folder first fades/detaches; the next manager pass observes it hidden and enters
the gate without incrementing the wait count. Hidden retained folders still
receive manager updates until release, but no detached clip updates.

Each consumed tick runs the manager state branch, possible activation, the
retained folder's manager update, and then the eligible scene clip pass. Thus a
newly activated normal folder reaches yaw1 and clip1 in the same eligible tick.
BatchingN ticks interleavesN such steps. It never runs all manager updates before
all scene updates, which would erase attached fade-out clip frames.

Readiness remains external. A loading request can wait indefinitely without
activation; count alone does not manufacture a completion. A request during
hiding/gating/loading retargets the pending lifecycle without reviving the
object being removed. Retargeting resets the native gate counter, while an
already-loading stage stays loading and requires the new request's ready ticket.

## Counter and rendering ownership

The service's `clock` is a cursor into the shared counter, not a new wall-clock
accumulator. Inhibited ticks are consumed without later catch-up. Sampling the
same counter again performs no updates. Moving backward within the same
generation throws; `homeClock.updateCount` is monotonic within a live System.

Creation/restore of a System requires a new generation. A generation change
resets the lifecycle, gate, background setup and readiness tickets and records
the new counter baseline without replaying elapsed time. Supply the current
selection again, and reapply the scene-owned background setup. Include generation
with activation/clip epochs in renderer cache keys: epoch1 in a new session is
not the previous session's banner instance.

The immutable `lifecycle` member remains the source for rendering. The host can
apply the existing background attachment/mode helpers to it and retain the
result in the service. Rendering reads yaw, visibility, scale and clip frames;
it must not call advance functions. A presentation frame need not correspond to
exactly one logical update, and nominal60Hz remains the shared clock's explicit
application assumption.

## Folder identity required from the host

Folder maps store labels by grid slot, so neither slot nor label is a stable
banner identity. The runtime now supplies opaque instance keys through
`getHomeFolderIdentity(state,slot)` and `System.homeFolderIdentities`; see
[live folder identity](home-folder-identity.md). The host uses that key per folder:

- Creation allocates a new key; deletion retires it. Recreating a folder in the
  same slot with the same label gets a different key.
- Moving/swapping a folder transfers its key with its label, children and history.
  A rename changes display data while retaining identity. A label refresh may
  require an explicit resource refresh; it must not silently redefine identity.
- Empty/nonempty changes retain the key but change native type9/10; the lifecycle
  treats that type change as a new activation.
- Restore may generate fresh session-local keys together with a new service
  generation. This bounded adapter does not require or add a persistence schema.

App registry IDs can identify app targets; a dedicated stable blank key can
identify the blank target. Include kind/native type as well as key in requests.

## Verification and remaining gaps

The service suite checks initial/visible/hidden replacement, native wait-counter
sequences, pre-hide reversal versus reload after hiding starts, retargeting,
stale async/session tickets, independent inhibited passes, type0/6/13 gate
branches, explicit non-folder visibility, batching equivalence, shared-counter
resets and background independence. Existing lifecycle tests still execute
unchanged against source-derived yaw/visibility/controller fixtures.

Normal folder9/10 gate timing and manager-before-clips order are source-backed.
Native app loader states4/5, secondary banners, special-type loading, worker
creation/join ownership, inhibition ownership, suspended-app scheduling, and
request changes throughout every native loader stage are not reproduced here.
For non-folder targets the host's readiness acknowledgement must cover those
omitted loading/activation stages; `resourceReady` is not proof that a native
worker or native software transition completed. The host must also drive their
visibility and motion. No guessed app fade or readiness delay is substituted.

Asynchronous browser loading/cancellation and GPU resource disposal remain host
work. Stale tickets prevent activation but do not cancel external I/O. This
module is not wired to system/scene and has not received browser verification.
