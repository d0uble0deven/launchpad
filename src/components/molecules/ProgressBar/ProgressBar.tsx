import styles from './ProgressBar.module.css';

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  size?: 'sm' | 'md';
  /** Optional bar color override (defaults to the primary color). */
  color?: string;
};

function ProgressBar({ value, size = 'md', color }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`${styles.track} ${styles[size]}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.fill}
        style={{ width: `${clamped}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export default ProgressBar;
