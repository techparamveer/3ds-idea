import { nativeMessageOverride, nativePaneParentPath, poseNativeLayout, type NativePack, type NativeTrack, type PaneOverrides } from './native-layout.ts';
import { manualEntryBindings, validateManualEntryAssets } from './manual-entry-assets.ts';

export type AppletEntryAppId = 'game-notes' | 'friends' | 'notifications' | 'browser' | 'miiverse';
export type AppletEntrySelection = {
  kind: 'message'; selector: 0 | 1 | 2 | 3; texture: string;
  label: 'lau_title_memo' | 'lau_title_fri' | 'lau_title_news' | 'lau_title_web';
} | {
  kind: 'logo'; selector: 7; texture: string;
  material: 'Miiverse_logo_01'; logoTexture: 'Miiverse_logo_00.bclim';
};
const selections = {
  'game-notes': { kind: 'message', selector: 0, texture: 'LncApltPictMemo_00.bclim', label: 'lau_title_memo' },
  friends: { kind: 'message', selector: 1, texture: 'LncApltPictFrd_00.bclim', label: 'lau_title_fri' },
  notifications: { kind: 'message', selector: 2, texture: 'LncApltPictNews_00.bclim', label: 'lau_title_news' },
  browser: { kind: 'message', selector: 3, texture: 'LncApltPictWeb_00.bclim', label: 'lau_title_web' },
  miiverse: { kind: 'logo', selector: 7, texture: 'LncApltPictOlv_00.bclim', material: 'Miiverse_logo_01', logoTexture: 'Miiverse_logo_00.bclim' },
} satisfies Record<AppletEntryAppId, AppletEntrySelection>;

export function appletEntrySelection(appId: AppletEntryAppId): AppletEntrySelection {
  if (!Object.hasOwn(selections, appId)) throw Error('Unsupported native applet entry caller');
  const selection = selections[appId];
  return { ...selection };
}

export function appletEntryBindings(pose: { appId: AppletEntryAppId; phase: 'out' | 'in'; frame: number }) {
  if (pose.phase !== 'out' && pose.phase !== 'in') throw Error('Invalid applet entry phase');
  const selection = appletEntrySelection(pose.appId), bindings = manualEntryBindings(pose);
  return { upper: bindings.upper, lower: [{ name: 'CmnFade_D_00_Aplt', frame: selection.selector }, bindings.lower[1]] };
}

export function appletEntryOverrides(messages: NativePack, appId: AppletEntryAppId): PaneOverrides {
  const selection = appletEntrySelection(appId);
  if (selection.kind === 'logo') return {};
  const bank = messages.messages.menu_msbt_LZ, index = bank?.labels[selection.label];
  if (!Number.isInteger(index) || index < 0 || bank?.messages[index]?.styleIndex !== 12
    || bank.styleTable !== 'message/EU_English/RI_mstl_LZ.bin') throw Error(`Native applet entry label missing or unsupported: ${selection.label}`);
  const label = nativeMessageOverride(messages, 'menu_msbt_LZ', selection.label, '');
  if (!label.text) throw Error(`Native applet entry label missing: ${selection.label}`);
  return { T_Aplt_00: label };
}

// These are validation fixtures from CmnFade_D_00_Aplt, never replacement
// tracks. Duplicate-frame keys must reach poseNativeLayout unchanged.
const colorFrames = [0, 1, 1, 2, 2, 3, 3, 4, 4, 7, 7];
const colors = [
  [205, 205, 230, 230, 55, 55, 40, 40, 160, 160, 0],
  [210, 210, 135, 135, 205, 205, 165, 165, 160, 160, 200],
  [45, 45, 60, 60, 165, 165, 230, 230, 160, 160, 0],
];
const patternTextures = ['LncApltPictEbird_00.bclim', 'LncApltPictFrd_00.bclim', 'LncApltPictHome_00.bclim', 'LncApltPictMemo_00.bclim', 'LncApltPictNews_00.bclim', 'LncApltPictOlv_00.bclim', 'LncApltPictWeb_00.bclim'];

function validateSelectorKeys(tracks: NativeTrack[]): void {
  const track = (target: string, property: string, component: number, frames: number[], values: number[], lastSlope = 0, step = false) => {
    const matches = tracks.filter(value => value.target === target && value.property === property), value = matches[0];
    if (matches.length !== 1 || value.binding !== 'material' || value.index !== 0 || value.component !== component
      || value.interpolation !== (step ? 'step' : 'hermite') || value.keys.length !== frames.length
      || value.keys.some((key, index) => key.frame !== frames[index] || key.value !== values[index]
        || key.slope !== (step ? undefined : index === frames.length - 1 ? lastSlope : 0)))
      throw Error(`Unsupported applet selector keys ${target}/${property}`);
  };
  if (tracks.length !== 13) throw Error('Unsupported applet selector track count');
  for (let component = 0; component < 3; component++) {
    track('P_Belt_00', `materialColor.1.${component}`, component + 4, colorFrames, colors[component]);
    track('P_Aplt_00', `materialColor.0.${component}`, component, colorFrames, colors[component], component === 1 ? 13.333333015441895 : -53.33333206176758);
  }
  track('P_Aplt_00', 'texture.translation.x', 0, [0, 1, 1, 4, 4, 5, 5], [0, 0, .5, .5, 0, 0, .5]);
  track('P_Aplt_00', 'texture.translation.y', 1, [0, 3, 3, 4, 4], [0, 0, .5, .5, 0]);
  track('P_Aplt_00', 'texture.scale.x', 3, [0, 1, 1, 4, 4, 5, 5], [1, 1, 2, 2, 1, 1, 2]);
  track('P_Aplt_00', 'texture.scale.y', 4, [0, 3, 3, 4, 4], [1, 1, 2, 2, 1]);
  track('P_Aplt_00', 'texture.pattern', 0, [0, 1, 2, 3, 4, 5, 7], [3, 1, 4, 6, 0, 2, 5], 0, true);
  track('T_Aplt_00', 'materialColor.1.3', 7, [6, 7, 7], [255, 255, 1]);
  track('Miiverse_logo_01', 'texture.translation.y', 1, [6, 7, 7], [1, 1, 0]);
}

export function validateAppletEntryAssets(pack: NativePack, appId: AppletEntryAppId): void {
  const selection = appletEntrySelection(appId);
  validateManualEntryAssets(pack);
  const group = pack.layouts.CmnFade_D_00.groups[0]?.children.find(value => value.name === 'G_Aplt_00');
  if (!group || group.children.length || group.panes.join('|') !== 'P_Aplt_00|P_Belt_00|T_Aplt_00|Miiverse_logo_01')
    throw Error('Unsupported applet selector group');
  const logoSource = nativePaneParentPath(pack.layouts.CmnFade_D_00, 'Miiverse_logo_01')?.at(-1);
  if (!logoSource?.picture || !pack.layouts.CmnFade_D_00.materials[logoSource.picture.material])
    throw Error('Unsupported authored Miiverse logo material or pane');
  const selector = pack.animations.CmnFade_D_00_Aplt;
  if (selector.textures.length !== patternTextures.length || selector.textures.some((name, index) => name !== patternTextures[index]))
    throw Error('Unsupported applet selector texture patterns');
  validateSelectorKeys(selector.tracks);
  const selected = pack.textures[selection.texture];
  const width = appId === 'game-notes' ? 32 : 16, height = appId === 'browser' ? 16 : 32;
  if (!selected || !selected.url || selected.width !== width || selected.height !== height || selected.picaFormat !== 9)
    throw Error('Missing or unsupported selected applet texture');
  const logo = pack.textures['Miiverse_logo_00.bclim'];
  if (!logo || !logo.url || logo.width !== 128 || logo.height !== 32 || logo.picaFormat !== 11)
    throw Error('Missing or unsupported authored Miiverse logo texture');
  const tint = appId === 'game-notes' ? [205, 210, 45] : appId === 'friends' ? [230, 135, 60]
    : appId === 'notifications' ? [55, 205, 165] : appId === 'browser' ? [40, 165, 230] : [0, 200, 0];
  const translation = appId === 'game-notes' ? [0, 0] : appId === 'browser' ? [.5, .5] : [.5, 0];
  const scale = appId === 'game-notes' ? [1, 1] : appId === 'browser' ? [2, 2] : [2, 1];
  const equal = (actual: number[] | undefined, expected: number[]) => actual?.length === expected.length && actual.every((value, index) => value === expected[index]);
  for (const phase of ['out', 'in'] satisfies ('out' | 'in')[]) for (const frame of [0, 20]) {
    const bindings = appletEntryBindings({ appId, phase, frame });
    const layout = poseNativeLayout(pack.layouts.CmnFade_D_00, pack.animations, bindings.lower);
    const pane = (name: string) => {
      const path = nativePaneParentPath(layout, name), result = path?.at(-1);
      if (!result || !path?.every(value => value.flags & 1)) throw Error(`Unsupported applet cover parent ${name}`);
      return result;
    };
    const belt = pane('P_Belt_00'), applet = pane('P_Aplt_00'), title = pane('T_Aplt_00'), logoPane = pane('Miiverse_logo_01');
    const beltMaterial = belt.picture && layout.materials[belt.picture.material];
    const appletMaterial = applet.picture && layout.materials[applet.picture.material];
    const titleMaterial = title.text && layout.materials[title.text.material];
    const logoMaterial = logoPane.picture && layout.materials[logoPane.picture.material];
    const matrix = appletMaterial?.textureMatrices[0], logoMatrix = logoMaterial?.textureMatrices[0];
    const pattern = appletMaterial?.textureMaps[0]?.texture, logoPattern = logoMaterial?.textureMaps[0]?.texture;
    if (!beltMaterial || !equal(beltMaterial.constantColors[0], [...tint, 255])
      || !appletMaterial || !equal(appletMaterial.bufferColor, [...tint, 0])
      || appletMaterial.textureMatrices.length !== 1 || !matrix || matrix.rotation !== 0 || !equal(matrix.translation, translation) || !equal(matrix.scale, scale)
      || pattern === undefined || layout.textures[pattern] !== selection.texture
      || !titleMaterial || !equal(titleMaterial.constantColors[0], [50, 50, 50, selection.kind === 'logo' ? 1 : 255])
      || !logoMaterial || logoMaterial.name !== 'Miiverse_logo_01' || logoMaterial.unsupported.length
      || !equal(logoMaterial.bufferColor, [0, 200, 0, 0])
      || logoMaterial.textureMatrices.length !== 1 || !logoMatrix || logoMatrix.rotation !== 0
      || !equal(logoMatrix.translation, [0, selection.kind === 'logo' ? 0 : 1]) || !equal(logoMatrix.scale, [1, 1])
      || logoPattern === undefined || layout.textures[logoPattern] !== 'Miiverse_logo_00.bclim') throw Error('Unsupported applet selector material pose');
    if (!equal(logoPane.translation, [-120, 4.25, 0]) || !equal(logoPane.scale, [.8500000238418579, .8500000238418579])
      || !equal(logoPane.size, [128, 32]) || logoPane.picture?.uvSets.length !== 1
      || !equal(logoPane.picture.uvSets[0], [0, 0, 1, 0, 0, 1, 1, 1])
      || logoPane.picture.colors.length !== 4 || !logoPane.picture.colors.every(value => equal(value, [255, 255, 255, 255]))) throw Error('Unsupported authored Miiverse logo pane');
    const alpha = phase === 'out' ? (frame === 0 ? 0 : 255) : (frame === 0 ? 255 : 0);
    const x = phase === 'out' ? (frame === 0 ? 80 : 0) : (frame === 0 ? 0 : -80);
    if (belt.alpha !== alpha || belt.translation[0] !== x || pane('P_Bg_D_00').alpha !== alpha) throw Error('Unsupported applet lower cover pose');
  }
}
