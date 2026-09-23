# Banner boundary within an ordinary HOME pass

Root owns this pure host/service extension, separate from runtime's navigation
consumer and presentation's density controls. The source is
`scripts/firmware/HOME_HOST_ORDER_EVIDENCE.md`: input precedes the upper banner
manager, lower navigation follows it, and attached3D clips follow lower.

Add a single-pass host API with explicit before-manager and after-manager
boundaries. It consumes exactly the next shared count. The first boundary can
install an input-generated selection/request/readiness snapshot. Then it runs
one eligible manager pass, retaining the presentation snapshot for any instance
activated by that pass. The second boundary can install lower-generated changes.
Only then does it run one eligible attached-scene clip pass and complete the
shared count. No wall time, DOM, resource loading or renderer work belongs here.

Existing batched boundary APIs remain available and retain their behavior.
Factor their manager/scene arithmetic so the new path does not duplicate the
native gate/load/hide/activation implementation. A change between these phases
must not incorrectly relabel an instance that activated under the earlier
request. Preserve generation-scoped readiness validation and unsupported app
handoffs; do not infer additional native direct-manager calls from mere order.

Test equivalence with the existing ordinary manager-then-scene pass when no
intermediate boundary exists. Test an input request eligible for the same
manager pass; a lower request installed after that manager pass; activation
before a lower replacement with the old label/identity retained; independent
manager/scene inhibition; request-scoped readiness; and rejected skipped or
reversed counters. Zero-count boundary observations and read-only sampling must
not advance either phase. Actual System/scene wiring will consume these phased
boundaries after the navigation consumer API is integrated.
