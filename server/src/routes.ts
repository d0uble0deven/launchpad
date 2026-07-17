import { Router } from 'express';
import { buildMockData } from '../../src/data/mockData';
import { generateBoardForEmployee } from '../../src/logic/generateBoard';
import type { Employee, TaskCard, Template } from '../../src/types/board';
import { replaceAllData } from './db';
import * as store from './store';
import { deleteTask, remindTask, upsertTask } from './taskService';

export const routes = Router();

routes.get('/state', (_req, res) => {
  res.json(store.getState());
});

routes.patch('/boards/:boardId/tasks/:taskId', (req, res) => {
  const task = req.body?.task as TaskCard | undefined;
  if (!task || task.id !== req.params.taskId) {
    res.status(400).json({ error: 'body must contain the updated task' });
    return;
  }
  const result = upsertTask(req.params.boardId, task);
  if (!result) {
    res.status(404).json({ error: 'board not found' });
    return;
  }
  res.json(result);
});

routes.post('/boards/:boardId/tasks', (req, res) => {
  const task = req.body?.task as TaskCard | undefined;
  if (!task?.id) {
    res.status(400).json({ error: 'body must contain the new task' });
    return;
  }
  const result = upsertTask(req.params.boardId, task);
  if (!result) {
    res.status(404).json({ error: 'board not found' });
    return;
  }
  res.json(result);
});

routes.delete('/boards/:boardId/tasks/:taskId', (req, res) => {
  const result = deleteTask(req.params.boardId, req.params.taskId);
  if (!result) {
    res.status(404).json({ error: 'board not found' });
    return;
  }
  res.json(result);
});

routes.post('/boards/:boardId/tasks/:taskId/remind', async (req, res) => {
  const result = await remindTask(req.params.boardId, req.params.taskId);
  if (!result) {
    res.status(404).json({ error: 'board or task not found' });
    return;
  }
  res.json(result);
});

routes.get('/notifications', (req, res) => {
  const boardId = String(req.query.boardId ?? '');
  if (!boardId) {
    res.status(400).json({ error: 'boardId is required' });
    return;
  }
  const taskId = req.query.taskId ? String(req.query.taskId) : undefined;
  res.json({ notifications: store.listNotifications(boardId, taskId) });
});

routes.post('/hires', (req, res) => {
  const employee = req.body?.employee as Employee | undefined;
  if (!employee?.id || !employee.name) {
    res.status(400).json({ error: 'body must contain the employee' });
    return;
  }
  const template = store.getTemplate();
  const { board, notes } = generateBoardForEmployee(employee, template);
  store.addHire(employee, board);
  console.log(
    `[api] created hire ${employee.name} with ${board.tasks.length} tasks (${notes.length} auto-adjusted)`,
  );
  res.json({ employee, board, notes });
});

routes.put('/template', (req, res) => {
  const template = req.body?.template as Template | undefined;
  if (!template?.id || !Array.isArray(template.tasks)) {
    res.status(400).json({ error: 'body must contain the template' });
    return;
  }
  store.putTemplate(template);
  res.json({ template });
});

routes.post('/reset', (_req, res) => {
  console.log('[api] resetting all data to mock data');
  replaceAllData(buildMockData());
  res.json(store.getState());
});
