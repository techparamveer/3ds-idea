/** Titles with delivered common/EUR source banners and a provisional live host. */
export function homeTitleBannerKind(id: string): 'camera' | 'sound' | 'health' | 'eshop' | null {
  if (id === 'health-safety') return 'health';
  return id === 'camera' || id === 'sound' || id === 'eshop' ? id : null;
}
export function hasHomeTitleBanner(id: string): boolean {
  return id === 'system-settings' || homeTitleBannerKind(id) !== null;
}
