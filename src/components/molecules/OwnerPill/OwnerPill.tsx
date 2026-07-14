import styles from './OwnerPill.module.css';

type OwnerPillProps = {
  name: string;
  /** Swimlane/owner accent color, e.g. from board data. */
  color?: string;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

function OwnerPill({ name, color }: OwnerPillProps) {
  return (
    <span className={styles.pill}>
      <span
        className={styles.avatar}
        style={color ? { background: color } : undefined}
        aria-hidden="true"
      >
        {initialsOf(name)}
      </span>
      <span className={styles.name}>{name}</span>
    </span>
  );
}

export default OwnerPill;
