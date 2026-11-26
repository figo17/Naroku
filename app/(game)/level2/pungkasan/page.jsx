'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { recordLevel2Mission } from '@/lib/level2Progress';

export default function Level2PungkasanPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);
  const navLockRef = useRef(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    router.prefetch('/level3');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
        else recordLevel2Mission(supabase, 'pungkasan');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  const playFinaleFanfare = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.24, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.55);
        osc.connect(gain);
        osc.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.6);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const goLevel3 = useCallback(() => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    playFinaleFanfare();
    recordLevel2Mission(supabase, 'pungkasan');
    router.push('/level3');
  }, [playFinaleFanfare, router, supabase]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        goLevel3();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goLevel3]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#06140d] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Lv 2 – Pungkasan...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#06140d] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl bg-gradient-to-br from-[#071c12] via-[#0c2618] to-[#171209] flex items-stretch border border-amber-500/30">
        {/* Sisi Kiri (60.5%): Artwork Asli Lv 2 - Pungkasan (Tanpa Blok Putih) */}
        <div className="relative w-[60.5%] h-full shrink-0 overflow-hidden shadow-2xl">
          <Image
            src="/assets/level2/screen_pungkasan_lv2.jpg"
            alt="Lv 2 – Pungkasan: Asal-usul Grojogan Rara Kuning"
            fill
            priority
            sizes="65vw"
            className="object-cover object-center"
          />
        </div>

        {/* Sisi Kanan (39.5%): Panel Dudutan Pungkasan Level 2 & Tombol Lanjut Level 3 */}
        <div className="relative flex-1 h-full flex flex-col justify-between p-4 sm:p-6 md:p-7 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_70%)]">
          {/* Top Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/level2/grojogan-resi"
              className="px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow"
            >
              ⬅ Bali
            </Link>
            <Link
              href="/peta"
              className="px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow"
            >
              🗺️ Peta
            </Link>
          </div>

          {/* Kartu Perkamen Jawa: Dudutan Pungkasan Level 2 */}
          <div className="my-auto rounded-2xl bg-gradient-to-b from-[#f9ecc7] to-[#efd799] border-[3px] border-amber-700 shadow-[0_12px_32px_rgba(0,0,0,0.7)] p-3.5 sm:p-5 text-amber-950 space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900 text-amber-100 text-[10px] sm:text-xs font-serif font-bold tracking-wide shadow">
              <span>👑</span>
              <span>Pungkasan Level 2</span>
            </div>

            <h2 className="text-sm sm:text-lg md:text-xl font-serif font-black text-amber-950 leading-snug">
              Asal-Usul Grojogan Rara Kuning
            </h2>

            <p className="text-[11px] sm:text-xs md:text-sm font-serif text-amber-900/95 leading-relaxed">
              Saka sabar anggoné ngunjuk jamu racikan <strong>Resi Darmo</strong> lan tansah reresik awak ing grojogan suci lereng Gunung Wilis, Putri Rara Kuning lan Putri Rara Runting kasil pulih kasarasané.
            </p>

            <p className="text-[10px] sm:text-xs font-serif italic bg-amber-950/10 border border-amber-800/25 rounded-xl p-2.5 text-amber-950">
              Kanggo pangéling-éling lelampahan kasebut, grojogan ing Gunung Wilis Nganjuk iku diarani <strong>Grojogan Rara Kuning</strong>.
            </p>
          </div>

          {/* Tombol Utama: Lanjut menyang Level 3 (Nulis Crita) */}
          <button
            type="button"
            onClick={goLevel3}
            className="w-full py-2.5 sm:py-3.5 px-4 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 border-2 border-yellow-100 text-stone-950 font-serif font-black text-xs sm:text-sm md:text-base shadow-[0_0_25px_rgba(250,204,21,0.6)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
          >
            <span>▶</span>
            <span>Banjur menyang Level 3</span>
          </button>
        </div>
      </div>
    </div>
  );
}
