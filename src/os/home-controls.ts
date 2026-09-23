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

export type HomeControls = Readonly<{
  input: HomeInputAdapter;
  producer: HomeInputProducer;
  primary: HomePrimaryCursor;
  presentation: HomeCursorPresentation;
}>;
export type HomeControlPass = Readonly<{
  updateCount: number;
  state: MenuState;
  observations: readonly HomeNavigationPassObservation[];
  /** Explicit unsupported mask/gesture routes are not reinterpreted as cardinals. */
  unsupportedInput: boolean;
}>;
export function isHomeControlsActive(state: MenuState): boolean {
  const s = state.system;
  return !!s && state.powered && s.phase === 'home' && !s.sleeping && !s.dialog && !s.preferences && !state.panel;
}
function put(state: MenuState, controls: HomeControls): MenuState {
  return { ...state, system: { ...state.system!, homeControls: Object.freeze(controls) } };
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
  return put(state, { input: createHomeInputAdapter(), producer: createHomeInputProducer(),
    primary: createHomePrimaryCursor({ request: 0, shown: true, layoutVisible: true, center: selectedCenter(state.system.homeNavigation) }),
    presentation: createHomeCursorPresentation(sampleHomeGrid(state.system.homeNavigation).densityValue) });
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
  return put(state, { ...controls, input: createHomeInputAdapter(), producer: createHomeInputProducer() });
}
function observe(controls: HomeControls, observations: readonly HomeScrollObservation[]): HomeControls {
  let { primary, presentation } = controls;
  for (const observation of observations) {
    presentation = consumeHomeCursorObservation(presentation, observation);
    if (observation.kind === 'mode3-entry' || observation.kind === 'banner-resolve' && observation.reason === 'idle-entry') {
      primary = setHomePrimaryCursorRequest(primary, 0);
    }
  }
  return { ...controls, primary, presentation };
}
/** Accepted touch selection shares the native cursor/mode3 consumer, including
 * a departed toolbar effect. Raw press/drag eligibility remains external. */
export function selectHomeControlTouch(state: MenuState, slot: number): MenuState | null {
  const controls = state.system?.homeControls;
  if (!controls || !isHomeControlsActive(state)) return null;
  const result = selectHomeTouchSlot({ navigation: state.system!.homeNavigation, cursorLoop: state.system!.homeCursorLoop }, slot);
  if (result.disposition === 'unsupported') return null;
  return put(writeScroll(state, result.state), observe(controls, result.observations));
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
    return put(state, { ...controls, primary });
  }
  if (before.system?.homeNavigation.activeFolderSlot !== state.system!.homeNavigation.activeFolderSlot) {
    state = cancelHomeControls(state); controls = state.system!.homeControls!;
    const nav = state.system!.homeNavigation;
    // Context replacement is an explicit browser policy until full open/drag
    // layout lifecycles are hosted. Never map departed effects across containers.
    return put(state, { ...controls,
      primary: createHomePrimaryCursor({ request: 0, shown: true, layoutVisible: true, center: selectedCenter(nav) }),
      presentation: createHomeCursorPresentation(sampleHomeGrid(nav).densityValue) });
  }
  return state;
}
/** One eligible shared count. The caller has installed its absolute count first.
 * Banner manager/3D phases and audio consume the returned ordered journal. */
export function stepHomeControls(state: MenuState): HomeControlPass {
  let controls = state.system!.homeControls!;
  const sampled = sampleHomeInputAdapter(controls.input);
  const produced = pollHomeInput(controls.producer, { ...sampled.sample.combined,
    touchActive: !!state.system!.input.touch, captureActive: false,
    hostFlags: 0, gateWord14: 0, readiness10dc20: true, readiness10cd20: true });
  controls = { ...controls, input: sampled.state, producer: produced.state };
  const observations: HomeNavigationPassObservation[] = [];
  let unsupportedInput = false;
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
  const gesture = nav.gesture?.area === 'grid';
  let primary = setHomePrimaryCursorRequest(controls.primary, closing || gesture ? 2 : 0);
  if (!nav.focus.toolbarActive) controls = observe(controls, [{ kind: 'scale-seek', frame: grid.densityValue, updateOffset: null }]);
  const footer = updateHomePrimaryCursorFooter(primary, { overlayActive: false, secondaryOverlayActive: false,
    mode: closing ? 44 : nav.motion?.mode ?? 0,
    position: nav.focus.toolbarActive ? { kind: 'toolbar', focus: nav.focus.currentFocus }
      : { kind: 'grid', selectedCenter: selectedCenter(nav) } });
  primary = footer.state;
  let presentation = controls.presentation;
  if (footer.positionRoute === 'mode3-effects') presentation = updateHomeCursorEffectPositions(presentation,
    { mode: 3, context: nav.activeFolderSlot, slots: grid.slots, scrollPixels: grid.scrollPixels }).state;
  presentation = advanceHomeCursorPresentation(presentation, 1,
    { primaryWrapperEligible: primary.layoutVisible, effectWrapperEligible: [true, true] });
  state = { ...state, system: { ...state.system!, homeCursorLoop: advanceHomeCursorLoop(state.system!.homeCursorLoop, 1, primary.layoutVisible) } };
  state = put(state, { ...controls, primary, presentation });
  return Object.freeze({ updateCount: state.system!.homeClock.updateCount, state,
    observations: Object.freeze(observations), unsupportedInput });
}
