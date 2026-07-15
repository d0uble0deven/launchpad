import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { buildMockData } from '../data/mockData';
import { clearAppState, loadAppState, saveAppState } from '../logic/storage';
import type { AppState, Employee, OnboardingBoard } from '../types/board';

type AppStateContextValue = {
  state: AppState;
  updateBoard: (
    boardId: string,
    updater: (board: OnboardingBoard) => OnboardingBoard,
  ) => void;
  addHire: (employee: Employee, board: OnboardingBoard) => void;
  resetAll: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadAppState();
    if (saved) {
      console.log('[storage] loaded saved data from localStorage');
      return saved;
    }
    console.log('[storage] no saved data — using mock data');
    return buildMockData();
  });

  // Persist every change (debounced so drag ticks don't thrash).
  useEffect(() => {
    const timer = setTimeout(() => saveAppState(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  const updateBoard = useCallback(
    (
      boardId: string,
      updater: (board: OnboardingBoard) => OnboardingBoard,
    ) => {
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((board) =>
          board.id === boardId ? updater(board) : board,
        ),
      }));
    },
    [],
  );

  const addHire = useCallback(
    (employee: Employee, board: OnboardingBoard) => {
      setState((prev) => ({
        employees: [...prev.employees, employee],
        boards: [...prev.boards, board],
      }));
    },
    [],
  );

  const resetAll = useCallback(() => {
    clearAppState();
    setState(buildMockData());
    console.log('[storage] data reset to mock data');
  }, []);

  const value = useMemo(
    () => ({ state, updateBoard, addHire, resetAll }),
    [state, updateBoard, addHire, resetAll],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return value;
}
