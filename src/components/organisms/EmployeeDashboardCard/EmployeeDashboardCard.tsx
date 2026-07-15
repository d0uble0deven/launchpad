import Badge from '../../atoms/Badge/Badge';
import ProgressBar from '../../molecules/ProgressBar/ProgressBar';
import type { EmployeeSummary, ReviewStatus } from '../../../logic/progress';
import type { Employee } from '../../../types/board';
import styles from './EmployeeDashboardCard.module.css';

type EmployeeDashboardCardProps = {
  employee: Employee;
  summary: EmployeeSummary;
  onOpen: () => void;
};

const REVIEW_TONE: Record<ReviewStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  Done: 'success',
  Blocked: 'danger',
  Due: 'warning',
  Upcoming: 'neutral',
};

function statusBadges(summary: EmployeeSummary) {
  const badges: Array<{ label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = [];
  if (summary.flags.completed) badges.push({ label: 'Completed', tone: 'success' });
  if (summary.flags.startingSoon) badges.push({ label: 'Starting soon', tone: 'info' });
  if (summary.flags.blocked) badges.push({ label: 'Blocked', tone: 'danger' });
  if (summary.flags.overdue)
    badges.push({ label: `Overdue (${summary.overdueCount})`, tone: 'warning' });
  if (summary.flags.waitingOnLeadership)
    badges.push({ label: 'Waiting on leadership', tone: 'neutral' });
  if (summary.flags.waitingOnNewHire)
    badges.push({ label: 'Waiting on new hire', tone: 'neutral' });
  if (badges.length === 0) badges.push({ label: 'Active', tone: 'info' });
  return badges;
}

function formatStart(startDate: string, daysSinceStart: number): string {
  if (daysSinceStart < 0) {
    const days = Math.abs(daysSinceStart);
    return `Starts ${startDate} (in ${days} day${days === 1 ? '' : 's'})`;
  }
  return `Started ${startDate} (day ${daysSinceStart})`;
}

function EmployeeDashboardCard({
  employee,
  summary,
  onOpen,
}: EmployeeDashboardCardProps) {
  return (
    <article className={styles.card} onClick={onOpen}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <h2 className={styles.name}>{employee.name}</h2>
          <p className={styles.role}>
            {employee.role} · {employee.location}
          </p>
          <p className={styles.start}>
            {formatStart(employee.startDate, summary.daysSinceStart)}
          </p>
        </div>
        <div className={styles.badges}>
          {statusBadges(summary).map((badge) => (
            <Badge key={badge.label} tone={badge.tone}>
              {badge.label}
            </Badge>
          ))}
        </div>
      </header>

      <div className={styles.progressRow}>
        <ProgressBar value={summary.overallPct} />
        <span className={styles.pct}>{summary.overallPct}%</span>
      </div>
      <p className={styles.stepLine}>
        Step {summary.currentStep} of {summary.totalCount} ·{' '}
        {summary.doneCount} tasks done
      </p>

      {summary.currentBlocker && (
        <p className={styles.blocker}>
          <span className={styles.blockerLabel}>Blocker:</span>{' '}
          {summary.currentBlocker}
        </p>
      )}

      <dl className={styles.meta}>
        <div className={styles.metaItem}>
          <dt>Supervisor</dt>
          <dd>{employee.supervisor ?? '—'}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt>Project lead</dt>
          <dd>{employee.projectLead ?? '—'}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt>Next owner</dt>
          <dd>{summary.nextOwner ?? '—'}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt>Overdue</dt>
          <dd className={summary.overdueCount > 0 ? styles.metaWarn : ''}>
            {summary.overdueCount > 0 ? `${summary.overdueCount} tasks` : 'None'}
          </dd>
        </div>
        <div className={styles.metaItem}>
          <dt>Day 1</dt>
          <dd>
            {summary.day1Ready ? (
              <Badge tone="success">Ready</Badge>
            ) : (
              <Badge tone="warning">{summary.day1Remaining} left</Badge>
            )}
          </dd>
        </div>
        <div className={styles.metaItem}>
          <dt>Day 30 / 90</dt>
          <dd className={styles.reviewPair}>
            <Badge tone={REVIEW_TONE[summary.day30]}>{summary.day30}</Badge>
            <Badge tone={REVIEW_TONE[summary.day90]}>{summary.day90}</Badge>
          </dd>
        </div>
      </dl>

      <div className={styles.categories}>
        {summary.byCategory.map((entry) => (
          <div key={entry.category} className={styles.categoryRow}>
            <span className={styles.categoryLabel}>{entry.label}</span>
            <ProgressBar
              size="sm"
              value={entry.total === 0 ? 0 : (entry.done / entry.total) * 100}
            />
            <span className={styles.categoryCount}>
              {entry.done}/{entry.total}
            </span>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>Open board →</footer>
    </article>
  );
}

export default EmployeeDashboardCard;
