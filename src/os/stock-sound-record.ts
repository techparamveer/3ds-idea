import type { NativeLayoutRenderer } from './native-renderer';

/** Merge into the existing sound-bg request; do not load a second title session. */
export const soundRecordLayoutSelection = {
  layouts: ['S_BG-Record'],
  animations: ['S_BG-Record_Default', 'S_BG-Record_U_Default'],
} as const;

/** Resting record layer only. The owning Sound view chooses visibility and order.
 * 0x1c3b40 creates upper/lower instances of the same layout with U_Default/Default.
 * Upper uses the LCD's 400px centre; the authored layout itself remains 320px.
 */
export function drawNativeSoundRecordBackground(
  renderer: NativeLayoutRenderer,
  context: CanvasRenderingContext2D,
  screen: 'top' | 'bottom',
): boolean {
  return renderer.draw(context, 'sound-bg', 'S_BG-Record', {
    center: [screen === 'top' ? 200 : 160, 120],
    bindings: [{ name: screen === 'top' ? 'S_BG-Record_U_Default' : 'S_BG-Record_Default', frame: 0 }],
  });
}
