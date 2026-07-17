import type { App } from '@slack/bolt';
import { config } from '../../env';
import { handleLaunchPadCommand } from './handlers';

/**
 * Registers the /launchpad slash command (Socket Mode — no Request URL or
 * signature verification needed; the connection is authenticated by the app
 * token).
 *
 * Invoker gate: while SLACK_DM_ALLOWLIST is non-empty, only listed users can
 * run commands — anyone else who discovers /launchpad in the autocomplete
 * gets a quiet "private testing" reply. All responses are ephemeral.
 */
export function registerSlashCommand(app: App): void {
  app.command('/launchpad', async ({ command, ack, respond }) => {
    await ack();

    const allowlist = config.slack.allowlist;
    if (allowlist.length > 0 && !allowlist.includes(command.user_id)) {
      console.log(
        `[slack-cmd] blocked invoker ${command.user_id} (not on SLACK_DM_ALLOWLIST)`,
      );
      await respond({
        response_type: 'ephemeral',
        text: 'LaunchPad is in private testing.',
      });
      return;
    }

    const response = handleLaunchPadCommand({
      text: command.text ?? '',
      userId: command.user_id,
      userName: command.user_name,
    });
    await respond(response as never);
  });
}
