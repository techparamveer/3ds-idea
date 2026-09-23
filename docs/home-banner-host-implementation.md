# Pure folder host adapter

`src/os/home-banner-host.ts` implements the prepared ordinary-folder slice of
the accepted host contract. It does not change System, scene transactions,
screens or GPU resources. Background lifecycle remains separate.

## API

- `resolveHomeBannerHostSelection(state)` returns folder `{kind,key,label,nativeType}`,
  app `{kind,id}` or blank `{kind}`. Open folders resolve the selected child;
  root folders use stable session identities and empty9/nonempty10. Power,
  overlays and eligibility do not alter content selection.
- `createHomeBannerHost(clock, inputs)` takes a System session generation,
  current shared integer update count and all five explicit folder-service
  inputs: `managerInhibited`, `sceneInhibited`, `loadInhibited`,
  `nativeWorkerReady`, `resourceReady`. It starts without an observed selection.
- `crossHomeBannerBoundary(host, clock, {selection?, inputs?, refreshActiveLabel?})`
  first consumes elapsed updates using retained inputs/request, binds any newly
  activated presentation, then applies observations at the same count. Omitted
  observations remain unchanged. Supplied inputs replace the complete set.
- `getHomeBannerHostView(host)` is read-only and returns `unsupported`, `pending`
  or `active`. Supported views expose the current `resourceTicket`, folder-scope
  `generation`, service `stage` and `waitUpdates`. `active.folder` contains the
  retained presentation selection/label, generation/request/activation epochs
  and full `motion` (actual visibility, scale, yaw and independent clip frames).

An active retained instance may be hidden and awaiting release while the
incoming selection differs. Paint `view.folder.selection.label`, not
`view.selection.label`. Pending means there is no active folder instance; it
must not automatically paint an incoming reconstructed folder. Unsupported is
an explicit handoff to the application's separate fallback.

## Ordering and readiness

Observe a selection at the current boundary, obtain `view.resourceTicket`, then
acknowledge successful resource preparation through a second boundary at the
same count. That acknowledgement changes no clock or motion. Later counts use
it. A readiness arrival at count100 cannot make counts91…100 ready retroactively.
Resource revocation likewise applies after the preceding interval is consumed.
Revocation prevents later activation; it does not detach an already-active
instance. The scene independently decides how an actual rendering failure falls
back. Promise settlement is not evidence that model/camera/label loading worked.

Only matching generation/request tickets are retained. A stale completion is
ignored and cannot revoke a newer valid acknowledgement; use explicit
`resourceReady:null` to revoke. A changed request,
unsupported handoff or new System generation invalidates the previous ready
acknowledgement. There is no timeout, guessed native worker delay or automatic
readiness. No non-folder visibility acknowledgement is accepted by this slice.

The caller must flush the old System clock before changing selection or
eligibility, as described in the integration contract. The adapter consumes
counts and cannot recover boundaries discarded by a scene mutation. Paint,
capture and render throttling only sample its view.

## Presentation snapshots and rename

The host stores only `pending` (latest request snapshot, including after
activation) and `active`. New requests capture immutable label text. The outgoing
active snapshot survives moves, deletion, slot reuse, retargeting and hiding.
Repeated same-target observations do not change an already-prepared label or
create a new request. This also applies to a rename observed while loading: the
request's prepared label remains authoritative until explicitly refreshed after
activation. A different identity/type captures a new snapshot as usual.

`refreshActiveLabel` is an explicit prepared-text event with
`{generation,activationEpoch,key,label}`. It updates text only for the selected
active identity/type while the service is active; outgoing/hiding instances and
stale events are ignored. It never restarts motion or invalidates resource
tickets. The caller must prepare the replacement label before submitting this
event. This is authored content refresh, not a claim about native rename timing.

## Session and scope lifetime

The outer `host.clock.generation` is the caller's fresh System session identity.
A change clears selection, snapshots and acknowledgements and establishes the
new count baseline without replay. Supply selection again. Reusing an old
System generation string is invalid caller behavior; a same-generation counter
decrease throws, including while unsupported. Layout reset alone keeps the
System generation.

App/blank selections explicitly abandon the folder service. Reentering folder
content allocates the next deterministic `host.scope` and starts at the current
count with a new service generation. Its opaque generation encodes the tuple
`['home-folder-scope', systemGeneration, scope]`. Reused request/activation numbers
therefore cannot accept an earlier scope's tickets or label refreshes. There is
no global counter, randomness or wall clock. This handoff is authored degradation;
it does not reproduce native app/blank transitions or intermediate close requests.
Background attachment, mode and clip lifecycle are not initialized by this host.

## Verification

The focused host suite checks previous-input ordering, labels bound during a
batch activation, readiness and independent pass inhibition, old visible/hidden
presentations, explicit rename, move/delete/recreate, type changes, opened-child
resolution, unsupported handoff and deterministic reentry, stale session/scope
tickets, immutable observations, sampling, batching and counter validation.
Existing service and lifecycle tests remain unchanged. Scene transaction and
browser verification belong to integration.
