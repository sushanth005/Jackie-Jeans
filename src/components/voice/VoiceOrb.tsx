'use client';

import styles from './VoiceOrb.module.css';

export type OrbState = 'idle' | 'speaking' | 'listening' | 'processing' | 'done';

interface VoiceOrbProps {
  state: OrbState;
  onClick: () => void;
}

export default function VoiceOrb({ state, onClick }: VoiceOrbProps) {
  return (
    <button
      className={`${styles.orbWrapper} ${styles[state]}`}
      onClick={onClick}
      aria-label={state === 'listening' ? 'Stop listening' : 'Tap to speak'}
      id="voice-orb"
    >
      {/* Outer ring */}
      <div className={styles.outerRing} aria-hidden="true" />
      {/* Middle ring */}
      <div className={styles.middleRing} aria-hidden="true" />
      {/* Inner orb */}
      <div className={styles.innerOrb} aria-hidden="true">
        <div className={styles.orbIcon}>
          {state === 'idle' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M9 22h6" />
            </svg>
          )}
          {state === 'speaking' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          )}
          {state === 'listening' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M9 22h6" />
            </svg>
          )}
          {state === 'processing' && (
            <div className={styles.spinner} />
          )}
          {state === 'done' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      {/* Sound wave bars — show when listening */}
      {state === 'listening' && (
        <div className={styles.waveWrapper} aria-hidden="true">
          {[0,1,2,3,4].map((i) => (
            <div key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* Ripple ring — show when speaking */}
      {state === 'speaking' && (
        <>
          <div className={styles.ripple1} aria-hidden="true" />
          <div className={styles.ripple2} aria-hidden="true" />
        </>
      )}
    </button>
  );
}
