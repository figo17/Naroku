'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/*
  SCENE FLOW (/level2/gua):
  1. 'intro' -> Background komplit (screen_gua_komplit.jpg) lengkap dengan Rara Runting, Rara Kuning, dialog, lan obor.
  2. 'play'  -> Saat obor / "Gunakake Obor" dipencet, background ganti ke screen_gua_tanpa_cewe.jpg (anti-double).
                Pemain menggerakkan karakter (D-Pad HP / Arrow & WASD PC) menghampiri obor untuk mengambil api obor,
                lalu maju menyusuri lorong sampai ke Bibir Gua untuk menyelesaikan misi!
*/

const START_POS = { x: 26.5, y: 80.0 };

export default function Level2GuaOborPage() {
  const router = useRouter();
  const supabase = createClient();
  const dpadTimerRef = useRef(null);
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [scene, setScene] = useState('intro'); // 'intro' | 'play'
  const sceneRef = useRef('intro');

  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const [hasTorch, setHasTorch] = useState(false);
  const hasTorchRef = useRef(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const isCompletedRef = useRef(false);
  const [activeDpadDir, setActiveDpadDir] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { sceneRef.current = scene; }, [scene]);
  useEffect(() => { hasTorchRef.current = hasTorch; }, [hasTorch]);
  useEffect(() => { isCompletedRef.current = isCompleted; }, [isCompleted]);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?role=murid');
          return;
        }
      } catch (err) {
        console.error('Level 2 Gua auth error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
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
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.55);
        });
      }
    } catch {
      // Ignore audio errors
    }
  }, []);

  const showToast = useCallback((text, type = 'info') => {
    setToast({ text, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Activate play scene when torch / button is clicked
  const startPlayScene = useCallback(() => {
    if (sceneRef.current !== 'intro') return;
    setScene('play');
    sceneRef.current = 'play';
    setCharPos(START_POS);
    charPosRef.current = START_POS;
    setHasTorch(false);
    hasTorchRef.current = false;
    setIsCompleted(false);
    isCompletedRef.current = false;
    showToast('🔥 Mlaku nyedhaki obor nganggo D-Pad utawa tombol Panah kanggo njupuk geni!', 'info');
  }, [showToast]);

  const stopDpadMove = useCallback(() => {
    setActiveDpadDir(null);
    if (dpadTimerRef.current) {
      clearInterval(dpadTimerRef.current);
      dpadTimerRef.current = null;
    }
  }, []);

  // Move character and check torch pickup + cave mouth arrival
  const moveCharacter = useCallback((dx, dy) => {
    if (sceneRef.current !== 'play' || isCompletedRef.current) return;

    if (dx < -0.05) setFacingLeft(true);
    else if (dx > 0.05) setFacingLeft(false);

    setIsWalking(true);
    if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

    const prev = charPosRef.current;
    const nx = Math.max(14, Math.min(76, prev.x + dx));
    const ny = Math.max(56, Math.min(90, prev.y + dy));
    const nextPos = { x: nx, y: ny };
    charPosRef.current = nextPos;
    setCharPos(nextPos);

    // 1. Check Torch Pickup Zone (around x: 34..45, y: 63..85)
    if (!hasTorchRef.current && nx >= 34 && nx <= 45 && ny >= 63 && ny <= 85) {
      hasTorchRef.current = true;
      setHasTorch(true);
      playSound('torch');
      showToast('🔥 Obor kasil dijupuk! Saiki maju terus nganti tekan bibir guwa!', 'success');
    }

    // 2. Check Cave Mouth / Bibir Gua Zone (x: 61..76, y: 56..78)
    if (hasTorchRef.current && !isCompletedRef.current && nx >= 61 && nx <= 76 && ny >= 56 && ny <= 78) {
      isCompletedRef.current = true;
      setIsCompleted(true);
      setIsWalking(false);
      stopDpadMove();
      playSound('victory');
      showToast('🎉 Kasil tekan bibir guwa kanthi slamet!', 'success');
    }
  }, [playSound, showToast, stopDpadMove]);

  const startDpadMove = (dir) => {
    if (sceneRef.current === 'intro') {
      startPlayScene();
      return;
    }
    if (sceneRef.current !== 'play' || isCompletedRef.current) return;

    setActiveDpadDir(dir);
    if (dpadTimerRef.current) clearInterval(dpadTimerRef.current);

    const step = 1.5;
    let dx = 0;
    let dy = 0;
    if (dir === 'up') dy = -step;
    if (dir === 'down') dy = step;
    if (dir === 'left') dx = -step;
    if (dir === 'right') dx = step;

    moveCharacter(dx, dy);
    dpadTimerRef.current = setInterval(() => {
      moveCharacter(dx * 0.85, dy * 0.85);
    }, 45);
  };

  // Keyboard Arrow / WASD controls
  useEffect(() => {
    const activeKeys = new Set();
    let animFrameId = null;

    const loop = () => {
      if (activeKeys.size > 0 && sceneRef.current === 'play' && !isCompletedRef.current) {
        const step = 0.6;
        let dx = 0;
        let dy = 0;
        if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= step;
        if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += step;
        if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= step;
        if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += step;
        if (dx !== 0 || dy !== 0) moveCharacter(dx, dy);
      }
      animFrameId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter'];
      if (!keys.includes(e.code)) return;
      e.preventDefault();

      if ((e.code === 'Space' || e.code === 'Enter') && sceneRef.current === 'intro') {
        startPlayScene();
        return;
      }
      if (sceneRef.current === 'play' && !isCompletedRef.current) {
        activeKeys.add(e.code);
      }
    };

    const onKeyUp = (e) => {
      activeKeys.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    animFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (dpadTimerRef.current) clearInterval(dpadTimerRef.current);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [moveCharacter, startPlayScene]);

  const resetMission = () => {
    stopDpadMove();
    setScene('intro');
    sceneRef.current = 'intro';
    setCharPos(START_POS);
    charPosRef.current = START_POS;
    setFacingLeft(false);
    setIsWalking(false);
    setHasTorch(false);
    hasTorchRef.current = false;
    setIsCompleted(false);
    isCompletedRef.current = false;
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#05080d] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Lelampahan Guwa Gunung Wilis...</p>
      </div>
    );
  }

  // Subtle depth scale as characters walk deeper toward the cave mouth (y: 80 -> 58)
  const depthScale = Math.max(0.76, Math.min(1.04, 0.76 + ((charPos.y - 56) / 30) * 0.26));

  return (
    <div className="relative w-screen h-screen bg-[#04070b] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes roroWalkBob {
          0%   { transform: translateY(0px) rotate(0deg) scale(1, 0.98); }
          25%  { transform: translateY(-8px) rotate(2.4deg) scale(0.99, 1.03); }
          50%  { transform: translateY(0px) rotate(0deg) scale(1, 0.98); }
          75%  { transform: translateY(-8px) rotate(-2.4deg) scale(0.99, 1.03); }
          100% { transform: translateY(0px) rotate(0deg) scale(1, 0.98); }
        }
        @keyframes roroIdleBreath {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes torchFlicker {
          0%, 100% { transform: scale(1) rotate(-6deg); opacity: 0.92; }
          50%      { transform: scale(1.08) rotate(-3deg); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-walk  { animation: roroWalkBob 0.42s ease-in-out infinite; }
        .anim-idle  { animation: roroIdleBreath 2.4s ease-in-out infinite; }
        .anim-torch { animation: torchFlicker 0.9s ease-in-out infinite; }
        .anim-fadein { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>

      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Dual Background (Anti-Double Karakter) */}
        <Image
          src="/assets/level2/screen_gua_komplit.jpg"
          alt="Guwa Gunung Wilis - Dialog Rara Kuning lan Rara Runting"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-300 ${
            scene === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        <Image
          src="/assets/level2/screen_gua_tanpa_cewe.jpg"
          alt="Guwa Gunung Wilis - Misi Obor"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-300 ${
            scene === 'play' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Navigasi Pojok Kiri Atas */}
        <div className="absolute top-3 left-4 z-35 flex items-center gap-2">
          <Link
            href="/level2/jurang"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            ⬅ Bali menyang Jembatan Tali
          </Link>
          <Link
            href="/peta"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Petunjuk Misi Pojok Kanan Atas */}
        <div className="absolute top-3 right-4 z-35 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 shadow-xl backdrop-blur-md">
          <span className="text-amber-300 font-bold text-[10px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap">
            {scene === 'intro' ? (
              <>🔥 Pencet Obor / &ldquo;Gunakake Obor&rdquo;</>
            ) : !hasTorch ? (
              <>🚶 Cedhaki obor kanggo njupuk geni!</>
            ) : !isCompleted ? (
              <>✨ Maju terus nganti tekan Bibir Guwa!</>
            ) : (
              <>🎉 Misi Guwa Rampung!</>
            )}
          </span>
        </div>

        {/* ========================================================
            SCENE 1 ('intro'): HITBOX OBOR & TOMBOL "GUNAKAKE OBOR"
           ======================================================== */}
        {scene === 'intro' && (
          <>
            {/* Hitbox Obor / Api Unggun */}
            <button
              type="button"
              onClick={startPlayScene}
              title="Pencet obor kanggo miwiti"
              className="absolute left-[36.5%] top-[42.5%] w-[5.8%] h-[27.5%] rounded-2xl z-25 cursor-pointer bg-transparent hover:bg-amber-400/20 hover:ring-2 hover:ring-amber-300 active:scale-95 transition-all animate-pulse"
            >
              <span className="sr-only">Jupuk Obor</span>
            </button>

            {/* Hitbox Tombol Grafis "✋ Gunakake Obor" */}
            <button
              type="button"
              onClick={startPlayScene}
              title="Gunakake Obor"
              className="absolute left-[41.5%] top-[53.0%] w-[15.6%] h-[7.4%] rounded-xl z-25 cursor-pointer bg-transparent hover:bg-amber-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_25px_rgba(251,191,36,0.75)] active:scale-95 transition-all"
            >
              <span className="sr-only">Gunakake Obor</span>
            </button>
          </>
        )}

        {/* ========================================================
            SCENE 2 ('play'): INDIKATOR OBOR, BIBIR GUA & KARAKTER
           ======================================================== */}
        {scene === 'play' && (
          <>
            {/* Penanda Ambil Obor (sebelum obor diambil) */}
            {!hasTorch && (
              <div className="absolute left-[39.3%] top-[38%] -translate-x-1/2 z-25 pointer-events-none flex flex-col items-center">
                <div className="px-2.5 py-1 rounded-full bg-amber-950/95 border border-yellow-400 text-yellow-200 text-[9px] sm:text-[11px] font-bold shadow-xl animate-bounce whitespace-nowrap">
                  ⬇ Hampiri &amp; Jupuk Obor
                </div>
              </div>
            )}

            {/* Zona Target Bibir Gua (muncul setelah obor diambil) */}
            {hasTorch && (
              <div className="absolute left-[67.5%] top-[58%] -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none flex flex-col items-center gap-1.5">
                <div className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-300/90 text-cyan-200 text-[9px] sm:text-[11px] font-bold shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-bounce whitespace-nowrap">
                  🎯 Bibir Guwa (Maju Mréné!)
                </div>
                <div className="w-24 h-14 sm:w-32 sm:h-18 rounded-full border-2 border-dashed border-cyan-300/75 bg-cyan-400/15 shadow-[0_0_30px_rgba(56,189,248,0.4)] animate-pulse" />
              </div>
            )}

            {/* KARAKTER DINAMIS: PUTRI RARA RUNTING & RARA KUNING */}
            <div
              className="absolute z-25 pointer-events-none"
              style={{
                left: `${charPos.x}%`,
                top: `${charPos.y}%`,
                transform: `translate(-50%, -100%) scale(${depthScale})`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Cahaya Hangat Obor di Sekitar Karakter */}
              {hasTorch && (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-64 sm:h-64 rounded-full pointer-events-none -z-10"
                  style={{
                    background: 'radial-gradient(circle, rgba(251,191,36,0.38) 0%, rgba(245,158,11,0.16) 45%, rgba(0,0,0,0) 72%)',
                  }}
                />
              )}

              <div
                className="relative flex items-end"
                style={{
                  transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {/* Putri Rara Runting (Hijau) */}
                <div className={isWalking ? 'anim-walk' : 'anim-idle'}>
                  <div
                    className="relative"
                    style={{ width: '6.2vw', maxWidth: 74, minWidth: 40, aspectRatio: '130/315' }}
                  >
                    <Image
                      src="/assets/level2/karakter-rara-runting-tali.png"
                      alt="Putri Rara Runting"
                      fill
                      sizes="74px"
                      className="object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]"
                    />
                  </div>
                </div>

                {/* Putri Rara Kuning (Kuning) */}
                <div
                  className={`-ml-2.5 ${isWalking ? 'anim-walk' : 'anim-idle'}`}
                  style={{ animationDelay: '0.14s' }}
                >
                  <div
                    className="relative"
                    style={{ width: '7.4vw', maxWidth: 86, minWidth: 46, aspectRatio: '241/331' }}
                  >
                    <Image
                      src="/assets/level2/karakter-rara-kuning-tali.png"
                      alt="Putri Rara Kuning"
                      fill
                      sizes="86px"
                      className="object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]"
                    />
                  </div>
                </div>

                {/* Item Obor Menyala di Tangan Saat Sudah Diambil */}
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
              </div>
            </div>
          </>
        )}

        {/* ========================================================
            D-PAD EMULATOR (POJOK KIRI BAWAH — HP & PC)
           ======================================================== */}
        {!isCompleted && (
          <div className="pointer-events-auto select-none">
            {/* Atas (▲) */}
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); startDpadMove('up'); }}
              onPointerUp={stopDpadMove}
              onPointerLeave={stopDpadMove}
              onTouchStart={(e) => { e.preventDefault(); startDpadMove('up'); }}
              onTouchEnd={stopDpadMove}
              onTouchCancel={stopDpadMove}
              title="Mlaku Maju / Mendhuwur (▲)"
              className={`absolute left-[5.4%] top-[77.5%] w-[4.2%] h-[7.6%] rounded-lg z-35 transition-all cursor-pointer ${
                activeDpadDir === 'up'
                  ? 'bg-yellow-400/45 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                  : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
              }`}
            >
              <span className="sr-only">Panah Dhuwur</span>
            </button>

            {/* Kiwa (◀) */}
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); startDpadMove('left'); }}
              onPointerUp={stopDpadMove}
              onPointerLeave={stopDpadMove}
              onTouchStart={(e) => { e.preventDefault(); startDpadMove('left'); }}
              onTouchEnd={stopDpadMove}
              onTouchCancel={stopDpadMove}
              title="Mlaku Ngiwa (◀)"
              className={`absolute left-[0.9%] top-[85.6%] w-[4.2%] h-[7.6%] rounded-lg z-35 transition-all cursor-pointer ${
                activeDpadDir === 'left'
                  ? 'bg-yellow-400/45 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                  : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
              }`}
            >
              <span className="sr-only">Panah Kiwa</span>
            </button>

            {/* Ngisor (▼) */}
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); startDpadMove('down'); }}
              onPointerUp={stopDpadMove}
              onPointerLeave={stopDpadMove}
              onTouchStart={(e) => { e.preventDefault(); startDpadMove('down'); }}
              onTouchEnd={stopDpadMove}
              onTouchCancel={stopDpadMove}
              title="Mlaku Mundur / Mengisor (▼)"
              className={`absolute left-[5.4%] top-[85.6%] w-[4.2%] h-[7.6%] rounded-lg z-35 transition-all cursor-pointer ${
                activeDpadDir === 'down'
                  ? 'bg-yellow-400/45 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                  : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
              }`}
            >
              <span className="sr-only">Panah Ngisor</span>
            </button>

            {/* Tengen (▶) */}
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); startDpadMove('right'); }}
              onPointerUp={stopDpadMove}
              onPointerLeave={stopDpadMove}
              onTouchStart={(e) => { e.preventDefault(); startDpadMove('right'); }}
              onTouchEnd={stopDpadMove}
              onTouchCancel={stopDpadMove}
              title="Mlaku Maju Nengen (▶)"
              className={`absolute left-[10.1%] top-[85.6%] w-[4.2%] h-[7.6%] rounded-lg z-35 transition-all cursor-pointer ${
                activeDpadDir === 'right'
                  ? 'bg-yellow-400/45 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                  : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
              }`}
            >
              <span className="sr-only">Panah Tengen</span>
            </button>
          </div>
        )}

        {/* ========================================================
            MODAL MISI SELESAI (TEKAN BIBIR GUWA)
           ======================================================== */}
        {isCompleted && (
          <div className="absolute inset-0 z-40 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 anim-fadein">
            <div className="max-w-md w-full bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg">
                🔥
              </div>
              <h3 className="text-xl font-serif font-black text-yellow-400">
                Kasil ngliwati Guwa Peteng!
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
                Kanthi cahya obor sing padhang, Putri Rara Kuning lan Putri Rara Runting wani mlaku nembus petenge guwa nganti tekan bibir guwa kanthi slamet!
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={resetMission}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold transition cursor-pointer"
                >
                  Baleni Misi 🔄
                </button>
                <Link
                  href="/peta"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🗺️</span> Rampung &amp; Menyang Peta →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide anim-fadein ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-stone-900/95 border-yellow-400 text-yellow-300'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-stone-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
