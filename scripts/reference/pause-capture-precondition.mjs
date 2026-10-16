// Standalone so Playwright and the offline checks use the same predicate.
export function pauseCapturePrecondition({ app, nativeStatus, after = null }) {
  const host = document.querySelector('.console-stage');
  if (!host) return null;
  const data = host.dataset;
  if (data.menu !== 'app' || data.app !== app || data.nativeScreen !== nativeStatus
    || data.nativeScreenFailure || data.sleeping !== 'false' || data.dialog) return null;
  const receipt = JSON.parse(data.screenPresented ?? 'null');
  if (!after) return { app, nativeStatus, selected: data.selected,
    observedAt: performance.now(), observedFrame: receipt?.frame ?? -1 };
  const paint = JSON.parse(data.screenPaint ?? 'null');
  return after.app === app && after.nativeStatus === nativeStatus && after.selected === data.selected
    && receipt?.validPublication === true && receipt.frame > after.observedFrame
    && receipt.paint?.at >= after.observedAt && receipt.paint.phase === 'app'
    && receipt.paint.at === paint?.at && paint.phase === 'app';
}
