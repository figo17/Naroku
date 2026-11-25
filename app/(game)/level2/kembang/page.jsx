'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';

/*
  STAGE FLOW (/level2/kembang - sawise /level2/pring):
  'intro' -> screen_kembang_komplit.jpg (awalan lengkap: karakter, dialog, kabut, tombol Kembang Pusaka)
  'walk'  -> screen_kembang_kabut.jpg (no cewe), sprite 2D maju menyang Kembang Pusaka
  'clear' -> screen_kembang_terang.jpg (ending kembang background no kabut!)
*/

const START_POS = { x: 26.5, y: 87.5 };

export default function Level2KembangPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('intro'); // 'intro' | 'walk' | 'clear'
  const stageRef = useRef('intro');

  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const goStage = useCallback((s) => {
    stageRef.current = s;
    setStage(s);
  }, []);

  useEffect(() => {
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

  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.13;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.24, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.65);
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
    setShowModal(false);
    goStage('walk');
    setToast({
      type: 'info',
      text: '🌸 Mlaku nyedhaki Kembang Pusaka nganggo Analog utawa tombol Panah!',
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
      const nx = Math.max(14, Math.min(72, prev.x + dx));
      const ny = Math.max(52, Math.min(92, prev.y + dy));
      const next = { x: nx, y: ny };
      charPosRef.current = next;
      setCharPos(next);

      // Sampai di Kembang Pusaka (sekitar x: 52..69, y: 52..69) -> kabut hilang!
      if (nx >= 52 && nx <= 69 && ny >= 52 && ny <= 69) {
        stopAnalog();
        setIsWalking(false);
        playChime();
        goStage('clear');
        setToast({
          type: 'success',
          text: '✨ Cahya Kembang Pusaka sumunar — kabut kandel ing alas langsung ilang!',
        });
        setTimeout(() => setShowModal(true), 1600);
      }
    },
    [goStage, playChime, stopAnalog]
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

  const reset = () => {
    stopAnalog();
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    setFacingLeft(false);
    setIsWalking(false);
    setShowModal(false);
    goStage('intro');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#070d0a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Alas Kabut Gunung Wilis...</p>
      </div>
    );
  }

  const depthScale = Math.max(0.72, Math.min(1.04, 0.72 + ((charPos.y - 52) / 40) * 0.32));

  return (
    <div className="relative w-screen h-screen bg-[#070d0a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes roroWalkBob {
          0%,50%,100% { transform: translateY(0) rotate(0deg) scale(1,0.98); }
          25% { transform: translateY(-8px) rotate(2.4deg) scale(0.99,1.03); }
          75% { transform: translateY(-8px) rotate(-2.4deg) scale(0.99,1.03); }
        }
        @keyframes roroIdleBreath { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes auraBurst {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        .anim-walk { animation: roroWalkBob 0.42s ease-in-out infinite; }
        .anim-idle { animation: roroIdleBreath 2.4s ease-in-out infinite; }
        .anim-burst { animation: auraBurst 1.3s ease-out forwards; }
      `}</style>

      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* 3-Layer Smooth Crossfade Backgrounds */}
        <Image
          src="/assets/level2/screen_kembang_komplit.jpg"
          alt="Alas Kabut - Dialog Putri"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-500 ${
            stage === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        <Image
          src="/assets/level2/screen_kembang_kabut.jpg"
          alt="Alas Kabut - Maju Menyang Kembang Pusaka"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-700 ${
            stage === 'walk' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        <Image
          src="/assets/level2/screen_kembang_terang.jpg"
          alt="Alas Padhang Tanpa Kabut - Kembang Pusaka"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-700 ${
            stage === 'clear' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Navigasi Pojok Kiri Atas */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/pring"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Kreteg Pring
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Status Pojok Kanan Atas */}
        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 text-amber-300 font-bold text-[10px] sm:text-xs">
          {stage === 'intro' && '🌸 Pencet "Kembang Pusaka"'}
          {stage === 'walk' && '🚶‍♀️ Maju nyedhaki Kembang Pusaka!'}
          {stage === 'clear' && '✨ Kabut Wis Ilang!'}
        </div>

        {/* Intro: Hitbox Tombol "✋ Kembang Pusaka" & Kembang Bercahaya */}
        {stage === 'intro' && (
          <>
            <button
              type="button"
              onClick={startWalk}
              title="Gunakake Kembang Pusaka"
              className="absolute left-[62.0%] top-[35.8%] w-[15.2%] h-[7.6%] rounded-full z-30 cursor-pointer hover:bg-amber-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.75)] active:scale-95 transition-all"
            >
              <span className="sr-only">Kembang Pusaka</span>
            </button>
            <button
              type="button"
              onClick={startWalk}
              title="Pencet Kembang Pusaka"
              className="absolute left-[57.5%] top-[44.0%] w-[8.8%] h-[14.0%] rounded-full z-25 cursor-pointer hover:bg-yellow-300/20 animate-pulse"
            >
              <span className="sr-only">Kembang</span>
            </button>
          </>
        )}

        {/* Walk: Penanda Tujuan Kembang Pusaka */}
        {stage === 'walk' && (
          <div className="absolute left-[61.8%] top-[33%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
            <div className="px-3 py-0.5 rounded-full bg-amber-950/95 border border-yellow-400 text-yellow-200 text-[9px] sm:text-[11px] font-bold shadow-lg animate-bounce whitespace-nowrap">
              ⬇ Maju Mréné!
            </div>
          </div>
        )}

        {/* Efek Cahaya Emas Saat Kabut Hilang */}
        {stage === 'clear' && (
          <div
            className="absolute left-[61.8%] top-[50%] w-40 h-40 rounded-full border-4 border-yellow-300 bg-yellow-300/35 pointer-events-none z-30 anim-burst"
          />
        )}

        {/* Sprite 2D Putri Rara Runting & Rara Kuning (saat walk & clear) */}
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

        {/* Analog Kontroler */}
        {stage !== 'clear' && (
          <AnalogJoystick
            onStart={() => {
              if (stageRef.current === 'intro') startWalk();
            }}
            onChange={(v) => {
              analogRef.current = v;
            }}
          />
        )}

        {/* Tombol Lanjut Melayang jika Modal Ditutup untuk Melihat Background Tanpa Kabut */}
        {stage === 'clear' && !showModal && (
          <div className="absolute bottom-3 right-4 z-40 flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="px-3.5 py-2 rounded-full bg-stone-900/90 border border-stone-500 text-stone-200 text-xs font-bold cursor-pointer"
            >
              🔄 Baleni
            </button>
            <Link
              href="/level2/labirin"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black text-xs shadow-lg"
            >
              🌿 Lanjut menyang Labirin →
            </Link>
          </div>
        )}

        {/* Modal Selesai setelah Kabut Hilang */}
        {stage === 'clear' && showModal && (
          <div className="absolute inset-0 z-50 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
              <div className="text-5xl">🌸</div>
              <h3 className="text-xl font-serif font-black text-yellow-400">Kabut Kandel Kasil Ilang!</h3>
              <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                Berkat cahya suci Kembang Pusaka, kabut kandel ing alas Gunung Wilis sirna lan dalan lelampahan Putri Rara Kuning sarta Rara Runting dadi padhang!
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 text-xs font-bold cursor-pointer"
                >
                  👁️ Deleng Alas
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  Baleni 🔄
                </button>
                <Link
                  href="/level2/labirin"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg"
                >
                  🌿 Lanjut menyang Labirin →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold shadow-2xl ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-stone-900/95 border-yellow-400 text-yellow-300'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
