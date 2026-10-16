import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateHomeFolderEntryAssets } from '../src/os/home-folder-entry-assets.ts';
import { nativePaneParentPath } from '../src/os/native-layout.ts';

const source = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));

test('pinned folder entry clips and both inherited parent paths are supported without mutation', () => {
  const before = JSON.stringify(source);
  validateHomeFolderEntryAssets(source);
  assert.equal(JSON.stringify(source), before);
});

test('unsupported selected folder entry resources fail explicitly', () => {
  const mutations = [
    pack => { delete pack.animations.LncFolder_00_FadeIn; },
    pack => { delete pack.animations.LncFolderCapture_00_Fade; },
    pack => { pack.animations.LncFolder_00_FadeIn.frames = 16; },
    pack => { pack.animations.LncFolderCapture_00_Fade.frames = 8; },
    pack => { pack.animations.LncFolder_00_FadeIn.loop = true; },
    pack => { pack.animations.LncFolder_00_FadeIn.sourceFrameRange = [0, 16]; },
    pack => { pack.animations.LncFolderCapture_00_Fade.sourceFrameRange = [0, 9]; },
    pack => { pack.animations.LncFolder_00_FadeIn.childBinding = false; },
    pack => { pack.animations.LncFolder_00_FadeIn.groups = []; },
    pack => { delete pack.layouts.LncFolder_00; },
    pack => { pack.layouts.LncFolderCapture_00.canvas.width = 400; },
    pack => { pack.layouts.LncFolder_00.unsupported.push('unknown'); },
    pack => { nativePaneParentPath(pack.layouts.LncFolder_00, 'N_Dlg_00').at(-1).name = 'Missing'; },
    pack => { nativePaneParentPath(pack.layouts.LncFolder_00, 'N_BlankAnime_00').at(-1).kind = 'pic1'; },
    pack => { nativePaneParentPath(pack.layouts.LncFolder_00, 'N_Dlg_00').at(-1).flags = 0; },
    pack => { pack.layouts.LncFolder_00.roots.push(structuredClone(nativePaneParentPath(pack.layouts.LncFolder_00, 'N_Dlg_00').at(-1))); },
    pack => { pack.layouts.LncFolder_00.groups[0].children.find(group => group.name === 'G_Scene_00').panes = []; },
    pack => { pack.animations.LncFolder_00_FadeIn.tracks.find(track => track.property === 'scale.x').keys = []; },
    pack => { pack.animations.LncFolderCapture_00_Fade.tracks.find(track => track.target === 'P_Capture_00').interpolation = 'step'; },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const pack = structuredClone(source); mutate(pack);
    assert.throws(() => validateHomeFolderEntryAssets(pack), /Unsupported native folder entry/, `mutation ${index}`);
  }
});
