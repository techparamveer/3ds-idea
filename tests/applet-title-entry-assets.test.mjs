import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { appletTitleEntrySelection, validateAppletTitleEntryAssets, drawAppletTitleEntry } from '../src/os/applet-title-entry-assets.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const root = process.env.APPLET_TITLE_ENTRY_PACK_ROOT
  ? pathToFileURL(resolve(process.env.APPLET_TITLE_ENTRY_PACK_ROOT) + '/')
  : new URL('../public/os/firmware/10.7.0-32E/packs/', import.meta.url);
const packs = Object.fromEntries(['friends', 'notifications'].map(appId => [appId, JSON.parse(readFileSync(new URL(appId + '/incoming.json', root)))]));
const pane = (layout, name) => nativePaneParentPath(layout, name)?.at(-1);
const lowerClip = (pack, appId) => pack.animations[appletTitleEntrySelection(appId).lower + '_SceneIn'];

test('incoming selection is title-specific, with no universal cover or borrowed HOME selector', () => {
  assert.deepEqual(appletTitleEntrySelection('friends'), { appId: 'friends', alias: 'friends-incoming', upper: 'FrdCmnFade_U_00', lower: 'FrdCmnFade_D_00', bank: 'friend_msbt_LZ', label: 'fri_title_fri', styleIndex: 39 });
  assert.deepEqual(appletTitleEntrySelection('notifications'), { appId: 'notifications', alias: 'notifications-incoming', upper: 'CmnFade_U_00', lower: 'CmnFade_D_00', bank: 'newslist_msbt_LZ', label: 'new_title_new', styleIndex: 13 });
  for (const appId of ['game-notes', 'browser', 'miiverse', 'manual', 'home', 'camera', 'toString', '']) assert.equal(appletTitleEntrySelection(appId), null);
});

for (const appId of ['friends', 'notifications']) {
  const source = packs[appId], selection = appletTitleEntrySelection(appId);
  test(appId + ' helper draws every original title SceneIn over the complete pair with plain native text only', () => {
    const before = JSON.stringify(source), draws = [];
    const renderer = { packs: { [selection.alias]: source }, draw(ctx, alias, name, options) {
      draws.push({ ctx, alias, name, options, posed: poseNativeLayout(source.layouts[name], source.animations, options.bindings, options.overrides) }); return true;
    } };
    validateAppletTitleEntryAssets(source, appId);
    for (let frame = 0; frame <= 20; frame++) {
      assert.equal(drawAppletTitleEntry(renderer, 'upper', 'lower', { appId, frame }), true);
      const [upper, lower] = draws.slice(-2);
      assert.deepEqual([upper.ctx, upper.alias, upper.name, upper.options], ['upper', selection.alias, selection.upper, { bindings: [{ name: selection.upper + '_SceneIn', frame }] }]);
      assert.deepEqual([lower.ctx, lower.alias, lower.name, lower.options], ['lower', selection.alias, selection.lower, {
        bindings: [{ name: selection.lower + '_SceneIn', frame }], overrides: { T_Aplt_00: { text: appId === 'friends' ? 'Friend List' : 'Notifications' }, T_Home_00: { text: appId === 'friends' ? 'Friend List' : 'Notifications' } },
      }]);
      assert.equal(pane(upper.posed, 'P_Bg_U_00').alpha, pane(lower.posed, 'P_Bg_D_00').alpha, 'shared browser pose, not proved native LCD phase-lock');
      for (const name of ['T_Aplt_00', 'T_Home_00']) {
        const original = pane(source.layouts[selection.lower], name).text, posed = pane(lower.posed, name).text;
        const { value: oldValue, ...originalMetrics } = original, { value, ...posedMetrics } = posed;
        assert.deepEqual(posedMetrics, originalMetrics, 'plain writer retains original layout text metrics and color');
        assert.equal(posed.messageStyle, undefined, 'unreached named-style branch cannot change metrics');
      }
      if (frame === 0 || frame === 20) {
        assert.equal(pane(lower.posed, 'P_Belt_00').alpha, frame === 0 ? 255 : 0);
        assert.equal(pane(lower.posed, 'P_Belt_00').translation[0], frame === 0 ? 0 : -80);
      }
    }
    assert.equal(JSON.stringify(source), before, 'helper never modifies the source pack or quarantined style record');
  });

  test(appId + ' paired draw failures, missing packs and invalid poses never substitute pixels', () => {
    for (const refused of [selection.upper, selection.lower]) {
      const renderer = { packs: { [selection.alias]: source }, draw(_ctx, _alias, name) { return name !== refused; } };
      assert.equal(drawAppletTitleEntry(renderer, {}, {}, { appId, frame: 20 }), false);
    }
    assert.throws(() => drawAppletTitleEntry({ packs: {}, draw() { throw Error('Unexpected fallback'); } }, {}, {}, { appId, frame: 0 }), /pack unavailable/);
    for (const frame of [-1, .5, 21, NaN, Infinity]) assert.throws(() => drawAppletTitleEntry({ packs: { [selection.alias]: source } }, {}, {}, { appId, frame }), /source frame/);
    assert.throws(() => drawAppletTitleEntry({ packs: {} }, {}, {}, { appId: 'game-notes', frame: 0 }), /Unsupported title incoming caller/);
  });

  test(appId + ' selected source clip and parent/material/texture failures are explicit', () => {
    for (const mutate of [
      pack => delete pack.layouts[selection.upper],
      pack => delete pack.animations[selection.lower + '_SceneIn'],
      pack => lowerClip(pack, appId).frames = 20,
      pack => lowerClip(pack, appId).loop = true,
      pack => lowerClip(pack, appId).childBinding = false,
      pack => lowerClip(pack, appId).sourceFrameRange.push(41),
      pack => lowerClip(pack, appId).tracks.find(track => track.target === 'P_Belt_00' && track.property === 'translation.x').keys[1].value = -79,
      pack => lowerClip(pack, appId).tracks.find(track => track.target === 'P_Bg_D_00' && track.property === 'alpha').keys[0].slope = -12,
      pack => lowerClip(pack, appId).tracks.find(track => track.target === 'P_Aplt_00' && track.property === 'visible').keys[0].value = 0,
      pack => lowerClip(pack, appId).tracks.find(track => track.binding === 'material').keys[0].value += 1,
      pack => lowerClip(pack, appId).tracks[0].contentIndex = 4,
      pack => lowerClip(pack, appId).tracks[0].component = 1,
      pack => lowerClip(pack, appId).tracks.push({ ...lowerClip(pack, appId).tracks[0], property: 'scale.x' }),
      pack => lowerClip(pack, appId).contents[0].binding = 'material',
      pack => lowerClip(pack, appId).groups[0] = 'WrongGroup',
      pack => lowerClip(pack, appId).textures.push('WrongTexture'),
      pack => lowerClip(pack, appId).shares = [{ source: 'WrongSource' }],
      pack => pack.layouts[selection.lower].roots[0].flags &= ~1,
      pack => pack.layouts[selection.lower].groups[0].children[0].panes.pop(),
      pack => pane(pack.layouts[selection.lower], 'P_Belt_00').size[0] -= 1,
      pack => pane(pack.layouts[selection.lower], 'P_Belt_00').translation[1] = -3,
      pack => pane(pack.layouts[selection.lower], 'P_Aplt_00').picture.uvSets[0][2] = 1,
      pack => pane(pack.layouts[selection.lower], 'P_Aplt_00').scale[0] = 2,
      pack => pane(pack.layouts[selection.lower], 'P_Aplt_00').kind = 'pan1',
      pack => pane(pack.layouts[selection.lower], 'P_Aplt_00').unsupported = [{ kind: 'unsupported-pane' }],
      pack => pane(pack.layouts[selection.lower], 'T_Aplt_00').text.size[0] = 21,
      pack => pane(pack.layouts[selection.lower], 'T_Aplt_00').text.font = 1,
      pack => pane(pack.layouts[selection.lower], 'T_Aplt_00').text.characterSpacing = 1,
      pack => pane(pack.layouts[selection.lower], 'T_Aplt_00').text.messageStyle = { fontScale: [1, 1], lineSpacing: 0, characterSpacing: 0 },
      pack => pane(pack.layouts[selection.lower], 'P_Home_00').children = [],
      pack => pane(pack.layouts[selection.upper], 'P_Bg_U_00').picture.colors[2][0] = 1,
      pack => pack.layouts[selection.lower].materials[pane(pack.layouts[selection.lower], 'P_Aplt_00').picture.material].bufferColor[0] += 1,
      pack => pack.layouts[selection.lower].materials[pane(pack.layouts[selection.lower], 'P_Aplt_00').picture.material].textureMatrices[0].translation[0] = .25,
      pack => pack.layouts[selection.lower].materials[pane(pack.layouts[selection.lower], 'T_Aplt_00').text.material].constantColors[0][3] = 0,
      pack => pack.layouts[selection.lower].materials[0].unsupported.push({ kind: 'unsupported-material' }),
      pack => pack.layouts[selection.lower].fonts[0] = 'invented-font',
      pack => pack.unsupported.push({ kind: 'unsupported-pack' }),
      pack => delete pack.textures[pack.layouts[selection.lower].textures[0]],
    ]) {
      const pack = structuredClone(source); mutate(pack);
      assert.throws(() => validateAppletTitleEntryAssets(pack, appId), /Unsupported|Missing/);
    }
  });

  test(appId + ' exact plain-writer proof and non-applied style records reject mutations without a style waiver', () => {
    const styleTable = pack => pack.styles[pack.messages[selection.bank].styleTable];
    const style = pack => styleTable(pack).styles[selection.styleIndex];
    for (const mutate of [
      pack => delete pack.incomingTextBinding,
      pack => pack.incomingTextBinding.styleApplied = true,
      pack => pack.incomingTextBinding.proof.ranges.plainWriter[2] = '0'.repeat(64),
      pack => pack.incomingTextBinding.proof.branches[0][1] += 4,
      pack => pack.incomingTextBinding.proof.unreachedStyleWriter += 4,
      pack => pack.incomingTextBinding.proof.extra = true,
      pack => pack.incomingFontBinding.titleRuntimeResolutionEstablished = true,
      pack => pack.incomingFontBinding.layoutName = 'font-from-other-title',
      pack => delete pack.messages[selection.bank].labels[selection.label],
      pack => pack.messages[selection.bank].messages[0].styleIndex += 1,
      pack => pack.messages[selection.bank].messages[0].text = 'Invented label',
      pack => pack.messages[selection.bank].messages[0].tokens.push({ type: 'unsupported-control' }),
      pack => pack.messages[selection.bank].unsupported.push({ kind: 'unsupported-message' }),
      pack => styleTable(pack).recordSize = 40,
      pack => styleTable(pack).unsupported = [],
      pack => styleTable(pack).unsupported.push({ kind: 'another-unsupported-field' }),
      pack => styleTable(pack).unsupported[0].offsets.pop(),
      pack => style(pack).fontScale[0] = 1,
      pack => style(pack).lineSpacing = 1,
      pack => style(pack).characterSpacing = 1,
      pack => style(pack).unresolvedWords['0'] = 269,
      pack => delete style(pack).unresolvedWords['40'],
      pack => style(pack).unresolvedWords['44'] = 0,
    ]) {
      const pack = structuredClone(source); mutate(pack);
      assert.throws(() => validateAppletTitleEntryAssets(pack, appId), /Unsupported/);
    }
    assert.deepEqual(styleTable(source).unsupported, [{ kind: 'styleFields', offsets: [0, 4, 8, 12, 16, 20, 40] }]);
    assert.equal(source.incomingTextBinding.styleApplied, false);
  });
}
