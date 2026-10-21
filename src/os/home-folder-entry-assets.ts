import { nativePaneParentPath, type NativePack, type NativePane, type NativeGroup } from './native-layout.ts';

/** Guards the pinned CLAN intervals and the parents used by live folder entry. */
export function validateHomeFolderEntryAssets(pack: NativePack): void {
  for (const [name, frames, range, group] of [
    ['LncFolder_00_FadeIn', 17, [-16, 0], 'G_Scene_00'],
    ['LncFolderCapture_00_Fade', 9, [0, 8], 'G_Capture_00'],
  ] as const) {
    const clip = pack.animations[name];
    if (!clip || clip.frames !== frames || clip.loop || clip.childBinding !== true
      || clip.groups.length !== 1 || clip.groups[0] !== group
      || !('sourceFrameRange' in clip) || !Array.isArray(clip.sourceFrameRange)
      || clip.sourceFrameRange.length !== 2 || clip.sourceFrameRange[0] !== range[0] || clip.sourceFrameRange[1] !== range[1]) {
      throw new Error(`Unsupported native folder entry animation ${name}`);
    }
  }
  const folder = pack.layouts.LncFolder_00, capture = pack.layouts.LncFolderCapture_00;
  for (const layout of [folder, capture]) {
    if (!layout || layout.canvas.width !== 320 || layout.canvas.height !== 240 || layout.unsupported.length) {
      throw new Error('Unsupported native folder entry layout');
    }
  }
  const count = (panes: NativePane[], name: string): number => panes.reduce((sum, pane) => sum
    + (pane.name === name ? 1 : 0) + count(pane.children, name), 0);
  const groups = (items: NativeGroup[], name: string): NativeGroup[] => items.flatMap(group => [
    ...(group.name === name ? [group] : []), ...groups(group.children, name),
  ]);
  for (const [layout, group, names] of [[folder, 'G_Scene_00', ['N_Dlg_00', 'N_BlankAnime_00']], [capture, 'G_Capture_00', ['P_Capture_00']]] as const) {
    const bound = groups(layout.groups, group);
    if (bound.length !== 1 || bound[0].panes.length !== names.length || !names.every(name => bound[0].panes.includes(name))) {
      throw new Error(`Unsupported native folder entry group ${group}`);
    }
  }
  const dialog = nativePaneParentPath(folder, 'N_Dlg_00'), blank = nativePaneParentPath(folder, 'N_BlankAnime_00');
  if (!dialog || !blank || count(folder.roots, 'N_Dlg_00') !== 1 || count(folder.roots, 'N_BlankAnime_00') !== 1
    || dialog.at(-1)?.kind !== 'pan1' || blank.at(-1)?.kind !== 'pan1'
    || !dialog.every(pane => pane.flags & 1) || !blank.every(pane => pane.flags & 1)
    || !blank.some(pane => pane.name === 'N_Dlg_00') || count(capture.roots, 'P_Capture_00') !== 1) {
    throw new Error('Unsupported native folder entry parent');
  }
  for (const [name, target, properties] of [
    ['LncFolder_00_FadeIn', 'N_Dlg_00', ['scale.x', 'scale.y', 'alpha']],
    ['LncFolder_00_FadeIn', 'N_BlankAnime_00', ['alpha']],
    ['LncFolderCapture_00_Fade', 'P_Capture_00', ['materialColor.6.3']],
  ] as const) {
    for (const property of properties) {
      const tracks = pack.animations[name].tracks.filter(track => track.target === target && track.property === property);
      if (tracks.length !== 1 || tracks[0].interpolation !== 'hermite' || !tracks[0].keys.length) {
        throw new Error(`Unsupported native folder entry channel ${target}/${property}`);
      }
    }
  }
}
