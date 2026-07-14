import type { TaskCategory, TaskStatus } from '../../../types/board';
import StatusPill from '../../atoms/StatusPill/StatusPill';
import CategoryTag from '../CategoryTag/CategoryTag';
import OwnerPill from '../OwnerPill/OwnerPill';
import styles from './TaskCard.module.css';

type TaskCardProps = {
  title: string;
  owner: string;
  status: TaskStatus;
  category: TaskCategory;
  /** Phase or due timing shown in the footer, e.g. "First Day". */
  phaseLabel?: string;
  /** Swimlane accent color (Mural-style card tint). */
  accentColor?: string;
  onClick?: () => void;
};

function TaskCard({
  title,
  owner,
  status,
  category,
  phaseLabel,
  accentColor,
  onClick,
}: TaskCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      style={accentColor ? { background: accentColor } : undefined}
      onClick={onClick}
    >
      <div className={styles.top}>
        <span className={styles.title}>{title}</span>
        {status === 'blocked' && (
          <span
            className={`${styles.indicator} ${styles.indicatorBlocked}`}
            title="Blocked"
          >
            ⛔
          </span>
        )}
        {status === 'ready' && (
          <span
            className={`${styles.indicator} ${styles.indicatorReady}`}
            title="Ready"
          >
            ▶
          </span>
        )}
      </div>
      <div className={styles.tags}>
        <StatusPill status={status} />
        <CategoryTag category={category} />
      </div>
      <div className={styles.footer}>
        <OwnerPill name={owner} />
        {phaseLabel && <span className={styles.phase}>{phaseLabel}</span>}
      </div>
    </button>
  );
}

export default TaskCard;
