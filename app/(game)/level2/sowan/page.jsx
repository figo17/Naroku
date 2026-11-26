'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';

export default function Level2SowanResiPage() {
  const router = useRouter();
  const supabase = createClient();
  const navLockRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [showDialogModal, setShowDialogModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level2/mudhun');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  const goNextScene = useCallback(() => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    router.push('/level2/mudhun');
  }, [router]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showDialogModal) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        goNextScene();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNextScene, showDialogModal]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#120b05] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mlebu menyang Padhepokan Resi Darmo...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#120b05] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level2/screen_padhepokan_sowan.jpg"
          alt="Sowan Resi Darmo ing Njero Padhepokan Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Navigasi Pojok Kiri Atas */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/padhepokan"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            ⬅ Ngarep Padhepokan
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Indikator Pojok Kanan Atas */}
        <button
          type="button"
          onClick={() => setShowDialogModal(true)}
          className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-amber-400/70 text-amber-200 font-bold text-[10px] sm:text-xs shadow-lg cursor-pointer"
        >
          📜 Waca Pacelathon
        </button>

        {/* Hitbox Balon Dialog Putri Roro Kuning */}
        <div
          onClick={() => setShowDialogModal(true)}
          title="Klik kanggo maca ature Putri Roro Kuning"
          className="absolute left-[14.2%] top-[12.5%] w-[25.2%] h-[24.5%] rounded-3xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20 transition-all"
        />

        {/* Hitbox Balon Dialog Dewi Kilisuci */}
        <div
          onClick={() => setShowDialogModal(true)}
          title="Klik kanggo maca ature Dewi Kilisuci"
          className="absolute left-[61.5%] top-[14.5%] w-[26.8%] h-[22.5%] rounded-3xl bg-transparent hover:bg-emerald-400/10 cursor-pointer z-20 transition-all"
        />

        {/* Hitbox Kotak Dialog Resi Darmo (Klik langsung lanjut / baca) */}
        <div
          onClick={goNextScene}
          title="Klik kanggo nglajengake dhawuhe Resi Darmo"
          className="absolute left-[18.4%] top-[68.2%] w-[63.2%] h-[18.8%] rounded-2xl bg-transparent hover:ring-2 hover:ring-yellow-400/60 cursor-pointer z-25 transition-all"
        />

        {/* Tombol Banjur menyang Lv 2 - Mudhun (Tantangan Gegodhongan Jamu) */}
        <button
          type="button"
          onClick={goNextScene}
          className="absolute right-[19.2%] bottom-[14.2%] z-35 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 border border-yellow-200 text-stone-950 font-black text-[11px] sm:text-xs shadow-[0_0_20px_rgba(250,204,21,0.6)] active:scale-95 transition-all cursor-pointer animate-pulse flex items-center gap-1.5"
        >
          <span>Banjur</span>
          <span>▶</span>
        </button>

        {/* Kontroler Analog 360° */}
        <AnalogJoystick
          onChange={({ x, active }) => {
            if (!active) return;
            if (x > 0.72) goNextScene();
            else if (x < -0.72 && !navLockRef.current) {
              navLockRef.current = true;
              router.push('/level2/padhepokan');
            }
          }}
        />
      </div>

      {/* Modal Transkrip Pacelathon Sowan Resi Darmo */}
      {showDialogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/85 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-lg sm:text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>🏯</span> Sowan Resi Darmo ing Padhepokan
            </h3>

            <div className="space-y-3 text-xs sm:text-sm font-serif leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-950/45 border border-yellow-500/40 text-amber-100">
                <p className="font-bold text-yellow-300 mb-0.5">Putri Roro Kuning:</p>
                <p>
                  &ldquo;Resi, kula nyuwun tulung. Kula lan adhi kula dereng pikantuk tamba saking lelara iki. Kula kepingin sehat supados saged bali menyang kraton.&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/45 border border-emerald-500/40 text-emerald-100">
                <p className="font-bold text-emerald-300 mb-0.5">Dewi Kilisuci (Rara Runting):</p>
                <p>
                  &ldquo;Inggih resi. Lelara ingkang dipunsandhang kula kaliyan mbakyu menika sampun dangu. Kraos benter, gondhok, ugi lelara kuning.&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-400/50 text-stone-200">
                <p className="font-bold text-amber-300 mb-0.5">Resi Darmo:</p>
                <p>
                  &ldquo;Putri Rara Kuning lan Putri Rara Runting. Adhedhasar ilmu sing tak duweni aku bisa ngewenehi tamba saka lelaramu. Nanging kudu sabar lan tetep singgah ing padhepokan iki kanggo ngresiki awak lan batin.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setShowDialogModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={goNextScene}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg cursor-pointer"
              >
                Banjur menyang Tantangan Jamu →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
