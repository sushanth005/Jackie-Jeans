'use client';

import { useState } from 'react';
import styles from './BrandSelector.module.css';

interface BrandSelectorProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export default function BrandSelector({ options, value, onChange }: BrandSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? options.filter((b) => b.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(brand: string) {
    if (value.includes(brand)) {
      onChange(value.filter((b) => b !== brand));
    } else {
      onChange([...value, brand]);
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Search */}
      <div className={styles.searchBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="brand-search"
          aria-label="Search brands"
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Clear search">
            ×
          </button>
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className={styles.selectedCount}>
          {value.length} brand{value.length !== 1 ? 's' : ''} selected
        </p>
      )}

      {/* Brand chips */}
      <div className={styles.grid}>
        {filtered.map((brand) => {
          const isSelected = value.includes(brand);
          return (
            <button
              key={brand}
              className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
              onClick={() => toggle(brand)}
              aria-pressed={isSelected}
              id={`brand-${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={styles.chipCheck}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {brand}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className={styles.noResults}>No brands found for "{search}"</p>
        )}
      </div>
    </div>
  );
}
