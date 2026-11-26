'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { recordLevel2Mission } from '@/lib/level2Progress';

export default function Level2NgunjukJamuPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const navLockRef = useRef(false);

  useEffect(() => {
    router.prefetch('/level2/gladhen-jamu');
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
        const s = now + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.22, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.48);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.52);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const handleBanjur = useCallback(() => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    playChime();
    recordLevel2Mission(supabase, 'ngunjuk');
    router.push('/level2/gladhen-jamu');
  }, [playChime, router, supabase]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showStoryModal || showHelpModal) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        handleBanjur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBanjur, showHelpModal, showStoryModal]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#120b05] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Adegan Lv 2 – Nglunjuk Jamu...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#120b05] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* Container Utama 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        <Image
          src="/assets/level2/screen_ngunjuk_jamu.jpg"
          alt="Lv 2 – Nglunjuk Jamu Racikan Resi Darmo"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES
           ======================================================== */}
        <Link
          href="/beranda"
          title="Rara Kuning - Bali menyang Beranda"
          className="absolute left-[1.8%] top-[1.0%] w-[20%] h-[7.2%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        <button
          type="button"
          onClick={() => setShowStoryModal(true)}
          title="Waca Katrangan Asil Perawatan Jamu"
          className="absolute left-[83.8%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Katrangan</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Pituduh Pasinaon"
          className="absolute left-[89.1%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Pituduh</span>
        </button>

        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[94.4%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-80" />
          )}
          <span className="sr-only">Audio</span>
        </button>

        {/* Hitbox Balon Dialog Resi Darmo & Panel Asil Perawatan */}
        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca dhawuhe Resi Darmo"
          className="absolute left-[25.0%] top-[10.8%] w-[31.8%] h-[25.5%] rounded-3xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20 transition-all"
        />

        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca Asil Perawatan"
          className="absolute left-[70.8%] top-[14.2%] w-[28.2%] h-[64.5%] rounded-3xl bg-transparent hover:bg-yellow-400/5 cursor-pointer z-20 transition-all"
        />

        {/* ========================================================
            TOMBOL TRANSPARAN PRESISI ING NDUWUR TOMBOL "▶ BANJUR"
            (x: 796..986, y: 488..530 pada 1024x576)
           ======================================================== */}
        <button
          type="button"
          onClick={handleBanjur}
          title="Banjur menyang adegan sabanjure"
          aria-label="Banjur"
          className="absolute left-[77.2%] top-[84.0%] w-[19.6%] h-[8.8%] rounded-full bg-transparent hover:bg-yellow-300/20 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_28px_rgba(250,204,21,0.75)] active:scale-[0.98] transition-all duration-200 cursor-pointer z-35 flex items-center justify-center"
        >
          <span className="sr-only">Banjur</span>
        </button>

        {/* Tombol Bali Cilik ing Pojok Kiwa Ndhuwur Ngisor Navbar */}
        <div className="absolute top-[10.2%] left-3 z-30">
          <Link
            href="/level2/ngolah"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Ngolah Jamu
          </Link>
        </div>
      </div>

      {/* Modal Katrangan Cerita */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Asil Perawatan Jamu Tradhisional
            </h3>
            <div className="space-y-3 text-xs sm:text-sm font-serif leading-relaxed">
              <p className="p-3 rounded-xl bg-amber-950/45 border border-yellow-500/35 text-amber-100 italic">
                &ldquo;Iki jamu saka godhong-godhongan sing wis kok kumpulake. Tulung padha dilunjuk kanthi tertib, Rara Kuning lan Rara Runting.&rdquo; — <strong>Resi Darmo</strong>
              </p>
              <p className="text-stone-300">
                Rara Kuning lan Rara Runting ngunjuk jamu racikan Resi Darmo kanthi kebak pangarep-arep. Jamu saka godhong Tapak Liman, Sirih, Sambiloto, lan Mindi iku mènèhi pangarep-arep lan nyuda lara sing dirasakaké, nanging durung mari rampung.
              </p>
            </div>
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowStoryModal(false);
                  handleBanjur();
                }}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md cursor-pointer"
              >
                Banjur ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pituduh */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-3">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Pituduh Pasinaon
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Wacanen dhawuhe Resi Darmo lan katrangan ing kothak <strong>Asil Perawatan</strong> sisih tengen, banjur klik tombol kuning <strong>▶ Banjur</strong> ing pojok tengen ngisor kanggo nglajengake crita!
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md cursor-pointer"
              >
                Ngerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
