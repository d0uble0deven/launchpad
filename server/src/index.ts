import express from 'express';
import { config } from './env';
import { routes } from './routes';
import { registerActions } from './slack/actions';
import { slackApp, startSlack } from './slack/bolt';
import { registerSlashCommand } from './slack/commands';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.listen(config.port, () => {
  console.log(`[api] LaunchPad server listening on http://localhost:${config.port}`);
});

if (slackApp) {
  registerActions(slackApp);
  registerSlashCommand(slackApp);
}
void startSlack().catch((error) => {
  console.error('[slack] failed to start', error);
});
