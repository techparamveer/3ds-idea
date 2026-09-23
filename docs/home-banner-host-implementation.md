# Pure primary banner host adapter

`src/os/home-banner-host.ts` supports ordinary folders, default type7 BannerDef
and explicit type13 clear. See [source verification](native-default-banner-runtime.md). It does not change System, scene transactions,
screens or GPU resources. Background lifecycle remains separate.

## API

- `resolveHomeBannerHostSelection(state)` returns folder `{kind,key,label,nativeType}`,
  app `{kind,id}` or default `{kind:'default'}` for a true vacant slot. The resolver
  never returns explicit `{kind:'clear'}`. Open folders resolve the selected child;
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
  `cleared` or `active`. Supported views expose the current `resourceTicket`
  (null for clear), primary-scope
  `generation`, service `stage` and `waitUpdates`. `active.primary` contains the
  retained folder/default presentation selection, generation/request/activation epochs
  and full `motion` (actual visibility, scale, yaw and independent clip frames).

An active retained instance may be hidden and awaiting release while the
incoming selection differs. For an outgoing folder, paint `view.primary.selection.label`; default has no
label. Pending means there is no active primary and must not invent a ready
incoming model. Cleared means type13 completed with `primary:null` and no new
model activation epoch. Unsupported is
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

Default readiness requires exact EUR model/clips, all required textures, camera
and a usable compositing path. Clear has no resource ticket or model readiness,
but still needs the native worker and hide/gate handshake.

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
activation/clear) and `active` (folder/default only). Folder requests capture immutable label text. The outgoing
active snapshot survives moves, deletion, slot reuse, retargeting and hiding.
Repeated same-target observations do not change an already-prepared label or
create a new request. This also applies to a rename observed while loading: the
request's prepared label remains authoritative until explicitly refreshed after
activation. A different identity/type captures a new snapshot as usual.

Default never requests label preparation. `refreshActiveLabel` is an explicit prepared-text event with
`{generation,activationEpoch,key,label}`. It updates text only when both selected and active kinds are folder, with matching
identity/type while the service is active; outgoing/hiding instances and
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

Folder/default/clear retain one service scope. Adjacent vacancies deduplicate
across slots and root/child contexts using `HOME_BANNER_EMPTY_KEY`; kind/type
distinguish default7 from clear13 despite the shared key. App selections
explicitly abandon the service. Reentering supported content allocates the next deterministic `host.scope` and starts at the current
count with a new service generation. Its opaque generation encodes the tuple
`['home-primary-scope', systemGeneration, scope]`. Reused request/activation numbers
therefore cannot accept an earlier scope's tickets or label refreshes. There is
no global counter, randomness or wall clock. This handoff is authored degradation;
it does not reproduce native app transitions. Integration supplies intermediate
clear requests at explicit event/update boundaries. Same-counter observations
remain a latest-request latch and do not manufacture intermediate completions.
Background attachment, mode and clip lifecycle are not initialized by this host.

## Verification

The focused host suite checks previous-input ordering, labels bound during a
batch activation, readiness and independent pass inhibition, old visible/hidden
presentations, explicit rename, move/delete/recreate, type changes, opened-child
resolution, unsupported handoff and deterministic reentry, stale session/scope
tickets, immutable observations, sampling, batching and counter validation.
Existing service and lifecycle tests remain unchanged. Scene transaction and
browser verification belong to integration.
