import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import Checkbox from '../../components/atoms/Checkbox/Checkbox';
import Select from '../../components/atoms/Select/Select';
import TextArea from '../../components/atoms/TextArea/TextArea';
import TextInput from '../../components/atoms/TextInput/TextInput';
import { generateBoardForEmployee } from '../../logic/generateBoard';
import { useAppState } from '../../state/AppStateContext';
import type { Employee, EmployeeType } from '../../types/board';
import styles from './NewHirePage.module.css';

type FormValues = {
  name: string;
  preferredName: string;
  role: string;
  employeeGroup: string;
  location: string;
  startDate: string;
  supervisor: string;
  projectLead: string;
  projectName: string;
  directReports: string;
  employeeType: EmployeeType | '';
  personalEmail: string;
  laptopPreference: string;
  vaProject: boolean;
  needsPiv: boolean;
  needsGfe: boolean;
  jobDescription: string;
};

const EMPTY_FORM: FormValues = {
  name: '',
  preferredName: '',
  role: '',
  employeeGroup: '',
  location: '',
  startDate: '',
  supervisor: '',
  projectLead: '',
  projectName: '',
  directReports: '',
  employeeType: '',
  personalEmail: '',
  laptopPreference: '',
  vaProject: false,
  needsPiv: false,
  needsGfe: false,
  jobDescription: '',
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'Employee name is required.';
  if (!values.role.trim()) errors.role = 'Role is required.';
  if (!values.startDate) errors.startDate = 'Start date is required.';
  if (!values.supervisor.trim()) errors.supervisor = 'Supervisor is required.';
  if (!values.employeeType) errors.employeeType = 'Select an employee type.';
  if (values.personalEmail.trim() && !EMAIL_PATTERN.test(values.personalEmail.trim())) {
    errors.personalEmail = 'Enter a valid email address.';
  }
  return errors;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'hire'
  );
}

function toEmployee(values: FormValues, id: string): Employee {
  const clean = (value: string) => value.trim() || undefined;
  return {
    id,
    name: values.name.trim(),
    preferredName: clean(values.preferredName),
    role: values.role.trim(),
    location: values.location.trim() || '—',
    startDate: values.startDate,
    supervisor: clean(values.supervisor),
    projectLead: clean(values.projectLead),
    projectName: clean(values.projectName),
    employeeType: values.employeeType || 'w2',
    personalEmail: clean(values.personalEmail),
    laptopPreference: clean(values.laptopPreference),
    employeeGroup: clean(values.employeeGroup),
    vaProject: values.vaProject,
    needsPiv: values.vaProject && values.needsPiv,
    needsGfe: values.vaProject && values.needsGfe,
    directReports: clean(values.directReports),
    jobDescription: clean(values.jobDescription),
  };
}

function NewHirePage() {
  const { state, addHire } = useAppState();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const patch = (changes: Partial<FormValues>) => {
    setValues((prev) => ({ ...prev, ...changes }));
    // Clear the error on any field the user just touched.
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(changes) as Array<keyof FormValues>) {
        delete next[key];
      }
      return next;
    });
  };

  // Live preview of what submit would generate for the current selections.
  const preview = useMemo(() => {
    const draft = toEmployee(
      { ...values, name: values.name || 'New Hire' },
      'preview',
    );
    const { board, notes } = generateBoardForEmployee(draft, state.template);
    const active = board.tasks.filter((task) => task.status !== 'na').length;
    const na = board.tasks.length - active;
    const ready = board.tasks.filter((task) => task.status === 'ready').length;
    return { total: board.tasks.length, active, na, ready, notes };
  }, [values, state.template]);

  const handleSubmit = async () => {
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      console.log('[new-hire] validation failed', validation);
      return;
    }
    const id = `emp-${slugify(values.name)}-${Date.now().toString(36)}`;
    const employee = toEmployee(values, id);
    try {
      // The server generates the board from its stored template.
      const created = await addHire(employee);
      console.log(`[new-hire] created ${created.name}`, created);
      navigate(`/board/${created.id}`);
    } catch (err) {
      console.error('[new-hire] failed to create hire', err);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Add a New Hire</h1>
        <p className={styles.subtitle}>
          Fill in the intake details — LaunchPad generates their onboarding
          board from the default template and applies the conditional rules.
        </p>
      </header>

      <div className={styles.layout}>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Basics</h2>
            <div className={styles.grid2}>
              <TextInput
                label="Employee name *"
                placeholder="Marissa Hollins"
                value={values.name}
                error={errors.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <TextInput
                label="Preferred name"
                placeholder="Marissa"
                value={values.preferredName}
                onChange={(e) => patch({ preferredName: e.target.value })}
              />
              <TextInput
                label="Role *"
                placeholder="Frontend Engineer"
                value={values.role}
                error={errors.role}
                onChange={(e) => patch({ role: e.target.value })}
              />
              <TextInput
                label="Employee group / role category"
                placeholder="Engineering"
                value={values.employeeGroup}
                onChange={(e) => patch({ employeeGroup: e.target.value })}
              />
              <TextInput
                label="Location"
                placeholder="Boise, Idaho"
                value={values.location}
                onChange={(e) => patch({ location: e.target.value })}
              />
              <TextInput
                label="Start date *"
                type="date"
                value={values.startDate}
                error={errors.startDate}
                onChange={(e) => patch({ startDate: e.target.value })}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Team</h2>
            <div className={styles.grid2}>
              <TextInput
                label="Supervisor *"
                placeholder="Dana K."
                value={values.supervisor}
                error={errors.supervisor}
                onChange={(e) => patch({ supervisor: e.target.value })}
              />
              <TextInput
                label="Project lead"
                placeholder="Sam W."
                value={values.projectLead}
                onChange={(e) => patch({ projectLead: e.target.value })}
              />
              <TextInput
                label="Project name"
                placeholder="DocMe360 Platform"
                value={values.projectName}
                onChange={(e) => patch({ projectName: e.target.value })}
              />
              <TextInput
                label="Direct reports / team members"
                placeholder="Leave empty if none"
                value={values.directReports}
                onChange={(e) => patch({ directReports: e.target.value })}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Employment</h2>
            <div className={styles.grid2}>
              <Select
                label="Employee type *"
                options={[
                  { value: '', label: 'Select…' },
                  { value: 'w2', label: 'W2 employee' },
                  { value: '1099', label: '1099 contractor' },
                ]}
                value={values.employeeType}
                error={errors.employeeType}
                onChange={(e) =>
                  patch({ employeeType: e.target.value as EmployeeType | '' })
                }
              />
              <TextInput
                label="Personal email"
                type="email"
                placeholder="marissa@example.com"
                value={values.personalEmail}
                error={errors.personalEmail}
                onChange={(e) => patch({ personalEmail: e.target.value })}
              />
              <Select
                label="Laptop preference"
                options={[
                  { value: '', label: 'No preference' },
                  { value: 'MacBook Pro', label: 'MacBook Pro' },
                  { value: 'Windows laptop', label: 'Windows laptop' },
                  { value: 'Own device (computer allowance)', label: 'Own device (computer allowance)' },
                ]}
                value={values.laptopPreference}
                onChange={(e) => patch({ laptopPreference: e.target.value })}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>VA / Government</h2>
            <div className={styles.checkboxes}>
              <Checkbox
                label="VA project"
                hint="Keeps the VA onboarding, DSVA Slack, and VA GH tasks on the board"
                checked={values.vaProject}
                onChange={(e) => patch({ vaProject: e.target.checked })}
              />
              <Checkbox
                label="PIV card needed"
                checked={values.needsPiv}
                disabled={!values.vaProject}
                onChange={(e) => patch({ needsPiv: e.target.checked })}
              />
              <Checkbox
                label="GFE equipment needed"
                checked={values.needsGfe}
                disabled={!values.vaProject}
                onChange={(e) => patch({ needsGfe: e.target.checked })}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Job description</h2>
            <TextArea
              placeholder="Short description of the role and responsibilities…"
              rows={4}
              value={values.jobDescription}
              onChange={(e) => patch({ jobDescription: e.target.value })}
            />
          </section>

          <div className={styles.actions}>
            <Button variant="ghost" type="button" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Onboarding Board
            </Button>
          </div>
        </form>

        <aside className={styles.preview}>
          <h2 className={styles.previewTitle}>Board preview</h2>
          <p className={styles.previewLine}>
            <strong>{preview.total}</strong> tasks from the default template
          </p>
          <p className={styles.previewLine}>
            <strong>{preview.active}</strong> active ·{' '}
            <strong>{preview.na}</strong> marked N/A ·{' '}
            <strong>{preview.ready}</strong> ready to start
          </p>
          <ul className={styles.previewNotes}>
            {preview.notes.map((note) => (
              <li key={note.taskTitle} className={styles.previewNote}>
                <span className={styles.previewAction}>{note.action}</span>{' '}
                {note.taskTitle}
                <span className={styles.previewReason}> — {note.reason}</span>
              </li>
            ))}
          </ul>
          <p className={styles.previewFoot}>
            On submit you'll be taken straight to the new board.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default NewHirePage;
