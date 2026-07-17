import type {
  AppState,
  Employee,
  OnboardingBoard,
  TaskCard,
  Template,
} from '../types/board';

export type DependencyChangeDto = {
  id: string;
  title: string;
  from: string;
  to: string;
};

export type TaskUpdateResponse = {
  tasks: TaskCard[];
  changes: DependencyChangeDto[];
};

export type SlackNotification = {
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API ${init?.method ?? 'GET'} ${path} failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
}

export const api = {
  fetchState: () => request<AppState>('/state'),

  patchTask: (boardId: string, task: TaskCard) =>
    request<TaskUpdateResponse>(`/boards/${boardId}/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ task }),
    }),

  createTask: (boardId: string, task: TaskCard) =>
    request<TaskUpdateResponse>(`/boards/${boardId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ task }),
    }),

  deleteTask: (boardId: string, taskId: string) =>
    request<TaskUpdateResponse>(`/boards/${boardId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  remindTask: (boardId: string, taskId: string) =>
    request<TaskUpdateResponse>(`/boards/${boardId}/tasks/${taskId}/remind`, {
      method: 'POST',
    }),

  listNotifications: (boardId: string, taskId: string) =>
    request<{ notifications: SlackNotification[] }>(
      `/notifications?boardId=${encodeURIComponent(boardId)}&taskId=${encodeURIComponent(taskId)}`,
    ),

  addHire: (employee: Employee) =>
    request<{ employee: Employee; board: OnboardingBoard }>('/hires', {
      method: 'POST',
      body: JSON.stringify({ employee }),
    }),

  putTemplate: (template: Template) =>
    request<{ template: Template }>('/template', {
      method: 'PUT',
      body: JSON.stringify({ template }),
    }),

  reset: () => request<AppState>('/reset', { method: 'POST' }),
};
