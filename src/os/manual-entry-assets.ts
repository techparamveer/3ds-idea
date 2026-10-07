import { nativePaneParentPath, poseNativeLayout, type AnimationBinding, type NativePack } from './native-layout.ts';
import type { ManualEntryPose } from './manual-entry-presentation.ts';

export function manualEntryBindings(pose: Pick<ManualEntryPose, 'phase' | 'frame'>): { upper: AnimationBinding[]; lower: AnimationBinding[] } {
  if (!Number.isInteger(pose.frame) || pose.frame < 0 || pose.frame > 20) throw Error('Invalid Manual entry source frame');
  const suffix = pose.phase === 'out' ? 'SceneOut' : 'SceneIn';
  return { upper: [{ name: `CmnFade_U_00_${suffix}`, frame: pose.frame }], lower: [
    { name: 'CmnFade_D_00_Aplt', frame: 4 }, { name: `CmnFade_D_00_${suffix}`, frame: pose.frame },
  ] };
}

export function validateManualEntryAssets(pack: NativePack): void {
  for (const [name, width, group] of [['CmnFade_U_00', 400, 'Group_00'], ['CmnFade_D_00', 320, 'G_Scene_00']] as const) {
    const layout = pack.layouts[name];
    if (!layout || layout.canvas.width !== width || layout.canvas.height !== 240 || layout.unsupported.length) throw Error(`Unsupported Manual entry layout ${name}`);
    for (const [suffix, range, alpha] of [['SceneOut', [-20, 0], [0, 255]], ['SceneIn', [20, 40], [255, 0]]] as const) {
      const clip = pack.animations[`${name}_${suffix}`];
      if (!clip || clip.frames !== 21 || clip.loop || !clip.childBinding || ('unsupported' in clip && (!Array.isArray(clip.unsupported) || clip.unsupported.length)) || clip.groups.length !== 1 || clip.groups[0] !== group
        || !('sourceFrameRange' in clip) || !Array.isArray(clip.sourceFrameRange) || clip.sourceFrameRange.length !== 2
        || clip.sourceFrameRange[0] !== range[0] || clip.sourceFrameRange[1] !== range[1]) throw Error(`Unsupported Manual entry clip ${name}_${suffix}`);
      const target = width === 400 ? 'P_Bg_U_00' : 'P_Bg_D_00';
      const curve = (pane: string, property: string, values: readonly number[], slope: number) => {
        const tracks = clip.tracks.filter(track => track.target === pane && track.property === property);
        if (tracks.length !== 1 || tracks[0].interpolation !== 'hermite' || tracks[0].keys.length !== 2
          || tracks[0].keys[0].frame !== 0 || tracks[0].keys[0].value !== values[0] || tracks[0].keys[0].slope !== slope
          || tracks[0].keys[1].frame !== 20 || tracks[0].keys[1].value !== values[1] || tracks[0].keys[1].slope !== 0) throw Error(`Unsupported Manual cover curve ${pane}/${property}`);
      };
      curve(target, 'alpha', alpha, suffix === 'SceneOut' ? 12.75 : -12.75);
      if (width === 320) { curve('P_Belt_00', 'alpha', alpha, suffix === 'SceneOut' ? 12.75 : -12.75); curve('P_Belt_00', 'translation.x', suffix === 'SceneOut' ? [80, 0] : [0, -80], -4); }
    }
  }
  const selector = pack.animations.CmnFade_D_00_Aplt;
  if (!selector || selector.frames !== 8 || selector.loop || !selector.childBinding || ('unsupported' in selector && (!Array.isArray(selector.unsupported) || selector.unsupported.length)) || selector.groups.length !== 1 || selector.groups[0] !== 'G_Aplt_00'
    || !('sourceFrameRange' in selector) || !Array.isArray(selector.sourceFrameRange) || selector.sourceFrameRange.length !== 2 || selector.sourceFrameRange[0] !== 0 || selector.sourceFrameRange[1] !== 7
    || selector.textures[0] !== 'LncApltPictEbird_00.bclim' || !pack.textures['LncApltPictEbird_00.bclim']) throw Error('Unsupported Manual selector');
  const pattern = selector.tracks.filter(track => track.target === 'P_Aplt_00' && track.property === 'texture.pattern');
  if (pattern.length !== 1 || pattern[0].interpolation !== 'step' || pattern[0].keys.find(key => key.frame === 4)?.value !== 0) throw Error('Unsupported Manual selector frame');
  for (const suffix of ['SceneOut', 'SceneIn']) for (const frame of [0, 20]) {
    const layout = poseNativeLayout(pack.layouts.CmnFade_D_00, pack.animations, [
      { name: 'CmnFade_D_00_Aplt', frame: 4 }, { name: `CmnFade_D_00_${suffix}`, frame },
    ]);
    for (const name of ['P_Bg_D_00', 'P_Belt_00', 'P_Aplt_00', 'T_Aplt_00']) {
      const path = nativePaneParentPath(layout, name);
      if (!path || !path.every(pane => pane.flags & 1)) throw Error(`Unsupported Manual cover parent ${name}`);
    }
    const belt = nativePaneParentPath(layout, 'P_Belt_00')!.at(-1)!;
    const applet = nativePaneParentPath(layout, 'P_Aplt_00')!.at(-1)!;
    const title = nativePaneParentPath(layout, 'T_Aplt_00')!.at(-1)!;
    const beltMaterial = belt.picture && layout.materials[belt.picture.material];
    const appletMaterial = applet.picture && layout.materials[applet.picture.material];
    const titleMaterial = title.text && layout.materials[title.text.material];
    const matrix = appletMaterial?.textureMatrices[0], patternTexture = appletMaterial?.textureMaps[0]?.texture;
    if (!beltMaterial || beltMaterial.constantColors[0]?.length !== 4 || !beltMaterial.constantColors[0].slice(0, 3).every(value => value === 160)
      || !appletMaterial || appletMaterial.bufferColor.length !== 4 || !appletMaterial.bufferColor.slice(0, 3).every(value => value === 160)
      || appletMaterial.textureMatrices.length !== 1 || !matrix || matrix.rotation !== 0
      || matrix.translation.length !== 2 || matrix.translation.some(value => value !== 0)
      || matrix.scale.length !== 2 || matrix.scale.some(value => value !== 1)
      || patternTexture === undefined || layout.textures[patternTexture] !== 'LncApltPictEbird_00.bclim'
      || !titleMaterial || titleMaterial.constantColors[0]?.[3] !== 255) throw Error('Unsupported Manual selector material pose');
    const alpha = suffix === 'SceneOut' ? (frame === 0 ? 0 : 255) : (frame === 0 ? 255 : 0);
    const x = suffix === 'SceneOut' ? (frame === 0 ? 80 : 0) : (frame === 0 ? 0 : -80);
    if (belt.alpha !== alpha || belt.translation[0] !== x || nativePaneParentPath(layout, 'P_Bg_D_00')!.at(-1)!.alpha !== alpha) throw Error('Unsupported Manual lower cover group binding');
    const upper = poseNativeLayout(pack.layouts.CmnFade_U_00, pack.animations, [{ name: `CmnFade_U_00_${suffix}`, frame }]);
    if (!nativePaneParentPath(upper, 'P_Bg_U_00')?.every(pane => pane.flags & 1)) throw Error('Unsupported Manual upper cover parent');
    if (nativePaneParentPath(upper, 'P_Bg_U_00')!.at(-1)!.alpha !== alpha) throw Error('Unsupported Manual upper cover group binding');
  }
}
