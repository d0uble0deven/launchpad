import type { AppState } from '../types/board';

const STORAGE_KEY = 'launchpad.board';

/**
 * Bump when the persisted shape changes so stale saves are discarded.
 * v1: single OnboardingBoard (MVP 1). v2: AppState with employees + boards.
 */
const SCHEMA_VERSION = 2;

type StoredState = {
  version: number;
  savedAt: string;
  state: AppState;
};

export function loadAppState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (
      parsed.version !== SCHEMA_VERSION ||
      !Array.isArray(parsed.state?.employees) ||
      !Array.isArray(parsed.state?.boards)
    ) {
      console.warn(
        `[storage] discarding saved data (schema v${parsed.version}, expected v${SCHEMA_VERSION})`,
      );
      return null;
    }
    return parsed.state;
  } catch (error) {
    console.warn('[storage] failed to load saved data', error);
    return null;
  }
}

export function saveAppState(state: AppState): void {
  try {
    const stored: StoredState = {
      version: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn('[storage] failed to save data', error);
  }
}

export function clearAppState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
