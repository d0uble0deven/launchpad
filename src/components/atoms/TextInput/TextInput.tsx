import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './TextInput.module.css';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

function TextInput({ label, error, className, ...rest }: TextInputProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={[styles.input, error ? styles.inputError : '', className]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export default TextInput;
