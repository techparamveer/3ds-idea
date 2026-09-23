# Browser direction input adapter

The native sampler and producer are proved independently of browser event
delivery. The live host needs a small pure adapter for the existing keyboard,
physical-button and circle-pad event protocol before replacing HOME's generic
repeat latch. Application input keeps its current contract.

Presentation may implement a new `src/os/home-input-adapter.ts`, focused tests
and a validation note only, after finishing its current read-only review. Do not
edit System, scene, native sampler/producer/consumer, app input, clocks or painter.
Root owns live routing and clock integration.

The adapter retains a `HomeInputSampler` plus per-source bookkeeping. Accept
directional button down/up/repeat with a source identity and map right/left/up/down
to native0x10/20/40/80. Ignore browser-generated repeat. Each digital source owns
its whole current mask; duplicate downs and independent sources must not double
an aggregate edge. A replacement direction for the same source replaces its old
mask. Keep the original native sampler's aggregate/independent edge arithmetic.

A browser click/accessibility activation can contain down and up before the next
shared poll. Define this explicit **browser adapter policy**: an unobserved down
remains present for one eligible sample even if its up already arrived; remove
that source immediately after that sample so the next sample observes release.
A down already observed by a sample can release normally. A new down before a
pending release is sampled cancels that release and retains the newest source
intent. Do not change the raw sampler, whose documented down/up-between-polls
behavior remains correct. Do not claim this minimum one-sample pulse is native
HID behavior or a measured physical latency.

Expose one explicit sample operation returning the native sample and the next
adapter state. Updates never implicitly sample or advance the native producer.
Pass normalized circle-pad x/y through the existing primary-axis setter, with
browser positive-Y-down converted to native positive-Y-up. The current scene has
one primary analog source (`pointer:CIRCLE`); do not invent multiple-device axis
arbitration. Reject nonfinite/out-of-range input as the raw sampler does.

Provide an explicit reset that clears held sources, pending pulses and sampler
edge history. The host separately delivers any required cancellation to the
native consumer before reset. This unit must not infer power/sleep/app ownership,
touch capture, service readiness, close transitions or cursor behavior.

Tests combine the adapter with the real sampler/producer for a quick click,
ordinary held press and native20/5 repeats, duplicate keys, independent sources,
replacement direction, up/down before the sample, simultaneous digital/axis
edges, strict analog thresholds/Y conversion and reset. Verify immutable state
and no hidden sampling. Run focused tests/typecheck, commit and report limits.
