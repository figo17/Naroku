'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';

/*
  STAGE FLOW (/level2/macan - sebelum /level2/pring):
  'intro' -> screen_macan_komplit.jpg (Rara Runting, Rara Kuning, dialog, & macan)
  'play'  -> screen_macan_polos.jpg, karakter jadi sprite 2D + macan mondar-mandir:
             jalan ke kanan sampai hilang (2.6s) -> jeda hilang 3.0s ->
             balik jalan ke kiri sampai hilang (2.6s) -> jeda hilang 3.0s (siklus 11.2s).
             Pemain harus melewati jalur macan saat macan menghilang menuju ujung jalan hutan.
  'done'  -> modal berhasil melewati macan -> lanjut ke /level2/pring
*/

const START_POS = { x: 24, y: 88 };
const WALK_MS = 2600;
const HIDE_MS = 3000;
const CYCLE_MS = (WALK_MS + HIDE_MS) * 2; // 11200ms

function getTigerState(elapsedMs) {
  const t = elapsedMs % CYCLE_MS;
  if (t < WALK_MS) {
    // Jalan ke kanan sampai hilang (x: -14% -> 114%)
    const p = t / WALK_MS;
    return { visible: true, dir: 'right', x: -14 + p * 128, remainSafeSec: 0 };
  }
  if (t < WALK_MS + HIDE_MS) {
    // Hilang di kanan selama 3 detik
    const rem = (WALK_MS + HIDE_MS - t) / 1000;
    return { visible: false, dir: 'left', x: 114, remainSafeSec: rem };
  }
  if (t < WALK_MS * 2 + HIDE_MS) {
    // Balik jalan ke kiri sampai hilang (x: 114% -> -14%)
    const p = (t - (WALK_MS + HIDE_MS)) / WALK_MS;
    return { visible: true, dir: 'left', x: 114 - p * 128, remainSafeSec: 0 };
  }
  // Hilang di kiri selama 3 detik
  const rem = (CYCLE_MS - t) / 1000;
  return { visible: false, dir: 'right', x: -14, remainSafeSec: rem };
}

export default function Level2MacanPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const startTimeRef = useRef(0);
  const hitCooldownRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('intro'); // 'intro' | 'play' | 'done'
  const stageRef = useRef('intro');

  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const [tiger, setTiger] = useState({ visible: true, dir: 'right', x: 58, remainSafeSec: 0 });
  const tigerRef = useRef({ visible: true, dir: 'right', x: 58, remainSafeSec: 0 });
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
          const s = now + i * 0.11;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, s);
          gain.gain.setValueAtTime(0.24, s);
          gain.gain.exponentialRampToValueAtTime(0.001, s + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(s);
          osc.stop(s + 0.5);
        });
      }
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const stopAnalog = useCallback(() => {
    analogRef.current = { x: 0, y: 0, active: false };
  }, []);

  const startPlay = useCallback(() => {
    if (stageRef.current !== 'intro') return;
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    // Mulai saat macan sedang jalan ke kanan dari tengah (sama seperti posisi gambar intro)
    startTimeRef.current = performance.now() - Math.floor(WALK_MS * 0.55);
    goStage('play');
    setToast({
      type: 'info',
      text: '🐅 Enteni macane ngilang (3 detik), banjur cepet maju liwat dalan tengah!',
    });
  }, [goStage]);

  const moveCharacter = useCallback(
    (dx, dy) => {
      if (stageRef.current !== 'play') return;

      if (dx < -0.05) setFacingLeft(true);
      else if (dx > 0.05) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

      const prev = charPosRef.current;
      // Batas jalan tanah di tengah hutan
      const nx = Math.max(20, Math.min(72, prev.x + dx));
      const ny = Math.max(36, Math.min(92, prev.y + dy));
      const next = { x: nx, y: ny };
      charPosRef.current = next;
      setCharPos(next);

      // Berhasil melewati jalur macan sampai ujung jalan hutan atas
      if (ny <= 42) {
        stopAnalog();
        setIsWalking(false);
        playSound('victory');
        goStage('done');
      }
    },
    [goStage, playSound, stopAnalog]
  );

  // Loop patroli macan + deteksi tabrakan di jalur tengah
  useEffect(() => {
    if (stage !== 'play') return;
    let raf;
    const tick = (now) => {
      const st = getTigerState(now - startTimeRef.current);
      tigerRef.current = st;
      setTiger(st);

      const p = charPosRef.current;
      // Jalur lintasan macan berada di y: 48..67. Jika macan terlihat & dekat karakter -> ketahuan!
      const inTigerLane = p.y >= 48 && p.y <= 67;
      const hitX = st.visible && Math.abs(st.x - p.x) < 16;
      if (inTigerLane && hitX && now - hitCooldownRef.current > 900) {
        hitCooldownRef.current = now;
        playSound('roar');
        charPosRef.current = START_POS;
        setCharPos(START_POS);
        setToast({
          type: 'warn',
          text: '⚠️ Ketemon Macan! Putri mundur dhisik — liwat pas macane ngilang!',
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, playSound]);

  // Keyboard Arrow / WASD + Analog
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
      if (stageRef.current === 'play') {
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
        if (stageRef.current === 'intro') {
          startPlay();
          return;
        }
        keys.add(e.code);
      } else if ((e.code === 'Space' || e.code === 'Enter') && stageRef.current === 'intro') {
        e.preventDefault();
        startPlay();
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
  }, [moveCharacter, startPlay]);

  const reset = () => {
    stopAnalog();
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    setFacingLeft(false);
    setIsWalking(false);
    goStage('intro');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Alas Gunung Wilis...</p>
      </div>
    );
  }

  // Skala perspektif saat karakter maju menjauh ke ujung jalan hutan
  const depthScale = Math.max(0.62, Math.min(1.05, 0.62 + ((charPos.y - 36) / 56) * 0.43));

  return (
    <div className="relative w-screen h-screen bg-[#041008] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes roroWalkBob {
          0%,50%,100% { transform: translateY(0) rotate(0deg) scale(1,0.98); }
          25% { transform: translateY(-8px) rotate(2.4deg) scale(0.99,1.03); }
          75% { transform: translateY(-8px) rotate(-2.4deg) scale(0.99,1.03); }
        }
        @keyframes roroIdleBreath { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes macanStride {
          0%,100% { transform: translateY(0px) scaleX(1) scaleY(1); }
          25% { transform: translateY(-4px) scaleX(1.03) scaleY(0.97); }
          50% { transform: translateY(0px) scaleX(0.99) scaleY(1.02); }
          75% { transform: translateY(-4px) scaleX(1.02) scaleY(0.98); }
        }
        .anim-walk { animation: roroWalkBob 0.42s ease-in-out infinite; }
        .anim-idle { animation: roroIdleBreath 2.4s ease-in-out infinite; }
        .anim-macan { animation: macanStride 0.48s ease-in-out infinite; }
        .pixel-sprite { image-rendering: pixelated; }
      `}</style>

      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Background: Intro lengkap vs Polos saat mulai maju */}
        <Image
          src={stage === 'intro' ? '/assets/level2/screen_macan_komplit.jpg' : '/assets/level2/screen_macan_polos.jpg'}
          alt="Alas Macan Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Navigasi Kiri Atas */}
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

        {/* Status Indikator Macan Kanan Atas */}
        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 shadow-xl flex items-center gap-2 text-[10px] sm:text-xs font-bold">
          {stage === 'intro' && <span className="text-amber-300">🐅 Pencet &ldquo;Mulai Maju&rdquo; utawa Analog</span>}
          {stage === 'play' &&
            (tiger.visible ? (
              <span className="text-red-300">
                ⚠️ Awas! Macan liwat ({tiger.dir === 'right' ? 'nengen ➡' : '⬅ ngiwa'})
              </span>
            ) : (
              <span className="text-emerald-300">
                ✅ Aman! Macan ngilang ({tiger.remainSafeSec.toFixed(1)}s) — Cepet Maju!
              </span>
            ))}
          {stage === 'done' && <span className="text-emerald-300">🎉 Kasil Liwat!</span>}
        </div>

        {/* Tombol Mulai Maju pada Scene Intro */}
        {stage === 'intro' && (
          <button
            type="button"
            onClick={startPlay}
            className="absolute left-1/2 bottom-[7%] -translate-x-1/2 z-35 px-5 py-2.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border-2 border-yellow-400 text-yellow-200 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-95 transition-all cursor-pointer animate-bounce"
          >
            🚶‍♀️ Mulai Maju Alon-Alon
          </button>
        )}

        {/* Elemen Gameplay saat Stage Play / Done */}
        {stage !== 'intro' && (
          <>
            {/* Titik Tujuan di Ujung Jalan Hutan */}
            {stage === 'play' && (
              <div className="absolute left-[46%] top-[32%] -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none flex flex-col items-center gap-1">
                <div className="px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-300 text-emerald-200 text-[9px] sm:text-[11px] font-bold shadow-lg animate-bounce whitespace-nowrap">
                  🎯 Liwat Mréné!
                </div>
                <div className="w-20 h-8 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-400/15 animate-pulse" />
              </div>
            )}

            {/* Garis Peringatan Tipis di Jalur Lintasan Macan */}
            {stage === 'play' && (
              <div
                className={`absolute left-[22%] top-[52%] w-[52%] h-[11%] rounded-full pointer-events-none z-10 transition-colors duration-300 ${
                  tiger.visible
                    ? 'border border-red-400/45 bg-red-500/10'
                    : 'border border-dashed border-emerald-400/45 bg-emerald-400/10'
                }`}
              />
            )}

            {/* Sprite 2D Macan (bolak-balik kanan hilang -> jeda 3s -> kiri hilang -> jeda 3s) */}
            {stage === 'play' && tiger.visible && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  left: `${tiger.x}%`,
                  top: '56%',
                  transform: `translate(-50%, -85%) scaleX(${tiger.dir === 'left' ? -1 : 1})`,
                }}
              >
                <div className="anim-macan relative" style={{ width: '24vw', maxWidth: 270, minWidth: 130, aspectRatio: '286/124' }}>
                  <div className="absolute -bottom-1 left-[12%] right-[12%] h-3 rounded-full bg-black/55 blur-[3px]" />
                  <Image
                    src="/assets/level2/item-macan.png"
                    alt="Macan Alas"
                    fill
                    sizes="270px"
                    className="object-contain pixel-sprite drop-shadow-[0_10px_14px_rgba(0,0,0,0.85)]"
                  />
                </div>
              </div>
            )}

            {/* Sprite 2D Putri Rara Runting & Rara Kuning */}
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
              <div className="flex items-end" style={{ transform: facingLeft ? 'scaleX(-1)' : 'none' }}>
                <div className={isWalking ? 'anim-walk' : 'anim-idle'}>
                  <div className="relative" style={{ width: '6.2vw', maxWidth: 74, minWidth: 40, aspectRatio: '130/315' }}>
                    <Image
                      src="/assets/level2/karakter-rara-runting-tali.png"
                      alt="Putri Rara Runting"
                      fill
                      sizes="74px"
                      className="object-contain pixel-sprite drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]"
                    />
                  </div>
                </div>
                <div className={`-ml-2.5 ${isWalking ? 'anim-walk' : 'anim-idle'}`} style={{ animationDelay: '0.14s' }}>
                  <div className="relative" style={{ width: '7.4vw', maxWidth: 86, minWidth: 46, aspectRatio: '241/331' }}>
                    <Image
                      src="/assets/level2/karakter-rara-kuning-tali.png"
                      alt="Putri Rara Kuning"
                      fill
                      sizes="86px"
                      className="object-contain pixel-sprite drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analog Kontroler */}
        {stage !== 'done' && (
          <AnalogJoystick
            onStart={() => {
              if (stageRef.current === 'intro') startPlay();
            }}
            onChange={(v) => {
              analogRef.current = v;
            }}
          />
        )}

        {/* Modal Selesai -> Lanjut ke Kreteg Pring */}
        {stage === 'done' && (
          <div className="absolute inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
              <div className="text-5xl">🐅</div>
              <h3 className="text-xl font-serif font-black text-yellow-400">Kasil Ngliwati Macan!</h3>
              <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                Kanthi sabar lan ngati-ati, Putri Rara Kuning lan Putri Rara Runting kasil liwat nalika macane ngilang menyang njero alas!
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  Baleni 🔄
                </button>
                <Link
                  href="/level2/pring"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5"
                >
                  <span>🎋</span> Lanjut menyang Kreteg Pring →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold shadow-2xl ${
            toast.type === 'warn'
              ? 'bg-red-950/95 border-red-400 text-red-200'
              : 'bg-stone-900/95 border-yellow-400 text-yellow-300'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
