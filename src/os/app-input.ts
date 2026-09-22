import type { AppCommand, AppEvent } from './app-types.ts';
export type InputLatch = { held: Record<string, { command: AppCommand; repeatAt: number }>; analog: Record<string, AppCommand | null> };
export const createInputLatch = (): InputLatch => ({ held: {}, analog: {} });
const directions = new Set<AppCommand>(['left', 'right', 'up', 'down']);
/** Clock-owned repeats avoid keyboard repeat-rate differences and stuck controls. */
export function latchInput(latch: InputLatch, event: AppEvent, now: number): { latch: InputLatch; commands: AppCommand[] } {
  if (event.type === 'button') {
    if (event.phase === 'up') { const held = { ...latch.held }; delete held[event.source]; return { latch: { ...latch, held }, commands: [] }; }
    if (event.phase === 'repeat' || latch.held[event.source]) return { latch, commands: [] };
    const duplicate = Object.values(latch.held).some(value => value.command === event.command);
    return { latch: { ...latch, held: { ...latch.held, [event.source]: { command: event.command, repeatAt: now + 420 } } }, commands: duplicate ? [] : [event.command] };
  }
  if (event.type === 'analog') {
    if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return { latch, commands: [] };
    const command: AppCommand | null = Math.hypot(event.x, event.y) < .28 ? null : Math.abs(event.x) >= Math.abs(event.y) ? event.x < 0 ? 'left' : 'right' : event.y < 0 ? 'up' : 'down';
    if (latch.analog[event.source] === command) return { latch, commands: [] };
    const held = { ...latch.held }; delete held[event.source];
    if (command) held[event.source] = { command, repeatAt: now + 420 };
    return { latch: { held, analog: { ...latch.analog, [event.source]: command } }, commands: command ? [command] : [] };
  }
  return { latch, commands: event.type === 'command' ? [event.command] : [] };
}
export function repeatInput(latch: InputLatch, now: number): { latch: InputLatch; commands: AppCommand[] } {
  const held = { ...latch.held }, commands = new Set<AppCommand>();
  for (const [source, value] of Object.entries(held)) if (directions.has(value.command) && now >= value.repeatAt) { commands.add(value.command); held[source] = { ...value, repeatAt: now + 150 }; }
  return { latch: commands.size ? { ...latch, held } : latch, commands: [...commands] };
}
