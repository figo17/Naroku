'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

const START_POS = { x: 24, y: 88 };
// Diperlambat supaya macan mlaku alon-alon nyebrang dalan alas (6.2 detik)
const WALK_MS = 6200;
const HIDE_MS = 4000;
const CYCLE_MS = (WALK_MS + HIDE_MS) * 2;
const FRAME_MS = 140; // 8-frame walk cycle alus

function getTigerState(elapsedMs) {
  const t = elapsedMs % CYCLE_MS;
  const frame = Math.floor(elapsedMs / FRAME_MS) % 8;

  if (t < WALK_MS) {
    const p = t / WALK_MS;
    return { visible: true, dir: 'right', x: -14 + p * 128, frame, remainSafeSec: 0 };
  }
  if (t < WALK_MS + HIDE_MS) {
    const rem = (WALK_MS + HIDE_MS - t) / 1000;
    return { visible: false, dir: 'left', x: 114, frame: 0, remainSafeSec: rem };
  }
  if (t < WALK_MS * 2 + HIDE_MS) {
    const p = (t - (WALK_MS + HIDE_MS)) / WALK_MS;
    return { visible: true, dir: 'left', x: 114 - p * 128, frame, remainSafeSec: 0 };
  }
  const rem = (CYCLE_MS - t) / 1000;
  return { visible: false, dir: 'right', x: -14, frame: 0, remainSafeSec: rem };
}

export default function Level2MacanPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const startTimeRef = useRef(0);
  const hitCooldownRef = useRef(0);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const [tiger, setTiger] = useState({
    visible: true,
    dir: 'right',
    x: 42,
    frame: 0,
    remainSafeSec: 0,
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    router.prefetch('/level2/pring');
    startTimeRef.current = performance.now() - Math.floor(WALK_MS * 0.42);
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
      if (type === 'roar') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const s = now + i * 0.1;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, s);
          gain.gain.setValueAtTime(0.24, s);
          gain.gain.exponentialRampToValueAtTime(0.001, s + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(s);
          osc.stop(s + 0.45);
        });
      }
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const moveCharacter = useCallback(
    (dx, dy) => {
      if (doneRef.current) return;

      if (dx < -0.05) setFacingLeft(true);
      else if (dx > 0.05) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

      const prev = charPosRef.current;
      const nx = Math.max(20, Math.min(72, prev.x + dx));
      const ny = Math.max(36, Math.min(92, prev.y + dy));
      const next = { x: nx, y: ny };
      charPosRef.current = next;
      setCharPos(next);

      if (ny <= 42 && !doneRef.current) {
        doneRef.current = true;
        analogRef.current = { x: 0, y: 0, active: false };
        setIsWalking(false);
        playSound('victory');
        recordLevel2Mission(supabase, 'macan');
        router.push('/level2/pring');
      }
    },
    [playSound, router, supabase]
  );

  useEffect(() => {
    if (loading) return;
    let raf;
    const tick = (now) => {
      if (!doneRef.current) {
        const st = getTigerState(now - startTimeRef.current);
        setTiger(st);

        const p = charPosRef.current;
        const inTigerLane = p.y >= 49 && p.y <= 66;
        const hitX = st.visible && Math.abs(st.x - p.x) < 12.5;
        if (inTigerLane && hitX && now - hitCooldownRef.current > 900) {
          hitCooldownRef.current = now;
          playSound('roar');
          charPosRef.current = START_POS;
          setCharPos(START_POS);
          setToast({
            type: 'warn',
            text: '⚠️ Ketemon Macan! Enteni macane mlaku mlebu alas dhisik!',
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loading, playSound]);

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
      if (!doneRef.current) {
        let dx = analogRef.current.active ? analogRef.current.x * 0.68 : 0;
        let dy = analogRef.current.active ? analogRef.current.y * 0.68 : 0;
        keys.forEach((k) => {
          dx += map[k][0] * 0.62;
          dy += map[k][1] * 0.62;
        });
        if (Math.hypot(dx, dy) > 0.04) moveCharacter(dx, dy);
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
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Alas Macan...</p>
      </div>
    );
  }

  const depthScale = Math.max(0.62, Math.min(1.05, 0.62 + ((charPos.y - 36) / 56) * 0.43));
  const tigerFramePct = (tiger.frame / 7) * 100;

  return (
    <div className="relative w-screen h-screen bg-[#041008] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Preload Spritesheet 8-Frame Macan Mlaku */}
      <div className="hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/macan-walk-sheet.png" alt="" />
      </div>

      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Latar Polos Tanpa Karakter Cewek Bawaan */}
        <Image
          src="/assets/level2/screen_macan_polos.jpg"
          alt="Alas Macan Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/gua"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Guwa
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 shadow-xl flex items-center gap-2 text-[10px] sm:text-xs font-bold">
          {tiger.visible ? (
            <span className="text-red-300">
              ⚠️ Awas! Macan liwat ({tiger.dir === 'right' ? 'nengen ➡' : '⬅ ngiwa'})
            </span>
          ) : (
            <span className="text-emerald-300">
              ✅ Aman ({tiger.remainSafeSec.toFixed(1)}s) — Cepet Maju!
            </span>
          )}
        </div>

        <div className="absolute left-[46%] top-[32%] -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none flex flex-col items-center gap-1">
          <div className="px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-300 text-emerald-200 text-[9px] sm:text-[11px] font-bold shadow-lg animate-bounce whitespace-nowrap">
            🎯 Liwat Mréné!
          </div>
          <div className="w-20 h-8 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-400/15 animate-pulse" />
        </div>

        <div
          className={`absolute left-[22%] top-[52%] w-[52%] h-[11%] rounded-full pointer-events-none z-10 transition-colors duration-300 ${
            tiger.visible
              ? 'border border-red-400/45 bg-red-500/10'
              : 'border border-dashed border-emerald-400/45 bg-emerald-400/10'
          }`}
        />

        {/* SPRITE ANIMASI 8-FRAME MACAN MLAKU ALON */}
        {tiger.visible && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${tiger.x}%`,
              top: '57.5%',
              transform: `translate(-50%, -92%) scaleX(${tiger.dir === 'left' ? -1 : 1})`,
            }}
          >
            <div
              className="relative"
              style={{
                width: '18vw',
                maxWidth: 205,
                minWidth: 105,
                aspectRatio: '131 / 85',
              }}
            >
              <div className="absolute bottom-0.5 left-[14%] right-[12%] h-2.5 rounded-full bg-black/55 blur-[3px]" />
              <div
                aria-label="Macan Alas Mlaku"
                className="relative w-full h-full"
                style={{
                  backgroundImage: "url('/assets/level2/macan-walk-sheet.png')",
                  backgroundSize: '800% 100%',
                  backgroundPosition: `${tigerFramePct}% 0%`,
                  backgroundRepeat: 'no-repeat',
                  filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.75))',
                }}
              />
            </div>
          </div>
        )}

        {/* SPRITE 2D PIXEL ART LANGSUNG NYAMBUNG */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            zIndex: charPos.y >= 56 ? 30 : 18,
            transform: `translate(-50%, -100%) scale(${depthScale})`,
            transformOrigin: 'bottom center',
          }}
        >
          <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft} />
        </div>

        <AnalogJoystick
          onChange={(v) => {
            analogRef.current = v;
          }}
        />
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2 rounded-2xl border bg-red-950/95 border-red-400 text-red-200 text-xs sm:text-sm font-bold shadow-2xl">
          {toast.text}
        </div>
      )}
    </div>
  );
}
