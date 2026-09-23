/** Firmware-facing application contracts. These types do not depend on a renderer. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type AppState = Record<string, JsonValue>;
export type AppKind = 'application' | 'system-applet' | 'library-applet';
export type AppDescriptor = {
  id: string; title: string; titleId?: string; kind: AppKind; home: boolean;
  source: 'portfolio' | 'firmware'; assetPack: string; saveVersion: number;
};
export type AppCommand = 'left' | 'right' | 'up' | 'down' | 'open' | 'back' | 'home' | 'power' | 'x' | 'y' | 'start' | 'select' | 'l' | 'r';
export type AppEvent =
  | { type: 'command'; command: AppCommand }
  | { type: 'button'; command: AppCommand; phase: 'down' | 'up' | 'repeat'; source: string; activate?: boolean }
  | { type: 'touch'; phase: 'down' | 'move' | 'up' | 'cancel'; x: number; y: number; pointerId?: number }
  | { type: 'analog'; x: number; y: number; source: string }
  | { type: 'action'; id: string; value?: JsonValue }
  | { type: 'text'; value: string }
  | { type: 'tick'; elapsedMs: number }
  | { type: 'lifecycle'; phase: 'suspend' | 'resume' | 'sleep' | 'wake' | 'close' }
  | { type: 'applet-result'; requestId: string; value: JsonValue; cancelled: boolean }
  | { type: 'capability-result'; requestId: string; requestToken: number; ok: boolean; value?: JsonValue; reason?: string };
export type Capability = 'camera' | 'microphone' | 'motion' | 'import-photo' | 'import-audio' | 'local-wireless' | 'nfc' | 'nintendo-network';
export type AppEffect =
  | { type: 'invoke'; appId: string; requestId: string; args?: AppState }
  | { type: 'complete'; value?: JsonValue; cancelled?: boolean }
  | { type: 'launch'; appId: string }
  | { type: 'close' }
  | { type: 'home' }
  | { type: 'save' }
  | { type: 'shared'; key: string; value: JsonValue }
  | { type: 'remove-media'; collection: 'photos' | 'sounds'; id: string }
  | { type: 'sound'; name: string }
  | { type: 'link'; url: string }
  | { type: 'capability'; capability: Capability; requestId: string; intent: 'user'; options?: AppState }
  | { type: 'release-capabilities' };
export type AppViewRow = { id: string; label: string; value?: string; detail?: string; disabled?: boolean };
export type AppView = {
  appId: string; titleId?: string; screen: string; heading: string; subheading?: string;
  text?: string[]; rows: AppViewRow[]; selection: number;
  footer: { left?: { label: string; action: string }; right?: { label: string; action: string } };
  native?: { pack: string; layout?: string; animation?: string; panes: Record<string, { text?: string; visible?: boolean; texture?: string; frame?: number }> };
  data?: AppState;
};
export type AppContext = { now: number; shared: AppState };
export type AppReduction = { state: AppState; effects?: AppEffect[] };
export type AppModule = {
  descriptor: AppDescriptor;
  create(args: AppState, saved: unknown, context: AppContext): AppState;
  reduce(state: AppState, event: AppEvent, context: AppContext): AppReduction;
  view(state: AppState, context: AppContext): AppView;
  save(state: AppState): AppState;
  migrate(saved: unknown, fromVersion: number): AppState | null;
};
export type SaveRecord = { version: number; data: AppState };
export function objectValue(value: unknown): value is AppState {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
