'use client';

import { SessionProvider } from 'next-auth/react';
import React, { useEffect } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    const preventZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventZoom);
    };
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
} 