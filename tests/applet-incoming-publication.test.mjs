import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nativeTextMetrics, nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const raw = path => readFileSync(new URL(path, root));
const json = path => JSON.parse(raw(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pane = (layout, name) => nativePaneParentPath(layout, name).at(-1);
const manifest = json('manifest.json');
const callers = [
  { slug: 'friends', title: '0004003000009f02', content: '00000017', version: 6144,
    upper: 'FrdCmnFade_U_00', lower: 'FrdCmnFade_D_00', bank: 'friend_msbt_LZ',
    label: 'fri_title_fri', index: 6, style: 39, text: 'Friend List', tint: [230, 135, 60, 255],
    icon: 'LncApltPictFrd_00.bclim' },
  { slug: 'notifications', title: '000400300000a002', content: '00000012', version: 4097,
    upper: 'CmnFade_U_00', lower: 'CmnFade_D_00', bank: 'newslist_msbt_LZ',
    label: 'new_title_new', index: 26, style: 13, text: 'Notifications', tint: [55, 205, 165, 255],
    icon: 'LncApltPictNews_00.bclim' },
];

for (const caller of callers) {
  const url = 'packs/'+caller.slug+'/incoming.json';
  const path = process.env.APPLET_INCOMING_PACK_ROOT
    ? resolve(process.env.APPLET_INCOMING_PACK_ROOT, caller.slug, 'incoming.json') : new URL(url, root);
  const pack = existsSync(path) ? JSON.parse(readFileSync(path)) : null;
  const pending = { skip: pack ? false : 'incoming export/publication pending; private fixture env is optional' };
  test(caller.slug+' incoming poses retain original independent alpha/belt/tint/icon bindings', pending, () => {
    assert.deepEqual(Object.keys(pack.layouts).sort(), [caller.upper, caller.lower].sort());
    assert.deepEqual(Object.keys(pack.animations).sort(), [caller.upper+'_SceneIn', caller.lower+'_SceneIn'].sort());
    for (const frame of [0, 20]) {
      const upper = poseNativeLayout(pack.layouts[caller.upper], pack.animations,
        [{ name: caller.upper+'_SceneIn', frame }]);
      const lower = poseNativeLayout(pack.layouts[caller.lower], pack.animations,
        [{ name: caller.lower+'_SceneIn', frame }]);
      assert.equal(pane(upper, 'P_Bg_U_00').alpha, frame === 0 ? 255 : 0);
      assert.equal(pane(lower, 'P_Bg_D_00').alpha, frame === 0 ? 255 : 0);
      assert.equal(pane(lower, 'P_Belt_00').alpha, frame === 0 ? 255 : 0);
      assert.equal(pane(lower, 'P_Belt_00').translation[0], frame === 0 ? 0 : -80);
      assert.equal(pane(lower, 'P_Home_00').flags & 1, 0);
      assert.equal(pane(lower, 'P_Aplt_00').flags & 1, 1);
      assert.deepEqual(lower.materials[pane(lower, 'P_Belt_00').picture.material].constantColors[0], caller.tint);
      const icon = pane(lower, 'P_Aplt_00');
      assert.equal(lower.textures[lower.materials[icon.picture.material].textureMaps[0].texture], caller.icon);
      assert.deepEqual(icon.picture.uvSets[0], [0, 0, 2, 0, 0, 1, 2, 1]);
    }
    for (const clip of Object.values(pack.animations)) {
      assert.equal(clip.frames, 21);
      assert.deepEqual(clip.sourceFrameRange, [20, 40]);
      assert.equal(clip.loop, false);
      assert.equal(clip.childBinding, true);
      assert.deepEqual(clip.unsupported, []);
    }
  });

  test(caller.slug+' proven plain-label override retains original metrics and non-applied style reference', pending, () => {
    const bank = pack.messages[caller.bank];
    assert.deepEqual(bank.labels, { [caller.label]: 0 });
    assert.deepEqual(pack.uiSelection.sourceMessageIndices, { [caller.bank]: [caller.index] });
    assert.equal(bank.messages[0].styleIndex, caller.style);
    const override = { text: bank.messages[bank.labels[caller.label]].text };
    assert.equal(override.text, caller.text);
    assert.equal('messageStyle' in override, false);
    const style = pack.styles[bank.styleTable].styles[caller.style];
    assert.deepEqual(style.fontScale, [0.8999999761581421, 0.8999999761581421]);
    assert.equal(style.lineSpacing, 0);
    assert.equal(style.characterSpacing, 0);
    assert.deepEqual(style.unresolvedWords, { 0: 270, 4: 1, 8: 0, 12: 0, 16: 0, 20: 0, 40: 4 });
    assert.equal(pack.incomingTextBinding.styleApplied, false);
    assert.equal(pack.incomingTextBinding.retainedStyleTable, 'non-applied-reference');
    assert.equal(pack.incomingTextBinding.kind, 'title-plain-label-writer');
    assert.deepEqual(pack.layouts[caller.lower].fonts, ['cbf_std.bcfnt']);
    assert.deepEqual(pack.layouts[caller.upper].fonts, []);
    const lower = poseNativeLayout(pack.layouts[caller.lower], pack.animations,
      [{ name: caller.lower+'_SceneIn', frame: 0 }], { T_Aplt_00: override, T_Home_00: override });
    for (const name of ['T_Aplt_00', 'T_Home_00']) {
      assert.equal(pane(lower, name).text.value, caller.text);
      assert.equal(pane(lower, name).text.font, 0);
      assert.deepEqual(pane(lower, name).text.size, [22.5, 27]);
      const original = pane(pack.layouts[caller.lower], name).text;
      assert.deepEqual({ ...pane(lower, name).text, value: original.value }, original);
      assert.deepEqual(nativeTextMetrics(pane(lower, name).text, { width: 25, height: 30 }),
        { size: original.size, lineSpacing: original.lineSpacing, characterSpacing: original.characterSpacing });
    }
    const binding = pack.incomingFontBinding.url;
    assert.equal(binding, manifest.fonts.shared);
    assert.equal(hash(raw(binding)), 'd48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27');
    assert.equal(pack.incomingFontBinding.titleRuntimeResolutionEstablished, false);
  });

  test(caller.slug+' selected delivery and original title/content/member records are complete', {
    skip: existsSync(new URL(url, root)) ? false : 'incoming public export approval/publication pending',
  }, () => {
    assert.ok(manifest.titles[caller.title].packs.includes(url));
    assert.equal(manifest.titles[caller.title].fonts['contents/0000-'+caller.content+'/cbf_std.bcfnt'], manifest.fonts.shared);
    assert.equal(pack.titleId, caller.title);
    assert.equal(pack.titleVersion, caller.version);
    assert.equal(pack.contentIndex, 0);
    assert.equal(pack.contentId, caller.content);
    assert.deepEqual(pack.unsupported, []);
    assert.equal(hash(raw(url)), manifest.resources[url].sha256);
    for (const bucket of ['layouts', 'animations', 'textures', 'messages', 'styles']) {
      assert.deepEqual(Object.keys(pack.resourceSources[bucket]).sort(), Object.keys(pack[bucket]).sort());
      for (const source of Object.values(pack.resourceSources[bucket])) {
        assert.equal(source.titleId, caller.title);
        assert.equal(source.contentId, caller.content);
        assert.equal(source.titleVersion, caller.version);
        assert.equal(source.contentIndex, 0);
      }
    }
    for (const texture of Object.values(pack.textures)) {
      assert.equal(hash(raw(texture.url)), texture.sha256);
      assert.equal(texture.sha256, manifest.resources[texture.url].sha256);
    }
    const styles = pack.styles[pack.messages[caller.bank].styleTable];
    assert.deepEqual(styles.unsupported, [{ kind: 'styleFields', offsets: [0, 4, 8, 12, 16, 20, 40] }]);
  });
}
