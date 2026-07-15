import type {
  Employee,
  OnboardingBoard,
  TaskCard,
  TaskCategory,
} from '../types/board';
import { CATEGORY_LABELS } from '../types/board';

/**
 * Day offset (relative to start date) by which each phase should be finished.
 * Matches the board's phase order: 24–48 Hours, 1–2 Days (both pre-start),
 * First Day, Days 2–4, Day 5, Days 6–29, Day 30, Day 90, Complete.
 */
const PHASE_END_DAYS = [-1, 0, 1, 4, 5, 29, 30, 90, Infinity];

export type ReviewStatus = 'Done' | 'Blocked' | 'Due' | 'Upcoming';

export type CategoryProgress = {
  category: TaskCategory;
  label: string;
  done: number;
  total: number;
};

export type EmployeeSummary = {
  employeeId: string;
  /** Done / countable (N/A excluded), as a rounded percentage. */
  overallPct: number;
  doneCount: number;
  totalCount: number;
  currentStep: number;
  daysSinceStart: number;
  currentBlocker: string | null;
  nextOwner: string | null;
  nextOwnerId: string | null;
  overdueCount: number;
  day1Ready: boolean;
  day1Remaining: number;
  day30: ReviewStatus;
  day90: ReviewStatus;
  byCategory: CategoryProgress[];
  flags: {
    active: boolean;
    blocked: boolean;
    overdue: boolean;
    startingSoon: boolean;
    waitingOnLeadership: boolean;
    waitingOnNewHire: boolean;
    completed: boolean;
  };
};

const LEADERSHIP_LANES = ['hiring-supervisor', 'project-lead'];

function isSatisfied(task: TaskCard): boolean {
  return task.status === 'done' || task.status === 'na';
}

export function summarizeBoard(
  employee: Employee,
  board: OnboardingBoard,
  today: Date = new Date(),
): EmployeeSummary {
  const phaseIndex = Object.fromEntries(
    board.phases.map((phase, index) => [phase.id, index]),
  );
  const laneLabel = Object.fromEntries(
    board.swimlanes.map((lane) => [lane.id, lane.label]),
  );
  const phaseIdxOf = (task: TaskCard) => phaseIndex[task.phaseId] ?? Infinity;
  const phaseEndDay = (task: TaskCard) =>
    PHASE_END_DAYS[phaseIdxOf(task)] ?? Infinity;

  // Chronological order for "first blocker" / "next owner" semantics.
  const ordered = [...board.tasks].sort((a, b) => phaseIdxOf(a) - phaseIdxOf(b));

  const daysSinceStart = Math.floor(
    (today.getTime() - new Date(employee.startDate).getTime()) / 86_400_000,
  );
  const startingSoon = daysSinceStart < 0;

  // "Current" phase: the first phase whose window hasn't closed yet.
  const currentPhaseIdx = PHASE_END_DAYS.findIndex(
    (end) => daysSinceStart <= end,
  );

  const countable = ordered.filter((task) => task.status !== 'na');
  const doneCount = countable.filter((task) => task.status === 'done').length;
  const overallPct =
    countable.length === 0
      ? 0
      : Math.round((doneCount / countable.length) * 100);

  // Current step = number of completed steps + 1 (clamped when finished).
  const currentStep = Math.min(doneCount + 1, countable.length);

  // Only count a blocker if its phase is already current or past — a blocked
  // 90-day review shouldn't flag a hire who started last week.
  const relevantBlocked = ordered.filter(
    (task) => task.status === 'blocked' && phaseIdxOf(task) <= currentPhaseIdx,
  );
  const currentBlocker = relevantBlocked[0]?.title ?? null;

  // Next owner: whoever holds the first task that is actionable right now.
  const nextTask =
    ordered.find((task) => task.status === 'in-progress') ??
    ordered.find((task) => task.status === 'ready') ??
    ordered.find((task) => task.status === 'not-started');
  const nextOwnerId = nextTask?.ownerId ?? null;
  const nextOwner = nextOwnerId ? (laneLabel[nextOwnerId] ?? nextOwnerId) : null;

  const overdueCount = startingSoon
    ? 0
    : ordered.filter(
        (task) => !isSatisfied(task) && phaseEndDay(task) < daysSinceStart,
      ).length;

  // Day 1 readiness: both pre-start phases fully satisfied.
  const preStartTasks = ordered.filter((task) => phaseIdxOf(task) <= 1);
  const day1Remaining = preStartTasks.filter((task) => !isSatisfied(task)).length;
  const day1Ready = day1Remaining === 0;

  const reviewStatus = (phaseIdx: number, dueDay: number): ReviewStatus => {
    const tasks = ordered.filter((task) => phaseIdxOf(task) === phaseIdx);
    if (tasks.length > 0 && tasks.every(isSatisfied)) return 'Done';
    // Not yet due: always "Upcoming", even if the review chain is still
    // blocked — a week-one hire shouldn't show a blocked 90-day review.
    if (daysSinceStart < dueDay) return 'Upcoming';
    return tasks.some((task) => task.status === 'blocked') ? 'Blocked' : 'Due';
  };

  const byCategory = (
    Object.entries(CATEGORY_LABELS) as Array<[TaskCategory, string]>
  )
    .map(([category, label]) => {
      const tasks = countable.filter((task) => task.category === category);
      return {
        category,
        label,
        done: tasks.filter((task) => task.status === 'done').length,
        total: tasks.length,
      };
    })
    .filter((entry) => entry.total > 0);

  const completed = countable.length > 0 && doneCount === countable.length;

  return {
    employeeId: employee.id,
    overallPct,
    doneCount,
    totalCount: countable.length,
    currentStep,
    daysSinceStart,
    currentBlocker,
    nextOwner,
    nextOwnerId,
    overdueCount,
    day1Ready,
    day1Remaining,
    day30: reviewStatus(6, 30),
    day90: reviewStatus(7, 90),
    byCategory,
    flags: {
      active: !completed && !startingSoon,
      blocked: relevantBlocked.length > 0,
      overdue: overdueCount > 0,
      startingSoon,
      waitingOnLeadership:
        !completed && nextOwnerId !== null && LEADERSHIP_LANES.includes(nextOwnerId),
      waitingOnNewHire: !completed && nextOwnerId === 'employee',
      completed,
    },
  };
}
