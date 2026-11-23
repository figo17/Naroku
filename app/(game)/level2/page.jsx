'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2Adegan2Page() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isLevel1Completed, setIsLevel1Completed] = useState(false);
  const [missingChars, setMissingChars] = useState([]);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);

  useEffect(() => {
    async function checkPrerequisites() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?role=murid');
          return;
        }

        // Check if student has completed Level 1 essay answers (all 4 characters)
        const { data: essayData } = await supabase
          .from('level1_essay_answers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const missing = [];
        if (!essayData?.tokoh1_answer?.trim()) missing.push('Tokoh 1 (Rara Kuning)');
        if (!essayData?.tokoh2_answer?.trim()) missing.push('Tokoh 2 (Rara Runting)');
        if (!essayData?.tokoh3_answer?.trim()) missing.push('Tokoh 3 (Resi Darmo)');
        if (!essayData?.tokoh4_answer?.trim()) missing.push('Tokoh 4 (Lembu Amiseno)');

        setMissingChars(missing);

        if (missing.length === 0) {
          setIsLevel1Completed(true);
        } else {
          setIsLevel1Completed(false);
          setShowLockedModal(true);
        }
      } catch (err) {
        console.error('Error checking Level 1 status:', err);
      } finally {
        setLoading(false);
      }
    }

    checkPrerequisites();
  }, [router, supabase]);

  const handleLajengake = () => {
    if (!isLevel1Completed) {
      setShowLockedModal(true);
      return;
    }
    // Navigate to Level 2 Orientasi Perawatan activity
    router.push('/level2/orientasi');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mriksa data pasinaon Level 1...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER UTAMA 16:9 (1024 x 576)
        Menjamin 100% akurasi tombol transparan pada layar HP, tablet, maupun PC
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Background Artwork Adegan 2 */}
        <Image
          src="/assets/level2/screen_adegan2_intro.jpg"
          alt="Adegan 2: Cengkorongan Crita - Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            NAVIGASI POJOK ATAS (HITBOXES)
           ======================================================== */}
        {/* Tombol Bali ke Peta Petualangan */}
        <Link
          href="/peta"
          title="Bali menyang Peta Petualangan"
          className="absolute left-[3.5%] top-[3.5%] w-[8%] h-[7%] rounded-xl bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 active:scale-95 transition-all cursor-pointer z-30"
        />

        {/* ========================================================
            TOMBOL TRANSPARAN: LAJENGAKE >> (NEXT LEVEL 2)
           ======================================================== */}
        <button
          type="button"
          onClick={handleLajengake}
          onMouseEnter={() => setHoveredButton(true)}
          onMouseLeave={() => setHoveredButton(false)}
          title="Lajengake menyang Adegan 2"
          aria-label="Lajengake"
          className="absolute left-[35.9%] top-[74.5%] w-[28.2%] h-[13.0%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300/80 hover:shadow-[0_0_30px_rgba(250,204,21,0.65)] active:scale-95 transition-all duration-200 cursor-pointer z-30 flex items-center justify-center group"
        >
          <span className="sr-only">Lajengake</span>
          {hoveredButton && (
            <div className="absolute -top-8 px-3.5 py-1 rounded-full bg-black/90 border border-yellow-400/80 text-yellow-300 text-xs font-bold tracking-wider shadow-xl animate-fade-in pointer-events-none whitespace-nowrap">
              Miwiti Adegan 2 (Cengkorongan Crita) ➜
            </div>
          )}
        </button>

        {/* Floating Quick Back Button */}
        <div className="absolute bottom-3 left-4 z-30">
          <Link
            href="/peta"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-yellow-500/60 text-yellow-300 text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>🗺️</span> Bali menyang Peta
          </Link>
        </div>
      </div>

      {/* ========================================================
          MODAL PERINGATAN: LEVEL 1 ISIH DURUNG LENGKAP
         ======================================================== */}
      {showLockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl text-center text-stone-100">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500/80 text-red-400 text-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              🔒
            </div>

            <h3 className="text-xl font-serif font-black text-yellow-400">
              Adegan 2 Isih Dikunci!
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              Kabeh wangsulan <strong>4 tokoh ing Level 1</strong> kudu diisi lan disimpen dhisik sadurunge panjenengan bisa mbukak lan nglajengake menyang Adegan 2.
            </p>

            {missingChars.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-left">
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Tokoh sing durung diisi:
                </p>
                <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-0.5">
                  {missingChars.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/level1"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>✍️</span> Rampungake Level 1
              </Link>
              <Link
                href="/peta"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center"
              >
                Bali menyang Peta
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
