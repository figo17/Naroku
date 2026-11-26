'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

/*
  STAGE FLOW (/level2/padhepokan - sawise /level2/gladhen):
  'intro' -> screen_padhepokan_komplit.jpg (awalan lengkap: karakter Rara Runting & Rara Kuning + dialog)
  'walk'  -> screen_padhepokan_polos.jpg (no character), diganti sprite pixel art + kontroler Analog 360°
             maju menyang undhak-undhakan pendopo Padhepokan ing tengah alas.
  Begitu tekan undhak-undhakan Padhepokan -> langsung pindah scene menyang /level2/sowan -> /level2/mudhun.
*/

const START_POS = { x: 70.5, y: 95.0 };

export default function Level2PadhepokanPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const enteredRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('intro'); // 'intro' | 'walk' | 'entering'
  const stageRef = useRef('intro');

  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [toast, setToast] = useState(null);

  const goStage = useCallback((s) => {
    stageRef.current = s;
    setStage(s);
  }, []);

  useEffect(() => {
    router.prefetch('/level2/sowan');
    router.prefetch('/level2/mudhun');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const playVictory = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.13;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.24, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.6);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const stopAnalog = useCallback(() => {
    analogRef.current = { x: 0, y: 0, active: false };
  }, []);

  const startWalk = useCallback(() => {
    if (stageRef.current !== 'intro') return;
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    setFacingLeft(true);
    goStage('walk');
    setToast({
      type: 'info',
      text: '🏯 Arahake putri nganggo Analog utawa tombol Panah mlebu menyang Padhepokan!',
    });
  }, [goStage]);

  const moveCharacter = useCallback(
    (dx, dy) => {
      if (stageRef.current !== 'walk') return;

      if (dx < -0.05) setFacingLeft(true);
      else if (dx > 0.05) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

      const prev = charPosRef.current;
      const nx = Math.max(24, Math.min(82, prev.x + dx));
      const ny = Math.max(60, Math.min(96, prev.y + dy));
      const next = { x: nx, y: ny };
      charPosRef.current = next;
      setCharPos(next);

      // Sampai di undhak-undhakan / pintu tengah Padhepokan (x: 36..52, y: 60..72) -> langsung pindah scene!
      if (nx >= 36 && nx <= 52 && ny >= 60 && ny <= 72 && !enteredRef.current) {
        enteredRef.current = true;
        stopAnalog();
        setIsWalking(false);
        playVictory();
        goStage('entering');
        recordLevel2Mission(supabase, 'padhepokan');
        router.push('/level2/sowan');
      }
    },
    [goStage, playVictory, router, stopAnalog, supabase]
  );

  useEffect(() => {
    const keys = new Set();
    const map = {
      ArrowUp: [0, -1], KeyW: [0, -1],
      ArrowDown: [0, 1], KeyS: [0, 1],
      ArrowLeft: [-1, 0], KeyA: [-1, 0],
      ArrowRight: [1, 0], KeyD: [1, 0],
    };
    let raf;
    const loop = () => {
      if (stageRef.current === 'walk') {
        let dx = analogRef.current.active ? analogRef.current.x * 0.65 : 0;
        let dy = analogRef.current.active ? analogRef.current.y * 0.65 : 0;
        keys.forEach((k) => {
          dx += map[k][0] * 0.6;
          dy += map[k][1] * 0.6;
        });
        if (Math.hypot(dx, dy) > 0.04) moveCharacter(dx, dy);
      }
      raf = requestAnimationFrame(loop);
    };
    const down = (e) => {
      if (map[e.code]) {
        e.preventDefault();
        if (stageRef.current === 'intro') {
          startWalk();
          return;
        }
        keys.add(e.code);
      } else if ((e.code === 'Space' || e.code === 'Enter') && stageRef.current === 'intro') {
        e.preventDefault();
        startWalk();
      }
    };
    const up = (e) => keys.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      cancelAnimationFrame(raf);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [moveCharacter, startWalk]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#060908] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Padhepokan Gunung Wilis...</p>
      </div>
    );
  }

  // Skala perspektif halus saat maju mendekati tangga pendopo padhepokan
  const depthScale = Math.max(0.64, Math.min(1.06, 0.64 + ((charPos.y - 60) / 36) * 0.42));

  return (
    <div className="relative w-screen h-screen bg-[#060908] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Dual Background: Awalan Lengkap vs Polos Tanpa Karakter */}
        <Image
          src="/assets/level2/screen_padhepokan_komplit.jpg"
          alt="Padhepokan Gunung Wilis - Dialog Rara Runting lan Rara Kuning"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-300 ${
            stage === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        <Image
          src="/assets/level2/screen_padhepokan_polos.jpg"
          alt="Padhepokan Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-300 ${
            stage !== 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Navigasi Pojok Kiri Atas */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/gladhen"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Gladhen Nulis
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Status Pojok Kanan Atas */}
        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 text-amber-300 font-bold text-[10px] sm:text-xs shadow-lg">
          {stage === 'intro' && '🏯 Gerakake Analog / Pencet "Maju menyang Padhepokan"'}
          {stage === 'walk' && '🚶‍♀️ Maju menyang Undhak-undhakan Padhepokan!'}
          {stage === 'entering' && '🏯 Mlebu menyang Padhepokan...'}
        </div>

        {/* Tombol Mulai Maju pada Scene Intro */}
        {stage === 'intro' && (
          <button
            type="button"
            onClick={startWalk}
            className="absolute left-[44%] bottom-[6%] -translate-x-1/2 z-35 px-5 py-2.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border-2 border-yellow-400 text-yellow-200 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(250,204,21,0.55)] active:scale-95 transition-all cursor-pointer animate-bounce"
          >
            🏯 Maju menyang Padhepokan
          </button>
        )}

        {/* Indikator Tujuan Tangga Padhepokan */}
        {stage === 'walk' && (
          <div className="absolute left-[44.2%] top-[59%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
            <div className="px-3 py-0.5 rounded-full bg-amber-950/95 border border-yellow-400 text-yellow-200 text-[9px] sm:text-[11px] font-bold shadow-lg animate-bounce whitespace-nowrap">
              🏯 Mlebu Padhepokan
            </div>
            <div className="w-20 h-9 rounded-full border-2 border-dashed border-yellow-300/80 bg-amber-400/15 animate-pulse" />
          </div>
        )}

        {/* Sprite Pixel Art Rara Runting & Rara Kuning (saat walk & done) */}
        {stage !== 'intro' && (
          <div
            className="absolute z-25 pointer-events-none"
            style={{
              left: `${charPos.x}%`,
              top: `${charPos.y}%`,
              transform: `translate(-50%, -100%) scale(${depthScale})`,
              transformOrigin: 'bottom center',
            }}
          >
            <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft} />
          </div>
        )}

        {/* Kontroler Analog 360° */}
        {stage !== 'entering' && (
          <AnalogJoystick
            onStart={() => {
              if (stageRef.current === 'intro') startWalk();
            }}
            onChange={(v) => {
              analogRef.current = v;
            }}
          />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border bg-stone-900/95 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-bold shadow-2xl">
          {toast.text}
        </div>
      )}
    </div>
  );
}
