import type { BoardSwimlane, Employee } from '../types/board';

export type OwnerDisplay = {
  /** The actual person's name where we know it, else the lane label. */
  name: string;
  /** Their role/title, when the name is a resolved person. */
  title: string | null;
};

/**
 * Turn a generic lane label into the actual person for this hire's board:
 * - `employee` → the hire themself (name + their job title)
 * - `hiring-supervisor` / `project-lead` → the names captured on the
 *   employee record at intake
 * - anything else (named staff lanes, automation) → the lane label as-is
 *
 * Shared by the board UI and the server's Slack messages so "Owner" reads
 * the same everywhere.
 */
export function resolveOwnerDisplay(
  laneId: string,
  laneLabel: string,
  employee: Employee | null | undefined,
  laneTitle?: string,
): OwnerDisplay {
  if (employee) {
    if (laneId === 'employee') {
      return {
        name: employee.preferredName || employee.name,
        title: employee.role || 'New hire',
      };
    }
    if (laneId === 'hiring-supervisor' && employee.supervisor) {
      return { name: employee.supervisor, title: 'Hiring Supervisor' };
    }
    if (laneId === 'project-lead' && employee.projectLead) {
      return { name: employee.projectLead, title: 'Project Lead' };
    }
  }
  // Named staff lanes: the label is already the person; the optional
  // per-lane title (set in the template/board data) is their role.
  return { name: laneLabel, title: laneTitle ?? null };
}

/** Resolve every lane on a board at once (keyed by lane id). */
export function ownerDisplayMap(
  swimlanes: BoardSwimlane[],
  employee: Employee | null | undefined,
): Record<string, OwnerDisplay> {
  return Object.fromEntries(
    swimlanes.map((lane) => [
      lane.id,
      resolveOwnerDisplay(lane.id, lane.label, employee, lane.title),
    ]),
  );
}
