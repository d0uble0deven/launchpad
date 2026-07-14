import { useEffect, useMemo, useState } from 'react';
import Button from '../../atoms/Button/Button';
import IconButton from '../../atoms/IconButton/IconButton';
import Select from '../../atoms/Select/Select';
import StatusPill from '../../atoms/StatusPill/StatusPill';
import TextArea from '../../atoms/TextArea/TextArea';
import TextInput from '../../atoms/TextInput/TextInput';
import type {
  OnboardingBoard,
  ResourceLink,
  TaskCard,
  TaskCategory,
  TaskStatus,
} from '../../../types/board';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../../types/board';
import styles from './TaskModal.module.css';

type TaskModalProps = {
  task: TaskCard;
  board: OnboardingBoard;
  onClose: () => void;
  onSave: (task: TaskCard) => void;
};

const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as Array<[TaskStatus, string]>
).map(([value, label]) => ({ value, label }));

const CATEGORY_OPTIONS = (
  Object.entries(CATEGORY_LABELS) as Array<[TaskCategory, string]>
).map(([value, label]) => ({ value, label }));

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function TaskModal({ task, board, onClose, onSave }: TaskModalProps) {
  const [draft, setDraft] = useState<TaskCard>(() => structuredClone(task));

  const lane = board.swimlanes.find((l) => l.id === draft.ownerId);
  const phase = board.phases.find((p) => p.id === draft.phaseId);

  const blockedBy = useMemo(
    () => board.tasks.filter((t) => draft.dependsOn.includes(t.id)),
    [board, draft.dependsOn],
  );
  const unblocks = useMemo(
    () => board.tasks.filter((t) => t.dependsOn.includes(task.id)),
    [board, task.id],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const patch = (changes: Partial<TaskCard>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  const patchLink = (id: string, changes: Partial<ResourceLink>) =>
    patch({
      links: draft.links.map((link) =>
        link.id === id ? { ...link, ...changes } : link,
      ),
    });

  const addLink = () =>
    patch({
      links: [
        ...draft.links,
        { id: `link-${Date.now()}`, label: '', url: '' },
      ],
    });

  const removeLink = (id: string) =>
    patch({ links: draft.links.filter((link) => link.id !== id) });

  const handleSave = () => {
    const updated: TaskCard = {
      ...draft,
      links: draft.links.filter((link) => link.label || link.url),
      activity: [
        ...draft.activity,
        {
          id: `${draft.id}-a${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: 'Details updated',
        },
      ],
    };
    setDraft(updated);
    onSave(updated);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={draft.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={styles.accent}
          style={{ background: lane?.color ?? 'var(--color-border)' }}
        />
        <header className={styles.header}>
          <div className={styles.headerText}>
            <input
              className={styles.titleInput}
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
              aria-label="Task title"
            />
            <p className={styles.subtitle}>
              {phase?.label ?? 'No phase'} · {lane?.label ?? draft.ownerId}
              {draft.dueTiming ? ` · Due: ${draft.dueTiming}` : ''}
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
              <TextArea
                value={draft.description}
                placeholder="Add a description…"
                onChange={(event) =>
                  patch({ description: event.target.value })
                }
              />
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Links & Resources</h3>
              {draft.links.length > 0 && (
                <ul className={styles.linkList}>
                  {draft.links.map((link) => (
                    <li key={link.id} className={styles.linkRow}>
                      <TextInput
                        value={link.label}
                        placeholder="Label"
                        onChange={(event) =>
                          patchLink(link.id, { label: event.target.value })
                        }
                      />
                      <TextInput
                        value={link.url}
                        placeholder="https://…"
                        onChange={(event) =>
                          patchLink(link.id, { url: event.target.value })
                        }
                      />
                      <IconButton
                        aria-label="Remove link"
                        onClick={() => removeLink(link.id)}
                      >
                        ✕
                      </IconButton>
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <Button size="sm" onClick={addLink}>
                  + Add link
                </Button>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <TextArea
                value={draft.notes}
                placeholder="Add notes…"
                onChange={(event) => patch({ notes: event.target.value })}
              />
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Activity</h3>
              <ul className={styles.activityList}>
                {draft.activity.map((entry) => (
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
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={draft.status}
                onChange={(event) =>
                  patch({ status: event.target.value as TaskStatus })
                }
              />
            </div>
            <div className={styles.sideRow}>
              <Select
                label="Owner"
                options={board.swimlanes.map((l) => ({
                  value: l.id,
                  label: l.label,
                }))}
                value={draft.ownerId}
                onChange={(event) => patch({ ownerId: event.target.value })}
              />
            </div>
            <div className={styles.sideRow}>
              <Select
                label="Category"
                options={CATEGORY_OPTIONS}
                value={draft.category}
                onChange={(event) =>
                  patch({ category: event.target.value as TaskCategory })
                }
              />
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Backup owner</span>
              <span className={styles.sideValue}>
                {draft.backupOwner ?? '—'}
              </span>
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Phase</span>
              <span className={styles.sideValue}>{phase?.label ?? '—'}</span>
            </div>
            <div className={styles.sideRow}>
              <span className={styles.sideLabel}>Due timing</span>
              <span className={styles.sideValue}>
                {draft.dueTiming ?? '—'}
              </span>
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

        <footer className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default TaskModal;
