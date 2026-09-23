# Agreed default and clear banner integration

This contract extends the existing folder host to the native type7 BannerDef and
explicit type13 clear request. It follows native-banner-targets.md, the original
BannerDef candidate evidence and the retained hide/gate/worker ordering. It does
not introduce application-banner emulation or guessed native APT timing.

## Runtime interface and ownership

Runtime owns home-banner-lifecycle.ts, home-banner-service.ts,
home-banner-host.ts (including its selection resolver), focused tests and the
matching contract/source evidence. Replace ambiguous host `blank` with `default`
for a true vacant root or opened-folder slot. Add explicit `clear`; the resolver
never emits clear. Root owns source-proven clear event wiring in console-scene.ts,
OS presentation consumers, resource readiness and fallback integration.

Use one exported canonical empty-title key for default7 and clear13, retaining
kind and native type in identity. Default, folder and clear share a service scope;
only unsupported app handoff or new System generation ends it. Adjacent vacancies
deduplicate, including root/child context changes. Initialization ineligibility
omits a selection observation; it does not fabricate clear.

Rename shared motion to HomeBannerMotion and retain HomeFolderBannerMotion as a
compatibility type alias. Instance.motion is canonical. Folder and default share
source visibility/scale and 600-update manager yaw; folder clip clocks remain
600/600, default skeletal is 300 looping and material is 60 nonlooping. Profiles
are internal source contracts, not caller-supplied timing. Default has no label.

Host active view uses `primary`, replacing `folder`: generation, requestEpoch,
activationEpoch, selection (folder or default), and motion. Incoming selection
can independently be folder/default/clear. Pending has primary:null. Completed
clear has status:'cleared', primary:null and resourceTicket:null. Unsupported
remains app|null. Label refresh only applies to a matching selected/active folder.

Folder/default resource tickets remain generation/request scoped. Clear has no
resource ticket/model and must still complete nativeWorkerReady and hide/worker
handshakes. It bypasses only source-proven normal counter/global load inhibition.
A completed clear is active with no instance, no activationEpoch increment, and
no pending request. A new request from that state first enters hiding even with
null primary, then observes null on the next pass before entering the gate.
Initial idle/null keeps the initial gate sequence. Derived all-ready counts are
initial default7 passes, initial clear2 and clear-to-default9. Execute the bounded
original null-primary source fragment before presenting these as executed proof;
wall-clock duration is not established by these counts.

Keep latest-request-latch behavior, stale readiness protection, same-current
cached default reversal and existing forced reload behavior. Never infer a clear
completion when clear/default requests coalesce before a manager pass. Root must
preserve actual state/update boundaries for later folder-close integration.

## Renderer interface and ownership

Presentation owns firmware-banner.ts and its focused tests. Keep existing folder
drawFrame API and add drawDefaultFrame(ctx, frame) with the same explicit sampled
frame fields; default takes no label. A shared PrimaryBannerRenderFrame type may
alias the existing FolderBannerRenderFrame for compatibility. Root owns callers
and promotion of the candidate to
/os/firmware/10.7.0-32E/models/banner-default/model.json plus its six PNG textures.

Use the already-agreed native Frame sibling transaction for either primary.
Default uses explicit EUR clips BannerDef_anim00 (skeletal) and BannerDef
(material); never auto-select the KR clip. Default primary gets the same Equal
ref1 mask1 override, group2, native camera and coverage transfer. Folder and
default must not draw simultaneously; hidden retained primary samples do not
advance clocks. Preserve native model/root bind matrices, authored materials and
all separate skeletal/material/yaw clocks. Native displacement stays separate
from skeletal bob and retains the Frame update guard.

Expose separate defaultReady/defaultFailure alongside folder and Frame status.
Default readiness requires parsed model, every required actual texture, exact
EUR clips, camera and Frame. Promise settlement alone is insufficient. Missing
or failed resources must not silently substitute folder or unmasked geometry.
Retain existing background Canvas path, folder text and rendering-state cleanup.
GPU minification/native mip levels remain a separately documented gap.

## Acceptance

Runtime checks cover independent clip wraps/endpoints, source motion samples,
true-vacancy resolution/deduplication, immutable outgoing folder labels in both
replacement directions, explicit clear completion, all-ready gate ordering,
inhibition/worker readiness, stale tickets/session scope, retarget/reversal,
coalesced requests and batch-versus-stepped updates. Unsupported app rendering
stays explicit. Presentation checks cover exact candidate clips/textures, same
stencil transaction and camera, label-free default, separate failures, retained
folder behavior and disposal. Root integrates sequentially, then verifies actual
browser/native output before fidelity claims or public delivery sign-off.
