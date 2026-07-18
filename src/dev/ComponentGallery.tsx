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
        <h2 className={styles.sectionTitle}>Logo concepts (pick one!)</h2>
        <div className={styles.row}>
          {/* A — Orbit: the onboarding journey circles the pad; the ring
              nods to "360". */}
          <span className={styles.logoOption}>
            <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
              <circle
                cx="24"
                cy="26"
                r="11"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3.5"
              />
              <ellipse
                cx="24"
                cy="24"
                rx="21"
                ry="8"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                transform="rotate(-18 24 24)"
              />
              <circle cx="42" cy="16" r="4" fill="var(--color-accent)" />
            </svg>
            <span className={styles.logoLabel}>
              A · Orbit 360
              <small>journey around the pad</small>
            </span>
          </span>
          {/* B — Liftoff: rocket-arrow leaving the pad. */}
          <span className={styles.logoOption}>
            <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M24 4 L34 24 L28.5 22 L28.5 33 L19.5 33 L19.5 22 L14 24 Z"
                fill="var(--color-primary)"
              />
              <rect
                x="10"
                y="38"
                width="28"
                height="4.5"
                rx="2.25"
                fill="var(--color-accent)"
              />
            </svg>
            <span className={styles.logoLabel}>
              B · Liftoff
              <small>rocket leaving the pad</small>
            </span>
          </span>
          {/* C — DocMe brackets: the company's ‹ › mark with a launch
              inside — LaunchPad as a DocMe360 tool. */}
          <span className={styles.logoOption}>
            <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M13 12 L4 24 L13 36"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M35 12 L44 24 L35 36"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M24 10 L29.5 24 L24 21.5 L18.5 24 Z"
                fill="var(--color-accent)"
              />
              <rect
                x="19"
                y="30"
                width="10"
                height="3.5"
                rx="1.75"
                fill="var(--color-accent)"
              />
            </svg>
            <span className={styles.logoLabel}>
              C · DocMe brackets
              <small>launch inside ‹ ›</small>
            </span>
          </span>
        </div>
      </section>

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
