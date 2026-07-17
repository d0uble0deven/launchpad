import { recalculateDependencies } from '../../src/logic/dependencies';
import type { DependencyChange } from '../../src/logic/dependencies';
import type { TaskCard } from '../../src/types/board';
import { notifyTaskOwner } from './slack/notify';
import * as store from './store';

export type TaskUpdateResult = {
  tasks: TaskCard[];
  changes: DependencyChange[];
};

/** Fire ready-notifications for dependency changes, without blocking the response. */
function notifyReadyChanges(
  boardId: string,
  tasks: TaskCard[],
  changes: DependencyChange[],
  triggerReason: string,
): void {
  const board = store.getBoard(boardId);
  if (!board) return;
  for (const change of changes) {
    if (change.to !== 'ready') continue;
    const task = tasks.find((t) => t.id === change.id);
    if (!task) continue;
    void notifyTaskOwner(board, task, triggerReason).catch((error) =>
      console.error('[slack] notification failed', error),
    );
  }
}

/**
 * Insert or update a task, recalculate dependency statuses for the whole
 * board, persist, and notify owners of any newly-ready tasks.
 */
export function upsertTask(
  boardId: string,
  task: TaskCard,
  triggerReason?: string,
): TaskUpdateResult | null {
  const board = store.getBoard(boardId);
  if (!board) return null;

  const exists = board.tasks.some((t) => t.id === task.id);
  const merged = exists
    ? board.tasks.map((t) => (t.id === task.id ? task : t))
    : [...board.tasks, task];

  const { tasks, changes } = recalculateDependencies(merged);
  store.replaceTasks(boardId, tasks);

  for (const change of changes) {
    console.log(`[deps] "${change.title}": ${change.from} → ${change.to}`);
  }
  notifyReadyChanges(
    boardId,
    tasks,
    changes,
    triggerReason ?? `"${task.title}" is now ${task.status}`,
  );
  return { tasks, changes };
}

/** Delete a task, clean up references to it, recalculate, notify. */
export function deleteTask(
  boardId: string,
  taskId: string,
): TaskUpdateResult | null {
  const board = store.getBoard(boardId);
  if (!board) return null;
  const target = board.tasks.find((t) => t.id === taskId);
  if (!target) return { tasks: board.tasks, changes: [] };

  const remaining = board.tasks
    .filter((t) => t.id !== taskId)
    .map((t) =>
      t.dependsOn.includes(taskId)
        ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== taskId) }
        : t,
    );
  const { tasks, changes } = recalculateDependencies(remaining);
  store.replaceTasks(boardId, tasks);
  notifyReadyChanges(
    boardId,
    tasks,
    changes,
    `"${target.title}" was removed from the board`,
  );
  return { tasks, changes };
}

/** Manual reminder: DM the owner now and note it in the task's activity. */
export async function remindTask(
  boardId: string,
  taskId: string,
): Promise<TaskUpdateResult | null> {
  const board = store.getBoard(boardId);
  const task = board?.tasks.find((t) => t.id === taskId);
  if (!board || !task) return null;

  const record = await notifyTaskOwner(
    board,
    task,
    'Manual reminder sent from LaunchPad',
  );

  const updated: TaskCard = {
    ...task,
    activity: [
      ...task.activity,
      {
        id: `${task.id}-a${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: `Slack reminder ${record.mode === 'sent' || record.mode === 'redirected' ? 'sent' : `recorded (${record.mode})`} for ${record.intended_owner}`,
      },
    ],
  };
  const merged = board.tasks.map((t) => (t.id === taskId ? updated : t));
  store.replaceTasks(boardId, merged);
  return { tasks: merged, changes: [] };
}
