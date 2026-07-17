import 'dotenv/config';

function parseOwnerMap(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const [lane, userId] = pair.split('=').map((s) => s.trim());
    if (lane && userId) map[lane] = userId;
  }
  return map;
}

function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  dbPath: process.env.DATABASE_PATH ?? './data/launchpad.db',
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173',
  slack: {
    enabled: process.env.SLACK_ENABLED === 'true',
    botToken: process.env.SLACK_BOT_TOKEN ?? '',
    appToken: process.env.SLACK_APP_TOKEN ?? '',
    signingSecret: process.env.SLACK_SIGNING_SECRET ?? '',
    allowlist: parseList(process.env.SLACK_DM_ALLOWLIST ?? ''),
    redirectTo: (process.env.SLACK_REDIRECT_TO ?? '').trim(),
    testMode: process.env.SLACK_TEST_MODE !== 'false',
    ownerMap: parseOwnerMap(process.env.OWNER_SLACK_MAP ?? ''),
  },
};
