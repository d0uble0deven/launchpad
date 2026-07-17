import { getFirstReadyTask } from '../../../../src/logic/boardNavigation';
import {
  getCurrentBlocker,
  getNextActionableTask,
  orderTasksByPhase,
  summarizeBoard,
} from '../../../../src/logic/progress';
import type { Employee, OnboardingBoard } from '../../../../src/types/board';
import { config } from '../../env';
import * as store from '../../store';
import type { BlockerRow, CommandResponse, TaskGroup } from './formatters';
import {
  formatAmbiguousResponse,
  formatBlockersResponse,
  formatHelpResponse,
  formatMyTasksResponse,
  formatNoMatchResponse,
  formatOpenResponse,
  formatStatusResponse,
  formatUnknownResponse,
} from './formatters';
import { parseLaunchPadCommand } from './parser';

export type CommandContext = {
  text: string;
  userId: string;
  userName?: string;
};

export function findEmployeesByName(
  query: string,
  employees: Employee[],
): Employee[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(q) ||
      (employee.preferredName ?? '').toLowerCase().includes(q),
  );
}

/** Reverse lookup of OWNER_SLACK_MAP: which lanes belong to this Slack user. */
export function lanesForSlackUser(userId: string): string[] {
  return Object.entries(config.slack.ownerMap)
    .filter(([, slackId]) => slackId === userId)
    .map(([lane]) => lane);
}

function boardFor(employeeId: string): OnboardingBoard | null {
  return store.getBoards().find((b) => b.employeeId === employeeId) ?? null;
}

/** Resolves a name query to exactly one employee, or a helpful error reply. */
function resolveEmployee(
  query: string,
  usage: string,
): { employee: Employee; board: OnboardingBoard } | CommandResponse {
  const employees = store.getEmployees();
  if (!query.trim()) {
    return { response_type: 'ephemeral', text: `Usage: \`${usage}\`` };
  }
  const matches = findEmployeesByName(query, employees);
  if (matches.length === 0) return formatNoMatchResponse(query, employees);
  if (matches.length > 1) return formatAmbiguousResponse(query, matches);
  const employee = matches[0]!;
  const board = boardFor(employee.id);
  if (!board) {
    return {
      response_type: 'ephemeral',
      text: `No onboarding board found for ${employee.name}.`,
    };
  }
  return { employee, board };
}

function isResponse(
  value: { employee: Employee } | CommandResponse,
): value is CommandResponse {
  return 'response_type' in value;
}

function handleStatus(query: string): CommandResponse {
  const resolved = resolveEmployee(query, '/launchpad status <name>');
  if (isResponse(resolved)) return resolved;
  const { employee, board } = resolved;

  const summary = summarizeBoard(employee, board);
  const blockerTask = getCurrentBlocker(board, employee);
  const blockerOwner = blockerTask
    ? (board.swimlanes.find((lane) => lane.id === blockerTask.ownerId)?.label ??
      blockerTask.ownerId)
    : null;
  const nextReady = getFirstReadyTask(board) ?? getNextActionableTask(board);
  return formatStatusResponse({
    employee,
    summary,
    blockerTask,
    blockerOwner,
    nextReadyTitle: nextReady?.title ?? null,
  });
}

function handleBlockers(query: string): CommandResponse {
  const employees = store.getEmployees();
  let targets = employees;
  let queried: Employee | undefined;

  if (query.trim()) {
    const matches = findEmployeesByName(query, employees);
    if (matches.length === 0) return formatNoMatchResponse(query, employees);
    if (matches.length > 1) return formatAmbiguousResponse(query, matches);
    targets = matches;
    queried = matches[0];
  }

  const rows: BlockerRow[] = [];
  for (const employee of targets) {
    const board = boardFor(employee.id);
    if (!board) continue;
    // Skip completed onboardings in the all-hires view.
    if (!queried && summarizeBoard(employee, board).flags.completed) continue;
    const blocker = getCurrentBlocker(board, employee);
    if (!blocker) continue;
    rows.push({
      employee,
      blocker,
      ownerLabel:
        board.swimlanes.find((lane) => lane.id === blocker.ownerId)?.label ??
        blocker.ownerId,
    });
  }
  return formatBlockersResponse(rows, query.trim() || null, queried);
}

function handleMyTasks(userId: string): CommandResponse {
  const lanes = lanesForSlackUser(userId);
  if (lanes.length === 0) {
    return {
      response_type: 'ephemeral',
      text:
        "You're not mapped to a LaunchPad owner yet. " +
        'Add your Slack member ID to OWNER_SLACK_MAP in the server `.env` ' +
        '(e.g. `melissa=U0123ABC`), then restart the server.',
    };
  }

  const groups: TaskGroup[] = [];
  const laneLabels = new Set<string>();
  for (const employee of store.getEmployees()) {
    const board = boardFor(employee.id);
    if (!board) continue;
    for (const lane of board.swimlanes) {
      if (lanes.includes(lane.id)) laneLabels.add(lane.label);
    }
    const tasks = orderTasksByPhase(board)
      .filter(
        (task) =>
          lanes.includes(task.ownerId) &&
          (task.status === 'ready' || task.status === 'in-progress'),
      )
      .map((task) => ({ task, boardId: board.id }));
    if (tasks.length > 0) groups.push({ employee, tasks });
  }
  return formatMyTasksResponse(
    groups,
    laneLabels.size > 0 ? [...laneLabels] : lanes,
  );
}

function handleOpen(query: string): CommandResponse {
  const resolved = resolveEmployee(query, '/launchpad open <name>');
  if (isResponse(resolved)) return resolved;
  return formatOpenResponse(resolved.employee);
}

export function handleLaunchPadCommand(ctx: CommandContext): CommandResponse {
  const parsed = parseLaunchPadCommand(ctx.text);
  console.log(
    `[slack-cmd] action=${parsed.action} args=[${parsed.args.join(' ')}] user=${ctx.userId}${ctx.userName ? ` (${ctx.userName})` : ''}`,
  );
  switch (parsed.action) {
    case 'help':
      return formatHelpResponse();
    case 'my_tasks':
      return handleMyTasks(ctx.userId);
    case 'status':
      return handleStatus(parsed.args.join(' '));
    case 'blockers':
      return handleBlockers(parsed.args.join(' '));
    case 'open':
      return handleOpen(parsed.args.join(' '));
    default:
      return formatUnknownResponse(parsed.raw);
  }
}
