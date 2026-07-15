import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import EmployeeDashboardCard from '../../components/organisms/EmployeeDashboardCard/EmployeeDashboardCard';
import { summarizeBoard } from '../../logic/progress';
import type { EmployeeSummary } from '../../logic/progress';
import { useAppState } from '../../state/AppStateContext';
import styles from './DashboardPage.module.css';

type FilterKey =
  | 'all'
  | 'active'
  | 'blocked'
  | 'overdue'
  | 'startingSoon'
  | 'waitingOnLeadership'
  | 'waitingOnNewHire'
  | 'completed';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'startingSoon', label: 'Starting soon' },
  { key: 'waitingOnLeadership', label: 'Waiting on leadership' },
  { key: 'waitingOnNewHire', label: 'Waiting on new hire' },
  { key: 'completed', label: 'Completed' },
];

function matches(summary: EmployeeSummary, filter: FilterKey): boolean {
  return filter === 'all' || summary.flags[filter];
}

function DashboardPage() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');

  const rows = useMemo(
    () =>
      state.employees.flatMap((employee) => {
        const board = state.boards.find((b) => b.employeeId === employee.id);
        return board ? [{ employee, summary: summarizeBoard(employee, board) }] : [];
      }),
    [state],
  );

  const counts = useMemo(() => {
    const byFilter = {} as Record<FilterKey, number>;
    for (const { key } of FILTERS) {
      byFilter[key] = rows.filter((row) => matches(row.summary, key)).length;
    }
    return byFilter;
  }, [rows]);

  const visible = rows.filter((row) => matches(row.summary, filter));

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Onboarding Dashboard</h1>
          <p className={styles.subtitle}>
            {rows.length} hires · {counts.blocked} blocked · {counts.overdue}{' '}
            overdue · {counts.completed} completed
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/new-hire')}>
          + New Hire
        </Button>
      </header>

      <div className={styles.filters} role="group" aria-label="Filter hires">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${filter === key ? styles.chipActive : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className={styles.chipCount}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map(({ employee, summary }) => (
            <EmployeeDashboardCard
              key={employee.id}
              employee={employee}
              summary={summary}
              onOpen={() => {
                console.log(`[nav] open board for ${employee.name}`);
                navigate(`/board/${employee.id}`);
              }}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          No hires match this filter right now.
        </p>
      )}
    </div>
  );
}

export default DashboardPage;
