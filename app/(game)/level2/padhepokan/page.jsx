'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

const START_POS = { x: 70.5, y: 95.0 };
const SPEED_X = 16.5;
const SPEED_Y = 13.0;

export default function Level2PadhepokanPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const enteredRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

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

  const moveCharacter = useCallback(
    (dx, dy) => {
      if (enteredRef.current) return;

      if (dx < -0.02) setFacingLeft(true);
      else if (dx > 0.02) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 180);

      const prev = charPosRef.current;
      let nx = Math.max(22, Math.min(82, prev.x + dx));
      let ny = Math.max(53, Math.min(96, prev.y + dy));

      // Pagar pendhapa kiwa-tengen: mung liwat undhak-undhakan tengah (38..50) sing bisa munggah mlebu lawang jero
      if (ny < 68 && (nx < 38 || nx > 50)) {
        if (prev.y >= 68) ny = 68;
        else nx = nx < 38 ? 38 : 50;
      }

      const next = { x: nx, y: ny };
      charPosRef.current = next;
      setCharPos(next);

      // Munggah undhak-undhakan nganti mentok mlebu lawang jero Padhepokan (y <= 55.0)
      if (nx >= 38 && nx <= 50 && ny <= 55.0 && !enteredRef.current) {
        enteredRef.current = true;
        stopAnalog();
        setIsWalking(false);
        playVictory();
        recordLevel2Mission(supabase, 'padhepokan');
        router.push('/level2/sowan');
      }
    },
    [playVictory, router, stopAnalog, supabase]
  );

  useEffect(() => {
    const keys = new Set();
    const map = {
      ArrowUp: [0, -1],
      KeyW: [0, -1],
      ArrowDown: [0, 1],
      KeyS: [0, 1],
      ArrowLeft: [-1, 0],
      KeyA: [-1, 0],
      ArrowRight: [1, 0],
      KeyD: [1, 0],
    };
    let raf;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!enteredRef.current) {
        let ix = analogRef.current.active ? analogRef.current.x : 0;
        let iy = analogRef.current.active ? analogRef.current.y : 0;
        keys.forEach((k) => {
          ix += map[k][0];
          iy += map[k][1];
        });
        const mag = Math.hypot(ix, iy);
        if (mag > 0.06) {
          const norm = mag > 1 ? 1 / mag : 1;
          moveCharacter(ix * norm * SPEED_X * dt, iy * norm * SPEED_Y * dt);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    const down = (e) => {
      if (map[e.code]) {
        e.preventDefault();
        keys.add(e.code);
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
  }, [moveCharacter]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#060908] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Padhepokan Gunung Wilis...</p>
      </div>
    );
  }

  const depthScale = Math.max(0.46, Math.min(1.06, 0.46 + ((charPos.y - 53) / 42) * 0.6));

  return (
    <div className="relative w-screen h-screen bg-[#060908] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level2/screen_padhepokan_polos.jpg"
          alt="Padhepokan Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
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
          🚶‍♀️ Munggah nganti mentok lawang jero Padhepokan!
        </div>

        {/* Indikator Tujuan Lawang Jero Padhepokan */}
        <div className="absolute left-[44.2%] top-[51%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
          <div className="px-3 py-0.5 rounded-full bg-amber-950/95 border border-yellow-400 text-yellow-200 text-[9px] sm:text-[10px] font-bold shadow-lg animate-bounce whitespace-nowrap">
            🏯 Mlebu Padhepokan
          </div>
          <div className="w-16 h-7 rounded-full border-2 border-dashed border-yellow-300/80 bg-amber-400/15 animate-pulse" />
        </div>

        {/* Sprite Pixel Art Rara Runting & Rara Kuning */}
        <div
          className="absolute z-[25] pointer-events-none"
          style={{
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            transform: `translate(-50%, -100%) scale(${depthScale})`,
            transformOrigin: 'bottom center',
          }}
        >
          <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft} />
        </div>

        {/* Kontroler Analog 360° */}
        <AnalogJoystick
          onChange={(v) => {
            analogRef.current = v;
          }}
        />
      </div>
    </div>
  );
}
