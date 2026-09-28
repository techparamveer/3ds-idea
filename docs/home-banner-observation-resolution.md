# Resolve the observed HOME selection

`resolveHomeBannerHostObservation` classifies the consumer's explicit lower
resolver snapshot. It uses the recorded context, slot and toolbar focus, rather
than the final menu selection. This distinction matters when mode3 completion
resolves slot3 and pending movement then selects4 in the same pass.

The caller must supply content and folder identities from that same host pass.
Ordinary root/child application lookup and live folder identity/type reuse the
existing content resolver. Navigation does not deduplicate attempts; the banner
service retains accepted-request deduplication. Repeated idle attempts, including
a move between two vacant slots, therefore preserve the existing default request.

The eight toolbar focuses follow the proved categories `[2,5,4,6,7,8,2,2]`.
Category2 uses the existing default target. The other five return an explicit
unsupported toolbar selection carrying focus/category, without falsely selecting
the retained grid application or inventing a native request type. They drop the
supported service scope using the existing unsupported handoff policy. Dedicated
toolbar banner loading, rendering and native activation timing remain unfinished.

This is content classification, not the source resolver's service gates. A caller
must still apply the proved task/readiness/initialization gates. Normal close's
input-time clear is a separate explicit boundary; a lower snapshot is not silently
converted to clear because the final state still has a close record. The legacy
`resolveHomeBannerHostSelection` retains its existing snapshot/close behavior
for compatibility while the live scheduler is being replaced.

Tests combine the actual mode3 consumer with pending replay and phased host,
check root/child context independent of current UI fields, preserve accepted
vacancy requests, and cover all eight toolbar categories. The focused host,
pass, default and observation suites pass49 tests with no skips; typecheck passes.
Logs are `reference/native-banner-observation-{tests,typecheck}.log` under the
firmware SSD artifact root. This API is not yet the live scene request scheduler.
