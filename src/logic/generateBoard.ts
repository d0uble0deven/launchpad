import { buildMockBoard } from '../data/mockBoard';
import { recalculateDependencies } from './dependencies';
import type { Employee, OnboardingBoard, TaskCard } from '../types/board';

export type GenerationNote = {
  taskTitle: string;
  action: 'marked N/A' | 'completed';
  reason: string;
};

/**
 * Simple conditional rules, mirroring the annotations on the real Mural
 * board ("if applicable", "W2's only"). Each rule marks a template task N/A
 * when it doesn't apply to this hire.
 */
const CONDITIONAL_RULES: Array<{
  taskIds: string[];
  applies: (employee: Employee) => boolean;
  reason: string;
}> = [
  {
    taskIds: ['t-va-onboarding', 't-dsva-slack', 't-va-gh'],
    applies: (employee) => employee.vaProject === true,
    reason: 'Not on a VA project',
  },
  {
    taskIds: ['t-all-hands-invites'],
    applies: (employee) => employee.employeeType !== '1099',
    reason: 'W2 employees only (hire is a 1099 contractor)',
  },
  {
    taskIds: ['t-managers-training'],
    applies: (employee) => Boolean(employee.directReports?.trim()),
    reason: 'No direct reports',
  },
];

function intakeDescription(employee: Employee): string {
  const lines = [
    'Collected via the LaunchPad New Hire form:',
    `• Start date: ${employee.startDate}`,
    `• Role: ${employee.role}${employee.employeeGroup ? ` (${employee.employeeGroup})` : ''}`,
    `• Employee type: ${employee.employeeType === '1099' ? '1099 contractor' : 'W2 employee'}`,
  ];
  if (employee.personalEmail) lines.push(`• Personal email: ${employee.personalEmail}`);
  if (employee.projectName) lines.push(`• Project: ${employee.projectName}`);
  if (employee.supervisor) lines.push(`• Supervisor: ${employee.supervisor}`);
  if (employee.projectLead) lines.push(`• Project lead: ${employee.projectLead}`);
  if (employee.vaProject) {
    const needs = [
      'VA project',
      employee.needsPiv ? 'PIV card required' : null,
      employee.needsGfe ? 'GFE equipment required' : null,
    ].filter(Boolean);
    lines.push(`• ${needs.join(' · ')}`);
  }
  if (employee.directReports?.trim()) {
    lines.push(`• Direct reports / team: ${employee.directReports.trim()}`);
  }
  return lines.join('\n');
}

/**
 * Generates a fresh onboarding board for a new hire from the default
 * template: all statuses reset, conditional tasks marked N/A, the intake
 * step auto-completed (the form itself is the intake), and dependency
 * statuses recalculated.
 */
export function generateBoardForEmployee(employee: Employee): {
  board: OnboardingBoard;
  notes: GenerationNote[];
} {
  const board = buildMockBoard();
  board.id = `board-${employee.id}`;
  board.employeeId = employee.id;

  const notes: GenerationNote[] = [];
  const now = new Date().toISOString();
  const displayName = employee.preferredName || employee.name;

  const naByTask = new Map<string, string>();
  for (const rule of CONDITIONAL_RULES) {
    if (!rule.applies(employee)) {
      for (const id of rule.taskIds) naByTask.set(id, rule.reason);
    }
  }

  board.tasks = board.tasks.map((template): TaskCard => {
    const task: TaskCard = {
      ...template,
      status: 'not-started',
      notes: '',
      activity: [
        {
          id: `${template.id}-a1`,
          timestamp: now,
          message: `Board generated for ${displayName}`,
        },
      ],
    };

    const naReason = naByTask.get(task.id);
    if (naReason) {
      task.status = 'na';
      task.activity.push({
        id: `${task.id}-a2`,
        timestamp: now,
        message: `Marked N/A — ${naReason}`,
      });
      notes.push({ taskTitle: task.title, action: 'marked N/A', reason: naReason });
    }

    if (task.id === 't-intake') {
      task.status = 'done';
      task.description = intakeDescription(employee);
      task.activity.push({
        id: `${task.id}-a2`,
        timestamp: now,
        message: 'Completed automatically — intake collected by the New Hire form',
      });
      notes.push({
        taskTitle: task.title,
        action: 'completed',
        reason: 'Intake was collected by the New Hire form',
      });
    }

    if (task.id === 't-computer' && employee.laptopPreference) {
      task.notes = `Laptop preference: ${employee.laptopPreference}`;
    }
    if (task.id === 't-va-onboarding' && employee.vaProject) {
      const extras = [
        employee.needsPiv ? 'PIV card required.' : null,
        employee.needsGfe ? 'GFE equipment required.' : null,
      ].filter(Boolean);
      if (extras.length > 0) task.notes = extras.join(' ');
    }

    return task;
  });

  const { tasks } = recalculateDependencies(board.tasks);
  board.tasks = tasks;
  return { board, notes };
}
