'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

export default function Level2JurangTaliPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [isRopeConnected, setIsRopeConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sparkleActive, setSparkleActive] = useState(false);

  const [crossStep, setCrossStep] = useState(0); // 0..4
  const [isCrossing, setIsCrossing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    router.prefetch('/level2/gua');
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

  const playSound = useCallback((type) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      if (type === 'rope') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
      } else if (type === 'victory') {
        [523.25, 587.33, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const s = now + idx * 0.1;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, s);
          gain.gain.setValueAtTime(0.24, s);
          gain.gain.exponentialRampToValueAtTime(0.001, s + 0.4);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(s); osc.stop(s + 0.45);
        });
      }
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const handleConnectAndCross = useCallback(() => {
    if (isRopeConnected || isConnecting || doneRef.current) return;
    doneRef.current = true;
    setIsConnecting(true);
    playSound('rope');
    setSparkleActive(true);
    setIsRopeConnected(true);
    setIsCrossing(true);
    recordLevel2Mission(supabase, 'jurang');

    setTimeout(() => setSparkleActive(false), 900);

    // Langsung mlaku nyebrang jembatan tali rotan -> langsung pindah ke /level2/gua!
    setCrossStep(1);
    setTimeout(() => {
      setCrossStep(2);
      setTimeout(() => {
        setCrossStep(3);
        setTimeout(() => {
          setCrossStep(4);
          playSound('victory');
          setTimeout(() => {
            router.push('/level2/gua');
          }, 550);
        }, 650);
      }, 700);
    }, 650);
  }, [isConnecting, isRopeConnected, playSound, router, supabase]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        handleConnectAndCross();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleConnectAndCross]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030c07] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Jurang Tali Rotan...</p>
      </div>
    );
  }

  const charCoords =
    crossStep === 4
      ? { left: '87%', top: '66%' }
      : crossStep === 3
      ? { left: '72%', top: '69%' }
      : crossStep === 2
      ? { left: '53%', top: '74%' }
      : crossStep === 1
      ? { left: '34%', top: '70%' }
      : { left: '20%', top: '76%' };

  return (
    <div className="relative w-screen h-screen bg-[#030c07] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        {/* Kedua background bersih tanpa karakter cewek bawaan */}
        <Image
          src="/assets/level2/screen_jurang_tali_putus_clean.jpg"
          alt="Jurang Tali Putus"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-300 ${
            isRopeConnected ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
        <Image
          src="/assets/level2/screen_jurang_tali_sambung.jpg"
          alt="Jurang Tali Sambung"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-300 ${
            isRopeConnected ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 px-4 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/80 shadow-xl text-xs font-bold text-yellow-300 whitespace-nowrap">
          {isRopeConnected ? '🪢 Nyebrang Jembatan Tali Rotan...' : '🪢 Pencet "Gunakake tali rotan" utawa geser Analog nengen!'}
        </div>

        {/* Hitbox Cagak, Tali Pedhot & Tombol Gunakake Tali Rotan */}
        {!isRopeConnected && (
          <>
            <div
              onClick={handleConnectAndCross}
              className="absolute left-[29.5%] top-[36.0%] w-[38.5%] h-[27.0%] rounded-2xl z-25 cursor-pointer hover:bg-yellow-400/10"
            />
            <button
              type="button"
              onClick={handleConnectAndCross}
              title="Gunakake tali rotan"
              className="absolute left-[36.8%] top-[36.4%] w-[17.5%] h-[8.5%] rounded-full bg-transparent border-2 border-yellow-300/60 hover:border-yellow-300 hover:bg-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.5)] active:scale-95 transition-all cursor-pointer z-30 animate-pulse"
            >
              <span className="sr-only">Gunakake tali rotan</span>
            </button>
          </>
        )}

        {sparkleActive && (
          <div className="absolute left-[62.0%] top-[52.0%] -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-xs font-bold shadow-2xl animate-bounce">
              🪢 Tali Rotan Kasil Disambung!
            </div>
          </div>
        )}

        {/* SPRITE 2D PIXEL ART LANGSUNG NYAMBUNG DARI AWAL */}
        <div
          className="absolute z-30 pointer-events-none transition-all ease-linear"
          style={{
            left: charCoords.left,
            top: charCoords.top,
            transform: 'translate(-50%, -100%)',
            transitionDuration: isCrossing ? '0.62s' : '0.2s',
          }}
        >
          <PixelRoroPair
            isWalking={isCrossing}
            order="kuning-first"
            heightCss="clamp(74px, 21vh, 146px)"
          />
        </div>

        <AnalogJoystick
          onChange={({ x, active }) => {
            if (!active) return;
            if (x > 0.6) handleConnectAndCross();
            else if (x < -0.75 && !isRopeConnected) router.push('/level2/kali');
          }}
        />

        <div className="absolute top-3 left-3 z-35 flex gap-2">
          <Link
            href="/level2/kali"
            className="px-3 py-1 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Kali
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
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
