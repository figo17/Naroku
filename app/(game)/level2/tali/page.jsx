'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Level2TaliRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/level2/jurang');
  }, [router]);

  return (
    <div className="w-screen h-screen bg-[#030c07] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
      <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm tracking-wide text-amber-200">Mbukak Jembatan Tali Rotan...</p>
    </div>
  );
}
