'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';

/*
  STAGE FLOW (/level2/pring):
  'intro'   -> screen_pring_komplit.jpg (karakter + dialog + pring + tombol)
  'walk'    -> screen_pring_tanpa_cewe.jpg, sprite mlaku nyedhaki pring
  'arrange' -> screen_pring_kosong.jpg, susun 3 pring ing pinggir jurang
  'bridge'  -> screen_pring_jembatan.jpg, sprite mlaku menyang jembatan
  'done'    -> modal rampung
*/

const START_POS = { x: 24, y: 86 };
const BG = {
  intro: '/assets/level2/screen_pring_komplit.jpg',
  walk: '/assets/level2/screen_pring_tanpa_cewe.jpg',
  arrange: '/assets/level2/screen_pring_kosong.jpg',
  bridge: '/assets/level2/screen_pring_jembatan.jpg',
  done: '/assets/level2/screen_pring_jembatan.jpg',
};
// Pring ing lemah (kanggo dipencet) lan slot tujuan ing pinggir jurang
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

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('intro');
  const stageRef = useRef('intro');
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

  const stopAnalog = useCallback(() => {
    analogRef.current = { x: 0, y: 0, active: false };
  }, []);

  const startWalk = useCallback(() => {
    if (stageRef.current !== 'intro') return;
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    goStage('walk');
    setToast({ type: 'info', text: '🚶 Mlaku nyedhaki pring nganggo Analog utawa tombol Panah!' });
  }, [goStage]);

  const moveCharacter = useCallback(
    (dx, dy) => {
      const s = stageRef.current;
      if (s !== 'walk' && s !== 'bridge') return;

      if (dx < -0.05) setFacingLeft(true);
      else if (dx > 0.05) setFacingLeft(false);
      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

      const prev = charPosRef.current;
      const nx = Math.max(10, Math.min(s === 'bridge' ? 52 : 60, prev.x + dx));
      const ny = Math.max(44, Math.min(95, prev.y + dy));
      charPosRef.current = { x: nx, y: ny };
      setCharPos({ x: nx, y: ny });

      if (s === 'walk' && nx >= 36 && ny >= 60 && ny <= 92) {
        stopAnalog();
        goStage('arrange');
        setToast({ type: 'success', text: '🎋 Pencet pring siji-siji kanggo nyusun 3 pring dadi kreteg!' });
      } else if (s === 'bridge' && nx >= 42 && ny <= 62) {
        stopAnalog();
        setIsWalking(false);
        goStage('done');
      }
    },
    [goStage, stopAnalog]
  );

  const placeBamboo = (i) => {
    if (stageRef.current !== 'arrange' || placed[i]) return;
    const next = placed.map((p, j) => p || j === i);
    setPlaced(next);
    if (next.every(Boolean)) {
      setTimeout(() => {
        goStage('bridge');
        setToast({ type: 'success', text: '🌉 Kreteg pring wis dadi! Mlaku menyang kreteg kanggo nyebrang!' });
      }, 700);
    }
  };

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
      let dx = analogRef.current.active ? analogRef.current.x * 0.65 : 0;
      let dy = analogRef.current.active ? analogRef.current.y * 0.65 : 0;
      keys.forEach((k) => {
        dx += map[k][0] * 0.6;
        dy += map[k][1] * 0.6;
      });
      if (Math.hypot(dx, dy) > 0.04) moveCharacter(dx, dy);
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
    setPlaced([false, false, false]);
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    setFacingLeft(false);
    goStage('intro');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-200">Mbukak Kreteg Pring...</p>
      </div>
    );
  }

  const showSprite = stage === 'walk' || stage === 'arrange' || stage === 'bridge' || stage === 'done';
  const depthScale = Math.max(0.72, Math.min(1.05, 0.72 + ((charPos.y - 44) / 51) * 0.33));

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes roroWalkBob {
          0%,50%,100% { transform: translateY(0) rotate(0deg) scale(1,0.98); }
          25% { transform: translateY(-8px) rotate(2.4deg) scale(0.99,1.03); }
          75% { transform: translateY(-8px) rotate(-2.4deg) scale(0.99,1.03); }
        }
        @keyframes roroIdleBreath { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .anim-walk { animation: roroWalkBob 0.42s ease-in-out infinite; }
        .anim-idle { animation: roroIdleBreath 2.4s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        <Image src={BG[stage]} alt="Jurang Gunung Wilis" fill priority sizes="100vw" className="object-contain object-center" />

        {/* Navigasi */}
        <div className="absolute top-3 left-4 z-40 flex gap-2">
          <Link href="/level2/macan" className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold">
            ⬅ Alas Macan
          </Link>
          <Link href="/peta" className="px-3 py-1.5 rounded-full bg-stone-950/85 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold">
            🗺️ Peta
          </Link>
        </div>

        {/* Petunjuk */}
        <div className="absolute top-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-400/80 text-amber-300 font-bold text-[10px] sm:text-xs">
          {stage === 'intro' && '🎋 Pencet "Gunakake pring"'}
          {stage === 'walk' && '🚶 Cedhaki pring!'}
          {stage === 'arrange' && `🎋 Susun pring: ${placed.filter(Boolean).length}/3`}
          {stage === 'bridge' && '🌉 Mlaku menyang kreteg!'}
          {stage === 'done' && '🎉 Rampung!'}
        </div>

        {/* Intro: tombol Gunakake pring + hitbox tumpukan pring */}
        {stage === 'intro' && (
          <>
            <button type="button" onClick={startWalk} title="Gunakake pring"
              className="absolute left-[59.5%] top-[61.5%] w-[15.5%] h-[7.5%] rounded-full z-30 cursor-pointer hover:bg-amber-400/25 hover:ring-2 hover:ring-yellow-300 active:scale-95 transition-all">
              <span className="sr-only">Gunakake pring</span>
            </button>
            <button type="button" onClick={startWalk} title="Pring"
              className="absolute left-[38%] top-[56%] w-[21%] h-[31%] rounded-3xl z-25 cursor-pointer hover:bg-amber-400/15 transition-all">
              <span className="sr-only">Pring</span>
            </button>
          </>
        )}

        {/* Arrange: 3 pring kanggo disusun */}
        {stage === 'arrange' &&
          PILE.map((p, i) => {
            const pos = placed[i] ? SLOTS[i] : p;
            return (
              <button key={i} type="button" onClick={() => placeBamboo(i)} disabled={placed[i]}
                title={placed[i] ? 'Wis disusun' : 'Pencet kanggo nyusun pring'}
                className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out ${
                  placed[i] ? 'cursor-default' : 'cursor-pointer hover:scale-110 animate-pulse'
                }`}
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, width: '11vw', maxWidth: 130, minWidth: 64, aspectRatio: '669/373' }}>
                <Image src="/assets/level2/item-pring.png" alt="Pring" fill sizes="130px" className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]" />
              </button>
            );
          })}

        {/* Zona tujuan kreteg */}
        {stage === 'bridge' && (
          <div className="absolute left-[46%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
            <div className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-300 text-emerald-200 text-[9px] sm:text-[11px] font-bold animate-bounce whitespace-nowrap">
              🎯 Mlebu Kreteg
            </div>
            <div className="w-20 h-10 rounded-full border-2 border-dashed border-emerald-300/80 bg-emerald-400/15 animate-pulse" />
          </div>
        )}

        {/* Sprite karakter */}
        {showSprite && (
          <div className="absolute z-25 pointer-events-none"
            style={{ left: `${charPos.x}%`, top: `${charPos.y}%`, transform: `translate(-50%, -100%) scale(${depthScale})`, transformOrigin: 'bottom center' }}>
            <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft} />
          </div>
        )}

        {/* Analog Kontroler */}
        {stage !== 'done' && (
          <AnalogJoystick
            disabled={stage === 'arrange'}
            onStart={() => {
              if (stageRef.current === 'intro') startWalk();
            }}
            onChange={(v) => {
              analogRef.current = v;
            }}
          />
        )}

        {/* Modal rampung */}
        {stage === 'done' && (
          <div className="absolute inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 text-center space-y-4">
              <div className="text-5xl">🌉</div>
              <h3 className="text-xl font-serif font-black text-yellow-400">Kreteg Pring Kasil Disusun!</h3>
              <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                Putri Rara Kuning lan Rara Runting kasil nata pring dadi kreteg lan nyebrang jurang kanthi slamet.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer">
                  Baleni 🔄
                </button>
                <Link href="/level2/kembang" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black text-xs sm:text-sm">
                  🌸 Lanjut menyang Kembang Pusaka →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold ${
          toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200' : 'bg-stone-900/95 border-yellow-400 text-yellow-300'
        }`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
