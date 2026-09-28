# Folder banner host boundary

The first pure host adapter implements prepared ordinary folder banners only.
It consumes the existing service and stable folder identity APIs, never a new
wall clock. Full application/blank banner mappings, native loader states4/5,
secondary banners and native intermediate open/close requests remain unresolved.

## Accepted API

Add `src/os/home-banner-host.ts` with pure create, boundary-update and read-only
view functions. The caller supplies its System session generation, current
integer HOME update count and explicit service inhibition/readiness inputs.
A selection resolver reads MenuState: opened folders resolve the selected child
app or blank; root slots resolve app, then folder identity and label, then blank.
Only ordinary folders derive a native type automatically: empty9/nonempty10.
Overlay eligibility is separate from selection; overlays never invent blank
content. Keep public types explicit and do not import Three.js or DOM types.

Every boundary first consumes elapsed counts under the RETAINED previous
inputs and request, then applies the new selection/input at the same count.
Track only pending and active presentation snapshots. Activation binds its
request epoch to the pending label; replacing, moving or deleting a selected
folder cannot replace the label of the old fading instance. An explicit rename
refresh for the same active identity changes label without resetting motion.
Expose the current resource ticket so the caller can acknowledge it in a second
zero-count boundary; stale tickets never activate new requests.

A new System generation discards all old snapshots and acknowledgements and
establishes a baseline without replay. The explicit unsupported app/blank
handoff abandons the folder-only service; reentry creates a new deterministic
folder-scope generation under the same System session. It must never fake a
native type or hidden acknowledgement. Report unsupported/pending/active
separately so a pending native folder does not accidentally draw the incoming
reconstructed fallback. This handoff is an authored degradation, not a verified
native transition. Leave background lifecycle integration independent.

## Scene ownership

Integration flushes the old MenuState clock and host before each mutation, then
observes new state/readiness. Render, capture and quality throttling only sample
immutable host views. The view includes active label, actual visibility, scale,
yaw, separate skeletal/material frames and generation/activation epochs.
Rendering binds BannerFolder frames and calls model.update(0,camera); it does
not derive motion from elapsed milliseconds or add an opacity fade.

Preloaded model/camera success, plus prepared required label resources, permits
acknowledging each current ticket. Promise settlement alone is insufficient.
The folder-only browser host explicitly has no outstanding native worker and
may supply nativeWorkerReady=true and loadInhibited=false; neither is a native
worker timing measurement. Resource failures revoke readiness at a boundary.
Reduced-motion and eligibility policies remain explicit caller inputs.

## Ownership and checks

Runtime work owns the new pure adapter, NEW focused tests and its implementation
note only. Integration owns system transaction wiring, screens, scene and GPU
resources. Test previous-input ordering, pending/active labels, move/delete and
rename, generation and stale readiness, opened-child resolution, unsupported
handoff/reentry, and read-only view sampling. Existing service/lifecycle tests
remain unchanged and required.
