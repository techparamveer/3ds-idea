import type { MenuState } from './state.ts';

declare const folderIdentity: unique symbol;
/** Opaque within one live System; pair with the banner service generation. */
export type HomeFolderIdentity = string & { readonly [folderIdentity]: true };
export type HomeFolderIdentities = {
  readonly bySlot: Readonly<Partial<Record<number, HomeFolderIdentity>>>;
  readonly nextAllocation: number;
};

/** Fresh session state. Labels, naming counters and persisted extra fields are irrelevant. */
export function createHomeFolderIdentities(folders: Readonly<Record<number, string>> = {}): HomeFolderIdentities {
  let identities: HomeFolderIdentities = { bySlot: {}, nextAllocation: 1 };
  for (const slot of Object.keys(folders).map(Number).sort((a, b) => a - b)) {
    identities = allocateHomeFolderIdentity(identities, slot);
  }
  return identities;
}

/** Pure fallback for legacy/isolated callers; folder mutations retain the returned record. */
export function getHomeFolderIdentities(state: MenuState): HomeFolderIdentities {
  const stored = state.system ? state.system.homeFolderIdentities : state.homeFolderIdentities;
  if (!stored) return createHomeFolderIdentities(state.folders);
  let identities = stored;
  for (const key of Object.keys(stored.bySlot)) {
    if (!Object.hasOwn(state.folders, key)) identities = removeHomeFolderIdentity(identities, Number(key));
  }
  for (const slot of Object.keys(state.folders).map(Number).sort((a, b) => a - b)) {
    identities = allocateHomeFolderIdentity(identities, slot);
  }
  return identities;
}

export function getHomeFolderIdentity(state: MenuState, slot: number): HomeFolderIdentity | undefined {
  return Object.hasOwn(state.folders, slot) ? getHomeFolderIdentities(state).bySlot[slot] : undefined;
}

export function writeHomeFolderIdentities(state: MenuState, identities: HomeFolderIdentities): MenuState {
  return state.system
    ? { ...state, system: { ...state.system, homeFolderIdentities: identities } }
    : { ...state, homeFolderIdentities: identities };
}

export function allocateHomeFolderIdentity(identities: HomeFolderIdentities, slot: number): HomeFolderIdentities {
  if (Object.hasOwn(identities.bySlot, slot)) return identities;
  const allocation = identities.nextAllocation;
  if (!Number.isSafeInteger(allocation) || allocation < 1 || allocation >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('HOME folder identity allocation exhausted');
  }
  return {
    bySlot: { ...identities.bySlot, [slot]: `home-folder:${allocation}` as HomeFolderIdentity },
    nextAllocation: allocation + 1,
  };
}

export function removeHomeFolderIdentity(identities: HomeFolderIdentities, slot: number): HomeFolderIdentities {
  if (!Object.hasOwn(identities.bySlot, slot)) return identities;
  const bySlot = { ...identities.bySlot }; delete bySlot[slot];
  return { ...identities, bySlot };
}

/** Move to an empty/app slot, or swap with another folder; never allocate during placement. */
export function moveHomeFolderIdentity(identities: HomeFolderIdentities, from: number, to: number): HomeFolderIdentities {
  const source = identities.bySlot[from];
  if (!source || from === to) return identities;
  const bySlot = { ...identities.bySlot }, displaced = bySlot[to];
  bySlot[to] = source;
  if (displaced) bySlot[from] = displaced; else delete bySlot[from];
  return { ...identities, bySlot };
}

/** Layout reset retires every key without rewinding the live session's allocation counter. */
export function clearHomeFolderIdentities(identities: HomeFolderIdentities): HomeFolderIdentities {
  return { ...identities, bySlot: {} };
}
