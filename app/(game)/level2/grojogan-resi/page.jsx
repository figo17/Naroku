'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';

export default function Level2GrojoganResiPage() {
  const router = useRouter();
  const supabase = createClient();
  const navLockRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [showDialogModal, setShowDialogModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level2/pungkasan');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  const goPungkasan = useCallback(() => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    router.push('/level2/pungkasan');
  }, [router]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showDialogModal) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        goPungkasan();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPungkasan, showDialogModal]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#061712] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Rawuhe Resi Darmo ing Grojogan...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#061712] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        <Image
          src="/assets/level2/screen_grojogan_resi.jpg"
          alt="Rawuhe Resi Darmo ing Grojogan Suci Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Navigasi Pojok Kiwa Ndhuwur */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/grojogan"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            ⬅ Adus ing Air Terjun
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Tombol Waca Pacelathon Pojok Tengen Ndhuwur */}
        <button
          type="button"
          onClick={() => setShowDialogModal(true)}
          className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-amber-400/70 text-amber-200 font-bold text-[10px] sm:text-xs shadow-lg cursor-pointer"
        >
          📜 Waca Pacelathon
        </button>

        {/* Hitbox 3 Balon Pacelathon */}
        <div
          onClick={() => setShowDialogModal(true)}
          title="Klik kanggo maca ature Putri Roro Kuning"
          className="absolute left-[7.5%] top-[14.5%] w-[28.0%] h-[28.0%] rounded-3xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20 transition-all"
        />
        <div
          onClick={() => setShowDialogModal(true)}
          title="Klik kanggo maca ature Dewi Kilisuci"
          className="absolute left-[38.5%] top-[21.5%] w-[19.8%] h-[21.5%] rounded-3xl bg-transparent hover:bg-emerald-400/10 cursor-pointer z-20 transition-all"
        />
        <div
          onClick={() => setShowDialogModal(true)}
          title="Klik kanggo maca dhawuhe Resi Darmo"
          className="absolute left-[63.0%] top-[15.0%] w-[31.8%] h-[28.0%] rounded-3xl bg-transparent hover:bg-amber-400/10 cursor-pointer z-20 transition-all"
        />

        {/* Kontroler Analog 360° */}
        <AnalogJoystick
          className="absolute left-[1.2%] bottom-[2.5%] w-[11.5%] h-[18.0%] min-w-[68px] min-h-[68px] z-35"
          onChange={({ x, active }) => {
            if (!active) return;
            if (x > 0.72) goPungkasan();
            else if (x < -0.72 && !navLockRef.current) {
              navLockRef.current = true;
              router.push('/level2/grojogan');
            }
          }}
        />

        {/* Tombol Banjur menyang Adegan (46) Lv 2 - Pungkasan */}
        <button
          type="button"
          onClick={goPungkasan}
          className="absolute right-5 bottom-4 z-40 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 border-2 border-yellow-200 text-stone-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(250,204,21,0.65)] active:scale-95 transition-all cursor-pointer animate-pulse flex items-center gap-2"
        >
          <span>Banjur</span>
          <span>▶</span>
        </button>
      </div>

      {/* Modal Pacelathon ing Grojogan */}
      {showDialogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/85 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-lg sm:text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>🌊</span> Pacelathon ing Grojogan Suci
            </h3>
            <div className="space-y-3 text-xs sm:text-sm font-serif leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-950/45 border border-yellow-500/40 text-amber-100">
                <p className="font-bold text-yellow-300 mb-0.5">Putri Roro Kuning:</p>
                <p>
                  &ldquo;Resi, panjenengan rawuh. Menika kula kaliyan Adhi menika kerep adus dhateng grojogan iki. Toyane inggih menika adhem lan sae kagem ngedem pikiran.&rdquo;
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/45 border border-emerald-500/40 text-emerald-100">
                <p className="font-bold text-emerald-300 mb-0.5">Dewi Kilisuci:</p>
                <p>&ldquo;Inggih resi, toya menika dados palipur amarah kula.&rdquo;</p>
              </div>
              <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-400/50 text-stone-200">
                <p className="font-bold text-amber-300 mb-0.5">Resi Darmo:</p>
                <p>
                  &ldquo;Putri Rara Kuning lan Putri Rara Runting, iki panggonan sing suci, ing kene banyune bisa maringi kasarasan tumrap maneka werna lelara. Ugi isa gawe ngresiki awak lan bisa gawe tentrem ing batin.&rdquo;
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setShowDialogModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={goPungkasan}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black text-xs shadow-lg cursor-pointer"
              >
                Banjur menyang Pungkasan →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
