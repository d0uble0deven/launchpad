import type { EmployeeSummary } from '../../../../src/logic/progress';
import type { Employee, TaskCard } from '../../../../src/types/board';
import { STATUS_LABELS } from '../../../../src/types/board';
import { config } from '../../env';

export type CommandResponse = {
  response_type: 'ephemeral';
  text: string;
  blocks?: unknown[];
};

function ephemeral(text: string, blocks?: unknown[]): CommandResponse {
  return blocks
    ? { response_type: 'ephemeral', text, blocks }
    : { response_type: 'ephemeral', text };
}

const HELP_TEXT = [
  '*LaunchPad commands*',
  '• `/launchpad help` — this list',
  '• `/launchpad my tasks` — your actionable tasks across all hires',
  '• `/launchpad status <name>` — onboarding summary for a hire',
  '• `/launchpad blockers [name]` — current blockers (all hires, or one)',
  "• `/launchpad open <name>` — link to a hire's board",
  '_Coming later: ready, task, done, blocked, note, remind, digest._',
].join('\n');

export function formatHelpResponse(): CommandResponse {
  return ephemeral(HELP_TEXT);
}

export function formatUnknownResponse(raw: string): CommandResponse {
  return ephemeral(`Unknown command: \`${raw}\`\n\n${HELP_TEXT}`);
}

export function formatNoMatchResponse(
  query: string,
  employees: Employee[],
): CommandResponse {
  const names = employees.map((e) => e.name).join(', ');
  return ephemeral(
    `No hire matching *${query}*. Current hires: ${names || 'none'}.`,
  );
}

export function formatAmbiguousResponse(
  query: string,
  matches: Employee[],
): CommandResponse {
  const names = matches.map((e) => `• ${e.name} — ${e.role}`).join('\n');
  return ephemeral(
    `*${query}* matches more than one hire — be more specific:\n${names}`,
  );
}

export function formatOpenResponse(employee: Employee): CommandResponse {
  const url = `${config.appBaseUrl}/board/${employee.id}`;
  return ephemeral(
    `*${employee.name}* — ${employee.role}\n<${url}|Open LaunchPad board>`,
  );
}

export function formatStatusResponse(input: {
  employee: Employee;
  summary: EmployeeSummary;
  blockerTask: TaskCard | null;
  blockerOwner: string | null;
  nextReadyTitle: string | null;
}): CommandResponse {
  const { employee, summary, blockerTask, blockerOwner, nextReadyTitle } = input;
  const url = `${config.appBaseUrl}/board/${employee.id}`;
  const lines = [
    `*${employee.name}* — ${employee.role}`,
    `Overall: *${summary.overallPct}%* complete (step ${summary.currentStep} of ${summary.totalCount})`,
    blockerTask
      ? `Current blocker: "${blockerTask.title}"${blockerOwner ? ` — waiting on ${blockerOwner}` : ''}`
      : 'Current blocker: none',
    `Overdue tasks: ${summary.overdueCount}`,
    nextReadyTitle ? `Next task: ${nextReadyTitle}` : 'Next task: all done 🎉',
    `<${url}|Open board>`,
  ];
  return ephemeral(lines.join('\n'));
}

export type BlockerRow = {
  employee: Employee;
  blocker: TaskCard;
  ownerLabel: string;
};

export function formatBlockersResponse(
  rows: BlockerRow[],
  query: string | null,
  queriedEmployee?: Employee,
): CommandResponse {
  if (rows.length === 0) {
    return ephemeral(
      queriedEmployee
        ? `No current blocker for *${queriedEmployee.name}* 🎉`
        : 'No current blockers across active onboardings 🎉',
    );
  }
  const header = query
    ? `*Current blockers for ${queriedEmployee?.name ?? query}:*`
    : '*Current blockers:*';
  const lines = rows.map(
    (row) =>
      `• *${row.employee.name}* — "${row.blocker.title}" (waiting on ${row.ownerLabel})`,
  );
  return ephemeral([header, ...lines].join('\n'));
}

export type TaskGroup = {
  employee: Employee;
  tasks: Array<{ task: TaskCard; boardId: string }>;
};

const MAX_TASKS_WITH_BUTTONS = 8;

export function formatMyTasksResponse(
  groups: TaskGroup[],
  laneLabels: string[],
): CommandResponse {
  const totalTasks = groups.reduce((n, g) => n + g.tasks.length, 0);
  if (totalTasks === 0) {
    return ephemeral(
      `No actionable tasks for you right now (lanes: ${laneLabels.join(', ')}) 🎉`,
    );
  }

  const blocks: unknown[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Your LaunchPad tasks* — ${totalTasks} actionable (${laneLabels.join(', ')})`,
      },
    },
  ];
  const fallbackLines: string[] = [`Your LaunchPad tasks (${totalTasks}):`];

  let shown = 0;
  for (const group of groups) {
    for (const { task, boardId } of group.tasks) {
      fallbackLines.push(
        `• ${group.employee.name} — ${task.title} (${STATUS_LABELS[task.status]})`,
      );
      if (shown >= MAX_TASKS_WITH_BUTTONS) continue;
      shown += 1;
      const meta = [
        `Hire: ${group.employee.name}`,
        `Status: ${STATUS_LABELS[task.status]}`,
        task.dueTiming ? `Due: ${task.dueTiming}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      blocks.push(
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*${task.title}*\n${meta}` },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Open Task' },
              url: `${config.appBaseUrl}/board/${group.employee.id}?task=${task.id}`,
              action_id: 'lp_open_task',
            },
            {
              type: 'button',
              style: 'primary',
              text: { type: 'plain_text', text: 'Mark Done' },
              action_id: 'lp_mark_done',
              value: JSON.stringify({ b: boardId, t: task.id }),
            },
            {
              type: 'button',
              style: 'danger',
              text: { type: 'plain_text', text: 'Mark Blocked' },
              action_id: 'lp_mark_blocked',
              value: JSON.stringify({ b: boardId, t: task.id }),
            },
          ],
        },
      );
    }
  }

  if (totalTasks > MAX_TASKS_WITH_BUTTONS) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `…and ${totalTasks - MAX_TASKS_WITH_BUTTONS} more — open LaunchPad for the full list.`,
        },
      ],
    });
  }

  return ephemeral(fallbackLines.join('\n'), blocks);
}
