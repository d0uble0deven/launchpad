import type { Employee, OnboardingBoard, TaskCard } from '../../../src/types/board';
import { config } from '../env';
import * as store from '../store';
import type { NotificationRecord } from '../store';
import { slackApp } from './bolt';

type Delivery =
  | { mode: 'sent'; to: string }
  | { mode: 'redirected'; to: string }
  | { mode: 'dry-run' | 'skipped'; to: null };

/**
 * The safety guard every outgoing DM passes through:
 * - Slack disabled (or no Bolt app)      → dry-run, nothing sent
 * - owner lane has no Slack mapping      → skipped
 * - user on the allowlist                → sent directly to them
 * - otherwise, redirect target set       → redirected to the tester
 * - otherwise                            → skipped (logged, never sent)
 */
function resolveDelivery(intendedUserId: string | null): Delivery {
  if (!slackApp) return { mode: 'dry-run', to: null };
  if (!intendedUserId) return { mode: 'skipped', to: null };
  if (config.slack.allowlist.includes(intendedUserId)) {
    return { mode: 'sent', to: intendedUserId };
  }
  if (config.slack.redirectTo) {
    return { mode: 'redirected', to: config.slack.redirectTo };
  }
  return { mode: 'skipped', to: null };
}

type MessageContext = {
  board: OnboardingBoard;
  employee: Employee;
  task: TaskCard;
  reason: string;
  ownerLabel: string;
  delivery: Delivery;
};

function buildBlocks(ctx: MessageContext): unknown[] {
  const blocks: unknown[] = [];
  if (ctx.delivery.mode === 'redirected') {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🧪 *Test redirect* — this message would have gone to *${ctx.ownerLabel}*`,
        },
      ],
    });
  } else if (config.slack.testMode) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '🧪 *LaunchPad test* — not a real notification yet' }],
    });
  }
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Task ready:* ${ctx.task.title}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: [
            `Hire: *${ctx.employee.name}*`,
            ctx.task.dueTiming ? `Due: ${ctx.task.dueTiming}` : null,
            `Owner: ${ctx.ownerLabel}`,
          ]
            .filter(Boolean)
            .join(' · '),
        },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `Why: ${ctx.reason}` },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Open Task' },
          url: `${config.appBaseUrl}/board/${ctx.employee.id}?task=${ctx.task.id}`,
          action_id: 'lp_open_task',
        },
        {
          type: 'button',
          style: 'primary',
          text: { type: 'plain_text', text: 'Mark Done' },
          action_id: 'lp_mark_done',
          value: JSON.stringify({ b: ctx.board.id, t: ctx.task.id }),
        },
        {
          type: 'button',
          style: 'danger',
          text: { type: 'plain_text', text: 'Mark Blocked' },
          action_id: 'lp_mark_blocked',
          value: JSON.stringify({ b: ctx.board.id, t: ctx.task.id }),
        },
      ],
    },
  );
  return blocks;
}

/**
 * Notify a task's owner that the task needs attention. Used both for
 * automatic "task became ready" notifications and manual reminders.
 * Always records the outcome in slack_notifications, whatever the mode.
 */
export async function notifyTaskOwner(
  board: OnboardingBoard,
  task: TaskCard,
  reason: string,
): Promise<NotificationRecord> {
  const employee = store.getEmployee(board.employeeId);
  const ownerLabel =
    board.swimlanes.find((lane) => lane.id === task.ownerId)?.label ??
    task.ownerId;
  const intendedUserId = config.slack.ownerMap[task.ownerId] ?? null;
  const delivery = resolveDelivery(intendedUserId);

  const base = {
    board_id: board.id,
    task_id: task.id,
    task_title: task.title,
    intended_owner: ownerLabel,
    intended_user_id: intendedUserId,
    delivered_to: delivery.to,
    mode: delivery.mode,
    reason,
    message_ts: null as string | null,
  };

  if (delivery.mode === 'dry-run') {
    console.log(
      `[slack] DRY-RUN — would DM ${ownerLabel}${intendedUserId ? ` (${intendedUserId})` : ''}: ` +
        `"${task.title}" for ${employee?.name ?? board.employeeId} — ${reason}`,
    );
    return store.insertNotification(base);
  }

  if (delivery.mode === 'skipped') {
    const why = intendedUserId
      ? 'not on SLACK_DM_ALLOWLIST and no SLACK_REDIRECT_TO set'
      : `no Slack mapping for owner "${ownerLabel}"`;
    console.log(`[slack] SKIPPED DM for "${task.title}" — ${why}`);
    return store.insertNotification({ ...base, reason: `${reason} (${why})` });
  }

  if (!employee) {
    console.warn(`[slack] no employee found for board ${board.id}`);
    return store.insertNotification({ ...base, mode: 'skipped' });
  }

  const blocks = buildBlocks({
    board,
    employee,
    task,
    reason,
    ownerLabel,
    delivery,
  });

  const result = await slackApp!.client.chat.postMessage({
    channel: delivery.to!,
    text: `Task ready: ${task.title} (${employee.name})`,
    blocks: blocks as never,
  });
  console.log(
    `[slack] ${delivery.mode === 'redirected' ? `REDIRECTED (intended ${ownerLabel})` : 'SENT'} → ${delivery.to}: "${task.title}"`,
  );
  return store.insertNotification({
    ...base,
    message_ts: (result.ts as string) ?? null,
  });
}
