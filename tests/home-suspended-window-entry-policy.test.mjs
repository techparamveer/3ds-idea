import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homeSuspendedWindowEntryFrame, drawHomeSuspendedWindow } from '../src/os/home-suspended-window.ts';
import { createPortfolioState, launchHomeShortcut, reduceSystem, tickSystem } from '../src/os/system.ts';
import { selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { acknowledgeHomeEntryMotionCandidate, sampleHomeEntryMotionCandidate } from '../src/os/home-entry-motion.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const suspended = () => reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(), 3001), 'health-safety', 3010), 6500), 'home', 6600);
const captureFor = (state, generation = 1) => ({ status: 'ready', owner: state.system.runtime.application, generation,
  upper: { width: 240, height: 400, data: new Uint8ClampedArray(0) }, lower: { width: 240, height: 320, data: new Uint8ClampedArray(0) } });
const identityFor = capture => ({ kind: 'pause', owner: capture.owner, captureGeneration: capture.generation });
const poseFor = (capture, frame) => ({ identity: identityFor(capture), observedUpdate: 100, elapsedUpdates: frame });
const root = new URL('../public/os/firmware/10.7.0-32E/packs/home/', import.meta.url);
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json']]
  .map(([key, path]) => [key, JSON.parse(readFileSync(new URL(path, root)))]));
const pane = (layout, name) => nativePaneParentPath(layout, name).at(-1);

test('exact retained owner uses the same appearance branch for expanded and compact selection', () => {
  const expanded = suspended(), capture = captureFor(expanded), before = structuredClone(expanded);
  const compact = settleHomeNavigation(selectHomeSlot(expanded, expanded.selected + 1));
  for (const frame of [0, 1, 5, 10, 20]) {
    const motion = poseFor(capture, frame);
    assert.equal(homeSuspendedWindowEntryFrame(expanded, capture, motion), Math.min(10, frame));
    assert.equal(homeSuspendedWindowEntryFrame(compact, capture, motion), Math.min(10, frame));
  }
  assert.deepEqual(expanded, before);
  assert.equal(compact.system.runtime.application, expanded.system.runtime.application);
});

test('both source poses fade the window only, preserving their distinct ScaleUpDown endpoints and other producers', () => {
  const state = suspended(), capture = captureFor(state), before = JSON.stringify(packs);
  for (const [mode, selected] of [['expanded', state], ['compact', settleHomeNavigation(selectHomeSlot(state, state.selected + 1))]]) {
    const alpha = [];
    for (let frame = 0; frame <= 10; frame++) {
      const entryFrame = homeSuspendedWindowEntryFrame(selected, capture, poseFor(capture, frame));
      let options;
      drawHomeSuspendedWindow({ packs, measureSingleLineText: () => 222, draw(_ctx, _pack, _layout, value) { options = value; return true; } }, {},
        { description: 'Health and Safety Information', icon: { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) } }, mode, 0, undefined, entryFrame);
      const layout = poseNativeLayout(packs.launcher.layouts.LncBase_U_00, packs.launcher.animations, options.bindings, options.overrides);
      alpha.push(pane(layout, 'N_Wndw_00').alpha);
      assert.deepEqual(pane(layout, 'N_WndwScale_00').translation, mode === 'expanded' ? [0, 2, 3] : [-176, 78, 0]);
      assert.deepEqual(pane(layout, 'W_Wndw_00').size, mode === 'expanded' ? [296, 132] : [48, 48]);
      assert.equal(pane(layout, 'N_Hud_00').alpha, 255);
      assert.equal(pane(layout, 'N_Btm_00').alpha, 255);
      assert.equal(pane(layout, 'T_AppTitle_00').flags & 1, mode === 'expanded' ? 1 : 0);
      assert.equal(options.bindings.find(binding => binding.name.endsWith('_WhiteBlack')).frame, 1);
    }
    assert.deepEqual(alpha, [0, 7, 27, 55, 90, 128, 165, 200, 228, 248, 255]);
  }
  assert.equal(JSON.stringify(packs), before);
});

test('compact appearance spends only existing paired receipts, including retry/stall and reduced endpoint', () => {
  const state = suspended(), compact = settleHomeNavigation(selectHomeSlot(state, state.selected + 1)), capture = captureFor(state), identity = identityFor(capture);
  let presented = null, pending = sampleHomeEntryMotionCandidate(presented, null, identity, 100, true);
  for (const update of [103, 500]) {
    pending = sampleHomeEntryMotionCandidate(presented, pending, identity, update, true);
    assert.equal(homeSuspendedWindowEntryFrame(compact, capture, pending), 0);
  }
  assert.equal(acknowledgeHomeEntryMotionCandidate(pending, identity, 500, false), null);
  presented = acknowledgeHomeEntryMotionCandidate(pending, identity, 500, true);
  pending = sampleHomeEntryMotionCandidate(presented, null, identity, 503, true);
  assert.equal(homeSuspendedWindowEntryFrame(compact, capture, pending), 1);
  presented = acknowledgeHomeEntryMotionCandidate(pending, identity, 503, true);
  pending = sampleHomeEntryMotionCandidate(presented, null, identity, 4000, true);
  assert.equal(homeSuspendedWindowEntryFrame(compact, capture, pending), 1);
  pending = sampleHomeEntryMotionCandidate(presented, null, identity, 4001, true, true);
  assert.equal(homeSuspendedWindowEntryFrame(compact, capture, pending), 1);
  pending = sampleHomeEntryMotionCandidate(presented, null, identity, 4002, true, false, true);
  assert.equal(homeSuspendedWindowEntryFrame(compact, capture, pending), 10);
  const replacement = captureFor(state, 2);
  assert.equal(homeSuspendedWindowEntryFrame(compact, replacement, pending), undefined);
  pending = sampleHomeEntryMotionCandidate(presented, null, identityFor(replacement), 4003, true);
  assert.equal(homeSuspendedWindowEntryFrame(compact, replacement, pending), 0);
});

test('foreign, unavailable and ineligible owners cannot select appearance; malformed matched poses fail explicitly', () => {
  const state = suspended(), capture = captureFor(state), motion = poseFor(capture, 5);
  assert.equal(homeSuspendedWindowEntryFrame(state, capture, motion), 5);
  for (const change of [s => s.powered = false, s => s.system.sleeping = true, s => s.system.preferences = true,
    s => s.panel = 'settings', s => s.system.phase = 'app', s => s.system.runtime.active = s.system.runtime.application,
    s => s.system.runtime.homeReturn = null, s => s.system.runtime.instances[s.system.runtime.application].closing = true,
    s => s.system.homeNavigation.focus.toolbarActive = true, s => s.system.dialog = 'close']) {
    const altered = structuredClone(state); change(altered);
    assert.equal(homeSuspendedWindowEntryFrame(altered, capture, motion), undefined);
  }
  for (const source of [{ status: 'none' }, { status: 'missing', owner: capture.owner }, { ...capture, owner: 'foreign' }, { ...capture, generation: 2 }]) {
    assert.equal(homeSuspendedWindowEntryFrame(state, source, motion), undefined);
  }
  assert.equal(homeSuspendedWindowEntryFrame(state, capture, null), undefined);
  assert.equal(homeSuspendedWindowEntryFrame(state, capture, { ...motion, identity: { ...motion.identity, owner: 'foreign' } }), undefined);
  assert.equal(homeSuspendedWindowEntryFrame(state, capture, { ...motion, identity: { kind: 'folder', folder: 'folder' } }), undefined);
  for (const elapsedUpdates of [-1, .5, NaN, Infinity]) assert.throws(() => homeSuspendedWindowEntryFrame(state, capture, { ...motion, elapsedUpdates }), RangeError);
  for (const generation of [-1, .5, Infinity]) {
    const invalidCapture = { ...capture, generation };
    assert.throws(() => homeSuspendedWindowEntryFrame(state, invalidCapture, poseFor(invalidCapture, 1)), RangeError);
  }
  const closing = reduceSystem(reduceSystem(state, 'back', 6700), 'open', 6800);
  assert.equal(homeSuspendedWindowEntryFrame(closing, capture, motion), undefined);
});

const codePath = process.env.THREE_DS_HOME_PAUSE_CODE ?? '/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/home-pause-source/exefs/code.bin';
const branchTarget = (code, address) => address + 8 + ((code.readUInt32LE(address - 0x100000) << 8) >> 6);
// This bounded branch fixture proves reset convergence, not original ARM execution.
// The later start still checks +0x30d; no native activation epoch is established.
function appearanceResetPath(code, compact) {
  const addresses = [], word = address => code.readUInt32LE(address - 0x100000);
  let address = 0x1ed2d4;
  for (let steps = 0; steps < 70 && address !== 0x1ed364; steps++) {
    addresses.push(address);
    const instruction = word(address), condition = instruction >>> 28;
    if ((instruction >>> 24 & 15) === 10 && (condition === 14 || condition === 0 && !compact)) address = branchTarget(code, address);
    else address += 4;
  }
  return addresses.includes(0x1ed300) && addresses.includes(0x1ed31c);
}

test('pinned mode1 branches converge on G_Wndw reset independently of the compact scale flag (static fixture, not ARM execution)',
  { skip: !existsSync(codePath) && 'Private decrypted HOME code unavailable; set THREE_DS_HOME_PAUSE_CODE' }, () => {
    const code = readFileSync(codePath), word = address => code.readUInt32LE(address - 0x100000);
    assert.equal(createHash('sha256').update(code).digest('hex'), '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
    assert.equal(word(0x1ed2d4), 0xe5d40340, 'scale selection flag');
    assert.equal(word(0x1ed2dc), 0xe3500001);
    assert.equal(word(0x1ed2e8), 0x0a000025, 'expanded endpoint initialization branch');
    assert.equal(word(0x1ed38c), 0xe5c4730d, 'expanded initialization also changes the visibility latch');
    assert.equal(branchTarget(code, 0x1ed398), 0x1ed2ec, 'expanded initialization rejoins compact before Appear reset');
    assert.equal(word(0x1ed300), 0xe5940290, 'G_Wndw Appear controller');
    assert.equal(word(0x1ed30c), 0xe3a01000, 'forward');
    assert.equal(word(0x1ed318), 0xe3a01000, 'source start');
    assert.equal(branchTarget(code, 0x1ed31c), 0x229330);
    assert.equal(word(0x1ed4e0), 0xe3a01001, 'entry requests visible window regardless of scale flag');
    assert.equal(branchTarget(code, 0x1ed4e8), 0x1eda38);
    assert.equal(code.readInt8(0x309782 - 0x100000), 1);
    assert.equal(word(0x1eda4c), 0xe5d1100d, 'start decision reads the separate +0x30d visibility latch');
    assert.equal(branchTarget(code, 0x1eda5c), 0x1eda94);
    assert.equal(branchTarget(code, 0x1eda64), 0x1edac8, 'already-visible request does not unconditionally start');
    assert.equal(appearanceResetPath(code, true), true);
    assert.equal(appearanceResetPath(code, false), true);
    const conditionalSkip = Buffer.from(code);
    conditionalSkip.writeUInt32LE(0x0a00001d, 0x1ed2e8 - 0x100000); // BEQ 0x1ed364 instead of endpoint initialization.
    assert.equal(appearanceResetPath(conditionalSkip, false), false);
    assert.equal(appearanceResetPath(conditionalSkip, true), true);
    const unconditionalSkip = Buffer.from(code);
    unconditionalSkip.writeUInt32LE(0xea00001d, 0x1ed2e8 - 0x100000);
    assert.equal(appearanceResetPath(unconditionalSkip, true), false);
  });
