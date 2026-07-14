# LaunchPad — Product Roadmap

**Status:** Planning / MVP 1 in progress
**Last updated:** 2026-07-14

---

## Product Summary

LaunchPad is an internal onboarding web app for DocMe360. It replaces the current
Slack Workflow + Mural onboarding process with a single working application.

Today, onboarding a new employee is coordinated through a Mural board (a visual
map of every onboarding task, organized by timeline phase and task owner) plus
Slack workflows for notifications. LaunchPad turns that Mural map into an
interactive app: the board stays visual and Mural-like, but cards become live
tasks with statuses, owners, dependencies, and (eventually) Slack notifications
when a task becomes unblocked.

**The goal is not to build Jira.** The main UX should feel like a visual Mural
board first, and a task tracker second.

## Core Concept

- The main page is a full-screen, pannable, zoomable canvas — it should
  function just like Mural.
- Each card on the board is an onboarding task.
- Cards are laid out along a left-to-right **timeline** (phases from "24–48
  hours" before start through "Day 90" and "Complete") and grouped into
  horizontal **owner swimlanes** (who does the task).
- Cards are positioned freely on the canvas (no rigid grid cells) — phase
  headers and swimlane labels are visual regions, matching the real Mural.
- **Dependency connectors are drawn on the canvas** between related cards, as
  in the real Mural (e.g., "Send start date, job title…" fans out to the
  account-creation tasks it unblocks).
- Clicking a card opens a Trello/Jira-style detail modal for editing.
- When a task's dependencies are all Done, the task becomes Ready — and in a
  later MVP, its owner gets a Slack notification.

## Insights from the Real Mural Board (screenshots reviewed 2026-07-14)

These observations from the current Mural drive the board design:

- **Timeline phases (left → right):** 24–48 hours → 1–2 Days → First Day →
  Days 2–4 → Day 5 → Days 6–29 → Day 30 → Day 90 → Onboarding Complete.
  The first two phases are **pre-start prep** (they occur before the hire's
  first day). "Onboarding Complete" is a terminal node (drawn as an oval).
- **Swimlanes on the real board:** Employee, Justin, Hiring Supervisor, Paras,
  Automation, Jana, Melissa, Anupe, Sheila, Project Lead, Becca.
- **Cards are color-coded by swimlane owner** — each lane has a color and its
  cards inherit it.
- **Phase regions have variable width** — "First Day" spans far more canvas
  than "Day 5". Phases are labels over regions, not equal-width columns.
- **Conditional tasks are explicit on cards:** "(if applicable)", "W2's only",
  "1099s only" — validating the conditional-rule feature planned for MVP 4.
- **The Employee (new hire) lane is a long sequential chain** (Start →
  Join Slack → Complete JustWorks → … → 30-day review → 90-day review →
  Complete), while other lanes contain supporting tasks that connect into it.

## MVP Phases

| Phase | Name | Goal |
|---|---|---|
| MVP 1 | Mural Board Page | Interactive Mural-style onboarding board (core experience) |
| MVP 2 | Dashboard Page | High-level view across all active onboardings |
| MVP 3 | New Hire Page | Add a new hire, generate their board from a template |
| MVP 4 | Template Builder / New Task Page | Edit the reusable onboarding workflow |
| MVP 5 | Slack Integration | Notifications + quick actions in Slack |
| MVP 6 | External Integrations | SharePoint, JustWorks, Lattice, Goody, Workable, Mural |

---

## MVP 1 — Mural Board Page

### Goal

Build the core LaunchPad experience: an interactive Mural-style onboarding
board. This MVP must include the Mural-like drag/drop/edit experience — it is
not a static page.

### Core UX

- Full-page visual board with pan and zoom (Mural-like canvas behavior).
- Cards are draggable, clickable, and editable.
- Clicking a card opens a Trello/Jira-style modal.
- Cards sit visually within timeline phase regions and owner swimlanes.
- Dependency connectors drawn between cards on the canvas.
- Custom LaunchPad styling with CSS Modules.

### Board Structure

**Timeline phases (columns/regions):**

1. 24–48 Hours *(pre-start)*
2. 1–2 Days *(pre-start)*
3. First Day
4. Days 2–4
5. Day 5
6. Days 6–29
7. Day 30
8. Day 90
9. Complete

**Owner swimlanes (rows):** per the real Mural — Employee (New Hire), Justin,
Hiring Supervisor, Paras, Automation, Jana, Melissa, Anupe, Sheila, Project
Lead, Becca. *(See Open Questions — the original spec listed a slightly
different set including "Sam / HR" and "Buddy".)*

### Cards

Each task card shows:

- Task title
- Owner
- Status
- Category tag
- Due timing / phase
- Blocked/ready indicator (when applicable)

**Task statuses:** Not Started · Blocked · Ready · In Progress · Done · N/A

**Task categories:** Intake · HR / Employment · Compliance · Account & Access ·
Project / Team Setup · Buddy & Welcome · New Hire First Week ·
Reviews / Follow-Up · Automation

### Task Modal

Clicking a card opens a modal with:

- Task title, description
- Owner, backup owner
- Status, category, phase
- Due date or due timing
- Dependencies / blocked by, and what this task unblocks
- Links/resources
- Notes/comments
- Activity log (simple mocked activity initially)
- Actions: **Save**, **Mark Done**, **Mark Blocked**, **Mark N/A**, **Delete**,
  **Duplicate** (if easy)

### Editing

Users can edit title, description, owner, status, category, resource links,
and notes — with changes saved to React state and reflected on the board
immediately.

### Drag / Drop

- Drag cards anywhere on the canvas (free positioning, like Mural).
- Moving cards between phases/swimlanes if feasible.
- Card positions update in React state; movements logged to the console for
  verification.
- Board state persisted to localStorage if simple, so refresh keeps changes.

### Dependencies

Simple, visible dependency logic:

- Cards can depend on other cards.
- If any dependency is not Done, the dependent card can show **Blocked**.
- When all dependencies become Done, the dependent card becomes **Ready**.
- Dependency recalculation is console-logged after any status change.
- Dependencies render as connector edges on the canvas.

### Mock Data

Realistic mock onboarding data for a new hire:

- **Name:** Marissa H.
- **Role:** Frontend Engineer
- **Location:** Boise, Idaho
- **Current step (example):** Step 38

Mock cards draw from the real Mural, including: collect new hire info, post
new W2 employee alert, create DocMe email, create JustWorks account, create
Slack account, set up harassment training, set up HIPAA training (if
applicable), add employee to Lattice, add to All Hands, create onboarding
Slack channel, create starter canvas, Project Lead builds onboarding to-do
list, add to applicable meetings, identify buddy, notify buddy, send welcome
message, complete About Me form, post #general welcome announcement, add to
Goody, Day 5 check-in, 30-day review, 90-day review.

### MVP 1 Implementation Steps

Each step is small, verifiable, and ends with a stop for review.

| Step | Deliverable | Verification |
|---|---|---|
| 1.1 | Roadmap doc (`docs/launchpad-roadmap.md`) | Open and review this file |
| 1.2 | App shell — Vite + React + TS, LaunchPad header/layout, CSS Modules | App runs locally, shell visible |
| 1.3 | Atomic component foundation — atoms (Button, Badge, TextInput, Select, StatusPill), molecules (TaskCard, CategoryTag, OwnerPill) | Component demo area renders |
| 1.4 | Mock data model — TS types (Employee, OnboardingBoard, TaskCard, TaskStatus, TaskCategory, BoardPhase, BoardSwimlane, TaskDependency, ResourceLink) + Marissa H. data | Console log of mock board + rendered counts |
| 1.5 | Mural board shell — phases, swimlanes, background grid, placeholder cards (React Flow setup) | Mural-like layout visible |
| 1.6 | Pan/zoom/drag — canvas behavior, drag logging, positions in state | Drag cards, see console logs |
| 1.7 | Card modal — custom, polished, Trello/Jira-inspired | Click card, open/close modal |
| 1.8 | Edit & save card details — updates state, reflects on board, logs on save | Edit, save, see board update |
| 1.9 | Status actions + dependency recalculation — Mark Done/Blocked/N/A, blocked → ready propagation, logging | Mark prerequisite Done, dependent becomes Ready |
| 1.10 | Create/delete/duplicate card | Perform all three in the UI |
| 1.11 | localStorage persistence + reset-mock-data button | Edit/drag, refresh, changes remain |
| 1.12 | Polish pass — visual hierarchy, filters if simple, fit-to-view/zoom controls | Usable as a functional prototype |

---

## MVP 2 — Dashboard Page

**Goal:** Give Sam a high-level view across all active onboardings.

- Dashboard page with one card per employee showing: name, role, location,
  start date, supervisor, project lead, overall progress %, progress by
  category, current step, current blocker, next owner, overdue count, Day 1
  readiness, Day 30 / Day 90 status.
- Filters: Active, Blocked, Overdue, Starting soon, Waiting on leadership,
  Waiting on new hire, Completed.
- Clicking an employee card opens that person's board.

**Steps:** 2.1 route/page shell → 2.2 mock multi-employee data →
2.3 EmployeeDashboardCard → 2.4 progress calculations from task statuses →
2.5 filters → 2.6 link cards to board page → 2.7 polish. Stop after each.

## MVP 3 — New Hire Page

**Goal:** Allow Sam to add a new hire and generate a board for them.

- New hire form collecting: name, preferred name, role, location, supervisor,
  project lead, project name, start date, employee type (W2/1099), personal
  email, laptop preference, employee group/role, VA / PIV / GFE needs, direct
  reports/team members, job description.
- On submit: create the hire, generate a board from the default template,
  apply simple conditional tasks, redirect to their board.
- localStorage is acceptable before a backend exists.

**Steps:** 3.1 page shell → 3.2 custom form components → 3.3 form state +
validation → 3.4 generate board from submission → 3.5 save to localStorage →
3.6 redirect to board → 3.7 polish. Stop after each.

## MVP 4 — Template Builder / New Task Page

**Goal:** Allow admins to edit the reusable onboarding workflow.

- Create/edit task templates: phase, swimlane, default owner, backup owner,
  category, required/optional, dependencies, links/resources, default
  description/instructions.
- Drag/drop template layout editing.
- Simple conditional rules first (mirroring the real Mural's "(if applicable)",
  "W2's only", "1099s only" annotations):
  - only show if VA project = yes
  - only show if employee type = W2
  - only show if role category = manager
- Save template locally first.

**Steps:** 4.1 page shell → 4.2 load default template from mock board →
4.3 create/edit template task modal → 4.4 dependency editor → 4.5 conditional
rule editor → 4.6 drag/drop layout editing → 4.7 save to localStorage →
4.8 use template in New Hire flow → 4.9 polish. Stop after each.

## MVP 5 — Slack Integration

**Goal:** Use Slack as the notification and quick-action layer.
**Do not start until the core app works.**

- When a task becomes Ready, notify the owner in Slack with: employee, task
  title, due date, why it was unblocked, and buttons (Open Task, Mark Done,
  Mark Blocked).
- Slack actions update LaunchPad; LaunchPad logs Slack notification history on
  the task.
- Sam can send a manual reminder from the card modal.
- Later: daily digest of blocked/overdue tasks.

**Likely stack:** Express + Node + TypeScript backend; Slack API (Bolt only if
clearly worth it — note: interactive buttons require an interactions endpoint,
which pushes toward Bolt); SQLite if persistence is needed; integration code
kept isolated. Local development of Slack interactivity will need a public
tunnel (e.g., ngrok).

**Steps:** 5.1 Express API shell → 5.2 SQLite schema if needed → 5.3 task
update endpoints → 5.4 Slack app config docs → 5.5 notification service →
5.6 test message → 5.7 interaction endpoint → 5.8 Mark Done/Blocked from
Slack → 5.9 task activity history → 5.10 polish. Stop after each.

## MVP 6 — External Integrations

**Goal:** Add integrations after Slack is useful.

Candidates: SharePoint, JustWorks, Lattice, Goody, Workable, Mural
import/export.

**Do not assume APIs exist.** For each integration: (1) research API
availability, (2) document auth/permission requirements, (3) identify useful
actions, (4) decide manual link vs. semi-automation vs. full automation,
(5) build only if it clearly saves Sam/team time. Early versions can be plain
external links + manual instructions on cards. Stop after each discovery step.

---

## Tech Stack Preferences

- **Frontend:** React + TypeScript + Vite
- **Board/canvas:** React Flow (preferred for Mural-like pan/zoom/drag and
  dependency edges)
- **Styling:** CSS Modules only — no Tailwind, no shadcn/ui, no heavy UI
  framework
- **Components:** custom, atomic design (atoms → molecules → organisms)
- **Routing:** a lightweight router (e.g., react-router) will be needed by
  MVP 2 for dashboard ↔ board navigation
- **Backend (later):** Express + Node + TypeScript
- **Database (later):** SQLite if it makes sense
- **Packages:** keep lean; prefer custom implementation unless a package
  clearly saves significant time for the Mural-like board UX

## What We Are Intentionally NOT Building Yet

- Authentication / user accounts
- Hosting / deployment / CI/CD
- Any backend or database (MVPs 1–4 are frontend + localStorage)
- Slack integration (MVP 5, only after the core app works)
- External integrations (MVP 6, discovery-first)
- Jira-style workflow engines, sprints, or reporting
- Real-time multi-user collaboration
- Mural import automation (screenshots + manual modeling for now)

## Current Assumptions

- Repo lives at `~/CodeBases/DocMe360/launchpad`.
- Single-user (Sam/admin) usage for early MVPs; no permissions model.
- One default onboarding template, based on the current Mural board.
- Card data model carries both free canvas position (x, y) **and** phase/
  swimlane fields; position is the source of truth for layout (Mural-style),
  while phase/swimlane fields drive status logic, filters, and dashboards.
- Manual "Mark Blocked" and dependency-derived blocking are tracked
  distinctly, so a completed dependency doesn't silently override a
  human-set Blocked status.

## Open Questions

1. **Swimlane roster:** the real Mural shows Employee, Justin, Hiring
   Supervisor, Paras, Automation, Jana, Melissa, Anupe, Sheila, Project Lead,
   Becca — the original spec listed New Hire, Hiring Supervisor, Sam / HR,
   Paras, Melissa, Justin, Project Lead, Buddy, Becca, Automation. Which set
   is canonical? (Current plan: follow the screenshots.)
2. **Drag semantics:** when a card is dragged into a different phase region or
   swimlane, should its phase/owner data update automatically, or is position
   purely visual until edited in the modal?
3. **"Current step" (e.g., Step 38):** how is a hire's current step derived —
   task order in the Employee lane, count of completed tasks, or something
   else?
4. **Phase region widths:** match the real Mural's variable widths (First Day
   is wide), or normalize for readability?
5. **Buddy program:** "Identify Buddy & Notify Buddy of Partnership" exists as
   a Hiring Supervisor task, but there's no Buddy swimlane in the Mural — do
   buddy tasks get their own lane in LaunchPad?
6. **localStorage schema versioning:** once MVP 4 templates can reshape
   boards, stored state can go stale; a schema version number in the stored
   blob is planned — acceptable?
7. **Who besides Sam will use the app** in early MVPs (view-only vs. edit)?

## Verification Checklist

Per-step verification methods (every step must be checkable by at least one):

- [ ] Run a command (e.g., `npm run dev`) and observe the result
- [ ] Check the browser UI
- [ ] Check console logs (drag events, dependency recalculation, saves)
- [ ] Inspect a created file

MVP 1 exit criteria:

- [ ] Board renders all phases, swimlanes, and mock cards for Marissa H.
- [ ] Canvas pans and zooms like Mural
- [ ] Cards drag freely; positions persist across refresh (localStorage)
- [ ] Clicking a card opens a polished detail modal
- [ ] Card edits save and reflect on the board immediately
- [ ] Mark Done / Blocked / N/A work, and dependency recalculation flips
      Blocked → Ready when prerequisites complete (console-logged)
- [ ] Cards can be created, deleted, and duplicated
- [ ] Reset-mock-data button restores the default board
