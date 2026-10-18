import { nativePaneParentPath, poseNativeLayout, type NativePack } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer.ts';
import { exactMetadata, validateAppletTitleEntryAssets } from './applet-title-entry-assets.ts';
import type { NotesFooterClosePaint } from './notes-footer-close.ts';

export type FriendsFooterClosePaint = NotesFooterClosePaint;
export function validateFriendsFooterCloseAssets(packs: Record<string, NativePack>): void {
  const pack = packs['friends-incoming'];
  if (!pack) throw Error('Friends return pack unavailable');
  validateAppletTitleEntryAssets(pack, 'friends');
  const incoming: unknown = Reflect.get(pack, 'incomingTextBinding');
  if (!incoming || typeof incoming !== 'object' || !exactMetadata(Reflect.get(pack, 'returnTextBinding'), {
    ...incoming, label: 'fri_title_menu', sourceMessageIndex: 7, styleIndex: 40,
    caller: { start: 0x1d0164, end: 0x1d0180, sha256: 'b9cebcefaf38e097ea4a553877c93e6e50b5fea7e7f82e17b9da7869089e9d7d', helper: 0x1cce60, commandType: 2 },
    triggerEstablished: false,
  })) throw Error('Unsupported Friends return label proof');
  const bank = pack.messages.friend_msbt_LZ, label = bank.messages[bank.labels.fri_title_menu];
  if (!exactMetadata(label, { styleIndex: 40, text: 'HOME Menu', tokens: [{ text: 'HOME Menu' }] }))
    throw Error('Unsupported Friends HOME label');
  const alpha = (target: string, contentIndex: number) => ({ binding: 'pane', target, contentIndex, tag: 'CLVC', index: 0, component: 16,
    interpolation: 'hermite', property: 'alpha', keys: [{ frame: 0, value: 0, slope: 12.75 }, { frame: 20, value: 255, slope: 0 }] });
  for (const lower of [false, true]) {
    const name = lower ? 'FrdCmnFade_D_00' : 'FrdCmnFade_U_00', clip = pack.animations[name + '_SceneOut'];
    const tracks = lower ? [
      { binding: 'pane', target: 'P_Belt_00', contentIndex: 0, tag: 'CLPA', index: 0, component: 0, interpolation: 'hermite', property: 'translation.x', keys: [{ frame: 0, value: 80, slope: -4 }, { frame: 20, value: 0, slope: 0 }] },
      alpha('P_Belt_00', 0), alpha('P_Bg_D_00', 1),
      ...['P_Home_00', 'P_Aplt_00'].map((target, index) => ({ binding: 'pane', target, contentIndex: index + 2, tag: 'CLVI', index: 0, component: 0, interpolation: 'step', property: 'visible', keys: [{ frame: 20, value: 1 - index }] })),
      ...[0, 1, 2].map(index => ({ binding: 'material', target: 'P_Belt_00', contentIndex: 4, tag: 'CLMC', index: 0, component: index + 4, interpolation: 'hermite', property: `materialColor.1.${index}`, keys: [{ frame: 20, value: 160, slope: 0 }] })),
    ] : [alpha('P_Bg_U_00', 0)];
    const contents = lower ? [...['P_Belt_00', 'P_Bg_D_00', 'P_Home_00', 'P_Aplt_00'].map(target => ({ binding: 'pane', target })), { binding: 'material', target: 'P_Belt_00' }] : [{ binding: 'pane', target: 'P_Bg_U_00' }];
    if (!exactMetadata(clip, { version: 33685504, name: 'SceneOut', order: 1, frames: 21, loop: false, childBinding: true,
      sourceFrameRange: [-20, 0], groups: [lower ? 'G_Scene_00' : 'Group_00'], textures: [], unsupported: [], contents, tracks }))
      throw Error('Unsupported Friends return clip');
    for (const frame of [0, 20]) {
      const posed = poseNativeLayout(pack.layouts[name], pack.animations, [{ name: name + '_SceneOut', frame }]);
      if (nativePaneParentPath(posed, lower ? 'P_Bg_D_00' : 'P_Bg_U_00')?.at(-1)?.alpha !== (frame ? 255 : 0))
        throw Error('Unsupported Friends return opacity');
    }
  }
  const friends = packs.friends, feedback = friends?.animations.FrdTopUIDw_D_00_Decide;
  if (!feedback || feedback.frames !== 6 || feedback.loop || !feedback.childBinding
    || !exactMetadata(Reflect.get(feedback, 'sourceFrameRange'), [36, 41])
    || !exactMetadata(Reflect.get(feedback, 'unsupported'), []) || !feedback.groups.includes('G_BtnBakHM_00')
    || !friends.layouts.FrdTopUIDw_D_00.groups[0]?.children.some(group => group.name === 'G_BtnBakHM_00'))
    throw Error('Unsupported Friends footer decision clip');
}

export function drawFriendsFooterCover(renderer: NativeLayoutRenderer, top: CanvasRenderingContext2D, bottom: CanvasRenderingContext2D, frame: number): boolean {
  if (!Number.isInteger(frame) || frame < 0 || frame > 20) throw Error('Invalid Friends return source frame');
  validateFriendsFooterCloseAssets(renderer.packs);
  const upper = renderer.draw(top, 'friends-incoming', 'FrdCmnFade_U_00', { bindings: [{ name: 'FrdCmnFade_U_00_SceneOut', frame }] });
  const bank = renderer.packs['friends-incoming'].messages.friend_msbt_LZ;
  const text = bank.messages[bank.labels.fri_title_menu].text;
  const lower = renderer.draw(bottom, 'friends-incoming', 'FrdCmnFade_D_00', {
    bindings: [{ name: 'FrdCmnFade_D_00_SceneOut', frame }], overrides: { T_Aplt_00: { text }, T_Home_00: { text } },
  });
  return upper && lower;
}
