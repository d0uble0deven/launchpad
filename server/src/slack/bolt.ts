import { App } from '@slack/bolt';
import { config } from '../env';

/**
 * The Bolt app is only created when Slack is enabled AND credentials exist.
 * With SLACK_ENABLED=false the whole app runs in dry-run mode: no Slack API
 * calls are ever made.
 */
export const slackApp: App | null = (() => {
  if (!config.slack.enabled) {
    console.log('[slack] SLACK_ENABLED=false — running in dry-run mode');
    return null;
  }
  if (!config.slack.botToken || !config.slack.appToken) {
    console.warn(
      '[slack] SLACK_ENABLED=true but tokens are missing — falling back to dry-run mode',
    );
    return null;
  }
  return new App({
    token: config.slack.botToken,
    appToken: config.slack.appToken,
    signingSecret: config.slack.signingSecret,
    socketMode: true,
  });
})();

export async function startSlack(): Promise<void> {
  if (!slackApp) return;
  await slackApp.start();
  console.log('[slack] connected via Socket Mode');
}
