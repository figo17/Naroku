'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2KaliJembatanPage() {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  // Drag & Drop Wood State
  const [isHoldingLog, setIsHoldingLog] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null); // 'log1' | 'log2' | 'log3'
  const [pointerPos, setPointerPos] = useState({ xPercent: 50, yPercent: 50 });
  const [isHoveringRiver, setIsHoveringRiver] = useState(false);

  // Bridge & Crossing States
  const [bridgeBuilt, setBridgeBuilt] = useState(false);
  const [isCrossing, setIsCrossing] = useState(false);
  const [hasCrossed, setHasCrossed] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?role=murid');
          return;
        }

        setCurrentUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) setStudentProfile(profile);
      } catch (err) {
        console.error('Error loading level 2 kali jembatan data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // Pointer position calculator relative to 2:1 container (1024 x 512)
  const updatePointer = (clientX, clientY) => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setPointerPos({ xPercent, yPercent });

    // River Crossing Drop Zone: X: 42%..72%, Y: 35%..75%
    const inRiverZone = xPercent >= 42 && xPercent <= 72 && yPercent >= 35 && yPercent <= 75;
    setIsHoveringRiver(inRiverZone);
    return inRiverZone;
  };

  // Log Pickup Handler
  const handleLogPickup = (logId, clientX, clientY) => {
    if (bridgeBuilt) return;
    setSelectedLogId(logId);
    setIsHoldingLog(true);
    updatePointer(clientX, clientY);
    setToast({
      type: 'info',
      text: '🪵 Batang kayu dicekel! Seret menyang tengah kali kanggo nggawe jembatan!',
    });
  };

  const handlePointerMove = (e) => {
    if (!isHoldingLog) return;
    updatePointer(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (!isHoldingLog || !e.touches[0]) return;
    updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handlePointerUp = () => {
    if (!isHoldingLog) return;

    if (isHoveringRiver) {
      // SUCCESS: Build the bridge!
      completeBridge();
    } else {
      // Cancel drag
      setIsHoldingLog(false);
      setIsHoveringRiver(false);
      setSelectedLogId(null);
      setToast({
        type: 'info',
        text: 'Arahake kayu menyang banyu kali sing banter supaya dadi jembatan.',
      });
    }
  };

  const completeBridge = () => {
    setIsHoldingLog(false);
    setIsHoveringRiver(false);
    setBridgeBuilt(true);
    setToast({
      type: 'success',
      text: '🪵 Krassshh! Kayu kasil dipasang dadi jembatan sing kuwat!',
    });

    // Auto-trigger crossing sequence after short delay
    setTimeout(() => {
      startCrossing();
    }, 900);
  };

  const startCrossing = () => {
    setIsCrossing(true);
    // Crossing animation duration: 3.5s
    setTimeout(() => {
      setIsCrossing(false);
      setHasCrossed(true);
    }, 3500);
  };

  const handleReset = () => {
    setBridgeBuilt(false);
    setIsCrossing(false);
    setHasCrossed(false);
    setSelectedLogId(null);
    setIsHoldingLog(false);
    setToast({
      type: 'info',
      text: 'Dolanan direset. Mangga pasang maneh jembatan kayu!',
    });
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#020705] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Lelampahan Kali Gunung Wilis...</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen bg-[#020705] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerUp}
    >
      {/* 
        CONTAINER 1024 x 512 (2:1 Aspect Ratio)
        Menjamin koordinat kayu, sungai, dan animasi karakter 100% presisi
      */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[calc(100vh*1024/512)] max-h-[calc(100vw*512/1024)] aspect-[1024/512] overflow-hidden shadow-2xl select-none"
      >
        {/* Background Artwork Kali & Lonjoran Wit */}
        <Image
          src="/assets/level2/screen_kali_jembatan.jpg"
          alt="Alas Gunung Wilis - Kali Banter & Lonjoran Wit"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            RIVER CROSSING DROP ZONE (SUNGAI TEMPAT JEMBATAN)
            X: 42%..72%, Y: 35%..75%
           ======================================================== */}
        <div
          onClick={() => {
            if (isHoldingLog) completeBridge();
          }}
          className={`absolute left-[42.0%] top-[35.0%] w-[30.0%] h-[40.0%] rounded-3xl z-20 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
            isHoveringRiver
              ? 'ring-4 ring-yellow-400 bg-yellow-400/25 shadow-[0_0_40px_rgba(250,204,21,0.85)] scale-105 animate-pulse'
              : isHoldingLog
              ? 'ring-2 ring-emerald-400/80 bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.6)] animate-pulse'
              : ''
          }`}
          title="Area Pasang Jembatan Kayu ing Kali"
        >
          {isHoldingLog && (
            <div className="px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[11px] sm:text-xs font-bold shadow-2xl animate-bounce whitespace-nowrap">
              🌊 Selehake kayu ing kéné kanggo dadi jembatan!
            </div>
          )}
        </div>

        {/* ========================================================
            JEMBATAN KAYU (MUNCUL SETELAH KAYU DITARIK KE SUNGAI)
           ======================================================== */}
        {bridgeBuilt && (
          <div
            className="absolute left-[43.5%] top-[45.0%] w-[29.0%] h-[16.0%] z-25 pointer-events-none transition-all duration-500 animate-scale-up"
            style={{
              transform: 'rotate(-10deg)',
              filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.85))',
            }}
          >
            <Image
              src="/assets/level2/item-kayu-jembatan.png"
              alt="Jembatan Kayu Menyeberangi Kali"
              fill
              priority
              sizes="320px"
              className="object-contain"
            />

            {/* Riak Air Busa Putih di Bawah Kayu */}
            <div className="absolute -bottom-2 left-4 right-4 h-3 bg-white/30 blur-sm rounded-full animate-pulse" />
          </div>
        )}

        {/* ========================================================
            ANIMASI KARAKTER MENYEBERANG JEMBATAN
           ======================================================== */}
        {(isCrossing || hasCrossed) && (
          <div
            className="absolute z-30 pointer-events-none transition-all ease-in-out"
            style={{
              // Start: Left Bank (22%), End: Right Bank (68%)
              left: isCrossing ? '52%' : hasCrossed ? '70%' : '22%',
              top: isCrossing ? '40%' : hasCrossed ? '42%' : '48%',
              transitionDuration: isCrossing ? '3.5s' : '0.5s',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.8))',
            }}
          >
            <div className="flex items-end gap-1">
              {/* Rara Runting (Hijau) */}
              <div className="relative w-12 h-28 sm:w-16 sm:h-36">
                <Image
                  src="/assets/level2/karakter-rara-runting-tengok.png"
                  alt="Putri Rara Runting Nyebrang"
                  fill
                  priority
                  sizes="80px"
                  className="object-contain"
                />
              </div>

              {/* Rara Kuning (Kuning) */}
              <div className="relative w-16 h-30 sm:w-20 sm:h-40 -ml-3">
                <Image
                  src="/assets/level2/karakter-rara-kuning-tunjuk.png"
                  alt="Putri Rara Kuning Nyebrang"
                  fill
                  priority
                  sizes="100px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Status Berjalan */}
            {isCrossing && (
              <div className="px-2 py-0.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[9px] font-bold shadow-lg animate-pulse whitespace-nowrap mt-1">
                🚶‍♀️🚶‍♀️ Mlaku nyebrang...
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            3 LOGS (LONJORAN WIT) & TOMBOL "GUNAKAKE WIT"
           ======================================================== */}
        {!bridgeBuilt && (
          <>
            {/* ---------------- LOG 1 (ATAS) ---------------- */}
            {/* Hitbox Gambar Kayu 1 */}
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                handleLogPickup('log1', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleLogPickup('log1', e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className="absolute left-[33.5%] top-[13.0%] w-[13.0%] h-[9.0%] rounded-xl z-20 cursor-grab hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15 transition-all"
              title="Kayu 1 (Pencet utawa seret)"
            />
            {/* Tombol Grafis "Gunakake wit" 1 */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleLogPickup('log1', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleLogPickup('log1', e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              title="Gunakake kayu 1"
              className="absolute left-[47.0%] top-[15.5%] w-[11.5%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] active:scale-95 transition-all cursor-pointer z-20 flex items-center justify-center"
            >
              <span className="sr-only">Gunakake wit</span>
            </button>

            {/* ---------------- LOG 2 (KANAN SEBERANG) ---------------- */}
            {/* Hitbox Gambar Kayu 2 */}
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                handleLogPickup('log2', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleLogPickup('log2', e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className="absolute left-[66.0%] top-[29.5%] w-[17.5%] h-[12.0%] rounded-xl z-20 cursor-grab hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15 transition-all"
              title="Kayu 2 (Pencet utawa seret)"
            />
            {/* Tombol Grafis "Gunakake wit" 2 */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleLogPickup('log2', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleLogPickup('log2', e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              title="Gunakake kayu 2"
              className="absolute left-[84.0%] top-[32.5%] w-[11.5%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] active:scale-95 transition-all cursor-pointer z-20 flex items-center justify-center"
            >
              <span className="sr-only">Gunakake wit</span>
            </button>

            {/* ---------------- LOG 3 (BAWAH - PALING KUWAT & DEKAT) ---------------- */}
            {/* Hitbox Gambar Kayu 3 */}
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                handleLogPickup('log3', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleLogPickup('log3', e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className="absolute left-[38.5%] top-[75.0%] w-[14.5%] h-[14.0%] rounded-xl z-20 cursor-grab hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15 transition-all animate-pulse"
              title="Kayu Kuwat 3 (Pencet utawa seret)"
            />
            {/* Tombol Grafis "Gunakake wit" 3 */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleLogPickup('log3', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleLogPickup('log3', e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              title="Gunakake kayu 3"
              className="absolute left-[53.5%] top-[80.5%] w-[11.5%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.7)] active:scale-95 transition-all cursor-pointer z-20 flex items-center justify-center"
            >
              <span className="sr-only">Gunakake wit</span>
            </button>
          </>
        )}

        {/* ========================================================
            FLOATING WOOD (MENGIKUTI KURSOR / TOUCH POINT)
           ======================================================== */}
        {isHoldingLog && (
          <div
            style={{
              position: 'absolute',
              left: `${pointerPos.xPercent}%`,
              top: `${pointerPos.yPercent}%`,
              transform: 'translate(-50%, -50%) rotate(-10deg)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
            className="flex flex-col items-center select-none"
          >
            {/* Batang Kayu Melayang */}
            <div className="relative w-36 h-20 sm:w-48 sm:h-28 drop-shadow-[0_20px_30px_rgba(0,0,0,0.95)] filter brightness-110">
              <Image
                src="/assets/level2/item-kayu-jembatan.png"
                alt="Lonjoran Kayu Dicekel"
                fill
                priority
                sizes="200px"
                className="object-contain"
              />
            </div>

            {/* Label Melayang */}
            <div className="px-3 py-0.5 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-[10px] font-bold shadow-2xl tracking-wide whitespace-nowrap mt-0.5">
              ✨ Selehake ing Kali
            </div>
          </div>
        )}

        {/* ========================================================
            D-PAD DI KIRI BAWAH
           ======================================================== */}
        {/* Tombol Kiri (⬅) -> Kembali ke Lv 2 Alas */}
        <button
          type="button"
          onClick={() => router.push('/level2/alas')}
          title="Bali menyang Adegan Tebang Pohon"
          className="absolute left-[0.9%] top-[84.0%] w-[4.0%] h-[15.0%] rounded-lg bg-transparent hover:bg-yellow-400/20 active:scale-95 transition-all cursor-pointer z-20"
        >
          <span className="sr-only">Bali</span>
        </button>

        {/* ========================================================
            NAVIGASI POJOK BAWAH
           ======================================================== */}
        <div className="absolute bottom-2.5 left-4 z-30">
          <Link
            href="/level2/alas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Adegan Tebang Pohon
          </Link>
        </div>
      </div>

      {/* ========================================================
          MODAL: SELESAI MENYEBERANG KALI
         ======================================================== */}
      {hasCrossed && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg">
              🌉
            </div>
            <h3 className="text-xl font-serif font-black text-yellow-400">
              Kasil Nyebrang Kali!
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Jembatan kayu kuwat banget. Putri Rara Kuning lan Rara Runting saiki kasil nyebrang kali kanthi slamet lan bisa nerusake lelampahan menyang lereng Gunung Wilis!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold transition"
              >
                Baleni Dolanan 🔄
              </button>
              <Link
                href="/peta"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🗺️</span> Lanjut menyang Peta Petualangan →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST FEEDBACK
         ======================================================== */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-emerald-900/50'
              : 'bg-stone-900/95 border-yellow-400 text-yellow-300 shadow-yellow-900/50'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-stone-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
