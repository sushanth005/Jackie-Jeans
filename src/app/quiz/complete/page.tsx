'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFitProfile, FitProfile, buildRedirectUrl, JACKIE_JEANS_URL } from '@/lib/fitProfile';
import styles from './page.module.css';

const REDIRECT_SECONDS = 6;

const QUESTION_LABELS: Record<string, string> = {
  height: 'Height',
  weight: 'Weight',
  waist: 'Waist',
  hip: 'Hips',
  waistFit: 'Waist Fit',
  rise: 'Rise',
  thighFit: 'Thigh Fit',
  brands: 'Brands',
  brandSizes: 'Brand Sizes',
  frustration: 'Biggest Frustration',
};

export default function QuizCompletePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FitProfile | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const p = getFitProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          const url = buildRedirectUrl(profile);
          window.location.href = url;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  function handleGoNow() {
    if (profile) {
      window.location.href = buildRedirectUrl(profile);
    } else {
      window.location.href = JACKIE_JEANS_URL;
    }
  }

  function renderAnswer(key: string, val: unknown): string {
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val as Record<string, string>)
        .map(([b, s]) => `${b}: ${s}`)
        .join(' · ');
    }
    return String(val ?? '—');
  }

  const profileEntries = profile
    ? Object.entries(profile).filter(
        ([key]) => !['completedVia', 'completedAt'].includes(key) && QUESTION_LABELS[key]
      )
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Success icon */}
        <div className={styles.successIcon} aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Headline */}
        <div className={styles.hero}>
          <h1 className={styles.title}>Your Fit Profile<br /><em>is Ready</em></h1>
          <p className={styles.subtitle}>
            We've captured everything we need to find your perfect pair.
            You're being taken to Jackie Jeans now.
          </p>
        </div>

        {/* Profile summary card */}
        {profile && (
          <div className={styles.profileCard}>
            <h2 className={styles.cardTitle}>Your Answers</h2>
            <div className={styles.profileGrid}>
              {profileEntries.map(([key, val]) => (
                val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0) ? (
                  <div key={key} className={styles.profileRow}>
                    <span className={styles.profileLabel}>{QUESTION_LABELS[key]}</span>
                    <span className={styles.profileValue}>{renderAnswer(key, val)}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {/* Countdown + CTA */}
        <div className={styles.redirectArea}>
          <div className={styles.countdownRing}>
            <svg viewBox="0 0 44 44" className={styles.countdownSvg}>
              <circle
                cx="22" cy="22" r="19"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="2"
              />
              <circle
                cx="22" cy="22" r="19"
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth="2"
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
          <button
            className="btn btn-primary"
            onClick={handleGoNow}
            id="go-to-jackie-jeans"
            style={{ width: '100%', marginTop: '8px' }}
          >
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
