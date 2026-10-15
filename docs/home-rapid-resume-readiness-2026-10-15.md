# Rapid Resume publication barrier

The captured Camera -> Left -> HOME sequence resumed Health before the selected
HOME pair had been published. The generic loading-recovery path called HOME
directly, so Resume had no accepted backing while the stock session reloaded.
Both LCDs were black. The source backing guards themselves were correct.

Evidence is closed session `fe0a6993-01c7-41e1-97ab-837feab3ea2d`, final capture
`live-lcd-270d09e9-6efd-47ff-a254-f96ab7166c33-0122`, under private
`continuation-20261015/browser-candidate/reference/scenario-matrix/v1/captures/`.
Actual DOM holds were Left 40.7 ms and HOME 35.4 ms, with 88.4 ms between their
down events. Sequences 3-4 contain the reported near-black app pair; no Resume
descriptor appears. The coordinator inspected the paired sheet. This worker
read the closed receipt sequence and reproduced the compositor failure.

The existing native-screen input gate now retains an early HOME request when
supported suspended Health or Camera lacks accepted backing. Screens identifies
the request by owner, capture/resource generations, HOME origin and scale epoch.
A painted candidate cannot release it. After the scene's existing valid paired
publication accepts that same source, the gate consumes the request once through
the ordinary HOME command path. The physical release remains quarantined.

Changed ownership, origin, generation, epoch, failure or invalid publication
cancels the request. Blur, hidden/sleeping suspension, context loss and renderer
failure explicitly cancel it. The existing settled-input and backing-publication
checks remain. No delay, synthetic capture, source-guard bypass, native asset,
audio cue, reducer state system or pickup behavior was added.

## Verification

Base: `bdf146ddaa82957ff81f41bbc6012684a2b5f124`. Assigned branch:
`codex/rapid-resume-readiness-20261015`. The frozen production checkout and build
`1d53IIkwjAYI_0DIBqwab` were not changed. Coordinator-owned STATUS remains unstaged.

- The focused regression failed before the runtime fix on the actual compositor
  output: both LCDs contained only `#000`, phase was `app`, status was `loading`.
- 43 focused System/compositor/input/Resume tests pass. The new cases cover
  Health and Camera, release before/after acceptance, one-shot consumption, and
  cancellation across origin, resource, sequence, visibility, sleep and failure.
- 62 scene/publication/recorder checks pass. Extracted production `renderFrame`
  verifies receipt recording precedes deferred dispatch and invalid renders
  cancel the request. Existing scene fixtures supply the new screen query.
- `npm run typecheck -- --incremental false` and `git diff --check` pass.
  No full suite or production build was run by this worker.

Private worker artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/rapid-resume-worker/`.
The coordinator owns review, integrated checks/build, ordinary-input recapture
and native comparison. Fresh native audit `c29dc735` has no saved near-black
sample, but moving epochs remain unmatched. This patch has no new browser or
native acceptance evidence. All four whole flows remain fail/unproven.

The deferred input is an explicit browser publication adaptation. Existing
portfolio content, capture-fitted geometry and lifecycle/cadence adaptations
remain; native pixels, timing and muted audio remain unverified.
