import { buildMockBoard, MOCK_EMPLOYEE } from './mockBoard';
import { recalculateDependencies } from '../logic/dependencies';
import type {
  AppState,
  Employee,
  OnboardingBoard,
  TaskStatus,
} from '../types/board';

// Five hires covering every dashboard filter:
// - Marissa: active mid-onboarding (handcrafted template statuses)
// - Dalton: starts next week (starting soon)
// - Priscilla: stuck — blocked + overdue, next action on leadership
// - Jordan: month in, remaining work is her own (waiting on new hire, overdue)
// - Alex: fully completed
export const MOCK_EMPLOYEES: Employee[] = [
  MOCK_EMPLOYEE,
  {
    id: 'emp-Dalton',
    name: 'Dalton P.',
    preferredName: 'Dalton',
    role: 'Backend Engineer',
    location: 'Austin, Texas',
    startDate: '2026-07-20',
    supervisor: 'Dana K.',
    projectLead: 'Chris M.',
  },
  {
    id: 'emp-Priscilla',
    name: 'Priscilla S.',
    preferredName: 'Priscilla',
    role: 'UX Designer',
    location: 'Remote — Denver, Colorado',
    startDate: '2026-07-08',
    supervisor: 'Dana K.',
    projectLead: 'Sam W.',
  },
  {
    id: 'emp-jordan',
    name: 'Jordan T.',
    preferredName: 'Jordan',
    role: 'Data Analyst',
    location: 'Portland, Oregon',
    startDate: '2026-06-15',
    supervisor: 'Miguel A.',
    projectLead: 'Chris M.',
  },
  {
    id: 'emp-alex',
    name: 'Alex R.',
    preferredName: 'Alex',
    role: 'DevOps Engineer',
    location: 'Boise, Idaho',
    startDate: '2026-03-02',
    supervisor: 'Miguel A.',
    projectLead: 'Sam W.',
  },
];

type Profile = {
  /** Reset all template statuses to not-started first (keeps N/A). */
  reset?: boolean;
  /** Mark every task in phases up to and including this index done. */
  doneThroughPhase?: number;
  /** Per-task status overrides, applied last. */
  overrides?: Record<string, TaskStatus>;
};

function buildBoardFor(employee: Employee, profile?: Profile): OnboardingBoard {
  const board = buildMockBoard();
  board.id = `board-${employee.id}`;
  board.employeeId = employee.id;

  if (profile) {
    const phaseIndex = Object.fromEntries(
      board.phases.map((phase, index) => [phase.id, index]),
    );
    board.tasks = board.tasks.map((task) => {
      let status = task.status;
      if (profile.reset) {
        status = status === 'na' ? 'na' : 'not-started';
      }
      if (
        profile.doneThroughPhase !== undefined &&
        status !== 'na' &&
        (phaseIndex[task.phaseId] ?? Infinity) <= profile.doneThroughPhase
      ) {
        status = 'done';
      }
      const override = profile.overrides?.[task.id];
      if (override) status = override;
      return { ...task, status };
    });
    board.tasks = recalculateDependencies(board.tasks).tasks;
  }

  return board;
}

export function buildMockData(): AppState {
  return {
    employees: structuredClone(MOCK_EMPLOYEES),
    boards: [
      // Marissa keeps the handcrafted template statuses.
      buildBoardFor(MOCK_EMPLOYEES[0]!),

      // Dalton: pre-start prep just kicked off.
      buildBoardFor(MOCK_EMPLOYEES[1]!, {
        reset: true,
        overrides: {
          't-intake': 'done',
          't-slack-justworks': 'in-progress',
          't-docme-email': 'in-progress',
          't-identify-buddy': 'in-progress',
        },
      }),

      // Priscilla: on a VA project, week one stalled — training was never set up
      // (overdue for Melissa), her compliance training is blocked on it, and
      // the next actionable item belongs to the Hiring Supervisor.
      buildBoardFor(MOCK_EMPLOYEES[2]!, {
        reset: true,
        doneThroughPhase: 0,
        overrides: {
          't-pto-calendar': 'done',
          't-computer': 'done',
          't-welcome-email': 'done',
          't-team-meetings': 'done',
          't-slack-channels': 'done',
          't-bot-birthday': 'done',
          't-bot-anniversary': 'done',
          't-goalspan': 'done',
          't-workable': 'done',
          't-visio': 'done',
          't-equipment-notion': 'done',
          't-all-hands-invites': 'done',
          't-org-chart': 'done',
          't-harassment-training': 'not-started',
          't-dsva-slack': 'not-started',
          't-va-gh': 'not-started',
          't-va-onboarding': 'not-started',
          't-starts': 'done',
          't-join-slack': 'done',
          't-complete-justworks': 'done',
          't-welcome-meeting': 'in-progress',
          't-background-check': 'in-progress',
          't-linkedin-announce': 'done',
        },
      }),

      // Jordan: a month in; company-side work is done, what's left is hers.
      buildBoardFor(MOCK_EMPLOYEES[3]!, {
        reset: true,
        doneThroughPhase: 2,
        overrides: {
          't-complete-training': 'done',
          't-meet-project-lead': 'done',
          't-day5-checkin': 'done',
          't-pl-day5-checkin': 'done',
          't-attend-meetings': 'in-progress',
          't-periodic-checkin': 'done',
          't-bio': 'in-progress',
          't-headshot': 'ready',
          't-update-linkedin': 'not-started',
        },
      }),

      // Alex: everything wrapped, including the 90-day reviews.
      buildBoardFor(MOCK_EMPLOYEES[4]!, {
        reset: true,
        doneThroughPhase: 8,
      }),
    ],
  };
}
