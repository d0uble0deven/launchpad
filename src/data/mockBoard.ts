import type {
  BoardPhase,
  BoardSwimlane,
  Employee,
  OnboardingBoard,
  TaskCard,
} from '../types/board';

export const MOCK_EMPLOYEE: Employee = {
  id: 'emp-marissa',
  name: 'Marissa H.',
  preferredName: 'Marissa',
  role: 'Frontend Engineer',
  location: 'Boise, Idaho',
  startDate: '2026-07-06',
  supervisor: 'Miguel A.',
  projectLead: 'Sam W.',
};

// Phase regions run left to right; the first two happen before the start
// date. Widths mirror the real Mural, where First Day / Days 2-4 hold the
// long employee task chain.
const PHASES: BoardPhase[] = [
  { id: 'p-24-48h', label: '24–48 Hours', x: 240, width: 520 },
  { id: 'p-1-2d', label: '1–2 Days', x: 760, width: 980 },
  { id: 'p-day1', label: 'First Day', x: 1740, width: 1220 },
  { id: 'p-days2-4', label: 'Days 2–4', x: 2960, width: 1220 },
  { id: 'p-day5', label: 'Day 5', x: 4180, width: 520 },
  { id: 'p-days6-29', label: 'Days 6–29', x: 4700, width: 520 },
  { id: 'p-day30', label: 'Day 30', x: 5220, width: 520 },
  { id: 'p-day90', label: 'Day 90', x: 5740, width: 520 },
  { id: 'p-complete', label: 'Complete', x: 6260, width: 380 },
];

const LANE_TOP = 80;
const LANE_HEIGHT = 170;

// Lane order follows the real Mural board. Each person gets a clearly
// distinct hue (cards, tiles, and lane chips all inherit it).
const LANE_DEFS: Array<Pick<BoardSwimlane, 'id' | 'label' | 'color'>> = [
  { id: 'employee', label: 'Employee', color: '#f9a8d4' }, // pink
  { id: 'justin', label: 'Justin', color: '#2dd4bf' }, // teal
  { id: 'hiring-supervisor', label: 'Hiring Supervisor', color: '#a78bfa' }, // purple
  { id: 'paras', label: 'Paras', color: '#f87171' }, // red
  { id: 'automation', label: 'Automation', color: '#fcd34d' }, // yellow
  { id: 'jana', label: 'Jana', color: '#a3e635' }, // lime
  { id: 'melissa', label: 'Melissa', color: '#fb923c' }, // orange
  { id: 'anupe', label: 'Anupe', color: '#38bdf8' }, // sky
  { id: 'sheila', label: 'Sheila', color: '#4ade80' }, // green
  { id: 'project-lead', label: 'Project Lead', color: '#818cf8' }, // indigo
  { id: 'becca', label: 'Becca', color: '#e879f9' }, // fuchsia
];

const SWIMLANES: BoardSwimlane[] = LANE_DEFS.map((lane, index) => ({
  ...lane,
  y: LANE_TOP + index * LANE_HEIGHT,
  height: LANE_HEIGHT,
}));

const phaseIndex = Object.fromEntries(PHASES.map((p, i) => [p.id, i]));
const laneIndex = Object.fromEntries(SWIMLANES.map((l, i) => [l.id, i]));

/** Canvas position for a card: phase region + horizontal slot, lane + row. */
function pos(phaseId: string, laneId: string, slot = 0, row = 0) {
  return {
    x: PHASES[phaseIndex[phaseId]!]!.x + 20 + slot * 230,
    y: SWIMLANES[laneIndex[laneId]!]!.y + 24 + row * 132,
  };
}

type TaskSeed = Partial<TaskCard> &
  Pick<TaskCard, 'id' | 'title' | 'ownerId' | 'status' | 'category' | 'phaseId'> & {
    slot?: number;
    row?: number;
  };

function task({ slot = 0, row = 0, ...seed }: TaskSeed): TaskCard {
  return {
    description: '',
    dependsOn: [],
    links: [],
    notes: '',
    activity: [
      {
        id: `${seed.id}-a1`,
        timestamp: '2026-07-01T09:00:00Z',
        message: 'Task created from onboarding template',
      },
    ],
    position: pos(seed.phaseId, seed.ownerId, slot, row),
    ...seed,
  };
}

const TASKS: TaskCard[] = [
  // ---- 24-48 Hours (pre-start) ----
  task({
    id: 't-intake',
    title: 'Send start date, job title, personal email, W2/1099 designation',
    description:
      'Hiring Supervisor sends new hire info to Justin, Paras, and Melissa.',
    ownerId: 'hiring-supervisor',
    status: 'done',
    category: 'intake',
    phaseId: 'p-24-48h',
    dueTiming: 'Before start date',
  }),
  task({
    id: 't-identify-buddy',
    title: 'Identify Buddy & Notify Buddy of Partnership',
    ownerId: 'hiring-supervisor',
    status: 'done',
    category: 'buddy-welcome',
    phaseId: 'p-24-48h',
    slot: 1,
    dependsOn: ['t-intake'],
  }),
  task({
    id: 't-docme-email',
    title: 'Create DocMe360 Email',
    ownerId: 'justin',
    status: 'done',
    category: 'account-access',
    phaseId: 'p-24-48h',
    dependsOn: ['t-intake'],
  }),
  task({
    id: 't-slack-justworks',
    title: 'Create Slack & JustWorks Accounts',
    ownerId: 'paras',
    status: 'done',
    category: 'account-access',
    phaseId: 'p-24-48h',
    dependsOn: ['t-intake'],
  }),

  // ---- 1-2 Days (pre-start) ----
  task({
    id: 't-pto-calendar',
    title: 'Add new hire to PTO calendar group and companywide email list',
    ownerId: 'justin',
    status: 'done',
    category: 'account-access',
    phaseId: 'p-1-2d',
    dependsOn: ['t-docme-email'],
  }),
  task({
    id: 't-computer',
    title: 'Setup Computer allowance or Send Computer',
    ownerId: 'hiring-supervisor',
    status: 'done',
    category: 'hr-employment',
    phaseId: 'p-1-2d',
  }),
  task({
    id: 't-welcome-email',
    title: 'Send Welcome E-Mail',
    ownerId: 'hiring-supervisor',
    status: 'done',
    category: 'buddy-welcome',
    phaseId: 'p-1-2d',
    slot: 1,
    dependsOn: ['t-docme-email'],
  }),
  task({
    id: 't-team-meetings',
    title: 'Add new hire to team meetings',
    ownerId: 'hiring-supervisor',
    status: 'done',
    category: 'project-team-setup',
    phaseId: 'p-1-2d',
    slot: 2,
  }),
  task({
    id: 't-slack-channels',
    title: 'Add New Hire to Various Slack Channels',
    description: '#employee_celebrations and other standard channels.',
    ownerId: 'automation',
    status: 'done',
    category: 'automation',
    phaseId: 'p-1-2d',
    dependsOn: ['t-slack-justworks'],
  }),
  task({
    id: 't-bot-birthday',
    title: 'Setup slack bot reminders for birthday',
    ownerId: 'automation',
    status: 'done',
    category: 'automation',
    phaseId: 'p-1-2d',
    slot: 1,
    dependsOn: ['t-slack-justworks'],
  }),
  task({
    id: 't-bot-anniversary',
    title: 'Setup slack bot reminders for work anniversary',
    ownerId: 'automation',
    status: 'done',
    category: 'automation',
    phaseId: 'p-1-2d',
    slot: 2,
    dependsOn: ['t-slack-justworks'],
  }),
  task({
    id: 't-goalspan',
    title: 'Verify GoalSpan (including 30 & 90 day reviews)',
    ownerId: 'paras',
    status: 'in-progress',
    category: 'reviews-follow-up',
    phaseId: 'p-1-2d',
  }),
  task({
    id: 't-harassment-training',
    title: 'Setup Harassment and/or HIPAA Training',
    ownerId: 'melissa',
    status: 'in-progress',
    category: 'compliance',
    phaseId: 'p-1-2d',
    dependsOn: ['t-slack-justworks'],
  }),
  task({
    id: 't-workable',
    title: 'Add new hire to workable referrals',
    ownerId: 'melissa',
    status: 'done',
    category: 'hr-employment',
    phaseId: 'p-1-2d',
    slot: 1,
  }),
  task({
    id: 't-visio',
    title: 'Add new hire to DocMe360Structure - Visio',
    ownerId: 'melissa',
    status: 'done',
    category: 'hr-employment',
    phaseId: 'p-1-2d',
    slot: 2,
  }),
  task({
    id: 't-equipment-notion',
    title: 'Add new hire details to the equipment notion page',
    ownerId: 'melissa',
    status: 'in-progress',
    category: 'hr-employment',
    phaseId: 'p-1-2d',
    slot: 3,
  }),
  task({
    id: 't-all-hands-invites',
    title: "Forward All Hands Meeting Invites - W2's only",
    ownerId: 'anupe',
    status: 'done',
    category: 'project-team-setup',
    phaseId: 'p-1-2d',
  }),
  task({
    id: 't-org-chart',
    title: 'Add new hire to org chart in onboarding deck',
    ownerId: 'sheila',
    status: 'done',
    category: 'hr-employment',
    phaseId: 'p-1-2d',
  }),
  task({
    id: 't-managers-training',
    title: 'Add to Managers Training Series (if applicable)',
    ownerId: 'sheila',
    status: 'na',
    category: 'compliance',
    phaseId: 'p-1-2d',
    slot: 1,
  }),
  task({
    id: 't-dsva-slack',
    title: 'Create DSVA Slack Account (if applicable)',
    ownerId: 'project-lead',
    status: 'na',
    category: 'account-access',
    phaseId: 'p-1-2d',
  }),
  task({
    id: 't-va-gh',
    title: 'Create VA GH Account (if applicable)',
    ownerId: 'project-lead',
    status: 'na',
    category: 'account-access',
    phaseId: 'p-1-2d',
    slot: 1,
  }),

  // ---- First Day ----
  task({
    id: 't-starts',
    title: 'New Hire Starts DocMe360',
    ownerId: 'employee',
    status: 'done',
    category: 'new-hire-first-week',
    phaseId: 'p-day1',
  }),
  task({
    id: 't-join-slack',
    title: 'Join Slack',
    ownerId: 'employee',
    status: 'done',
    category: 'new-hire-first-week',
    phaseId: 'p-day1',
    slot: 1,
    dependsOn: ['t-slack-justworks'],
  }),
  task({
    id: 't-complete-justworks',
    title: 'Complete JustWorks',
    ownerId: 'employee',
    status: 'done',
    category: 'hr-employment',
    phaseId: 'p-day1',
    slot: 2,
    dependsOn: ['t-slack-justworks'],
  }),
  task({
    id: 't-welcome-meeting',
    title: 'Welcome Meeting - Review Onboarding Presentation',
    ownerId: 'hiring-supervisor',
    status: 'done',
    category: 'buddy-welcome',
    phaseId: 'p-day1',
  }),
  task({
    id: 't-background-check',
    title: 'Complete Background Check',
    ownerId: 'employee',
    status: 'in-progress',
    category: 'compliance',
    phaseId: 'p-day1',
    slot: 3,
  }),
  task({
    id: 't-meet-supervisor',
    title: 'Meet with Supervisor for Performance Review Process & System',
    ownerId: 'employee',
    status: 'done',
    category: 'new-hire-first-week',
    phaseId: 'p-day1',
    slot: 4,
  }),
  task({
    id: 't-linkedin-announce',
    title: 'Announce New Hire via LinkedIn',
    ownerId: 'becca',
    status: 'done',
    category: 'buddy-welcome',
    phaseId: 'p-day1',
  }),

  // ---- Days 2-4 ----
  task({
    id: 't-complete-training',
    title: 'Complete training (Slack, Harassment, project documentation)',
    ownerId: 'employee',
    status: 'blocked',
    category: 'compliance',
    phaseId: 'p-days2-4',
    dependsOn: ['t-harassment-training'],
  }),
  task({
    id: 't-va-onboarding',
    title: 'Complete VA Onboarding (if applicable)',
    ownerId: 'employee',
    status: 'na',
    category: 'compliance',
    phaseId: 'p-days2-4',
    slot: 1,
  }),
  task({
    id: 't-bio',
    title: 'Complete Bio',
    ownerId: 'employee',
    status: 'in-progress',
    category: 'new-hire-first-week',
    phaseId: 'p-days2-4',
    slot: 2,
  }),
  task({
    id: 't-headshot',
    title: 'Upload Headshot',
    ownerId: 'employee',
    status: 'ready',
    category: 'new-hire-first-week',
    phaseId: 'p-days2-4',
    slot: 3,
  }),
  task({
    id: 't-update-linkedin',
    title: 'Update LinkedIn',
    ownerId: 'employee',
    status: 'not-started',
    category: 'new-hire-first-week',
    phaseId: 'p-days2-4',
    slot: 4,
  }),
  task({
    id: 't-meet-project-lead',
    title: 'Meet with New Hire - Project Onboarding',
    ownerId: 'project-lead',
    status: 'not-started',
    category: 'project-team-setup',
    phaseId: 'p-days2-4',
  }),

  // ---- Day 5 ----
  task({
    id: 't-day5-checkin',
    title: 'Check in with Project Lead - How are things going?',
    ownerId: 'employee',
    status: 'not-started',
    category: 'reviews-follow-up',
    phaseId: 'p-day5',
    dueTiming: 'End of Day 5',
  }),
  task({
    id: 't-pl-day5-checkin',
    title: 'Check in with New Hire to see how things are going',
    ownerId: 'project-lead',
    status: 'not-started',
    category: 'reviews-follow-up',
    phaseId: 'p-day5',
  }),

  // ---- Days 6-29 ----
  task({
    id: 't-attend-meetings',
    title: 'Attend team meetings and check-ins w/ Project Lead and Supervisor',
    ownerId: 'employee',
    status: 'not-started',
    category: 'project-team-setup',
    phaseId: 'p-days6-29',
  }),
  task({
    id: 't-periodic-checkin',
    title: 'Conduct periodic check-in w/ new hire',
    ownerId: 'hiring-supervisor',
    status: 'not-started',
    category: 'reviews-follow-up',
    phaseId: 'p-days6-29',
  }),

  // ---- Day 30 ----
  task({
    id: 't-30-day-review',
    title: 'Complete 30 day Review',
    ownerId: 'employee',
    status: 'not-started',
    category: 'reviews-follow-up',
    phaseId: 'p-day30',
  }),
  task({
    id: 't-sup-30-day',
    title: 'Complete 30-Day Review',
    ownerId: 'hiring-supervisor',
    status: 'not-started',
    category: 'reviews-follow-up',
    phaseId: 'p-day30',
  }),

  // ---- Day 90 ----
  task({
    id: 't-90-day-review',
    title: 'Complete 90 day review',
    ownerId: 'employee',
    status: 'blocked',
    category: 'reviews-follow-up',
    phaseId: 'p-day90',
    dependsOn: ['t-30-day-review'],
  }),
  task({
    id: 't-sup-90-day',
    title: 'Complete 90 Day Review',
    ownerId: 'hiring-supervisor',
    status: 'blocked',
    category: 'reviews-follow-up',
    phaseId: 'p-day90',
    dependsOn: ['t-sup-30-day'],
  }),

  // ---- Complete ----
  task({
    id: 't-complete',
    title: 'Onboarding Complete',
    ownerId: 'employee',
    status: 'blocked',
    category: 'reviews-follow-up',
    phaseId: 'p-complete',
    dependsOn: ['t-90-day-review', 't-sup-90-day'],
  }),
];

/** Returns a fresh copy of the mock board (safe to mutate in state). */
export function buildMockBoard(): OnboardingBoard {
  return {
    id: 'board-marissa',
    employeeId: MOCK_EMPLOYEE.id,
    phases: structuredClone(PHASES),
    swimlanes: structuredClone(SWIMLANES),
    tasks: structuredClone(TASKS),
  };
}
