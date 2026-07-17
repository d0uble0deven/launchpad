import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { buildMockData } from '../../src/data/mockData';
import type { AppState } from '../../src/types/board';
import { config } from './env';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS template (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    phases TEXT NOT NULL,
    swimlanes TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    board_id TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (board_id, id)
  );
  CREATE TABLE IF NOT EXISTS slack_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    intended_owner TEXT NOT NULL,
    intended_user_id TEXT,
    delivered_to TEXT,
    mode TEXT NOT NULL,
    reason TEXT NOT NULL,
    message_ts TEXT,
    created_at TEXT NOT NULL
  );
`);

export function replaceAllData(state: AppState): void {
  const tx = db.transaction((s: AppState) => {
    db.prepare('DELETE FROM template').run();
    db.prepare('DELETE FROM employees').run();
    db.prepare('DELETE FROM boards').run();
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM slack_notifications').run();

    db.prepare('INSERT INTO template (id, data) VALUES (?, ?)').run(
      s.template.id,
      JSON.stringify(s.template),
    );
    const insertEmployee = db.prepare(
      'INSERT INTO employees (id, data) VALUES (?, ?)',
    );
    for (const employee of s.employees) {
      insertEmployee.run(employee.id, JSON.stringify(employee));
    }
    const insertBoard = db.prepare(
      'INSERT INTO boards (id, employee_id, phases, swimlanes) VALUES (?, ?, ?, ?)',
    );
    const insertTask = db.prepare(
      'INSERT INTO tasks (board_id, id, data) VALUES (?, ?, ?)',
    );
    for (const board of s.boards) {
      insertBoard.run(
        board.id,
        board.employeeId,
        JSON.stringify(board.phases),
        JSON.stringify(board.swimlanes),
      );
      for (const task of board.tasks) {
        insertTask.run(board.id, task.id, JSON.stringify(task));
      }
    }
  });
  tx(state);
}

const employeeCount = db
  .prepare('SELECT COUNT(*) AS n FROM employees')
  .get() as { n: number };
if (employeeCount.n === 0) {
  console.log('[db] empty database — seeding mock data');
  replaceAllData(buildMockData());
}
