'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application crashed:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07090F',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Something went wrong!</h2>
      <p style={{ color: '#94a3b8', marginBottom: '32px' }}>We apologize for the inconvenience.</p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          onClick={() => reset()}
          style={{
            padding: '12px 24px',
            background: '#4B6BD8',
            color: '#fff',
            border: 'none',
            borderRadius: '99px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Try again
        </button>
        <Link href="/" style={{
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '99px',
          textDecoration: 'none',
          fontWeight: 600
        }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
