'use client';

import { useEffect, useState } from 'react';
import { getFitProfile, FitProfile, buildRedirectUrl, JACKIE_JEANS_URL } from '@/lib/fitProfile';
import styles from '../../quiz/complete/page.module.css';

const REDIRECT_SECONDS = 5;

export default function VoiceCompletePage() {
  const [profile, setProfile] = useState<FitProfile | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    setProfile(getFitProfile());
  }, []);

  useEffect(() => {
    if (!profile) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.href = buildRedirectUrl(profile);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  function handleGoNow() {
    window.location.href = profile ? buildRedirectUrl(profile) : JACKIE_JEANS_URL;
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.successIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className={styles.hero}>
          <h1 className={styles.title}>Great conversation,<br /><em>great fit ahead.</em></h1>
          <p className={styles.subtitle}>
            Jackie heard everything. Your fit profile is ready — you're being taken there now.
          </p>
        </div>
        <div className={styles.redirectArea}>
          <div className={styles.countdownRing}>
            <svg viewBox="0 0 44 44" className={styles.countdownSvg}>
              <circle cx="22" cy="22" r="19" fill="none" stroke="var(--border-subtle)" strokeWidth="2" />
              <circle
                cx="22" cy="22" r="19"
                fill="none" stroke="var(--accent-gold)" strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 19}`}
                strokeDashoffset={`${2 * Math.PI * 19 * (1 - countdown / REDIRECT_SECONDS)}`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className={styles.countdownNum}>{countdown}</span>
          </div>
          <p className={styles.countdownLabel}>Redirecting in {countdown}s</p>
          <button className="btn btn-primary" onClick={handleGoNow} id="voice-go-now" style={{ width: '100%', marginTop: '8px' }}>
            Take Me There Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
