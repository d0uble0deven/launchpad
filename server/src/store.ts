import type {
  AppState,
  Employee,
  OnboardingBoard,
  TaskCard,
  Template,
} from '../../src/types/board';
import { db } from './db';

export type NotificationRecord = {
  id: number;
  board_id: string;
  task_id: string;
  task_title: string;
  intended_owner: string;
  intended_user_id: string | null;
  delivered_to: string | null;
  mode: 'sent' | 'redirected' | 'dry-run' | 'skipped';
  reason: string;
  message_ts: string | null;
  created_at: string;
};

type Row = { data: string };

export function getTemplate(): Template {
  const row = db.prepare('SELECT data FROM template LIMIT 1').get() as Row;
  return JSON.parse(row.data) as Template;
}

export function putTemplate(template: Template): void {
  db.prepare('DELETE FROM template').run();
  db.prepare('INSERT INTO template (id, data) VALUES (?, ?)').run(
    template.id,
    JSON.stringify(template),
  );
}

export function getEmployees(): Employee[] {
  const rows = db.prepare('SELECT data FROM employees').all() as Row[];
  return rows.map((row) => JSON.parse(row.data) as Employee);
}

export function getEmployee(id: string): Employee | null {
  const row = db
    .prepare('SELECT data FROM employees WHERE id = ?')
    .get(id) as Row | undefined;
  return row ? (JSON.parse(row.data) as Employee) : null;
}

export function getBoard(boardId: string): OnboardingBoard | null {
  const board = db
    .prepare('SELECT id, employee_id, phases, swimlanes FROM boards WHERE id = ?')
    .get(boardId) as
    | { id: string; employee_id: string; phases: string; swimlanes: string }
    | undefined;
  if (!board) return null;
  const tasks = db
    .prepare('SELECT data FROM tasks WHERE board_id = ?')
    .all(boardId) as Row[];
  return {
    id: board.id,
    employeeId: board.employee_id,
    phases: JSON.parse(board.phases),
    swimlanes: JSON.parse(board.swimlanes),
    tasks: tasks.map((row) => JSON.parse(row.data) as TaskCard),
  };
}

export function getBoards(): OnboardingBoard[] {
  const ids = db.prepare('SELECT id FROM boards').all() as { id: string }[];
  return ids
    .map((row) => getBoard(row.id))
    .filter((board): board is OnboardingBoard => board !== null);
}

export function getState(): AppState {
  return {
    template: getTemplate(),
    employees: getEmployees(),
    boards: getBoards(),
  };
}

export function replaceTasks(boardId: string, tasks: TaskCard[]): void {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE board_id = ?').run(boardId);
    const insert = db.prepare(
      'INSERT INTO tasks (board_id, id, data) VALUES (?, ?, ?)',
    );
    for (const task of tasks) {
      insert.run(boardId, task.id, JSON.stringify(task));
    }
  });
  tx();
}

export function addHire(employee: Employee, board: OnboardingBoard): void {
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO employees (id, data) VALUES (?, ?)').run(
      employee.id,
      JSON.stringify(employee),
    );
    db.prepare(
      'INSERT INTO boards (id, employee_id, phases, swimlanes) VALUES (?, ?, ?, ?)',
    ).run(
      board.id,
      board.employeeId,
      JSON.stringify(board.phases),
      JSON.stringify(board.swimlanes),
    );
    const insert = db.prepare(
      'INSERT INTO tasks (board_id, id, data) VALUES (?, ?, ?)',
    );
    for (const task of board.tasks) {
      insert.run(board.id, task.id, JSON.stringify(task));
    }
  });
  tx();
}

export function insertNotification(
  record: Omit<NotificationRecord, 'id' | 'created_at'>,
): NotificationRecord {
  const created_at = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO slack_notifications
        (board_id, task_id, task_title, intended_owner, intended_user_id,
         delivered_to, mode, reason, message_ts, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.board_id,
      record.task_id,
      record.task_title,
      record.intended_owner,
      record.intended_user_id,
      record.delivered_to,
      record.mode,
      record.reason,
      record.message_ts,
      created_at,
    );
  return { ...record, id: Number(result.lastInsertRowid), created_at };
}

export function listNotifications(
  boardId: string,
  taskId?: string,
): NotificationRecord[] {
  if (taskId) {
    return db
      .prepare(
        'SELECT * FROM slack_notifications WHERE board_id = ? AND task_id = ? ORDER BY id DESC',
      )
      .all(boardId, taskId) as NotificationRecord[];
  }
  return db
    .prepare(
      'SELECT * FROM slack_notifications WHERE board_id = ? ORDER BY id DESC',
    )
    .all(boardId) as NotificationRecord[];
}
