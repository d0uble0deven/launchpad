import type { App, BlockAction, ButtonAction } from '@slack/bolt';
import type { TaskStatus } from '../../../src/types/board';
import { STATUS_LABELS } from '../../../src/types/board';
import * as store from '../store';
import { upsertTask } from '../taskService';

/**
 * Handles the Mark Done / Mark Blocked buttons on notification DMs.
 * Runs the exact same update path as the web app (including dependency
 * recalculation, which may trigger further notifications), then replaces
 * the original message with a resolution banner.
 */
function makeStatusHandler(status: TaskStatus) {
  return async ({
    ack,
    body,
    action,
    client,
    respond,
  }: {
    ack: () => Promise<void>;
    body: BlockAction;
    action: ButtonAction;
    client: {
      users: {
        info: (args: { user: string }) => Promise<{
          user?: { real_name?: string; name?: string };
        }>;
      };
    };
    respond: (args: {
      replace_original: boolean;
      text: string;
      blocks?: unknown[];
    }) => Promise<unknown>;
  }) => {
    await ack();
    const { b: boardId, t: taskId } = JSON.parse(action.value ?? '{}') as {
      b: string;
      t: string;
    };

    const board = store.getBoard(boardId);
    const task = board?.tasks.find((t) => t.id === taskId);
    if (!board || !task) {
      await respond({
        replace_original: false,
        text: 'This task no longer exists in LaunchPad.',
      });
      return;
    }

    // Who clicked, and were they the intended owner? (test redirects)
    let actorName = body.user.id;
    try {
      const info = await client.users.info({ user: body.user.id });
      actorName = info.user?.real_name ?? info.user?.name ?? body.user.id;
    } catch {
      // users:read scope missing or lookup failed — fall back to the id.
    }
    const lastNotification = store
      .listNotifications(boardId, taskId)
      .find((n) => n.mode === 'sent' || n.mode === 'redirected');
    const redirectNote =
      lastNotification?.mode === 'redirected'
        ? ` (test redirect; intended for ${lastNotification.intended_owner})`
        : '';

    const label = STATUS_LABELS[status];
    const updated = {
      ...task,
      status,
      activity: [
        ...task.activity,
        {
          id: `${task.id}-a${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: `Marked ${label} via Slack by ${actorName}${redirectNote}`,
        },
      ],
    };
    upsertTask(boardId, updated, `"${task.title}" was marked ${label} from Slack`);
    console.log(`[slack] "${task.title}" marked ${label} by ${actorName}`);

    const emoji = status === 'done' ? '✅' : '🛑';
    await respond({
      replace_original: true,
      text: `${emoji} ${task.title} — marked ${label} by ${actorName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${task.title}*\nMarked *${label}* by ${actorName}${redirectNote}`,
          },
        },
      ],
    });
  };
}

export function registerActions(app: App): void {
  app.action('lp_mark_done', makeStatusHandler('done') as never);
  app.action('lp_mark_blocked', makeStatusHandler('blocked') as never);
  // "Open Task" is a URL button; Slack still sends an action event that
  // must be acknowledged to avoid a warning icon.
  app.action('lp_open_task', async ({ ack }) => {
    await ack();
  });
}
