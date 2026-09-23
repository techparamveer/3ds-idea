import { loadBitmapFont, type BitmapFont } from './bitmap-font';
import { nativeTextureSamplePixels, type NativePack, type NativePixels, type NativePane } from './native-layout';
import { decodeNativePng } from './native-png';
import { NativeLayoutRenderer } from './native-renderer';

/** URLs are identities from titles[titleId].packs, relative to the manifest. */
export type NativeTitlePackRequest = {
  url: string;
  alias: string;
  layouts: readonly string[];
  animations: readonly string[];
  /** Explicit original bitmaps used by bundled HTML rather than a CLYT pane. */
  textures?: readonly string[];
};
export type NativeTitleAssets = {
  renderer: NativeLayoutRenderer;
  diagnostics: string[];
  dispose(): void;
};
// Subset of scripts/firmware/build.py's existing delivery schema, not a new format.
type TitleMetadata = { titleId: string; packs: string[]; fonts: Record<string, string> };
type TitleManifest = { schema: number; titles: Record<string, TitleMetadata>; excludedTitles?: string[] };
type TitlePack = NativePack & { titleId: string; unsupported: unknown[]; contentIndex?: number; contentId?: string };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0);
const own = <T>(values: Record<string, T>, key: string): T | undefined => Object.hasOwn(values, key) ? values[key] : undefined;

function requireSupported(value: unknown, path: string): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'unsupported' && child !== false && (!Array.isArray(child) || child.length))
      throw new Error(`Unsupported native title resource: ${path}`);
    requireSupported(child, `${path}/${key}`);
  }
}

/** build.py/cia.py retain raw layout font names but namespace title metadata. */
function contentNamespace(pack: TitlePack): string {
  if (pack.contentIndex === undefined && pack.contentId === undefined) return '';
  if (!Number.isInteger(pack.contentIndex) || pack.contentIndex! < 0 || pack.contentIndex! > 0xffff ||
      typeof pack.contentId !== 'string' || !/^[a-f0-9]{8}$/.test(pack.contentId))
    throw new Error('Invalid native title pack content identity');
  return `contents/${pack.contentIndex!.toString(16).padStart(4, '0')}-${pack.contentId}/`;
}

/** Isolated per-view load. The scene owns generations; shared fonts are borrowed.
 * Explicit animation requests avoid inferring ownership from filename prefixes.
 */
export async function loadNativeTitleAssets(
  manifestUrl: string,
  titleId: string,
  requests: readonly NativeTitlePackRequest[],
  sharedFonts: ReadonlyMap<string, BitmapFont>,
  signal?: AbortSignal,
): Promise<NativeTitleAssets> {
  const controller = new AbortController(), pending = controller.signal;
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const packs: Record<string, NativePack> = Object.create(null);
  const textures: Record<string, Map<string, NativePixels>> = Object.create(null);
  const fonts = new Map<string, BitmapFont>(), ownedFonts = new Set<BitmapFont>();
  let renderer: NativeLayoutRenderer | undefined, disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    renderer?.dispose();
    for (const font of ownedFonts) font.dispose();
    ownedFonts.clear(); fonts.clear();
    for (const images of Object.values(textures)) images.clear();
    for (const alias of Object.keys(packs)) delete packs[alias];
  };
  // Abort siblings immediately, then drain them before releasing owned resources.
  const settle = async <T>(jobs: Promise<T>[]): Promise<T[]> => {
    const results = await Promise.allSettled(jobs.map(job => job.catch(error => { controller.abort(error); throw error; })));
    pending.throwIfAborted();
    return results.map(result => {
      if (result.status === 'rejected') throw result.reason;
      return result.value;
    });
  };
  try {
    pending.throwIfAborted();
    const base = new URL(manifestUrl, typeof window === 'undefined' ? undefined : window.location.href);
    const url = (value: string) => new URL(value, base).href;
    const json = async (href: string): Promise<unknown> => {
      pending.throwIfAborted();
      const response = await fetch(href, { signal: pending });
      if (!response.ok) throw new Error(`Native title JSON HTTP ${response.status}: ${href}`);
      const value: unknown = await response.json(); pending.throwIfAborted(); return value;
    };
    if (!/^[a-f0-9]{16}$/.test(titleId)) throw new Error('Invalid native title ID');
    if (!Array.isArray(requests) || !requests.length) throw new Error('Native title requires explicit pack requests');
    const aliases = new Set<string>();
    // Snapshot callers' requests before the first await.
    const selected = requests.map(request => {
      if (!request || typeof request.alias !== 'string' || !request.alias || aliases.has(request.alias) ||
          typeof request.url !== 'string' || !request.url || !strings(request.layouts) || !strings(request.animations) ||
          (request.textures !== undefined && !strings(request.textures)))
        throw new Error('Invalid or duplicate native title pack request');
      aliases.add(request.alias);
      return { ...request, url: url(request.url), layouts: [...new Set(request.layouts)], animations: [...new Set(request.animations)], textures: [...new Set(request.textures??[])] };
    });
    const borrowed = new Map(sharedFonts);
    const raw = await json(base.href);
    if (!record(raw) || raw.schema !== 1 || !record(raw.titles)) throw new Error('Unsupported native title manifest');
    const manifest = raw as TitleManifest, title = own(manifest.titles, titleId);
    if (!title) throw new Error(`Missing native title ${titleId}`);
    if (manifest.excludedTitles?.includes(titleId)) throw new Error(`Excluded native title ${titleId}`);
    if (title.titleId !== titleId || !strings(title.packs) || !record(title.fonts) ||
        Object.values(title.fonts).some(value => typeof value !== 'string' || !value)) throw new Error(`Invalid native title metadata ${titleId}`);
    const listed = new Set(title.packs.map(url)), packLoads = new Map<string, Promise<unknown>>();
    for (const request of selected) if (!listed.has(request.url)) throw new Error(`Unlisted native title pack ${request.url}`);
    const loaded = await settle(selected.map(request => {
      let job = packLoads.get(request.url);
      if (!job) { job = json(request.url); packLoads.set(request.url, job); }
      return job;
    }));
    const fontUrls = new Map<string, string>(), textureRecords = new Map<string, NativePack['textures'][string]>();
    const fontBindings = new Map<string, string | BitmapFont>();
    const requiredTextures: { alias: string; name: string; href: string; format?: number }[] = [];
    const diagnostics: string[] = [];
    selected.forEach((request, index) => {
      const value = loaded[index];
      if (!record(value) || value.schema !== 1 || value.titleId !== titleId || !record(value.layouts) ||
          !record(value.animations) || !record(value.textures) || !record(value.messages) || !Array.isArray(value.unsupported))
        throw new Error(`Invalid native title pack ${request.url}`);
      const source = value as TitlePack, namespace = contentNamespace(source);
      const layouts: NativePack['layouts'] = Object.create(null), animations: NativePack['animations'] = Object.create(null);
      const neededTextures = new Set<string>(request.textures), neededFonts = new Set<string>();
      for (const name of request.layouts) {
        const layout = own(source.layouts, name);
        if (!layout) throw new Error(`Missing native title layout ${request.alias}/${name}`);
        if (!Array.isArray(layout.roots) || !Array.isArray(layout.materials) || !strings(layout.textures) || !strings(layout.fonts))
          throw new Error(`Invalid native title layout ${request.alias}/${name}`);
        requireSupported(layout, `${request.alias}/${name}`);
        const visit = (panes: NativePane[]) => panes.forEach(pane => {
          if (!Array.isArray(pane.children)) throw new Error(`Invalid native title pane ${pane.name}`);
          if (pane.text) {
            const font = layout.fonts[pane.text.font];
            if (!Number.isInteger(pane.text.font) || !font) throw new Error(`Missing native title font index ${name}/${pane.name}`);
            neededFonts.add(font);
          }
          visit(pane.children);
        });
        visit(layout.roots); layout.textures.forEach(texture => neededTextures.add(texture)); layouts[name] = layout;
      }
      for (const name of request.animations) {
        const animation = own(source.animations, name);
        if (!animation) throw new Error(`Missing native title animation ${request.alias}/${name}`);
        if (!Array.isArray(animation.tracks) || !strings(animation.textures)) throw new Error(`Invalid native title animation ${request.alias}/${name}`);
        requireSupported(animation, `${request.alias}/${name}`);
        animation.textures.forEach(texture => neededTextures.add(texture)); animations[name] = animation;
      }
      const selectedTextures: NativePack['textures'] = Object.create(null);
      for (const name of neededTextures) {
        const texture = own(source.textures, name);
        if (!texture) throw new Error(`Missing native title texture ${request.alias}/${name}`);
        if (typeof texture.url !== 'string' || !texture.url || !Number.isInteger(texture.width) || !Number.isInteger(texture.height) ||
            texture.width < 1 || texture.height < 1 || texture.width * texture.height > 1024 * 1024 ||
            (texture.picaFormat !== undefined && (!Number.isInteger(texture.picaFormat) || texture.picaFormat < 0 || texture.picaFormat > 13)))
          throw new Error(`Invalid native title texture ${request.alias}/${name}`);
        const href = url(texture.url), previous = textureRecords.get(href);
        if (previous && (previous.width !== texture.width || previous.height !== texture.height)) throw new Error(`Conflicting native texture dimensions ${href}`);
        textureRecords.set(href, texture); selectedTextures[name] = texture;
        requiredTextures.push({ alias: request.alias, name, href, format: texture.picaFormat });
      }
      for (const name of neededFonts) {
        const sourceName = namespace + name, ownedUrl = own(title.fonts, sourceName);
        const binding = ownedUrl ? url(ownedUrl) : borrowed.get(name);
        if (!binding) throw new Error(`Missing native title font ${sourceName}`);
        const previous = fontBindings.get(name);
        // NativeLayoutRenderer currently has one font map for all local aliases.
        // Reject different content-owned fonts with the same raw layout name.
        if (previous !== undefined && previous !== binding) throw new Error(`Conflicting native title font binding ${name}`);
        fontBindings.set(name, binding);
        if (typeof binding === 'string') fontUrls.set(name, binding);
        else fonts.set(name, binding);
      }
      if (source.unsupported.length) diagnostics.push(`${request.alias}: ${source.unsupported.length} unrequested converter omissions; only selected resources were validated.`);
      packs[request.alias] = { ...source, layouts, animations, textures: selectedTextures };
      textures[request.alias] = new Map();
    });
    const decoded = new Map<string, Promise<NativePixels>>(), sampled = new Map<string, Promise<NativePixels>>();
    const fontLoads = new Map<string, Promise<BitmapFont>>();
    const jobs: Promise<unknown>[] = requiredTextures.map(({ alias, name, href, format }) => {
      let bytes = decoded.get(href);
      if (!bytes) {
        bytes = (async () => {
          const response = await fetch(href, { signal: pending });
          if (!response.ok) throw new Error(`Native title texture HTTP ${response.status}: ${href}`);
          const pixels = await decodeNativePng(new Uint8Array(await response.arrayBuffer()), textureRecords.get(href)!, pending);
          pending.throwIfAborted(); return pixels;
        })();
        decoded.set(href, bytes);
      }
      const key = JSON.stringify([href, format ?? null]);
      let pixels = sampled.get(key);
      if (!pixels) { pixels = bytes.then(value => nativeTextureSamplePixels(value, format)); sampled.set(key, pixels); }
      return pixels.then(value => { pending.throwIfAborted(); textures[alias].set(name, value); });
    });
    for (const [name, href] of fontUrls) {
      let job = fontLoads.get(href);
      if (!job) {
        job = loadBitmapFont(href, pending).then(font => { ownedFonts.add(font); pending.throwIfAborted(); return font; });
        fontLoads.set(href, job);
      }
      jobs.push(job.then(font => { fonts.set(name, font); }));
    }
    await settle(jobs);
    renderer = new NativeLayoutRenderer(packs, textures, fonts);
    renderer.diagnostics.push(...diagnostics);
    pending.throwIfAborted();
    return { renderer, diagnostics: renderer.diagnostics, dispose };
  } catch (error) {
    controller.abort(error); dispose(); throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
  }
}
