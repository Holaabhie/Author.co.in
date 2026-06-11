"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 section-padding" style={{ background: '#0A0A0A' }}>
      <div style={{ background: '#111111', border: '1px solid #1E1E1E', padding: '48px 32px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '100%', height: '1px', background: '#1E1E1E', marginBottom: '32px' }} />
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', color: '#F5F0E8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, marginBottom: '4px' }}>
          Something broke.
        </h2>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', color: '#B8A07A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          We&apos;re already on it.
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#666', fontWeight: 300, lineHeight: 1.6, marginBottom: '32px' }}>
          Something unexpected happened on our end.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ border: '1px solid #B8A07A', color: '#B8A07A', background: 'transparent', padding: '12px 28px', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, cursor: 'pointer', transition: 'all 0.22s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#B8A07A'; e.currentTarget.style.color = '#0A0A0A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B8A07A'; }}
          >
            Refresh Page
          </button>
          <Link
            href="/"
            style={{ border: '1px solid #333', color: '#888', background: 'transparent', padding: '12px 28px', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, textDecoration: 'none', transition: 'all 0.22s ease' }}
          >
            Go Home
          </Link>
        </div>
        <div style={{ width: '100%', height: '1px', background: '#1E1E1E', marginTop: '32px' }} />
      </div>
    </div>
  );
}
