import {
  getCurrentBlocker,
  getCurrentPhaseIndex,
  getDaysSinceStart,
  orderTasksByPhase,
} from './progress';
import type {
  BoardPhase,
  Employee,
  OnboardingBoard,
  TaskCard,
} from '../types/board';

/**
 * Zoom at which task card titles are comfortably readable — the board should
 * open here, showing ~2 phases and a few swimlanes, not the whole poster.
 */
export const READABLE_ZOOM = 0.85;

/** Zoom for centering a whole phase column while keeping cards legible. */
export const PHASE_ZOOM = 0.55;

// ---- Semantic zoom ----

/**
 * Below OVERVIEW_MAX_ZOOM cards render as colored tiles (overview map);
 * between the two, as compact cards; above COMPACT_MAX_ZOOM, as full cards.
 * READABLE_ZOOM (0.85) lands in full mode, PHASE_ZOOM (0.55) in compact,
 * and Fit Board (~0.1–0.2) in overview.
 */
export const OVERVIEW_MAX_ZOOM = 0.45;
export const COMPACT_MAX_ZOOM = 0.75;

export type BoardZoomMode = 'overview' | 'compact' | 'full';

export function getZoomMode(zoom: number): BoardZoomMode {
  if (zoom < OVERVIEW_MAX_ZOOM) return 'overview';
  if (zoom < COMPACT_MAX_ZOOM) return 'compact';
  return 'full';
}

/** Task card dimensions on the canvas (see TaskCard.module.css). */
const CARD_WIDTH = 210;
const CARD_HEIGHT = 110;

export type ViewportTarget =
  | {
      kind: 'linked-task' | 'current-blocker' | 'current-step' | 'first-ready';
      task: TaskCard;
      reason: string;
    }
  | {
      kind: 'current-phase' | 'board-start';
      phase: BoardPhase;
      reason: string;
    };

/** First in-progress task, in chronological order. */
export function getCurrentStepTask(board: OnboardingBoard): TaskCard | null {
  return (
    orderTasksByPhase(board).find((task) => task.status === 'in-progress') ??
    null
  );
}

/** First ready task, in chronological order. */
export function getFirstReadyTask(board: OnboardingBoard): TaskCard | null {
  return (
    orderTasksByPhase(board).find((task) => task.status === 'ready') ?? null
  );
}

/**
 * Where the board should open, in priority order:
 * 1. a task deep-linked via URL (?task=…)
 * 2. the current blocker
 * 3. the current step (first in-progress task)
 * 4. the first ready task
 * 5. the phase matching the hire's onboarding timing
 * 6. the beginning of the board (intake area)
 */
export function getInitialViewportTarget(
  board: OnboardingBoard,
  employee: Employee,
  linkedTaskId?: string | null,
  today: Date = new Date(),
): ViewportTarget {
  if (linkedTaskId) {
    const task = board.tasks.find((t) => t.id === linkedTaskId);
    if (task) {
      return { kind: 'linked-task', task, reason: `linked task — "${task.title}"` };
    }
  }

  const blocker = getCurrentBlocker(board, employee, today);
  if (blocker) {
    return {
      kind: 'current-blocker',
      task: blocker,
      reason: `current blocker — "${blocker.title}"`,
    };
  }

  const currentStep = getCurrentStepTask(board);
  if (currentStep) {
    return {
      kind: 'current-step',
      task: currentStep,
      reason: `current step — "${currentStep.title}"`,
    };
  }

  const firstReady = getFirstReadyTask(board);
  if (firstReady) {
    return {
      kind: 'first-ready',
      task: firstReady,
      reason: `first ready task — "${firstReady.title}"`,
    };
  }

  const phaseIdx = Math.min(
    getCurrentPhaseIndex(getDaysSinceStart(employee, today)),
    board.phases.length - 1,
  );
  const phase = board.phases[phaseIdx];
  if (phase) {
    return {
      kind: 'current-phase',
      phase,
      reason: `current phase — "${phase.label}"`,
    };
  }

  return {
    kind: 'board-start',
    phase: board.phases[0]!,
    reason: 'beginning of board (intake area)',
  };
}

/** Canvas coordinates of a task card's center. */
export function taskCenter(task: TaskCard): { x: number; y: number } {
  return {
    x: task.position.x + CARD_WIDTH / 2,
    y: task.position.y + CARD_HEIGHT / 2,
  };
}

/** Canvas coordinates of a phase column's center (vertically mid-lanes). */
export function phaseCenter(
  board: OnboardingBoard,
  phase: BoardPhase,
): { x: number; y: number } {
  const firstLane = board.swimlanes[0];
  const lastLane = board.swimlanes[board.swimlanes.length - 1];
  const y =
    firstLane && lastLane
      ? (firstLane.y + lastLane.y + lastLane.height) / 2
      : 0;
  return { x: phase.x + phase.width / 2, y };
}
