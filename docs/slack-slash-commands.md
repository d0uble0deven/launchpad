# LaunchPad Slack Slash Commands — Strategy & Implementation Plan

> **Status: ✅ MVP implemented 2026-07-17** (help, my tasks, status,
> blockers, open — via Bolt Socket Mode + a dev curl endpoint). Kept as the
> design record. User-facing reference:
> [SLACK_COMMANDS_MANUAL.md](SLACK_COMMANDS_MANUAL.md). "Later commands"
> below remain unbuilt.

## Product role of Slack

LaunchPad is the source of truth; Slack is the quick-action layer. MVP 5
already delivers the primary Slack UX: interactive DM notifications with
Open Task / Mark Done / Mark Blocked buttons. Slash commands are the
**power-user shortcut layer** on top — for pulling information on demand
("what's on my plate?", "how is Marissa doing?") instead of waiting for a
push.

## Why one command: `/launchpad`

- One entry in the workspace's slash-command namespace instead of many.
- Subcommands parse from the text (`/launchpad status marissa`), so adding
  commands later needs no Slack-side changes.
- Matches the Watercooler pattern (`/watercooler admin …`).

## What the repo already has (gap analysis)

The original planning prompt assumed an earlier LaunchPad. Reality:

| Prompt step | Status in repo |
|---|---|
| Step 2 — check if Express/API exists | ✅ Exists: `server/` (Express + better-sqlite3, port 3001), routes in `server/src/routes.ts` |
| Step 4 — mock data adapter | ❌ **Not needed** — commands read the real SQLite store; `summarizeBoard` / `getCurrentBlocker` / `getNextActionableTask` / `getFirstReadyTask` in `src/logic/` already compute every field the responses need |
| Step 6 — Express endpoint for Slack | ⚠️ Partially obsolete — Slack traffic arrives via **Bolt Socket Mode** (`server/src/slack/bolt.ts`), not HTTP. A small **dev-only** endpoint is still worth adding purely for curl testing without Slack |
| Step 7 — signature verification | ❌ Not needed for Socket Mode (authenticated by the app token). Only relevant if we ever expose an HTTP Request URL; documented here, not built |
| Step 8 — document buttons only | ✅ Already **implemented** in MVP 5 — reuse existing action IDs `lp_mark_done` / `lp_mark_blocked` (not new `launchpad_*` ones); the handlers work from any message |
| Step 9 — real data lookup | ✅ The default, not optional |
| Shared types | ✅ `src/types/board.ts`, already imported by the server |
| Slack↔LaunchPad user matching | ✅ Real: reverse lookup of `OWNER_SLACK_MAP` (lane → Slack ID), no mocking needed |

**Deliberate deviation from the prompt:** the prompt prefers "direct Slack
API + Express endpoints, avoid Bolt." We already chose Bolt + Socket Mode in
MVP 5 (explicit decision; matches Watercooler; no public URL or ngrok; the
interactive buttons run on it today). Slash commands in Bolt are
`app.command('/launchpad', handler)` — switching transports now would be
rework with no benefit.

## MVP commands (build these only)

| Command | Behavior |
|---|---|
| `/launchpad help` (or empty) | List available commands |
| `/launchpad my tasks` | Actionable tasks (ready / in-progress) owned by the invoking Slack user's lane(s), across all hires, with Open/Done/Blocked buttons |
| `/launchpad status <name>` | One-hire summary: overall %, current step, current blocker + waiting-on owner, overdue count, next ready task |
| `/launchpad blockers [name]` | Current blocker per active hire (or for one hire) |
| `/launchpad open <name>` | Link to the hire's board (`APP_BASE_URL/board/<id>`) |

### Later commands (documented, not built)

`ready`, `task <name> <keywords>`, `done`, `blocked`, `note`, `remind`,
`digest`, `new hire`, `create task`.

### Example responses

`/launchpad status marissa` →

```
Marissa H. — Frontend Engineer
Overall: 54% complete (step 22 of 39)
Current blocker: Complete training (Slack, Harassment, project documentation) — waiting on Employee
Overdue tasks: 11
Next ready task: Upload Headshot
Board: http://localhost:5173/board/emp-marissa
```

`/launchpad my tasks` → grouped by hire, each task as
`title · status · due timing` with `[Open Task] [Mark Done] [Mark Blocked]`
buttons (existing action IDs, existing handlers — no new interaction code).

## Safety rules

- **All responses are ephemeral** (`response_type: "ephemeral"`) — only the
  invoker sees them. No channel posts, ever, from slash commands.
- **Invoker gate:** while in private testing, if `SLACK_DM_ALLOWLIST` is
  non-empty and the invoking `user_id` isn't on it, reply "LaunchPad is in
  private testing." (Reuses the existing rollout ladder — no new config.)
- **Discoverability caveat:** registering `/launchpad` makes it visible in
  the workspace `/` autocomplete. Same exposure as Watercooler; the
  mitigation is the same — register quietly, don't announce, and the invoker
  gate keeps curious users out.
- **Modification commands** (`done`, `blocked`, …) are *not* in the MVP.
  When built: never mutate from a fuzzy text match — if the match isn't
  exactly one task, return the candidates with confirm buttons instead.
- **Name matching** (`status`, `open`, `blockers`): case-insensitive
  `includes` on name + preferred name. Zero matches → list valid names;
  multiple matches → list candidates, take no action.

## Implementation plan

New code lives in `server/src/slack/commands/` (repo convention — not the
prompt's `apps/api/...` layout). Transport-independent core so the same
handlers serve Bolt and the dev endpoint. **Frontend: no changes.**

| # | Change | Files |
|---|---|---|
| 1 | **Parser** — `"status marissa"` → `{ action: 'status', args: ['marissa'] }`; empty/unknown → `help` (with hint). Handles the two-word `my tasks` | `server/src/slack/commands/parser.ts` (new) |
| 2 | **Lookups** — `findEmployeeByName(query)` over the store; `lanesForSlackUser(userId)` reverse `OWNER_SLACK_MAP` | `server/src/slack/commands/handlers.ts` (new) |
| 3 | **Handlers** — the 5 MVP commands, reading `store` + `summarizeBoard`/`getCurrentBlocker`/`getFirstReadyTask`; each returns `{ text?, blocks? }` | same file |
| 4 | **Formatters** — mrkdwn text; Block Kit only for the task-list buttons (reusing `lp_*` action values `{b, t}`) | `server/src/slack/commands/formatters.ts` (new) |
| 5 | **Bolt registration** — `registerSlashCommand(app)`: `app.command('/launchpad', …)`, `ack()` within 3s (handlers are sync DB reads — fine), invoker gate, dev logging (`[slack-cmd] action=status args=[marissa] user=U…`) | `server/src/slack/commands/index.ts` (new); called from `server/src/index.ts` |
| 6 | **Dev endpoint** — `POST /api/slack/commands` accepting form-urlencoded `command/text/user_id/user_name`, calling the same core, returning the Slack-shaped JSON. Exists so the whole flow is curl-testable with `SLACK_ENABLED=false`. Needs `express.urlencoded()` middleware on that route | `server/src/routes.ts` |
| 7 | **Slack app config** — manifest gains the `commands` scope + the `/launchpad` command definition; requires one reinstall of the app | `docs/SLACK_SETUP.md` |
| 8 | **Docs** — discoverability note in the rollout ladder | `docs/GO_LIVE.md` |

Estimated size: ~350 lines of server TypeScript + doc edits.

## How to test the flow

**Phase A — no Slack at all** (`SLACK_ENABLED=false`, the default):

```bash
npm run server   # terminal 1

curl -X POST http://localhost:3001/api/slack/commands \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "command=/launchpad&text=help&user_id=U123&user_name=dev"
```

Repeat with `text=my tasks` (after mapping a lane to `U123` in
`OWNER_SLACK_MAP`), `text=status marissa`, `text=blockers`,
`text=open marissa`, plus edge cases: `text=status zzz` (no match),
`text=status a` (ambiguous), `text=banana` (unknown → help). Each request
logs `[slack-cmd] …` in the server terminal and returns the exact JSON Slack
would render.

**Phase B — real Slack** (Socket Mode, tokens in `.env`):

1. Update the app manifest per `docs/SLACK_SETUP.md` (add `commands` scope +
   `/launchpad`), reinstall the app, restart `npm run server`.
2. In Slack: `/launchpad help` → ephemeral reply only you can see.
3. `/launchpad my tasks` → your lane's tasks; click **Mark Done** on one →
   task updates in LaunchPad (verify on the board), dependency
   recalculation runs, and any unblocked-task notification follows the
   existing allowlist/redirect rails.
4. From a second (non-allowlisted) test account: `/launchpad help` → the
   "private testing" reply.

**Regression:** MVP 5 notifications, reminder button, and DM buttons
unchanged; web app untouched.

## Open questions

1. Should the hire themselves ever appear in `my tasks`? Requires a
   per-employee `slackUserId` field (the Employee lane is unmapped by
   design today).
2. `blockers` with no name: all hires, or only non-completed ones?
   (Plan: only hires whose boards aren't complete.)
3. Separate `SLACK_COMMAND_ALLOWLIST` instead of reusing
   `SLACK_DM_ALLOWLIST`? (Plan: reuse until rollout needs them to differ.)

## Commit message

```
Documents LaunchPad slash command plan
```

(Implementation commits later: "Adds LaunchPad command parser", "Adds Slack
command handlers and formatters", "Adds /launchpad slash command".)
