import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20 section-padding" style={{ background: '#0A0A0A' }}>
      <div style={{ background: '#111111', border: '1px solid #1E1E1E', padding: '48px 32px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '100%', height: '1px', background: '#1E1E1E', marginBottom: '32px' }} />
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '72px', color: '#F5F0E8', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1, marginBottom: '16px' }}>
          404
        </h1>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', color: '#F5F0E8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, marginBottom: '4px' }}>
          This page stepped out.
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#666', fontWeight: 300, lineHeight: 1.6, marginBottom: '32px' }}>
          It&apos;ll be back. Probably.
        </p>
        <Link
          href="/"
          style={{ display: 'inline-block', border: '1px solid #B8A07A', color: '#B8A07A', background: 'transparent', padding: '12px 28px', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, textDecoration: 'none', transition: 'all 0.22s ease' }}
        >
          Go Home →
        </Link>
        <div style={{ width: '100%', height: '1px', background: '#1E1E1E', marginTop: '32px' }} />
      </div>
    </div>
  );
}
