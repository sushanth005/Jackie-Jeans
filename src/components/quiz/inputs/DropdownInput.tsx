'use client';

import { useRef, useEffect } from 'react';
import styles from './DropdownInput.module.css';

interface DropdownInputProps {
  options: string[];
  value: string;
  unit?: string;
  onChange: (value: string) => void;
}

export default function DropdownInput({ options, value, onChange }: DropdownInputProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into center view
  useEffect(() => {
    if (!value || !listRef.current) return;
    const idx = options.indexOf(value);
    if (idx === -1) return;
    const item = listRef.current.children[idx] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [value, options]);

  return (
    <div className={styles.wrapper}>
      {/* Drum-roll style scroll picker */}
      <div className={styles.pickerWrapper}>
        <div className={styles.fadeTop} aria-hidden="true" />
        <div className={styles.fadeBottom} aria-hidden="true" />
        <div className={styles.highlightRing} aria-hidden="true" />
        <div className={styles.list} ref={listRef} role="listbox" aria-label="Select an option">
          {options.map((opt) => (
            <button
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`${styles.item} ${value === opt ? styles.selected : ''}`}
              onClick={() => onChange(opt)}
              id={`dropdown-opt-${opt.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
