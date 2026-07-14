import type { TaskCard, TaskStatus } from '../types/board';

export type DependencyChange = {
  id: string;
  title: string;
  from: TaskStatus;
  to: TaskStatus;
};

/** Statuses that satisfy a dependency (N/A tasks shouldn't block anyone). */
const SATISFIED: readonly TaskStatus[] = ['done', 'na'];

/**
 * Recomputes dependency-derived statuses after a status change:
 * - blocked task whose dependencies are all satisfied → ready
 * - not-started/ready task with an unsatisfied dependency → blocked
 * In-progress, done, and N/A tasks are never touched, and neither are tasks
 * without dependencies (so a manually blocked independent task stays blocked).
 */
export function recalculateDependencies(tasks: TaskCard[]): {
  tasks: TaskCard[];
  changes: DependencyChange[];
} {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const changes: DependencyChange[] = [];

  const next = tasks.map((task) => {
    if (task.dependsOn.length === 0) return task;

    const satisfied = task.dependsOn.every((id) => {
      const dep = byId.get(id);
      return !dep || SATISFIED.includes(dep.status);
    });

    let to: TaskStatus | null = null;
    if (satisfied && task.status === 'blocked') to = 'ready';
    if (!satisfied && (task.status === 'not-started' || task.status === 'ready')) {
      to = 'blocked';
    }
    if (!to) return task;

    changes.push({ id: task.id, title: task.title, from: task.status, to });
    return {
      ...task,
      status: to,
      activity: [
        ...task.activity,
        {
          id: `${task.id}-a${Date.now()}`,
          timestamp: new Date().toISOString(),
          message:
            to === 'ready'
              ? 'Unblocked — all dependencies done'
              : 'Blocked by incomplete dependencies',
        },
      ],
    };
  });

  return { tasks: next, changes };
}
