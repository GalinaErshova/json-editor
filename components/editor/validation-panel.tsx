'use client';

/**
 * Validation panel — displays errors and warnings from scenario validation.
 *
 * @module components/editor/validation-panel
 */

import styles from './validation-panel.module.css';

interface ValidationError {
  readonly path: string;
  readonly message: string;
}

interface ValidationPanelProps {
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
  readonly isValidating: boolean;
  readonly hasValidated: boolean;
}

export default function ValidationPanel({
  errors,
  warnings,
  isValidating,
  hasValidated,
}: ValidationPanelProps) {
  if (isValidating) {
    return <div className={styles.loading}>Валидация...</div>;
  }

  if (!hasValidated) {
    return (
      <div className={styles.idle}>
        Нажмите &quot;Валидировать&quot; для проверки
      </div>
    );
  }

  const isValid = errors.length === 0;

  return (
    <div className={styles.container}>
      {/* Status badge */}
      <div className={`${styles.status} ${isValid ? styles.statusValid : styles.statusInvalid}`}>
        {isValid ? 'Valid' : `${errors.length} error${errors.length > 1 ? 's' : ''}`}
        {warnings.length > 0 && (
          <span className={styles.warningCount}>
            {warnings.length} warning{warnings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className={styles.list}>
          {errors.map((err, i) => (
            <div key={i} className={styles.errorItem}>
              <span className={styles.errorIcon}>!</span>
              <div>
                <code className={styles.path}>{err.path}</code>
                <div className={styles.message}>{err.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className={styles.list}>
          {warnings.map((w, i) => (
            <div key={i} className={styles.warningItem}>
              <span className={styles.warningIcon}>!</span>
              <div>
                <code className={styles.path}>{w.path}</code>
                <div className={styles.message}>{w.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
