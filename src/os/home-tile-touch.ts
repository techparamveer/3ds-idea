import type { AppEvent } from './app-types.ts';
import type { HomeTilePose } from './home-tile-pose.ts';
import { createHomeTileWidget, updateHomeTileWidgetInput, advanceHomeTileWidget2D,
  resetHomeTileWidget, setHomeTileWidgetEnabled, type HomeTileWidget } from './home-tile-widget.ts';

type Point = Readonly<{ x: number; y: number; down: boolean }>;
export type HomeTileTouch = Readonly<{
  widgets: Readonly<Record<number, HomeTileWidget>>;
  latest: Point;
  pending: readonly Point[];
  previous: boolean;
  strokeOwned: boolean;
  globalCapture: boolean;
}>;
export type HomeTileTouchEvent = Readonly<{ slot: number } & (
  { kind: 'cue'; cue: 'touch' } | { kind: 'callback'; value: 0 | 1 | 2 }
)>;
const neutral = Object.freeze({ x: -1, y: -1, down: false });
export function createHomeTileTouch(): HomeTileTouch {
  return Object.freeze({ widgets: Object.freeze({}), latest: neutral, pending: Object.freeze([]),
    previous: false, strokeOwned: false, globalCapture: false });
}
/** Browser policy: preserve down/up edges arriving between eligible polls.
 * Moves retain the latest position; no native HID event queue is implied. */
export function queueHomeTileTouch(host: HomeTileTouch, event: Extract<AppEvent, { type: 'touch' }>, slot: number | null) {
  if (event.phase === 'cancel') return { state: resetHomeTileTouch(host), handled: host.strokeOwned };
  const down = event.phase === 'down';
  if (down ? slot === null : !host.strokeOwned) return { state: host, handled: false };
  const point = Object.freeze({ x: event.x, y: event.y, down: event.phase !== 'up' });
  const widgets = down && !host.widgets[slot!]
    ? Object.freeze({ ...host.widgets, [slot!]: createHomeTileWidget() }) : host.widgets;
  return { state: Object.freeze({ ...host, widgets, latest: point,
    pending: event.phase === 'move' ? host.pending : Object.freeze([...host.pending, point]),
    strokeOwned: event.phase !== 'up' }), handled: true };
}
export function resetHomeTileTouch(host: HomeTileTouch): HomeTileTouch {
  // Browser lifecycle reset also releases capture. Native reset alone does not.
  const widgets = Object.fromEntries(Object.entries(host.widgets).map(([slot, widget]) =>
    [slot, setHomeTileWidgetEnabled(resetHomeTileWidget(widget), widget.enabled)]));
  return Object.freeze({ ...createHomeTileTouch(), widgets: Object.freeze(widgets) });
}
/** Producer scans capture before traversing registered widgets. A widget that
 * clears capture during this traversal cannot undo that pass's initial scan. */
export function sampleHomeTileTouch(host: HomeTileTouch, hit: (slot: number, x: number, y: number) => boolean) {
  const point = host.pending[0] ?? host.latest;
  let globalCapture = Object.values(host.widgets).some(widget => widget.capture);
  const widgets: Record<number, HomeTileWidget> = {}, events: HomeTileTouchEvent[] = [];
  let unsupportedLongPress = false;
  for (const [key, widget] of Object.entries(host.widgets)) {
    const slot = Number(key), result = updateHomeTileWidgetInput(widget,
      { current: point.down, previous: host.previous, inside: hit(slot, point.x, point.y), globalCapture });
    widgets[slot] = result.state;
    globalCapture ||= result.state.capture;
    unsupportedLongPress ||= result.unsupportedLongPress;
    events.push(...result.events.map(event => Object.freeze({ ...event, slot })));
  }
  const state: HomeTileTouch = Object.freeze({ ...host, widgets: Object.freeze(widgets),
    previous: point.down, pending: Object.freeze(host.pending.slice(1)), globalCapture });
  return { state, events: Object.freeze(events), touchActive: point.down, captureActive: globalCapture, unsupportedLongPress };
}
export function advanceHomeTileTouch2D(host: HomeTileTouch): HomeTileTouch {
  return Object.freeze({ ...host, widgets: Object.freeze(Object.fromEntries(
    Object.entries(host.widgets).map(([slot, widget]) => [slot, advanceHomeTileWidget2D(widget)]))) });
}
export function homeTileTouchPoses(host: HomeTileTouch): Readonly<Record<number, HomeTilePose>> {
  return Object.freeze(Object.fromEntries(Object.entries(host.widgets)
    .filter(([, widget]) => widget.pose !== null).map(([slot, widget]) => [slot, widget.pose!])));
}
