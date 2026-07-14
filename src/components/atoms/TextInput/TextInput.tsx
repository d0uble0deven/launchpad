import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './TextInput.module.css';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

function TextInput({ label, className, ...rest }: TextInputProps) {
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
        className={[styles.input, className].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}

export default TextInput;
