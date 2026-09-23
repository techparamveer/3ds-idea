# Ordered banner pass

`stepHomeBannerHost(host, nextClock, { beforeManager, afterManager })` adds an
explicit ordinary-pass boundary for the source-proven order
input→upper/banner→lower→global3D. It remains a pure building block until the
live input scheduler consumes it. Existing `crossHomeBannerBoundary` callers
retain their behavior; this change alone does not alter browser timing.

`beforeManager` installs input-generated observations at the retained count.
The host runs one eligible manager phase and resolves any newly activated
instance against the request snapshot that caused that activation. It then
installs `afterManager`, representing lower-task observations, before running
the eligible attached-scene clip phase. Finally, it completes exactly the next
shared count. No elapsed time or resource acquisition is introduced.

The service's manager and scene arithmetic is shared by both APIs. A lower
replacement therefore cannot change a manager pass that already occurred, or
relabel the instance it just activated. It can change the request observed by
the next manager pass. Independent manager/scene gates are read at their
respective boundaries. Readiness remains generation/request scoped; after-phase
acknowledgement cannot retroactively permit earlier activation.

The exported service phase helpers are paired low-level operations; they do
not themselves enforce pairing or install a request. Use the host single-pass
API for validated count consumption. A supported scope first created at the
lower boundary receives that pass's scene update, but cannot replay its
already-completed manager phase. Selection snapshots should represent actual
request observations, not an assumption that every native slot write makes
a banner request.

Skipped/reversed counts and generation changes are rejected by the single-pass
API. Establish a new session with the existing constructor/boundary API first.
The explicit unsupported-application policy remains: those selections dispose
the supported host scope; later folder/default selection creates another.
This is an application policy, not native application-banner loader parity.

The source authority is
[ordinary host order](../scripts/firmware/HOME_HOST_ORDER_EVIDENCE.md), combined
with the earlier gate/lifecycle evidence. The API represents observed request
boundaries; it does not infer additional native direct-manager calls. Source
service gates, full APT behavior and the wall-clock adapter remain outside it.

`home-banner-pass.test.mjs` covers phase-order consequences, activation followed
by retargeting, independent gates, before/after readiness, stale tickets,
unsupported scope changes and invalid counters. Forty consecutive ordinary
passes including replacement remain deeply equal to the existing API. All76
related host/service/default/lifecycle tests passed; typecheck passed. Logs are
`home-banner-pass-tests.log` and `home-banner-pass-typecheck.log` under the SSD
firmware artifact directory. These checks do not claim live input acceptance.

Combined verification before the separate System cursor-order refactor passed
698 tests (696 passed,2 existing audio-diagnostic skips), with typecheck and a
production build. Logs are `density-banner-integration-tests.log` and
`density-banner-build.log` under the same SSD directory. A separate source-aware
review found no correctness defect and checked165 phased/existing comparisons
plus both after-manager scope-creation cases without modifying the implementation.
