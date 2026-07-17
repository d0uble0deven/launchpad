# LaunchPad Slack — Quiet Rollout Ladder

LaunchPad's Slack integration is built to be developed and tested **without
anyone knowing it exists** until you decide otherwise. Nothing is announced:
no slash commands, no channel posts, DMs only — and only to people you have
explicitly allowed.

## The safety rails

Every outgoing DM passes through one guard, controlled entirely by `.env`:

| Variable | What it does |
|---|---|
| `SLACK_ENABLED` | Master switch. `false` = **dry-run**: no Slack API calls at all; would-be DMs are logged to the terminal and recorded in the task's notification history. |
| `SLACK_DM_ALLOWLIST` | Comma-separated Slack user IDs who may receive their own DMs directly. Everyone not on the list **never** gets a DM. |
| `SLACK_REDIRECT_TO` | Where non-allowlisted users' messages are delivered instead — with a "🧪 Test redirect — this message would have gone to *Melissa*" banner. Set it to your own ID to see every notification the system generates without pinging anyone. Leave blank to drop instead. |
| `SLACK_TEST_MODE` | Adds a 🧪 test disclaimer to every message (mirrors Watercooler's test-run behavior). |

Every notification — sent, redirected, dry-run, or skipped — is recorded in
the `slack_notifications` table and shown in the task modal's **Slack
Notifications** section, so you always have an audit trail of what *would*
have happened.

Buttons on redirected messages work, and the task activity log records the
truth: `Marked Done via Slack by Dev (test redirect; intended for Melissa)`.

## The ladder

### Rung 0 — build (no Slack at all)
```
SLACK_ENABLED=false
```
The full trigger chain runs — mark a prerequisite Done, watch the terminal:
`[slack] DRY-RUN — would DM Melissa: "Complete training" …` — and the
notification history fills in. Most of the integration is verifiable here.

### Rung 1 — solo test (only you get messages)
```
SLACK_ENABLED=true
SLACK_DM_ALLOWLIST=U0YOURID
SLACK_REDIRECT_TO=U0YOURID
SLACK_TEST_MODE=true
```
Real DMs, real buttons, full round trip — every owner's notifications land in
**your** DMs, labeled with who they were meant for. Nobody else can be
messaged, even by a bug: the allowlist is checked on every single send.

### Rung 2 — add testers, gradually
```
SLACK_DM_ALLOWLIST=U0YOURID,U0TESTER1,U0TESTER2
```
Testers now receive their own tasks' DMs; everyone else still redirects to
you. Optionally make a private `#launchpad-test` channel for coordinating —
the bot itself still never posts to channels.

### Rung 3 — go live
```
SLACK_DM_ALLOWLIST=        # empty = no direct sends…
SLACK_REDIRECT_TO=
SLACK_TEST_MODE=false
```
…so for launch, populate the allowlist with everyone (or flip the guard's
default once you're confident — one-line change in
`server/src/slack/notify.ts`), fill in `OWNER_SLACK_MAP` with real IDs, and
restart. No code changes required for the rollout itself.

## Leak vectors to keep in mind

- **The repo**: this codebase is local. Pushing it to a shared remote is the
  loudest possible announcement. Push only to a private repo you own.
- **`.env`**: gitignored; contains live tokens. Never commit it.
- **Channels**: nothing posts to channels today. If a daily digest is added
  later, that's the moment the integration becomes visible — add it last.
