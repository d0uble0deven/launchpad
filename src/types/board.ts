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

export type EmployeeType = 'w2' | '1099';

export type Employee = {
  id: string;
  name: string;
  preferredName?: string;
  role: string;
  location: string;
  startDate: string;
  supervisor?: string;
  projectLead?: string;
  /** Mocked "current step" indicator, e.g. 38. */
  currentStep?: number;
  // Intake fields collected by the New Hire form (MVP 3).
  projectName?: string;
  employeeType?: EmployeeType;
  personalEmail?: string;
  laptopPreference?: string;
  employeeGroup?: string;
  vaProject?: boolean;
  needsPiv?: boolean;
  needsGfe?: boolean;
  directReports?: string;
  jobDescription?: string;
};

/**
 * Timeline phase. Phases are horizontal regions on the free canvas (like the
 * real Mural), so each carries its pixel origin and width.
 */
export type BoardPhase = {
  id: string;
  label: string;
  x: number;
  width: number;
};

/**
 * Owner swimlane. Lanes are vertical regions on the canvas; cards inherit the
 * lane color, matching the real Mural.
 */
export type BoardSwimlane = {
  id: string;
  label: string;
  /** Optional role/title shown under the person's name on cards. */
  title?: string;
  color: string;
  y: number;
  height: number;
};

export type ResourceLink = {
  id: string;
  label: string;
  url: string;
};

/** Id of a prerequisite task. */
export type TaskDependency = TaskCard['id'];

export type ActivityEntry = {
  id: string;
  timestamp: string;
  message: string;
};

export type TaskCard = {
  id: string;
  title: string;
  description: string;
  /** Swimlane id of the responsible owner. */
  ownerId: string;
  backupOwner?: string;
  status: TaskStatus;
  category: TaskCategory;
  phaseId: string;
  /** Free-text due timing, e.g. "Before start date" or "End of Day 5". */
  dueTiming?: string;
  dependsOn: TaskDependency[];
  links: ResourceLink[];
  notes: string;
  activity: ActivityEntry[];
  /** Free canvas position (Mural-style). */
  position: { x: number; y: number };
};

export type OnboardingBoard = {
  id: string;
  employeeId: string;
  phases: BoardPhase[];
  swimlanes: BoardSwimlane[];
  tasks: TaskCard[];
};

// ---- Template model (MVP 4) ----

/** Employee attribute a conditional rule can test. */
export type ConditionField = 'vaProject' | 'employeeType' | 'hasDirectReports';

/**
 * A conditional rule on a template task. The task only applies to a hire when
 * the employee's `field` equals `value`; otherwise it's marked N/A on their
 * generated board (mirrors the Mural's "(if applicable)" annotations).
 */
export type ConditionRule = {
  id: string;
  field: ConditionField;
  value: string;
};

/** A reusable task definition in the onboarding template. */
export type TemplateTask = {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  backupOwner?: string;
  category: TaskCategory;
  phaseId: string;
  dueTiming?: string;
  dependsOn: string[];
  links: ResourceLink[];
  /** Required vs. optional step. */
  required: boolean;
  /** Empty = always applies. */
  conditions: ConditionRule[];
  position: { x: number; y: number };
};

/** The reusable onboarding workflow that new-hire boards are generated from. */
export type Template = {
  id: string;
  name: string;
  phases: BoardPhase[];
  swimlanes: BoardSwimlane[];
  tasks: TemplateTask[];
};

/** Everything LaunchPad persists: the template, all hires, and their boards. */
export type AppState = {
  template: Template;
  employees: Employee[];
  boards: OnboardingBoard[];
};
