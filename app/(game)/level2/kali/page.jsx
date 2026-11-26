'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

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

  // 3 Logs Stacking State
  const [placedLogs, setPlacedLogs] = useState([]); // ['log1', 'log2', 'log3']
  const [bridgeBuilt, setBridgeBuilt] = useState(false);
  const [crossStep, setCrossStep] = useState(0); // 0: bank kiri (17%), 1: tengah jembatan (48%), 2: seberang (70%)
  const [isCrossing, setIsCrossing] = useState(false);
  const [hasCrossed, setHasCrossed] = useState(false);
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

    // River Crossing Drop Zone: X: 40%..74%, Y: 33%..77%
    const inRiverZone = xPercent >= 40 && xPercent <= 74 && yPercent >= 33 && yPercent <= 77;
    setIsHoveringRiver(inRiverZone);
    return inRiverZone;
  };

  // Log Pickup Handler
  const handleLogPickup = (logId, clientX, clientY) => {
    if (placedLogs.includes(logId) || bridgeBuilt) return;
    setSelectedLogId(logId);
    setIsHoldingLog(true);
    updatePointer(clientX, clientY);
    setToast({
      type: 'info',
      text: `🪵 Batang kayu dicekel! Seret menyang kali kanggo nyusun jembatan (${placedLogs.length + 1}/3)!`,
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

    if (isHoveringRiver && selectedLogId) {
      placeLogOnBridge(selectedLogId);
    } else {
      setIsHoldingLog(false);
      setIsHoveringRiver(false);
      setSelectedLogId(null);
      setToast({
        type: 'info',
        text: 'Arahake kayu menyang banyu kali sing banter supaya dadi jembatan.',
      });
    }
  };

  // Tempatkan kayu ke susunan jembatan
  const placeLogOnBridge = (logId) => {
    if (placedLogs.includes(logId)) return;

    const nextPlaced = [...placedLogs, logId];
    setPlacedLogs(nextPlaced);
    setIsHoldingLog(false);
    setIsHoveringRiver(false);
    setSelectedLogId(null);

    if (nextPlaced.length === 1) {
      setToast({
        type: 'success',
        text: '🪵 Kayu kapisan kasil dipasang! (1/3) Pasang 2 kayu maneh supaya kuwat!',
      });
    } else if (nextPlaced.length === 2) {
      setToast({
        type: 'success',
        text: '🪵 Kayu kapindho kasil disusun! (2/3) Kurang 1 kayu maneh kanggo nyebrang!',
      });
    } else if (nextPlaced.length >= 3) {
      // 3 KAYU LENGKAP TERSUSUN!
      setBridgeBuilt(true);
      setCrossStep(0);
      setToast({
        type: 'success',
        text: '🎉 Krassshh! 3 kayu wis jangkep disusun dadi jembatan sing kuwat! (3/3)',
      });

      // Mulai animasi berjalan menyeberang
      setTimeout(() => {
        setIsCrossing(true);
        setCrossStep(1); // Melangkah ke tengah jembatan (2.6s)

        setTimeout(() => {
          setCrossStep(2); // Melangkah ke tepi kanan seberang (2.2s)

          setTimeout(() => {
            setIsCrossing(false);
            setHasCrossed(true);
            recordLevel2Mission(supabase, 'kali');
          }, 2400);
        }, 2800);
      }, 700);
    }
  };

  const handleReset = () => {
    setPlacedLogs([]);
    setBridgeBuilt(false);
    setCrossStep(0);
    setIsCrossing(false);
    setHasCrossed(false);
    setSelectedLogId(null);
    setIsHoldingLog(false);
    setToast({
      type: 'info',
      text: 'Dolanan direset. Mangga susun maneh 3 batang kayu ing kali!',
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

  // Koordinat karakter menyeberang
  const getCharacterCoords = () => {
    if (crossStep === 2) {
      return { left: '70%', top: '42%' }; // Seberang kanan
    }
    if (crossStep === 1) {
      return { left: '48%', top: '37%' }; // Tengah jembatan 3 kayu
    }
    return { left: '17%', top: '43%' }; // Tepi kiri awal
  };

  const charCoords = getCharacterCoords();

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
        {/* ========================================================
            DUAL BACKGROUND SWITCHER (AGAR TIDAK DOUBLE KARAKTER)
           ======================================================== */}
        
        {/* Latar Belakang 1: Awal dengan dialog & karakter di tepi kiri */}
        <Image
          src="/assets/level2/screen_kali_jembatan.jpg"
          alt="Alas Gunung Wilis - Kali Banter & Dialog"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-500 ${
            bridgeBuilt ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Latar Belakang 2: Bersih (tanpa karakter cewek di kiri), dipakai pas cewek maju ke sungai */}
        <Image
          src="/assets/level2/screen_kali_jembatan_clean.jpg"
          alt="Alas Gunung Wilis - Kali Banter (Clean Tanpa Double)"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-500 ${
            bridgeBuilt ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* ========================================================
            STATUS BADGE SUSUNAN KAYU (POJOK ATAS TENGAH)
           ======================================================== */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/80 shadow-2xl backdrop-blur-md">
          <span className="text-yellow-400 font-bold text-xs sm:text-sm">
            🪵 Susunan Kayu Jembatan:
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  placedLogs.length >= step
                    ? 'bg-yellow-400 text-stone-950 shadow-[0_0_10px_rgba(250,204,21,0.8)] scale-110'
                    : 'bg-stone-800 text-stone-400 border border-stone-600'
                }`}
              >
                {placedLogs.length >= step ? '✓' : step}
              </span>
            ))}
          </div>
          <span className="text-xs text-amber-200 font-serif ml-1">
            ({placedLogs.length}/3 kayu)
          </span>
        </div>

        {/* ========================================================
            RIVER CROSSING DROP ZONE (SUNGAI TEMPAT JEMBATAN)
            X: 40%..74%, Y: 33%..77%
           ======================================================== */}
        <div
          onClick={() => {
            if (isHoldingLog && selectedLogId) placeLogOnBridge(selectedLogId);
          }}
          className={`absolute left-[40.0%] top-[33.0%] w-[34.0%] h-[44.0%] rounded-3xl z-20 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
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
              🌊 Selehake kayu {placedLogs.length + 1} ing kéné!
            </div>
          )}
        </div>

        {/* ========================================================
            JEMBATAN KAYU (DISUSUN 3 BATANG KAYU MELINTANG DI KALI)
           ======================================================== */}
        {placedLogs.length > 0 && (
          <div className="absolute left-[42.5%] top-[39.0%] w-[31.0%] h-[26.0%] z-25 pointer-events-none">
            {/* Kayu 1 (Susunan Atas) */}
            {placedLogs.length >= 1 && (
              <div
                className="absolute left-[0%] top-[0%] w-[94%] h-[60%] transition-all duration-500 animate-scale-up"
                style={{
                  transform: 'rotate(-11deg)',
                  filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.85))',
                }}
              >
                <Image
                  src="/assets/level2/item-kayu-jembatan.png"
                  alt="Batang Kayu 1 (Atas)"
                  fill
                  priority
                  sizes="300px"
                  className="object-contain"
                />
              </div>
            )}

            {/* Kayu 2 (Susunan Tengah) */}
            {placedLogs.length >= 2 && (
              <div
                className="absolute left-[2%] top-[20%] w-[96%] h-[62%] transition-all duration-500 animate-scale-up"
                style={{
                  transform: 'rotate(-10deg)',
                  filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.85))',
                }}
              >
                <Image
                  src="/assets/level2/item-kayu-jembatan.png"
                  alt="Batang Kayu 2 (Tengah)"
                  fill
                  priority
                  sizes="300px"
                  className="object-contain"
                />
              </div>
            )}

            {/* Kayu 3 (Susunan Bawah - Penguat) */}
            {placedLogs.length >= 3 && (
              <div
                className="absolute left-[4%] top-[40%] w-[98%] h-[64%] transition-all duration-500 animate-scale-up"
                style={{
                  transform: 'rotate(-9deg)',
                  filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.9))',
                }}
              >
                <Image
                  src="/assets/level2/item-kayu-jembatan.png"
                  alt="Batang Kayu 3 (Bawah)"
                  fill
                  priority
                  sizes="320px"
                  className="object-contain"
                />
              </div>
            )}

            {/* Riak Air Busa Putih di Bawah Susunan Jembatan */}
            <div className="absolute -bottom-1 left-2 right-2 h-4 bg-white/40 blur-sm rounded-full animate-pulse" />
          </div>
        )}

        {/* ========================================================
            ANIMASI KARAKTER MENYEBERANG JEMBATAN 3 KAYU
           ======================================================== */}
        {bridgeBuilt && (
          <div
            className="absolute z-30 pointer-events-none transition-all ease-in-out"
            style={{
              left: charCoords.left,
              top: charCoords.top,
              transitionDuration: crossStep === 1 ? '2.6s' : crossStep === 2 ? '2.2s' : '0.4s',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.8))',
            }}
          >
            <PixelRoroPair isWalking={isCrossing} heightCss="clamp(68px, 19vh, 134px)" />

            {/* Status Berjalan */}
            {isCrossing && (
              <div className="px-2.5 py-0.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[10px] font-bold shadow-lg animate-pulse whitespace-nowrap mt-1 text-center">
                🚶‍♀️🚶‍♀️ Mlaku nyebrang jembatan 3 kayu...
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            3 LOGS (LONJORAN WIT) & TOMBOL "GUNAKAKE WIT"
           ======================================================== */}
        {/* ---------------- LOG 1 (ATAS) ---------------- */}
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
          className={`absolute left-[33.5%] top-[13.0%] w-[13.0%] h-[9.0%] rounded-xl z-20 cursor-grab transition-all ${
            placedLogs.includes('log1')
              ? 'opacity-30 pointer-events-none'
              : 'hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15'
          }`}
          title="Kayu 1 (Pencet utawa seret)"
        />
        <button
          type="button"
          disabled={placedLogs.includes('log1') || bridgeBuilt}
          onPointerDown={(e) => {
            e.preventDefault();
            handleLogPickup('log1', e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) {
              handleLogPickup('log1', e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          title={placedLogs.includes('log1') ? 'Kayu 1 wis dipasang' : 'Gunakake kayu 1'}
          className={`absolute left-[47.0%] top-[15.5%] w-[11.5%] h-[6.8%] rounded-full bg-transparent transition-all z-20 flex items-center justify-center ${
            placedLogs.includes('log1')
              ? 'opacity-25 pointer-events-none'
              : 'hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] active:scale-95 cursor-pointer'
          }`}
        >
          {placedLogs.includes('log1') && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-[9px] font-bold shadow">
              ✓ Terpasang
            </span>
          )}
          <span className="sr-only">Gunakake wit 1</span>
        </button>

        {/* ---------------- LOG 2 (KANAN SEBERANG) ---------------- */}
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
          className={`absolute left-[66.0%] top-[29.5%] w-[17.5%] h-[12.0%] rounded-xl z-20 cursor-grab transition-all ${
            placedLogs.includes('log2')
              ? 'opacity-30 pointer-events-none'
              : 'hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15'
          }`}
          title="Kayu 2 (Pencet utawa seret)"
        />
        <button
          type="button"
          disabled={placedLogs.includes('log2') || bridgeBuilt}
          onPointerDown={(e) => {
            e.preventDefault();
            handleLogPickup('log2', e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) {
              handleLogPickup('log2', e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          title={placedLogs.includes('log2') ? 'Kayu 2 wis dipasang' : 'Gunakake kayu 2'}
          className={`absolute left-[84.0%] top-[32.5%] w-[11.5%] h-[6.8%] rounded-full bg-transparent transition-all z-20 flex items-center justify-center ${
            placedLogs.includes('log2')
              ? 'opacity-25 pointer-events-none'
              : 'hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] active:scale-95 cursor-pointer'
          }`}
        >
          {placedLogs.includes('log2') && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-[9px] font-bold shadow">
              ✓ Terpasang
            </span>
          )}
          <span className="sr-only">Gunakake wit 2</span>
        </button>

        {/* ---------------- LOG 3 (BAWAH) ---------------- */}
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
          className={`absolute left-[38.5%] top-[75.0%] w-[14.5%] h-[14.0%] rounded-xl z-20 cursor-grab transition-all ${
            placedLogs.includes('log3')
              ? 'opacity-30 pointer-events-none'
              : 'hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15 animate-pulse'
          }`}
          title="Kayu 3 (Pencet utawa seret)"
        />
        <button
          type="button"
          disabled={placedLogs.includes('log3') || bridgeBuilt}
          onPointerDown={(e) => {
            e.preventDefault();
            handleLogPickup('log3', e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) {
              handleLogPickup('log3', e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          title={placedLogs.includes('log3') ? 'Kayu 3 wis dipasang' : 'Gunakake kayu 3'}
          className={`absolute left-[53.5%] top-[80.5%] w-[11.5%] h-[6.8%] rounded-full bg-transparent transition-all z-20 flex items-center justify-center ${
            placedLogs.includes('log3')
              ? 'opacity-25 pointer-events-none'
              : 'hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.7)] active:scale-95 cursor-pointer'
          }`}
        >
          {placedLogs.includes('log3') && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-[9px] font-bold shadow">
              ✓ Terpasang
            </span>
          )}
          <span className="sr-only">Gunakake wit 3</span>
        </button>

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
            <div className="px-3 py-0.5 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-[10px] font-bold shadow-2xl tracking-wide whitespace-nowrap mt-0.5">
              ✨ Selehake kayu {placedLogs.length + 1} ing Kali
            </div>
          </div>
        )}

        {/* KONTROLER ANALOG DI KIRI BAWAH & NAVIGASI */}
        <AnalogJoystick
          onChange={({ x, active }) => {
            if (!active) return;
            if (x < -0.8 && !bridgeBuilt && placedLogs.length === 0) {
              router.push('/level2/alas');
            }
          }}
        />

        <div className="absolute top-3 left-4 z-35">
          <Link
            href="/level2/alas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Tebang Wit
          </Link>
        </div>
      </div>

      {/* ========================================================
          MODAL: SELESAI MENYEBERANG KALI DENGAN 3 KAYU
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
              Susunan 3 batang kayu kasil dadi jembatan sing kuwat banget. Putri Rara Kuning lan Rara Runting saiki kasil nyebrang kali kanthi slamet lan bisa nerusake lelampahan menyang lereng Gunung Wilis!
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
                href="/level2/jurang"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🌉</span> Lanjut menyang Jembatan Tali Jurang →
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
