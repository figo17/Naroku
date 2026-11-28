'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

const START_POS = { x: 22, y: 88 };
const SPEED_X = 16.5;
const SPEED_Y = 13.0;

const PILE = [
  { left: 40, top: 66 },
  { left: 47, top: 72 },
  { left: 54, top: 78 },
];
const SLOTS = [
  { left: 58, top: 40 },
  { left: 66, top: 44 },
  { left: 74, top: 48 },
];

export default function Level2PringPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('walk');
  const stageRef = useRef('walk');
  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [placed, setPlaced] = useState([false, false, false]);
  const [toast, setToast] = useState(null);

  const goStage = useCallback((s) => {
    stageRef.current = s;
    setStage(s);
  }, []);

  useEffect(() => {
    router.prefetch('/level2/kembang');
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

  const stopAnalog = useCallback(() => {
    analogRef.current = { x: 0, y: 0, active: false };
  }, []);

  const moveCharacter = useCallback(
    (dx, dy) => {
      if (doneRef.current) return;
      const s = stageRef.current;
      if (s !== 'walk' && s !== 'bridge') return;

      if (dx < -0.02) setFacingLeft(true);
      else if (dx > 0.02) setFacingLeft(false);
      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 180);

      const prev = charPosRef.current;
      const nx = Math.max(10, Math.min(s === 'bridge' ? 98.5 : 60, prev.x + dx));
      let ny = Math.max(44, Math.min(95, prev.y + dy));

      // Nalika mlaku ing ndhuwur kreteg pring (x >= 43), tuntun pijakan sikil pas ing glugu pring nganti seberang
      if (s === 'bridge' && nx >= 43) {
        const bridgeDeckY = 53.5 + Math.sin(((Math.min(96, nx) - 43) / 53) * Math.PI) * 3.2;
        ny = prev.x < 43 ? bridgeDeckY : ny * 0.72 + bridgeDeckY * 0.28;
      }

      charPosRef.current = { x: nx, y: ny };
      setCharPos({ x: nx, y: ny });

      if (s === 'walk' && nx >= 36 && ny >= 60 && ny <= 92) {
        stopAnalog();
        goStage('arrange');
        setToast({
          type: 'success',
          text: '🎋 Pencet pring siji-siji kanggo nyusun 3 pring dadi kreteg!',
        });
      } else if (s === 'bridge' && nx >= 96.0 && !doneRef.current) {
        doneRef.current = true;
        stopAnalog();
        setIsWalking(false);
        recordLevel2Mission(supabase, 'pring');
        router.push('/level2/kembang');
      }
    },
    [goStage, router, stopAnalog, supabase]
  );

  const placeBamboo = (i) => {
    if (stageRef.current !== 'arrange' || placed[i]) return;
    const next = placed.map((p, j) => p || j === i);
    setPlaced(next);
    if (next.every(Boolean)) {
      goStage('bridge');
      setToast({
        type: 'success',
        text: '🌉 Kreteg pring wis dadi! Mlaku nyebrang nganti mentok seberang tengen!',
      });
    }
  };

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

      if (!doneRef.current) {
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
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Kreteg Pring...</p>
      </div>
    );
  }

  const depthScale =
    stage === 'bridge' && charPos.x >= 43
      ? 0.76
      : Math.max(0.72, Math.min(1.05, 0.72 + ((charPos.y - 44) / 51) * 0.33));

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level2/screen_pring_tanpa_cewe.jpg"
          alt="Jurang Gunung Wilis - Pring"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center ${stage === 'walk' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        <Image
          src="/assets/level2/screen_pring_kosong.jpg"
          alt="Jurang Gunung Wilis - Susun Pring"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center ${stage === 'arrange' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        <Image
          src="/assets/level2/screen_pring_jembatan.jpg"
          alt="Jurang Gunung Wilis - Kreteg Pring"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center ${stage === 'bridge' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Navigasi */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link
            href="/level2/macan"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            ⬅ Alas Macan
          </Link>
          <Link
            href="/peta"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Petunjuk */}
        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 text-amber-300 font-bold text-[10px] sm:text-xs">
          {stage === 'walk' && '🚶 Cedhaki tumpukan pring!'}
          {stage === 'arrange' && `🎋 Susun pring: ${placed.filter(Boolean).length}/3`}
          {stage === 'bridge' && '🌉 Nyebrang kreteg nganti mentok seberang tengen!'}
        </div>

        {/* Walk: Hitbox bantuan klik langsung ing tumpukan pring */}
        {stage === 'walk' && (
          <button
            type="button"
            onClick={() => {
              stopAnalog();
              charPosRef.current = { x: 37, y: 78 };
              setCharPos({ x: 37, y: 78 });
              goStage('arrange');
              setToast({
                type: 'success',
                text: '🎋 Pencet pring siji-siji kanggo nyusun 3 pring dadi kreteg!',
              });
            }}
            title="Cedhaki lan susun pring"
            className="absolute left-[38%] top-[56%] w-[21%] h-[31%] rounded-3xl z-20 cursor-pointer hover:bg-amber-400/15 transition-all"
          >
            <span className="sr-only">Pring</span>
          </button>
        )}

        {/* Arrange: 3 pring kanggo disusun */}
        {stage === 'arrange' &&
          PILE.map((p, i) => {
            const pos = placed[i] ? SLOTS[i] : p;
            return (
              <button
                key={i}
                type="button"
                onClick={() => placeBamboo(i)}
                disabled={placed[i]}
                title={placed[i] ? 'Wis disusun' : 'Pencet kanggo nyusun pring'}
                className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
                  placed[i] ? 'cursor-default' : 'cursor-pointer hover:scale-110 animate-pulse'
                }`}
                style={{
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                  width: '11vw',
                  maxWidth: 130,
                  minWidth: 64,
                  aspectRatio: '669/373',
                }}
              >
                <Image
                  src="/assets/level2/item-pring.png"
                  alt="Pring"
                  fill
                  sizes="130px"
                  className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]"
                />
              </button>
            );
          })}

        {/* Zona tujuan seberang kreteg (mentok tengen) */}
        {stage === 'bridge' && (
          <div className="absolute left-[93%] top-[47%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-300 text-emerald-200 text-[9px] sm:text-[10px] font-bold animate-bounce whitespace-nowrap">
              🎯 Seberang➡
            </div>
            <div className="w-12 h-8 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-400/15 animate-pulse" />
          </div>
        )}

        {/* Sprite karakter 2D Pixel Art aktif wiwit awal */}
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

        {/* Analog Kontroler */}
        <AnalogJoystick
          disabled={stage === 'arrange'}
          onChange={(v) => {
            analogRef.current = v;
          }}
        />
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold ${
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
