'use client';

import { useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  // Lock scroll on homepage for mobile only, restore on unmount
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-[#e5e5e5]">
      <Image
        src="https://res.cloudinary.com/dpxirx0mn/image/upload/w_1920,c_scale,q_auto:best,f_auto/v1781187209/DSCF5649_jzhirj.jpg"
        alt="AUTHOR hero"
        fill
        priority
        sizes="100vw"
        quality={100}
        className="h-full w-full object-cover object-center md:object-[center_42%]"
      />
    </section>
  );
}