import { apps } from './apps.ts';
import type { AppDescriptor, AppModule } from './app-types.ts';
import { createPortfolioModule } from './portfolio-app.ts';
import { createStockModule } from './stock-apps.ts';
import { cameraVerificationMedia } from './portfolio-media.ts';

const firmware = (id: string, title: string, titleId: string, kind: AppDescriptor['kind'] = 'application', home = kind === 'application'): AppDescriptor => ({
  id, title, titleId, kind, home, source: 'firmware', assetPack: titleId, saveVersion: 1,
});
export const stockTitles: readonly AppDescriptor[] = [
  firmware('system-settings', 'System Settings', '0004001000022000'),
  firmware('health-safety', 'Health and Safety Information', '0004001000022300'),
  firmware('camera', 'Nintendo 3DS Camera', '0004001000022400'),
  firmware('sound', 'Nintendo 3DS Sound', '0004001000022500'),
  firmware('eshop', 'Nintendo eShop', '0004001000022900'),
  firmware('system-transfer', 'System Transfer', '0004001000022A00', 'application', false),
  firmware('nintendo-zone', 'Nintendo Zone Viewer', '0004001000022B00'),
  firmware('system-updater', 'System Update', '0004001000022F00', 'application', false),
  firmware('nnid-settings', 'Nintendo Network ID Settings', '000400100002C100', 'application', false),
  firmware('camera-applet', 'Camera', '0004003000009902', 'system-applet'),
  firmware('manual', 'Instruction Manual', '0004003000009B02', 'system-applet'),
  firmware('game-notes', 'Game Notes', '0004003000009C02', 'system-applet'),
  firmware('browser', 'Internet Browser', '0004003000009D02', 'system-applet'),
  firmware('friends', 'Friend List', '0004003000009F02', 'system-applet'),
  firmware('notifications', 'Notifications', '000400300000A002', 'system-applet'),
  firmware('amiibo-settings', 'amiibo Settings', '000400300000B902', 'system-applet'),
  firmware('miiverse-post', 'Post to Miiverse', '000400300000BA02', 'system-applet'),
  firmware('miiverse', 'Miiverse', '000400300000BE02', 'system-applet'),
  firmware('error', 'Error', '000400300000C502', 'library-applet'),
  firmware('extrapad', 'Circle Pad Pro', '000400300000CD02', 'library-applet'),
  firmware('mii-selector', 'Mii', '000400300000D102', 'library-applet'),
  firmware('photo-selector', 'Select a Photo', '000400300000D302', 'library-applet'),
  firmware('sound-selector', 'Select a Sound', '000400300000D402', 'library-applet'),
  firmware('mint', 'Nintendo eShop', '000400300000D602', 'library-applet'),
  firmware('memo', 'Memo', '000400300000F602', 'library-applet'),
];
/** Removed from the portfolio scope on2026-09-23. Keep only their IDs so older
 * saved layouts can omit them without losing the user's other placements. */
export const retiredHomeTitleIds: ReadonlySet<string> = new Set(['activity-log', 'download-play', 'mii-maker', 'streetpass', 'keyboard']);
const modules = new Map<string, AppModule>();
for (const app of apps) modules.set(app.id, createPortfolioModule(app));
const cameraFixture = cameraVerificationMedia(typeof window === 'undefined' ? undefined : window.location);
for (const descriptor of stockTitles) modules.set(descriptor.id, createStockModule(descriptor, cameraFixture && (descriptor.id === 'camera' || descriptor.id === 'camera-applet') ? cameraFixture : undefined));
export const installedTitles: readonly AppDescriptor[] = [...modules.values()].map(module => module.descriptor);
export const homeTitles = installedTitles.filter(title => title.home);
export function getTitle(id?: string | null) { return id ? modules.get(id)?.descriptor : undefined; }
export function getAppModule(id?: string | null) { return id ? modules.get(id) : undefined; }
/** Exact pre-825b4c5 default save; this snapshot must not follow later registry changes. */
const previousDefaultHomeIds = [
  'work', 'projects', 'hobbies', 'life', 'hackuk', 'nvidia', 'about', 'contact',
  'system-settings', 'health-safety', 'camera', 'sound', 'eshop', 'nintendo-zone',
] as const;
export function isPreviousDefaultAppLayout(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const layout = value as Record<string, unknown>;
  return Object.keys(layout).length === previousDefaultHomeIds.length
    && previousDefaultHomeIds.every((id, slot) => layout[String(slot)] === id);
}
/** Put Settings at the right lower position of the EUR selected capture.
 * The native neighbors there are excluded Activity Log and Download Play;
 * portfolio NVIDIA and source-correct blue Sound remain visible adaptations.
 * Existing saved layouts retain their own positions. */
export function initialAppLayout(): Record<number, string> {
  const layout = Object.fromEntries(homeTitles.map((title, index) => [index, title.id]));
  [layout[7], layout[11]] = [layout[11], layout[7]];
  [layout[8], layout[9]] = [layout[9], layout[8]];
  return layout;
}
