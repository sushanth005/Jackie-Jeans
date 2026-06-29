'use client';

import styles from './OptionCards.module.css';

interface OptionCardsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function OptionCards({ options, value, onChange }: OptionCardsProps) {
  return (
    <div className={styles.wrapper}>
      {/* Chips row — exactly like Jackie Jeans selector */}
      <div className={styles.chipRow}>
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
              onClick={() => onChange(opt)}
              role="radio"
              aria-checked={isSelected}
              id={`option-${opt.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Selected preview card */}
      {value && (
        <div className={styles.previewCard}>
          <div className={styles.previewLabel}>Selected</div>
          <div className={styles.previewValue}>{value}</div>
        </div>
      )}
    </div>
  );
}
