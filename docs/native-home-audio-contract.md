# Persistent native HOME music contract

The accepted first engine covers only the two verified HOME music entries,
`music` and `music-resume`, using the v8 synthesis model and command subset in
[scripts evidence](../scripts/firmware/home_audio_REPEAT_STATE_EVIDENCE.md).
It does not claim arbitrary CSEQ support or native voice-allocation parity.

## Resource boundary

An offline exporter writes a versioned, resource-only pack: the two sequence
DATA blobs, the complete selected bank tree, the five referenced mono signed
16-bit PCM waves and original loop boundaries, and the seven exact arithmetic
tables. Metadata records title/version, source paths and SHA-256 hashes,
converter version, source dependencies and delivery hashes. No ARM executable,
complete firmware package, ticket or credential enters the pack. Export first
into the SSD private artifact directory; public promotion is a separate
integration step after validation. Reject unsupported reachable operations,
missing resources, malformed sizes and invalid references during validation.

The pure TypeScript engine accepts a fully decoded and validated immutable
resource object. It performs no fetch, DOM, Web Audio, worker, clock or storage
operations. Expose `createNativeHomeMusic(resources, entry)` with
`renderFrame()` returning `{ startSample, pcm }`, where `pcm` is a fresh
`Int16Array(320)` containing 160 interleaved stereo sample frames at exactly
32728 Hz and `startSample` is the contiguous absolute frame index. Optional
diagnostic snapshots must be copies and stay outside the render hot path.

## Persistent synthesis

Each call follows the proven v8 native frame order and retains the float32
sequence clock, active tracks and call/wait/gate state, all 24 ordered voice
slots, allocation fields, envelopes, default sweep/LFO state, source cursor,
24-bit fraction, interpolation history, prior main/aux gains and aux returns.
Jumps, call returns and host chunk boundaries never reset these fields.
`music-resume` initializes its own entry; it is not a paused main snapshot.
Preserve each float32 rounding, signed truncation, saturation and exact table
byte representation. Explicitly reject commands outside the audited notes plus
27 non-note forms; do not add speculative sequence behavior.

## Verification and ownership

Assets work owns the offline exporter, pure engine modules under
`src/os/native-home-audio/`, conformance tests and evidence. Integration owns
`src/os/audio.ts`, fetching/cancellation, browser scheduling, output-rate
conversion, sound lifecycle and public promotion. The current short-cue path
is outside the initial music command contract.

Compare exported bytes across independent runs. Compare engine PCM exactly
against the pinned v8 reference at startup, envelopes and note release, voice
pressure, both repeat jumps and the demonstrated late clock divergence.
Verify identical PCM for differently grouped frame requests and copied state
snapshots. State and PCM equality are required before browser integration;
measure actual JavaScript CPU cost without treating the Python measurements as
a browser prediction. Keep conformance scratch and recordings on the SSD.

This boundary targets v8 equivalence. Source-backed timing, allocator gaps and
remaining Azahar/hardware differences remain explicit; passing these tests is
not a full HOME audio fidelity claim.
