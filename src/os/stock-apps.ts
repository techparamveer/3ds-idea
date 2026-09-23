import { objectValue, type AppContext, type AppDescriptor, type AppEffect, type AppEvent, type AppModule, type AppReduction, type AppState, type AppView, type AppViewRow, type JsonValue } from './app-types.ts';

const str = (value: JsonValue | undefined, fallback = '') => typeof value === 'string' ? value : fallback;
const num = (value: JsonValue | undefined, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const list = (value: JsonValue | undefined): AppState[] => Array.isArray(value) ? value.filter(objectValue) : [];
const record = (value: JsonValue | undefined): AppState => objectValue(value) ? value : {};
const row = (id: string, label: string, value?: string, detail?: string): AppViewRow => ({ id, label, ...(value === undefined ? {} : { value }), ...(detail === undefined ? {} : { detail }) });
const bounds = (value: number, max: number) => Math.max(0, Math.min(Math.max(0, max), value));
const settingsDefaults: AppState = { nickname: 'Player', language: 'English', sound: 'Stereo', birthday: '', clock: '', wireless: false };
export const initialSharedData = (): AppState => ({ settings: { ...settingsDefaults }, miis: [], photos: [], sounds: [], notes: [], friends: [], notifications: [], activity: {}, browser: { bookmarks: [], history: [] }, plaza: { greeting: 'Hello!', miiId: null, streetPass: false } });
const miiDefaults = (): AppState => ({ name: 'Mii', gender: 0, face: 0, skin: 0, hair: 0, hairColor: 0, eyes: 0, eyeColor: 0, eyebrows: 0, nose: 0, mouth: 0, glasses: 0, facialHair: 0, height: 64, build: 64, favoriteColor: 0, favorite: false });
const miiRanges: Record<string, number> = { gender: 1, face: 11, skin: 5, hair: 131, hairColor: 7, eyes: 59, eyeColor: 5, eyebrows: 23, nose: 17, mouth: 35, glasses: 8, facialHair: 5, height: 127, build: 127, favoriteColor: 11 };
const miiLabels: Record<string, string> = { gender: 'Gender', face: 'Face', skin: 'Skin colour', hair: 'Hairstyle', hairColor: 'Hair colour', eyes: 'Eyes', eyeColor: 'Eye colour', eyebrows: 'Eyebrows', nose: 'Nose', mouth: 'Mouth', glasses: 'Glasses', facialHair: 'Facial hair', height: 'Height', build: 'Build', favoriteColor: 'Favourite colour' };
const offlineTitles = new Set(['eshop', 'nnid-settings', 'system-transfer', 'nintendo-zone', 'system-updater', 'miiverse', 'miiverse-post', 'mint', 'amiibo-settings', 'extrapad']);
const cameraTitles = new Set(['camera', 'camera-applet']);
const selectorSources: Record<string, string> = { 'mii-selector': 'miis', 'photo-selector': 'photos', 'sound-selector': 'sounds' };

/** Semantic views bind to converted native panes; drawing is owned by presentation. */
export function createStockModule(descriptor: AppDescriptor): AppModule {
  const id = descriptor.id;
  function rows(state: AppState, context: AppContext): AppViewRow[] {
    const screen = str(state.screen, 'main'), shared = context.shared;
    if (id === 'keyboard') return [];
    if (selectorSources[id]) return list(shared[selectorSources[id]]).map((entry, index) => row(String(index), str(entry.name, str(entry.title, `Item ${index + 1}`))));
    if (id === 'error') return [];
    if (screen === 'offline' || screen === 'searching' || screen === 'connecting' || screen === 'confirm-delete') return [];
    if (id === 'system-settings') {
      const prefs = { ...settingsDefaults, ...record(shared.settings) };
      if (screen === 'profile') return [row('nickname', 'User Name', str(prefs.nickname)), row('birthday', 'Birthday', str(prefs.birthday)), row('language', 'Language', str(prefs.language)), row('sound', 'Sound', str(prefs.sound)), row('clock', 'Date & Time', str(prefs.clock, 'System clock'))];
      if (screen === 'data') return [row('photos', 'Photos', String(list(shared.photos).length)), row('sounds', 'Sound recordings', String(list(shared.sounds).length)), row('miis', 'Mii characters', String(list(shared.miis).length)), row('notes', 'Game Notes', String(list(shared.notes).length))];
      if (screen === 'other') return [row('profile', 'Profile'), row('clock', 'Date & Time'), row('sound', 'Sound'), row('language', 'Language'), row('transfer', 'System Transfer'), row('update', 'System Update')];
      return [row('internet', 'Internet Settings'), row('profile', 'Profile'), row('data', 'Data Management'), row('other', 'Other Settings'), row('nnid', 'Nintendo Network ID Settings')];
    }
    if (id === 'game-notes' || id === 'memo') {
      if (screen === 'drawing') return [];
      return Array.from({ length: 16 }, (_, index) => { const note = list(shared.notes).find(note => note.slot === index); return row(String(index), `Note ${index + 1}`, note ? 'Saved' : ''); });
    }
    if (id === 'mii-maker') {
      if (screen === 'edit') {
        const fields = record(state.fields);
        return [row('name', 'Name', str(fields.name)), ...Object.keys(miiRanges).map(key => row(key, miiLabels[key], String(num(fields[key])))), row('favorite', 'Favourite', fields.favorite ? 'Yes' : 'No'), row('save', 'Save'), ...(state.editingId ? [row('delete', 'Delete this Mii')] : [])];
      }
      return [row('new', 'Create a Mii'), ...list(shared.miis).map(mii => row(str(mii.id), str(mii.name, 'Mii')))];
    }
    if (cameraTitles.has(id)) {
      if (screen === 'gallery') return list(shared.photos).map(photo => row(str(photo.id), str(photo.name, 'Photo')));
      if (screen === 'photo') return [];
      return [row('preview', 'Take Photos'), row('gallery', 'View Photos', String(list(shared.photos).length)), row('import', 'Import a Photo')];
    }
    if (id === 'sound') {
      if (screen === 'record') return [];
      if (screen === 'library') return list(shared.sounds).map(sound => row(str(sound.id), str(sound.name, 'Sound')));
      if (screen === 'playback') return [row('play', state.playing ? 'Pause' : 'Play'), row('slower', 'Slower'), row('faster', 'Faster'), row('rename', 'Rename'), row('delete', 'Delete')];
      return [row('record', 'Record and Edit Sounds'), row('library', 'Listen to Music', String(list(shared.sounds).length)), row('import', 'Import Audio')];
    }
    if (id === 'browser') {
      const browser = record(shared.browser);
      if (screen === 'bookmarks' || screen === 'history') return list(browser[screen]).map((entry, index) => row(String(index), str(entry.title, str(entry.url)), str(entry.url)));
      return [row('address', 'URL', str(state.url)), row('bookmarks', 'Bookmarks'), row('history', 'History'), row('bookmark', 'Add Bookmark'), row('clear-history', 'Clear History')];
    }
    if (id === 'friends') {
      if (screen === 'profile') return [row('mii', 'Choose your Mii'), row('message', 'Favourite message', str(state.message)), row('name', 'Name', str(record(shared.settings).nickname, 'Player'))];
      return [row('profile', 'Your friend card'), row('register', 'Register Friend'), ...list(shared.friends).map(friend => row(str(friend.id), str(friend.name, 'Friend'), str(friend.code), 'Offline'))];
    }
    if (id === 'notifications') return list(shared.notifications).map(note => row(str(note.id), str(note.title), note.read ? '' : 'New'));
    if (id === 'activity-log') {
      const activity = record(shared.activity);
      return Object.entries(activity).map(([title, value]) => ({ title, value: record(value) })).sort((a, b) => num(b.value.seconds) - num(a.value.seconds)).map(entry => row(entry.title, str(entry.value.title, entry.title), `${Math.floor(num(entry.value.seconds) / 60)} min`, `${num(entry.value.launches)} launches`));
    }
    if (id === 'streetpass') return [row('mii', 'Choose your Mii'), row('greeting', 'Greeting', str(record(shared.plaza).greeting, 'Hello!')), row('visitors', 'Plaza', '0 visitors'), row('settings', 'StreetPass Settings')];
    if (id === 'download-play') return [row('3ds', 'Nintendo 3DS'), row('ds', 'Nintendo DS')];
    if (id === 'health-safety') return [row('health', 'Health and Safety'), row('precautions', 'Usage Precautions'), row('privacy', 'Privacy Information')];
    if (id === 'manual') return [row('contents', 'Contents'), row('controls', 'Controls'), row('support', 'Support Information')];
    if (id === 'amiibo-settings') return [row('register', 'Register Owner and Nickname'), row('delete-data', 'Delete amiibo Game Data'), row('reset', 'Reset amiibo')];
    if (id === 'nnid-settings') return [row('sign-in', 'Link an Existing ID'), row('create', 'Create a New ID')];
    if (id === 'system-transfer') return [row('3ds', 'Transfer from a Nintendo 3DS'), row('dsi', 'Transfer from Nintendo DSi')];
    if (id === 'miiverse-post') return [row('post', 'Write a Post')];
    return [];
  }
  const withScreen = (state: AppState, screen: string, patch: AppState = {}): AppState => ({ ...state, screen, selection: 0, ...patch });
  const invokeKeyboard = (state: AppState, requestId: string, value: string, maxLength = 32, extra: AppState = {}): AppReduction => ({ state, effects: [{ type: 'invoke', appId: 'keyboard', requestId, args: { title: requestId === 'address' ? 'Enter URL' : 'Enter text', value, maxLength, ...extra } }] });
  const sharedChange = (state: AppState, key: string, value: JsonValue): AppReduction => ({ state, effects: [{ type: 'shared', key, value }, { type: 'save' }] });
  const beginOffline = (state: AppState, context: AppContext): AppReduction => ({ state: withScreen(state, 'connecting', { since: context.now }), effects: [{ type: 'sound', name: 'open' }] });
  function activate(state: AppState, action: string, context: AppContext, value?: JsonValue): AppReduction {
    const shared = context.shared, screen = str(state.screen, 'main');
    if (action === 'back') {
      if (id === 'keyboard' || selectorSources[id] || id === 'error') return { state, effects: [{ type: 'complete', cancelled: true }] };
      if (screen === 'drawing') {
        const notes = list(shared.notes).filter(note => note.slot !== state.slot);
        if (Array.isArray(state.strokes) && state.strokes.length) notes.push({ slot: state.slot, strokes: state.strokes });
        return sharedChange(withScreen(state, 'main'), 'notes', notes);
      }
      if (screen !== 'main') return { state: withScreen(state, 'main', { recording: false, playing: false }), effects: [{ type: 'release-capabilities' }] };
      return { state, effects: [{ type: descriptor.kind === 'application' ? 'home' : 'close' }] };
    }
    if (action === 'retry') return beginOffline(state, context);
    if (id === 'keyboard') {
      const max = bounds(num(state.maxLength, 32), 512), draft = str(state.draft);
      if (action === 'submit') return draft.length >= num(state.minLength) ? { state, effects: [{ type: 'complete', value: draft }] } : { state: { ...state, invalid: true } };
      if (action === 'delete') return { state: { ...state, draft: Array.from(draft).slice(0, -1).join('') } };
      if (action === 'shift') return { state: { ...state, shifted: !state.shifted } };
      if (action === 'mode') return { state: { ...state, mode: state.mode === 'symbols' ? 'letters' : 'symbols' } };
      if (action.startsWith('key:')) { let key = action.slice(4); if (state.shifted) key = key.toUpperCase(); if (state.numeric && !/^\d+$/.test(key)) return { state }; return { state: { ...state, draft: Array.from(draft + key).slice(0, max).join(''), invalid: false } }; }
      return { state };
    }
    if (selectorSources[id]) { const selected = list(shared[selectorSources[id]])[Number(action)]; return selected ? { state, effects: [{ type: 'complete', value: selected }] } : { state }; }
    if (id === 'error') return { state, effects: [{ type: 'complete' }] };
    if (id === 'system-settings') {
      const prefs = { ...settingsDefaults, ...record(shared.settings) };
      if (['profile', 'data', 'other'].includes(action)) return { state: withScreen(state, action) };
      if (action === 'internet') return { state: withScreen(state, 'offline', { reason: 'internet' }) };
      if (action === 'nnid' || action === 'transfer' || action === 'update') return { state, effects: [{ type: 'launch', appId: { nnid: 'nnid-settings', transfer: 'system-transfer', update: 'system-updater' }[action]! }] };
      if (['nickname', 'birthday', 'clock'].includes(action)) return invokeKeyboard(state, action, str(prefs[action]), action === 'nickname' ? 10 : 32);
      if (action === 'language') { const values = ['English', 'Français', 'Deutsch', 'Español', 'Italiano', 'Nederlands', 'Português', 'Русский']; return sharedChange(state, 'settings', { ...prefs, language: values[(values.indexOf(str(prefs.language)) + 1) % values.length] }); }
      if (action === 'sound') { const values = ['Stereo', 'Mono', 'Surround']; return sharedChange(state, 'settings', { ...prefs, sound: values[(values.indexOf(str(prefs.sound)) + 1) % values.length] }); }
      return { state };
    }
    if (id === 'game-notes' || id === 'memo') {
      if (action === 'clear') return { state: { ...state, strokes: [], currentStroke: [] } };
      if (action === 'eraser') return { state: { ...state, erasing: !state.erasing } };
      if (action === 'black' || action === 'red' || action === 'blue') return { state: { ...state, color: action, erasing: false } };
      if (/^\d+$/.test(action) && +action < 16) { const note = list(shared.notes).find(note => note.slot === +action); return { state: withScreen(state, 'drawing', { slot: +action, strokes: note?.strokes ?? [], currentStroke: [], color: 'black', erasing: false }) }; }
    }
    if (id === 'mii-maker') {
      if (action === 'new') return { state: withScreen(state, 'edit', { fields: miiDefaults(), editingId: null }) };
      if (screen === 'edit') {
        const fields = record(state.fields);
        if (action === 'name') return invokeKeyboard(state, 'mii-name', str(fields.name), 10, { minLength: 1 });
        if (action === 'favorite') return { state: { ...state, fields: { ...fields, favorite: !fields.favorite } } };
        if (Object.hasOwn(miiRanges, action)) return { state: { ...state, fields: { ...fields, [action]: (num(fields[action]) + 1) % (miiRanges[action] + 1) } } };
        if (action === 'save') { const miis = list(shared.miis), editingId = str(state.editingId, `mii-${num(shared.miiSequence) + 1}`); return { state: withScreen(state, 'main'), effects: [{ type: 'shared', key: 'miis', value: [...miis.filter(mii => mii.id !== editingId), { ...fields, id: editingId }] }, { type: 'shared', key: 'miiSequence', value: num(shared.miiSequence) + (state.editingId ? 0 : 1) }, { type: 'save' }] }; }
        if (action === 'delete') return { state: withScreen(state, 'confirm-delete') };
      }
      if (action === 'confirm-delete') return sharedChange(withScreen(state, 'main'), 'miis', list(shared.miis).filter(mii => mii.id !== state.editingId));
      const mii = list(shared.miis).find(mii => mii.id === action); if (mii) return { state: withScreen(state, 'edit', { fields: { ...miiDefaults(), ...mii }, editingId: action }) };
    }
    if (cameraTitles.has(id)) {
      if (action === 'preview') return { state: withScreen(state, 'preview', { mediaStatus: 'requesting' }), effects: [{ type: 'capability', capability: 'camera', requestId: 'preview', intent: 'user', options: { operation: 'preview', facing: str(state.facing, 'environment') } }] };
      if (action === 'flip') return activate({ ...state, facing: state.facing === 'user' ? 'environment' : 'user' }, 'preview', context);
      if (action === 'capture') return { state, effects: [{ type: 'capability', capability: 'camera', requestId: 'capture', intent: 'user', options: { operation: 'capture' } }] };
      if (action === 'import') return { state, effects: [{ type: 'capability', capability: 'import-photo', requestId: 'import', intent: 'user' }] };
      if (action === 'gallery') return { state: withScreen(state, 'gallery'), effects: [{ type: 'release-capabilities' }] };
      if (action === 'delete' && screen === 'photo') return { state: withScreen(state, 'gallery', { mediaId: null }), effects: [{ type: 'remove-media', collection: 'photos', id: str(state.mediaId) }, { type: 'save' }] };
      if (list(shared.photos).some(photo => photo.id === action)) return { state: withScreen(state, 'photo', { mediaId: action }) };
    }
    if (id === 'sound') {
      if (action === 'record') return { state: withScreen(state, 'record', { recording: false }) };
      if (action === 'record-start' || action === 'record-stop') return { state, effects: [{ type: 'capability', capability: 'microphone', requestId: action, intent: 'user', options: { operation: action === 'record-start' ? 'record' : 'stop' } }] };
      if (action === 'import') return { state, effects: [{ type: 'capability', capability: 'import-audio', requestId: 'import', intent: 'user' }] };
      if (action === 'library') return { state: withScreen(state, 'library') };
      if (action === 'play') return { state: { ...state, playing: !state.playing }, effects: [{ type: 'sound', name: `${state.playing ? 'pause' : 'media'}:${str(state.mediaId)}` }] };
      if (action === 'slower' || action === 'faster') return { state: { ...state, speed: Math.max(.5, Math.min(2, num(state.speed, 1) + (action === 'faster' ? .1 : -.1))) } };
      if (action === 'rename') return invokeKeyboard(state, 'sound-name', str(list(shared.sounds).find(sound => sound.id === state.mediaId)?.name), 32);
      if (action === 'delete' && screen === 'playback') return { state: withScreen(state, 'library', { playing: false, mediaId: null }), effects: [{ type: 'remove-media', collection: 'sounds', id: str(state.mediaId) }, { type: 'save' }] };
      if (list(shared.sounds).some(sound => sound.id === action)) return { state: withScreen(state, 'playback', { mediaId: action, playing: false, speed: 1 }) };
    }
    if (id === 'browser') {
      const browser = record(shared.browser);
      if (action === 'address') return invokeKeyboard(state, 'address', str(state.url, 'https://'), 512);
      if (action === 'bookmarks' || action === 'history') return { state: withScreen(state, action) };
      if (action === 'clear-history') return sharedChange(state, 'browser', { ...browser, history: [] });
      if (action === 'bookmark' && state.url) { const bookmarks = list(browser.bookmarks); if (!bookmarks.some(entry => entry.url === state.url)) bookmarks.push({ title: str(state.url), url: str(state.url) }); return sharedChange(state, 'browser', { ...browser, bookmarks: bookmarks.slice(-100) }); }
      if ((screen === 'bookmarks' || screen === 'history') && /^\d+$/.test(action)) { const entry = list(browser[screen])[+action]; if (entry) return { state: withScreen(state, 'offline', { url: str(entry.url), reason: 'browser' }) }; }
    }
    if (id === 'friends') {
      if (action === 'profile') return { state: withScreen(state, 'profile') };
      if (action === 'mii') return { state, effects: [{ type: 'invoke', appId: 'mii-selector', requestId: 'friend-mii' }] };
      if (action === 'message') return invokeKeyboard(state, 'friend-message', str(state.message), 16);
      if (action === 'register') return invokeKeyboard(state, 'friend-code', '', 12, { numeric: true, minLength: 12 });
      const friend = list(shared.friends).find(friend => friend.id === action); if (friend) return { state: withScreen(state, 'friend', { friendId: action }) };
      if (action === 'delete') return sharedChange(withScreen(state, 'main'), 'friends', list(shared.friends).filter(friend => friend.id !== state.friendId));
    }
    if (id === 'notifications') {
      if (action === 'delete') return sharedChange(withScreen(state, 'main'), 'notifications', list(shared.notifications).filter(note => note.id !== state.notificationId));
      const note = list(shared.notifications).find(note => note.id === action); if (note) return sharedChange(withScreen(state, 'notification', { notificationId: action }), 'notifications', list(shared.notifications).map(note => note.id === action ? { ...note, read: true } : note));
    }
    if (id === 'activity-log') return { state: withScreen(state, 'activity', { activityId: action }) };
    if (id === 'streetpass') {
      if (action === 'mii') return { state, effects: [{ type: 'invoke', appId: 'mii-selector', requestId: 'plaza-mii' }] };
      if (action === 'greeting') return invokeKeyboard(state, 'plaza-greeting', str(record(shared.plaza).greeting), 16);
      if (action === 'settings') return sharedChange(state, 'plaza', { ...record(shared.plaza), streetPass: !record(shared.plaza).streetPass });
      return { state: withScreen(state, 'offline', { reason: 'streetpass' }) };
    }
    if (id === 'download-play') return { state: withScreen(state, 'searching', { mode: action, since: context.now }) };
    if (id === 'health-safety' || id === 'manual') return { state: withScreen(state, 'document', { section: action, page: 0 }) };
    if (offlineTitles.has(id)) return beginOffline(state, context);
    return { state, ...(value === undefined ? {} : { effects: [] }) };
  }
  function result(state: AppState, event: Extract<AppEvent, { type: 'applet-result' }>, context: AppContext): AppReduction {
    if (event.cancelled) return { state };
    const shared = context.shared, value = event.value;
    if (id === 'system-settings' && ['nickname', 'birthday', 'clock'].includes(event.requestId) && typeof value === 'string') return sharedChange(state, 'settings', { ...settingsDefaults, ...record(shared.settings), [event.requestId]: value });
    if (id === 'mii-maker' && event.requestId === 'mii-name' && typeof value === 'string') return { state: { ...state, fields: { ...record(state.fields), name: value } } };
    if (id === 'sound' && event.requestId === 'sound-name' && typeof value === 'string') return sharedChange(state, 'sounds', list(shared.sounds).map(sound => sound.id === state.mediaId ? { ...sound, name: value } : sound));
    if (id === 'browser' && event.requestId === 'address' && typeof value === 'string') {
      const url = value.trim();
      if (!/^(https?:\/\/)?[^\s]+$/i.test(url) || /^(javascript|data|file):/i.test(url)) return { state: { ...state, invalid: true } };
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`, browser = record(shared.browser);
      return sharedChange(withScreen(state, 'offline', { url: normalized, reason: 'browser' }), 'browser', { ...browser, history: [...list(browser.history), { url: normalized, title: normalized }].slice(-100) });
    }
    if (id === 'friends') {
      if (event.requestId === 'friend-message' && typeof value === 'string') return { state: { ...state, message: value }, effects: [{ type: 'save' }] };
      if (event.requestId === 'friend-mii' && objectValue(value)) return { state: { ...state, miiId: value.id }, effects: [{ type: 'save' }] };
      if (event.requestId === 'friend-code' && typeof value === 'string' && /^\d{12}$/.test(value)) {
        const friends = list(shared.friends); if (friends.some(friend => friend.code === value)) return { state: { ...state, invalid: true } };
        return sharedChange(state, 'friends', [...friends, { id: value, code: value, name: 'Provisionally registered friend', offline: true }].slice(0, 100));
      }
    }
    if (id === 'streetpass') {
      const plaza = record(shared.plaza);
      if (event.requestId === 'plaza-mii' && objectValue(value)) return sharedChange(state, 'plaza', { ...plaza, miiId: value.id });
      if (event.requestId === 'plaza-greeting' && typeof value === 'string') return sharedChange(state, 'plaza', { ...plaza, greeting: value });
    }
    return { state };
  }
  function view(state: AppState, context: AppContext): AppView {
    const screen = str(state.screen, 'main'), options = rows(state, context);
    const texts: string[] = [];
    if (screen === 'offline') texts.push(id === 'browser' ? 'Unable to connect to the Internet.' : id === 'download-play' ? 'No software found.' : id === 'streetpass' ? 'There are no visitors in your plaza.' : 'Unable to connect. Please try again later.');
    if (screen === 'searching') texts.push('Searching for software…');
    if (screen === 'connecting') texts.push(id === 'amiibo-settings' ? 'Please touch an amiibo to the NFC reader.' : 'Connecting to the Internet…');
    if (screen === 'confirm-delete') texts.push('Delete this Mii?');
    if (state.mediaStatus === 'denied' || state.mediaStatus === 'unavailable') texts.push('The camera or microphone could not be started.');
    if (id === 'notifications' && !options.length && screen === 'main') texts.push('There are no notifications.');
    if (selectorSources[id] && !options.length) texts.push('There are no items to select.');
    if (id === 'error') texts.push(str(state.message, 'An error has occurred.'));
    if (screen === 'notification') { const notification = list(context.shared.notifications).find(note => note.id === state.notificationId); if (notification) texts.push(str(notification.message)); }
    if (screen === 'friend') texts.push(str(list(context.shared.friends).find(friend => friend.id === state.friendId)?.code), 'Offline');
    if (screen === 'activity') { const entry = record(record(context.shared.activity)[str(state.activityId)]); texts.push(`${Math.floor(num(entry.seconds) / 60)} minutes`, `${num(entry.launches)} launches`); }
    const right = id === 'keyboard' ? { label: 'OK', action: 'submit' } : id === 'error' ? { label: 'OK', action: 'ok' } : screen === 'confirm-delete' ? { label: 'Delete', action: 'confirm-delete' } : screen === 'preview' ? { label: 'Take Photo', action: 'capture' } : screen === 'record' ? { label: state.recording ? 'Stop' : 'Record', action: state.recording ? 'record-stop' : 'record-start' } : screen === 'offline' ? { label: 'Retry', action: 'retry' } : options.length ? { label: 'OK', action: options[bounds(num(state.selection), options.length - 1)].id } : undefined;
    return { appId: id, titleId: descriptor.titleId, screen, heading: str(state.title, descriptor.title), text: texts, rows: options, selection: bounds(num(state.selection), options.length - 1), footer: { left: { label: id === 'keyboard' || selectorSources[id] ? 'Cancel' : 'Back', action: 'back' }, ...(right ? { right } : {}) }, native: { pack: descriptor.assetPack, panes: {} }, data: { ...state, miis: context.shared.miis ?? [], photos: context.shared.photos ?? [], sounds: context.shared.sounds ?? [], settings: context.shared.settings ?? {} } };
  }
  return {
    descriptor,
    create(args, saved) {
      const restored = objectValue(saved) ? saved : {};
      // Screen/capture requests and drafts never survive closing/reloading an app.
      return { screen: 'main', selection: 0, ...(id === 'friends' ? { message: str(restored.message), miiId: restored.miiId ?? null } : {}), ...(id === 'browser' ? { url: str(restored.url) } : {}), ...args, ...(id === 'keyboard' ? { draft: str(args.value), maxLength: Math.max(1, Math.min(512, num(args.maxLength, 32))), minLength: num(args.minLength), mode: 'letters', shifted: false } : {}) };
    },
    reduce(state, event, context) {
      if (event.type === 'lifecycle') {
        if (event.phase === 'suspend' || event.phase === 'sleep' || event.phase === 'close') return { state: { ...state, currentStroke: [], recording: false, playing: false }, effects: [{ type: 'release-capabilities' }, { type: 'save' }] };
        return { state };
      }
      if (event.type === 'applet-result') return result(state, event, context);
      if (event.type === 'capability-result') {
        if (!event.ok) return { state: { ...state, mediaStatus: event.reason === 'denied' ? 'denied' : 'unavailable', recording: false } };
        const value = record(event.value);
        if ((cameraTitles.has(id) || id === 'sound') && typeof value.id === 'string' && typeof value.name === 'string') {
          const key = id === 'sound' ? 'sounds' : 'photos';
          return sharedChange({ ...state, mediaStatus: 'ready', recording: false }, key, [...list(context.shared[key]).filter(item => item.id !== value.id), value]);
        }
        return { state: { ...state, mediaStatus: 'ready', recording: event.requestId === 'record-start', leaseId: value.leaseId ?? null } };
      }
      if (event.type === 'tick') {
        if ((state.screen === 'searching' || state.screen === 'connecting') && context.now - num(state.since) >= 1800) return { state: withScreen(state, 'offline') };
        return { state };
      }
      if (event.type === 'text' && id === 'keyboard') return { state: { ...state, draft: Array.from(event.value).filter(char => !state.numeric || /^\d$/.test(char)).slice(0, num(state.maxLength, 32)).join('') } };
      if (event.type === 'action') return activate(state, event.id, context, event.value);
      if (event.type === 'touch') {
        if (event.phase === 'cancel') return { state: { ...state, currentStroke: [] } };
        if (!Number.isFinite(event.x) || !Number.isFinite(event.y) || event.x < 0 || event.x >= 320 || event.y < 0 || event.y >= 240) return { state };
        if ((id === 'game-notes' || id === 'memo') && state.screen === 'drawing') {
          if (event.y >= 34 && event.y < 211) {
            const point: JsonValue = [Math.round(event.x), Math.round(event.y)], stroke = Array.isArray(state.currentStroke) ? state.currentStroke : [];
            if (event.phase === 'down') return { state: { ...state, currentStroke: [point] } };
            if (event.phase === 'move' && stroke.length) return { state: { ...state, currentStroke: [...stroke.slice(-4095), point] } };
            if (event.phase === 'up' && stroke.length) return { state: { ...state, currentStroke: [], strokes: [...(Array.isArray(state.strokes) ? state.strokes : []), { color: state.erasing ? 'eraser' : str(state.color, 'black'), points: [...stroke, point] }].slice(-2048) } };
          }
        }
        if (event.phase !== 'up') return { state };
        const current = view(state, context);
        if (event.y >= 212) return activate(state, event.x < 160 ? current.footer.left?.action ?? 'back' : current.footer.right?.action ?? 'open', context);
        if (id === 'keyboard') {
          if (event.y >= 76 && event.y < 204) {
            const keys = state.mode === 'symbols' ? ['1234567890', '!@#$%&*()-', '_+=/:;,.?', ' '] : ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
            const r = Math.floor((event.y - 76) / 32), col = Math.floor(event.x / 32), char = keys[r]?.[col];
            if (char) return activate(state, `key:${char}`, context);
          }
          if (event.y >= 40 && event.y < 72) return activate(state, event.x < 100 ? 'mode' : event.x > 220 ? 'delete' : 'shift', context);
        }
        const index = Math.floor(num(state.selection) / 4) * 4 + Math.floor((event.y - 38) / 41);
        if (event.y >= 38 && event.y < 202 && current.rows[index]) return index === num(state.selection) ? activate(state, current.rows[index].id, context) : { state: { ...state, selection: index } };
        return { state };
      }
      const command = event.type === 'command' ? event.command : event.type === 'button' && event.phase !== 'up' && event.activate !== false ? event.command : null;
      if (!command) return { state };
      if (command === 'back') return activate(state, 'back', context);
      const current = view(state, context);
      if (command === 'open') return activate(state, current.footer.right?.action ?? 'open', context);
      if (command === 'up' || command === 'down') return { state: { ...state, selection: bounds(num(state.selection) + (command === 'down' ? 1 : -1), current.rows.length - 1) } };
      if ((command === 'left' || command === 'right') && id === 'mii-maker' && state.screen === 'edit') {
        const field = current.rows[num(state.selection)]?.id, fields = record(state.fields);
        if (field && Object.hasOwn(miiRanges, field)) return { state: { ...state, fields: { ...fields, [field]: bounds(num(fields[field]) + (command === 'right' ? 1 : -1), miiRanges[field]) } } };
      }
      if ((command === 'left' || command === 'right') && state.screen === 'document') return { state: { ...state, page: Math.max(0, num(state.page) + (command === 'right' ? 1 : -1)) } };
      if (command === 'x' && state.screen === 'drawing') return activate(state, 'eraser', context);
      if (command === 'y' && state.screen === 'drawing') return activate(state, state.color === 'black' ? 'red' : state.color === 'red' ? 'blue' : 'black', context);
      return { state };
    },
    view,
    save(state): AppState { return id === 'friends' ? { message: str(state.message), miiId: state.miiId ?? null } : id === 'browser' ? { url: str(state.url) } : {}; },
    migrate(saved, fromVersion) { return fromVersion === 1 && objectValue(saved) ? saved : null; },
  };
}
