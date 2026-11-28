'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

const START_POS = { x: 24.5, y: 84.0 };
const SPEED_X = 16.5;
const SPEED_Y = 13.0;

export default function Level2GuaOborPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const [hasTorch, setHasTorch] = useState(false);
  const hasTorchRef = useRef(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    hasTorchRef.current = hasTorch;
  }, [hasTorch]);

  useEffect(() => {
    router.prefetch('/level2/macan');
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
      if (type === 'torch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.18);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'victory') {
        [523.25, 587.33, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const s = now + idx * 0.1;
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
      // Ignore audio errors
    }
  }, []);

  const moveCharacter = useCallback(
    (dx, dy) => {
      if (doneRef.current) return;

      if (dx < -0.02) setFacingLeft(true);
      else if (dx > 0.02) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 180);

      const prev = charPosRef.current;
      const nx = Math.max(14, Math.min(78, prev.x + dx));
      const ny = Math.max(47.5, Math.min(91, prev.y + dy));
      const nextPos = { x: nx, y: ny };
      charPosRef.current = nextPos;
      setCharPos(nextPos);

      if (!hasTorchRef.current && nx >= 33 && nx <= 46 && ny >= 62 && ny <= 86) {
        hasTorchRef.current = true;
        setHasTorch(true);
        playSound('torch');
        setToast({
          text: '🔥 Obor kasil dijupuk! Mlaku terus nganti mentok pucuk lorong Guwa!',
          type: 'success',
        });
      }

      // Mentok tekan pucuk lorong cangkem guwa ing kadohan (y <= 50.5)
      if (hasTorchRef.current && !doneRef.current && nx >= 63 && nx <= 75 && ny <= 50.5) {
        doneRef.current = true;
        analogRef.current = { x: 0, y: 0, active: false };
        setIsWalking(false);
        playSound('victory');
        recordLevel2Mission(supabase, 'gua');
        router.push('/level2/macan');
      }
    },
    [playSound, router, supabase]
  );

  useEffect(() => {
    const activeKeys = new Set();
    let animFrameId = null;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!doneRef.current) {
        let ix = analogRef.current.active ? analogRef.current.x : 0;
        let iy = analogRef.current.active ? analogRef.current.y : 0;
        if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) iy -= 1;
        if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) iy += 1;
        if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) ix -= 1;
        if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) ix += 1;

        const mag = Math.hypot(ix, iy);
        if (mag > 0.06) {
          const norm = mag > 1 ? 1 / mag : 1;
          moveCharacter(ix * norm * SPEED_X * dt, iy * norm * SPEED_Y * dt);
        }
      }
      animFrameId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
      if (!keys.includes(e.code)) return;
      e.preventDefault();
      activeKeys.add(e.code);
    };
    const onKeyUp = (e) => activeKeys.delete(e.code);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    animFrameId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [moveCharacter]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#05080d] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Guwa Gunung Wilis...</p>
      </div>
    );
  }

  const depthScale = Math.max(0.44, Math.min(1.04, 0.44 + ((charPos.y - 47.5) / 40) * 0.6));

  return (
    <div className="relative w-screen h-screen bg-[#04070b] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes torchFlicker {
          0%, 100% { transform: scale(1) rotate(-6deg); opacity: 0.92; }
          50%      { transform: scale(1.08) rotate(-3deg); opacity: 1; }
        }
        .anim-torch { animation: torchFlicker 0.9s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level2/screen_gua_tanpa_cewe.jpg"
          alt="Guwa Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        <div className="absolute top-3 left-4 z-[35] flex items-center gap-2">
          <Link
            href="/level2/jurang"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Jurang Tali
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        <div className="absolute top-3 right-4 z-[35] px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 shadow-xl">
          <span className="text-amber-300 font-bold text-[10px] sm:text-xs whitespace-nowrap">
            {!hasTorch
              ? '🔥 Cedhaki obor kanggo njupuk geni!'
              : '✨ Mlaku nganti mentok pucuk lorong Guwa!'}
          </span>
        </div>

        {!hasTorch && (
          <div className="absolute left-[39.3%] top-[38%] -translate-x-1/2 z-[25] pointer-events-none flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-full bg-amber-950/95 border border-yellow-400 text-yellow-200 text-[9px] sm:text-[11px] font-bold shadow-xl animate-bounce whitespace-nowrap">
              ⬇ Jupuk Obor
            </div>
          </div>
        )}

        {hasTorch && (
          <div className="absolute left-[68.5%] top-[47.5%] -translate-x-1/2 -translate-y-1/2 z-[15] pointer-events-none flex flex-col items-center gap-1">
            <div className="px-3 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-300/90 text-cyan-200 text-[9px] sm:text-[10px] font-bold animate-bounce whitespace-nowrap">
              🎯 Pucuk Guwa
            </div>
            <div className="w-16 h-8 rounded-full border-2 border-dashed border-cyan-300/75 bg-cyan-400/15 animate-pulse" />
          </div>
        )}

        {/* SPRITE 2D PIXEL ART LANGSUNG NYAMBUNG */}
        <div
          className="absolute z-[25] pointer-events-none"
          style={{
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            transform: `translate(-50%, -100%) scale(${depthScale})`,
            transformOrigin: 'bottom center',
          }}
        >
          {hasTorch && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-64 sm:h-64 rounded-full pointer-events-none -z-10"
              style={{
                background:
                  'radial-gradient(circle, rgba(251,191,36,0.38) 0%, rgba(245,158,11,0.16) 45%, rgba(0,0,0,0) 72%)',
              }}
            />
          )}

          <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft}>
            {hasTorch && (
              <div className="absolute -right-6 -top-3 z-30 anim-torch">
                <div
                  className="relative"
                  style={{ width: '6.5vw', maxWidth: 76, minWidth: 42, aspectRatio: '1/1' }}
                >
                  <Image
                    src="/assets/level2/item-obor.png"
                    alt="Obor Murup"
                    fill
                    sizes="76px"
                    className="object-contain drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]"
                  />
                </div>
              </div>
            )}
          </PixelRoroPair>
        </div>

        <AnalogJoystick
          onChange={(v) => {
            analogRef.current = v;
          }}
        />
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2 rounded-2xl border bg-stone-900/95 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-bold shadow-2xl">
          {toast.text}
        </div>
      )}
    </div>
  );
}
