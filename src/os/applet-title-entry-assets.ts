import { nativePaneParentPath, poseNativeLayout, type NativeAnimation, type NativeLayout, type NativeMessageStyle, type NativePack, type PaneOverrides } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer.ts';

export type AppletTitleEntryAppId = 'friends' | 'notifications';
export type AppletTitleEntrySelection = Readonly<{
  appId: AppletTitleEntryAppId; alias: 'friends-incoming' | 'notifications-incoming';
  upper: string; lower: string; bank: string; label: string; styleIndex: number;
}>;
const selections = {
  friends: { appId: 'friends', alias: 'friends-incoming', upper: 'FrdCmnFade_U_00', lower: 'FrdCmnFade_D_00', bank: 'friend_msbt_LZ', label: 'fri_title_fri', styleIndex: 39 },
  notifications: { appId: 'notifications', alias: 'notifications-incoming', upper: 'CmnFade_U_00', lower: 'CmnFade_D_00', bank: 'newslist_msbt_LZ', label: 'new_title_new', styleIndex: 13 },
} satisfies Record<AppletTitleEntryAppId, AppletTitleEntrySelection>;
type TitleEntryStyleTable = { recordSize: 44; styles: NativeMessageStyle[]; unsupported: [{ kind: 'styleFields'; offsets: number[] }] };
const styleOffsets = [0, 4, 8, 12, 16, 20, 40];
const styleWords = [270, 1, 0, 0, 0, 0, 4];
const metricBlockHash = 'b2a4d54f6a3bfdb1993e20aea4c512818d700eed65efb5ca0190b21c5fde6d1c';
const plainWriterProofs = {
  friends: {
    titleId: '0004003000009f02', codeSha256: 'a5d86ac04922f63feb0c3cfcc8390867f358ba8b3a3970acb211be7b8d9f923e', sourceMessageIndex: 6,
    proof: {
      ranges: {
        caller: [0x186384, 0x1863ec, '73cb48bd6c72795fa96cf9f913f667ae497565e19fa695486eea87a2bc7d37df'],
        resolver: [0x17ed30, 0x17ed54, 'd6d14f015659fd1997d8bb1c4b08dd7409562a1bc927efddc8b7878290eff4c2'],
        textGetter: [0x124c34, 0x124c70, '631710d1f6481a7cbd3949421436dcca1d63dd85ea1ad5cbdb13dd3c995a7cc4'],
        wrapper: [0x17f5d4, 0x17f66c, '4e1af41a456126271d75ec68c7f6d75915e01e3b6e73c7da6ab90761fb67da62'],
        plainWriter: [0x11cbbc, 0x11cd20, '9e3edd01720ea5170e2b9be36dc359c1fb7b96af8493902acfee9f809d3fcd22'],
        unreachedStyleGetter: [0x12ab58, 0x12abb8, 'b8856f3889cdd1a42f578a646c1b654c69592b7ba5c968cde718309466589e7a'],
        unreachedMetricBlock: [0x11c9e4, 0x11caa4, metricBlockHash],
      },
      branches: [[0x186394, 0x17ed30, true], [0x1863b8, 0x17f5d4, true], [0x1863c4, 0x17ed30, true], [0x1863e8, 0x17f5d4, true], [0x17ed50, 0x124c34, false], [0x17f648, 0x11cbbc, true]],
      unreachedStyleWriter: 0x11c960,
    },
  },
  notifications: {
    titleId: '000400300000a002', codeSha256: 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228', sourceMessageIndex: 26,
    proof: {
      ranges: {
        caller: [0x14fd34, 0x14fd98, 'c0fa6a10b940c014c80e19dba1a2312aaac296f2ea0ae20d17eaac9e94b56aaf'],
        resolver: [0x149d8c, 0x149db0, '658039cc1277fc5e3cad5ea4cb4e91bac995757f14a8db262fa091cd3e1005db'],
        textGetter: [0x11f434, 0x11f470, '631710d1f6481a7cbd3949421436dcca1d63dd85ea1ad5cbdb13dd3c995a7cc4'],
        wrapper: [0x14a680, 0x14a720, 'ea6527b55cd40926a4e9e837228ebe159efde7cd3c9a6986e146bbd6d7fc3070'],
        plainWriter: [0x116948, 0x116c14, '9cb3777cc7f62f160af4ad71168a09eacbe2b4b6fdd13a7ba7f574fcde052b03'],
        unreachedStyleGetter: [0x1244cc, 0x12452c, '1541c9812859ec32d1c262f18d3fbe7ee99366fc76b2726c5aeeb90592ba0a1d'],
        unreachedMetricBlock: [0x116770, 0x116830, metricBlockHash],
      },
      branches: [[0x14fd44, 0x149d8c, true], [0x14fd68, 0x14a680, true], [0x14fd74, 0x149d8c, true], [0x14fd94, 0x14a680, true], [0x149dac, 0x11f434, false], [0x14a6fc, 0x116948, true]],
      unreachedStyleWriter: 0x1166ec,
    },
  },
};

function field(value: unknown, key: string): unknown {
  return value && typeof value === 'object' && !Array.isArray(value) ? Reflect.get(value, key) : undefined;
}
function exactMetadata(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((value, index) => exactMetadata(actual[index], value));
  if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object' || Array.isArray(actual)) return false;
  return Object.keys(actual).length === Object.keys(expected).length && Object.entries(expected).every(([key, value]) => exactMetadata(field(actual, key), value));
}

function validatePlainWriter(pack: NativePack, selection: AppletTitleEntrySelection) {
  const source = plainWriterProofs[selection.appId];
  if (!exactMetadata(field(pack, 'incomingTextBinding'), {
    kind: 'title-plain-label-writer', ...source, bank: selection.bank, label: selection.label, styleIndex: selection.styleIndex,
    styleApplied: false, retainedStyleTable: 'non-applied-reference',
  }) || !exactMetadata(field(pack, 'incomingFontBinding'), {
    layoutName: 'cbf_std.bcfnt', url: 'fonts/shared/font.json', sha256: 'd48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27',
    kind: 'native-shared-presentation', titleRuntimeResolutionEstablished: false,
  })) throw Error('Unsupported title incoming plain-label or font binding proof');
}

/** Only these two title startup pairs are identified. Other applets have no
 * borrowed generic incoming cover through this helper. */
export function appletTitleEntrySelection(appId: string): AppletTitleEntrySelection | null {
  return appId === 'friends' || appId === 'notifications' ? { ...selections[appId] } : null;
}

function validateTracks(clip: NativeAnimation, lower: boolean, appId: AppletTitleEntryAppId) {
  // Validation fixtures only. The renderer always consumes the original tracks.
  const alphaKeys = [{ frame: 0, value: 255, slope: -12.75 }, { frame: 20, value: 0, slope: 0 }];
  const alpha = (target: string, contentIndex: number) => ({ binding: 'pane', target, property: 'alpha', tag: 'CLVC', contentIndex, index: 0, component: 16, interpolation: 'hermite', keys: alphaKeys });
  const tint = appId === 'friends' ? [230, 135, 60] : [55, 205, 165];
  const expected = lower ? [
    { binding: 'pane', target: 'P_Belt_00', property: 'translation.x', tag: 'CLPA', contentIndex: 0, index: 0, component: 0, interpolation: 'hermite', keys: [{ frame: 0, value: 0, slope: -4 }, { frame: 20, value: -80, slope: 0 }] },
    alpha('P_Belt_00', 0), alpha('P_Bg_D_00', 1),
    ...['P_Home_00', 'P_Aplt_00'].map((target, index) => ({ binding: 'pane', target, property: 'visible', tag: 'CLVI', contentIndex: index + 2, index: 0, component: 0, interpolation: 'step', keys: [{ frame: -10, value: index }] })),
    ...tint.map((value, index) => ({ binding: 'material', target: 'P_Belt_00', property: `materialColor.1.${index}`, tag: 'CLMC', contentIndex: 4, index: 0, component: index + 4, interpolation: 'hermite', keys: [{ frame: -10, value, slope: 0 }] })),
  ] : [alpha('P_Bg_U_00', 0)];
  const contents = lower ? [
    ...['P_Belt_00', 'P_Bg_D_00', 'P_Home_00', 'P_Aplt_00'].map(target => ({ binding: 'pane', target })), { binding: 'material', target: 'P_Belt_00' },
  ] : [{ binding: 'pane', target: 'P_Bg_U_00' }];
  if (!exactMetadata(clip.tracks, expected) || !exactMetadata(clip.contents, contents) || clip.textures.length || clip.shares?.length)
    throw Error('Unsupported title incoming tracks or bindings');
}

function validateGeometry(layout: NativeLayout, lower: boolean, appId: AppletTitleEntryAppId) {
  const width = lower ? 320 : 400, background = lower ? 'P_Bg_D_00' : 'P_Bg_U_00';
  const group = lower ? 'G_Scene_00' : 'Group_00', names = lower ? [background, 'P_Belt_00', 'P_Aplt_00', 'T_Aplt_00', 'P_Home_00', 'T_Home_00'] : [background];
  if (!exactMetadata(layout.groups, [{ name: 'RootGroup', panes: [], children: [{ name: group, panes: names, children: [] }] }])) throw Error('Unsupported title incoming group');
  const nativePane = (name: string, pathNames: string[], size: number[], translation: number[], origin: number, flags: number) => {
    const path = nativePaneParentPath(layout, name), pane = path?.at(-1);
    if (!pane || pane.kind !== (name === 'RootPane' ? 'pan1' : name.startsWith('T_') ? 'txt1' : 'pic1') || pane.unsupported?.length
      || !exactMetadata(path?.map(parent => parent.name), pathNames) || !exactMetadata(pane.size, size) || !exactMetadata(pane.translation, translation)
      || !exactMetadata(pane.scale, [1, 1]) || !exactMetadata(pane.rotation, [0, 0, 0]) || pane.origin !== origin || pane.flags !== flags || pane.alpha !== 255)
      throw Error(`Unsupported title incoming pane ${name}`);
    return pane;
  };
  const root = nativePane('RootPane', ['RootPane'], [width, 240], [0, 0, 0], 4, 1);
  const bg = nativePane(background, ['RootPane', background], [width, 240], [0, 0, 0], 4, 1);
  if (layout.roots.length !== 1 || !exactMetadata(root.children.map(child => child.name), lower ? [background, 'P_Belt_00'] : [background]) || bg.children.length
    || !bg.picture || !exactMetadata(bg.picture.uvSets, [[0, 0, 1, 0, 0, 30, 1, 30], [0, 0, 2, 0, 0, 2, 2, 2]])
    || !exactMetadata(bg.picture.colors, [[255, 255, 255, 255], [255, 255, 255, 255], lower ? [255, 255, 255, 255] : [0, 0, 0, 255], lower ? [255, 255, 255, 255] : [0, 0, 0, 255]]))
    throw Error('Unsupported title incoming background geometry');
  if (!lower) return;
  const belt = nativePane('P_Belt_00', ['RootPane', 'P_Belt_00'], [480, 64], [0, -4, 0], 4, 3);
  if (!belt.picture || !exactMetadata(belt.children.map(child => child.name), ['P_Aplt_00', 'P_Home_00'])
    || !exactMetadata(belt.picture.uvSets, [[0, 0, 1, 0, 0, 1, 1, 1]])) throw Error('Unsupported title incoming belt geometry');
  for (const name of ['P_Aplt_00', 'P_Home_00']) {
    const textName = name === 'P_Aplt_00' ? 'T_Aplt_00' : 'T_Home_00';
    const icon = nativePane(name, ['RootPane', 'P_Belt_00', name], [32, 32], [-152, 4, 0], 3, name === 'P_Aplt_00' ? 0 : 1);
    const title = nativePane(textName, ['RootPane', 'P_Belt_00', name, textName], [270, 32], [34, 0, 0], 3, 1);
    if (!icon.picture || !exactMetadata(icon.children.map(child => child.name), [textName]) || title.children.length
      || !exactMetadata(icon.picture.uvSets, [[0, 0, 2, 0, 0, 1, 2, 1]])) throw Error('Unsupported title incoming icon geometry');
    const text = title.text, material = layout.materials[icon.picture.material], textMaterial = text && layout.materials[text.material];
    const texture = name === 'P_Aplt_00' ? (appId === 'friends' ? 'LncApltPictFrd_00.bclim' : 'LncApltPictNews_00.bclim') : 'LncApltPictHome_00.bclim';
    const tint = name === 'P_Aplt_00' ? (appId === 'friends' ? [230, 135, 60, 0] : [55, 205, 165, 0]) : [160, 160, 160, 0];
    if (!text || text.font !== 0 || !exactMetadata(text.size, [22.5, 27]) || text.alignment !== 3 || text.lineAlignment !== 0
      || text.characterSpacing !== 0 || text.lineSpacing !== 0 || text.messageStyle !== undefined
      || !exactMetadata(text.topColor, [255, 255, 255, 255]) || !exactMetadata(text.bottomColor, [255, 255, 255, 255])
      || !textMaterial || !exactMetadata(textMaterial.constantColors[0], [50, 50, 50, 255])
      || !material || !exactMetadata(material.bufferColor, tint) || material.textureMaps.length !== 1
      || layout.textures[material.textureMaps[0].texture] !== texture
      || !exactMetadata(material.textureMatrices, [{ translation: [0, 0], rotation: 0, scale: [1, 1] }]))
      throw Error('Unsupported title incoming original text or icon material');
  }
}

function selectedStyleTable(table: NonNullable<NativePack['styles']>[string] | undefined): table is TitleEntryStyleTable {
  if (!table || Object.keys(table).length !== 3 || !('recordSize' in table) || table.recordSize !== 44 || !('unsupported' in table)
    || !Array.isArray(table.unsupported) || table.unsupported.length !== 1) return false;
  const marker: unknown = table.unsupported[0];
  return !!marker && typeof marker === 'object' && Object.keys(marker).length === 2
    && 'kind' in marker && marker.kind === 'styleFields' && 'offsets' in marker && Array.isArray(marker.offsets)
    && marker.offsets.length === styleOffsets.length && marker.offsets.every((value, index) => value === styleOffsets[index]);
}

function overrides(pack: NativePack, selection: AppletTitleEntrySelection): PaneOverrides {
  const bank = pack.messages[selection.bank], message = bank?.messages[bank.labels[selection.label]];
  if (!message || message.styleIndex !== selection.styleIndex || message.text !== (selection.appId === 'friends' ? 'Friend List' : 'Notifications')
    || bank.styleTable !== 'message/EU_English/RI_mstl_LZ.bin' || !exactMetadata(field(bank, 'unsupported'), [])
    || !exactMetadata(message.tokens, [{ text: message.text }]))
    throw Error(`Unsupported title incoming label ${selection.label}`);
  const table = pack.styles?.[bank.styleTable];
  if (!selectedStyleTable(table)) throw Error('Unsupported title incoming style table');
  const style = table.styles[selection.styleIndex];
  if (!message.text || !style || Object.keys(style).length !== 4 || style.fontScale.length !== 2 || style.fontScale.some(value => value !== .8999999761581421)
    || style.lineSpacing !== 0 || style.characterSpacing !== 0 || !style.unresolvedWords
    || Object.keys(style.unresolvedWords).length !== styleOffsets.length
    || !styleOffsets.every((offset, index) => style.unresolvedWords?.[String(offset)] === styleWords[index]))
    throw Error(`Unsupported title incoming message style ${selection.label}`);
  // The pinned incoming callers use a plain TextBox writer, not the named-style
  // metrics branch. Retain the original layout typography; styles are reference.
  return { T_Aplt_00: { text: message.text }, T_Home_00: { text: message.text } };
}

export function validateAppletTitleEntryAssets(pack: NativePack, appId: AppletTitleEntryAppId): void {
  const selection = appletTitleEntrySelection(appId);
  if (!selection || pack.schema !== 1 || !exactMetadata(field(pack, 'unsupported'), [])) throw Error('Unsupported title incoming caller or pack');
  validatePlainWriter(pack, selection);
  for (const [name, width] of [[selection.upper, 400], [selection.lower, 320]] satisfies [string, number][]) {
    const layout = pack.layouts[name], clip = pack.animations[name + '_SceneIn'];
    if (!layout || layout.canvas.width !== width || layout.canvas.height !== 240 || layout.unsupported.length
      || layout.materials.some(material => material.unsupported.length)) throw Error(`Unsupported title incoming layout ${name}`);
    if (!clip || clip.frames !== 21 || clip.loop !== false || clip.childBinding !== true
      || ('unsupported' in clip && (!Array.isArray(clip.unsupported) || clip.unsupported.length))
      || !('sourceFrameRange' in clip) || !Array.isArray(clip.sourceFrameRange) || clip.sourceFrameRange.length !== 2
      || clip.sourceFrameRange[0] !== 20 || clip.sourceFrameRange[1] !== 40) throw Error(`Unsupported title incoming clip ${name}`);
    validateTracks(clip, width === 320, appId);
    validateGeometry(layout, width === 320, appId);
    if (!exactMetadata(clip.groups, [width === 320 ? 'G_Scene_00' : 'Group_00'])) throw Error('Unsupported title incoming clip group');
    if (width === 320) {
      if (layout.fonts.length !== 1 || layout.fonts[0] !== 'cbf_std.bcfnt') throw Error('Unsupported title incoming native font alias');
    } else if (layout.fonts.length) throw Error('Unsupported title incoming upper font');
    for (const texture of layout.textures) if (!pack.textures[texture]?.url) throw Error(`Missing title incoming texture ${texture}`);
    for (const frame of [0, 20]) {
      const posed = poseNativeLayout(layout, pack.animations, [{ name: name + '_SceneIn', frame }]);
      const background = nativePaneParentPath(posed, width === 400 ? 'P_Bg_U_00' : 'P_Bg_D_00');
      if (!background?.every(pane => pane.flags & 1) || background.at(-1)?.alpha !== (frame === 0 ? 255 : 0))
        throw Error('Unsupported title incoming background parent or binding');
      if (width === 320) {
        const belt = nativePaneParentPath(posed, 'P_Belt_00');
        if (!belt?.every(pane => pane.flags & 1) || belt.at(-1)?.alpha !== (frame === 0 ? 255 : 0)
          || belt.at(-1)?.translation[0] !== (frame === 0 ? 0 : -80)) throw Error('Unsupported title incoming belt parent or binding');
      }
    }
  }
  overrides(pack, selection);
}

/** Caller draws its complete destination first. Notifications' traced
 * descending500/100/3 list draws this title cover last; Friends' equivalent
 * final-cover composition is an adaptation, not a traced sort result. */
export function drawAppletTitleEntry(renderer: NativeLayoutRenderer, top: CanvasRenderingContext2D, bottom: CanvasRenderingContext2D, pose: { appId: AppletTitleEntryAppId; frame: number }): boolean {
  if (!Number.isInteger(pose.frame) || pose.frame < 0 || pose.frame > 20) throw Error('Invalid title incoming source frame');
  const selection = appletTitleEntrySelection(pose.appId);
  if (!selection) throw Error('Unsupported title incoming caller');
  const pack = renderer.packs[selection.alias];
  if (!pack) throw Error('Title incoming pack unavailable');
  validateAppletTitleEntryAssets(pack, selection.appId);
  const upper = renderer.draw(top, selection.alias, selection.upper, { bindings: [{ name: selection.upper + '_SceneIn', frame: pose.frame }] });
  const lower = renderer.draw(bottom, selection.alias, selection.lower, { bindings: [{ name: selection.lower + '_SceneIn', frame: pose.frame }], overrides: overrides(pack, selection) });
  return upper && lower;
}
