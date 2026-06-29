'use client';

import { useState } from 'react';
import styles from './NumberInput.module.css';

interface NumberInputProps {
  value: string;
  unit: string;
  onChange: (value: string) => void;
  onSkip?: () => void;
  optional?: boolean;
}

export default function NumberInput({ value, unit, onChange, onSkip, optional }: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value ?? '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (val && !isNaN(Number(val))) {
      onChange(val);
    } else if (!val) {
      onChange('');
    }
  }

  function handleDigit(digit: string) {
    const next = inputValue + digit;
    setInputValue(next);
    onChange(next);
  }

  function handleDelete() {
    const next = inputValue.slice(0, -1);
    setInputValue(next);
    onChange(next);
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className={styles.wrapper}>
      {/* Display */}
      <div className={styles.display}>
        <span className={styles.value}>{inputValue || '—'}</span>
        <span className={styles.unit}>{unit}</span>
      </div>

      {/* Numpad */}
      <div className={styles.numpad}>
        {digits.map((digit, i) => (
          digit === '' ? (
            <div key={i} className={styles.numpadEmpty} />
          ) : digit === '⌫' ? (
            <button
              key={i}
              className={styles.numpadKey}
              onClick={handleDelete}
              aria-label="Delete"
              id="numpad-delete"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          ) : (
            <button
              key={i}
              className={styles.numpadKey}
              onClick={() => handleDigit(digit)}
              aria-label={digit}
              id={`numpad-${digit}`}
            >
              {digit}
            </button>
          )
        ))}
      </div>

      {optional && onSkip && (
        <button className={styles.skipBtn} onClick={onSkip} id="number-skip-btn">
          I'd prefer to skip this
        </button>
      )}
    </div>
  );
}
