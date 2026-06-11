'use client';

export function AuthorLoader({ size = 120, fullscreen = false }: { size?: number; fullscreen?: boolean }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes oval-draw {
          0%   { stroke-dashoffset: 880; }
          60%  { stroke-dashoffset: 0; }
          85%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -880; }
        }
        @keyframes logo-fade-in {
          0%,30% { opacity: 0; transform: scale(0.94); }
          60%,100% { opacity: 1; transform: scale(1); }
        }
      `}} />
      <div
        className={fullscreen
          ? 'fixed inset-0 bg-[#0A0A0A] z-[9999] flex flex-col items-center justify-center'
          : 'flex items-center justify-center p-8'
        }
      >
        <svg
          width={size}
          height={size * 0.6}
          viewBox="0 0 240 130"
          style={{ animation: 'logo-fade-in 2.4s ease forwards' }}
        >
          <ellipse cx="120" cy="65" rx="108" ry="58" fill="#0A0A0A" stroke="#1A1A1A" strokeWidth="1.5" />
          <ellipse
            cx="120" cy="65" rx="108" ry="58"
            fill="none" stroke="#F5F0E8" strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="880"
            style={{ animation: 'oval-draw 2.4s cubic-bezier(0.4,0,0.2,1) infinite' }}
          />
          <text x="120" y="72" textAnchor="middle" fontFamily="Georgia, serif" fontSize="46" fontWeight="700" fontStyle="italic" fill="#F5F0E8" letterSpacing="-1">Author</text>
          <text x="152" y="90" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="#B8A07A" letterSpacing="3">Co</text>
        </svg>
      </div>
    </>
  );
}
