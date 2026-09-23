import type { HomeTilePose } from './home-tile-pose.ts';

export type HomeTileController = Readonly<{
  currentFrame: 0 | 1;
  /** Null is unsent; the source fixture's -999 sentinel is not a native pose. */
  appliedFrame: 0 | 1 | null;
  status: 0 | 1 | 2;
  direction: 'forward' | 'reverse';
  bindingEnabled: boolean;
}>;
export type HomeTileWidget = Readonly<{
  state: 0 | 1 | 2 | 3;
  enabled: boolean;
  capture: boolean;
  heldCount: number;
  select: HomeTileController;
  decide: HomeTileController;
  pose: HomeTilePose | null;
}>;
export type HomeTileWidgetInput = Readonly<{
  current: boolean;
  previous: boolean;
  inside: boolean;
  globalCapture: boolean;
}>;
export type HomeTileWidgetEvent = Readonly<{ kind: 'cue'; cue: 'touch' }>
  | Readonly<{ kind: 'callback'; value: 0 | 1 | 2 }>;
export type HomeTileWidgetInputResult = Readonly<{
  state: HomeTileWidget;
  events: readonly HomeTileWidgetEvent[];
  /** Stop this slice and hand off/reset before its unhosted long-press branch. */
  unsupportedLongPress: boolean;
}>;

// Static word0x33c634 in the SHA-pinned EUR executable used by the audit.
const heldThreshold = 20;
const emptyController = (): HomeTileController => Object.freeze({
  currentFrame: 0, appliedFrame: null, status: 0, direction: 'forward', bindingEnabled: false,
});
const finish = (state: HomeTileWidget, events: HomeTileWidgetEvent[] = [], unsupportedLongPress = false): HomeTileWidgetInputResult =>
  Object.freeze({ state, events: Object.freeze(events), unsupportedLongPress });
const callback = (value: 0 | 1 | 2): HomeTileWidgetEvent => Object.freeze({ kind: 'callback', value });
const touchCue: HomeTileWidgetEvent = Object.freeze({ kind: 'cue', cue: 'touch' });

function boolean(value: boolean, name: string): void {
  if (typeof value !== 'boolean') throw new TypeError(`Invalid HOME tile ${name}`);
}
function validate(widget: HomeTileWidget): void {
  if (![0, 1, 2, 3].includes(widget.state)) throw new RangeError('Invalid HOME tile state');
  boolean(widget.enabled, 'enabled'); boolean(widget.capture, 'capture');
  if (!Number.isInteger(widget.heldCount) || widget.heldCount < 0 || widget.heldCount > 0xffffffff) throw new RangeError('Invalid HOME tile held count');
  for (const controller of [widget.select, widget.decide]) {
    if (![0, 1].includes(controller.currentFrame) || ![null, 0, 1].includes(controller.appliedFrame)
      || ![0, 1, 2].includes(controller.status) || !['forward', 'reverse'].includes(controller.direction)) {
      throw new RangeError('Invalid HOME tile controller');
    }
    boolean(controller.bindingEnabled, 'binding enable');
  }
  if (widget.pose !== null && (!['select', 'decide'].includes(widget.pose.clip) || ![0, 1].includes(widget.pose.frame))) {
    throw new RangeError('Invalid HOME tile pose');
  }
}
function start(controller: HomeTileController, direction: HomeTileController['direction']): HomeTileController {
  return Object.freeze({ ...controller, currentFrame: direction === 'forward' ? 0 : 1,
    direction, status: 1, bindingEnabled: true });
}
function stop(controller: HomeTileController): HomeTileController {
  return controller.status === 0 ? controller : Object.freeze({ ...controller, status: 2, bindingEnabled: false });
}

/** Ordinary registered widget initialization, with no applied tile animation. */
export function createHomeTileWidget(): HomeTileWidget {
  return Object.freeze({ state: 0, enabled: true, capture: false, heldCount: 0,
    select: emptyController(), decide: emptyController(), pose: null });
}

/** Native0x2501f8 clears capture even when enabled already has this value.
 * Pending state, held count and independently updated controllers survive. */
export function setHomeTileWidgetEnabled(widget: HomeTileWidget, enabled: boolean): HomeTileWidget {
  validate(widget); boolean(enabled, 'enabled');
  return widget.enabled === enabled && !widget.capture ? widget : Object.freeze({ ...widget, enabled, capture: false });
}

/** Native0x250194 ordinary reset: stop, immediately apply Select0, disable its
 * binding, and enter idle. Capture/enable/held count remain until their owner runs.
 * No callback is emitted; candidate cleanup is a separate HOME responsibility. */
export function resetHomeTileWidget(widget: HomeTileWidget): HomeTileWidget {
  validate(widget);
  const select: HomeTileController = Object.freeze({ ...stop(widget.select), currentFrame: 0,
    appliedFrame: 0, direction: 'forward', bindingEnabled: false });
  return Object.freeze({ ...widget, state: 0, select, decide: stop(widget.decide),
    pose: Object.freeze({ clip: 'select', frame: 0 }) });
}

/** One traversed input phase. Host supplies sampled touch/hit and initial capture
 * scan; skip this call entirely when the producer skips widget traversal.
 * State2 acceptance belongs here, before lower tasks and the later2D phase. */
export function updateHomeTileWidgetInput(widget: HomeTileWidget, input: HomeTileWidgetInput): HomeTileWidgetInputResult {
  validate(widget);
  for (const key of ['current', 'previous', 'inside', 'globalCapture'] as const) boolean(input[key], key);
  if (!widget.enabled || !widget.capture && input.globalCapture) return finish(widget);
  if (widget.state === 0) {
    const idle = widget.capture || widget.heldCount !== 0
      ? Object.freeze({ ...widget, capture: false, heldCount: 0 }) : widget;
    if (!input.current || input.previous || !input.inside) return finish(idle);
    return finish(Object.freeze({ ...idle, state: 1, capture: true, select: start(widget.select, 'forward') }), [touchCue, callback(0)]);
  }
  if (widget.state === 1) {
    if (!input.inside) {
      return finish(Object.freeze({ ...widget, state: 3, heldCount: 0, select: start(widget.select, 'reverse') }), [callback(2)]);
    }
    if (input.previous && !input.current) {
      return finish(Object.freeze({ ...widget, state: 2, heldCount: 0, decide: start(widget.decide, 'forward') }));
    }
    const heldCount = (widget.heldCount + 1) >>> 0;
    // 0x253208 compares signed after the uint32 increment. At equality the
    // unhosted long-press path first reverses Select; do not invent callbacks3/4.
    return finish(Object.freeze({ ...widget, heldCount }), [], (heldCount | 0) >= heldThreshold);
  }
  if (widget.state === 2) {
    return widget.decide.status !== 0 ? finish(widget)
      : finish(Object.freeze({ ...widget, state: 0 }), [callback(1)]);
  }
  if (!input.current) return finish(Object.freeze({ ...widget, state: 0 }));
  if (!input.inside) return finish(widget);
  // State3 reentry does not reacquire capture or repeat callback0/touch cue.
  return finish(Object.freeze({ ...widget, state: 1, select: start(widget.select, 'forward') }));
}

function advance(controller: HomeTileController): HomeTileController {
  if (controller.status === 0) return controller;
  const appliedFrame = controller.currentFrame;
  // Status2 submits once more after disabling the binding; it writes no pose.
  if (controller.status === 2) return Object.freeze({ ...controller, appliedFrame, status: 0, bindingEnabled: false });
  const terminal = controller.direction === 'forward' ? 1 : 0;
  return Object.freeze({ ...controller, appliedFrame, currentFrame: terminal,
    status: appliedFrame === terminal ? 2 : 1 });
}

/** One eligible tile2D pass: update both controllers, then apply enabled
 * bindings in Select→Decide order. Inactive old applied poses write nothing. */
export function advanceHomeTileWidget2D(widget: HomeTileWidget): HomeTileWidget {
  validate(widget);
  const select = advance(widget.select), decide = advance(widget.decide);
  let pose = widget.pose;
  if (select.bindingEnabled && select.appliedFrame !== null) pose = Object.freeze({ clip: 'select', frame: select.appliedFrame });
  if (decide.bindingEnabled && decide.appliedFrame !== null) pose = Object.freeze({ clip: 'decide', frame: decide.appliedFrame });
  return select === widget.select && decide === widget.decide && pose === widget.pose ? widget
    : Object.freeze({ ...widget, select, decide, pose });
}
