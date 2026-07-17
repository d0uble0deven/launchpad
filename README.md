# LaunchPad

Internal onboarding app for DocMe360: a Mural-style onboarding board, a
cross-hire dashboard, new-hire board generation from an editable template,
and Slack notifications when tasks become unblocked.

## Run it

Requires Node 26 (the Homebrew default on this machine). `better-sqlite3` is
a native module — if you switch Node versions and the server fails with
`ERR_DLOPEN_FAILED`, run `npm rebuild better-sqlite3`. Two terminals:

```bash
npm install
cp .env.example .env   # first time only

npm run server         # API + SQLite + Slack service on :3001
npm run dev            # Vite frontend on :5173 (proxies /api to :3001)
```

Open http://localhost:5173. The database seeds itself with mock data on
first run (`data/launchpad.db`); the **Reset Data** button on any board
restores it.

Slack is **off by default** (`SLACK_ENABLED=false`): every would-be DM is
logged to the server terminal and recorded in the task's notification
history instead of being sent.

## Docs

- [docs/launchpad-roadmap.md](docs/launchpad-roadmap.md) — product roadmap and MVP status
- [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) — creating the Slack app, tokens, owner mapping
- [docs/SLACK_COMMANDS_MANUAL.md](docs/SLACK_COMMANDS_MANUAL.md) — every `/launchpad` command and what it does
- [docs/GO_LIVE.md](docs/GO_LIVE.md) — the quiet rollout ladder (allowlist / redirect / dry-run)

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Frontend dev server (Vite) |
| `npm run server` | API server (Express + better-sqlite3 + Slack via Bolt Socket Mode) |
| `npm run build` | Type-check + production build of the frontend |
| `npm run typecheck` | Type-check frontend and server |
