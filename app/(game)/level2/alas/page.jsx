'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

export default function Level2AlasKapakPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [charPos, setCharPos] = useState({ x: 22, y: 78 });
  const charPosRef = useRef({ x: 22, y: 78 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const [hasAxe, setHasAxe] = useState(false);
  const hasAxeRef = useRef(false);
  const [chopProgress, setChopProgress] = useState(0);
  const chopProgressRef = useRef(0);
  const [isChopping, setIsChopping] = useState(false);
  const [woodChips, setWoodChips] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => { hasAxeRef.current = hasAxe; }, [hasAxe]);
  useEffect(() => { chopProgressRef.current = chopProgress; }, [chopProgress]);

  useEffect(() => {
    router.prefetch('/level2/kali');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  const playSound = useCallback((type) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (type === 'pickup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(720, now);
        osc.frequency.exponentialRampToValueAtTime(1440, now + 0.14);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.17);
      } else if (type === 'chop') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.21);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.42);
      }
    } catch {
      // Ignore audio restriction
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const isNearTree = (pos) => pos.x >= 40 && pos.x <= 78 && pos.y >= 46 && pos.y <= 78;

  const moveCharacter = useCallback((dx, dy) => {
    if (doneRef.current) return;

    if (dx < -0.05) setFacingLeft(true);
    else if (dx > 0.05) setFacingLeft(false);

    setIsWalking(true);
    if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

    const prev = charPosRef.current;
    const nx = Math.max(10, Math.min(86, prev.x + dx));
    const ny = Math.max(48, Math.min(92, prev.y + dy));
    const nextPos = { x: nx, y: ny };
    charPosRef.current = nextPos;
    setCharPos(nextPos);

    if (!hasAxeRef.current && nx >= 37 && nx <= 52 && ny >= 66 && ny <= 88) {
      hasAxeRef.current = true;
      setHasAxe(true);
      playSound('pickup');
      setToast({ text: '🪓 Kapak dijupuk! Maju menyang ngarep wit gedhe!', type: 'success' });
    }
  }, [playSound]);

  const swingAxe = useCallback(() => {
    if (doneRef.current) return;
    if (!hasAxeRef.current) {
      setToast({ text: '⚠️ Jupuk kapak ing lemah dhisik!', type: 'info' });
      return;
    }
    if (!isNearTree(charPosRef.current)) {
      setToast({ text: '⚠️ Cedhaki ngarep wit gedhe kanggo ngayunake kapak!', type: 'info' });
      return;
    }

    setIsChopping(true);
    playSound('chop');
    setTimeout(() => setIsChopping(false), 280);

    const batchId = Date.now();
    const newChips = Array.from({ length: 6 }, (_, i) => ({
      id: `${batchId}-${i}`,
      dx: (Math.random() - 0.5) * 70,
      dy: -(Math.random() * 45 + 15),
      rot: Math.random() * 360,
    }));
    setWoodChips((prev) => [...prev.slice(-10), ...newChips]);

    const nextProgress = Math.min(100, chopProgressRef.current + 25);
    chopProgressRef.current = nextProgress;
    setChopProgress(nextProgress);

    if (nextProgress >= 100 && !doneRef.current) {
      doneRef.current = true;
      analogRef.current = { x: 0, y: 0, active: false };
      playSound('success');
      recordLevel2Mission(supabase, 'alas');
      router.push('/level2/kali');
    }
  }, [playSound, router, supabase]);

  useEffect(() => {
    const activeKeys = new Set();
    let animFrameId = null;

    const loop = () => {
      if (!doneRef.current) {
        const step = 0.65;
        let dx = analogRef.current.active ? analogRef.current.x * 0.7 : 0;
        let dy = analogRef.current.active ? analogRef.current.y * 0.7 : 0;
        if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= step;
        if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += step;
        if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= step;
        if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += step;
        if (Math.hypot(dx, dy) > 0.04) moveCharacter(dx, dy);
      }
      animFrameId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter'];
      if (!keys.includes(e.code)) return;
      e.preventDefault();
      if (e.code === 'Space' || e.code === 'Enter') {
        swingAxe();
        return;
      }
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
  }, [moveCharacter, swingAxe]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030a08] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Alas Gunung Wilis...</p>
      </div>
    );
  }

  const bgSrc = hasAxe
    ? '/assets/level2/screen_alas_tanpa_cewe_kosong.jpg'
    : '/assets/level2/screen_alas_tanpa_cewe_kapak.jpg';
  const nearTree = isNearTree(charPos);

  return (
    <div className="relative w-screen h-screen bg-[#020705] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes kapakSwing {
          0%   { transform: rotate(-25deg) translate(0, 0); }
          45%  { transform: rotate(45deg) translate(12px, 14px); }
          100% { transform: rotate(-25deg) translate(0, 0); }
        }
        @keyframes woodChipFly {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
        }
        .anim-chop { animation: kapakSwing 0.28s ease-in-out; }
      `}</style>

      <div className="relative w-full h-full max-w-[calc(100vh*1024/512)] max-h-[calc(100vw*512/1024)] aspect-[1024/512] overflow-hidden shadow-2xl">
        <Image
          src={bgSrc}
          alt="Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Navigasi Pojok Kiri Atas */}
        <div className="absolute top-3 left-4 z-35 flex items-center gap-2">
          <Link
            href="/level2/mucuk"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Mucuk
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Badge Petunjuk Kontrol */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/75 shadow-xl">
          <span className="text-yellow-300 font-bold text-[10px] sm:text-xs whitespace-nowrap">
            {!hasAxe
              ? '🕹️ Analog / Panah — Mlaku jupuk kapak ing lemah!'
              : !nearTree
              ? '🚶 Mlaku menyang ngarep wit gedhe!'
              : '🪓 Pencet "Ayunkan Kapak!" utawa Spasi!'}
          </span>
        </div>

        {!hasAxe && (
          <div className="absolute left-[44.5%] top-[69%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
            <div className="px-2.5 py-0.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[9px] sm:text-[10px] font-bold shadow-lg animate-bounce whitespace-nowrap">
              ⬇ Jupuk Kapak
            </div>
          </div>
        )}

        {/* Bar Tebang Pohon */}
        <div className="absolute left-[58%] top-[34%] -translate-x-1/2 z-25 flex flex-col items-center gap-1 pointer-events-none">
          <div className="bg-stone-950/90 border border-yellow-500/80 rounded-xl px-3 py-1.5 shadow-2xl min-w-[150px] sm:min-w-[190px]">
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-bold text-yellow-300 mb-1">
              <span>🪵 Tebang Wit</span>
              <span>{chopProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-200"
                style={{ width: `${chopProgress}%` }}
              />
            </div>
          </div>
        </div>

        {hasAxe && (
          <div
            className={`absolute left-[42%] top-[48%] w-[32%] h-[24%] rounded-3xl z-15 pointer-events-none transition-all ${
              nearTree
                ? 'border-2 border-emerald-400/80 bg-emerald-400/10'
                : 'border border-dashed border-yellow-400/40 bg-yellow-400/5'
            }`}
          />
        )}

        {woodChips.map((chip) => (
          <div
            key={chip.id}
            className="absolute z-30 w-2.5 h-1.5 rounded-sm bg-amber-600 border border-amber-900 pointer-events-none"
            style={{
              left: `${charPos.x + (facingLeft ? -4 : 5)}%`,
              top: `${charPos.y - 14}%`,
              '--dx': `${chip.dx}px`,
              '--dy': `${chip.dy}px`,
              '--rot': `${chip.rot}deg`,
              animation: 'woodChipFly 0.8s ease-out forwards',
            }}
          />
        ))}

        {/* SPRITE 2D PIXEL ART LANGSUNG NYAMBUNG */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft} order="kuning-first">
            {hasAxe && (
              <div
                className={`absolute -right-5 top-[30%] z-25 ${isChopping ? 'anim-chop' : ''}`}
                style={{ transformOrigin: 'bottom left' }}
              >
                <div
                  className="relative"
                  style={{ width: '4.5vw', maxWidth: 56, minWidth: 32, aspectRatio: '2.2/1' }}
                >
                  <Image
                    src="/assets/level2/item-kapak.png"
                    alt="Kapak Wesi"
                    fill
                    sizes="56px"
                    className="object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
                  />
                </div>
              </div>
            )}
          </PixelRoroPair>
        </div>

        {hasAxe && (
          <button
            type="button"
            onClick={swingAxe}
            className={`absolute right-[4%] bottom-[8%] z-35 flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-xs sm:text-sm shadow-2xl transition-all active:scale-90 cursor-pointer ${
              nearTree
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-200 text-stone-950 animate-pulse'
                : 'bg-stone-900/85 border-stone-600 text-stone-400'
            }`}
          >
            <span className="text-lg">🪓</span>
            <span>{nearTree ? 'Ayunkan Kapak!' : 'Cedhaki Wit Dhisik'}</span>
          </button>
        )}

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
