'use client';

import { JEAN_SIZES } from '@/lib/quizConfig';
import styles from './BrandSizes.module.css';

interface BrandSizesProps {
  brands: string[];
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export default function BrandSizes({ brands, value, onChange }: BrandSizesProps) {
  function handleSizeChange(brand: string, size: string) {
    onChange({ ...value, [brand]: size });
  }

  return (
    <div className={styles.wrapper}>
      {brands.map((brand) => (
        <div key={brand} className={styles.brandRow}>
          <div className={styles.brandName}>{brand}</div>
          <div className={styles.sizeGrid}>
            {JEAN_SIZES.map((size) => {
              const isSelected = value[brand] === size;
              return (
                <button
                  key={size}
                  className={`${styles.sizeBtn} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSizeChange(brand, size)}
                  aria-pressed={isSelected}
                  id={`size-${brand.replace(/[^a-z0-9]/gi, '-')}-${size}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
