"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { Shield, RotateCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      background: '#fafafa',
      color: '#1a1a2e'
    }}>
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e5e5e5'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 1.5rem',
          background: '#fef3c7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Shield style={{ width: '32', height: '32', color: '#f59e0b' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1a1a2e' }}>
          Page unavailable
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          This page encountered an error while loading. Our team has been notified.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCw size={16} /> Try again
          </button>
          <Link href="/overview" style={{
            padding: '0.75rem 1.5rem',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Home size={16} /> Back to Dashboard
          </Link>
        </div>
        <details style={{ marginTop: '2rem', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem' }}>
            Error details (for debugging)
          </summary>
          <pre style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#1e1e1e',
            color: '#e5e5e5',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.75rem',
            textAlign: 'left',
            maxHeight: '200px'
          }}>
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}