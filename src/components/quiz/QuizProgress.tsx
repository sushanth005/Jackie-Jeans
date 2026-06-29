import styles from './QuizProgress.module.css';

interface QuizProgressProps {
  current: number;
  total: number;
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className={styles.wrapper} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
