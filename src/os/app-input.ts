import type { AppCommand, AppEvent } from './app-types.ts';
export type InputLatch = {
  held: Record<string, { command: AppCommand; repeatAt: number }>;
  analog: Record<string, AppCommand | null>;
  touch: { pointerId: number; x: number; y: number; startX: number; startY: number } | null;
};
export const createInputLatch = (): InputLatch => ({ held: {}, analog: {}, touch: null });
const directions = new Set<AppCommand>(['left', 'right', 'up', 'down']);
export const INPUT_REPEAT_DELAY = 420;
export const INPUT_REPEAT_INTERVAL = 150;
/** Clock-owned repeats avoid browser repeat-rate differences; source identifies a control, e.g. keyboard:ArrowRight. */
export function latchInput(latch: InputLatch, event: AppEvent, now: number): { latch: InputLatch; commands: AppCommand[] } {
  if (!Number.isFinite(now)) return { latch, commands: [] };
  if (event.type === 'button') {
    if (event.phase === 'up') {
      if (!latch.held[event.source] || latch.held[event.source].command !== event.command) return { latch, commands: [] };
      const held = { ...latch.held }; delete held[event.source]; return { latch: { ...latch, held }, commands: [] };
    }
    if (event.phase === 'repeat' || latch.held[event.source]) return { latch, commands: [] };
    const duplicate = Object.values(latch.held).find(value => value.command === event.command);
    return { latch: { ...latch, held: { ...latch.held, [event.source]: { command: event.command, repeatAt: duplicate?.repeatAt ?? now + INPUT_REPEAT_DELAY } } }, commands: duplicate ? [] : [event.command] };
  }
  if (event.type === 'analog') {
    if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return { latch, commands: [] };
    const x = Math.max(-1, Math.min(1, event.x)), y = Math.max(-1, Math.min(1, event.y));
    const command: AppCommand | null = Math.hypot(x, y) < .28 ? null : Math.abs(x) >= Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
    if (latch.analog[event.source] === command) return { latch, commands: [] };
    const held = { ...latch.held }; delete held[event.source];
    const duplicate = command && Object.values(held).find(value => value.command === command);
    if (command) held[event.source] = { command, repeatAt: duplicate ? duplicate.repeatAt : now + INPUT_REPEAT_DELAY };
    return { latch: { ...latch, held, analog: { ...latch.analog, [event.source]: command } }, commands: command && !duplicate ? [command] : [] };
  }
  return { latch, commands: event.type === 'command' ? [event.command] : [] };
}
/** A single native stylus owns the contact until up/cancel. Other pointers are ignored. */
export function latchTouch(latch: InputLatch, event: Extract<AppEvent, { type: 'touch' }>): { latch: InputLatch; accepted: boolean } {
  const pointerId = event.pointerId ?? 0;
  if (event.phase === 'cancel') return latch.touch && latch.touch.pointerId === pointerId ? { latch: { ...latch, touch: null }, accepted: true } : { latch, accepted: false };
  if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return { latch, accepted: false };
  if (event.phase === 'down') {
    if (latch.touch || event.x < 0 || event.x >= 320 || event.y < 0 || event.y >= 240) return { latch, accepted: false };
    return { latch: { ...latch, touch: { pointerId, x: event.x, y: event.y, startX: event.x, startY: event.y } }, accepted: true };
  }
  if (!latch.touch || latch.touch.pointerId !== pointerId) return { latch, accepted: false };
  return { latch: { ...latch, touch: event.phase === 'up' ? null : { ...latch.touch, x: event.x, y: event.y } }, accepted: true };
}
export function repeatInput(latch: InputLatch, now: number): { latch: InputLatch; commands: AppCommand[]; events: Extract<AppEvent, { type: 'button' }>[] } {
  const held = { ...latch.held }, commands = new Set<AppCommand>(), events: Extract<AppEvent, { type: 'button' }>[] = [];
  for (const [source, value] of Object.entries(held)) if (directions.has(value.command) && now >= value.repeatAt && !commands.has(value.command)) {
    events.push({ type: 'button', command: value.command, phase: 'repeat', source, activate: true }); commands.add(value.command);
    // Move every source's deadline together; a second device must not double the rate.
    for (const [other, entry] of Object.entries(held)) if (entry.command === value.command) held[other] = { ...entry, repeatAt: now + INPUT_REPEAT_INTERVAL };
  }
  return { latch: commands.size ? { ...latch, held } : latch, commands: [...commands], events };
}
