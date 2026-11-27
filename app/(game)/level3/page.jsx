'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level3IntroPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hoveredStart, setHoveredStart] = useState(false);
  const [showMateriModal, setShowMateriModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level3/nulis');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.11;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.22, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.5);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const handleMiwitiNulis = useCallback(() => {
    playChime();
    router.push('/level3/nulis');
  }, [playChime, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Level 3 – Nulis Crita...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* Container Utama 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        <Image
          src="/assets/level3/screen_level3_intro.jpg"
          alt="Lv 3 – Nulis Crita: Nulis Narasi Crita Lengkap Legenda Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES (Menu > Materi > CP/TP > Peta Petualangan)
           ======================================================== */}
        {/* Logo Rara Kuning -> Beranda */}
        <Link
          href="/beranda"
          title="Rara Kuning - Bali menyang Beranda"
          className="absolute left-[1.8%] top-[1.0%] w-[19.5%] h-[7.2%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* Menu -> Beranda */}
        <Link
          href="/beranda"
          title="Menu Beranda"
          className="absolute left-[32.2%] top-[1.5%] w-[5.2%] h-[5.5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* Materi -> Halaman Materi */}
        <Link
          href="/materi"
          title="Materi Crita Legenda"
          className="absolute left-[39.6%] top-[1.5%] w-[5.8%] h-[5.5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* CP/TP */}
        <Link
          href="/cptp"
          title="Capaian lan Tujuan Pasinaon (CP/TP)"
          className="absolute left-[47.2%] top-[1.5%] w-[5.5%] h-[5.5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* Peta Petualangan */}
        <Link
          href="/peta"
          title="Peta Petualangan"
          className="absolute left-[54.8%] top-[1.5%] w-[14.2%] h-[5.5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* Speaker / Audio Toggle */}
        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[93.2%] top-[1.2%] w-[4.8%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-80" />
          )}
          <span className="sr-only">Audio</span>
        </button>

        {/* ========================================================
            TOMBOL TRANSPARAN PRESISI: ✏️ MIWITI NULIS >>
            (x: 383..717, y: 441..487 pada 1024x576)
           ======================================================== */}
        <button
          type="button"
          onClick={handleMiwitiNulis}
          onMouseEnter={() => setHoveredStart(true)}
          onMouseLeave={() => setHoveredStart(false)}
          title="Miwiti Nulis Narasi Crita Lengkap"
          aria-label="Miwiti Nulis"
          className="absolute left-[36.6%] top-[75.2%] w-[34.2%] h-[10.6%] rounded-full bg-transparent hover:bg-yellow-400/15 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.7)] active:scale-[0.98] transition-all duration-200 cursor-pointer z-35 flex items-center justify-center"
        >
          <span className="sr-only">Miwiti Nulis</span>
          {hoveredStart && (
            <div className="absolute -top-8 px-3.5 py-1 rounded-full bg-black/90 border border-yellow-400/80 text-yellow-300 text-xs font-bold tracking-wider shadow-xl pointer-events-none whitespace-nowrap">
              ✏️ Miwiti Nulis Narasi Level 3 ➜
            </div>
          )}
        </button>

        {/* Quick Nav Bali menyang Peta / Pungkasan Lv 2 */}
        <div className="absolute bottom-2.5 left-4 z-30 flex items-center gap-2">
          <Link
            href="/peta"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-yellow-500/60 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>🗺️</span> Peta Petualangan
          </Link>
          <Link
            href="/level2/pungkasan"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-stone-600 hover:border-yellow-500/60 text-stone-300 hover:text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Pungkasan Lv 2
          </Link>
        </div>
      </div>

      {/* Modal Materi Ringkesan Cengkorongan Crita */}
      {showMateriModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Urutan Cengkorongan Crita Legenda Rara Kuning
            </h3>
            <div className="space-y-2 text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              <p>1. <strong>Orientasi Tokoh (Lv 1):</strong> Pitepungan paraga Rara Kuning, Rara Runting, Resi Darmo, lan Lembu Amiseno.</p>
              <p>2. <strong>Wiwitan &amp; Nanjak (Lv 2):</strong> Para putri nandhang lara lan perawatan ing kraton durung kasil marasake.</p>
              <p>3. <strong>Mucuk (Lv 2):</strong> Ngumbara nembus alas Gunung Wilis nganti tekan ing Padhepokan Resi Darmo.</p>
              <p>4. <strong>Mudhun &amp; Pungkasan (Lv 2):</strong> Ngumpulake 4 gegodhongan jamu, ngunjuk jamu usada, lan adus ing <em>Grojogan Rara Kuning</em> nganti waras.</p>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowMateriModal(false)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
