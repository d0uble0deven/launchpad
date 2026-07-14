import type { TaskStatus } from '../../../types/board';
import { STATUS_LABELS } from '../../../types/board';
import styles from './StatusPill.module.css';

const STATUS_CLASS: Record<TaskStatus, string> = {
  'not-started': styles.notStarted,
  blocked: styles.blocked,
  ready: styles.ready,
  'in-progress': styles.inProgress,
  done: styles.done,
  na: styles.na,
};

type StatusPillProps = {
  status: TaskStatus;
};

function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`${styles.pill} ${STATUS_CLASS[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export default StatusPill;
