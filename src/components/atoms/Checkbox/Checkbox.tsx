import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Smaller helper text under the label. */
  hint?: string;
};

function Checkbox({ label, hint, className, ...rest }: CheckboxProps) {
  const id = useId();
  return (
    <div className={styles.wrapper}>
      <input
        id={id}
        type="checkbox"
        className={[styles.input, className].filter(Boolean).join(' ')}
        {...rest}
      />
      <label className={styles.labelBlock} htmlFor={id}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
    </div>
  );
}

export default Checkbox;
