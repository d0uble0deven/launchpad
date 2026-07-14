import type { OnboardingBoard } from '../types/board';

const STORAGE_KEY = 'launchpad.board';

/** Bump when the board shape changes so stale saves are discarded. */
const SCHEMA_VERSION = 1;

type StoredBoard = {
  version: number;
  savedAt: string;
  board: OnboardingBoard;
};

export function loadBoard(): OnboardingBoard | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBoard;
    if (parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.board?.tasks)) {
      console.warn(
        `[storage] discarding saved board (schema v${parsed.version}, expected v${SCHEMA_VERSION})`,
      );
      return null;
    }
    return parsed.board;
  } catch (error) {
    console.warn('[storage] failed to load saved board', error);
    return null;
  }
}

export function saveBoard(board: OnboardingBoard): void {
  try {
    const stored: StoredBoard = {
      version: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      board,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn('[storage] failed to save board', error);
  }
}

export function clearBoard(): void {
  localStorage.removeItem(STORAGE_KEY);
}
