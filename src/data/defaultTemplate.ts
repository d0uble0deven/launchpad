import { buildMockBoard } from './mockBoard';
import type { ConditionRule, Template, TemplateTask } from '../types/board';

/**
 * Conditional-task rules, mirroring the real Mural's "(if applicable)",
 * "W2's only" annotations. A task only applies to a hire when every rule
 * matches; otherwise it's marked N/A on their generated board.
 */
const TASK_CONDITIONS: Record<string, ConditionRule[]> = {
  't-va-onboarding': [
    { id: 'c-va-onboarding', field: 'vaProject', value: 'yes' },
  ],
  't-dsva-slack': [{ id: 'c-dsva', field: 'vaProject', value: 'yes' }],
  't-va-gh': [{ id: 'c-va-gh', field: 'vaProject', value: 'yes' }],
  't-all-hands-invites': [
    { id: 'c-all-hands', field: 'employeeType', value: 'w2' },
  ],
  't-managers-training': [
    { id: 'c-mgrs', field: 'hasDirectReports', value: 'yes' },
  ],
};

/**
 * Builds the default onboarding template from the mock board's structure.
 * Runtime fields (status/notes/activity) are dropped; conditional tasks pick
 * up their rules and are flagged optional.
 */
export function buildDefaultTemplate(): Template {
  const board = buildMockBoard();
  const tasks: TemplateTask[] = board.tasks.map((task) => {
    const conditions = TASK_CONDITIONS[task.id] ?? [];
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      ownerId: task.ownerId,
      backupOwner: task.backupOwner,
      category: task.category,
      phaseId: task.phaseId,
      dueTiming: task.dueTiming,
      dependsOn: [...task.dependsOn],
      links: task.links.map((link) => ({ ...link })),
      required: conditions.length === 0,
      conditions: conditions.map((rule) => ({ ...rule })),
      position: { ...task.position },
    };
  });

  return {
    id: 'template-default',
    name: 'Default Onboarding Template',
    phases: structuredClone(board.phases),
    swimlanes: structuredClone(board.swimlanes),
    tasks,
  };
}
