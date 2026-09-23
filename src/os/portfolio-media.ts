import { apps } from './apps.ts';

export type PortfolioPhoto = { id: string; title: string; src: string; thumbnail?: string };
export type PortfolioPhotoFolder = { id: string; title: string; photos: readonly PortfolioPhoto[] };
export type PortfolioTrack = { id: string; title: string; artist?: string; album?: string; src: string; artwork?: string; duration?: number };
export type PortfolioMedia = { folders: readonly PortfolioPhotoFolder[]; tracks: readonly PortfolioTrack[] };

// Reuse the user's existing portfolio photographs, with each source only once.
const seen = new Set<string>();
const folders: PortfolioPhotoFolder[] = [];
for (const app of apps) for (const entry of app.entries) {
  const photos = (entry.images ?? []).filter(src => { if (seen.has(src)) return false; seen.add(src); return true; })
    .map((src, index) => Object.freeze({ id: `${entry.id}-${index + 1}`, title: entry.title, src }));
  if (photos.length) folders.push(Object.freeze({ id: entry.id, title: entry.title, photos: Object.freeze(photos) }));
}
/** User-supplied favourite songs go here when available; no sample tracks. */
export const portfolioMedia: PortfolioMedia = Object.freeze({ folders: Object.freeze(folders), tracks: Object.freeze([]) });
