import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { decodeNativePng } from '../src/os/native-png.ts';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const transpile = (name, overrides = {}) => {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
    prefix + (overrides[path] ?? new URL(`${path}.ts`, url).href) + suffix));
};
// Font transport is controlled to exercise noncooperative late completions;
// all JSON/PNG data, PNG decoding and NativeLayoutRenderer are real.
const fontModule = moduleUrl('let load; export const configure = fn => {load=fn;}; export const loadBitmapFont = (...args) => load(...args);');
const { configure } = await import(fontModule);
const { loadNativeTitleAssets } = await import(transpile('native-title-assets', {
  './bitmap-font': fontModule, './native-renderer': transpile('native-renderer'),
}));
const root = process.env.FIRMWARE_PRESENTATION_ASSETS ?? resolve('public/os/firmware/10.7.0-32E');
const homeId = '0004003000009802', base = 'https://fixture.invalid/native/', manifestUrl = base + 'manifest.json';
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
const pickup = { url: 'packs/home/launcher.json', alias: 'pickup', layouts: ['LncIconPickUp_00'], animations: ['LncIconPickUp_00_Scale'] };
const blank = { ...pickup, alias: 'blank', layouts: ['LncIconPickUpBlank_00'], animations: ['LncIconPickUpBlank_00_Scale'] };
const banner = { url: 'packs/home/banner.json', alias: 'banner', layouts: ['BnrDsTitle_00'], animations: [] };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function font() { return { disposals: 0, dispose() { this.disposals++; } }; }
async function fixture(run) {
  const oldFetch = globalThis.fetch, responses = new Map([['manifest.json', json('manifest.json')]]), fetched = [], fonts = [];
  const shared = font(), hud = font(), borrowed = new Map([['cbf_std.bcfnt', shared], ['Hud.bcfnt', hud]]);
  const context = {
    responses, fetched, fonts, shared, hud, borrowed, hook: null, fontHook: null,
    manifest: responses.get('manifest.json'),
    pack(path = pickup.url) { if (!responses.has(path)) responses.set(path, json(path)); return responses.get(path); },
    load(requests = [pickup], signal, title = homeId) { return loadNativeTitleAssets(manifestUrl, title, requests, borrowed, signal); },
  };
  configure(async (url, signal) => {
    if (context.fontHook) return context.fontHook(url, signal);
    const value = font(); fonts.push({ url, signal, value }); return value;
  });
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).href.slice(base.length), entry = { path, signal: options?.signal }; fetched.push(entry);
    const fallback = () => new Response(responses.has(path) ? JSON.stringify(responses.get(path)) : read(path));
    return context.hook ? context.hook(entry, fallback) : fallback();
  };
  try { await run(context); } finally { globalThis.fetch = oldFetch; }
}

test('real resources load only explicit views/animations, deduplicate packs and all14 pickup textures, and dispose idempotently', async () => {
  await fixture(async f => {
    const resources = await f.load([pickup, blank, banner]);
    const renderer = resources.renderer, textures = renderer.textures;
    assert.deepEqual(Object.keys(renderer.packs), ['pickup', 'blank', 'banner']);
    assert.deepEqual(Object.keys(renderer.packs.pickup.layouts), pickup.layouts);
    assert.deepEqual(Object.keys(renderer.packs.pickup.animations), pickup.animations);
    assert.deepEqual(Object.keys(renderer.packs.blank.animations), blank.animations);
    assert.equal(f.fetched.filter(v => v.path === pickup.url).length, 1);
    assert.equal(f.fetched.filter(v => v.path.startsWith('packs/')).length, 2);
    const source = json(pickup.url), names = new Set();
    for (const request of [pickup, blank]) {
      for (const name of request.layouts) source.layouts[name].textures.forEach(n => names.add(n));
      for (const name of request.animations) source.animations[name].textures.forEach(n => names.add(n));
    }
    assert.equal(names.size, 14);
    assert.deepEqual(new Set(f.fetched.filter(v => v.path.startsWith('textures/')).map(v => v.path)), new Set([...names].map(n => source.textures[n].url)));
    assert.ok([...new Set(f.fetched.map(v => v.path))].every(path => f.fetched.filter(v => v.path === path).length === 1));
    assert.equal(textures.pickup.get('LncIconBtnShdwLT_01.bclim'), textures.blank.get('LncIconBtnShdwLT_01.bclim'));
    assert.equal(renderer.fonts.get('cbf_std.bcfnt'), f.shared); assert.equal(renderer.fonts.size, 1);
    assert.equal(f.fonts.length, 0); assert.ok(f.fetched.every(v => v.signal instanceof AbortSignal));
    assert.deepEqual(resources.diagnostics, []);
    // Real raster caches with a minimal Canvas transport; no browser/UI owner.
    const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document'), surfaces = [];
    const canvas = () => {
      const surface = { width: 1, height: 1 }, ctx = { canvas: surface, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
        putImageData(image) { surface.image = image; }, drawImage() {},
      };
      surface.getContext = () => ctx; surfaces.push(surface); return surface;
    };
    globalThis.document = { createElement: canvas };
    try {
      const target = canvas();
      assert.equal(renderer.draw(target.getContext(), 'blank', 'LncIconPickUpBlank_00', { bindings: [{ name: 'LncIconPickUpBlank_00_Scale', frame: 2 }] }), true);
      assert.ok(renderer.cacheBytes > 0); assert.ok(surfaces.length > 1);
      resources.dispose();
      assert.ok(surfaces.slice(1).every(surface => surface.width === 0 && surface.height === 0));
    } finally { if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else delete globalThis.document; }
    resources.dispose(); resources.dispose();
    assert.equal(renderer.draw({}, 'pickup', 'LncIconPickUp_00'), false);
    assert.ok(Object.values(textures).every(map => map.size === 0)); assert.equal(renderer.fonts.size, 0);
    assert.equal(renderer.cacheBytes, 0); assert.deepEqual(Object.keys(renderer.packs), []);
    assert.equal(f.shared.disposals, 0); assert.equal(f.hud.disposals, 0); assert.equal(f.borrowed.size, 2);
  });
});

test('animation requests are explicit identities, never inferred from a layout prefix', async () => {
  await fixture(async f => {
    const pack = f.pack(), animation = pack.animations.LncIconPickUp_00_Scale;
    pack.animations.SeparatelyNamedController = animation;
    pack.animations.LncIconPickUp_00_Unrequested = { ...animation, textures: ['must-not-fetch.bclim'] };
    const resources = await f.load([{ ...pickup, animations: ['SeparatelyNamedController'] }]);
    assert.deepEqual(Object.keys(resources.renderer.packs.pickup.animations), ['SeparatelyNamedController']);
    assert.ok(resources.renderer.textures.pickup.has('LncIcon_16.bclim'));
    resources.dispose();
  });
});

test('same PNG is decoded once across differing PICA formats without premultiplying independent channels', async () => {
  await fixture(async f => {
    const pack = f.pack(), original = pack.textures['IconMask.bclim'];
    pack.textures['same-png-la'] = { ...original, picaFormat: 5 };
    pack.layouts.LncIconPickUp_00.textures.push('same-png-la');
    const resources = await f.load(), images = resources.renderer.textures.pickup;
    const alpha = images.get('IconMask.bclim'), la = images.get('same-png-la');
    assert.equal(f.fetched.filter(v => v.path === original.url).length, 1);
    const raw = await decodeNativePng(new Uint8Array(read(original.url)), original);
    assert.deepEqual(la, raw); assert.notEqual(alpha, la);
    for (let at = 0; at < raw.data.length; at += 4) {
      assert.deepEqual([...alpha.data.subarray(at, at + 3)], [0, 0, 0]); assert.equal(alpha.data[at + 3], raw.data[at + 3]);
    }
    assert.ok(raw.data.some((value, index) => index % 4 !== 3 && value > 0));
    resources.dispose();
  });
});

test('title-owned source names override borrowed fonts, shared URLs load once, unused font metadata is untouched', async () => {
  await fixture(async f => {
    f.manifest.titles[homeId].fonts['cbf_std.bcfnt'] = 'fonts/hud/font.json';
    f.manifest.titles[homeId].fonts['Second.bcfnt'] = 'fonts/hud/font.json';
    f.manifest.titles[homeId].fonts['Unused.bcfnt'] = 'missing-unused/font.json';
    const layout = f.pack(banner.url).layouts.BnrDsTitle_00;
    const visit = panes => { for (const pane of panes) { if (pane.text) return pane; const found = visit(pane.children); if (found) return found; } };
    const text = structuredClone(visit(layout.roots)); text.name = 'second-font'; text.text.font = layout.fonts.length;
    layout.fonts.push('Second.bcfnt', 'Unused.bcfnt'); layout.roots.push(text);
    const resources = await f.load([banner]);
    assert.equal(f.fonts.length, 1); assert.equal(f.fonts[0].url, base + 'fonts/hud/font.json');
    assert.equal(resources.renderer.fonts.get('cbf_std.bcfnt'), f.fonts[0].value);
    assert.equal(resources.renderer.fonts.get('Second.bcfnt'), f.fonts[0].value);
    assert.equal(resources.renderer.fonts.has('Unused.bcfnt'), false);
    resources.dispose(); resources.dispose();
    assert.equal(f.fonts[0].value.disposals, 1); assert.equal(f.shared.disposals, 0);
  });
});

function contentBanner(f, index, id, fontUrl) {
  const namespace = `contents/${index.toString(16).padStart(4, '0')}-${id}/`, url = `packs/home/${namespace}banner.json`;
  const pack = json(banner.url); pack.contentIndex = index; pack.contentId = id;
  f.responses.set(url, pack); f.manifest.titles[homeId].packs.push(url);
  if (fontUrl) f.manifest.titles[homeId].fonts[namespace + 'cbf_std.bcfnt'] = fontUrl;
  return { ...banner, url, alias: `content${index}` };
}

test('multi-content owned fonts use pack identity namespaces while layouts retain their exact raw names', async () => {
  await fixture(async f => {
    const request = contentBanner(f, 0, '0000003d', 'fonts/home/contents/0000-0000003d/title/font.json');
    f.manifest.titles[homeId].fonts['cbf_std.bcfnt'] = 'wrong-unscoped/font.json';
    const resources = await f.load([request]);
    assert.equal(f.fonts.length, 1); assert.equal(f.fonts[0].url, base + 'fonts/home/contents/0000-0000003d/title/font.json');
    assert.equal(resources.renderer.fonts.get('cbf_std.bcfnt'), f.fonts[0].value);
    assert.deepEqual(resources.renderer.packs.content0.layouts.BnrDsTitle_00.fonts, ['cbf_std.bcfnt']);
    resources.dispose(); assert.equal(f.fonts[0].value.disposals, 1); assert.equal(f.shared.disposals, 0);
  });
});

test('same raw font name across contents must have one binding identity; conflicting owned or borrowed bindings reject', async () => {
  for (const secondFont of ['fonts/second/font.json', undefined]) await fixture(async f => {
    const first = contentBanner(f, 0, '0000003d', 'fonts/first/font.json'), second = contentBanner(f, 1, '0000004a', secondFont);
    await assert.rejects(f.load([first, second]), /Conflicting native title font binding cbf_std.bcfnt/);
    assert.equal(f.fonts.length, 0); assert.equal(f.shared.disposals, 0);
  });
  await fixture(async f => {
    const first = contentBanner(f, 0, '0000003d', 'fonts/same/font.json'), second = contentBanner(f, 1, '0000004a', 'fonts/same/font.json');
    const resources = await f.load([first, second]); assert.equal(f.fonts.length, 1);
    assert.equal(resources.renderer.fonts.size, 1); resources.dispose(); assert.equal(f.fonts[0].value.disposals, 1);
  });
});

test('missing and unsupported requested dependencies reject explicitly before texture/font allocation', async t => {
  const cases = [
    ['title', f => { delete f.manifest.titles[homeId]; }, [pickup], /Missing native title/],
    ['manifest schema', f => { f.manifest.schema = 9; }, [pickup], /Unsupported native title manifest/],
    ['excluded title', f => { f.manifest.excludedTitles = [homeId]; }, [pickup], /Excluded native title/],
    ['pack allowlist', f => { f.manifest.titles[homeId].packs = []; }, [pickup], /Unlisted native title pack/],
    ['pack schema', f => { f.pack().schema = 9; }, [pickup], /Invalid native title pack/],
    ['pack owner', f => { f.pack().titleId = '0004003000000000'; }, [pickup], /Invalid native title pack/],
    ['partial content identity', f => { f.pack().contentIndex = 0; }, [pickup], /Invalid native title pack content identity/],
    ['content index bounds', f => { Object.assign(f.pack(), { contentIndex: 65536, contentId: '0000003d' }); }, [pickup], /Invalid native title pack content identity/],
    ['content ID', f => { Object.assign(f.pack(), { contentIndex: 0, contentId: '../font' }); }, [pickup], /Invalid native title pack content identity/],
    ['layout', f => { delete f.pack().layouts.LncIconPickUp_00; }, [pickup], /Missing native title layout/],
    ['animation', f => { delete f.pack().animations.LncIconPickUp_00_Scale; }, [pickup], /Missing native title animation/],
    ['animation texture', f => { delete f.pack().textures['LncIcon_16.bclim']; }, [pickup], /Missing native title texture/],
    ['layout texture', f => { delete f.pack().textures['IconMask.bclim']; }, [pickup], /Missing native title texture/],
    ['font', f => { f.borrowed.clear(); }, [banner], /Missing native title font/],
    ['material', f => { f.pack().layouts.LncIconPickUp_00.materials[0].unsupported.push('unknown'); }, [pickup], /Unsupported native title resource/],
    ['layout field', f => { f.pack().layouts.LncIconPickUp_00.unsupported.push('unknown'); }, [pickup], /Unsupported native title resource/],
    ['animation field', f => { f.pack().animations.LncIconPickUp_00_Scale.unsupported.push('unknown'); }, [pickup], /Unsupported native title resource/],
    ['format', f => { f.pack().textures['IconMask.bclim'].picaFormat = 99; }, [pickup], /Invalid native title texture/],
    ['dimensions', f => { f.pack().textures['IconMask.bclim'].width = 0; }, [pickup], /Invalid native title texture/],
    ['duplicate alias', () => {}, [pickup, pickup], /duplicate native title pack request/],
  ];
  for (const [name, change, requests, error] of cases) await t.test(name, () => fixture(async f => {
    change(f); await assert.rejects(f.load(requests), error);
    assert.ok(f.fetched.every(v => !v.path.startsWith('textures/'))); assert.equal(f.fonts.length, 0); assert.equal(f.shared.disposals, 0);
  }));
});

test('conflicting metadata and PNG dimension mismatches fail without a usable renderer', async () => {
  await fixture(async f => {
    const pack = f.pack(), original = pack.textures['IconMask.bclim'];
    pack.textures.conflict = { ...original, width: original.width + 1 }; pack.layouts.LncIconPickUp_00.textures.push('conflict');
    await assert.rejects(f.load(), /Conflicting native texture dimensions/);
    assert.ok(f.fetched.every(v => !v.path.startsWith('textures/')));
  });
  await fixture(async f => {
    f.pack().textures['IconMask.bclim'].width++;
    await assert.rejects(f.load(), /Native PNG dimensions differ/);
  });
});

test('unrequested unsupported resources are diagnosed without accepting or loading them', async () => {
  await fixture(async f => {
    const pack = f.pack(); pack.unsupported.push({ path: 'unrequested.bin', reason: 'Unconverted resource type' });
    pack.layouts.LncBtmBtn_02.unsupported.push('not selected');
    const resources = await f.load();
    assert.match(resources.diagnostics[0], /1 unrequested converter omissions/);
    assert.equal(resources.renderer.packs.pickup.layouts.LncBtmBtn_02, undefined); resources.dispose();
  });
});

test('texture failure aborts siblings and disposes a font that completes after failure', async () => {
  await fixture(async f => {
    f.manifest.titles[homeId].fonts['cbf_std.bcfnt'] = 'fonts/hud/font.json';
    const started = deferred(), finish = deferred(), aborted = deferred(), late = font();
    f.fontHook = async (_url, signal) => { signal.addEventListener('abort', () => aborted.resolve(), { once: true }); started.resolve(); return finish.promise; };
    f.hook = (entry, fallback) => entry.path.startsWith('textures/') ? new Response('', { status: 503 }) : fallback();
    let settled = false;
    const outcome = f.load([pickup, banner]).then(() => { throw Error('unexpected success'); }, error => { settled = true; return error; });
    await started.promise; await aborted.promise;
    assert.equal(settled, false, 'failure drains pending owned resource acquisition');
    finish.resolve(late); assert.match((await outcome).message, /texture HTTP 503/);
    assert.equal(late.disposals, 1); assert.equal(f.shared.disposals, 0);
  });
});

test('font failure aborts pending PNG transfer and releases earlier owned fonts', async () => {
  await fixture(async f => {
    f.manifest.titles[homeId].fonts['cbf_std.bcfnt'] = 'fonts/hud/font.json';
    f.manifest.titles[homeId].fonts['Fail.bcfnt'] = 'fonts/fail/font.json';
    const layout = f.pack(banner.url).layouts.BnrDsTitle_00;
    const visit = panes => { for (const pane of panes) { if (pane.text) return pane; const found = visit(pane.children); if (found) return found; } };
    const second = structuredClone(visit(layout.roots)); second.name = 'failing-font'; second.text.font = layout.fonts.length;
    layout.fonts.push('Fail.bcfnt'); layout.roots.push(second);
    const waiting = deferred(), finished = deferred(), error = new Error('font sheet failed'), earlier = font();
    f.hook = async (entry, fallback) => {
      if (!entry.path.startsWith('textures/')) return fallback();
      waiting.resolve();
      await new Promise((resolve, reject) => {
        if (entry.signal.aborted) reject(entry.signal.reason);
        else entry.signal.addEventListener('abort', () => reject(entry.signal.reason), { once: true });
      }).finally(() => finished.resolve());
      return fallback();
    };
    f.fontHook = async url => { if (url.endsWith('/hud/font.json')) return earlier; await waiting.promise; throw error; };
    await assert.rejects(f.load([pickup, banner]), value => value === error); await finished.promise;
    assert.equal(earlier.disposals, 1); assert.equal(f.shared.disposals, 0);
  });
});

test('listed pack HTTP failures are explicit and abort a concurrent delayed pack body', async () => {
  await fixture(async f => {
    const entered = deferred(), aborted = deferred(), finish = deferred();
    f.hook = async (entry, fallback) => {
      if (entry.path === pickup.url) { await entered.promise; return new Response('', { status: 404 }); }
      if (entry.path === banner.url) {
        entry.signal.addEventListener('abort', () => aborted.resolve(), { once: true }); entered.resolve();
        return { ok: true, json: async () => { await finish.promise; return json(banner.url); } };
      }
      return fallback();
    };
    const outcome = assert.rejects(f.load([pickup, banner]), /Native title JSON HTTP 404/);
    await aborted.promise; finish.resolve(); await outcome;
    assert.equal(f.fonts.length, 0); assert.ok(f.fetched.every(v => !v.path.startsWith('textures/')));
  });
});

test('pre-abort fetches nothing; abort during JSON or font completion returns the caller reason and cleans ownership', async () => {
  await fixture(async f => {
    const controller = new AbortController(), reason = new Error('cancel before'); controller.abort(reason);
    await assert.rejects(f.load([pickup], controller.signal), error => error === reason); assert.equal(f.fetched.length, 0);
  });
  await fixture(async f => {
    const controller = new AbortController(), entered = deferred(), complete = deferred(), reason = new Error('cancel JSON');
    f.hook = async (_entry, fallback) => { entered.resolve(); await complete.promise; return fallback(); };
    const outcome = assert.rejects(f.load([pickup], controller.signal), error => error === reason);
    await entered.promise; controller.abort(reason); complete.resolve(); await outcome;
    assert.equal(f.fetched.length, 1);
  });
  await fixture(async f => {
    f.manifest.titles[homeId].fonts['cbf_std.bcfnt'] = 'fonts/hud/font.json';
    const controller = new AbortController(), entered = deferred(), complete = deferred(), late = font(), reason = new Error('cancel font');
    f.fontHook = async () => { entered.resolve(); return complete.promise; };
    const outcome = assert.rejects(f.load([banner], controller.signal), error => error === reason);
    await entered.promise; controller.abort(reason); complete.resolve(late); await outcome;
    assert.equal(late.disposals, 1); assert.equal(f.shared.disposals, 0);
  });
});

test('successful loads detach abort ownership and snapshot requests and borrowed maps before awaits', async () => {
  await fixture(async f => {
    const entered = deferred(), resume = deferred(), controller = new AbortController();
    f.hook = async (entry, fallback) => { if (entry.path === 'manifest.json') { entered.resolve(); await resume.promise; } return fallback(); };
    const request = structuredClone(banner), pending = f.load([request], controller.signal);
    await entered.promise; request.alias = 'changed'; request.layouts.length = 0; f.borrowed.clear(); resume.resolve();
    const resources = await pending; controller.abort();
    assert.deepEqual(Object.keys(resources.renderer.packs), ['banner']); assert.equal(resources.renderer.fonts.get('cbf_std.bcfnt'), f.shared);
    assert.ok(f.fetched.every(v => !v.signal.aborted), 'resolved resources belong to explicit dispose, not the old request signal');
    resources.dispose(); assert.equal(f.shared.disposals, 0);
  });
});

test('real bitmap-font loader follows title source metadata, fetches its atlas and releases its owned sheets', async () => {
  const { loadNativeTitleAssets: realLoad } = await import(transpile('native-title-assets', { './native-renderer': transpile('native-renderer') }));
  await fixture(async f => {
    // Binding fixture selects the exact existing owned source name; no alias guess.
    f.pack(banner.url).layouts.BnrDsTitle_00.fonts[0] = 'Hud_JP.bcfnt';
    const atlas = read('fonts/hud/sheet-0.png'), saved = new Map(['window', 'Image'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const createUrl = URL.createObjectURL, revokeUrl = URL.revokeObjectURL, created = [], revoked = [];
    Object.assign(globalThis, {
      window: { location: { href: base } },
      Image: class { naturalWidth = atlas.readUInt32BE(16); naturalHeight = atlas.readUInt32BE(20); decode() { return Promise.resolve(); } },
    });
    URL.createObjectURL = blob => { const url = createUrl(blob); created.push(url); return url; };
    URL.revokeObjectURL = url => { revoked.push(url); revokeUrl(url); };
    try {
      const resources = await realLoad(manifestUrl, homeId, [banner], f.borrowed), owned = resources.renderer.fonts.get('Hud_JP.bcfnt');
      assert.deepEqual(owned.manifest, json('fonts/hud/font.json')); assert.equal(owned.sheets.length, 1);
      assert.deepEqual(f.fetched.filter(v => v.path.startsWith('fonts/')).map(v => v.path), ['fonts/hud/font.json', 'fonts/hud/sheet-0.png']);
      assert.equal(created.length, 1); assert.deepEqual(revoked, created);
      resources.dispose(); resources.dispose(); assert.equal(owned.sheets.length, 0); assert.equal(f.shared.disposals, 0);
    } finally {
      URL.createObjectURL = createUrl; URL.revokeObjectURL = revokeUrl;
      for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    }
  });
});

test('bundled Zone HTML bitmaps load only the explicit source selection and preserve original pixels', async () => {
  await fixture(async f => {
    const request={url:'packs/nintendo-zone/local-html-images.json',alias:'html',layouts:[],animations:[],textures:['offline']};
    const source=f.pack(request.url),resources=await f.load([request],undefined,'0004001000022b00');
    const bitmap=resources.renderer.textures.html.get('offline');
    assert.equal(bitmap.width,320);assert.equal(bitmap.height,212);
    const original=await decodeNativePng(new Uint8Array(read(source.textures.offline.url)),source.textures.offline);
    assert.deepEqual(bitmap.data,original.data);
    assert.deepEqual([...resources.renderer.textures.html.keys()],['offline']);
    assert.equal(f.fetched.some(v=>v.path===source.textures['no-content'].url),false);
    resources.dispose();assert.equal(resources.renderer.textures.html.size,0);
    await assert.rejects(f.load([{...request,textures:['missing']}],undefined,'0004001000022b00'),/Missing native title texture/);
  });
});


test('Camera first-run character panel loads its exact selected source texture closure', async () => {
  await fixture(async f => {
    const request = { url: 'packs/camera/contents/0000-0000001a/lyt-C-Dlg.json', alias: 'camera-dialog', layouts: ['C_DlgChA'], animations: [] };
    const finder = { url: 'packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json', alias: 'camera-finder', layouts: ['P_Finder_U'], animations: [] };
    const sd = { url: 'packs/camera/contents/0000-0000001a/lyt-C-Icon.json', alias: 'camera-icons', layouts: ['C_IconSD'], animations: [] };
    const resources = await f.load([request, finder, sd], undefined, '0004001000022400');
    try {
      const pack = resources.renderer.packs['camera-dialog'];
      assert.deepEqual(Object.keys(pack.layouts), ['C_DlgChA']);
      assert.deepEqual(resources.diagnostics, []);
      assert.equal(resources.renderer.textures['camera-dialog'].size, 4);
      assert.deepEqual(new Set(f.fetched.filter(v => v.path.startsWith('textures/')).map(v => v.path)),
        new Set([...pack.layouts.C_DlgChA.textures.map(name => pack.textures[name].url),
          ...resources.renderer.packs['camera-finder'].layouts.P_Finder_U.textures.map(name => resources.renderer.packs['camera-finder'].textures[name].url),
          ...resources.renderer.packs['camera-icons'].layouts.C_IconSD.textures.map(name => resources.renderer.packs['camera-icons'].textures[name].url)]));
      for (const texture of resources.renderer.textures['camera-dialog'].values()) {
        assert.ok(texture.width > 0 && texture.height > 0);
      }
    } finally { resources.dispose(); }
  });
});

test('a pack request can name the application title that owns it, as the manual applet reads Settings content 1', async () => {
  await fixture(async f => {
    const applet = '0004003000009b02', settings = '0004001000022000';
    const row = { url: 'packs/manual/layout-BtnHeadLineTxt.json', alias: 'row', layouts: ['BtnHeadLineTxt'], animations: ['BtnHeadLineTxt_Wait'] };
    const index = { url: 'packs/settings/contents/0001-00000038/manual-EUR_en.json', alias: 'index', layouts: ['Index'], animations: [], titleId: settings };
    const resources = await f.load([row, index], undefined, applet);
    assert.deepEqual(Object.keys(resources.renderer.packs), ['row', 'index']);
    assert.equal(resources.renderer.packs.index.titleId, settings);
    assert.deepEqual(Object.keys(resources.renderer.packs.index.layouts), ['Index']);
    // Index text binds the shared system font; no content-owned font is fetched.
    assert.equal(resources.renderer.fonts.get('cbf_std.bcfnt'), f.shared);
    assert.equal(f.fonts.length, 0);
    resources.dispose();
    // The applet itself does not list the application's manual pack.
    await assert.rejects(f.load([row, { ...index, titleId: undefined }], undefined, applet), /Unlisted native title pack/);
    await assert.rejects(f.load([row, { ...index, titleId: 'SETTINGS' }], undefined, applet), /Invalid or duplicate native title pack request/);
    await assert.rejects(f.load([row, { ...index, titleId: '0004001000022300' }], undefined, applet), /Unlisted native title pack/);
    f.pack(index.url).titleId = applet;
    await assert.rejects(f.load([row, index], undefined, applet), /Invalid native title pack/);
  });
});
