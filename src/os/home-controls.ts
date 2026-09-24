import type { MenuState } from './state.ts';
import type { AppEvent } from './app-types.ts';
import { createHomeInputAdapter, sampleHomeInputAdapter, setHomeInputAdapterAxis, updateHomeInputAdapterButton,
  type HomeInputAdapter, type HomeInputDirection } from './home-input-adapter.ts';
import { createHomeInputProducer, pollHomeInput, type HomeInputProducer } from './home-input-producer.ts';
import { createHomePrimaryCursor, setHomePrimaryCursorRequest, updateHomePrimaryCursorFooter, type HomePrimaryCursor } from './home-primary-cursor.ts';
import { createHomeCursorPresentation, consumeHomeCursorObservation, advanceHomeCursorPresentation,
  updateHomeCursorEffectPositions, type HomeCursorPresentation } from './home-cursor-presentation.ts';
import { advanceHomeCursorLoop } from './home-cursor-loop.ts';
import { activeHomeRecord, sampleHomeGrid, writeHomeNavigation, type HomeNavigation } from './home-navigation.ts';
import { consumeHomeGridKeyEvent, selectHomeTouchSlot, type HomeScrollObservation, type HomeScrollState } from './home-scroll-consumer.ts';
import { advanceSystemHomeFolderCloseNative, consumeSystemHomeFolderCloseInput,
  isSystemHomeFolderClosing, sampleSystemHomeFolderClose } from './home-folder-close-system.ts';
import type { HomeNavigationPassObservation } from './home-navigation-pass.ts';
import type { HomeTilePose } from './home-tile-pose.ts';
import { createHomeTileTouch, queueHomeTileTouch, resetHomeTileTouch, sampleHomeTileTouch,
  advanceHomeTileTouch2D, homeTileTouchPoses, type HomeTileTouch } from './home-tile-touch.ts';
import { homeTouchLocation, beginHomePickupGesture } from './home-gestures.ts';
import { homeItemAt, type HomeLocation } from './home-layout.ts';
import { createHomeTilePickup, positionHomeTilePickup, advanceHomeTilePickup2D, type HomeTilePickup } from './home-tile-pickup.ts';
import { advanceHomeBalloonPresentation, createHomeBalloonPresentation, type HomeBalloonPresentation } from './home-balloon-presentation.ts';

export type HomeControls = Readonly<{
  balloon: HomeBalloonPresentation;
  input: HomeInputAdapter;
  producer: HomeInputProducer;
  primary: HomePrimaryCursor;
  presentation: HomeCursorPresentation;
  /** Applied tile-local poses; hit geometry and primary cursor are independent. */
  tilePoses: Readonly<Record<number, HomeTilePose>>;
  tileTouch: HomeTileTouch;
  /** Press candidate is independent of selection and widget controller resets. */
  tileCandidate: Readonly<HomeLocation> | null;
  tilePickup: HomeTilePickup | null;
}>;
export type HomeControlPass = Readonly<{
  updateCount: number;
  state: MenuState;
  observations: readonly HomeNavigationPassObservation[];
  /** Explicit unsupported mask/gesture routes are not reinterpreted as cardinals. */
  unsupportedInput: boolean;
  sounds: readonly ('touch' | 'open' | 'folder-open' | 'grab')[];
  /** Native ordinary open audit stops before remaining host phases. */
  handoff: 'application' | 'folder' | null;
  completed: boolean;
}>;
export function isHomeControlsActive(state: MenuState): boolean {
  const s = state.system;
  return !!s && state.powered && s.phase === 'home' && !s.sleeping && !s.dialog && !s.preferences && !state.panel;
}
function put(state: MenuState, controls: HomeControls): MenuState {
  return { ...state, system: { ...state.system!, homeControls: Object.freeze({ ...controls,
    tilePoses: homeTileTouchPoses(controls.tileTouch, controls.tilePoses) }) } };
}
function writeScroll(state: MenuState, scroll: HomeScrollState): MenuState {
  if (scroll.navigation !== state.system!.homeNavigation) state = writeHomeNavigation(state, scroll.navigation);
  return scroll.cursorLoop === state.system!.homeCursorLoop ? state
    : { ...state, system: { ...state.system!, homeCursorLoop: scroll.cursorLoop } };
}
function selectedCenter(navigation: HomeNavigation) {
  const grid = sampleHomeGrid(navigation), slot = grid.slots[activeHomeRecord(navigation).selectedSlot];
  return { x: slot.x - grid.scrollPixels, y: slot.y };
}
/** Browser initialization from restored mature HOME state, not a native boot trace. */
export function enableHomeControls(state: MenuState): MenuState {
  if (!state.system || state.system.homeControls) return state;
  return put(state, { input: createHomeInputAdapter(), producer: createHomeInputProducer(), balloon: createHomeBalloonPresentation(state),
    primary: createHomePrimaryCursor({ request: 0, shown: true, layoutVisible: true, center: selectedCenter(state.system.homeNavigation) }),
    presentation: createHomeCursorPresentation(sampleHomeGrid(state.system.homeNavigation).densityValue),
    tilePoses: Object.freeze({}), tileTouch: createHomeTileTouch(), tileCandidate: null, tilePickup: null });
}
/** Only settled grid strokes enter the audited widget route. Other gestures
 * keep their existing owner. Hit rectangles remain the browser layout policy. */
export function queueHomeControlTouch(state: MenuState, event: Extract<AppEvent, { type: 'touch' }>) {
  const controls = state.system?.homeControls;
  if (!controls || !isHomeControlsActive(state) || isSystemHomeFolderClosing(state)) return { state, handled: false };
  const nav = state.system!.homeNavigation;
  const location = !nav.motion ? homeTouchLocation(state, event.x, event.y) : null;
  const result = queueHomeTileTouch(controls.tileTouch, event, location?.slot ?? null);
  return { state: result.state === controls.tileTouch ? state : put(state, { ...controls, tileTouch: result.state,
    tileCandidate: event.phase === 'cancel' ? null : controls.tileCandidate,
    tilePickup: event.phase === 'cancel' ? null : controls.tilePickup }), handled: result.handled };
}
/** Explicit browser takeover: authored drag/scroll and lifecycle changes reset
 * the native ordinary widget; this is not an inferred native context guard. */
export function reconcileHomeControlGesture(state: MenuState): MenuState {
  const controls = state.system?.homeControls, gesture = state.system?.homeNavigation.gesture;
  if (!controls) return state;
  if (controls.tilePickup) {
    // The native stationary pickup owns this captured stroke. Context changes,
    // release/drop and other gesture lifecycles remain explicit browser exits.
    if (gesture?.mode === 'drag' && controls.tilePickup.source.folder === state.system!.homeNavigation.activeFolderSlot) return state;
    return put(state, { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null, tilePickup: null });
  }
  if (controls.tileTouch.strokeOwned && !gesture && !state.system!.input.touch) {
    return put(state, { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null });
  }
  if (!gesture || gesture.area !== 'grid' || gesture.mode === 'press') return state;
  if (!controls.tileCandidate && !controls.tileTouch.strokeOwned && !controls.tileTouch.pending.length && !Object.values(controls.tileTouch.widgets).some(w => w.capture || w.state !== 0)) return state;
  return put(state, { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null });
}
export function cancelHomeControlTouch(state: MenuState): MenuState {
  const controls = state.system?.homeControls;
  return controls ? put(state, { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null, tilePickup: null }) : state;
}
const directions = new Set(['right', 'left', 'up', 'down']);
/** Null means another existing System owner must route the event. No sampling here. */
export function queueHomeControlEvent(state: MenuState, event: AppEvent): MenuState | null {
  const controls = state.system?.homeControls;
  if (!controls || !isHomeControlsActive(state)) return null;
  let input = controls.input;
  if (event.type === 'analog') input = setHomeInputAdapterAxis(input, event.x, event.y);
  else if ((event.type === 'button' || event.type === 'command') && directions.has(event.command)) {
    const command = event.command as HomeInputDirection;
    if (event.type === 'button') input = updateHomeInputAdapterButton(input, { ...event, command });
    else {
      const source = `command:${command}`;
      input = updateHomeInputAdapterButton(input, { source, command, phase: 'down' });
      input = updateHomeInputAdapterButton(input, { source, command, phase: 'up' });
    }
  } else return null;
  return input === controls.input ? state : put(state, { ...controls, input });
}
/** Explicit browser cancellation delivers native horizontal event7 before reset. */
export function cancelHomeControls(state: MenuState): MenuState {
  const controls = state.system?.homeControls;
  if (!controls) return state;
  const close = sampleSystemHomeFolderClose(state), event = { type: 7 as const, mask: 0x30 };
  if (close && isSystemHomeFolderClosing(state)) state = consumeSystemHomeFolderCloseInput(state, close.controller.identity, event).state;
  else state = writeScroll(state, consumeHomeGridKeyEvent({ navigation: state.system!.homeNavigation, cursorLoop: state.system!.homeCursorLoop }, event).state);
  return put(state, { ...controls, input: createHomeInputAdapter(), producer: createHomeInputProducer(),
    tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null, tilePickup: null });
}
function observe(controls: HomeControls, observations: readonly HomeScrollObservation[]): HomeControls {
  let { primary, presentation, tileTouch } = controls;
  for (const observation of observations) {
    presentation = consumeHomeCursorObservation(presentation, observation);
    if (observation.kind === 'mode3-entry' || observation.kind === 'banner-resolve' && observation.reason === 'idle-entry') {
      primary = setHomePrimaryCursorRequest(primary, 0);
      tileTouch = resetHomeTileTouch(tileTouch);
    }
  }
  return { ...controls, primary, presentation, tileTouch };
}
/** Accepted touch selection shares the native cursor/mode3 consumer, including
 * a departed toolbar effect. Raw press/drag eligibility remains external. */
export function selectHomeControlTouch(state: MenuState, slot: number): MenuState | null {
  const controls = state.system?.homeControls;
  if (!controls || !isHomeControlsActive(state)) return null;
  const result = selectHomeTouchSlot({ navigation: state.system!.homeNavigation, cursorLoop: state.system!.homeCursorLoop }, slot);
  if (result.disposition === 'unsupported') return null;
  return put(writeScroll(state, result.state), observe({ ...controls, tileCandidate: null }, result.observations));
}
/** Adapter boundaries for app/overlay/context changes. Ordinary direction passes
 * never use this path; their retained state advances only in stepHomeControls. */
export function reconcileHomeControls(before: MenuState, state: MenuState): MenuState {
  if (!state.system?.homeControls || before === state) return state;
  if (isHomeControlsActive(before) !== isHomeControlsActive(state)) state = cancelHomeControls(state);
  let controls = state.system!.homeControls!;
  if (!isSystemHomeFolderClosing(before) && isSystemHomeFolderClosing(state)) {
    const primary = updateHomePrimaryCursorFooter(setHomePrimaryCursorRequest(controls.primary, 2),
      { overlayActive: false, secondaryOverlayActive: false, mode: 44,
        position: { kind: 'grid', selectedCenter: controls.primary.center } }).state;
    return put(state, { ...controls, primary, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null, tilePickup: null });
  }
  if (before.system?.homeNavigation.activeFolderSlot !== state.system!.homeNavigation.activeFolderSlot) {
    state = cancelHomeControls(state); controls = state.system!.homeControls!;
    const nav = state.system!.homeNavigation;
    // Context replacement is an explicit browser policy until full open/drag
    // layout lifecycles are hosted. Never map departed effects across containers.
    return put(state, { ...controls,
      primary: createHomePrimaryCursor({ request: 0, shown: true, layoutVisible: true, center: selectedCenter(nav) }),
      presentation: createHomeCursorPresentation(sampleHomeGrid(nav).densityValue), tileTouch: createHomeTileTouch() });
  }
  if (before.columns !== state.columns || !before.system?.homeNavigation.motion && state.system!.homeNavigation.motion) {
    state = put(state, { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null, tilePickup: null });
  }
  return reconcileHomeControlGesture(state);
}
/** One eligible shared count. The caller has installed its absolute count first.
 * Banner manager/3D phases and audio consume the returned ordered journal. */
export function stepHomeControls(state: MenuState): HomeControlPass {
  state = reconcileHomeControlGesture(state);
  let controls = state.system!.homeControls!;
  const observations: HomeNavigationPassObservation[] = [], sounds: ('touch' | 'open' | 'folder-open' | 'grab')[] = [];
  let unsupportedInput = false;
  const touch = sampleHomeTileTouch(controls.tileTouch, (x, y) => homeTouchLocation(state, x, y)?.slot ?? null);
  controls = { ...controls, tileTouch: touch.state };
  // The authored recognizer remains alive for a possible drag takeover, but an
  // ordinary native press does not inhibit native idle/lower/cursor work.
  const gesture = state.system!.homeNavigation.gesture;
  let ordinaryGesture = gesture?.area === 'grid' && gesture.mode === 'press' && Object.keys(controls.tileTouch.widgets).length > 0 ? gesture : null;
  if (ordinaryGesture) state = writeHomeNavigation(state, { ...state.system!.homeNavigation, gesture: null });
  for (const event of touch.events) {
    if (event.kind === 'cue') { sounds.push(event.cue); continue; }
    if (event.value === 0) {
      const location = Object.freeze({ folder: state.system!.homeNavigation.activeFolderSlot, slot: event.slot });
      // Browser metadata supplies eligible installed app records. Native folder,
      // cartridge and special-record eligibility require their separate audit.
      if (homeItemAt(state, location)?.kind === 'app') controls = { ...controls, tileCandidate: location };
      continue;
    }
    if (event.value === 1 || event.value === 2) controls = { ...controls, tileCandidate: null };
    if (event.value === 3) {
      const nav = state.system!.homeNavigation, candidate = controls.tileCandidate;
      if (candidate && ordinaryGesture && !nav.motion && !nav.focus.toolbarActive
        && candidate.folder === nav.activeFolderSlot && homeItemAt(state, candidate)?.kind === 'app') {
        const view = activeHomeRecord(nav), grid = sampleHomeGrid(nav), source = grid.slots[candidate.slot];
        const record = { ...view, selectedSlot: candidate.slot };
        // Callback3 copies selection directly; ordinary callback1 cursor effects
        // and banner idle-entry work do not run in the mode14 entry.
        state = writeHomeNavigation(state, { ...nav,
          selectionRevision: nav.selectionRevision + Number(view.selectedSlot !== candidate.slot),
          ...(nav.activeFolderSlot === null ? { rootView: record } : { folderViews: { ...nav.folderViews, [nav.activeFolderSlot]: record } }) });
        state = beginHomePickupGesture(state, ordinaryGesture); ordinaryGesture = null;
        controls = { ...controls, primary: setHomePrimaryCursorRequest(controls.primary, 2),
          // Retain the existing browser's zero anchor until its native initializer
          // is traced. Content is the portfolio icon supplied to native layouts.
          tilePickup: createHomeTilePickup(candidate, grid.densityValue,
            { x: source.x - grid.scrollPixels, y: source.y }, touch.point, { x: 0, y: 0 }) };
        sounds.push('grab');
      } else if (homeItemAt(state, { folder: nav.activeFolderSlot, slot: event.slot })?.kind === 'folder' || nav.focus.toolbarActive) {
        // Folder-icon/toolbar pickup has not been traced. Release this native
        // owner so the existing authored fallback keeps those routes usable.
        unsupportedInput = true;
        controls = { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch), tileCandidate: null };
      }
      continue;
    }
    if (event.value !== 1) continue;
    const nav = state.system!.homeNavigation, oldSlot = activeHomeRecord(nav).selectedSlot, oldToolbar = nav.focus.toolbarActive;
    const accepted = selectHomeTouchSlot({ navigation: nav, cursorLoop: state.system!.homeCursorLoop }, event.slot);
    if (accepted.disposition === 'unsupported') { unsupportedInput = true; continue; }
    state = writeScroll(state, accepted.state); controls = observe(controls, accepted.observations);
    observations.push(...accepted.observations.map(observation => ({ phase: 'input' as const, observation })));
    const item = homeItemAt(state, { folder: nav.activeFolderSlot, slot: event.slot });
    if (!oldToolbar && oldSlot === event.slot && item) {
      const handoff = item.kind === 'folder' ? 'folder' : 'application';
      sounds.push(handoff === 'folder' ? 'folder-open' : 'open');
      return Object.freeze({ updateCount: state.system!.homeClock.updateCount, state: put(state, controls),
        observations: Object.freeze(observations), sounds: Object.freeze(sounds), unsupportedInput, handoff, completed: false });
    }
  }
  if (touch.unsupportedLongPress) { unsupportedInput = true; controls = { ...controls, tileTouch: resetHomeTileTouch(controls.tileTouch) }; }
  const sampled = sampleHomeInputAdapter(controls.input);
  const produced = pollHomeInput(controls.producer, { ...sampled.sample.combined,
    touchActive: touch.touchActive || !!state.system!.input.touch, captureActive: touch.captureActive,
    hostFlags: 0, gateWord14: 0, readiness10dc20: true, readiness10cd20: true });
  controls = { ...controls, input: sampled.state, producer: produced.state };
  for (const event of produced.events) {
    const close = sampleSystemHomeFolderClose(state);
    if (close && isSystemHomeFolderClosing(state)) {
      if (event.type === 7 || close.controller.phase === 'viewport') {
        const consumed = consumeSystemHomeFolderCloseInput(state, close.controller.identity, event);
        state = consumed.state; controls = observe(controls, consumed.observations);
        observations.push(...consumed.observations.map(observation => ({ phase: 'input' as const, observation })));
      }
      continue;
    }
    const consumed = consumeHomeGridKeyEvent({ navigation: state.system!.homeNavigation, cursorLoop: state.system!.homeCursorLoop }, event);
    if (consumed.disposition === 'unsupported') { unsupportedInput = true; continue; }
    state = writeScroll(state, consumed.state);
    controls = observe(controls, consumed.observations);
    observations.push(...consumed.observations.map(observation => ({ phase: 'input' as const, observation })));
  }
  const lower = advanceSystemHomeFolderCloseNative(state, 1);
  state = lower.state; controls = observe(controls, lower.observations);
  observations.push(...lower.observations.map(observation => ({ phase: 'lower' as const, observation })));
  const nav = state.system!.homeNavigation, grid = sampleHomeGrid(nav), close = sampleSystemHomeFolderClose(state);
  const closing = close?.controller.phase === 'closing';
  const gestureHidden = nav.gesture?.area === 'grid' && nav.gesture.mode !== 'press';
  let primary = setHomePrimaryCursorRequest(controls.primary, closing || gestureHidden || controls.tilePickup ? 2 : 0);
  if (!nav.focus.toolbarActive && !controls.tilePickup) controls = observe(controls, [{ kind: 'scale-seek', frame: grid.densityValue, updateOffset: null }]);
  const footer = updateHomePrimaryCursorFooter(primary, { overlayActive: false, secondaryOverlayActive: false,
    mode: closing ? 44 : controls.tilePickup ? 14 : nav.motion?.mode ?? 0,
    position: nav.focus.toolbarActive ? { kind: 'toolbar', focus: nav.focus.currentFocus }
      : { kind: 'grid', selectedCenter: selectedCenter(nav) } });
  primary = footer.state;
  let presentation = controls.presentation;
  if (footer.positionRoute === 'mode3-effects') presentation = updateHomeCursorEffectPositions(presentation,
    { mode: 3, context: nav.activeFolderSlot, slots: grid.slots, scrollPixels: grid.scrollPixels }).state;
  presentation = advanceHomeCursorPresentation(presentation, 1,
    { primaryWrapperEligible: primary.layoutVisible, effectWrapperEligible: [true, true] });
  state = { ...state, system: { ...state.system!, homeCursorLoop: advanceHomeCursorLoop(state.system!.homeCursorLoop, 1, primary.layoutVisible) } };
  state = put(state, { ...controls, primary, presentation, balloon: advanceHomeBalloonPresentation(controls.balloon, state),
    tileTouch: advanceHomeTileTouch2D(controls.tileTouch, controls.tilePickup?.source.slot ?? null),
    tilePickup: controls.tilePickup ? advanceHomeTilePickup2D(positionHomeTilePickup(controls.tilePickup, touch.point)) : null });
  if (ordinaryGesture) state = writeHomeNavigation(state, { ...state.system!.homeNavigation, gesture: ordinaryGesture });
  return Object.freeze({ updateCount: state.system!.homeClock.updateCount, state,
    observations: Object.freeze(observations), sounds: Object.freeze(sounds), unsupportedInput, handoff: null, completed: true });
}
