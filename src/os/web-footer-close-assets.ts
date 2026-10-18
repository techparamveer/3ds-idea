import { nativePaneParentPath, type NativePack } from './native-layout.ts';

export function webFooterFeedbackFrame(frame: number): number {
  if (!Number.isInteger(frame) || frame < 0 || frame > 5) throw Error('Invalid web footer feedback frame');
  return frame;
}
export function validateWebFooterFeedbackAssets(packs: Record<string, NativePack>, appId: string): void {
  if (appId !== 'browser' && appId !== 'miiverse') throw Error('Unsupported web footer title');
  const browser = appId === 'browser', name = browser ? 'ExitButton' : 'OliveBack', pack = packs[browser ? 'web-exit' : 'web-back'];
  const layout = pack?.layouts[name], clip = pack?.animations[name + '_DecidedOn'];
  const proof = pack?.resourceSources?.animations?.[name + '_DecidedOn'];
  const title = browser ? '0004003000009d02' : '000400300000be02';
  if (!layout || layout.unsupported.length || !clip || clip.frames !== 6 || clip.loop || !clip.childBinding || clip.groups.length
    || Reflect.get(clip, 'name') !== 'DecidedOn' || !('unsupported' in clip) || !Array.isArray(clip.unsupported) || clip.unsupported.length
    || !('sourceFrameRange' in clip) || !Array.isArray(clip.sourceFrameRange) || clip.sourceFrameRange.join('|') !== '40|45'
    || pack.titleId !== title || proof?.titleId !== title || proof.path !== `layout/toolbar/${name}.arc/anim/${name}_DecidedOn.bclan`
    || proof.sha256 !== (browser ? '6367ce2d665a0a1e3c4022f2845adcfcda07183c3116e7376ed8cbeb4e2f1db1' : '5c5a076c7ef0f9ba9f7bc319c294936a2bca8f9be34034bf3c2a0faad1c521a6'))
    throw Error('Unsupported web footer decision clip');
  for (const track of clip.tracks) {
    if (track.binding === 'pane' ? !nativePaneParentPath(layout, track.target) : !layout.materials.some(material => material.name === track.target))
      throw Error('Unsupported web footer feedback target');
  }
  for (const texture of clip.textures) if (!pack.textures[texture]) throw Error('Unsupported web footer feedback texture');
}
