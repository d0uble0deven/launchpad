import { recalculateDependencies } from './dependencies';
import type {
  ConditionField,
  Employee,
  OnboardingBoard,
  TaskCard,
  Template,
} from '../types/board';

export type GenerationNote = {
  taskTitle: string;
  action: 'marked N/A' | 'completed';
  reason: string;
};

const FIELD_LABEL: Record<ConditionField, string> = {
  vaProject: 'VA project',
  employeeType: 'Employee type',
  hasDirectReports: 'Direct reports',
};

const VALUE_LABEL: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  w2: 'W2 employee',
  '1099': '1099 contractor',
};

/** The employee's value for a condition field, normalized to rule values. */
function employeeFieldValue(employee: Employee, field: ConditionField): string {
  switch (field) {
    case 'vaProject':
      return employee.vaProject ? 'yes' : 'no';
    case 'employeeType':
      return employee.employeeType ?? 'w2';
    case 'hasDirectReports':
      return employee.directReports?.trim() ? 'yes' : 'no';
  }
}

export function describeConditions(
  conditions: { field: ConditionField; value: string }[],
): string {
  return conditions
    .map(
      (rule) =>
        `${FIELD_LABEL[rule.field]} is ${VALUE_LABEL[rule.value] ?? rule.value}`,
    )
    .join(' and ');
}

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
 * Generates a fresh onboarding board for a new hire from the given template:
 * template tasks become not-started board tasks, conditional tasks whose rules
 * don't match the hire are marked N/A, the intake step is auto-completed (the
 * form itself is the intake), and dependency statuses are recalculated.
 */
export function generateBoardForEmployee(
  employee: Employee,
  template: Template,
): { board: OnboardingBoard; notes: GenerationNote[] } {
  const notes: GenerationNote[] = [];
  const now = new Date().toISOString();
  const displayName = employee.preferredName || employee.name;

  const tasks: TaskCard[] = template.tasks.map((tmpl): TaskCard => {
    const task: TaskCard = {
      id: tmpl.id,
      title: tmpl.title,
      description: tmpl.description,
      ownerId: tmpl.ownerId,
      backupOwner: tmpl.backupOwner,
      status: 'not-started',
      category: tmpl.category,
      phaseId: tmpl.phaseId,
      dueTiming: tmpl.dueTiming,
      dependsOn: [...tmpl.dependsOn],
      links: tmpl.links.map((link) => ({ ...link })),
      notes: '',
      activity: [
        {
          id: `${tmpl.id}-a1`,
          timestamp: now,
          message: `Board generated for ${displayName}`,
        },
      ],
      position: { ...tmpl.position },
    };

    // Conditional rules: if any rule doesn't match this hire, mark N/A.
    if (tmpl.conditions.length > 0) {
      const matches = tmpl.conditions.every(
        (rule) => employeeFieldValue(employee, rule.field) === rule.value,
      );
      if (!matches) {
        const reason = `Only applies when ${describeConditions(tmpl.conditions)}`;
        task.status = 'na';
        task.activity.push({
          id: `${task.id}-a2`,
          timestamp: now,
          message: `Marked N/A — ${reason}`,
        });
        notes.push({ taskTitle: task.title, action: 'marked N/A', reason });
      }
    }

    if (task.id === 't-intake') {
      task.status = 'done';
      task.description = intakeDescription(employee);
      task.activity.push({
        id: `${task.id}-a3`,
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

  const board: OnboardingBoard = {
    id: `board-${employee.id}`,
    employeeId: employee.id,
    phases: structuredClone(template.phases),
    swimlanes: structuredClone(template.swimlanes),
    tasks: recalculateDependencies(tasks).tasks,
  };

  return { board, notes };
}
