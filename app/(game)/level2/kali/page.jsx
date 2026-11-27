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
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [isHoldingLog, setIsHoldingLog] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [pointerPos, setPointerPos] = useState({ xPercent: 50, yPercent: 50 });
  const [isHoveringRiver, setIsHoveringRiver] = useState(false);

  const [placedLogs, setPlacedLogs] = useState([]);
  const [bridgeBuilt, setBridgeBuilt] = useState(false);
  const [crossStep, setCrossStep] = useState(0); // 0: bank kiri (21%), 1: tengah jembatan (50%), 2: seberang (74%)
  const [isCrossing, setIsCrossing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    router.prefetch('/level2/jurang');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const updatePointer = (clientX, clientY) => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    const yPercent = ((clientY - rect.top) / rect.height) * 100;
    setPointerPos({ xPercent, yPercent });

    const inRiverZone = xPercent >= 40 && xPercent <= 74 && yPercent >= 33 && yPercent <= 77;
    setIsHoveringRiver(inRiverZone);
    return inRiverZone;
  };

  const handleLogPickup = (logId, clientX, clientY) => {
    if (placedLogs.includes(logId) || bridgeBuilt) return;
    setSelectedLogId(logId);
    setIsHoldingLog(true);
    updatePointer(clientX, clientY);
  };

  const handlePointerMove = (e) => {
    if (isHoldingLog) updatePointer(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (isHoldingLog && e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  };

  const placeLogOnBridge = (logId) => {
    if (placedLogs.includes(logId) || doneRef.current) return;

    const nextPlaced = [...placedLogs, logId];
    setPlacedLogs(nextPlaced);
    setIsHoldingLog(false);
    setIsHoveringRiver(false);
    setSelectedLogId(null);

    if (nextPlaced.length < 3) {
      setToast({
        type: 'success',
        text: `🪵 Kayu ${nextPlaced.length}/3 terpasang! Susun ${3 - nextPlaced.length} kayu maneh!`,
      });
    } else {
      doneRef.current = true;
      setBridgeBuilt(true);
      setIsCrossing(true);
      setCrossStep(1);
      recordLevel2Mission(supabase, 'kali');

      setTimeout(() => {
        setCrossStep(2);
        setTimeout(() => {
          router.push('/level2/jurang');
        }, 900);
      }, 950);
    }
  };

  const handlePointerUp = () => {
    if (!isHoldingLog) return;
    if (isHoveringRiver && selectedLogId) {
      placeLogOnBridge(selectedLogId);
    } else {
      setIsHoldingLog(false);
      setIsHoveringRiver(false);
      setSelectedLogId(null);
      setToast({ type: 'info', text: 'Seret batang kayu menyang banyu kali supaya dadi jembatan!' });
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#020705] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Kali Gunung Wilis...</p>
      </div>
    );
  }

  const charCoords =
    crossStep === 2
      ? { left: '74%', top: '62%' }
      : crossStep === 1
      ? { left: '53%', top: '57%' }
      : { left: '22%', top: '63%' };

  return (
    <div
      className="relative w-screen h-screen bg-[#020705] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerUp}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[calc(100vh*1024/512)] max-h-[calc(100vw*512/1024)] aspect-[1024/512] overflow-hidden shadow-2xl select-none"
      >
        {/* Latar Bersih Tanpa Karakter Cewek Bawaan (Sprite 2D Pixel Art Langsung Nyambung) */}
        <Image
          src="/assets/level2/screen_kali_jembatan_clean.jpg"
          alt="Alas Gunung Wilis - Kali Banter"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Status Badge Susunan Kayu */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/80 shadow-2xl">
          <span className="text-yellow-400 font-bold text-xs sm:text-sm">🪵 Jembatan Kayu:</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  placedLogs.length >= step
                    ? 'bg-yellow-400 text-stone-950 scale-110'
                    : 'bg-stone-800 text-stone-400 border border-stone-600'
                }`}
              >
                {placedLogs.length >= step ? '✓' : step}
              </span>
            ))}
          </div>
        </div>

        {/* River Crossing Drop Zone */}
        <div
          onClick={() => {
            if (isHoldingLog && selectedLogId) placeLogOnBridge(selectedLogId);
          }}
          className={`absolute left-[40.0%] top-[33.0%] w-[34.0%] h-[44.0%] rounded-3xl z-20 cursor-pointer transition-all flex flex-col items-center justify-center ${
            isHoveringRiver
              ? 'ring-4 ring-yellow-400 bg-yellow-400/25 scale-105'
              : isHoldingLog
              ? 'ring-2 ring-emerald-400/80 bg-cyan-500/20 animate-pulse'
              : ''
          }`}
        >
          {isHoldingLog && (
            <div className="px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[11px] sm:text-xs font-bold shadow-2xl animate-bounce whitespace-nowrap">
              🌊 Selehake kayu {placedLogs.length + 1} ing kéné!
            </div>
          )}
        </div>

        {/* Jembatan 3 Kayu */}
        {placedLogs.length > 0 && (
          <div className="absolute left-[42.5%] top-[39.0%] w-[31.0%] h-[26.0%] z-25 pointer-events-none">
            {placedLogs.length >= 1 && (
              <div
                className="absolute left-[0%] top-[0%] w-[94%] h-[60%]"
                style={{ transform: 'rotate(-11deg)', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.85))' }}
              >
                <Image src="/assets/level2/item-kayu-jembatan.png" alt="Kayu 1" fill priority sizes="300px" className="object-contain" />
              </div>
            )}
            {placedLogs.length >= 2 && (
              <div
                className="absolute left-[2%] top-[20%] w-[96%] h-[62%]"
                style={{ transform: 'rotate(-10deg)', filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.85))' }}
              >
                <Image src="/assets/level2/item-kayu-jembatan.png" alt="Kayu 2" fill priority sizes="300px" className="object-contain" />
              </div>
            )}
            {placedLogs.length >= 3 && (
              <div
                className="absolute left-[4%] top-[40%] w-[98%] h-[64%]"
                style={{ transform: 'rotate(-9deg)', filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.9))' }}
              >
                <Image src="/assets/level2/item-kayu-jembatan.png" alt="Kayu 3" fill priority sizes="320px" className="object-contain" />
              </div>
            )}
          </div>
        )}

        {/* SPRITE 2D PIXEL ART AKTIF SEJAK AWAL SCENE */}
        <div
          className="absolute z-30 pointer-events-none transition-all ease-linear"
          style={{
            left: charCoords.left,
            top: charCoords.top,
            transform: 'translate(-50%, -100%)',
            transitionDuration: isCrossing ? '0.9s' : '0.2s',
          }}
        >
          <PixelRoroPair isWalking={isCrossing} heightCss="clamp(68px, 19vh, 134px)" />
        </div>

        {/* 3 Logs & Buttons */}
        {[
          { id: 'log1', box: 'left-[33.5%] top-[13.0%] w-[13.0%] h-[9.0%]', btn: 'left-[47.0%] top-[15.5%] w-[11.5%] h-[6.8%]' },
          { id: 'log2', box: 'left-[66.0%] top-[29.5%] w-[17.5%] h-[12.0%]', btn: 'left-[84.0%] top-[32.5%] w-[11.5%] h-[6.8%]' },
          { id: 'log3', box: 'left-[38.5%] top-[75.0%] w-[14.5%] h-[14.0%]', btn: 'left-[53.5%] top-[80.5%] w-[11.5%] h-[6.8%]' },
        ].map((lg) => {
          const used = placedLogs.includes(lg.id);
          return (
            <React.Fragment key={lg.id}>
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleLogPickup(lg.id, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleLogPickup(lg.id, e.touches[0].clientX, e.touches[0].clientY);
                }}
                className={`absolute ${lg.box} rounded-xl z-20 cursor-grab transition-all ${
                  used ? 'opacity-25 pointer-events-none' : 'hover:ring-2 hover:ring-yellow-400/80 hover:bg-yellow-400/15'
                }`}
              />
              <button
                type="button"
                disabled={used || bridgeBuilt}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleLogPickup(lg.id, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleLogPickup(lg.id, e.touches[0].clientX, e.touches[0].clientY);
                }}
                className={`absolute ${lg.btn} rounded-full bg-transparent transition-all z-20 flex items-center justify-center ${
                  used ? 'opacity-25 pointer-events-none' : 'hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 cursor-pointer'
                }`}
              >
                {used && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}

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
            <div className="relative w-36 h-20 sm:w-48 sm:h-28 drop-shadow-[0_20px_30px_rgba(0,0,0,0.95)]">
              <Image src="/assets/level2/item-kayu-jembatan.png" alt="Kayu" fill priority sizes="200px" className="object-contain" />
            </div>
          </div>
        )}

        <AnalogJoystick
          onChange={({ x, active }) => {
            if (active && x < -0.8 && !bridgeBuilt && placedLogs.length === 0) {
              router.push('/level2/alas');
            }
          }}
        />

        <div className="absolute top-3 left-4 z-35">
          <Link
            href="/level2/alas"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Tebang Wit
          </Link>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2 rounded-2xl border bg-stone-900/95 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-bold shadow-2xl">
          {toast.text}
        </div>
      )}
    </div>
  );
}
