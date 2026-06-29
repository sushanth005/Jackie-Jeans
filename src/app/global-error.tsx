'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        background: '#07090F',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        margin: 0
      }}>
        <h2>Critical Application Error</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Something went terribly wrong.</p>
        <button 
          onClick={() => reset()}
          style={{
            padding: '12px 24px',
            background: '#4B6BD8',
            color: '#fff',
            border: 'none',
            borderRadius: '99px',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
