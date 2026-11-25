'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';

/*
  STAGE FLOW (/level2/labirin - sawise /level2/kembang):
  'intro' -> Full background screen_labirin_komplit.jpg (karakter Rara Kuning & Runting + dialog).
  'walk'  -> Full background screen_labirin_polos.jpg + Sprite 2D Walk Cycle 8-frame
             (kaki melangkah nyata, kain jarik & selendang mengayun halus, kontroler 60fps mulus).
             Pemain mengarahkan kedua putri masuk melewati Gerbang Labirin di sisi kanan.
  'done'  -> Modal berhasil masuk Gerbang Labirin.
*/

const START_POS = { x: 27.5, y: 95.0 };

export default function Level2LabirinPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('intro'); // 'intro' | 'walk' | 'done'
  const stageRef = useRef('intro');

  // Physics & Smooth 8-Frame Walk Cycle States
  const [charPos, setCharPos] = useState(START_POS);
  const posRef = useRef({ ...START_POS });
  const velRef = useRef({ vx: 0, vy: 0 });
  const walkPhaseRef = useRef(0);
  const [walkFrame, setWalkFrame] = useState(0); // 0..7
  const [isMoving, setIsMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [leanDeg, setLeanDeg] = useState(0);

  // Unified Controller Input (360° Analog Stick + Keyboard WASD/Arrows)
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const keysRef = useRef(new Set());
  const mistWarnCooldownRef = useRef(0);
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

  const startWalk = useCallback(() => {
    if (stageRef.current !== 'intro') return;
    posRef.current = { ...START_POS };
    velRef.current = { vx: 0, vy: 0 };
    walkPhaseRef.current = 0;
    setCharPos(START_POS);
    setWalkFrame(0);
    goStage('walk');
    setToast({
      type: 'info',
      text: '🌿 Gunakake Analog utawa tombol Panah kanggo mlaku menyang Gerbang Labirin!',
    });
  }, [goStage]);

  // Unified 60fps Physics + 8-Frame Footstep Animation Loop
  useEffect(() => {
    let raf;
    let lastTime = performance.now();
    let lastStepFrame = -1;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (stageRef.current === 'walk') {
        let ix = analogRef.current.x;
        let iy = analogRef.current.y;
        const keys = keysRef.current;
        if (keys.has('ArrowLeft') || keys.has('KeyA')) ix -= 1;
        if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
        if (keys.has('ArrowUp') || keys.has('KeyW')) iy -= 1;
        if (keys.has('ArrowDown') || keys.has('KeyS')) iy += 1;

        // Normalize diagonal input so diagonal speed isn't faster
        const mag = Math.hypot(ix, iy);
        if (mag > 1) {
          ix /= mag;
          iy /= mag;
        }

        const MAX_SPEED_X = 24; // % per second
        const MAX_SPEED_Y = 18;
        const SMOOTH = 13; // responsive smooth acceleration & glide deceleration

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

        if (speed > 1.1) {
          let nx = Math.max(16, Math.min(86, posRef.current.x + vx * dt));
          let ny = Math.max(66, Math.min(97, posRef.current.y + vy * dt));

          // Rintangan semak tengah labirin (x: 42..68, y < 82) supaya karakter mengikuti jalan tanah
          if (nx > 42 && nx < 68 && ny < 82) {
            if (posRef.current.y >= 82) ny = 82;
            else if (posRef.current.x <= 42) nx = 42;
            else nx = 68;
          }

          posRef.current = { x: nx, y: ny };
          setCharPos({ x: nx, y: ny });
          setIsMoving(true);

          // Advance 8-frame walk cycle proportional to real stride speed
          walkPhaseRef.current = (walkPhaseRef.current + speed * dt * 0.52) % 8;
          const frameIdx = Math.floor(walkPhaseRef.current);
          setWalkFrame(frameIdx);

          if ((frameIdx === 1 || frameIdx === 5) && frameIdx !== lastStepFrame) {
            lastStepFrame = frameIdx;
            playSound('step');
          }

          // Peringatan lembut jika masuk jalan kabut buntu di kiri atas
          if (nx < 38 && ny < 72 && now - mistWarnCooldownRef.current > 2800) {
            mistWarnCooldownRef.current = now;
            setToast({
              type: 'info',
              text: '🌫️ Dalan kiwa ketutup kabut! Mlaku nengen menyang Gerbang Labirin!',
            });
          }

          // Sampai di Gerbang Labirin (kanan: x 73..86, y 68..90)
          if (nx >= 73 && nx <= 86 && ny >= 68 && ny <= 90) {
            analogRef.current = { x: 0, y: 0, active: false };
            velRef.current = { vx: 0, vy: 0 };
            setIsMoving(false);
            setWalkFrame(0);
            playSound('victory');
            goStage('done');
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
  }, [goStage, playSound]);

  // Keyboard Listeners
  useEffect(() => {
    const valid = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
    const onDown = (e) => {
      if (valid.has(e.code)) {
        e.preventDefault();
        if (stageRef.current === 'intro') startWalk();
        keysRef.current.add(e.code);
      } else if ((e.code === 'Space' || e.code === 'Enter') && stageRef.current === 'intro') {
        e.preventDefault();
        startWalk();
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
  }, [startWalk]);

  const reset = () => {
    analogRef.current = { x: 0, y: 0, active: false };
    posRef.current = { ...START_POS };
    velRef.current = { vx: 0, vy: 0 };
    setCharPos(START_POS);
    setWalkFrame(0);
    setIsMoving(false);
    setFacingLeft(false);
    goStage('intro');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#071108] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Labirin Alas Gunung Wilis...</p>
      </div>
    );
  }

  const currentBg =
    stage === 'intro' ? '/assets/level2/screen_labirin_komplit.jpg' : '/assets/level2/screen_labirin_polos.jpg';

  // Perspektif kedalaman halus saat mendekati gerbang labirin
  const depthScale = Math.max(0.7, Math.min(1.04, 0.7 + ((charPos.y - 58) / 31) * 0.34));
  const kuningFramePct = (walkFrame / 7) * 100;
  const runtingFramePct = (((walkFrame + 1) % 8) / 7) * 100;

  return (
    <div className="relative w-screen h-screen bg-[#071108] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes idleSoft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.5px); }
        }
        .anim-idle-soft { animation: idleSoft 2.4s ease-in-out infinite; }
      `}</style>

      {/* Preload Walk Cycle Spritesheets supaya transisi langsung mulus tanpa kedip */}
      <div className="hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/walk-rara-kuning-sheet.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/walk-rara-runting-sheet.png" alt="" />
      </div>

      {/* Ambient Full-Screen Backdrop (menutup 100% layar di rasio apa pun tanpa bar putih/hitam) */}
      <Image
        src={currentBg}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-md scale-105 opacity-75 pointer-events-none"
      />

      {/* Full 16:9 Stage Container */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level2/screen_labirin_komplit.jpg"
          alt="Labirin Alas Gunung Wilis - Dialog Rara Kuning lan Rara Runting"
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-300 ${
            stage === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        <Image
          src="/assets/level2/screen_labirin_polos.jpg"
          alt="Labirin Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-300 ${
            stage !== 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
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
          {stage === 'intro' && '🌿 Pencet Kontroler / "Mulai Mlaku"'}
          {stage === 'walk' && '🚪 Arahake menyang Gerbang Labirin (Tengen)!'}
          {stage === 'done' && '🎉 Kasil Mlebu Labirin!'}
        </div>

        {/* Intro: Tombol Mulai Mlaku */}
        {stage === 'intro' && (
          <button
            type="button"
            onClick={startWalk}
            className="absolute left-1/2 bottom-[6%] -translate-x-1/2 z-35 px-5 py-2.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border-2 border-yellow-400 text-yellow-200 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-95 transition-all cursor-pointer animate-bounce"
          >
            🚶‍♀️ Mulai Mlaku Bebarengan
          </button>
        )}

        {/* Indikator Tujuan Gerbang Labirin */}
        {stage === 'walk' && (
          <div className="absolute left-[79%] top-[62%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
            <div className="px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-300 text-emerald-200 text-[9px] sm:text-[11px] font-bold shadow-lg animate-bounce whitespace-nowrap">
              🚪 Gerbang Labirin
            </div>
            <div className="w-16 h-10 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-400/15 animate-pulse" />
          </div>
        )}

        {/* SPRITE KARAKTER 2D WALK CYCLE (8-FRAME KAKI MELANGKAH HALUS) */}
        {stage !== 'intro' && (
          <div
            className="absolute z-25 pointer-events-none will-change-transform"
            style={{
              left: `${charPos.x}%`,
              top: `${charPos.y}%`,
              transform: `translate(-50%, -96%) scale(${depthScale}) rotate(${leanDeg}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            {/* Bayangan kaki lembut mengikuti langkah */}
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
              {/* Putri Rara Kuning (Kiri - sesuai posisi di background intro) */}
              <div
                aria-label="Putri Rara Kuning"
                style={{
                  width: '8.2vw',
                  maxWidth: 96,
                  minWidth: 50,
                  aspectRatio: '269 / 347',
                  backgroundImage: "url('/assets/level2/walk-rara-kuning-sheet.png')",
                  backgroundSize: '800% 100%',
                  backgroundPosition: `${isMoving ? kuningFramePct : 0}% 0%`,
                  backgroundRepeat: 'no-repeat',
                  filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.82))',
                }}
              />

              {/* Putri Rara Runting (Kanan - bergandengan & langkah kaki selaras) */}
              <div
                aria-label="Putri Rara Runting"
                className="-ml-3.5"
                style={{
                  width: '6.5vw',
                  maxWidth: 76,
                  minWidth: 40,
                  aspectRatio: '158 / 331',
                  backgroundImage: "url('/assets/level2/walk-rara-runting-sheet.png')",
                  backgroundSize: '800% 100%',
                  backgroundPosition: `${isMoving ? runtingFramePct : 0}% 0%`,
                  backgroundRepeat: 'no-repeat',
                  filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.82))',
                }}
              />
            </div>
          </div>
        )}

        {/* KONTROLER ANALOG 360° MULUS */}
        {stage !== 'done' && (
          <AnalogJoystick
            onStart={() => {
              if (stageRef.current === 'intro') startWalk();
            }}
            onChange={(v) => {
              analogRef.current = v;
            }}
          />
        )}

        {/* Modal Selesai Masuk Gerbang Labirin */}
        {stage === 'done' && (
          <div className="absolute inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
              <div className="text-5xl">🌿</div>
              <h3 className="text-xl font-serif font-black text-yellow-400">Nemokake Dalan Labirin!</h3>
              <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                Kanthi tetep bebarengan lan mlaku alon-alon, Putri Rara Kuning lan Putri Rara Runting kasil nemokake gerbang dalan labirin tanpa kesasar!
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
                  href="/peta"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg"
                >
                  🗺️ Lanjut menyang Peta →
                </Link>
              </div>
            </div>
          </div>
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
