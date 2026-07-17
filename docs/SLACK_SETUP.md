# LaunchPad — Slack App Setup

How to create the LaunchPad Slack app and connect it to the server. All of
this happens in the Slack app dashboard at **https://api.slack.com/apps** —
takes about 10 minutes. Nothing here announces the app to anyone: it has no
slash commands, posts no channel messages, and only ever DMs users you have
explicitly allowlisted (see [GO_LIVE.md](GO_LIVE.md)).

> You can build and test almost everything **without doing any of this** —
> with `SLACK_ENABLED=false` the server runs in dry-run mode: every would-be
> DM is printed to the terminal and recorded in the task's notification
> history instead of being sent.

## 1 — Create the app

1. Go to https://api.slack.com/apps → **Create New App** → **From an app manifest**.
2. Pick the workspace.
3. Paste this manifest (YAML tab):

```yaml
display_information:
  name: LaunchPad
  description: Onboarding task notifications
features:
  bot_user:
    display_name: LaunchPad
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write        # send DMs
      - im:write          # open DM conversations
      - users:read        # resolve who clicked a button
      - users:read.email  # map owners to Slack accounts by email (go-live)
settings:
  interactivity:
    is_enabled: true      # required for the Mark Done / Mark Blocked buttons
  socket_mode_enabled: true
```

4. **Create** → review the summary → **Install to Workspace** → **Allow**.

> Socket Mode means the server opens an *outbound* connection to Slack — no
> public URL, no ngrok, nothing reachable from the internet during dev.

## 2 — Collect the three credentials

| Credential | Where to find it | Env var |
|---|---|---|
| Bot token (`xoxb-…`) | **OAuth & Permissions** → Bot User OAuth Token | `SLACK_BOT_TOKEN` |
| App token (`xapp-…`) | **Basic Information** → App-Level Tokens → **Generate Token** with scope `connections:write` | `SLACK_APP_TOKEN` |
| Signing secret | **Basic Information** → App Credentials | `SLACK_SIGNING_SECRET` |

Put them in `.env` (copy `.env.example` first). **Never commit `.env`.**

## 3 — Map owners to Slack users

Board swimlanes are mapped to Slack user IDs via `OWNER_SLACK_MAP`:

```
OWNER_SLACK_MAP=melissa=U0123ABC,paras=U0456DEF,justin=
```

- Find a user ID: their Slack profile → **⋮** → **Copy member ID**.
- Lanes with an empty value are **skipped** (recorded in the task's
  notification history as `skipped — no Slack mapping`).
- The `employee` lane usually stays unmapped — the hire's Slack account is
  created *by* the onboarding process. The `automation` lane has no human.
- **While testing, map every lane to your own user ID** is *not* needed —
  use the redirect instead (see GO_LIVE.md), which keeps the real mapping
  and reroutes delivery.

## 4 — Turn it on

```
SLACK_ENABLED=true
SLACK_DM_ALLOWLIST=U0YOURID       # who may receive their own DMs
SLACK_REDIRECT_TO=U0YOURID        # everyone else's DMs come to you, labeled
SLACK_TEST_MODE=true              # 🧪 banner on every message
```

Restart the server (`npm run server`). You should see:

```
[slack] connected via Socket Mode
```

Then send yourself a test message: open any task in the web app → **Send
Slack Reminder**. It should arrive as a DM from LaunchPad within a second or
two, with working **Mark Done / Mark Blocked** buttons.

## 5 — Production notes (later)

- Resolve real owner IDs by email with `users.lookupByEmail` (scope already
  granted) instead of hand-copying member IDs.
- If the server ever moves off Socket Mode (public HTTPS host): disable
  Socket Mode and set **Interactivity → Request URL** to
  `https://<host>/slack/events`.
- If a channel digest is added later, the bot must be invited:
  `/invite @LaunchPad`.
