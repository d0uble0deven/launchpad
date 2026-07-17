import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { DependencyChangeDto } from '../api/client';
import type {
  AppState,
  Employee,
  OnboardingBoard,
  TaskCard,
  Template,
} from '../types/board';

type AppStateContextValue = {
  state: AppState;
  /** Local-only board update (drag ticks). Nothing is persisted. */
  updateBoardLocal: (
    boardId: string,
    updater: (board: OnboardingBoard) => OnboardingBoard,
  ) => void;
  /** Persist a task (PATCH); server recalculates dependencies + notifies. */
  persistTask: (boardId: string, task: TaskCard) => Promise<void>;
  createTask: (boardId: string, task: TaskCard) => Promise<void>;
  removeTask: (boardId: string, taskId: string) => Promise<void>;
  remindTask: (boardId: string, taskId: string) => Promise<void>;
  /** Update the template locally and persist it (debounced). */
  updateTemplate: (updater: (template: Template) => Template) => void;
  addHire: (employee: Employee) => Promise<Employee>;
  resetAll: () => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

const POLL_INTERVAL_MS = 15_000;

function logDependencyChanges(changes: DependencyChangeDto[]): void {
  if (changes.length === 0) {
    console.log('[deps] recalculated — no changes');
  }
  for (const change of changes) {
    console.log(`[deps] "${change.title}": ${change.from} → ${change.to}`);
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const templateSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const fresh = await api.fetchState();
      setState(fresh);
      setError(null);
    } catch (err) {
      console.error('[api] failed to load state', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    console.log('[api] loading state from server');
    void load();
  }, [load]);

  // Poll so changes made from Slack show up in an open tab.
  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [state !== null, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const setBoardTasks = useCallback((boardId: string, tasks: TaskCard[]) => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            boards: prev.boards.map((board) =>
              board.id === boardId ? { ...board, tasks } : board,
            ),
          }
        : prev,
    );
  }, []);

  const updateBoardLocal = useCallback(
    (
      boardId: string,
      updater: (board: OnboardingBoard) => OnboardingBoard,
    ) => {
      setState((prev) =>
        prev
          ? {
              ...prev,
              boards: prev.boards.map((board) =>
                board.id === boardId ? updater(board) : board,
              ),
            }
          : prev,
      );
    },
    [],
  );

  const persistTask = useCallback(
    async (boardId: string, task: TaskCard) => {
      console.log(`[save] "${task.title}"`, task);
      try {
        const result = await api.patchTask(boardId, task);
        logDependencyChanges(result.changes);
        setBoardTasks(boardId, result.tasks);
      } catch (err) {
        console.error('[api] failed to save task', err);
      }
    },
    [setBoardTasks],
  );

  const createTask = useCallback(
    async (boardId: string, task: TaskCard) => {
      try {
        const result = await api.createTask(boardId, task);
        setBoardTasks(boardId, result.tasks);
      } catch (err) {
        console.error('[api] failed to create task', err);
      }
    },
    [setBoardTasks],
  );

  const removeTask = useCallback(
    async (boardId: string, taskId: string) => {
      try {
        const result = await api.deleteTask(boardId, taskId);
        logDependencyChanges(result.changes);
        setBoardTasks(boardId, result.tasks);
      } catch (err) {
        console.error('[api] failed to delete task', err);
      }
    },
    [setBoardTasks],
  );

  const remindTask = useCallback(
    async (boardId: string, taskId: string) => {
      const result = await api.remindTask(boardId, taskId);
      setBoardTasks(boardId, result.tasks);
    },
    [setBoardTasks],
  );

  const updateTemplate = useCallback(
    (updater: (template: Template) => Template) => {
      setState((prev) => {
        if (!prev) return prev;
        const template = updater(prev.template);
        if (templateSaveTimer.current) clearTimeout(templateSaveTimer.current);
        templateSaveTimer.current = setTimeout(() => {
          api
            .putTemplate(template)
            .then(() => console.log('[template] persisted'))
            .catch((err) =>
              console.error('[api] failed to save template', err),
            );
        }, 500);
        return { ...prev, template };
      });
    },
    [],
  );

  const addHire = useCallback(async (employee: Employee) => {
    const result = await api.addHire(employee);
    setState((prev) =>
      prev
        ? {
            ...prev,
            employees: [...prev.employees, result.employee],
            boards: [...prev.boards, result.board],
          }
        : prev,
    );
    return result.employee;
  }, []);

  const resetAll = useCallback(async () => {
    try {
      const fresh = await api.reset();
      setState(fresh);
      console.log('[api] data reset to mock data');
    } catch (err) {
      console.error('[api] failed to reset', err);
    }
  }, []);

  const value = useMemo(
    () =>
      state
        ? {
            state,
            updateBoardLocal,
            persistTask,
            createTask,
            removeTask,
            remindTask,
            updateTemplate,
            addHire,
            resetAll,
          }
        : null,
    [
      state,
      updateBoardLocal,
      persistTask,
      createTask,
      removeTask,
      remindTask,
      updateTemplate,
      addHire,
      resetAll,
    ],
  );

  if (error && !state) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontSize: 14 }}>
        <p>
          Couldn't reach the LaunchPad server. Is it running? (
          <code>npm run server</code>)
        </p>
        <p style={{ color: '#6b7280', fontSize: 12 }}>{error}</p>
        <button type="button" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!value) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
        Loading LaunchPad…
      </div>
    );
  }

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
