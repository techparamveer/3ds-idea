/** Interaction travel is a visual fit, not a measured Nintendo switch stroke. */
export function buttonTravel(name: string, authored: number): number {
  if (/^[ABXY]$/.test(name)) return .6;
  if (name === 'DPAD') return .45;
  if (name === 'HOME' || name === 'SELECT' || name === 'START') return .3;
  if (name === 'POWER') return .35;
  if (name === 'L' || name === 'R') return .5;
  // The original circle pad is not a clickable switch.
  if (name === 'CIRCLE') return 0;
  return authored;
}

export class ButtonMotion {
  depth = 0;
  private until = 0;
  private held = new Set<string>();
  readonly travel: number;
  constructor(travel: number) { this.travel = travel; }
  press(now: number, source?: string) {
    if (source) this.held.add(source);
    this.until = Math.max(this.until, now + 130);
  }
  release(source: string) { this.held.delete(source); }
  cancel() { this.held.clear(); this.until = 0; }
  step(now: number, dt: number, reduced = false) {
    const target = this.held.size || now < this.until ? this.travel : 0;
    this.depth = reduced ? target : target + (this.depth - target) * Math.exp(-(target ? 65 : 24) * dt);
    if (!target && this.depth < .001) this.depth = 0;
    return this.depth;
  }
}
