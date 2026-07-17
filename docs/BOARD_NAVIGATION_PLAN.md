# Board Smart Viewport & Navigation — Implementation Plan

> **Status: ✅ Implemented 2026-07-17** — all steps including the optional
> phase jump bar. Kept as the design record.

Goal: the board should open at a **readable** zoom centered on the most
relevant task/area — answering "where do I look right now?" before "how does
this fit the whole process?" — instead of always fitting the entire board at
an unreadable zoom. Full-board overview becomes a deliberate action, not the
default.

## Findings from code inspection (Step 1)

**Where React Flow is initialized:** `src/pages/BoardPage/BoardPage.tsx`
renders `<ReactFlow>` directly (no `ReactFlowProvider`), keyed by `board.id`,
with `fitView`, `minZoom={0.08}`, `maxZoom={1.75}`, and the built-in
`<Controls>` (zoom ± / fit). **The `fitView` prop is the culprit** — it fits
the whole ~6,600×1,950 canvas into the window on every mount, landing at
~0.1–0.2 zoom, which is why cards are unreadable.

**Nodes/cards:** built in a `useMemo` from `board.tasks`; each task node's
`position` is the card's top-left, cards are 210px wide, ~110px tall. Phases
carry pixel `x/width`, swimlanes carry `y/height` — so "center on task/phase"
is pure arithmetic, no DOM measurement needed.

**Task data/status/dependencies:** in the shared store (`AppStateContext`,
server-backed). Crucially, `src/logic/progress.ts` **already computes almost
every target the priority list needs**: `relevantBlocked[0]` (phase-window-
aware current blocker — a week-one hire isn't "blocked" by their 90-day
review), `nextTask` (first in-progress → ready → not-started, chronologically
ordered), and `currentPhaseIdx` from days-since-start. The helpers the prompt
asks for are mostly extractions, not new logic.

**Existing viewport logic:** none beyond `fitView` + the stock Controls.
Nothing else touches the viewport, and the viewport is uncontrolled — so
state updates (including the 15s server poll) don't move it. That means
"don't jump after initial load" is nearly free: remove `fitView`, center
exactly once in `onInit`.

**Existing board controls:** the header bar (filters, Reset Data, + New Card)
is already crowded; new nav controls fit better as a floating panel on the
canvas (React Flow's `<Panel>`, already in the installed package).

**One design gap in the prompt:** priority 1 says "task selected or linked" —
nothing links to a task today. Cheap win: support `?task=<id>` on the board
URL, and (tiny bonus) make the Slack "Open Task" button use it. Part of
Step 3 below, skippable.

## Design decisions

| Decision | Choice |
|---|---|
| Instance access | `onInit={(instance) => …}` captured in a ref — no `ReactFlowProvider` restructuring |
| One-time centering | Ref guard inside `onInit`; `key={board.id}` already remounts per employee, so each board gets its own smart center |
| Readable zoom | `READABLE_ZOOM = 0.85` (≈1.5–2 phases + 4–5 lanes visible at 1280px) — constant, easy to tune |
| Phase zoom | `PHASE_ZOOM = 0.55` — whole phase column readable in context |
| Fit Board | `instance.fitView({ padding: 0.1, duration: 300 })` — explicit action only |
| Target math | Pure functions in a new `src/logic/boardNavigation.ts`, sharing extracted helpers with `progress.ts` (no duplicated blocker logic) |
| Animation | 300ms `duration` on `setCenter` so nav clicks feel like movement, not teleport |

Priority order maps to: `?task=` param → `getCurrentBlocker` (extracted from
`relevantBlocked`) → `getCurrentStepTask` (extracted `nextTask`, in-progress
first) → `getFirstReadyTask` → `getCurrentPhase` (days-since-start) → intake
area fallback. Centering on a task = `setCenter(pos.x + 105, pos.y + 55,
{ zoom })`.

## Steps (stop after each)

**Step 2 — Helpers only.** New `src/logic/boardNavigation.ts`:
`getCurrentBlocker`, `getCurrentStepTask`, `getFirstReadyTask`,
`getInitialViewportTarget(tasks, employee, board, linkedTaskId?)` returning
`{ kind, task?, phase?, reason }`; small refactor of `progress.ts` to export
the shared pieces. BoardPage logs `LaunchPad initial viewport target: current
blocker — "…"` on load. No UI change; `fitView` stays for now. *Verify:
console only. Commit: "Adds smart board viewport helpers".*

**Step 3 — Smart initial viewport.** Remove `fitView`; `onInit` computes
target → `setCenter` at `READABLE_ZOOM`, once. Add `?task=` support (and point
the server's Slack "Open Task" URL at it — one line in
`server/src/slack/notify.ts`). *Verify: board opens readable, centered on
Marissa's blocker; Priscilla/Dalton/Alex each center per their own state; no
re-jumping during polling or drags. Commit: "Centers board on current
onboarding step".*

**Step 4 — Nav controls.** Floating `<Panel>` with Button atoms + CSS Module:
**Go to Current Step · Go to Blocker · Fit Board · Reset View**. Blocker-less
boards (e.g. Alex at 100%): log + brief non-intrusive "No current blocker"
hint, no jump. Every action logs (`Centered on blocker`, `Fit full board`,
…). *Verify: all four buttons; drag/modal/filters untouched. Commit: "Adds
LaunchPad board navigation controls".*

**Step 5 — Optional phase jump bar.** Slim strip of the 9 phase names above
the canvas; click → `centerOnPhase` at `PHASE_ZOOM`. Only after 2–4 are
solid. *Commit: "Adds phase jump navigation".*

## Explicitly out of scope

Template Builder keeps plain `fitView` (no "current task" concept there); no
new packages; no changes to drag/drop, modals, dependency logic, or the
server beyond the one-line Slack URL.

## Open questions (defaults chosen, flag if you disagree)

1. Zoom constants 0.85/0.55 — will tune visually at Step 3 if cards still
   feel small.
2. For a **completed** hire (Alex), fallback lands on intake per priority 6;
   arguably "Onboarding Complete" is more satisfying. Planned: keep the
   spec's fallback, note it at Step 3.
3. "No blocker" feedback: console + a small transient text in the nav panel
   (no toast system exists, not building one for this).
