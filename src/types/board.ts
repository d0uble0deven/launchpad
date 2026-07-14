export type TaskStatus =
  | 'not-started'
  | 'blocked'
  | 'ready'
  | 'in-progress'
  | 'done'
  | 'na';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'not-started': 'Not Started',
  blocked: 'Blocked',
  ready: 'Ready',
  'in-progress': 'In Progress',
  done: 'Done',
  na: 'N/A',
};

export type TaskCategory =
  | 'intake'
  | 'hr-employment'
  | 'compliance'
  | 'account-access'
  | 'project-team-setup'
  | 'buddy-welcome'
  | 'new-hire-first-week'
  | 'reviews-follow-up'
  | 'automation';

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  intake: 'Intake',
  'hr-employment': 'HR / Employment',
  compliance: 'Compliance',
  'account-access': 'Account & Access',
  'project-team-setup': 'Project / Team Setup',
  'buddy-welcome': 'Buddy & Welcome',
  'new-hire-first-week': 'New Hire First Week',
  'reviews-follow-up': 'Reviews / Follow-Up',
  automation: 'Automation',
};
