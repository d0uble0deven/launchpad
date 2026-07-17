# LaunchPad Slack Commands — User Manual

Everything you can type after `/launchpad` in Slack, and what it does.

**The basics:**

- Every response is **ephemeral** — only you see it, nothing is posted to
  the channel.
- While LaunchPad is in private testing (`SLACK_DM_ALLOWLIST` set), only
  allowlisted users get real responses; everyone else sees
  *"LaunchPad is in private testing."*
- Names are matched loosely: `marissa`, `Marissa`, or part of a name all
  work. If a name matches more than one hire, LaunchPad lists the matches
  and does nothing else.
- Dev tip: every command also works without Slack via
  `POST /api/slack/commands` on the local server (see "Testing without
  Slack" below).

---

## `/launchpad help`

Lists all available commands. Running `/launchpad` with no text does the
same thing.

## `/launchpad my tasks`

Your actionable tasks (status **Ready** or **In Progress**) across every
hire's board, in timeline order. "Your" = the board lane(s) mapped to your
Slack ID in `OWNER_SLACK_MAP`.

Each task shows the hire, status, and due timing, with three working
buttons:

- **Open Task** — deep-links to the board, centered on that task with its
  modal open
- **Mark Done** — completes the task in LaunchPad (dependencies
  recalculate; anything unblocked notifies its owner per the usual rails)
- **Mark Blocked** — flags the task in LaunchPad

Shows up to 8 tasks with buttons; more are summarized in a count.
`/launchpad tasks` works as a shorthand.

If you're not mapped yet, the reply tells you exactly what to add to
`.env`.

## `/launchpad status <name>`

One-glance onboarding summary for a hire:

```
Marissa H. — Frontend Engineer
Overall: 54% complete (step 22 of 39)
Current blocker: "Complete training (Slack, Harassment, project documentation)" — waiting on Employee
Overdue tasks: 11
Next task: Upload Headshot
Open board →
```

"Current blocker" only counts blockers whose phase is already due — a
blocked 90-day review doesn't count against a week-one hire.

## `/launchpad blockers`

The current blocker for every active (non-completed) hire, each with who
it's waiting on:

```
Current blockers:
• Marissa H. — "Complete training (…)" (waiting on Employee)
• Priscilla S. — "Complete training (…)" (waiting on Employee)
```

## `/launchpad blockers <name>`

Same, for one hire only. If they have no blocker: a clean
*"No current blocker for Marissa H. 🎉"*.

## `/launchpad open <name>`

A link straight to that hire's LaunchPad board.

---

## Coming later (not built yet)

| Command | Planned behavior |
|---|---|
| `/launchpad ready [name]` | List ready-to-start tasks |
| `/launchpad task <name> <keywords>` | Find a specific task + actions |
| `/launchpad done` / `blocked` | Mark tasks from Slack by text (with confirmation — never from an ambiguous match) |
| `/launchpad note` | Add a note to a task |
| `/launchpad remind` | Nudge a task's owner |
| `/launchpad digest` | Blocked/overdue summary |
| `/launchpad new hire` / `create task` | Create from Slack |

## Testing without Slack

With the server running (`npm run server`), any command works via curl —
same parser, handlers, and data:

```bash
curl -s -X POST http://localhost:3001/api/slack/commands \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "command=/launchpad" \
  --data-urlencode "text=status marissa" \
  --data-urlencode "user_id=U123" \
  --data-urlencode "user_name=dev"
```

The server logs every parsed command:
`[slack-cmd] action=status args=[marissa] user=U123 (dev)`.

This endpoint is a local dev tool — Slack itself talks to the app over
Socket Mode and never calls it.
