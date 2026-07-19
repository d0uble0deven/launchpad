# Slack Onboarding Threads — channel + thread-per-hire notification model

We are redesigning LaunchPad's Slack behavior from owner DMs to a
channel-with-threads model: one `#launchpad-onboarding` channel, one parent
message per hire, all of that hire's activity in its thread.

LaunchPad today:

- Mural-style visual onboarding board (React + TS + Vite, React Flow, CSS
  Modules, atomic components — no Tailwind, no heavy packages).
- Express + better-sqlite3 server (`server/`, port 3001) as source of truth.
- Task cards with owners, statuses, dependencies, resources, activity.
- Dependency recalculation that unblocks later tasks and triggers owner
  notifications.
- A working Slack integration (details below) that DMs task owners.

Current Slack pain: everything is DMs. Once real tagging is enabled this
becomes a noisy pile of one-off DMs with no shared context per hire.

==================================================
CURRENT CODEBASE FACTS (do not rediscover from scratch — verify, then build)
==================================================

These were true when this prompt was written. Step 2 verifies they still
hold rather than exploring blind.

- **Bolt stays.** `@slack/bolt` v5 runs on Socket Mode
  (`server/src/slack/bolt.ts`). It is REQUIRED: the Mark Done / Mark
  Blocked message buttons (`server/src/slack/actions.ts`) and the
  `/launchpad` slash command (`server/src/slack/commands/`) are inbound
  interactions only Bolt handles. Do NOT replace it with raw fetch calls —
  besides losing interactivity, Node 26's fetch has an empty-body POST bug
  (worked around in `server/src/nodeFetchFix.ts`, imported first in
  `server/src/index.ts`; do not remove). New outbound calls use
  `slackApp.client` (Bolt's WebClient).
- **Slash commands exist and are live**: help, my tasks, status, blockers,
  open. Keep them working; do not extend them in this phase.
- **Dry-run mode exists**: `SLACK_ENABLED=false` (see
  `server/src/env.ts`, `server/src/slack/bolt.ts`, `notify.ts`). It logs
  would-be sends and records them in the `slack_notifications` table
  instead of calling Slack. REUSE this as "mock mode" — do not add a
  separate `SLACK_MOCK_MODE` flag. Extend the dry-run path to cover the
  new operations (root post, thread reply, message update) with clearly
  labeled log lines and realistic fake timestamps.
- **Privacy rails exist and are non-negotiable** (stealth rollout — no one
  learns about LaunchPad until Dev says so):
  - `SLACK_DM_ALLOWLIST` — only these Slack user IDs may be contacted
    directly.
  - `SLACK_REDIRECT_TO` — everyone else's DMs deliver to Dev with a 🧪
    banner.
  - `SLACK_TEST_MODE` — 🧪 banner on every message.
  These rails must be EXTENDED to the channel model (see MENTIONS below),
  not bypassed.
- **Owner identity**: `OWNER_SLACK_MAP` env maps lane ids → Slack member
  IDs. `src/logic/ownerDisplay.ts` (`resolveOwnerDisplay`) resolves lanes
  to real people (hire name + title, supervisor, project lead) and is
  shared client/server — use it in formatters.
- **Missing prerequisite**: employees have NO `slack_user_id` field yet.
  Mentioning the hire requires it (Step 6 adds it).
- **Notification persistence exists**: `slack_notifications` table with
  modes sent / redirected / dry-run / skipped. Extend modes as needed
  (e.g. `thread-posted`, `summary-updated`, `mention-suppressed`) rather
  than building new persistence.
- **`notifyTaskOwner`** (`server/src/slack/notify.ts`) is the single
  outbound chokepoint: manual reminders (web "Send Slack Reminder") and
  recalc-triggered "task ready" notifications flow through it. The
  migration is explicit: `notifyTaskOwner` becomes a THREAD REPLY with a
  mention; the DM path survives only behind the escalation flag.
- **Data model**: "onboarding instance" = a board row (`boards` table:
  id, employee_id, phases, swimlanes as JSON) + employee row. Slack thread
  fields belong on `boards` (snake_case, see Step 6). Store schema
  version bumps in `server/src/db.ts` migrations.
- **No scheduler exists.** Overdue is computed on read
  (`src/logic/progress.ts` / `summarizeBoard`). Nothing detects overdue on
  its own — see Step 12's trigger caveat.
- **No test framework exists.** Verification is small scripts / curl / dev
  console, as done throughout this repo.
- Server code layout: `server/src/slack/` (bolt.ts, notify.ts, actions.ts,
  commands/). Put new modules there (e.g. `channel.ts`, `formatters.ts`,
  `classifier.ts`), not in a new `integrations/` tree.
- Sample hire is **Marissa H.** (employee record has role, supervisor,
  projectLead, start date, location).

==================================================
TARGET SLACK MODEL
==================================================

#launchpad-onboarding
  ├── Parent message: Marissa H. — Frontend Engineer
  │     └── Thread with all of Marissa's LaunchPad activity
  ├── Parent message: Dalton P. — Backend Engineer
  │     └── Thread with all of Dalton's LaunchPad activity
  └── … one parent per hire

- Dev creates the Slack channel MANUALLY. Do not create channels via API.
- **Rollout/privacy strategy: the channel starts PRIVATE with only Dev +
  the LaunchPad bot.** Slack does not notify mentioned users who are not
  channel members, so real `<@ID>` mentions are inert until Dev invites
  people. This is the Watercooler-style quiet rollout. Document it.
- Channel ID comes from env:

      SLACK_ONBOARDING_CHANNEL_ID=

- The bot must be invited to the channel before live testing
  (`/invite @LaunchPad`).
- Do not create one channel per hire. Do not combine onboarding and
  offboarding; a future `#launchpad-offboarding` is a separate, more
  restricted channel — document the separation, out of scope here. A
  future new-hire-facing starter channel is also out of scope.

==================================================
PRODUCT PRINCIPLE — notification hierarchy
==================================================

1. Threads provide shared context.
2. Mentions request action.
3. DMs are reserved for escalation, privacy, or exceptional situations.

Default behavior: post in the hire's thread; mention the assigned user
when action is required; send NO additional DM.

==================================================
ROOT PARENT MESSAGE
==================================================

When a new onboarding instance is created, post ONE root-level parent
message to the configured channel:

    🚀 Marissa H. — Frontend Engineer

    Start date: 2026-07-06
    Supervisor: Miguel A.
    Project lead: Sam W.
    Location: Boise, Idaho

    Progress: 54%
    Current phase: Days 2–4
    Current step: Verify GoalSpan
    Current blocker: None
    Next owner: Paras

    [Open Board] [View Current Tasks]

This is the permanent Slack anchor for that hire. Store the relationship
on the board row (Step 6 migration):

    slack_channel_id
    slack_parent_message_ts
    slack_parent_message_url   (optional)
    slack_thread_created_at

All future internal Slack updates for that hire post as replies to this
parent message.

==================================================
LIVE SUMMARY MESSAGE
==================================================

The parent message stays a live summary: when meaningful state changes
(progress, phase, current step, blocker, next owner, overdue count,
completion), UPDATE the existing parent message (`chat.update`) — never
post a new root message. Don't update for insignificant changes that would
spam the Slack API.

Helpers (adapt names to codebase conventions):

    buildOnboardingSlackSummary(board, employee)
    updateOnboardingSlackSummary(boardId)

Reuse `summarizeBoard` from `src/logic/progress.ts` — it already computes
progress, current step, blocker, and next owner (with resolved names).

==================================================
THREAD ACTIVITY
==================================================

The thread is that hire's chronological feed. Keep messages concise and
scannable. Examples:

Informational completion (no mention):

    ✅ Justin completed Create DocMe Email

Newly ready task (mention, action buttons):

    🟡 <@SLACK_USER_ID> — Create Slack Account is now ready.
    Unblocked by: ✅ Create DocMe Email · ✅ Create JustWorks Account
    [Open Task] [Mark Done] [Mark Blocked]

Blocked task:

    🔴 <@SLACK_USER_ID> — Add Marissa to the starter channel is blocked.
    Blocking: Starter channel invitation · Welcome message · About Me form
    [Open Task]

Reassignment:

    👤 Create Slack Account was reassigned: Paras → Melissa

Completion:

    🎉 Marissa's onboarding is complete.
    Completed: 39 tasks · N/A: 4 tasks
    [Open Board]

The existing Bolt action handlers (`actions.ts`) already process
Open Task / Mark Done / Mark Blocked buttons — reuse the same action ids
so thread buttons work identically to today's DM buttons.

==================================================
EVENT CLASSIFICATION
==================================================

Three notification levels:

1. **informational** — task completed, marked N/A, owner changed, due
   date changed, note added, resource added, progress milestone.
   → Thread post. No mention. No DM.
2. **action_required** — task becomes ready, newly assigned, approval or
   information requested, blocker needs the owner.
   → Thread post. Mention the responsible user (subject to the mention
   rails below). No DM.
3. **escalation** — task overdue, critical Day-1 task blocked, start date
   approaching with required work incomplete, owner unresponsive.
   → Thread post. Mention owner + escalation contact (project lead /
   supervisor from the employee record). DM only when
   `SLACK_ESCALATION_DMS_ENABLED=true`. No aggressive recurring
   reminders.

Suggested types (adapt naming to the codebase):

    type SlackNotificationLevel =
      | 'informational' | 'action_required' | 'escalation';

    type LaunchPadSlackEventType =
      | 'onboarding_created' | 'task_ready' | 'task_completed'
      | 'task_blocked' | 'task_reassigned' | 'task_marked_na'
      | 'task_overdue' | 'progress_updated' | 'onboarding_completed';

==================================================
MENTIONS, USER MAPPING, AND THE PRIVACY RAILS
==================================================

Mentions must use Slack user IDs (`<@U…>`), never display-name text.

Identity resolution order for a task's owner:
1. `employee` lane → `employees.slack_user_id` (Step 6 adds the field).
2. Staff lanes → `OWNER_SLACK_MAP`.
3. Display names/titles → `resolveOwnerDisplay` (already shared
   client/server).

**Mention gating (extends the existing allowlist rail):** while
`SLACK_DM_ALLOWLIST` is non-empty, only allowlisted Slack IDs get a real
`<@ID>` mention; everyone else is rendered as plain bold name text and the
notification record is marked `mention-suppressed`. Combined with the
private channel, this is defense in depth for the stealth rollout. When
Dev is ready to go wide, widening the allowlist (or emptying it) turns on
real mentions with no code change.

If an assigned user has no Slack ID: post without a mention, log a clear
warning, record the missing mapping — never silently fail, never crash.

Do not build user-directory sync. Do not auto-invite anyone to the
channel.

==================================================
DIRECT MESSAGES
==================================================

Thread mentions replace assignment DMs. Config:

    SLACK_ASSIGNMENT_DMS_ENABLED=false   (default)
    SLACK_ESCALATION_DMS_ENABLED=false   (default)

Do not delete the existing DM machinery in `notify.ts` — it backs future
escalation DMs and the allowlist/redirect rails. Rewire its callers.

Never post confidential HR information in the shared thread: no
compensation, background-check details, personal HR concerns,
termination-related information, or unnecessary personal contact details.

==================================================
FAILURE BEHAVIOR
==================================================

Slack failures must never break LaunchPad task updates: task mutations
commit first; Slack errors are caught, logged clearly, and recorded in
`slack_notifications` with a failure status. No retry queues, no Redis,
no BullMQ, no background workers.

==================================================
WORKING STYLE
==================================================

Work in small, verifiable steps. After each step: STOP and wait for
confirmation. Summarize what changed, how to verify, steps completed,
steps remaining, and give a short git commit message. Do not continue
automatically into the next step.

==================================================
IMPLEMENTATION STEPS
==================================================

**Step 1 — Document the design.**
Create `docs/slack-onboarding-notifications.md` covering: channel
strategy (incl. private-channel stealth rollout), thread-per-hire
rationale, parent/thread message structure, notification hierarchy,
mention gating + privacy rails, DM policy, privacy rules, required manual
Slack setup, env vars, data fields, future offboarding/new-hire channels,
implementation steps, open questions (incl. the escalation-trigger
caveat from Step 12). Add a short reference in
`docs/launchpad-roadmap.md` without rewriting unrelated sections. No code
changes. Stop.

**Step 2 — Verify the codebase facts.**
Confirm the CURRENT CODEBASE FACTS section above still holds (files,
flags, tables, chokepoints); note any drift. Identify the exact call
sites that will change (`notifyTaskOwner` callers, hire-creation path in
`server/src/routes.ts` / store, recalc notification trigger in
`taskService`). No behavior changes. Stop and summarize.

**Step 3 — Event classification layer.**
Small pure module (`server/src/slack/classifier.ts` or similar) mapping
LaunchPad events → level. Verify by script/console: completed →
informational, ready → action_required, overdue → escalation. No Slack
calls. Stop.

**Step 4 — Message formatters.**
Pure functions (parent summary, completed, ready, blocked, reassigned,
N/A, overdue, onboarding completed) taking LaunchPad data → Slack
payloads (blocks). Use `resolveOwnerDisplay` for names/titles and
`summarizeBoard` for summary data. Reuse existing action ids for buttons.
Apply the mention-gating rule inside one shared mention helper. No Slack
calls; verify sample payloads for Marissa H. via a small script. Stop.

**Step 5 — Extend the dry-run transport.**
Extend the `SLACK_ENABLED=false` path (and the live path's shared
adapter) to three operations: post root message, post thread reply,
update message. Dry-run logs the exact payload, clearly labeled
(ROOT / REPLY / UPDATE, channel id, thread ts), returns realistic fake
timestamps, and records to `slack_notifications`. Verify by triggering
each op in dry-run; confirm no live calls. Stop.

**Step 6 — Schema migration (thread anchor + hire identity).**
Bump schema version in `server/src/db.ts`: add
`slack_channel_id`, `slack_parent_message_ts`, `slack_parent_message_url`,
`slack_thread_created_at` to `boards`; add `slack_user_id` to
`employees`. Surface `slack_user_id` in the New Hire form as an optional
field and somewhere editable post-creation. Verify migration runs on the
existing DB without data loss. Stop.

**Step 7 — Create the parent message on hire creation.**
When a new onboarding instance is created (and only if
`SLACK_ONBOARDING_CHANNEL_ID` is set): post one root message, store
channel id + parent ts on the board row. Idempotent — a retry or
re-initialization must not create a second root (check stored ts first).
No task details, no DMs, no channel creation. Verify in dry-run first.
Stop.

**Step 8 — Route activity into threads.**
Rewire `notifyTaskOwner` callers: activity (completed, ready, blocked,
reassigned, N/A, onboarding completed) posts as a reply to the stored
parent ts. Never post activity at channel root. Boards created before
Step 7 have no parent ts — post their parent lazily on first activity, or
log-and-skip (choose one, document it). Verify: Marissa's updates land in
Marissa's thread; a second hire's updates land in their own thread; no
cross-thread bleed. Stop.

**Step 9 — Action-required mentions.**
Ready/assigned/blocker-action messages resolve the owner's Slack ID
(employee → `slack_user_id`; staff → `OWNER_SLACK_MAP`) and include a
real mention SUBJECT TO the allowlist gating. Informational messages never
mention. Missing mapping → plain name + warning, no crash, no DM. Verify
all four cases (mapped+allowlisted, mapped+suppressed, unmapped,
informational). Stop.

**Step 10 — Live parent summary updates.**
On meaningful changes (progress, current step, blocker, completion),
rebuild the summary and `chat.update` the existing parent (same ts, never
a new root). Debounce/skip insignificant churn. Verify: complete a task →
root progress changes, activity stays in thread, still exactly one root.
Stop.

**Step 11 — Retire assignment DMs.**
Default `SLACK_ASSIGNMENT_DMS_ENABLED=false`: assignment/ready flows do
thread mentions only. DM machinery stays for escalation + the redirect
rail. Verify: unblock a task → thread mention, no DM payload generated.
Stop.

**Step 12 — Basic escalation (manual trigger).**
Escalation formatter + path: thread post mentioning owner + escalation
contact (project lead/supervisor); DM only when
`SLACK_ESCALATION_DMS_ENABLED=true` (allowlist/redirect rails apply).
**Trigger caveat: no scheduler exists and overdue is computed on read —
do NOT add polling.** Ship a dev-only trigger (endpoint or script) that
fires an escalation for a given task so the path is testable; note the
future scheduler in the doc's open questions. Verify via the dev trigger
in dry-run, then flag-flip DM behavior. Stop.

**Step 13 — Setup validation.**
Lightweight dev command or endpoint that reports: channel id configured?
bot token present when live? dry-run status? live channel reachable
(`conversations.info` / `auth.test`) when credentials exist? No secrets
in output. Document the manual setup in the Step 1 doc: create private
`#launchpad-onboarding` (Dev + bot only) → invite `@LaunchPad` → copy
channel ID → set env → restart server → run validation. Verify both the
dry-run and misconfigured cases produce clear messages. Stop.

**Step 14 — Final UX and reliability review.**
Walk the full flow: create hire → one root; completions post quietly in
the thread; ready tasks mention (gated); no assignment DMs; parent
summary stays current; second hire gets own thread; Slack failure doesn't
break task updates; no sensitive data posted; completion updates root.
Focused cleanup only — no unrelated features. Deliver: implementation
summary, manual test checklist, known limitations, remaining future
features, short commit message.

==================================================
FUTURE FEATURES — DOCUMENT ONLY, DO NOT IMPLEMENT
==================================================

- `#launchpad-offboarding` (separate, restricted channel)
- New-hire-facing onboarding channels
- Automatic channel membership management
- Per-user DM notification preferences
- Scheduled daily digests; recurring overdue reminders; the overdue
  scheduler behind Step 12's trigger
- Thread subscription management
- Slack-created hires; full Slack task-editing modals
- EXTENDING the `/launchpad` slash commands (existing five stay working
  throughout; the deferred nine — ready, task, done, blocked, note,
  remind, digest, new hire, create task — remain a separate effort)
- Message batching; background retry queues; Slack engagement analytics

==================================================
START
==================================================

Start with Step 1 only. Create the documentation, summarize, provide
verification instructions and a short git commit message, then stop.
