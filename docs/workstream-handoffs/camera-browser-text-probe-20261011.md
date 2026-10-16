# Temporary Camera Browser Text Probe

## Purpose

This opt-in diagnostic distinguishes observed text-cache ink/material changes
from destination-composition or resource/view differences. It is not a rendering
fix. The closed production HOME1 to first Resume600 residual remains 252 upper
and 623 lower exact-RGB pixels (delta greater than 2: 1/333, maximum 3/20).
The earlier CPU diagnosis did not reproduce that signature and did not exclude
long-lived Chrome canvas history or establish a font/cache/smoothing cause.

## Activation And Scope

All three conditions are required: a loopback hostname, `lcdCapture=1`, and
`cameraTextProbe=1`. Development mode does not bypass them. The source collector
opens only for an actual ready Camera `main` draw. Guide, gallery, shooting,
Manual, HOME and unrelated paints do not acquire text samples. Guide history
still affects the normal renderer; it is deliberately not instrumented.

The disabled path does not hash pixels, inspect diagnostic context attributes,
build glyph metadata, or add diagnostic paint/export fields. There are no new
Canvas pixel reads or exports. A fill fingerprints the existing `ink.data`
before and after material coloring. A hit references the prior immutable fill;
a cache filled outside the collection scope reports `fill-not-observed` with
null fill data, not a reconstructed hash.

FNV-1a32 and Adler32 are labelled noncryptographic discriminators with byte
lengths. Different values localize changed inputs; equal values do not establish
byte equality, native identity or fidelity. Artifact and original PNG SHA-256
handling is unchanged.

## Same-Paint Contract

Each immutable stock pair records its real owner, diagnostic reset generation,
pair ID, exact stock key, and bounded source draw records. These generations are
not native epochs. A cached pair reuses its original fill/source identities and
records the actual destination transform, smoothing, alpha, composition,
filter and available context attributes for this blit. Source text records
capture the context immediately before its actual composite draw. Unsupported
context attributes are null; context creation options are never changed.

`screenPaint.cameraText` is serialized with the same paint consumed by the
existing render receipt and live LCD recorder. Enabled unrelated/error paints
serialize null rather than the prior Camera sample. Source errors, owner/reset,
view changes and disposal clear the current sample; a partial pair cannot
publish one. Resume overlay contribution is explicitly labelled separately
from the underlying stock draw. No Camera/native owner or `isTrusted` field is
inferred from earlier captures.

Bounds are 32 draw records per source sample, 256 observed fills per renderer,
2 MiB hashed bytes per sample and 65,536-character keys. Dropped draws, skipped
fills and skipped hashes are counted; unavailable/oversized keys are null.
Only relevant source font SHA-256, metrics and used glyph descriptors are kept,
not full font manifests or pixel arrays. Fill/hash counts, bytes and measured
hash/metadata durations describe diagnostic overhead, not animation timing.

## Diagnostic Export

Only this opt-in recorder export uses `camera-text-table-v1`: each non-null
`recording.sequence[].receipt.paint.cameraText` is a `{traceRef}` into
`recording.cameraTextTraces`. Exact serialized JSON determines dictionary
identity, not checksums. Replace that field with its indexed entry to recover
the original receipt. Null and absent fields stay distinct. Each current pair's
top-level `paint` and `receipt` remain unchanged. The table is rebuilt on retry
and each new recording; its serialized byte count is recorded. No original
paint fields are truncated, and the existing 8 MiB API cap still fails visibly.
Default exports have no table or encoding marker.

## Verification And Limits

Focused tests cover explicit gating, fill/hit/unobserved provenance, immutable
records, bounds, off/on pixel-read and draw-count parity, cached Camera main
through HOME/Resume/repeat, errors/disposal and exact receipt correlation.
The 600-frame export test uses real Camera resources, loader, bitmap font and
renderer with a synthetic Canvas byte transport. It recovers every receipt,
including differing, null and absent traces, and verifies retry and the unchanged
body cap with a conservative native-size PNG envelope. This is not Chrome or
native pixel acceptance. Detailed check logs and the immutable candidate freeze
are under the private `camera-browser-text-probe-v1` artifact directory.

Hashing, trace serialization and synchronous raw capture can change scheduling.
No native cadence, compositor acceptance, whole scenario or audio pass follows.
The coordinator alone runs the muted production probe after independent review.
No timing/controller/resource/asset behavior has been intentionally changed.
