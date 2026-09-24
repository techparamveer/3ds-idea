import { objectValue, type AppContext, type AppDescriptor, type AppEffect, type AppModule, type AppReduction, type AppState, type AppView, type AppViewRow, type JsonValue } from './app-types.ts';
import { helperSelectorSources, helperTitle, helperView, isHelperTitle } from './stock-helper-views.ts';
import { browserBack, browserChoices, browserHeading, browserNavigate, browserPageEntry, browserText } from './stock-browser-navigation.ts';
import { settingsLanguageTick, LANGUAGE_SCROLL_DURATION_MS, settingsBack, settingsChoices, settingsHeading, settingsNavigate, settingsOtherPages, settingsPage, settingsText } from './stock-settings-navigation.ts';
import { healthDocumentPageCounts } from './stock-health-layout.ts';
import { notesCaptureView, notesNextCaptureView, notesSwitchFrame, NOTES_SWITCH_LAST_FRAME, NOTES_SWITCH_DURATION_MS, soundNextPlaybackMode, soundPlaybackMode, stockScreenActionAt, stockScreenSeekAt } from './stock-screen-layout.ts';
import { portfolioMedia, type PortfolioMedia } from './portfolio-media.ts';

const str = (value: JsonValue | undefined, fallback = '') => typeof value === 'string' ? value : fallback;
const num = (value: JsonValue | undefined, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const list = (value: JsonValue | undefined): AppState[] => Array.isArray(value) ? value.filter(objectValue) : [];
const record = (value: JsonValue | undefined): AppState => objectValue(value) ? value : {};
const row = (id: string, label: string, value?: string): AppViewRow => ({ id, label, ...(value === undefined ? {} : { value }) });
const bounds = (value: number, max: number) => Math.max(0, Math.min(Math.max(0, max), value));
const settingsDefaults: AppState = { nickname: 'Player', language: 'English', sound: 'Stereo', birthday: '', clock: '', wireless: false };
// Keep legacy keys intact so existing saves remain readable. Stock screens never write them.
export const initialSharedData = (): AppState => ({ settings: { ...settingsDefaults }, miis: [], photos: [], sounds: [], notes: [], friends: [], notifications: [], activity: {}, browser: { bookmarks: [], history: [] }, plaza: { greeting: 'Hello!', miiId: null, streetPass: false } });
const cameraTitles = new Set(['camera', 'camera-applet']);
const selectorSources = helperSelectorSources;
const serviceRows: Record<string, readonly [string, string][]> = {
  'amiibo-settings': [],
  'nnid-settings': [],
  'system-transfer': [['3ds', 'Transfer from a Nintendo 3DS System'], ['dsi', 'Transfer from a Nintendo DSi System']],
  'system-updater': [],
  eshop: [['back', 'OK']], mint: [['information', 'Nintendo eShop']],
  'nintendo-zone': [['scan', 'Search for Nintendo Zone'], ['information', 'What is Nintendo Zone?']], miiverse: [['communities', 'Communities'], ['activity', 'Activity Feed'], ['profile', 'My Menu'], ['notifications', 'Notifications']],
  'miiverse-post': [['information', 'Post to Miiverse']], extrapad: [['information', 'Circle Pad Pro']],
};
const withScreen = (state: AppState, screen: string, patch: AppState = {}): AppState => ({ ...state, screen, selection: 0, ...patch });

/** Semantic UI navigation only, except the read-only portfolio gallery and music player.
 * Device access, editable profiles, text entry and stock save operations are absent.
 */
export function createStockModule(descriptor: AppDescriptor, media: PortfolioMedia = portfolioMedia): AppModule {
  const id = descriptor.id;
  const folder = (state: AppState) => media.folders.find(item => item.id === state.folderId);
  const photo = (state: AppState) => folder(state)?.photos.find(item => item.id === state.photoId);
  const track = (state: AppState) => media.tracks.find(item => item.id === state.trackId);
  // Stable permutation keeps the pure reducer reproducible without a random source.
  const shuffled = media.tracks.map((item, index) => ({ index, hash: [...item.id].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261) }))
    .sort((a, b) => a.hash - b.hash || a.index - b.index).map(item => item.index);
  function rows(state: AppState, context: AppContext): AppViewRow[] {
    const screen = str(state.screen, 'main'), shared = context.shared;
    if (cameraTitles.has(id)) {
      if (screen === 'main') return media.folders.map(item => row(`folder:${item.id}`, item.title, String(item.photos.length)));
      if (screen === 'gallery') return (folder(state)?.photos ?? []).map(item => row(`photo:${item.id}`, item.title));
      return [];
    }
    if (id === 'sound') {
      if (screen === 'main') return media.tracks.map(item => row(`track:${item.id}`, item.title, item.artist));
      return [row('play', state.playing ? 'Pause' : 'Play'), row('previous', 'Previous'), row('next', 'Next'), row('mode', 'Playback mode', soundPlaybackMode(state))];
    }
    if (id === 'system-settings') return settingsChoices(state, record(shared.settings));
    if (id === 'browser') return browserChoices(state, shared);
    if (screen !== 'main' && !['bookmarks', 'history', 'profile'].includes(screen)) return [];
    if (selectorSources[id]) return list(shared[selectorSources[id]]).map((entry, index) => row(String(index), str(entry.name, str(entry.title, `Item ${index + 1}`))));
    if (id === 'game-notes' || id === 'memo') return Array.from({ length: 16 }, (_, index) => row(String(index), `Note ${index + 1}`));
    if (id === 'friends') {
      if (screen === 'profile') return []; // Native own-card fields are read-only surfaces.
      return [row('profile', 'Your friend card'), ...list(shared.friends).map(friend => row(str(friend.id), str(friend.name, 'Friend')))];
    }
    if (id === 'notifications') return list(shared.notifications).map(note => row(str(note.id), str(note.title), note.read ? '' : 'New'));
    if (id === 'health-safety') return [row('3d', '3D Display Precautions'), row('general', 'General Precautions'), row('usage', 'Usage Precautions')];
    if (id === 'manual') return [row('contents', 'Contents'), row('controls', 'Controls'), row('support', 'Support Information')];
    return (serviceRows[id] ?? []).map(([action, label]) => row(action, label));
  }
  function directionalSelection(current: AppView, direction: 'left' | 'right' | 'up' | 'down'): number {
    const selected = current.selection, count = current.rows.length;
    if (!count) return 0;
    if (id === 'system-settings' && current.screen === 'main') {
      const neighbors: Record<string, Partial<Record<typeof direction, string>>> = {
        nnid: { down: 'internet' },
        internet: { up: 'nnid', right: 'parental', down: 'data' },
        parental: { up: 'nnid', left: 'internet', down: 'other' },
        data: { up: 'internet', right: 'other' },
        other: { up: 'parental', left: 'data' },
      };
      const nextId = neighbors[current.rows[selected]?.id]?.[direction];
      const next = current.rows.findIndex(item => item.id === nextId);
      return next < 0 ? selected : next;
    }
    if (id === 'system-settings' && ['parental', 'parental-explain'].includes(current.screen)) {
      const nextId = direction === 'left' ? 'back' : direction === 'right' ? 'next' : undefined;
      const next = current.rows.findIndex(item => item.id === nextId);
      return next < 0 ? selected : next;
    }
    if (id === 'system-settings' && current.screen === 'data') {
      const neighbors: Record<string, Partial<Record<typeof direction, string>>> = {
        'data-3ds': { right: 'data-dsi', down: 'streetpass' },
        'data-dsi': { left: 'data-3ds', down: 'streetpass' },
        streetpass: { up: 'data-3ds', down: 'blocked-users' },
        'blocked-users': { up: 'streetpass' },
      };
      const next = current.rows.findIndex(item => item.id === neighbors[current.rows[selected]?.id]?.[direction]);
      return next < 0 ? selected : next;
    }
    const columns = cameraTitles.has(id) && ['main', 'gallery'].includes(current.screen) ? 3
      : (id === 'game-notes' || id === 'memo') && current.screen === 'main' ? 4 : 1;
    if (direction === 'left') return columns > 1 && selected % columns > 0 ? selected - 1 : selected;
    if (direction === 'right') return columns > 1 && selected % columns < columns - 1 && selected + 1 < count ? selected + 1 : selected;
    if (direction === 'up') return selected >= columns ? selected - columns : selected;
    // Keep the column where possible; a partial final row uses its last cell.
    return Math.floor(selected / columns) < Math.floor((count - 1) / columns) ? Math.min(selected + columns, count - 1) : selected;
  }
  function music(state: AppState, command: 'load' | 'play' | 'pause' | 'seek', patch: AppState = {}): AppReduction {
    const next: AppState = { ...state, ...patch, revision: num(state.revision) + 1 }, selected = track(next);
    if (!selected) return { state };
    const effect: AppEffect = { type: 'music', command, trackId: selected.id, revision: num(next.revision), ...(command === 'load' || command === 'play' ? { src: selected.src } : {}), ...(command === 'load' || command === 'play' || command === 'seek' ? { position: num(next.position) } : {}) };
    return { state: next, effects: command === 'load' && next.playing ? [effect, { type: 'music', command: 'play', trackId: selected.id, revision: num(next.revision), src: selected.src, position: num(next.position) }] : [effect] };
  }
  function selectTrack(state: AppState, trackId: string, playing = true): AppReduction {
    const selected = media.tracks.find(item => item.id === trackId);
    return selected ? music(withScreen(state, 'playback'), 'load', { trackId, playing, position: 0, duration: Math.max(0, selected.duration ?? 0), mediaError: false }) : { state };
  }
  function adjacentTrack(state: AppState, direction: number, ended = false): AppReduction {
    const current = media.tracks.findIndex(item => item.id === state.trackId);
    if (current < 0) return { state };
    if (ended && state.repeat === 'one') return selectTrack(state, str(state.trackId));
    const order = state.shuffle ? shuffled : media.tracks.map((_, index) => index), index = order.indexOf(current), nextIndex = index + direction;
    if (ended && nextIndex >= order.length && state.repeat !== 'all') return music(state, 'pause', { playing: false, position: num(state.duration) });
    const target = order[(nextIndex + order.length) % order.length];
    return selectTrack(state, media.tracks[target].id, ended || Boolean(state.playing));
  }
  function activate(state: AppState, action: string, context: AppContext, value?: JsonValue): AppReduction {
    const screen = str(state.screen, 'main');
    if (action === 'back') {
      if (id === 'sound' && state.mediaError === true) return { state: { ...state, mediaError: false } };
      if (screen !== 'main') {
        if ((id === 'game-notes' || id === 'memo') && screen === 'drawing') return { state: withScreen(state, 'main', { selection: bounds(num(state.slot), 15), ...(id === 'game-notes' ? { captureSwitchElapsed: NOTES_SWITCH_DURATION_MS } : {}) }) };
        if (id === 'system-settings') return { state: settingsBack(state) };
        if (id === 'browser') return { state: browserBack(state) };
        if (isHelperTitle(id)) {
          const index=rows(withScreen(state,'main'),context).findIndex(item=>item.id===(state.field??state.topic));
          return { state: withScreen(state,'main',{selection:Math.max(0,index)}) };
        }
        const parent = cameraTitles.has(id) && screen === 'photo' ? 'gallery' : 'main';
        const next = withScreen(state, parent);
        return id === 'sound' && state.playing ? music(next, 'pause', { playing: false }) : { state: next };
      }
      return { state, effects: [{ type: descriptor.kind === 'application' ? 'home' : 'close' }] };
    }
    if (id === 'health-safety' && screen === 'document' && (action === 'next' || action === 'previous')) {
      const count = healthDocumentPageCounts[str(state.topic)] ?? 1;
      const page = bounds(num(state.page) + (action === 'next' ? 1 : -1), count - 1);
      return page === state.page ? { state } : { state: { ...state, page } };
    }
    if (cameraTitles.has(id)) {
      if (screen === 'main' && action.startsWith('folder:') && media.folders.some(item => item.id === action.slice(7))) return { state: withScreen(state, 'gallery', { folderId: action.slice(7) }) };
      if (screen === 'gallery' && action.startsWith('photo:') && folder(state)?.photos.some(item => item.id === action.slice(6))) return { state: withScreen(state, 'photo', { photoId: action.slice(6) }) };
      if (screen === 'photo' && ['previous', 'next'].includes(action)) {
        const photos = folder(state)?.photos ?? [], index = photos.findIndex(item => item.id === state.photoId);
        if (photos.length) return { state: { ...state, photoId: photos[(index + (action === 'next' ? 1 : photos.length - 1)) % photos.length].id } };
      }
      return { state };
    }
    if (id === 'sound') {
      if (action.startsWith('music-')) {
        const progress = record(value);
        if (!state.playing || progress.trackId !== state.trackId || progress.revision !== state.revision) return { state };
        if (action === 'music-time') {
          const duration = Math.max(0, num(progress.duration, num(state.duration)));
          return { state: { ...state, duration, position: bounds(num(progress.position, num(state.position)), duration || Number.MAX_SAFE_INTEGER) } };
        }
        if (action === 'music-ended') return adjacentTrack(state, 1, true);
        if (action === 'music-error') return music(state, 'pause', { playing: false, mediaError: true });
        return { state };
      }
      // The source "Could not play." dialog offers only OK; other controls stay inert until it closes.
      if (state.mediaError === true) return action === 'error-ok' || action === 'back' ? { state: { ...state, mediaError: false } } : { state };
      if (screen === 'main' && action.startsWith('track:')) return selectTrack(state, action.slice(6));
      if (screen !== 'playback' || !track(state)) return { state };
      if (action === 'play') {
        if (!state.playing && num(state.duration) > 0 && num(state.position) >= num(state.duration)) return selectTrack(state, str(state.trackId));
        return music(state, state.playing ? 'pause' : 'play', { playing: !state.playing, mediaError: false });
      }
      if (action === 'previous' || action === 'next') return adjacentTrack(state, action === 'next' ? 1 : -1);
      if (action === 'seek' && typeof value === 'number' && Number.isFinite(value)) return music(state, 'seek', { position: bounds(value, num(state.duration)) });
      if (action === 'mode') return { state: { ...state, ...soundNextPlaybackMode[soundPlaybackMode(state)] } };
      if (action === 'repeat') return { state: { ...state, repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off' } };
      if (action === 'shuffle') return { state: { ...state, shuffle: !state.shuffle } };
      return { state };
    }
    if (id === 'error' && action === 'ok') return { state, effects: [{ type: 'complete' }] };
    if (id === 'system-settings' && screen === 'other' && (action === 'settings-next' || action === 'settings-previous')) return { state: settingsNavigate(state, action) };
    if (id === 'system-settings' && screen === 'detail' && state.field === 'language' && (action === 'language-up' || action === 'language-down')) return { state: settingsNavigate(state, action) };
    // Source B_BtnSwitch cycles the suspended-LCD display Double→Up→Down→Double for the current applet session only.
    // Adaptation: native sets the button Invalid without a suspended title; the pure reducer cannot see the slot, so the
    // hidden mode still cycles there while the painter shows the source Invalid pose and no capture.
    if (id === 'game-notes' && screen === 'drawing' && action === 'switch') {
      // ImageScreenUp 0x168454 releases MemoWriteDown's switch only when the clip finishes.
      if (notesSwitchFrame(state) < NOTES_SWITCH_LAST_FRAME) return { state };
      return { state: { ...state, captureView: notesNextCaptureView[notesCaptureView(state)], captureSwitchElapsed: 0 } };
    }
    // Unknown/stale actions cannot open hidden flows or mutate saved data.
    if (!rows(state, context).some(item => item.id === action && !item.disabled)) return { state };
    if (id === 'system-settings') {
      if (['nnid', 'transfer', 'update'].includes(action)) return { state: { ...state, selection: rows(state, context).findIndex(item => item.id === action) }, effects: [{ type: 'launch', appId: { nnid: 'nnid-settings', transfer: 'system-transfer', update: 'system-updater' }[action]! }] };
      return { state: settingsNavigate(state, action) };
    }
    if (id === 'game-notes' || id === 'memo') return { state: withScreen(state, 'drawing', { slot: Number(action), strokes: list(context.shared.notes).find(note => note.slot === Number(action))?.strokes ?? [] }) };
    if (id === 'health-safety' || id === 'manual') return { state: withScreen(state, 'document', { topic: action, page: 0 }) };
    if (id === 'browser') return { state: browserNavigate(state, action) };
    if (id === 'friends') return { state: withScreen(state, action === 'profile' ? 'profile' : 'friend', { friendId: action }) };
    if (id === 'notifications') return { state: withScreen(state, 'notification', { notificationId: action }) };
    return { state: withScreen(state, 'detail', { field: action }) };
  }
  function view(state: AppState, context: AppContext): AppView {
    const screen = str(state.screen, 'main'), options = rows(state, context), selection = bounds(num(state.selection), options.length - 1), text: string[] = [];
    const data: AppState = { ...state, settings: context.shared.settings ?? {} };
    if (id === 'game-notes' && screen === 'drawing') { data.captureSwitchFrame = notesSwitchFrame(state); delete data.captureSwitchElapsed; }
    if (cameraTitles.has(id)) {
      data.folders = media.folders.map(item => ({ ...item, photos: item.photos.map(photo => ({ ...photo })) }));
      data.photos = (folder(state)?.photos ?? []).map(item => ({ ...item })); data.photo = photo(state) ? { ...photo(state)! } : null;
      if (!media.folders.length) text.push('There are no photos.');
    }
    if (id === 'sound') {
      data.tracks = media.tracks.map(item => ({ ...item })); data.track = track(state) ? { ...track(state)! } : null;
      if (!media.tracks.length) text.push('There is no music.');
      if (state.mediaError) text.push('Could not play.'); // Source S_dlg C_ErrPlay
    }
    if (id === 'notifications' && screen === 'notification') text.push(str(list(context.shared.notifications).find(item => item.id === state.notificationId)?.message));
    if (id === 'notifications' && !options.length && screen === 'main') text.push('There are no notifications.');
    if (id === 'system-settings') { text.push(...settingsText(state, context.shared)); if (screen === 'other') { data.page=settingsPage(state); data.pageCount=settingsOtherPages.length; data.selectionActive=state.selectionActive!==false; } }
    if (id === 'browser') { text.push(...browserText(state, context.shared)); data.entry=browserPageEntry(state, context.shared); if (screen === 'settings') { data.page=Math.floor(selection/4); data.pageCount=2; } }
    const helper=helperView(id,state,context.shared,options);
    if(helper){text.push(...helper.text);Object.assign(data,helper.data);}
    if (id === 'error') text.push(str(state.message, 'An error has occurred.'));
    const healthDocument = id === 'health-safety' && screen === 'document';
    const pageCount = healthDocumentPageCounts[str(state.topic)] ?? 1;
    if (healthDocument) data.pageCount = pageCount;
    const left = healthDocument && num(state.page) > 0 ? { label: 'Previous', action: 'previous' } : { label: id === 'system-updater' ? 'Cancel' : id === 'amiibo-settings' ? 'Close' : 'Back', action: 'back' };
    const right = healthDocument ? (num(state.page) < pageCount - 1 ? { label: 'Next', action: 'next' } : { label: 'Done', action: 'back' }) : id === 'error' ? { label: 'OK', action: 'ok' } : id === 'sound' && state.mediaError === true ? { label: 'OK', action: 'error-ok' } : options.length ? { label: 'OK', action: options[selection].id } : undefined;
    return { appId: id, titleId: descriptor.titleId, screen, heading: id === 'system-settings' ? settingsHeading(state) : id === 'browser' ? browserHeading(state) : helperTitle(id,state) ?? descriptor.title, text, rows: options, selection,
      footer: { left, ...(right ? { right } : {}) }, native: { pack: descriptor.assetPack, panes: {} }, data };
  }
  return {
    descriptor, view,
    create(args, saved) {
      const restored = objectValue(saved) ? saved : {};
      return { screen: 'main', selection: 0, ...(id === 'friends' ? { message: str(restored.message), miiId: restored.miiId ?? null } : {}),
        ...(id === 'browser' ? { url: str(restored.url) } : {}), ...(id === 'error' ? { message: str(args.message, 'An error has occurred.') } : {}),
        ...(id === 'sound' ? { trackId: '', playing: false, position: 0, duration: 0, repeat: 'off', shuffle: false, revision: 0 } : {}) };
    },
    reduce(state, event, context) {
      if (id === 'system-settings') {
        if (event.type === 'tick') return { state: settingsLanguageTick(state, event.elapsedMs) };
        // A paused foreground transition settles on resume, as in the Notes adapter.
        if (event.type === 'lifecycle' && ['suspend', 'sleep'].includes(event.phase)) return { state: settingsLanguageTick(state, LANGUAGE_SCROLL_DURATION_MS) };
      }
      if (id === 'game-notes' && state.screen === 'drawing') {
        if (event.type === 'tick' && Number.isFinite(event.elapsedMs) && event.elapsedMs > 0 && notesSwitchFrame(state) < NOTES_SWITCH_LAST_FRAME)
          return { state: { ...state, captureSwitchElapsed: Math.min(NOTES_SWITCH_DURATION_MS, num(state.captureSwitchElapsed) + event.elapsedMs) } };
        // Leave a settled display when the applet resumes; do not let a paused transition hold the control.
        if (event.type === 'lifecycle' && ['suspend', 'sleep'].includes(event.phase) && notesSwitchFrame(state) < NOTES_SWITCH_LAST_FRAME)
          return { state: { ...state, captureSwitchElapsed: NOTES_SWITCH_DURATION_MS } };
      }
      if (event.type === 'lifecycle') return id === 'sound' && track(state) && ['suspend', 'sleep', 'close'].includes(event.phase) ? music(state, 'pause', { playing: false }) : { state };
      if (event.type === 'action') return activate(state, event.id, context, event.value);
      if (event.type === 'touch') {
        if (event.phase !== 'up' || !Number.isFinite(event.x) || !Number.isFinite(event.y)) return { state };
        const current = view(state, context), fraction = stockScreenSeekAt(current, event.x, event.y);
        if (fraction !== null) return activate(state, 'seek', context, fraction * num(state.duration));
        const action = stockScreenActionAt(current, event.x, event.y);
        return action ? activate(state, action, context) : { state };
      }
      // Text, drawing, device results and old applet results have no editing path.
      const command = event.type === 'command' ? event.command : event.type === 'button' && event.phase !== 'up' && event.activate !== false ? event.command : null;
      if (!command) return { state };
      if (command === 'back') return activate(state, 'back', context);
      const current = view(state, context);
      if (command === 'open') return activate(state, current.footer.right?.action ?? '', context);
      if (command === 'left' || command === 'right') {
        if (id === 'system-settings' && state.screen === 'other') return activate(state, command === 'right' ? 'settings-next' : 'settings-previous', context);
        if (id === 'health-safety' && state.screen === 'document') return activate(state, command === 'right' ? 'next' : 'previous', context);
        if (cameraTitles.has(id) && state.screen === 'photo' || id === 'sound' && state.screen === 'playback') return activate(state, command === 'right' ? 'next' : 'previous', context);
      }
      if (command === 'left' || command === 'right' || command === 'up' || command === 'down') {
        const selection = directionalSelection(current, command);
        const otherFocus=id === 'system-settings' && current.screen === 'other';
        return selection === current.selection && (!otherFocus || state.selectionActive !== false)
          ? { state } : { state: { ...state, selection, ...(otherFocus ? { selectionActive: true } : {}) } };
      }
      return { state };
    },
    save(state): AppState { return id === 'friends' ? { message: str(state.message), miiId: state.miiId ?? null } : id === 'browser' ? { url: str(state.url) } : {}; },
    migrate(saved, fromVersion) { return fromVersion === 1 && objectValue(saved) ? saved : null; },
  };
}
