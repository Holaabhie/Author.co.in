'use client';

import { useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  // Lock scroll on homepage, restore on unmount
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100svh',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <Image
        src="/hero-bg.png"
        alt="AUTHOR"
        fill
        priority
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    </div>
  );
}