import { useEffect, useMemo } from 'react';
import IconButton from '../../atoms/IconButton/IconButton';
import StatusPill from '../../atoms/StatusPill/StatusPill';
import CategoryTag from '../../molecules/CategoryTag/CategoryTag';
import OwnerPill from '../../molecules/OwnerPill/OwnerPill';
import type { OnboardingBoard, TaskCard } from '../../../types/board';
import styles from './TaskModal.module.css';

type TaskModalProps = {
  task: TaskCard;
  board: OnboardingBoard;
  onClose: () => void;
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function TaskModal({ task, board, onClose }: TaskModalProps) {
  const lane = board.swimlanes.find((l) => l.id === task.ownerId);
  const phase = board.phases.find((p) => p.id === task.phaseId);

  const blockedBy = useMemo(
    () => board.tasks.filter((t) => task.dependsOn.includes(t.id)),
    [board, task],
  );
  const unblocks = useMemo(
    () => board.tasks.filter((t) => t.dependsOn.includes(task.id)),
    [board, task],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={styles.accent}
          style={{ background: lane?.color ?? 'var(--color-border)' }}
        />
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{task.title}</h2>
            <p className={styles.subtitle}>
              {phase?.label ?? 'No phase'} · {lane?.label ?? task.ownerId}
              {task.dueTiming ? ` · Due: ${task.dueTiming}` : ''}
            </p>
          </div>
          <IconButton aria-label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </header>

        <div className={styles.body}>
          <div className={styles.main}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              {task.description ? (
                <p className={styles.text}>{task.description}</p>
              ) : (
                <p className={styles.empty}>No description yet.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Links & Resources</h3>
              {task.links.length > 0 ? (
                <ul className={styles.linkList}>
                  {task.links.map((link) => (
                    <li key={link.id}>
                      <a
                        className={styles.link}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>No links yet.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              {task.notes ? (
                <p className={styles.text}>{task.notes}</p>
              ) : (
                <p className={styles.empty}>No notes yet.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Activity</h3>
              <ul className={styles.activityList}>
                {task.activity.map((entry) => (
                  <li key={entry.id} className={styles.activityEntry}>
                    <span className={styles.activityMessage}>
                      {entry.message}
                    </span>
                    <span className={styles.activityTime}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Status</span>
              <StatusPill status={task.status} />
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Owner</span>
              <OwnerPill
                name={lane?.label ?? task.ownerId}
                color={lane?.color}
              />
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Backup owner</span>
              <span className={styles.sideValue}>
                {task.backupOwner ?? '—'}
              </span>
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Category</span>
              <CategoryTag category={task.category} />
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Phase</span>
              <span className={styles.sideValue}>{phase?.label ?? '—'}</span>
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Due timing</span>
              <span className={styles.sideValue}>{task.dueTiming ?? '—'}</span>
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Blocked by</span>
              {blockedBy.length > 0 ? (
                <ul className={styles.depList}>
                  {blockedBy.map((dep) => (
                    <li key={dep.id} className={styles.depItem}>
                      <StatusPill status={dep.status} />
                      <span className={styles.depTitle}>{dep.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className={styles.sideValue}>—</span>
              )}
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Unblocks</span>
              {unblocks.length > 0 ? (
                <ul className={styles.depList}>
                  {unblocks.map((dep) => (
                    <li key={dep.id} className={styles.depItem}>
                      <StatusPill status={dep.status} />
                      <span className={styles.depTitle}>{dep.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className={styles.sideValue}>—</span>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
