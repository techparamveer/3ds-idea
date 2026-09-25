import { createFirmwareModel, loadFirmwareModel, type FirmwareModelAsset } from './firmware-model';

/** A prepared ordinary type-1 resource. It is not a native show acknowledgement. */
export type StockTitleBannerKind = 'camera' | 'sound' | 'health' | 'eshop';
export type StockTitleBannerTicket = Readonly<{ generation: string; requestEpoch: number; kind: StockTitleBannerKind }>;
type Model = ReturnType<typeof createFirmwareModel>;

const sources: Record<StockTitleBannerKind, Readonly<{ common: string; eur: string; overrides: readonly string[]; meshes: number; materialClip: boolean }>> = {
  camera: { common: '068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d', eur: '21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb', overrides: ['COMMON1', 'COMMON2'], meshes: 4, materialClip: false },
  sound: { common: '2364f06f9fa15113969545f2bfc19976a71a0cfb0664b3dae884395b0f4af7c1', eur: '9924a70685eab60a05c669da0cab75c0ffdbd9e21852bc82497cab2bccc862e1', overrides: ['COMMON1', 'COMMON2'], meshes: 4, materialClip: true },
  health: { common: 'e1560e2ca6dfe8d01932c78eaa81ca5c93389c13852e2e4adcf20cb46d5b8032', eur: '97a1a31d289451077579c641c3826968907c2e16f6bf3855afbbf55f9653ea21', overrides: ['COMMON1', 'COMMON2'], meshes: 2, materialClip: false },
  eshop: { common: '0d30668534a6bbf1c7a8403b3b83762d6ccae59996775f6822c8ddf9513c7a94', eur: '9c07477aca53fcafa2f76359fee39640d27228f75924739b44be0960bf88d94b', overrides: ['COMMON1'], meshes: 4, materialClip: false },
};

export function prepareStockTitleBanner(kind: StockTitleBannerKind, common: FirmwareModelAsset, eur: FirmwareModelAsset): Model {
  const source = sources[kind], model = common.data.models[0];
  if (common.data.sourceSha256 !== source.common || eur.data.sourceSha256 !== source.eur
    || common.data.models.length !== 1 || model?.name !== 'COMMON' || model.meshes.length !== source.meshes
    || eur.data.models.length !== 0 || eur.data.textures.length !== source.overrides.length
    || eur.data.textures.map(texture => texture.name).sort().join('|') !== [...source.overrides].sort().join('|')
    || common.data.textures.some(texture => !common.images.has(texture.name))
    || source.overrides.some(name => !common.data.textures.some(texture => texture.name === name)
      || !eur.data.textures.some(texture => texture.name === name && !!eur.images.get(name)))
    || common.data.skeletalAnimations.filter(clip => clip.Name === 'COMMON' && clip.FramesCount === 600 && clip.AnimationFlags.includes('IsLooping')).length !== 1
    || common.data.materialAnimations.some(clip => clip.Name === 'COMMON') !== source.materialClip) {
    throw new Error(`Invalid ${kind} common/EUR HOME banner pair`);
  }
  const playback = { skeletal: [{ name: 'COMMON', frame: 0 }],
    material: source.materialClip ? [{ name: 'COMMON', frame: 0 }] : [] };
  const prepared = createFirmwareModel(common, playback, { overlayCoverage: true, drawGroup: 2,
    runtimeStencil: { enabled: true, function: 'Equal', reference: 1, compareMask: 1, writeMask: 0xff, fail: 'Keep', depthFail: 'Keep', depthPass: 'Keep' } });
  try {
    for (const name of source.overrides) {
      if (!prepared.setTexture(name, eur.images.get(name)!, { allowSizeChange: true })) throw new Error(`Unbound ${kind} EUR texture ${name}`);
    }
    return prepared;
  } catch (error) {
    prepared.dispose();
    throw error;
  }
}

/** One resource owner per console session. A stale fetch cannot publish or retain GPU resources. */
export function createStockTitleBannerResourceHost(load: typeof loadFirmwareModel = loadFirmwareModel) {
  let current: StockTitleBannerTicket | null = null, model: Model | null = null, failure: string | null = null, disposed = false;
  const same = (ticket: StockTitleBannerTicket) => !disposed && current?.generation === ticket.generation
    && current.requestEpoch === ticket.requestEpoch && current.kind === ticket.kind;
  function release() { current = null; model?.dispose(); model = null; failure = null; }
  async function request(ticket: StockTitleBannerTicket): Promise<void> {
    if (disposed) throw new Error('HOME title banner owner disposed');
    if (!ticket.generation || !Number.isSafeInteger(ticket.requestEpoch) || ticket.requestEpoch < 0) throw new RangeError('Invalid HOME title banner ticket');
    if (same(ticket) && !failure) return;
    release(); current = { ...ticket };
    const base = `/os/firmware/10.7.0-32E/models/${ticket.kind}-banner-`;
    try {
      const [common, eur] = await Promise.all([load(`${base}common/model.json`), load(`${base}eur/model.json`)]);
      if (!same(ticket)) return;
      const prepared = prepareStockTitleBanner(ticket.kind, common, eur);
      if (same(ticket)) model = prepared;
      else prepared.dispose();
    } catch (error) { if (same(ticket)) failure = String(error); }
  }
  return { request, release, dispose() { if (disposed) return; release(); disposed = true; },
    status(ticket: StockTitleBannerTicket) { return same(ticket) ? { ready: !!model, failure, model } : { ready: false, failure: null, model: null }; } };
}
