// Standalone so Playwright can serialize the same predicate tested offline.
export function folderCapturePrecondition({ folderIdentity, folderSelection, after = null }) {
  const host = document.querySelector('.console-stage');
  if (!host) return null;
  const data = host.dataset, view = JSON.parse(data.folderBanner ?? 'null');
  const receipt = JSON.parse(data.screenPresented ?? 'null');
  const primary = view?.primary, ticket = view?.resourceTicket;
  if (data.menu !== 'home' || data.selected !== folderSelection
    || data.folderBannerFallback !== 'false' || data.nativeScreenFailure
    || view?.status !== 'active' || view.stage !== 'active'
    || view.selection.kind !== 'folder' || view.selection.key !== folderIdentity
    || primary?.selection.kind !== 'folder' || primary.selection.key !== folderIdentity
    || !primary.motion.visible || !primary.motion.requestedVisible
    || primary.generation !== view.generation || ticket?.generation !== primary.generation
    || ticket.requestEpoch !== primary.requestEpoch) return null;
  if (!after) return {
    generation: primary.generation, requestEpoch: primary.requestEpoch,
    activationEpoch: primary.activationEpoch, observedAt: performance.now(),
    observedFrame: receipt?.frame ?? -1,
  };
  return primary.generation === after.generation && primary.requestEpoch === after.requestEpoch
    && primary.activationEpoch === after.activationEpoch && receipt?.validPublication === true
    && receipt.frame > after.observedFrame && receipt.paint?.at >= after.observedAt
    && receipt.paint.phase === 'home' && receipt.paint.cursor?.selectedSlot === Number(folderSelection);
}
