'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <main className={styles.main}>

      {/* ── HERO: full-screen video ── */}
      <section className={styles.hero}>
        <video
          ref={videoRef}
          className={styles.heroBg}
          src="/film.webm"
          autoPlay muted loop playsInline
          aria-hidden="true"
        />

        {/* Gradient overlays */}
        <div className={styles.overlayBottom} aria-hidden="true" />
        <div className={styles.overlayTop}    aria-hidden="true" />

        {/* ── Hero slide arrows (Removed per PRD) ── */}

        {/* ── Hero text — bottom left ── */}
        <div className={styles.heroContent}>
          {/* Eyebrow chip */}
          <div className={styles.heroLabel}>
            <span className={styles.heroLabelDot} aria-hidden="true" />
            WOMEN'S DENIM · SPRING '26
          </div>

          {/* Headline — white line 1, gold line 2 (matches original) */}
          <h1 className={styles.heroHeadline}>
            Flawless fit
            <br />
            <span className={styles.heroHeadlineGold}>Zero guesswork.</span>
          </h1>

          <p className={styles.heroSub}>
            AI-tailored women's denim — scanned to your shape,<br />
            cut for movement, made in India.
          </p>

          <div className={styles.heroCtas}>
            {/* Primary — start the fit quiz */}
            <Link href="/quiz" className={styles.ctaMain} id="hero-start-quiz">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
              Start quiz
            </Link>

            {/* Ghost — AI voice */}
            <Link href="/voice" className={styles.ctaGhost} id="hero-start-voice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>
              </svg>
              AI voice quiz
            </Link>
          </div>

          {/* Slide dots + counter — matches original bottom layout */}
          <div className={styles.slideBottom}>
            <div className={styles.slideDots}>
              <span className={`${styles.slideDot} ${styles.slideDotActive}`} />
              <span className={styles.slideDot} />
              <span className={styles.slideDot} />
              <span className={styles.slideDot} />
            </div>
          </div>
        </div>

        {/* Slide counter — removed per PRD */}
      </section>
    </main>
  );
}
