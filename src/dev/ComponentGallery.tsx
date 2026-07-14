// Temporary demo area for verifying the atomic component foundation
// (Step 1.3). Replaced by the Mural board page in Step 1.5.
import Badge from '../components/atoms/Badge/Badge';
import Button from '../components/atoms/Button/Button';
import IconButton from '../components/atoms/IconButton/IconButton';
import Select from '../components/atoms/Select/Select';
import StatusPill from '../components/atoms/StatusPill/StatusPill';
import TextInput from '../components/atoms/TextInput/TextInput';
import CategoryTag from '../components/molecules/CategoryTag/CategoryTag';
import OwnerPill from '../components/molecules/OwnerPill/OwnerPill';
import TaskCard from '../components/molecules/TaskCard/TaskCard';
import type { TaskCategory, TaskStatus } from '../types/board';
import styles from './ComponentGallery.module.css';

const ALL_STATUSES: TaskStatus[] = [
  'not-started',
  'blocked',
  'ready',
  'in-progress',
  'done',
  'na',
];

const ALL_CATEGORIES: TaskCategory[] = [
  'intake',
  'hr-employment',
  'compliance',
  'account-access',
  'project-team-setup',
  'buddy-welcome',
  'new-hire-first-week',
  'reviews-follow-up',
  'automation',
];

function ComponentGallery() {
  return (
    <div className={styles.gallery}>
      <h1 className={styles.heading}>Component Gallery (temporary)</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Atoms — Button</h2>
        <div className={styles.row}>
          <Button variant="primary">Save</Button>
          <Button>Mark Done</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" size="sm">
            Small primary
          </Button>
          <Button size="sm" disabled>
            Disabled
          </Button>
          <IconButton aria-label="Close">✕</IconButton>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Atoms — Badge & StatusPill</h2>
        <div className={styles.row}>
          <Badge>Neutral</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
        </div>
        <div className={styles.row}>
          {ALL_STATUSES.map((status) => (
            <StatusPill key={status} status={status} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Atoms — TextInput & Select</h2>
        <div className={styles.formRow}>
          <TextInput label="Task title" placeholder="Create Slack account" />
          <Select
            label="Status"
            options={ALL_STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Molecules — CategoryTag & OwnerPill
        </h2>
        <div className={styles.row}>
          {ALL_CATEGORIES.map((category) => (
            <CategoryTag key={category} category={category} />
          ))}
        </div>
        <div className={styles.row}>
          <OwnerPill name="Marissa H." color="#fbcfe8" />
          <OwnerPill name="Hiring Supervisor" color="#ddd6fe" />
          <OwnerPill name="Project Lead" color="#93c5fd" />
          <OwnerPill name="Automation" color="#fef08a" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Molecules — TaskCard</h2>
        <div className={styles.row}>
          <TaskCard
            title="Create Slack & JustWorks Accounts"
            owner="Paras"
            status="in-progress"
            category="account-access"
            phaseLabel="24–48 Hours"
            accentColor="#fbcfe8"
            onClick={() => console.log('[gallery] TaskCard clicked')}
          />
          <TaskCard
            title="Join Slack"
            owner="Marissa H."
            status="blocked"
            category="new-hire-first-week"
            phaseLabel="First Day"
            accentColor="#fce7f3"
          />
          <TaskCard
            title="Setup Harassment and/or HIPAA Training"
            owner="Melissa"
            status="ready"
            category="compliance"
            phaseLabel="1–2 Days"
            accentColor="#fed7aa"
          />
          <TaskCard
            title="Complete 30 day Review"
            owner="Hiring Supervisor"
            status="done"
            category="reviews-follow-up"
            phaseLabel="Day 30"
            accentColor="#ddd6fe"
          />
        </div>
      </section>
    </div>
  );
}

export default ComponentGallery;
