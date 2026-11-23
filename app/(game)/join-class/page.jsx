'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinClassContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const level = searchParams?.get('level');
    if (level === '1') {
      router.replace('/level1');
    } else if (level) {
      router.replace(`/play?level=${level}`);
    } else {
      router.replace('/beranda');
    }
  }, [router, searchParams]);

  return (
    <div className="w-screen h-screen bg-[#04120a] flex items-center justify-center text-yellow-300 font-bold">
      Mengarahkan ke petualangan...
    </div>
  );
}

export default function JoinClassRedirectPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#04120a]" />}>
      <JoinClassContent />
    </Suspense>
  );
}
