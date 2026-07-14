import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.css';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

function TextArea({ label, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={[styles.textarea, className].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}

export default TextArea;
