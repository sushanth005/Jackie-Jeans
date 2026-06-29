'use client';

import { useMemo } from 'react';
import styles from './FitOverview.module.css';

interface FitOverviewProps {
  answers: Record<string, unknown>;
  currentStep: number;
  totalSteps: number;
}

// Rise: matches quizConfig options: 'High rise' | 'Mid rise' | 'Low rise'
const RISE_OFFSET: Record<string, number> = {
  'High rise': 0,
  'Mid rise': 14,
  'Low rise': 28,
};

// Thigh fit: matches quizConfig options: 'Fitted' | 'Relaxed' | 'Loose'
const LEG_WIDTH: Record<string, number> = {
  Fitted: 44,
  Relaxed: 58,
  Loose: 72,
};

// Waist fit: matches quizConfig options: 'Snug' | 'Slightly relaxed' | 'Relaxed'
// Use brand blue variants for denim color
const DENIM_COLOR: Record<string, string> = {
  'Snug':             '#3A5A8C',
  'Slightly relaxed': '#4A6DA8',
  'Relaxed':          '#5A7DB7',
};

export default function FitOverview({ answers, currentStep, totalSteps }: FitOverviewProps) {
  // Only use values if they have been explicitly answered
  const rise        = answers['rise']        as string | undefined;
  const thighFit    = answers['thighFit']    as string | undefined;
  const waistFit    = answers['waistFit']    as string | undefined;
  const height      = answers['height']      as string | undefined;
  const waist       = answers['waist']       as string | undefined;
  const hip         = answers['hip']         as string | undefined;
  const brands      = (answers['brands']     as string[]) || [];
  const frustration = answers['frustration'] as string | undefined;

  // SVG state — defaults until answered
  const riseOffset = RISE_OFFSET[rise ?? ''] ?? 14;
  const legW       = LEG_WIDTH[thighFit ?? ''] ?? 58;
  const denimColor = DENIM_COLOR[waistFit ?? ''] ?? '#4A6DA8';

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(v =>
      v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
    ).length;
  }, [answers]);

  const progress = Math.min(100, Math.round((answeredCount / totalSteps) * 100));

  // Show value ONLY when explicitly answered — otherwise null shows "—"
  const metrics = [
    { label: 'Height',  value: height    ?? null, icon: '↕' },
    { label: 'Waist',   value: waist     ?? null, icon: '○' },
    { label: 'Hip',     value: hip       ?? null, icon: '◎' },
    { label: 'Rise',    value: rise      ?? null, icon: '⬆' },
    { label: 'Thigh',   value: thighFit  ?? null, icon: '≋' },
    { label: 'Fit',     value: waistFit  ?? null, icon: '⟳' },
  ];

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>LIVE FIT PROFILE</span>
        <span className={styles.panelProgress}>{answeredCount}/{totalSteps}</span>
      </div>

      {/* Jeans SVG visualization */}
      <div className={styles.jeansWrap}>
        <svg
          viewBox="0 0 200 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.jeansSvg}
          aria-label="Jeans preview"
        >
          {/* Denim shadow/texture gradient */}
          <defs>
            <linearGradient id="denim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={denimColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={denimColor} stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="denimShade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
              <stop offset="50%" stopColor="transparent" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="waistband" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.6"/>
            </filter>
          </defs>

          {/* Waistband — rises based on rise selection */}
          <rect
            x={100 - legW * 0.75}
            y={20 + riseOffset}
            width={legW * 1.5}
            height={20 - riseOffset * 0.2}
            rx="2"
            fill="url(#waistband)"
            style={{ transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Belt loops */}
          {[-30, -10, 10, 30].map((x, i) => (
            <rect key={i}
              x={100 + x - 3}
              y={19 + riseOffset}
              width={6} height={22 - riseOffset * 0.2} rx="2"
              fill="#334155"
              style={{ transition: 'all 0.5s ease' }}
            />
          ))}

          {/* Main jeans body */}
          <path
            d={`
              M ${100 - legW * 0.75} ${40 + riseOffset}
              Q ${100 - legW * 0.7} ${70} ${100 - legW * 0.6} ${120}
              L ${100 - legW * 0.55} ${250}
              Q ${100 - legW * 0.3} ${255} ${100} ${253}
              Q ${100 + legW * 0.3} ${255} ${100 + legW * 0.55} ${250}
              L ${100 + legW * 0.6} ${120}
              Q ${100 + legW * 0.7} ${70} ${100 + legW * 0.75} ${40 + riseOffset}
              Z
            `}
            fill="url(#denim)"
            filter="url(#softShadow)"
            style={{ transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Leg shading */}
          <path
            d={`
              M ${100 - legW * 0.75} ${40 + riseOffset}
              Q ${100 - legW * 0.7} ${70} ${100 - legW * 0.6} ${120}
              L ${100 - legW * 0.55} ${250}
              Q ${100 - legW * 0.3} ${255} ${100} ${253}
              Q ${100 + legW * 0.3} ${255} ${100 + legW * 0.55} ${250}
              L ${100 + legW * 0.6} ${120}
              Q ${100 + legW * 0.7} ${70} ${100 + legW * 0.75} ${40 + riseOffset}
              Z
            `}
            fill="url(#denimShade)"
            style={{ transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Center seam */}
          <path
            d={`M 100 ${48 + riseOffset} L 100 ${110}`}
            stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeDasharray="3 3"
            style={{ transition: 'all 0.5s ease' }}
          />

          {/* Pocket outlines */}
          <path
            d={`M ${100 - legW * 0.6} ${48 + riseOffset} Q ${100 - legW * 0.3} ${68 + riseOffset} ${100 - legW * 0.15} ${58 + riseOffset}`}
            stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none"
          />
          <path
            d={`M ${100 + legW * 0.6} ${48 + riseOffset} Q ${100 + legW * 0.3} ${68 + riseOffset} ${100 + legW * 0.15} ${58 + riseOffset}`}
            stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none"
          />

          {/* Fly stitching */}
          <path
            d={`M 97 ${48 + riseOffset} L 97 ${80 + riseOffset * 0.5}`}
            stroke="rgba(245,158,11,0.6)" strokeWidth="1" strokeDasharray="2 2"
          />

          {/* Button */}
          <circle cx="100" cy={30 + riseOffset} r="3" fill="#F59E0B" opacity="0.9" />

          {/* Subtle Knee fade */}
          <path
            d={`M ${100 - legW * 0.4} 150 Q 100 160 ${100 + legW * 0.4} 150`}
            stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" filter="blur(4px)"
          />

          {/* Cuff lines at bottom */}
          <path
            d={`M ${100 - legW * 0.55} 245 Q 100 248 ${100 + legW * 0.55} 245`}
            stroke="rgba(0,0,0,0.4)" strokeWidth="1" fill="none"
          />
        </svg>
      </div>

      {/* Metrics grid */}
      <div className={styles.metricsGrid}>
        {metrics.map(({ label, value, icon }) => (
          <div key={label} className={`${styles.metric} ${value ? styles.metricFilled : ''}`}>
            <span className={styles.metricIcon}>{icon}</span>
            <span className={styles.metricLabel}>{label}</span>
            <span className={styles.metricValue}>{value ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className={styles.brandsRow}>
          <span className={styles.brandsLabel}>BRANDS</span>
          <div className={styles.brandChips}>
            {brands.slice(0, 3).map(b => (
              <span key={b} className={styles.brandChip}>{b}</span>
            ))}
            {brands.length > 3 && (
              <span className={styles.brandChipMore}>+{brands.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Frustration tag — shows once answered */}
      {!!frustration && (
        <div className={styles.brandsRow}>
          <span className={styles.brandsLabel}>PAIN POINT</span>
          <div className={styles.brandChips}>
            <span className={styles.brandChip}>{frustration}</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressLabel}>{progress}% complete</span>
      </div>
    </div>
  );
}
