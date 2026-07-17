import { useEffect, useMemo, useState } from 'react';
import Button from '../../atoms/Button/Button';
import IconButton from '../../atoms/IconButton/IconButton';
import Select from '../../atoms/Select/Select';
import TextArea from '../../atoms/TextArea/TextArea';
import TextInput from '../../atoms/TextInput/TextInput';
import type {
  ConditionField,
  ResourceLink,
  Template,
  TemplateTask,
} from '../../../types/board';
import { CATEGORY_LABELS } from '../../../types/board';
import type { TaskCategory } from '../../../types/board';
import styles from './TemplateTaskModal.module.css';

type TemplateTaskModalProps = {
  task: TemplateTask;
  template: Template;
  onClose: () => void;
  onSave: (task: TemplateTask) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

const CATEGORY_OPTIONS = (
  Object.entries(CATEGORY_LABELS) as Array<[TaskCategory, string]>
).map(([value, label]) => ({ value, label }));

const CONDITION_FIELD_OPTIONS: Array<{ value: ConditionField; label: string }> = [
  { value: 'vaProject', label: 'VA project' },
  { value: 'employeeType', label: 'Employee type' },
  { value: 'hasDirectReports', label: 'Direct reports (manager)' },
];

const CONDITION_VALUE_OPTIONS: Record<
  ConditionField,
  Array<{ value: string; label: string }>
> = {
  vaProject: [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  employeeType: [
    { value: 'w2', label: 'W2 employee' },
    { value: '1099', label: '1099 contractor' },
  ],
  hasDirectReports: [
    { value: 'yes', label: 'Yes (manager)' },
    { value: 'no', label: 'No' },
  ],
};

function TemplateTaskModal({
  task,
  template,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}: TemplateTaskModalProps) {
  const [draft, setDraft] = useState<TemplateTask>(() => structuredClone(task));
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [depSearch, setDepSearch] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const patch = (changes: Partial<TemplateTask>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  // Links
  const patchLink = (id: string, changes: Partial<ResourceLink>) =>
    patch({
      links: draft.links.map((link) =>
        link.id === id ? { ...link, ...changes } : link,
      ),
    });
  const addLink = () =>
    patch({
      links: [...draft.links, { id: `link-${Date.now()}`, label: '', url: '' }],
    });
  const removeLink = (id: string) =>
    patch({ links: draft.links.filter((link) => link.id !== id) });

  // Dependencies
  const dependencyCandidates = useMemo(
    () =>
      template.tasks.filter(
        (t) =>
          t.id !== draft.id &&
          t.title.toLowerCase().includes(depSearch.trim().toLowerCase()),
      ),
    [template.tasks, draft.id, depSearch],
  );
  const toggleDependency = (id: string) =>
    patch({
      dependsOn: draft.dependsOn.includes(id)
        ? draft.dependsOn.filter((d) => d !== id)
        : [...draft.dependsOn, id],
    });

  // Conditions
  const addCondition = () =>
    patch({
      conditions: [
        ...draft.conditions,
        { id: `cond-${Date.now()}`, field: 'vaProject', value: 'yes' },
      ],
    });
  const patchCondition = (id: string, field: ConditionField) =>
    patch({
      conditions: draft.conditions.map((c) =>
        c.id === id
          ? { ...c, field, value: CONDITION_VALUE_OPTIONS[field][0]!.value }
          : c,
      ),
    });
  const patchConditionValue = (id: string, value: string) =>
    patch({
      conditions: draft.conditions.map((c) =>
        c.id === id ? { ...c, value } : c,
      ),
    });
  const removeCondition = (id: string) =>
    patch({ conditions: draft.conditions.filter((c) => c.id !== id) });

  const lane = template.swimlanes.find((l) => l.id === draft.ownerId);

  const handleSave = () => {
    const cleaned: TemplateTask = {
      ...draft,
      links: draft.links.filter((link) => link.label || link.url),
    };
    onSave(cleaned);
  };

  const ownerOptions = template.swimlanes.map((l) => ({
    value: l.id,
    label: l.label,
  }));

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
              onChange={(e) => patch({ title: e.target.value })}
              aria-label="Task title"
            />
            <p className={styles.subtitle}>Template task</p>
          </div>
          <IconButton aria-label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </header>

        <div className={styles.body}>
          <div className={styles.main}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Default description / instructions</h3>
              <TextArea
                value={draft.description}
                placeholder="What this task involves…"
                onChange={(e) => patch({ description: e.target.value })}
              />
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Dependencies</h3>
              <p className={styles.hint}>
                This task is blocked until every selected task is done.
              </p>
              <TextInput
                placeholder="Search tasks…"
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
              />
              <div className={styles.depList}>
                {dependencyCandidates.map((candidate) => (
                  <label key={candidate.id} className={styles.depRow}>
                    <input
                      type="checkbox"
                      checked={draft.dependsOn.includes(candidate.id)}
                      onChange={() => toggleDependency(candidate.id)}
                    />
                    <span>{candidate.title}</span>
                  </label>
                ))}
                {dependencyCandidates.length === 0 && (
                  <p className={styles.empty}>No matching tasks.</p>
                )}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Conditional rules</h3>
                <Button size="sm" onClick={addCondition}>
                  + Add rule
                </Button>
              </div>
              <p className={styles.hint}>
                The task is kept for a new hire only when all rules match;
                otherwise it's marked N/A on their board.
              </p>
              {draft.conditions.length === 0 ? (
                <p className={styles.empty}>Always applies to every hire.</p>
              ) : (
                <ul className={styles.condList}>
                  {draft.conditions.map((cond) => (
                    <li key={cond.id} className={styles.condRow}>
                      <span className={styles.condPrefix}>Only if</span>
                      <Select
                        options={CONDITION_FIELD_OPTIONS}
                        value={cond.field}
                        onChange={(e) =>
                          patchCondition(cond.id, e.target.value as ConditionField)
                        }
                      />
                      <span className={styles.condIs}>is</span>
                      <Select
                        options={CONDITION_VALUE_OPTIONS[cond.field]}
                        value={cond.value}
                        onChange={(e) =>
                          patchConditionValue(cond.id, e.target.value)
                        }
                      />
                      <IconButton
                        aria-label="Remove rule"
                        onClick={() => removeCondition(cond.id)}
                      >
                        ✕
                      </IconButton>
                    </li>
                  ))}
                </ul>
              )}
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
                        onChange={(e) =>
                          patchLink(link.id, { label: e.target.value })
                        }
                      />
                      <TextInput
                        value={link.url}
                        placeholder="https://…"
                        onChange={(e) =>
                          patchLink(link.id, { url: e.target.value })
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
          </div>

          <aside className={styles.sidebar}>
            <Select
              label="Phase"
              options={template.phases.map((p) => ({
                value: p.id,
                label: p.label,
              }))}
              value={draft.phaseId}
              onChange={(e) => patch({ phaseId: e.target.value })}
            />
            <Select
              label="Owner"
              options={ownerOptions}
              value={draft.ownerId}
              onChange={(e) => patch({ ownerId: e.target.value })}
            />
            <Select
              label="Backup owner"
              options={[{ value: '', label: 'None' }, ...ownerOptions]}
              value={draft.backupOwner ?? ''}
              onChange={(e) =>
                patch({ backupOwner: e.target.value || undefined })
              }
            />
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={draft.category}
              onChange={(e) =>
                patch({ category: e.target.value as TaskCategory })
              }
            />
            <Select
              label="Requirement"
              options={[
                { value: 'required', label: 'Required' },
                { value: 'optional', label: 'Optional' },
              ]}
              value={draft.required ? 'required' : 'optional'}
              onChange={(e) => patch({ required: e.target.value === 'required' })}
            />
            <TextInput
              label="Due timing"
              placeholder="e.g. Before start date"
              value={draft.dueTiming ?? ''}
              onChange={(e) =>
                patch({ dueTiming: e.target.value || undefined })
              }
            />
          </aside>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerActions}>
            <Button size="sm" onClick={onDuplicate}>
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => (deleteArmed ? onDelete() : setDeleteArmed(true))}
              onBlur={() => setDeleteArmed(false)}
            >
              {deleteArmed ? 'Confirm delete?' : 'Delete'}
            </Button>
          </div>
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

export default TemplateTaskModal;
