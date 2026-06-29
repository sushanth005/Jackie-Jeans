'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.navInner}>
        <Link href="/" className={styles.navBrand} aria-label="Jackie Jeans home">
          <img src="/monogram.svg" alt="JJ" className={styles.navLogo} />
          <span className={styles.navBrandName}>Jackie Jeans</span>
        </Link>

        <div className={styles.navLinks}>
          <Link
            href="/quiz"
            className={`${styles.navLink} ${pathname.startsWith('/quiz') ? styles.navLinkActive : ''}`}
          >
            Fit quiz
          </Link>
          <Link
            href="/voice"
            className={`${styles.navLink} ${pathname.startsWith('/voice') ? styles.navLinkActive : ''}`}
          >
            Voice
          </Link>
        </div>

        <button 
          className={styles.navCta} 
          onClick={() => setIsPopupOpen(!isPopupOpen)}
          aria-haspopup="true"
          aria-expanded={isPopupOpen}
        >
          Start quiz
        </button>
        
        {isPopupOpen && (
          <>
            <div className={styles.popupOverlay} onClick={() => setIsPopupOpen(false)} />
            <div className={styles.popupContainer}>
              <div className={styles.popupInner}>
                
                <Link href="/quiz" className={styles.popupItem} onClick={() => setIsPopupOpen(false)}>
                  <div className={styles.popupIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="10" rx="2"/>
                      <path d="M7 15h.01M12 15h.01M17 15h.01M7 19h10"/>
                    </svg>
                  </div>
                  <div className={styles.popupText}>
                    <span className={styles.popupTitle}>Manual Quiz</span>
                    <span className={styles.popupDesc}>Answer 10 quick questions manually</span>
                  </div>
                </Link>

                <Link href="/voice" className={styles.popupItem} onClick={() => setIsPopupOpen(false)}>
                  <div className={styles.popupIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                      <line x1="8" y1="22" x2="16" y2="22"/>
                    </svg>
                  </div>
                  <div className={styles.popupText}>
                    <span className={styles.popupTitle}>Voice Quiz</span>
                    <span className={styles.popupDesc}>Talk to Jackie, our AI fit assistant</span>
                  </div>
                </Link>

              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
