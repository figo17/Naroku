'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import { recordLevel2Mission } from '@/lib/level2Progress';

/*
  STAGE FLOW (/level2/labirin - langsung nyambung saka /level2/kembang):
  Full background screen_labirin_polos.jpg (tanpa karakter cewek) + Sprite 2D Pixel Walk Cycle
  aktif langsung wiwit awal. Begitu tekan Gerbang Labirin -> langsung pindah /level2/gladhen tanpa jeda.
*/

const START_POS = { x: 27.5, y: 95.0 };
const PING_PONG_FRAMES = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];

export default function Level2LabirinPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);

  // Physics & Smooth Walk Cycle States
  const [charPos, setCharPos] = useState(START_POS);
  const posRef = useRef({ ...START_POS });
  const velRef = useRef({ vx: 0, vy: 0 });
  const walkPhaseRef = useRef(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [leanDeg, setLeanDeg] = useState(0);

  // Unified Controller Input (360° Analog Stick + Keyboard WASD/Arrows)
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const keysRef = useRef(new Set());
  const mistWarnCooldownRef = useRef(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    router.prefetch('/level2/gladhen');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
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
      if (type === 'step') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.055);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
      } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const s = now + i * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, s);
          gain.gain.setValueAtTime(0.24, s);
          gain.gain.exponentialRampToValueAtTime(0.001, s + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(s);
          osc.stop(s + 0.55);
        });
      }
    } catch {
      // Ignore audio restriction
    }
  }, []);

  // Unified 60fps Physics + Footstep Animation Loop
  useEffect(() => {
    let raf;
    let lastTime = performance.now();
    let lastStepFrame = -1;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!doneRef.current) {
        let ix = analogRef.current.x;
        let iy = analogRef.current.y;
        const keys = keysRef.current;
        if (keys.has('ArrowLeft') || keys.has('KeyA')) ix -= 1;
        if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
        if (keys.has('ArrowUp') || keys.has('KeyW')) iy -= 1;
        if (keys.has('ArrowDown') || keys.has('KeyS')) iy += 1;

        const mag = Math.hypot(ix, iy);
        if (mag > 1) {
          ix /= mag;
          iy /= mag;
        }

        const MAX_SPEED_X = 16.5;
        const MAX_SPEED_Y = 13.0;
        const SMOOTH = 13;

        const targetVx = ix * MAX_SPEED_X;
        const targetVy = iy * MAX_SPEED_Y;
        const blend = 1 - Math.exp(-SMOOTH * dt);

        const vx = velRef.current.vx + (targetVx - velRef.current.vx) * blend;
        const vy = velRef.current.vy + (targetVy - velRef.current.vy) * blend;
        velRef.current = { vx, vy };

        const speed = Math.hypot(vx, vy);
        if (Math.abs(vx) > 1.2) {
          setFacingLeft(vx < 0);
        }
        setLeanDeg(Math.max(-2.5, Math.min(2.5, vx * 0.09)));

        if (speed > 0.8) {
          let nx = Math.max(16, Math.min(86, posRef.current.x + vx * dt));
          let ny = Math.max(56, Math.min(97, posRef.current.y + vy * dt));

          // Rintangan semak tengah labirin (x: 42..73, y < 82); mung lorong Gerbang Labirin (74..85) sing bisa mlebu nganti y=56
          if (nx > 42 && nx < 73.5 && ny < 82) {
            if (posRef.current.y >= 82) ny = 82;
            else if (posRef.current.x <= 42) nx = 42;
            else nx = 73.5;
          } else if (nx <= 42 && ny < 68) {
            ny = 68;
          }

          posRef.current = { x: nx, y: ny };
          setCharPos({ x: nx, y: ny });
          setIsMoving(true);

          walkPhaseRef.current = (walkPhaseRef.current + speed * dt * 0.56) % 10;
          const stepIdx = Math.floor(walkPhaseRef.current);
          setWalkFrame(stepIdx);

          if ((stepIdx === 2 || stepIdx === 7) && stepIdx !== lastStepFrame) {
            lastStepFrame = stepIdx;
            playSound('step');
          }

          if (nx < 38 && ny < 72 && now - mistWarnCooldownRef.current > 2800) {
            mistWarnCooldownRef.current = now;
            setToast({
              type: 'info',
              text: '🌫️ Dalan kiwa ketutup kabut! Mlaku nengen menyang Gerbang Labirin!',
            });
          }

          // Mlebu nganti mentok lorong jero Gerbang Labirin (x: 74..85, y <= 58.5) -> langsung pindah /level2/gladhen!
          if (nx >= 74 && nx <= 85.5 && ny <= 58.5 && !doneRef.current) {
            doneRef.current = true;
            analogRef.current = { x: 0, y: 0, active: false };
            velRef.current = { vx: 0, vy: 0 };
            setIsMoving(false);
            setWalkFrame(0);
            playSound('victory');
            recordLevel2Mission(supabase, 'labirin');
            router.push('/level2/gladhen');
          }
        } else {
          setIsMoving(false);
          setWalkFrame(0);
          lastStepFrame = -1;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playSound, router, supabase]);

  // Keyboard Listeners
  useEffect(() => {
    const valid = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
    const onDown = (e) => {
      if (valid.has(e.code)) {
        e.preventDefault();
        keysRef.current.add(e.code);
      }
    };
    const onUp = (e) => keysRef.current.delete(e.code);
    const onBlur = () => {
      keysRef.current.clear();
      analogRef.current = { x: 0, y: 0, active: false };
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#071108] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Labirin Alas Gunung Wilis...</p>
      </div>
    );
  }

  const depthScale = Math.max(0.48, Math.min(1.04, 0.48 + ((charPos.y - 56) / 36) * 0.56));
  const kuningFrame = isMoving ? PING_PONG_FRAMES[walkFrame % 10] : 0;
  const runtingFrame = isMoving ? PING_PONG_FRAMES[(walkFrame + 2) % 10] : 0;
  const kuningFramePct = (kuningFrame / 5) * 100;
  const runtingFramePct = (runtingFrame / 5) * 100;

  return (
    <div className="relative w-screen h-screen bg-[#071108] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes idleSoft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        .anim-idle-soft { animation: idleSoft 2.2s steps(2, end) infinite; }
      `}</style>

      {/* Preload Pixel Art Walk Cycle Spritesheets */}
      <div className="hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/pixel-walk-kuning.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/pixel-walk-runting.png" alt="" />
      </div>

      {/* Ambient Full-Screen Backdrop */}
      <Image
        src="/assets/level2/screen_labirin_polos.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-md scale-105 opacity-75 pointer-events-none"
      />

      {/* Full 16:9 Stage Container */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level2/screen_labirin_polos.jpg"
          alt="Labirin Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Navigasi Kiri Atas */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/kembang"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Kembang Pusaka
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Status Petunjuk Kanan Atas */}
        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 text-amber-300 font-bold text-[10px] sm:text-xs shadow-lg">
          🚪 Arahake menyang Gerbang Labirin (Tengen)!
        </div>

        {/* Indikator Tujuan Gerbang Labirin */}
        <div className="absolute left-[79%] top-[62%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
          <div className="px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-300 text-emerald-200 text-[9px] sm:text-[11px] font-bold shadow-lg animate-bounce whitespace-nowrap">
            🚪 Gerbang Labirin
          </div>
          <div className="w-16 h-10 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-400/15 animate-pulse" />
        </div>

        {/* SPRITE KARAKTER 2D PIXEL ART AKTIF WIWIT AWAL */}
        <div
          className="absolute z-25 pointer-events-none will-change-transform"
          style={{
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            transform: `translate(-50%, -96%) scale(${depthScale}) rotate(${leanDeg}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[78%] h-3.5 rounded-full bg-black/55 blur-[3px]"
            style={{
              transform: `translateX(-50%) scaleX(${isMoving ? 1.06 : 0.96})`,
            }}
          />

          <div
            className={`relative flex items-end ${isMoving ? '' : 'anim-idle-soft'}`}
            style={{
              transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
              transition: 'transform 0.14s ease-out',
            }}
          >
            <div
              aria-label="Putri Rara Kuning"
              style={{
                height: 'clamp(76px, 21vh, 146px)',
                aspectRatio: '143 / 338',
                backgroundImage: "url('/assets/level2/pixel-walk-kuning.png')",
                backgroundSize: '600% 100%',
                backgroundPosition: `${kuningFramePct}% 0%`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.82))',
              }}
            />
            <div
              aria-label="Putri Rara Runting"
              className="-ml-2"
              style={{
                height: 'clamp(74px, 20.4vh, 142px)',
                aspectRatio: '155 / 329',
                backgroundImage: "url('/assets/level2/pixel-walk-runting.png')",
                backgroundSize: '600% 100%',
                backgroundPosition: `${runtingFramePct}% 0%`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.82))',
              }}
            />
          </div>
        </div>

        {/* KONTROLER ANALOG 360° MULUS */}
        <AnalogJoystick
          onChange={(v) => {
            analogRef.current = v;
          }}
        />
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border bg-stone-900/95 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-bold shadow-2xl">
          {toast.text}
        </div>
      )}
    </div>
  );
}
