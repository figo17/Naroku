'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PetaPetualanganPage() {
  const router = useRouter();
  const supabase = createClient();
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [isLevel1Done, setIsLevel1Done] = useState(false);
  const [showLockToast, setShowLockToast] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?role=murid');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStudentProfile(profile);
      }

      // Check if student completed Level 1 essay
      const { data: essayData } = await supabase
        .from('level1_essay_answers')
        .select('tokoh1_answer, tokoh2_answer, tokoh3_answer, tokoh4_answer')
        .eq('user_id', user.id)
        .maybeSingle();

      const allDone = Boolean(
        essayData?.tokoh1_answer?.trim() &&
        essayData?.tokoh2_answer?.trim() &&
        essayData?.tokoh3_answer?.trim() &&
        essayData?.tokoh4_answer?.trim()
      );
      setIsLevel1Done(allDone);
    }

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER 16:9
        Menjamin koordinat hitbox transparan selalu 100% tepat presisi
        di atas tombol grafis pada gambar peta di layar mana pun (HP, tablet, laptop, PC).
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Background Artwork Peta Petualangan */}
        <Image
          src="/assets/backgrounds/peta-petualangan.jpg"
          alt="Peta Petualangan Alur Crita Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES (Menimpa Navigasi Bawaan Gambar)
           ======================================================== */}
        
        {/* Hitbox: Menu -> Beranda */}
        <Link
          href="/beranda"
          title="Bali menyang Beranda"
          aria-label="Menu Beranda"
          className="absolute left-[33%] top-[2%] w-[5%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Hitbox: Materi -> Modul Materi Crita Legenda */}
        <Link
          href="/materi"
          title="Bukak Materi Crita Legenda"
          aria-label="Materi"
          className="absolute left-[39.5%] top-[2%] w-[6%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Hitbox: CP/TP -> Capaian & Tujuan Pasinaon */}
        <Link
          href="/cptp"
          title="Bukak Capaian lan Tujuan Pasinaon (CP/TP)"
          aria-label="CP/TP"
          className="absolute left-[47%] top-[2%] w-[5%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Hitbox: Speaker / Audio Toggle */}
        <button
          type="button"
          onClick={() => setAudioPlaying((prev) => !prev)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          aria-label="Toggle Audio"
          className="absolute left-[93.2%] top-[1.8%] w-[4.5%] h-[5.2%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300/50 transition-all cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-75" />
          )}
        </button>

        {/* ========================================================
            LEVEL 1-3 TRANSPARENT HITBOXES
           ======================================================== */}

        {/* ---------------- LEVEL 1: ORIENTASI TOKOH ---------------- */}
        <Link
          href="/level1"
          onMouseEnter={() => setHoveredLevel(1)}
          onMouseLeave={() => setHoveredLevel(null)}
          title="Level 1: Orientasi Tokoh"
          aria-label="Level 1 Orientasi Tokoh"
          className="group absolute left-[11.5%] top-[26%] w-[19.8%] h-[34%] rounded-3xl bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-400/60 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-95 transition-all duration-200 cursor-pointer z-20 flex flex-col items-center justify-end pb-1"
        >
          {/* Tooltip Indikator Level 1 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-1 px-3 py-1 bg-black/85 border border-yellow-400/80 rounded-full text-yellow-300 text-[10px] sm:text-xs font-bold tracking-wide shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <span>▶</span> Miwiti Level 1 (Orientasi Tokoh)
          </div>
        </Link>

        {/* ---------------- LEVEL 2: CENGKORONGAN CRITA ---------------- */}
        <div
          onClick={() => {
            if (isLevel1Done) {
              router.push('/level2');
            } else {
              setShowLockToast(true);
              setTimeout(() => setShowLockToast(false), 4500);
            }
          }}
          onMouseEnter={() => setHoveredLevel(2)}
          onMouseLeave={() => setHoveredLevel(null)}
          title="Level 2: Cengkorongan Crita (Balungan Cerita)"
          aria-label="Level 2 Cengkorongan Crita"
          className="group absolute left-[40.2%] top-[27%] w-[20%] h-[34%] rounded-3xl bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-400/60 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-95 transition-all duration-200 cursor-pointer z-20 flex flex-col items-center justify-end pb-1"
        >
          {/* Tooltip Indikator Level 2 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-1 px-3 py-1 bg-black/85 border border-yellow-400/80 rounded-full text-yellow-300 text-[10px] sm:text-xs font-bold tracking-wide shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <span>{isLevel1Done ? '▶ Miwiti Level 2' : '🔒 Level 2 (Isih Dikunci)'}</span>
          </div>
        </div>

        {/* ---------------- LEVEL 3: NULIS ---------------- */}
        <Link
          href="/level3"
          onMouseEnter={() => setHoveredLevel(3)}
          onMouseLeave={() => setHoveredLevel(null)}
          title="Level 3: Nulis Crita"
          aria-label="Level 3 Nulis Crita"
          className="group absolute left-[69.5%] top-[28%] w-[20%] h-[33%] rounded-3xl bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-400/60 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-95 transition-all duration-200 cursor-pointer z-20 flex flex-col items-center justify-end pb-1"
        >
          {/* Tooltip Indikator Level 3 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-1 px-3 py-1 bg-black/85 border border-yellow-400/80 rounded-full text-yellow-300 text-[10px] sm:text-xs font-bold tracking-wide shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <span>▶</span> Miwiti Level 3
          </div>
        </Link>

        {/* Floating Quick Action Nav di Pojok Bawah */}
        <div className="absolute bottom-2.5 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          <Link
            href="/beranda"
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-yellow-500/60 text-yellow-300 text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Beranda
          </Link>

          {studentProfile && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-[11px] backdrop-blur-sm shadow">
              <span>👤</span>
              <span className="font-semibold text-yellow-300">{studentProfile.nama_lengkap}</span>
            </div>
          )}

          <Link
            href="/cptp"
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-emerald-500/60 text-emerald-300 text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>📖</span> Capaian Pasinaon
          </Link>
        </div>

        {/* ========================================================
            ALERT TOAST: LEVEL 2 ISIH DIKUNCI
           ======================================================== */}
        {showLockToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 pointer-events-auto animate-bounce">
            <div className="bg-stone-900/95 border-2 border-red-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-bold text-yellow-400 text-xs sm:text-sm">
                    Level 2 Isih Dikunci!
                  </p>
                  <p className="text-[11px] text-stone-300">
                    Rampungake lan simpen wangsulan 4 tokoh ing Level 1 dhisik.
                  </p>
                </div>
              </div>
              <Link
                href="/level1"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-md whitespace-nowrap"
              >
                Bukak Level 1 ➜
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
